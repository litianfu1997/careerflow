import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generatePDF } from "@/lib/pdf";
import type { ResumeContent } from "@/lib/resume-schema";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getAuthUser();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const resume = await prisma.resume.findUnique({
    where: { id },
    include: { template: { select: { name: true } } },
  });
  if (!resume || resume.userId !== auth.userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const content: ResumeContent = typeof resume.contentJson === "string"
    ? JSON.parse(resume.contentJson)
    : resume.contentJson;

  const templateName = resume.template?.name || "clean-cn";

  try {
    const pdf = await generatePDF(content, templateName);

    await prisma.resumeExport.create({
      data: { resumeId: id, userId: auth.userId, format: "pdf" },
    });

    const safeFilename = Buffer.from(resume.title, "utf-8").toString("ascii").replace(/[^\x20-\x7e]/g, "_").substring(0, 100);

    return new NextResponse(new Uint8Array(pdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${safeFilename}.pdf"`,
      },
    });
  } catch (err) {
    console.error("PDF generation failed:", err);
    return NextResponse.json({ error: "PDF generation failed" }, { status: 500 });
  }
}
