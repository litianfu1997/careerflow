import { NextResponse } from "next/server";
import { requireScope } from "@/lib/agent-auth";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const check = await requireScope(req, [], "resume:read", "list_patches");
  if (!check.allowed) return check.response!;

  const { id } = await params;
  const resume = await prisma.resume.findUnique({ where: { id } });
  if (!resume || resume.userId !== check.apiKey!.userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const patches = await prisma.resumePatch.findMany({
    where: { resumeId: id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ patches });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const check = await requireScope(req, [], "resume:write_patch", "create_patch");
  if (!check.allowed) return check.response!;

  const { id } = await params;
  const resume = await prisma.resume.findUnique({ where: { id } });
  if (!resume || resume.userId !== check.apiKey!.userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await req.json();
  const { title, description, patchJson } = body;

  if (!title || !patchJson) {
    return NextResponse.json({ error: "title and patchJson are required" }, { status: 400 });
  }

  const patch = await prisma.resumePatch.create({
    data: {
      resumeId: id,
      userId: check.apiKey!.userId,
      apiKeyId: check.apiKey!.id,
      title,
      description: description || null,
      patchJson,
    },
  });

  await writeAuditLog({
    userId: check.apiKey!.userId,
    apiKeyId: check.apiKey!.id,
    action: "create_patch",
    resource: `resume/${id}/patch/${patch.id}`,
    detail: { title },
  });

  return NextResponse.json({ patch }, { status: 201 });
}
