import { renderResumeToHTML } from "@/lib/resume-renderer";
import type { ResumeContent } from "@/lib/resume-schema";

export async function POST(req: Request) {
  const { content, templateName } = await req.json();
  const html = await renderResumeToHTML({ content: content as ResumeContent, templateName });
  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
