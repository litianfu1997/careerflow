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
import { Plus, Trash2, ArrowUp, ArrowDown, Save, Eye, Loader2, ZoomIn, ZoomOut, Maximize } from "lucide-react";

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

  function updateContent(updater: (prev: ResumeContent) => ResumeContent) {
    revisionRef.current += 1;
    setContent((prev) => updater(prev));
    setDirty(true);
  }

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-3.5rem)] items-center justify-center text-[var(--muted-foreground)]">
        <Loader2 className="mr-2 h-6 w-6 animate-spin" />
        {t("loading")}
      </div>
    );
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
        <div className="mt-4 pt-4 border-t border-[var(--border)]">
          <Button variant="outline" className="w-full justify-start" onClick={() => router.push(`/resumes/${id}/preview`)}>
            <Eye className="mr-2 h-4 w-4" />
            {t("fullPreview")}
          </Button>
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

function BasicForm({ content, updateContent }: { content: ResumeContent; updateContent: (u: (p: ResumeContent) => ResumeContent) => void }) {
  const t = useTranslations("editor");
  const b = content.basic;
  function set(key: string, val: string) {
    updateContent((p) => ({ ...p, basic: { ...p.basic, [key]: val } }));
  }
  const fields = ["name", "email", "phone", "location", "website", "github", "linkedin"];
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">{t("sections.basic")}</h2>
        <p className="text-sm text-[var(--muted-foreground)]">Add your contact information.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {fields.map((key) => (
          <div key={key} className={key === "location" || key === "name" ? "sm:col-span-2" : ""}>
            <label className="mb-1.5 block text-sm font-medium text-[var(--foreground)]">{t(`fields.${key}`)}</label>
            <Input
              value={(b as any)[key] || ""}
              onChange={(e) => set(key, e.target.value)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function SummaryForm({ content, updateContent }: { content: ResumeContent; updateContent: (u: (p: ResumeContent) => ResumeContent) => void }) {
  const t = useTranslations("editor");
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">{t("sections.summary")}</h2>
        <p className="text-sm text-[var(--muted-foreground)]">A brief professional summary.</p>
      </div>
      <Textarea
        value={content.summary}
        onChange={(e) => updateContent((p) => ({ ...p, summary: e.target.value }))}
        rows={10}
        className="resize-y"
      />
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
                <Input value={item.startDate} onChange={(e) => update(i, "startDate", e.target.value)} placeholder="e.g., Sep 2018" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-[var(--muted-foreground)]">{t("fields.endDate")}</label>
                <Input value={item.endDate} onChange={(e) => update(i, "endDate", e.target.value)} placeholder="e.g., Jun 2022" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-[var(--muted-foreground)]">{t("fields.gpa")}</label>
                <Input value={item.gpa} onChange={(e) => update(i, "gpa", e.target.value)} />
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
        <Button onClick={add} size="sm">
          <Plus className="mr-2 h-4 w-4" /> {t("add")}
        </Button>
      </div>
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
                <Input value={item.startDate} onChange={(e) => update(i, "startDate", e.target.value)} placeholder="e.g., Jan 2021" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-[var(--muted-foreground)]">{t("fields.endDate")}</label>
                <Input value={item.endDate} onChange={(e) => update(i, "endDate", e.target.value)} placeholder="e.g., Present" />
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
        <Button onClick={add} size="sm">
          <Plus className="mr-2 h-4 w-4" /> {t("add")}
        </Button>
      </div>
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
                <Input value={item.url} onChange={(e) => update(i, "url", e.target.value)} placeholder="https://" />
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
                <Input value={item.date} onChange={(e) => update(i, "date", e.target.value)} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-[var(--muted-foreground)]">{t("fields.url")}</label>
                <Input value={item.url} onChange={(e) => update(i, "url", e.target.value)} placeholder="https://" />
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
                <Input value={item.url} onChange={(e) => update(i, "url", e.target.value)} placeholder="https://" />
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
  const containerRef = useRef<HTMLDivElement>(null);
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

  useEffect(() => {
    const updateScale = () => {
      if (containerRef.current) {
        const parentWidth = containerRef.current.parentElement?.clientWidth || 0;
        const targetWidth = parentWidth - 48; // padding
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

  return (
    <div ref={containerRef} className="mx-auto flex flex-col items-center pb-12 w-full relative">
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
        className="rounded-md bg-white shadow-2xl ring-1 ring-black/5 transition-transform duration-200"
        style={{ 
          width: "794px", 
          height: "1123px", 
          transformOrigin: "top center", 
          transform: `scale(${currentScale})`,
          marginBottom: `-${1123 * (1 - currentScale)}px`
        }}
      >
        <iframe
          srcDoc={html}
          className="h-[1123px] w-[794px] border-0 pointer-events-none"
          title="Resume Preview"
          sandbox="allow-same-origin"
        />
      </div>
    </div>
  );
}
