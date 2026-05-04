import { NextResponse } from "next/server";
import { requireScope } from "@/lib/agent-auth";
import { prisma, Prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const check = await requireScope(req, [], "resume:read", "clone_resume");
  if (!check.allowed) return check.response!;

  const { id } = await params;
  const resume = await prisma.resume.findUnique({ where: { id } });
  if (!resume || resume.userId !== check.apiKey!.userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const dup = await prisma.resume.create({
    data: {
      userId: check.apiKey!.userId,
      title: `${resume.title} (Clone)`,
      contentJson: resume.contentJson as unknown as Prisma.InputJsonValue,
      templateId: resume.templateId,
    },
  });

  await writeAuditLog({
    userId: check.apiKey!.userId,
    apiKeyId: check.apiKey!.id,
    action: "clone_resume",
    resource: `resume/${id}/clone/${dup.id}`,
  });

  return NextResponse.json({ resume: dup }, { status: 201 });
}
