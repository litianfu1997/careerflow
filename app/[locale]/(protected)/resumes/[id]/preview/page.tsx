"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { LoadingPage } from "@/components/loading-page";
import { Button } from "@/components/ui/button";
import { DraggablePreviewScroll } from "@/components/draggable-preview-scroll";
import { FileDown, FileText, FileCode, ArrowLeft } from "lucide-react";
import { Link } from "@/i18n/navigation";
import type { ResumeContent } from "@/lib/resume-schema";

const A4_WIDTH = 794; // 210mm at 96dpi
const A4_HEIGHT = 1123; // 297mm at 96dpi
const PAGE_GAP = 24;

export default function PreviewPage() {
  const params = useParams();
  const t = useTranslations("preview");
  const id = params.id as string;
  const [html, setHtml] = useState("");
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [templateName, setTemplateName] = useState("clean-cn");
  const [pages, setPages] = useState<string[]>([]);
  const hiddenRef = useRef<HTMLIFrameElement>(null);
  const rendersCompletePage = templateName === "sidebar" || templateName === "compact";

  useEffect(() => {
    fetch(`/api/resumes/${id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.resume) {
          setTitle(d.resume.title);
          const content: ResumeContent = typeof d.resume.contentJson === "string"
            ? JSON.parse(d.resume.contentJson)
            : d.resume.contentJson;
          const selectedTemplateName = d.resume.template?.name || "clean-cn";
          setTemplateName(selectedTemplateName);
          return fetch("/api/render-preview", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content, templateName: selectedTemplateName }),
          });
        }
      })
      .then((r) => r?.text())
      .then((h) => h && setHtml(h))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  // After hidden iframe loads, paginate the content into A4 pages
  const handleMeasure = useCallback(() => {
    if (rendersCompletePage) {
      setPages(html ? [html] : []);
      return;
    }

    const iframe = hiddenRef.current;
    if (!iframe) return;
    const doc = iframe.contentDocument;
    if (!doc?.body || !doc.body.children.length) return;

    const body = doc.body;
    const sections = Array.from(body.children) as HTMLElement[];
    const pageDivs: string[] = [];

    let currentSections: string[] = [];
    let currentHeight = 0;
    // body has 40px top + 40px bottom padding
    const bodyPadding = 80;
    const usableHeight = A4_HEIGHT - bodyPadding;

    for (const section of sections) {
      const h = (section as HTMLElement).offsetHeight;

      // If this section alone exceeds one page, put it on its own page
      if (h > usableHeight) {
        // Flush current page first
        if (currentSections.length > 0) {
          pageDivs.push(currentSections.join(""));
          currentSections = [];
          currentHeight = 0;
        }
        // Large section gets its own page (with overflow hidden by CSS)
        pageDivs.push(section.outerHTML);
        continue;
      }

      // If adding this section would overflow, start new page
      if (currentHeight + h > usableHeight && currentSections.length > 0) {
        pageDivs.push(currentSections.join(""));
        currentSections = [];
        currentHeight = 0;
      }

      currentSections.push(section.outerHTML);
      currentHeight += h;
    }

    // Flush remaining
    if (currentSections.length > 0) {
      pageDivs.push(currentSections.join(""));
    }

    setPages(pageDivs.length > 0 ? pageDivs : [body.innerHTML]);
  }, [html, rendersCompletePage]);

  async function handleExport(format: "pdf" | "markdown" | "json") {
    setExporting(format);
    try {
      const method = format === "pdf" ? "POST" : "GET";
      const res = await fetch(`/api/resumes/${id}/export/${format}`, { method });

      if (!res.ok) throw new Error("Export failed");

      const blob = await res.blob();
      const ext = format === "pdf" ? "pdf" : format === "markdown" ? "md" : "json";
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${title || "resume"}.${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export failed:", err);
    } finally {
      setExporting(null);
    }
  }

  if (loading) return <LoadingPage text={t("loadingPreview")} />;

  return (
    <div className="relative left-1/2 -my-6 flex h-[calc(100vh-3.5rem)] w-[calc(100vw-2rem)] max-w-[1680px] -translate-x-1/2 flex-col overflow-hidden border-x border-[var(--border)] bg-[var(--muted)]">
      {/* Export Toolbar */}
      <div className="z-10 flex shrink-0 items-center justify-between border-b border-[var(--border)] bg-[var(--background)]/90 px-6 py-3 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/resumes/${id}/edit`}>
              <ArrowLeft className="mr-1 h-4 w-4" />
              {t("backToEditor")}
            </Link>
          </Button>
          <h2 className="text-sm font-semibold text-[var(--foreground)]">{title}</h2>
          {pages.length > 0 && (
            <span className="text-xs text-[var(--muted-foreground)]">
              {pages.length} {pages.length === 1 ? "page" : "pages"}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport("pdf")}
            disabled={exporting !== null}
          >
            <FileDown className="mr-1.5 h-4 w-4" />
            {exporting === "pdf" ? t("exporting") : t("exportPdf")}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport("markdown")}
            disabled={exporting !== null}
          >
            <FileText className="mr-1.5 h-4 w-4" />
            {exporting === "markdown" ? t("exporting") : t("exportMarkdown")}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport("json")}
            disabled={exporting !== null}
          >
            <FileCode className="mr-1.5 h-4 w-4" />
            {exporting === "json" ? t("exporting") : t("exportJson")}
          </Button>
        </div>
      </div>

      {/* Hidden measurement iframe */}
      <iframe
        ref={hiddenRef}
        srcDoc={html}
        onLoad={handleMeasure}
        style={{ position: "absolute", width: `${A4_WIDTH}px`, height: "0", visibility: "hidden", border: "none" }}
        title="measure"
        sandbox="allow-same-origin"
      />

      {/* Paginated A4 pages */}
      <DraggablePreviewScroll
        className="min-h-0 flex-1"
        contentClassName="flex w-max min-w-full flex-col items-center px-4 py-8"
        contentStyle={{ gap: `${PAGE_GAP}px` }}
      >
        {pages.map((pageHtml, idx) => (
          <div
            key={idx}
            className="bg-white shadow-2xl ring-1 ring-black/5 overflow-hidden"
            style={{ width: `${A4_WIDTH}px`, height: `${A4_HEIGHT}px`, borderRadius: "2px" }}
          >
            <iframe
              srcDoc={rendersCompletePage ? pageHtml : wrapPageHtml(pageHtml)}
              style={{ width: "100%", height: "100%", border: "none", pointerEvents: "none" }}
              title={`Page ${idx + 1}`}
              sandbox="allow-same-origin"
            />
          </div>
        ))}
        {pages.length === 0 && html && (
          <div
            className="bg-white shadow-2xl ring-1 ring-black/5 overflow-hidden"
            style={{ width: `${A4_WIDTH}px`, height: `${A4_HEIGHT}px`, borderRadius: "2px" }}
          >
            <iframe
              srcDoc={html}
              style={{ width: "100%", height: "100%", border: "none", pointerEvents: "none" }}
              title="Resume Preview"
              sandbox="allow-same-origin"
            />
          </div>
        )}
      </DraggablePreviewScroll>
    </div>
  );
}

/** Wrap page body content in minimal HTML with A4 sizing (for screen display only) */
function wrapPageHtml(body: string): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
  *{box-sizing:border-box;}
  html,body{width:210mm;height:297mm;padding:0;margin:0 auto;overflow:hidden;background:white;}
  body{padding:40px 48px;font-family:system-ui,-apple-system,sans-serif;color:#333;line-height:1.5;}
  h1,h2,h3{page-break-after:avoid;}
</style></head><body>${body}</body></html>`;
}
