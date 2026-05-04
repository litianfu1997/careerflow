import { NextResponse } from "next/server";
import { requireScope } from "@/lib/agent-auth";
import { prisma } from "@/lib/prisma";
import { generatePDF } from "@/lib/pdf";
import type { ResumeContent } from "@/lib/resume-schema";
import { writeAuditLog } from "@/lib/audit";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const check = await requireScope(req, [], "resume:export", "export_pdf");
  if (!check.allowed) return check.response!;

  const { id } = await params;
  const resume = await prisma.resume.findUnique({
    where: { id },
    include: { template: { select: { name: true } } },
  });
  if (!resume || resume.userId !== check.apiKey!.userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const content: ResumeContent = typeof resume.contentJson === "string"
    ? JSON.parse(resume.contentJson)
    : resume.contentJson;

  try {
    const pdf = await generatePDF(content, resume.template?.name || "clean-cn");

    await writeAuditLog({
      userId: check.apiKey!.userId,
      apiKeyId: check.apiKey!.id,
      action: "export_pdf",
      resource: `resume/${id}`,
    });

    return new Response(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${resume.title}.pdf"`,
      },
    });
  } catch (err) {
    console.error("PDF generation failed:", err);
    return NextResponse.json({ error: "PDF generation failed" }, { status: 500 });
  }
}
