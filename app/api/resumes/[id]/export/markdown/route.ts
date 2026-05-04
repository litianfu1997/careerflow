import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { resumeToMarkdown } from "@/lib/markdown";
import type { ResumeContent } from "@/lib/resume-schema";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getAuthUser();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const resume = await prisma.resume.findUnique({ where: { id } });
  if (!resume || resume.userId !== auth.userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const content: ResumeContent = typeof resume.contentJson === "string"
    ? JSON.parse(resume.contentJson)
    : resume.contentJson;

  const md = resumeToMarkdown(content);

  await prisma.resumeExport.create({
    data: { resumeId: id, userId: auth.userId, format: "markdown" },
  });

  const safeFilename = Buffer.from(resume.title, "utf-8").toString("ascii").replace(/[^\x20-\x7e]/g, "_").substring(0, 100);

  return new NextResponse(md, {
    status: 200,
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": `attachment; filename="${safeFilename}.md"`,
    },
  });
}
