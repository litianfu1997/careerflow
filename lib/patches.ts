import { prisma, Prisma } from "./prisma";
import { resumeContentSchema, type ResumeContent } from "./resume-schema";

interface PatchOperation {
  op: "replace" | "add" | "remove";
  path: string; // JSON Pointer
  value?: unknown;
}

const unsafePathSegments = new Set(["__proto__", "constructor", "prototype"]);

function decodePointerSegment(segment: string): string {
  return segment.replace(/~1/g, "/").replace(/~0/g, "~");
}

function parsePointerPath(path: string): string[] {
  if (path === "") return [];
  if (!path.startsWith("/")) {
    throw new Error(`Invalid JSON Pointer path: ${path}`);
  }

  return path
    .slice(1)
    .split("/")
    .map(decodePointerSegment)
    .map((segment) => {
      if (unsafePathSegments.has(segment)) {
        throw new Error(`Unsafe JSON Pointer segment: ${segment}`);
      }
      return segment;
    });
}

function assertPatchOperations(operations: PatchOperation[]): void {
  if (!Array.isArray(operations)) {
    throw new Error("Patch JSON must be an array of operations");
  }

  for (const operation of operations) {
    if (!operation || typeof operation !== "object") {
      throw new Error("Patch operation must be an object");
    }
    if (!["replace", "add", "remove"].includes(operation.op)) {
      throw new Error(`Unsupported patch operation: ${String(operation.op)}`);
    }
    if (typeof operation.path !== "string") {
      throw new Error("Patch operation path must be a string");
    }
    if ((operation.op === "replace" || operation.op === "add") && !("value" in operation)) {
      throw new Error(`Patch operation ${operation.op} requires a value`);
    }
  }
}

function parseArrayIndex(segment: string, allowEnd: boolean): number {
  if (allowEnd && segment === "-") return -1;
  if (!/^(0|[1-9]\d*)$/.test(segment)) {
    throw new Error(`Invalid array index: ${segment}`);
  }

  const index = Number(segment);
  if (!Number.isSafeInteger(index)) {
    throw new Error(`Invalid array index: ${segment}`);
  }
  return index;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasOwn(container: object, key: string | number): boolean {
  return Object.prototype.hasOwnProperty.call(container, key);
}

function getChild(container: unknown, segment: string): unknown {
  if (Array.isArray(container)) {
    const index = parseArrayIndex(segment, false);
    if (index >= container.length || !hasOwn(container, index)) {
      throw new Error(`Patch path does not exist: ${segment}`);
    }
    return container[index];
  }

  if (isRecord(container)) {
    if (!hasOwn(container, segment)) {
      throw new Error(`Patch path does not exist: ${segment}`);
    }
    return container[segment];
  }

  throw new Error(`Patch path cannot traverse non-object value: ${segment}`);
}

export function applyPatch(content: ResumeContent, operations: PatchOperation[]): ResumeContent {
  assertPatchOperations(operations);
  let result: unknown = structuredClone(content);

  for (const op of operations) {
    const parts = parsePointerPath(op.path);
    if (parts.length === 0) {
      if (op.op === "remove") {
        result = undefined;
      } else {
        result = op.value;
      }
      continue;
    }

    let target = result;
    for (let i = 0; i < parts.length - 1; i++) {
      target = getChild(target, parts[i]);
    }

    const lastKey = parts[parts.length - 1];

    switch (op.op) {
      case "replace": {
        if (Array.isArray(target)) {
          const index = parseArrayIndex(lastKey, false);
          if (index >= target.length || !hasOwn(target, index)) {
            throw new Error(`Patch path does not exist: ${op.path}`);
          }
          target[index] = op.value;
        } else if (isRecord(target)) {
          if (!hasOwn(target, lastKey)) {
            throw new Error(`Patch path does not exist: ${op.path}`);
          }
          target[lastKey] = op.value;
        } else {
          throw new Error(`Patch path cannot target non-object value: ${op.path}`);
        }
        break;
      }
      case "add": {
        if (Array.isArray(target)) {
          if (lastKey === "-") {
            target.push(op.value);
          } else {
            const index = parseArrayIndex(lastKey, false);
            if (index > target.length) {
              throw new Error(`Array index is out of bounds: ${op.path}`);
            }
            target.splice(index, 0, op.value);
          }
        } else if (isRecord(target)) {
          target[lastKey] = op.value;
        } else {
          throw new Error(`Patch path cannot target non-object value: ${op.path}`);
        }
        break;
      }
      case "remove": {
        if (Array.isArray(target)) {
          const index = parseArrayIndex(lastKey, false);
          if (index >= target.length || !hasOwn(target, index)) {
            throw new Error(`Patch path does not exist: ${op.path}`);
          }
          target.splice(index, 1);
        } else if (isRecord(target)) {
          if (!hasOwn(target, lastKey)) {
            throw new Error(`Patch path does not exist: ${op.path}`);
          }
          delete target[lastKey];
        } else {
          throw new Error(`Patch path cannot target non-object value: ${op.path}`);
        }
        break;
      }
    }
  }

  return result as ResumeContent;
}

export async function applyPatchWithVersion(params: {
  resumeId: string;
  userId: string;
  patchId: string;
  apiKeyId?: string;
}): Promise<{ success: boolean; error?: string }> {
  const { resumeId, userId, patchId, apiKeyId } = params;

  const resume = await prisma.resume.findUnique({ where: { id: resumeId } });
  if (!resume || resume.userId !== userId) {
    return { success: false, error: "Resume not found" };
  }

  const patch = await prisma.resumePatch.findUnique({ where: { id: patchId } });
  if (!patch || patch.resumeId !== resumeId) {
    return { success: false, error: "Patch not found" };
  }
  if (patch.status !== "pending_review") {
    return { success: false, error: "Patch is not pending" };
  }

  const currentJson = typeof resume.contentJson === "string"
    ? JSON.parse(resume.contentJson)
    : resume.contentJson;
  const currentContentResult = resumeContentSchema.safeParse(currentJson);
  if (!currentContentResult.success) {
    return { success: false, error: "Current resume content is invalid" };
  }

  const operations = (typeof patch.patchJson === "string"
    ? JSON.parse(patch.patchJson)
    : patch.patchJson) as PatchOperation[];

  let newContent: ResumeContent;
  try {
    newContent = applyPatch(currentContentResult.data, operations);
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Invalid patch" };
  }

  const validation = resumeContentSchema.safeParse(newContent);
  if (!validation.success) {
    const issue = validation.error.issues[0];
    const path = issue.path.length ? issue.path.join(".") : "content";
    return { success: false, error: `Patched resume content is invalid at ${path}: ${issue.message}` };
  }

  await prisma.$transaction(async (tx) => {
    await tx.resumeVersion.create({
      data: {
        resumeId,
        userId,
        contentJson: currentContentResult.data as unknown as Prisma.InputJsonValue,
        versionNote: `Before patch: ${patch.title}`,
      },
    });

    await tx.resume.update({
      where: { id: resumeId },
      data: { contentJson: validation.data as unknown as Prisma.InputJsonValue },
    });

    await tx.resumePatch.update({
      where: { id: patchId },
      data: { status: "applied", appliedAt: new Date(), reviewedAt: new Date() },
    });

    await tx.agentAuditLog.create({
      data: {
        userId,
        apiKeyId: apiKeyId || null,
        action: "apply_patch",
        resource: `resume/${resumeId}/patch/${patchId}`,
        detail: { patchTitle: patch.title },
      },
    });
  });

  return { success: true };
}
