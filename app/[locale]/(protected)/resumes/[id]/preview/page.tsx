import { getTranslations } from "next-intl/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { renderResumeToHTML } from "@/lib/resume-renderer";
import { PreviewClient } from "./preview-client";
import type { ResumeContent } from "@/lib/resume-schema";

export default async function PreviewPage({
  params,
}: Readonly<{
  params: Promise<{ id: string }>;
}>) {
  const { id } = await params;
  const auth = await getAuthUser();
  const t = await getTranslations("preview");

  if (!auth) return null;

  const resume = await prisma.resume.findUnique({
    where: { id },
    include: { template: { select: { name: true } } },
  });

  if (!resume || resume.userId !== auth.userId) return null;

  const content: ResumeContent = typeof resume.contentJson === "string"
    ? JSON.parse(resume.contentJson)
    : resume.contentJson;
  const templateName = resume.template?.name || "clean-cn";

  const html = await renderResumeToHTML({ content, templateName });

  return (
    <PreviewClient
      html={html}
      title={resume.title}
      templateName={templateName}
      resumeId={id}
      translations={{
        backToEditor: t("backToEditor"),
        exportPdf: t("exportPdf"),
        exportMarkdown: t("exportMarkdown"),
        exportJson: t("exportJson"),
        exporting: t("exporting"),
        loadingPreview: t("loadingPreview"),
      }}
    />
  );
}
