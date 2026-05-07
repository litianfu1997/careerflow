"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import dynamic from "next/dynamic";
const CodeEditor = dynamic(
  () => import("@/components/code-editor").then((mod) => mod.CodeEditor),
  { ssr: false, loading: () => <div className="h-[200px] animate-pulse rounded bg-[var(--muted)]" /> },
);
import { DraggablePreviewScroll } from "@/components/draggable-preview-scroll";
import { Loader2 } from "lucide-react";
import { LoadingPage } from "@/components/loading-page";

const VARIABLE_LIST = [
  "header", "summary", "education", "workExperience", "projects",
  "skills", "certificates", "openSource", "customSections", "fullName", "email", "phone",
];

export default function EditTemplatePage() {
  const params = useParams();
  const router = useRouter();
  const t = useTranslations("templates");
  const id = params.id as string;

  const [displayName, setDisplayName] = useState("");
  const [description, setDescription] = useState("");
  const [templateHtml, setTemplateHtml] = useState("");
  const [templateCss, setTemplateCss] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [previewHtml, setPreviewHtml] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    fetch(`/api/user-templates/${id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.template) {
          setDisplayName(d.template.displayName);
          setDescription(d.template.description || "");
          setTemplateHtml(d.template.templateHtml || "");
          setTemplateCss(d.template.templateCss || "");
        } else {
          setError(t("editor.loadError"));
        }
      })
      .catch(() => setError(t("editor.loadError")))
      .finally(() => setLoading(false));
  }, [id, t]);

  const updatePreview = useCallback((html: string, css: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetch("/api/user-templates/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateHtml: html, templateCss: css }),
      })
        .then((r) => {
          if (!r.ok) throw new Error("Preview failed");
          return r.text();
        })
        .then(setPreviewHtml)
        .catch(() => {
          setPreviewHtml("<div style='display:flex;align-items:center;justify-content:center;height:100%;color:#999;font-size:14px;'>预览加载失败，请检查登录状态</div>");
        });
    }, 800);
  }, []);

  useEffect(() => {
    if (templateHtml) updatePreview(templateHtml, templateCss);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [templateHtml, templateCss, updatePreview]);

  async function handleSave() {
    setError("");
    setSaving(true);
    try {
      const res = await fetch(`/api/user-templates/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName, description, templateHtml, templateCss }),
      });
      if (res.ok) {
        router.push("/templates");
      } else {
        const data = await res.json();
        setError(data.error || t("editor.saveError"));
      }
    } catch {
      setError(t("editor.saveError"));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <LoadingPage text={t("loading")} />;
  }

  return (
    <div className="relative left-1/2 -my-6 flex h-[calc(100vh-3.5rem)] w-[calc(100vw-2rem)] max-w-[1680px] -translate-x-1/2 overflow-hidden border-x border-[var(--border)] bg-[var(--background)]">
      {/* Left: Editor */}
      <div className="w-[32rem] shrink-0 overflow-y-auto border-r border-[var(--border)] p-5 space-y-5 2xl:w-[35rem]">
        <h1 className="text-2xl font-bold tracking-tight">{t("editor.title")}</h1>

        {error && (
          <div className="rounded-[var(--radius)] bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div>
          <label className="mb-1.5 block text-sm font-medium">{t("editor.displayName")}</label>
          <Input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder={t("editor.displayNamePlaceholder")}
            maxLength={100}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium">{t("editor.description")}</label>
          <Input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={200}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium">{t("editor.htmlCode")}</label>
          <CodeEditor
            value={templateHtml}
            onChange={setTemplateHtml}
            language="html"
            placeholder={t.raw("editor.htmlPlaceholder")}
            minHeight="280px"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium">{t("editor.cssCode")}</label>
          <CodeEditor
            value={templateCss}
            onChange={setTemplateCss}
            language="css"
            placeholder={t("editor.cssPlaceholder")}
            minHeight="160px"
          />
        </div>

        {/* Variable Reference */}
        <div className="rounded-[var(--radius)] border border-[var(--border)] p-4">
          <h3 className="mb-2 text-sm font-semibold">{t("editor.variableReference")}</h3>
          <p className="mb-3 text-xs text-[var(--muted-foreground)]">{t.raw("editor.variableHint")}</p>
          <div className="space-y-1">
            {VARIABLE_LIST.map((v) => (
              <div key={v} className="flex items-center gap-2 text-xs">
                <code className="rounded bg-[var(--muted)] px-1.5 py-0.5 font-mono">{`{{${v}}}`}</code>
                <span className="text-[var(--muted-foreground)]">{t(`variables.${v}`)}</span>
              </div>
            ))}
          </div>
        </div>

        <Button className="w-full" onClick={handleSave} disabled={saving || !displayName || !templateHtml}>
          {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t("editor.saving")}</> : t("editor.save")}
        </Button>
      </div>

      {/* Right: Preview */}
      <div className="flex flex-1 flex-col overflow-hidden bg-[var(--muted)]/40">
        <div className="border-b border-[var(--border)] bg-[var(--background)] px-4 py-2">
          <span className="text-sm font-medium text-[var(--muted-foreground)]">{t("editor.livePreview")}</span>
        </div>
        <DraggablePreviewScroll
          className="flex-1"
          contentClassName="flex w-max min-w-full justify-center p-4"
        >
          <iframe
            srcDoc={previewHtml}
            className="bg-white shadow-lg rounded-md"
            style={{ width: "794px", minHeight: "1123px", border: "none", pointerEvents: "none" }}
            title="Template Preview"
            sandbox="allow-same-origin"
          />
        </DraggablePreviewScroll>
      </div>
    </div>
  );
}
