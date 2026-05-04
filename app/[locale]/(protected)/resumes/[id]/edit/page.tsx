"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import type {
  ResumeContent,
  EducationItem,
  WorkExperienceItem,
  ProjectItem,
  SkillCategory,
  CertificateItem,
  OpenSourceItem,
  CustomSectionItem,
} from "@/lib/resume-schema";
import { defaultResumeContent } from "@/lib/resume-schema";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, ArrowUp, ArrowDown, Save, Eye, FileDown, FileText, FileCode, ZoomIn, ZoomOut, Maximize } from "lucide-react";
import { LoadingPage } from "@/components/loading-page";

type Section = "basic" | "summary" | "education" | "workExperience" | "projects" | "skills" | "certificates" | "openSource" | "customSections";

const SECTION_KEYS: Section[] = [
  "basic", "summary", "education", "workExperience", "projects",
  "skills", "certificates", "openSource", "customSections",
];

export default function EditResumePage() {
  const params = useParams();
  const router = useRouter();
  const t = useTranslations("editor");
  const tt = useTranslations("templates");
  const id = params.id as string;

  const [title, setTitle] = useState("");
  const [content, setContent] = useState<ResumeContent>(defaultResumeContent());
  const [activeSection, setActiveSection] = useState<Section>("basic");
  const [templateName, setTemplateName] = useState("clean-cn");
  const [templateId, setTemplateId] = useState<string | null>(null);
  const [availableTemplates, setAvailableTemplates] = useState<{ id: string; name: string; displayName: string }[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dirty, setDirty] = useState(false);
  const [exporting, setExporting] = useState<string | null>(null);
  const revisionRef = useRef(0);
  const inFlightSavesRef = useRef(0);

  useEffect(() => {
    fetch(`/api/resumes/${id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.resume) {
          setTitle(d.resume.title);
          setContent(typeof d.resume.contentJson === "string"
            ? JSON.parse(d.resume.contentJson)
            : d.resume.contentJson);
          setTemplateName(d.resume.template?.name || "clean-cn");
          setTemplateId(d.resume.templateId || null);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    fetch("/api/templates")
      .then((r) => r.json())
      .then((d) => setAvailableTemplates(d.templates || []))
      .catch(() => {});
  }, [id]);

  const save = useCallback(async () => {
    const saveRevision = revisionRef.current;
    setSaving(true);
    inFlightSavesRef.current += 1;
    try {
      const response = await fetch(`/api/resumes/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, contentJson: content }),
      });
      if (response.ok && revisionRef.current === saveRevision) {
        setDirty(false);
      }
    } finally {
      inFlightSavesRef.current -= 1;
      if (inFlightSavesRef.current === 0) {
        setSaving(false);
      }
    }
  }, [id, title, content]);

  useEffect(() => {
    if (!dirty) return;
    const timer = setTimeout(save, 1500);
    return () => clearTimeout(timer);
  }, [dirty, save]);

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

  function updateContent(updater: (prev: ResumeContent) => ResumeContent) {
    revisionRef.current += 1;
    setContent((prev) => updater(prev));
    setDirty(true);
  }

  if (loading) {
    return <LoadingPage text={t("loading")} />;
  }

  return (
    <div className="flex h-[calc(100vh-3.5rem)] overflow-hidden bg-[var(--background)]">
      {/* Sidebar Navigation */}
      <nav className="flex w-56 shrink-0 flex-col border-r border-[var(--border)] overflow-y-auto p-4">
        <div className="mb-6 space-y-1">
          <label className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Document Title</label>
          <Input
            value={title}
            onChange={(e) => {
              revisionRef.current += 1;
              setTitle(e.target.value);
              setDirty(true);
            }}
            className="h-8 font-medium"
          />
        </div>
        <div className="mb-6 space-y-1">
          <label className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">{tt("picker.label")}</label>
          <select
            value={templateId || ""}
            onChange={(e) => {
              const selectedId = e.target.value || null;
              const selected = availableTemplates.find((t) => t.id === selectedId);
              setTemplateId(selectedId);
              setTemplateName(selected?.name || "clean-cn");
              fetch(`/api/resumes/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ templateId: selectedId }),
              }).catch(() => {});
            }}
            className="h-8 w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--background)] px-2 text-sm"
          >
            {availableTemplates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.displayName}
              </option>
            ))}
          </select>
        </div>
        <div className="flex-1 space-y-1">
          <label className="mb-2 block text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Sections</label>
          {SECTION_KEYS.map((key) => (
            <button
              key={key}
              onClick={() => setActiveSection(key)}
              className={`block w-full rounded-[var(--radius)] px-3 py-2 text-left text-sm font-medium transition-colors ${
                activeSection === key
                  ? "bg-[var(--primary)] text-[var(--primary-foreground)] shadow-sm"
                  : "text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
              }`}
            >
              {t(`sections.${key}`)}
            </button>
          ))}
        </div>
        <div className="mt-4 pt-4 space-y-2 border-t border-[var(--border)]">
          <Button variant="outline" className="w-full justify-start" onClick={() => router.push(`/resumes/${id}/preview`)}>
            <Eye className="mr-2 h-4 w-4" />
            {t("fullPreview")}
          </Button>
          <div className="pt-2">
            <p className="mb-2 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">{t("export")}</p>
            <div className="flex flex-col gap-1">
              <Button variant="ghost" size="sm" className="w-full justify-start text-xs h-8" onClick={() => handleExport("pdf")} disabled={exporting !== null}>
                <FileDown className="mr-2 h-3.5 w-3.5" />
                {exporting === "pdf" ? t("exporting") : t("exportPdf")}
              </Button>
              <Button variant="ghost" size="sm" className="w-full justify-start text-xs h-8" onClick={() => handleExport("markdown")} disabled={exporting !== null}>
                <FileText className="mr-2 h-3.5 w-3.5" />
                {exporting === "markdown" ? t("exporting") : t("exportMarkdown")}
              </Button>
              <Button variant="ghost" size="sm" className="w-full justify-start text-xs h-8" onClick={() => handleExport("json")} disabled={exporting !== null}>
                <FileCode className="mr-2 h-3.5 w-3.5" />
                {exporting === "json" ? t("exporting") : t("exportJson")}
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Editor Form Area */}
      <div className="w-full max-w-xl shrink-0 border-r border-[var(--border)] overflow-y-auto p-6 bg-[var(--background)] shadow-sm z-10">
        <FormSection section={activeSection} content={content} updateContent={updateContent} />
      </div>

      {/* Live Preview Area */}
      <div className="flex flex-1 flex-col overflow-hidden bg-[var(--muted)]/40 relative">
        {/* Preview Toolbar */}
        <div className="absolute bottom-6 right-6 z-20 flex items-center gap-3 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--background)]/80 px-4 py-2 backdrop-blur shadow-sm">
          <div className="flex items-center gap-2">
            <div className={`h-2 w-2 rounded-full ${saving ? 'bg-yellow-500 animate-pulse' : dirty ? 'bg-orange-500' : 'bg-green-500'}`}></div>
            <span className="text-xs font-medium text-[var(--muted-foreground)]">
              {saving ? t("saving") : dirty ? t("unsaved") : t("saved")}
            </span>
          </div>
          <Button size="sm" variant="secondary" className="h-7 text-xs" onClick={save} disabled={saving || !dirty}>
            <Save className="mr-1 h-3 w-3" />
            {t("saveNow")}
          </Button>
        </div>
        
        {/* Preview Canvas */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className="mx-auto flex justify-center pb-12">
            <PreviewPanel content={content} templateName={templateName} />
          </div>
        </div>
      </div>
    </div>
  );
}

function FormSection({
  section, content, updateContent,
}: {
  section: Section; content: ResumeContent; updateContent: (u: (p: ResumeContent) => ResumeContent) => void;
}) {
  switch (section) {
    case "basic": return <BasicForm content={content} updateContent={updateContent} />;
    case "summary": return <SummaryForm content={content} updateContent={updateContent} />;
    case "education": return <EducationForm content={content} updateContent={updateContent} />;
    case "workExperience": return <WorkExperienceForm content={content} updateContent={updateContent} />;
    case "projects": return <ProjectsForm content={content} updateContent={updateContent} />;
    case "skills": return <SkillsForm content={content} updateContent={updateContent} />;
    case "certificates": return <CertificatesForm content={content} updateContent={updateContent} />;
    case "openSource": return <OpenSourceForm content={content} updateContent={updateContent} />;
    case "customSections": return <CustomSectionsForm content={content} updateContent={updateContent} />;
  }
}

const BASIC_FIELD_CONFIG: Record<string, {
  type?: string; inputMode?: string; autoComplete?: string; placeholderKey?: string; fullWidth?: boolean;
}> = {
  name:         { autoComplete: "name", fullWidth: true },
  email:        { type: "email", autoComplete: "email", placeholderKey: "emailPlaceholder" },
  phone:        { inputMode: "tel", autoComplete: "tel", placeholderKey: "phonePlaceholder" },
  location:     { autoComplete: "address-level2", fullWidth: true },
  website:      { type: "url", placeholderKey: "websitePlaceholder" },
  github:       { type: "url", placeholderKey: "githubPlaceholder" },
  linkedin:     { type: "url", placeholderKey: "linkedinPlaceholder" },
};

function BasicForm({ content, updateContent }: { content: ResumeContent; updateContent: (u: (p: ResumeContent) => ResumeContent) => void }) {
  const t = useTranslations("editor");
  const b = content.basic;
  const [errors, setErrors] = useState<Record<string, string>>({});
  function set(key: string, val: string) {
    updateContent((p) => ({ ...p, basic: { ...p.basic, [key]: val } }));
    if (errors[key]) setErrors((prev) => { const next = { ...prev }; delete next[key]; return next; });
  }
  function validate(key: string, val: string) {
    if (!val) return;
    const cfg = BASIC_FIELD_CONFIG[key];
    if (cfg?.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
      setErrors((prev) => ({ ...prev, [key]: t("fields.invalidEmail") }));
    } else if (cfg?.type === "url" && !/^https?:\/\/.+/.test(val)) {
      setErrors((prev) => ({ ...prev, [key]: t("fields.invalidUrl") }));
    }
  }
  const fields = ["name", "email", "phone", "location", "website", "github", "linkedin"];
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">{t("sections.basic")}</h2>
        <p className="text-sm text-[var(--muted-foreground)]">Add your contact information.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {fields.map((key) => {
          const cfg = BASIC_FIELD_CONFIG[key] || {};
          return (
            <div key={key} className={cfg.fullWidth ? "sm:col-span-2" : ""}>
              <label className="mb-1.5 block text-sm font-medium text-[var(--foreground)]">{t(`fields.${key}`)}</label>
              <Input
                type={cfg.type as "email" | "url" | "text" | undefined}
                inputMode={cfg.inputMode as "tel" | "decimal" | "text" | undefined}
                autoComplete={cfg.autoComplete}
                placeholder={cfg.placeholderKey ? t(`fields.${cfg.placeholderKey}`) : undefined}
                value={(b as Record<string, string>)[key] || ""}
                onChange={(e) => set(key, e.target.value)}
                onBlur={(e) => validate(key, e.target.value)}
                className={errors[key] ? "border-red-500 focus-visible:ring-red-500" : ""}
              />
              {errors[key] && <p className="mt-1 text-xs text-red-500">{errors[key]}</p>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SummaryForm({ content, updateContent }: { content: ResumeContent; updateContent: (u: (p: ResumeContent) => ResumeContent) => void }) {
  const t = useTranslations("editor");
  const g = useTranslations("editor.summaryGuide");
  const [showGuide, setShowGuide] = useState(true);
  const templateKeys = ["experienced", "junior", "careerChange", "techLead", "freelancer"] as const;
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{t("sections.summary")}</h2>
          <p className="text-sm text-[var(--muted-foreground)]">A brief professional summary.</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setShowGuide(!showGuide)}>
          {showGuide ? g("toggleHide") : g("toggleShow")}
        </Button>
      </div>

      <Textarea
        value={content.summary}
        onChange={(e) => updateContent((p) => ({ ...p, summary: e.target.value }))}
        rows={10}
        className="resize-y"
        placeholder={g("tips")}
      />

      {showGuide && (
        <div className="space-y-4">
          {/* Writing Tips */}
          <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--muted)]/30 p-4">
            <h3 className="mb-3 text-sm font-semibold">{g("tips")}</h3>
            <ul className="space-y-1.5 text-xs text-[var(--muted-foreground)]">
              {([1, 2, 3, 4, 5] as const).map((i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="mt-0.5 shrink-0 h-1.5 w-1.5 rounded-full bg-[var(--primary)]" />
                  {g(`tip${i}`)}
                </li>
              ))}
            </ul>
          </div>

          {/* Template Cards */}
          <div>
            <h3 className="mb-3 text-sm font-semibold">{g("templateTitle")}</h3>
            <div className="space-y-3">
              {templateKeys.map((key) => (
                <div key={key} className="group rounded-[var(--radius)] border border-[var(--border)] p-3 transition-colors hover:border-[var(--primary)]/50">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-semibold text-[var(--foreground)]">{g(`templates.${key}.name`)}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs opacity-0 transition-opacity group-hover:opacity-100"
                      onClick={() => updateContent((p) => ({ ...p, summary: g(`templates.${key}.content`) }))}
                    >
                      {g("useTemplate")}
                    </Button>
                  </div>
                  <p className="text-xs leading-relaxed text-[var(--muted-foreground)]">{g(`templates.${key}.content`)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function EducationForm({ content, updateContent }: { content: ResumeContent; updateContent: (u: (p: ResumeContent) => ResumeContent) => void }) {
  const t = useTranslations("editor");
  const items = content.education;
  function add() {
    updateContent((p) => ({
      ...p,
      education: [...p.education, { id: crypto.randomUUID(), school: "", degree: "", major: "", startDate: "", endDate: "", gpa: "", description: "" }],
    }));
  }
  function update(index: number, field: string, value: string) {
    updateContent((p) => ({
      ...p,
      education: p.education.map((e, i) => i === index ? { ...e, [field]: value } : e),
    }));
  }
  function remove(index: number) {
    updateContent((p) => ({ ...p, education: p.education.filter((_, i) => i !== index) }));
  }
  function move(index: number, dir: -1 | 1) {
    updateContent((p) => {
      const arr = [...p.education];
      const target = index + dir;
      if (target < 0 || target >= arr.length) return p;
      [arr[index], arr[target]] = [arr[target], arr[index]];
      return { ...p, education: arr };
    });
  }
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{t("sections.education")}</h2>
          <p className="text-sm text-[var(--muted-foreground)]">Your academic background.</p>
        </div>
        <Button onClick={add} size="sm">
          <Plus className="mr-2 h-4 w-4" /> {t("add")}
        </Button>
      </div>
      <div className="space-y-4">
        {items.map((item, i) => (
          <Card key={item.id} className="relative shadow-sm transition-all hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between p-4 pb-2">
              <CardTitle className="text-base font-semibold">{item.school || `Education #${i + 1}`}</CardTitle>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8 text-[var(--muted-foreground)]" onClick={() => move(i, -1)}>
                  <ArrowUp className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-[var(--muted-foreground)]" onClick={() => move(i, 1)}>
                  <ArrowDown className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => remove(i)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="grid gap-4 p-4 pt-2 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-medium text-[var(--muted-foreground)]">{t("fields.school")}</label>
                <Input value={item.school} onChange={(e) => update(i, "school", e.target.value)} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-[var(--muted-foreground)]">{t("fields.degree")}</label>
                <Input value={item.degree} onChange={(e) => update(i, "degree", e.target.value)} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-[var(--muted-foreground)]">{t("fields.major")}</label>
                <Input value={item.major} onChange={(e) => update(i, "major", e.target.value)} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-[var(--muted-foreground)]">{t("fields.startDate")}</label>
                <Input value={item.startDate} onChange={(e) => update(i, "startDate", e.target.value)} placeholder={t("fields.startDatePlaceholder")} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-[var(--muted-foreground)]">{t("fields.endDate")}</label>
                <Input value={item.endDate} onChange={(e) => update(i, "endDate", e.target.value)} placeholder={t("fields.endDatePlaceholder")} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-[var(--muted-foreground)]">{t("fields.gpa")}</label>
                <Input value={item.gpa} onChange={(e) => update(i, "gpa", e.target.value)} inputMode="decimal" placeholder={t("fields.gpaPlaceholder")} />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-medium text-[var(--muted-foreground)]">{t("fields.description")}</label>
                <Textarea value={item.description} onChange={(e) => update(i, "description", e.target.value)} rows={2} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function WorkExperienceForm({ content, updateContent }: { content: ResumeContent; updateContent: (u: (p: ResumeContent) => ResumeContent) => void }) {
  const t = useTranslations("editor");
  const g = useTranslations("editor.workGuide");
  const [showGuide, setShowGuide] = useState(true);
  const workTemplateKeys = ["backend", "frontend", "fullstack", "management"] as const;
  const items = content.workExperience;
  function add() {
    updateContent((p) => ({
      ...p,
      workExperience: [...p.workExperience, { id: crypto.randomUUID(), company: "", position: "", startDate: "", endDate: "", description: "", highlights: [] }],
    }));
  }
  function update(index: number, field: string, value: string | string[]) {
    updateContent((p) => ({
      ...p,
      workExperience: p.workExperience.map((w, i) => i === index ? { ...w, [field]: value } : w),
    }));
  }
  function remove(index: number) {
    updateContent((p) => ({ ...p, workExperience: p.workExperience.filter((_, i) => i !== index) }));
  }
  function move(index: number, dir: -1 | 1) {
    updateContent((p) => {
      const arr = [...p.workExperience];
      const target = index + dir;
      if (target < 0 || target >= arr.length) return p;
      [arr[index], arr[target]] = [arr[target], arr[index]];
      return { ...p, workExperience: arr };
    });
  }
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{t("sections.workExperience")}</h2>
          <p className="text-sm text-[var(--muted-foreground)]">Your professional career timeline.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowGuide(!showGuide)}>
            {showGuide ? g("toggleHide") : g("toggleShow")}
          </Button>
          <Button onClick={add} size="sm">
            <Plus className="mr-2 h-4 w-4" /> {t("add")}
          </Button>
        </div>
      </div>

      {showGuide && (
        <div className="space-y-4">
          {/* Writing Tips */}
          <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--muted)]/30 p-4">
            <h3 className="mb-3 text-sm font-semibold">{g("tips")}</h3>
            <ul className="space-y-1.5 text-xs text-[var(--muted-foreground)]">
              {([1, 2, 3, 4, 5] as const).map((i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="mt-0.5 shrink-0 h-1.5 w-1.5 rounded-full bg-[var(--primary)]" />
                  {g(`tip${i}`)}
                </li>
              ))}
            </ul>
          </div>

          {/* Highlight Template Cards */}
          <div>
            <h3 className="mb-3 text-sm font-semibold">{g("templateTitle")}</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              {workTemplateKeys.map((key) => (
                <div key={key} className="group rounded-[var(--radius)] border border-[var(--border)] p-3 transition-colors hover:border-[var(--primary)]/50">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-semibold text-[var(--foreground)]">{g(`templates.${key}.name`)}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs opacity-0 transition-opacity group-hover:opacity-100"
                      onClick={() => {
                        const highlights = g(`templates.${key}.highlights`).split("\n");
                        // Fill into the first work experience item, or add a new one
                        if (items.length === 0) {
                          updateContent((p) => ({
                            ...p,
                            workExperience: [{ id: crypto.randomUUID(), company: "", position: "", startDate: "", endDate: "", description: "", highlights }],
                          }));
                        } else {
                          update(0, "highlights", highlights);
                        }
                      }}
                    >
                      {g("useTemplate")}
                    </Button>
                  </div>
                  <div className="space-y-1">
                    {g(`templates.${key}.highlights`).split("\n").map((line, idx) => (
                      <p key={idx} className="text-xs leading-relaxed text-[var(--muted-foreground)]">• {line}</p>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {items.map((item, i) => (
          <Card key={item.id} className="relative shadow-sm transition-all hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between p-4 pb-2">
              <CardTitle className="text-base font-semibold">{item.company || `Experience #${i + 1}`}</CardTitle>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8 text-[var(--muted-foreground)]" onClick={() => move(i, -1)}>
                  <ArrowUp className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-[var(--muted-foreground)]" onClick={() => move(i, 1)}>
                  <ArrowDown className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => remove(i)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="grid gap-4 p-4 pt-2 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-medium text-[var(--muted-foreground)]">{t("fields.company")}</label>
                <Input value={item.company} onChange={(e) => update(i, "company", e.target.value)} />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-medium text-[var(--muted-foreground)]">{t("fields.position")}</label>
                <Input value={item.position} onChange={(e) => update(i, "position", e.target.value)} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-[var(--muted-foreground)]">{t("fields.startDate")}</label>
                <Input value={item.startDate} onChange={(e) => update(i, "startDate", e.target.value)} placeholder={t("fields.startDatePlaceholder")} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-[var(--muted-foreground)]">{t("fields.endDate")}</label>
                <Input value={item.endDate} onChange={(e) => update(i, "endDate", e.target.value)} placeholder={t("fields.endDatePlaceholder")} />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-medium text-[var(--muted-foreground)]">{t("fields.description")}</label>
                <Textarea value={item.description} onChange={(e) => update(i, "description", e.target.value)} rows={2} />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-medium text-[var(--muted-foreground)]">{t("fields.highlights")}</label>
                <Textarea value={item.highlights.join("\n")} onChange={(e) => update(i, "highlights", e.target.value.split("\n").filter(Boolean))} rows={4} placeholder="Enter each highlight on a new line..." />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function ProjectsForm({ content, updateContent }: { content: ResumeContent; updateContent: (u: (p: ResumeContent) => ResumeContent) => void }) {
  const t = useTranslations("editor");
  const g = useTranslations("editor.projectGuide");
  const [showGuide, setShowGuide] = useState(true);
  const projectTemplateKeys = ["webApp", "openSource", "infrastructure", "mobile"] as const;
  const items = content.projects;
  function add() {
    updateContent((p) => ({
      ...p,
      projects: [...p.projects, { id: crypto.randomUUID(), name: "", role: "", startDate: "", endDate: "", description: "", url: "", highlights: [] }],
    }));
  }
  function update(index: number, field: string, value: string | string[]) {
    updateContent((p) => ({
      ...p,
      projects: p.projects.map((pr, i) => i === index ? { ...pr, [field]: value } : pr),
    }));
  }
  function remove(index: number) {
    updateContent((p) => ({ ...p, projects: p.projects.filter((_, i) => i !== index) }));
  }
  function move(index: number, dir: -1 | 1) {
    updateContent((p) => {
      const arr = [...p.projects];
      const target = index + dir;
      if (target < 0 || target >= arr.length) return p;
      [arr[index], arr[target]] = [arr[target], arr[index]];
      return { ...p, projects: arr };
    });
  }
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{t("sections.projects")}</h2>
          <p className="text-sm text-[var(--muted-foreground)]">Showcase your notable projects.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowGuide(!showGuide)}>
            {showGuide ? g("toggleHide") : g("toggleShow")}
          </Button>
          <Button onClick={add} size="sm">
            <Plus className="mr-2 h-4 w-4" /> {t("add")}
          </Button>
        </div>
      </div>

      {showGuide && (
        <div className="space-y-4">
          {/* Writing Tips */}
          <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--muted)]/30 p-4">
            <h3 className="mb-3 text-sm font-semibold">{g("tips")}</h3>
            <ul className="space-y-1.5 text-xs text-[var(--muted-foreground)]">
              {([1, 2, 3, 4, 5] as const).map((i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="mt-0.5 shrink-0 h-1.5 w-1.5 rounded-full bg-[var(--primary)]" />
                  {g(`tip${i}`)}
                </li>
              ))}
            </ul>
          </div>

          {/* Project Template Cards */}
          <div>
            <h3 className="mb-3 text-sm font-semibold">{g("templateTitle")}</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              {projectTemplateKeys.map((key) => (
                <div key={key} className="group rounded-[var(--radius)] border border-[var(--border)] p-3 transition-colors hover:border-[var(--primary)]/50">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-semibold text-[var(--foreground)]">{g(`templates.${key}.name`)}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs opacity-0 transition-opacity group-hover:opacity-100"
                      onClick={() => {
                        const description = g(`templates.${key}.description`);
                        const highlights = g(`templates.${key}.highlights`).split("\n");
                        // Fill into the first project item, or add a new one
                        if (items.length === 0) {
                          updateContent((p) => ({
                            ...p,
                            projects: [{ id: crypto.randomUUID(), name: "", role: "", startDate: "", endDate: "", description, url: "", highlights }],
                          }));
                        } else {
                          update(0, "description", description);
                          update(0, "highlights", highlights);
                        }
                      }}
                    >
                      {g("useTemplate")}
                    </Button>
                  </div>
                  <p className="mb-2 text-xs leading-relaxed text-[var(--muted-foreground)]">{g(`templates.${key}.description`)}</p>
                  <div className="space-y-1">
                    {g(`templates.${key}.highlights`).split("\n").map((line, idx) => (
                      <p key={idx} className="text-xs leading-relaxed text-[var(--muted-foreground)]">• {line}</p>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {items.map((item, i) => (
          <Card key={item.id} className="relative shadow-sm transition-all hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between p-4 pb-2">
              <CardTitle className="text-base font-semibold">{item.name || `Project #${i + 1}`}</CardTitle>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8 text-[var(--muted-foreground)]" onClick={() => move(i, -1)}>
                  <ArrowUp className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-[var(--muted-foreground)]" onClick={() => move(i, 1)}>
                  <ArrowDown className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => remove(i)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="grid gap-4 p-4 pt-2 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-medium text-[var(--muted-foreground)]">{t("fields.name")}</label>
                <Input value={item.name} onChange={(e) => update(i, "name", e.target.value)} />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-medium text-[var(--muted-foreground)]">{t("fields.role")}</label>
                <Input value={item.role} onChange={(e) => update(i, "role", e.target.value)} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-[var(--muted-foreground)]">{t("fields.startDate")}</label>
                <Input value={item.startDate} onChange={(e) => update(i, "startDate", e.target.value)} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-[var(--muted-foreground)]">{t("fields.endDate")}</label>
                <Input value={item.endDate} onChange={(e) => update(i, "endDate", e.target.value)} />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-medium text-[var(--muted-foreground)]">{t("fields.url")}</label>
                <Input type="url" value={item.url} onChange={(e) => update(i, "url", e.target.value)} placeholder="https://" />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-medium text-[var(--muted-foreground)]">{t("fields.description")}</label>
                <Textarea value={item.description} onChange={(e) => update(i, "description", e.target.value)} rows={2} />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-medium text-[var(--muted-foreground)]">{t("fields.highlights")}</label>
                <Textarea value={item.highlights.join("\n")} onChange={(e) => update(i, "highlights", e.target.value.split("\n").filter(Boolean))} rows={4} placeholder="Enter each highlight on a new line..." />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function SkillsForm({ content, updateContent }: { content: ResumeContent; updateContent: (u: (p: ResumeContent) => ResumeContent) => void }) {
  const t = useTranslations("editor");
  const items = content.skills;
  function add() {
    updateContent((p) => ({
      ...p,
      skills: [...p.skills, { id: crypto.randomUUID(), name: "", skills: [] }],
    }));
  }
  function update(index: number, field: string, value: string | string[]) {
    updateContent((p) => ({
      ...p,
      skills: p.skills.map((s, i) => i === index ? { ...s, [field]: value } : s),
    }));
  }
  function remove(index: number) {
    updateContent((p) => ({ ...p, skills: p.skills.filter((_, i) => i !== index) }));
  }
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{t("sections.skills")}</h2>
          <p className="text-sm text-[var(--muted-foreground)]">Your technical and soft skills.</p>
        </div>
        <Button onClick={add} size="sm">
          <Plus className="mr-2 h-4 w-4" /> {t("addCategory")}
        </Button>
      </div>
      <div className="space-y-4">
        {items.map((item, i) => (
          <Card key={item.id} className="relative shadow-sm transition-all hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between p-4 pb-2">
              <CardTitle className="text-base font-semibold">{item.name || t("fields.newCategory")}</CardTitle>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => remove(i)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="grid gap-4 p-4 pt-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-[var(--muted-foreground)]">{t("fields.categoryName")}</label>
                <Input value={item.name} onChange={(e) => update(i, "name", e.target.value)} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-[var(--muted-foreground)]">{t("fields.skillsPlaceholder")}</label>
                <Textarea
                  value={item.skills.join(", ")}
                  onChange={(e) => update(i, "skills", e.target.value.split(",").map((s) => s.trim()).filter(Boolean))}
                  rows={2}
                  placeholder="React, Node.js, TypeScript..."
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function CertificatesForm({ content, updateContent }: { content: ResumeContent; updateContent: (u: (p: ResumeContent) => ResumeContent) => void }) {
  const t = useTranslations("editor");
  const items = content.certificates;
  function add() {
    updateContent((p) => ({
      ...p,
      certificates: [...p.certificates, { id: crypto.randomUUID(), name: "", issuer: "", date: "", url: "" }],
    }));
  }
  function update(index: number, field: string, value: string) {
    updateContent((p) => ({
      ...p,
      certificates: p.certificates.map((c, i) => i === index ? { ...c, [field]: value } : c),
    }));
  }
  function remove(index: number) {
    updateContent((p) => ({ ...p, certificates: p.certificates.filter((_, i) => i !== index) }));
  }
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{t("certificatesTitle")}</h2>
          <p className="text-sm text-[var(--muted-foreground)]">Awards, certifications, and licenses.</p>
        </div>
        <Button onClick={add} size="sm">
          <Plus className="mr-2 h-4 w-4" /> {t("add")}
        </Button>
      </div>
      <div className="space-y-4">
        {items.map((item, i) => (
          <Card key={item.id} className="relative shadow-sm transition-all hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between p-4 pb-2">
              <CardTitle className="text-base font-semibold">{item.name || t("fields.newCertificate")}</CardTitle>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => remove(i)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="grid gap-4 p-4 pt-2 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-medium text-[var(--muted-foreground)]">{t("fields.name")}</label>
                <Input value={item.name} onChange={(e) => update(i, "name", e.target.value)} />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-medium text-[var(--muted-foreground)]">{t("fields.issuer")}</label>
                <Input value={item.issuer} onChange={(e) => update(i, "issuer", e.target.value)} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-[var(--muted-foreground)]">{t("fields.date")}</label>
                <Input value={item.date} onChange={(e) => update(i, "date", e.target.value)} placeholder={t("fields.datePlaceholder")} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-[var(--muted-foreground)]">{t("fields.url")}</label>
                <Input type="url" value={item.url} onChange={(e) => update(i, "url", e.target.value)} placeholder="https://" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function OpenSourceForm({ content, updateContent }: { content: ResumeContent; updateContent: (u: (p: ResumeContent) => ResumeContent) => void }) {
  const t = useTranslations("editor");
  const items = content.openSource;
  function add() {
    updateContent((p) => ({
      ...p,
      openSource: [...p.openSource, { id: crypto.randomUUID(), name: "", url: "", description: "", role: "" }],
    }));
  }
  function update(index: number, field: string, value: string) {
    updateContent((p) => ({
      ...p,
      openSource: p.openSource.map((o, i) => i === index ? { ...o, [field]: value } : o),
    }));
  }
  function remove(index: number) {
    updateContent((p) => ({ ...p, openSource: p.openSource.filter((_, i) => i !== index) }));
  }
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{t("sections.openSource")}</h2>
          <p className="text-sm text-[var(--muted-foreground)]">Your open-source contributions.</p>
        </div>
        <Button onClick={add} size="sm">
          <Plus className="mr-2 h-4 w-4" /> {t("add")}
        </Button>
      </div>
      <div className="space-y-4">
        {items.map((item, i) => (
          <Card key={item.id} className="relative shadow-sm transition-all hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between p-4 pb-2">
              <CardTitle className="text-base font-semibold">{item.name || t("fields.newEntry")}</CardTitle>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => remove(i)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="grid gap-4 p-4 pt-2 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-[var(--muted-foreground)]">{t("fields.name")}</label>
                <Input value={item.name} onChange={(e) => update(i, "name", e.target.value)} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-[var(--muted-foreground)]">{t("fields.role")}</label>
                <Input value={item.role} onChange={(e) => update(i, "role", e.target.value)} />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-medium text-[var(--muted-foreground)]">{t("fields.url")}</label>
                <Input type="url" value={item.url} onChange={(e) => update(i, "url", e.target.value)} placeholder="https://" />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-medium text-[var(--muted-foreground)]">{t("fields.description")}</label>
                <Textarea value={item.description} onChange={(e) => update(i, "description", e.target.value)} rows={2} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function CustomSectionsForm({ content, updateContent }: { content: ResumeContent; updateContent: (u: (p: ResumeContent) => ResumeContent) => void }) {
  const t = useTranslations("editor");
  const items = content.customSections;
  function add() {
    updateContent((p) => ({
      ...p,
      customSections: [...p.customSections, { id: crypto.randomUUID(), title: "", content: "" }],
    }));
  }
  function update(index: number, field: string, value: string) {
    updateContent((p) => ({
      ...p,
      customSections: p.customSections.map((c, i) => i === index ? { ...c, [field]: value } : c),
    }));
  }
  function remove(index: number) {
    updateContent((p) => ({ ...p, customSections: p.customSections.filter((_, i) => i !== index) }));
  }
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{t("sections.customSections")}</h2>
          <p className="text-sm text-[var(--muted-foreground)]">Add any additional information here.</p>
        </div>
        <Button onClick={add} size="sm">
          <Plus className="mr-2 h-4 w-4" /> {t("add")}
        </Button>
      </div>
      <div className="space-y-4">
        {items.map((item, i) => (
          <Card key={item.id} className="relative shadow-sm transition-all hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between p-4 pb-2">
              <CardTitle className="text-base font-semibold">{item.title || t("fields.newSection")}</CardTitle>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => remove(i)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="grid gap-4 p-4 pt-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-[var(--muted-foreground)]">{t("fields.title")}</label>
                <Input value={item.title} onChange={(e) => update(i, "title", e.target.value)} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-[var(--muted-foreground)]">{t("fields.content")}</label>
                <Textarea value={item.content} onChange={(e) => update(i, "content", e.target.value)} rows={4} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function PreviewPanel({ content, templateName }: { content: ResumeContent; templateName: string }) {
  const [html, setHtml] = useState("");
  const [pages, setPages] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const hiddenRef = useRef<HTMLIFrameElement>(null);
  const [autoScale, setAutoScale] = useState(1);
  const [userScale, setUserScale] = useState<number | null>(null);

  const currentScale = userScale !== null ? userScale : autoScale;

  useEffect(() => {
    fetch("/api/render-preview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, templateName }),
    })
      .then((r) => r.text())
      .then(setHtml)
      .catch(() => {});
  }, [content, templateName]);

  // Paginate content when html changes
  useEffect(() => {
    if (!html) return;
    // Use a small delay to let the hidden iframe render
    const timer = setTimeout(() => {
      const iframe = hiddenRef.current;
      if (!iframe) return;
      const doc = iframe.contentDocument;
      if (!doc?.body?.children.length) return;

      const body = doc.body;
      const sections = Array.from(body.children) as HTMLElement[];
      const pageDivs: string[] = [];
      const bodyPadding = 80;
      const usableHeight = 1123 - bodyPadding;

      let currentSections: string[] = [];
      let currentHeight = 0;

      for (const section of sections) {
        const h = (section as HTMLElement).offsetHeight;

        if (h > usableHeight) {
          if (currentSections.length > 0) {
            pageDivs.push(currentSections.join(""));
            currentSections = [];
            currentHeight = 0;
          }
          pageDivs.push(section.outerHTML);
          continue;
        }

        if (currentHeight + h > usableHeight && currentSections.length > 0) {
          pageDivs.push(currentSections.join(""));
          currentSections = [];
          currentHeight = 0;
        }

        currentSections.push(section.outerHTML);
        currentHeight += h;
      }

      if (currentSections.length > 0) {
        pageDivs.push(currentSections.join(""));
      }

      setPages(pageDivs.length > 0 ? pageDivs : [body.innerHTML]);
    }, 100);
    return () => clearTimeout(timer);
  }, [html]);

  useEffect(() => {
    const updateScale = () => {
      if (containerRef.current) {
        const parentWidth = containerRef.current.parentElement?.clientWidth || 0;
        const targetWidth = parentWidth - 48;
        if (targetWidth < 794) {
          setAutoScale(targetWidth / 794);
        } else {
          setAutoScale(1);
        }
      }
    };
    updateScale();
    window.addEventListener("resize", updateScale);
    return () => window.removeEventListener("resize", updateScale);
  }, []);

  const handleZoomIn = () => setUserScale((prev) => Math.min((prev || autoScale) + 0.1, 2));
  const handleZoomOut = () => setUserScale((prev) => Math.max((prev || autoScale) - 0.1, 0.3));
  const handleResetZoom = () => setUserScale(null);

  const pageCount = pages.length || 1;
  const totalScaledHeight = pageCount * 1123 + (pageCount - 1) * 24;
  const marginCompensation = totalScaledHeight * (1 - currentScale);

  return (
    <div ref={containerRef} className="mx-auto flex flex-col items-center pb-12 w-full relative">
      {/* Hidden measurement iframe */}
      <iframe
        ref={hiddenRef}
        srcDoc={html}
        style={{ position: "absolute", width: "794px", height: "0", visibility: "hidden", border: "none" }}
        title="measure"
        sandbox="allow-same-origin"
      />

      <div className="sticky top-0 z-10 mb-4 flex items-center gap-2 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--background)]/90 px-2 py-1 backdrop-blur shadow-sm">
        <Button variant="ghost" size="icon" className="h-8 w-8 text-[var(--muted-foreground)] hover:text-[var(--foreground)]" onClick={handleZoomOut} title="Zoom Out">
          <ZoomOut className="h-4 w-4" />
        </Button>
        <span className="w-12 text-center text-xs font-medium text-[var(--muted-foreground)]">
          {Math.round(currentScale * 100)}%
        </span>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-[var(--muted-foreground)] hover:text-[var(--foreground)]" onClick={handleZoomIn} title="Zoom In">
          <ZoomIn className="h-4 w-4" />
        </Button>
        <div className="h-4 w-px bg-[var(--border)] mx-1" />
        <Button variant="ghost" size="icon" className="h-8 w-8 text-[var(--muted-foreground)] hover:text-[var(--foreground)]" onClick={handleResetZoom} title="Fit to Screen" disabled={userScale === null}>
          <Maximize className="h-4 w-4" />
        </Button>
      </div>

      <div
        className="flex flex-col items-center transition-transform duration-200"
        style={{
          transformOrigin: "top center",
          transform: `scale(${currentScale})`,
          marginBottom: `-${marginCompensation}px`,
          gap: "24px",
        }}
      >
        {pages.map((pageHtml, idx) => (
          <div
            key={idx}
            className="rounded-md bg-white shadow-2xl ring-1 ring-black/5 overflow-hidden"
            style={{ width: "794px", height: "1123px" }}
          >
            <iframe
              srcDoc={wrapPreviewPage(pageHtml)}
              className="h-full w-full border-0 pointer-events-none"
              title={`Page ${idx + 1}`}
              sandbox="allow-same-origin"
            />
          </div>
        ))}
        {pages.length === 0 && html && (
          <div
            className="rounded-md bg-white shadow-2xl ring-1 ring-black/5 overflow-hidden"
            style={{ width: "794px", height: "1123px" }}
          >
            <iframe
              srcDoc={html}
              className="h-full w-full border-0 pointer-events-none"
              title="Resume Preview"
              sandbox="allow-same-origin"
            />
          </div>
        )}
      </div>
    </div>
  );
}

function wrapPreviewPage(body: string): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
  *{box-sizing:border-box;}
  html,body{width:210mm;height:297mm;padding:0;margin:0 auto;overflow:hidden;background:white;}
  body{padding:40px 48px;font-family:system-ui,-apple-system,sans-serif;color:#333;line-height:1.5;}
  h1,h2,h3{page-break-after:avoid;}
</style></head><body>${body}</body></html>`;
}
