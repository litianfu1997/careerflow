import { NextResponse } from "next/server";
import { requireScope } from "@/lib/agent-auth";
import { prisma } from "@/lib/prisma";
import { resumeToMarkdown } from "@/lib/markdown";
import type { ResumeContent } from "@/lib/resume-schema";
import { writeAuditLog } from "@/lib/audit";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const check = await requireScope(req, [], "resume:export", "export_markdown");
  if (!check.allowed) return check.response!;

  const { id } = await params;
  const resume = await prisma.resume.findUnique({ where: { id } });
  if (!resume || resume.userId !== check.apiKey!.userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const content: ResumeContent = typeof resume.contentJson === "string"
    ? JSON.parse(resume.contentJson)
    : resume.contentJson;
  const md = resumeToMarkdown(content);

  await writeAuditLog({
    userId: check.apiKey!.userId,
    apiKeyId: check.apiKey!.id,
    action: "export_markdown",
    resource: `resume/${id}`,
  });

  return new NextResponse(md, {
    status: 200,
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
    },
  });
}
