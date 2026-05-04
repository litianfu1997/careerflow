"use client";

import { useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, Plus, Copy, Eye, Trash2, Clock, FileText } from "lucide-react";
import { LoadingPage } from "@/components/loading-page";

type ResumeSummary = {
  id: string; title: string; status: string; updatedAt: string; createdAt: string;
};

export default function ResumesPage() {
  const t = useTranslations("resumes");
  const [resumes, setResumes] = useState<ResumeSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/resumes")
      .then((r) => r.json())
      .then((d) => setResumes(d.resumes || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function deleteResume(id: string) {
    if (!confirm(t("confirmDelete"))) return;
    await fetch(`/api/resumes/${id}`, { method: "DELETE" });
    setResumes((prev) => prev.filter((r) => r.id !== id));
  }

  async function duplicateResume(id: string) {
    const res = await fetch(`/api/resumes/${id}/duplicate`, { method: "POST" });
    if (res.ok) {
      const { resume } = await res.json();
      setResumes((prev) => [resume, ...prev]);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
          <p className="text-[var(--muted-foreground)]">Manage and organize your professional resumes.</p>
        </div>
        <Button asChild>
          <Link href="/resumes/new">
            <Plus className="mr-2 h-4 w-4" />
            {t("newResume")}
          </Link>
        </Button>
      </div>

      {loading ? (
        <LoadingPage text={t("loading")} />
      ) : resumes.length === 0 ? (
        <Card className="flex flex-col items-center justify-center border-dashed py-12 text-center">
          <div className="mb-4 rounded-full bg-[var(--muted)] p-3">
            <FileText className="h-6 w-6 text-[var(--muted-foreground)]" />
          </div>
          <p className="text-[var(--muted-foreground)]">{t("noResumes")}</p>
          <Button variant="link" asChild className="mt-2">
            <Link href="/resumes/new">{t("createFirst")}</Link>
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4">
          {resumes.map((r) => (
            <Card key={r.id} className="overflow-hidden">
              <CardContent className="flex items-center justify-between p-6">
                <div className="flex flex-1 items-center gap-4">
                  <div className="hidden rounded-lg bg-[var(--muted)] p-2 sm:block">
                    <FileText className="h-6 w-6 text-[var(--primary)]" />
                  </div>
                  <div>
                    <Link href={`/resumes/${r.id}/edit`} className="text-lg font-semibold hover:text-[var(--primary)]">
                      {r.title}
                    </Link>
                    <div className="mt-1 flex items-center gap-3 text-xs text-[var(--muted-foreground)]">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {t("updated")} {new Date(r.updatedAt).toLocaleDateString()}
                      </div>
                      <Badge variant={r.status === "published" ? "default" : "secondary"}>
                        {r.status}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => duplicateResume(r.id)} title={t("duplicate")}>
                    <Copy className="mr-2 h-3 w-3" />
                    <span className="hidden sm:inline">{t("duplicate")}</span>
                  </Button>
                  <Button variant="outline" size="sm" asChild title={t("preview")}>
                    <Link href={`/resumes/${r.id}/preview`}>
                      <Eye className="mr-2 h-3 w-3" />
                      <span className="hidden sm:inline">{t("preview")}</span>
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => deleteResume(r.id)} title={t("delete")} className="text-red-600 hover:bg-red-50 hover:text-red-600">
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
