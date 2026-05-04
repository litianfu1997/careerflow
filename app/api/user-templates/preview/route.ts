import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { renderCustomTemplate } from "@/lib/resume-renderer";
import { sampleResumeContent } from "@/lib/sample-data";
import type { ResumeContent } from "@/lib/resume-schema";

export async function POST(req: Request) {
  const auth = await getAuthUser();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { templateHtml, templateCss, content } = body;

  if (!templateHtml) {
    return NextResponse.json({ error: "templateHtml is required" }, { status: 400 });
  }

  const resumeContent: ResumeContent = content || sampleResumeContent;
  const html = renderCustomTemplate(resumeContent, templateHtml, templateCss || null);

  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
