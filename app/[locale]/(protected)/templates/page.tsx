"use client";

import { useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Edit, Eye, FileText, Lock, CopyPlus } from "lucide-react";
import { LoadingPage } from "@/components/loading-page";

type TemplateSummary = {
  id: string;
  name: string;
  displayName: string;
  description: string | null;
  isBuiltin: boolean;
  createdAt: string;
};

export default function TemplatesPage() {
  const t = useTranslations("templates");
  const [templates, setTemplates] = useState<TemplateSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/templates")
      .then((r) => r.json())
      .then((d) => setTemplates(d.templates || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function deleteTemplate(id: string) {
    if (!confirm(t("confirmDelete"))) return;
    const res = await fetch(`/api/user-templates/${id}`, { method: "DELETE" });
    if (res.ok) {
      setTemplates((prev) => prev.filter((t) => t.id !== id));
    }
  }

  if (loading) {
    return <LoadingPage text={t("loading")} />;
  }

  const builtinTemplates = templates.filter((t) => t.isBuiltin);
  const customTemplates = templates.filter((t) => !t.isBuiltin);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
          <p className="text-[var(--muted-foreground)]">{t("description")}</p>
        </div>
        <Button asChild>
          <Link href="/templates/new">
            <Plus className="mr-2 h-4 w-4" />
            {t("createNew")}
          </Link>
        </Button>
      </div>

      {builtinTemplates.length > 0 && (
        <div>
          <h2 className="mb-4 text-lg font-semibold flex items-center gap-2">
            <Lock className="h-4 w-4 text-[var(--muted-foreground)]" />
            {t("builtin")}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {builtinTemplates.map((template) => (
              <Card key={template.id} className="overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-[var(--primary)]" />
                      <h3 className="font-semibold">{template.displayName}</h3>
                    </div>
                    <Badge variant="secondary">{t("builtin")}</Badge>
                  </div>
                  <p className="text-sm text-[var(--muted-foreground)] mb-4">
                    {template.description}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/templates/new?base=${template.id}`}>
                        <CopyPlus className="mr-2 h-3 w-3" />
                        {t("useAsBase")}
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/templates/${template.id}/preview`}>
                        <Eye className="mr-2 h-3 w-3" />
                        {t("previewTemplate")}
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      <div>
        <h2 className="mb-4 text-lg font-semibold">{t("custom")}</h2>
        {customTemplates.length === 0 ? (
          <Card className="flex flex-col items-center justify-center border-dashed py-12 text-center">
            <div className="mb-4 rounded-full bg-[var(--muted)] p-3">
              <FileText className="h-6 w-6 text-[var(--muted-foreground)]" />
            </div>
            <p className="text-[var(--muted-foreground)]">{t("noTemplates")}</p>
            <Button variant="link" asChild className="mt-2">
              <Link href="/templates/new">{t("createFirst")}</Link>
            </Button>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {customTemplates.map((template) => (
              <Card key={template.id} className="overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-[var(--primary)]" />
                      <h3 className="font-semibold">{template.displayName}</h3>
                    </div>
                    <Badge>{t("custom")}</Badge>
                  </div>
                  <p className="text-sm text-[var(--muted-foreground)] mb-4">
                    {template.description}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/templates/${template.id}/edit`}>
                        <Edit className="mr-2 h-3 w-3" />
                        {t("editTemplate")}
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/templates/${template.id}/preview`}>
                        <Eye className="mr-2 h-3 w-3" />
                        {t("previewTemplate")}
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteTemplate(template.id)}
                      className="text-red-600 hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
