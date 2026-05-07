"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";
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

const VARIABLE_LIST = [
  "header", "summary", "education", "workExperience", "projects",
  "skills", "certificates", "openSource", "customSections", "fullName", "email", "phone",
];

type BaseTemplate = {
  id: string;
  displayName: string;
  isBuiltin: boolean;
};

function autoGenerateName(display: string) {
  return display
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export default function NewTemplatePage() {
  const t = useTranslations("templates");
  const router = useRouter();
  const searchParams = useSearchParams();
  const [name, setName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [description, setDescription] = useState("");
  const [templateHtml, setTemplateHtml] = useState("");
  const [templateCss, setTemplateCss] = useState("");
  const [baseTemplates, setBaseTemplates] = useState<BaseTemplate[]>([]);
  const [selectedBaseId, setSelectedBaseId] = useState("");
  const [loadingBase, setLoadingBase] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [previewHtml, setPreviewHtml] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const initialBaseAppliedRef = useRef(false);

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

  const applyBaseTemplate = useCallback(async (id: string) => {
    if (!id) {
      setSelectedBaseId("");
      return;
    }

    setLoadingBase(true);
    setSelectedBaseId(id);
    try {
      const res = await fetch(`/api/templates/${id}`);
      if (!res.ok) throw new Error("Failed to load template");
      const data = await res.json();
      const template = data.template;
      if (!template?.starterHtml) throw new Error("Template has no editable source");

      setTemplateHtml(template.starterHtml);
      setTemplateCss(template.starterCss || "");
      if (!displayName) {
        const nextDisplayName = `${template.displayName} Custom`;
        setDisplayName(nextDisplayName);
        setName(autoGenerateName(nextDisplayName));
      }
      if (!description && template.description) {
        setDescription(template.description);
      }
    } catch {
      setError(t("editor.loadBaseError"));
    } finally {
      setLoadingBase(false);
    }
  }, [description, displayName, t]);

  useEffect(() => {
    fetch("/api/templates")
      .then((r) => r.json())
      .then((d) => setBaseTemplates((d.templates || []).filter((template: BaseTemplate) => template.isBuiltin)))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const baseId = searchParams.get("base");
    if (!baseId || initialBaseAppliedRef.current) return;
    initialBaseAppliedRef.current = true;
    void applyBaseTemplate(baseId);
  }, [applyBaseTemplate, searchParams]);

  async function handleCreate() {
    setError("");
    setCreating(true);
    try {
      const res = await fetch("/api/user-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, displayName, description, templateHtml, templateCss }),
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
      setCreating(false);
    }
  }

  return (
    <div className="relative left-1/2 -my-6 flex h-[calc(100vh-3.5rem)] w-[calc(100vw-2rem)] max-w-[1680px] -translate-x-1/2 overflow-hidden border-x border-[var(--border)] bg-[var(--background)]">
      {/* Left: Editor */}
      <div className="w-[32rem] shrink-0 overflow-y-auto border-r border-[var(--border)] p-5 space-y-5 2xl:w-[35rem]">
        <h1 className="text-2xl font-bold tracking-tight">{t("editor.create")}</h1>

        {error && (
          <div className="rounded-[var(--radius)] bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div>
          <label className="mb-1.5 block text-sm font-medium">{t("editor.startFromBuiltin")}</label>
          <select
            value={selectedBaseId}
            onChange={(e) => void applyBaseTemplate(e.target.value)}
            disabled={loadingBase}
            className="flex h-10 w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="">{t("editor.blankTemplate")}</option>
            {baseTemplates.map((template) => (
              <option key={template.id} value={template.id}>
                {template.displayName}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium">{t("editor.displayName")}</label>
          <Input
            value={displayName}
            onChange={(e) => {
              setDisplayName(e.target.value);
              if (!name || name === autoGenerateName(displayName)) {
                setName(autoGenerateName(e.target.value));
              }
            }}
            placeholder={t("editor.displayNamePlaceholder")}
            maxLength={100}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium">{t("editor.name")}</label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("editor.namePlaceholder")}
            className="font-mono"
            pattern="[a-z0-9][a-z0-9-]*"
            maxLength={50}
          />
          <p className="mt-1 text-xs text-[var(--muted-foreground)]">{t("editor.nameHint")}</p>
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

        <Button className="w-full" onClick={handleCreate} disabled={creating || !name || !displayName || !templateHtml}>
          {creating ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t("editor.creating")}</> : t("editor.create")}
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
            style={{ width: "794px", height: "1123px", border: "none", pointerEvents: "none" }}
            title="Template Preview"
            sandbox="allow-same-origin"
          />
        </DraggablePreviewScroll>
      </div>
    </div>
  );
}
