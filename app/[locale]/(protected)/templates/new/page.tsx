"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

const VARIABLE_LIST = [
  "header", "summary", "education", "workExperience", "projects",
  "skills", "certificates", "openSource", "customSections", "fullName", "email", "phone",
];

export default function NewTemplatePage() {
  const t = useTranslations("templates");
  const router = useRouter();
  const [name, setName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [description, setDescription] = useState("");
  const [templateHtml, setTemplateHtml] = useState("");
  const [templateCss, setTemplateCss] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [previewHtml, setPreviewHtml] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const updatePreview = useCallback((html: string, css: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetch("/api/user-templates/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateHtml: html, templateCss: css }),
      })
        .then((r) => r.text())
        .then(setPreviewHtml)
        .catch(() => {});
    }, 800);
  }, []);

  useEffect(() => {
    if (templateHtml) updatePreview(templateHtml, templateCss);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [templateHtml, templateCss, updatePreview]);

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

  function autoGenerateName(display: string) {
    return display
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }

  return (
    <div className="flex h-[calc(100vh-3.5rem)] overflow-hidden">
      {/* Left: Editor */}
      <div className="w-[480px] shrink-0 overflow-y-auto border-r border-[var(--border)] p-6 space-y-5">
        <h1 className="text-2xl font-bold tracking-tight">{t("editor.create")}</h1>

        {error && (
          <div className="rounded-[var(--radius)] bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

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
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium">{t("editor.name")}</label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("editor.namePlaceholder")}
            className="font-mono"
          />
          <p className="mt-1 text-xs text-[var(--muted-foreground)]">{t("editor.nameHint")}</p>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium">{t("editor.description")}</label>
          <Input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium">{t("editor.htmlCode")}</label>
          <Textarea
            value={templateHtml}
            onChange={(e) => setTemplateHtml(e.target.value)}
            placeholder={t("editor.htmlPlaceholder")}
            rows={12}
            className="font-mono text-xs"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium">{t("editor.cssCode")}</label>
          <Textarea
            value={templateCss}
            onChange={(e) => setTemplateCss(e.target.value)}
            placeholder={t("editor.cssPlaceholder")}
            rows={6}
            className="font-mono text-xs"
          />
        </div>

        {/* Variable Reference */}
        <div className="rounded-[var(--radius)] border border-[var(--border)] p-4">
          <h3 className="mb-2 text-sm font-semibold">{t("editor.variableReference")}</h3>
          <p className="mb-3 text-xs text-[var(--muted-foreground)]">{t("editor.variableHint")}</p>
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
        <div className="flex-1 overflow-auto p-8 flex justify-center">
          <iframe
            srcDoc={previewHtml}
            className="bg-white shadow-lg rounded-md"
            style={{ width: "794px", height: "1123px", border: "none" }}
            title="Template Preview"
            sandbox="allow-same-origin"
          />
        </div>
      </div>
    </div>
  );
}
