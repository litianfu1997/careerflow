import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, FileText, Plus } from "lucide-react";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ResumesActions } from "./resumes-actions";

export default async function ResumesPage() {
  const t = await getTranslations("resumes");
  const auth = await getAuthUser();

  const resumes = auth
    ? await prisma.resume.findMany({
        where: { userId: auth.userId },
        orderBy: { updatedAt: "desc" },
        select: {
          id: true, title: true, status: true, updatedAt: true, createdAt: true,
        },
      })
    : [];

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

      {resumes.length === 0 ? (
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
                <ResumesActions resumeId={r.id} t={{ duplicate: t("duplicate"), preview: t("preview"), delete: t("delete"), confirmDelete: t("confirmDelete") }} />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
