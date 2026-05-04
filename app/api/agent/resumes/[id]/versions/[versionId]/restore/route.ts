import { NextResponse } from "next/server";
import { requireScope } from "@/lib/agent-auth";
import { prisma, Prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string; versionId: string }> }
) {
  const check = await requireScope(req, [], "resume:apply_patch", "restore_version");
  if (!check.allowed) return check.response!;

  const { id, versionId } = await params;
  const resume = await prisma.resume.findUnique({ where: { id } });
  if (!resume || resume.userId !== check.apiKey!.userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const version = await prisma.resumeVersion.findUnique({ where: { id: versionId } });
  if (!version || version.resumeId !== id) {
    return NextResponse.json({ error: "Version not found" }, { status: 404 });
  }

  // Save current as version before restoring
  await prisma.resumeVersion.create({
    data: {
      resumeId: id,
      userId: check.apiKey!.userId,
      contentJson: resume.contentJson as Prisma.InputJsonValue,
      versionNote: "Auto-save before restore",
    },
  });

  await prisma.resume.update({
    where: { id },
    data: { contentJson: version.contentJson as Prisma.InputJsonValue },
  });

  await writeAuditLog({
    userId: check.apiKey!.userId,
    apiKeyId: check.apiKey!.id,
    action: "restore_version",
    resource: `resume/${id}/version/${versionId}`,
  });

  return NextResponse.json({ message: "Version restored" });
}
