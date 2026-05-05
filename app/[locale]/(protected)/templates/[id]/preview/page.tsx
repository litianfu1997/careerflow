"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { DraggablePreviewScroll } from "@/components/draggable-preview-scroll";

export default function TemplatePreviewPage() {
  const params = useParams();
  const id = params.id as string;
  const [html, setHtml] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/templates/${id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.template?.templateHtml) {
          return fetch("/api/user-templates/preview", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              templateHtml: d.template.templateHtml,
              templateCss: d.template.templateCss,
            }),
          });
        } else if (d.template?.name) {
          return fetch("/api/render-preview", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ templateName: d.template.name }),
          });
        }
      })
      .then((r) => r?.text())
      .then((h) => h && setHtml(h))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="mr-2 h-6 w-6 animate-spin text-[var(--muted-foreground)]" />
      </div>
    );
  }

  return (
    <DraggablePreviewScroll
      className="relative left-1/2 -my-6 h-[calc(100vh-3.5rem)] w-[calc(100vw-2rem)] max-w-[1680px] -translate-x-1/2 border-x border-[var(--border)] bg-[var(--muted)]"
      contentClassName="flex w-max min-w-full justify-center px-4 py-8"
    >
      <iframe
        srcDoc={html}
        className="bg-white shadow-lg"
        style={{ width: "794px", height: "1123px", border: "none", pointerEvents: "none" }}
        title="Template Preview"
        sandbox="allow-same-origin"
      />
    </DraggablePreviewScroll>
  );
}
