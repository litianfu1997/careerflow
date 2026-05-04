"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import type { ResumeContent } from "@/lib/resume-schema";

export default function PreviewPage() {
  const params = useParams();
  const t = useTranslations("preview");
  const id = params.id as string;
  const [html, setHtml] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/resumes/${id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.resume) {
          const content: ResumeContent = typeof d.resume.contentJson === "string"
            ? JSON.parse(d.resume.contentJson)
            : d.resume.contentJson;
          return fetch("/api/render-preview", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content, templateName: d.resume.template?.name || "clean-cn" }),
          });
        }
      })
      .then((r) => r?.text())
      .then((h) => h && setHtml(h))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="p-8 text-center text-[var(--muted-foreground)]">{t("loadingPreview")}</div>;

  return (
    <div className="flex justify-center bg-[var(--muted)] min-h-screen py-8">
      <iframe
        srcDoc={html}
        className="bg-white shadow-lg"
        style={{ width: "794px", height: "1123px", border: "none" }}
        title="Resume Preview"
        sandbox="allow-same-origin"
      />
    </div>
  );
}
