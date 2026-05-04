"use client";

import { useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Plus, Clock, CheckCircle, FileEdit } from "lucide-react";
import { LoadingPage } from "@/components/loading-page";

type ResumeSummary = {
  id: string; title: string; status: string; updatedAt: string;
};

export default function DashboardPage() {
  const t = useTranslations("dashboard");
  const [resumes, setResumes] = useState<ResumeSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/resumes")
      .then((r) => r.json())
      .then((d) => setResumes(d.resumes || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
          <p className="text-[var(--muted-foreground)]">Welcome back to CareerFlow.</p>
        </div>
        <Button asChild>
          <Link href="/resumes/new">
            <Plus className="mr-2 h-4 w-4" />
            {t("newResume")}
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("totalResumes")}</CardTitle>
            <FileText className="h-4 w-4 text-[var(--muted-foreground)]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{resumes.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("drafts")}</CardTitle>
            <FileEdit className="h-4 w-4 text-[var(--muted-foreground)]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{resumes.filter((r) => r.status === "draft").length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("published")}</CardTitle>
            <CheckCircle className="h-4 w-4 text-[var(--muted-foreground)]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{resumes.filter((r) => r.status === "published").length}</div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight">{t("recentResumes")}</h2>
        {loading ? (
          <LoadingPage text={t("loading")} />
        ) : resumes.length === 0 ? (
          <div className="flex h-32 flex-col items-center justify-center rounded-[var(--radius)] border border-dashed border-[var(--border)] text-center">
            <p className="text-sm text-[var(--muted-foreground)]">{t("noResumes")}</p>
            <Button variant="link" asChild>
              <Link href="/resumes/new">{t("createOne")}</Link>
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {resumes.slice(0, 6).map((r) => (
              <Card key={r.id} className="group transition-all hover:border-[var(--primary)] hover:shadow-md">
                <Link href={`/resumes/${r.id}/edit`}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <Badge variant={r.status === "published" ? "default" : "secondary"}>
                        {r.status}
                      </Badge>
                      <div className="flex items-center text-xs text-[var(--muted-foreground)]">
                        <Clock className="mr-1 h-3 w-3" />
                        {new Date(r.updatedAt).toLocaleDateString()}
                      </div>
                    </div>
                    <CardTitle className="mt-2 line-clamp-1 group-hover:text-[var(--primary)]">{r.title}</CardTitle>
                  </CardHeader>
                </Link>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
