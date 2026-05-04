import { NextResponse } from "next/server";
import { requireScope } from "@/lib/agent-auth";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string; patchId: string }> }
) {
  const check = await requireScope(req, [], "resume:write_patch", "reject_patch");
  if (!check.allowed) return check.response!;

  const { id, patchId } = await params;
  const resume = await prisma.resume.findUnique({ where: { id } });
  if (!resume || resume.userId !== check.apiKey!.userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const patch = await prisma.resumePatch.findUnique({ where: { id: patchId } });
  if (!patch || patch.resumeId !== id) {
    return NextResponse.json({ error: "Patch not found" }, { status: 404 });
  }

  await prisma.resumePatch.update({
    where: { id: patchId },
    data: { status: "rejected", reviewedAt: new Date() },
  });

  await writeAuditLog({
    userId: check.apiKey!.userId,
    apiKeyId: check.apiKey!.id,
    action: "reject_patch",
    resource: `resume/${id}/patch/${patchId}`,
  });

  return NextResponse.json({ message: "Patch rejected" });
}
