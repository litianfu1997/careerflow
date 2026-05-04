"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

type UserView = { id: string; email: string; nickname: string | null; role: string; createdAt: string };
type ResumeView = { id: string; title: string; userId: string; status: string; createdAt: string; updatedAt: string };
type TemplateView = { id: string; name: string; displayName: string; description: string | null; isBuiltin: boolean };

export default function AdminPage() {
  const t = useTranslations("admin");
  const [tab, setTab] = useState<"users" | "resumes" | "templates">("users");
  const [users, setUsers] = useState<UserView[]>([]);
  const [resumes, setResumes] = useState<ResumeView[]>([]);
  const [templates, setTemplates] = useState<TemplateView[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const endpoint = tab === "users" ? "/api/admin/users" : tab === "resumes" ? "/api/admin/resumes" : "/api/admin/templates";
    fetch(endpoint)
      .then((r) => r.json())
      .then((d) => {
        if (tab === "users") setUsers(d.users || []);
        else if (tab === "resumes") setResumes(d.resumes || []);
        else setTemplates(d.templates || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [tab]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t("title")}</h1>

      <div className="flex gap-2 border-b border-[var(--border)]">
        {(["users", "resumes", "templates"] as const).map((tabKey) => (
          <button
            key={tabKey}
            onClick={() => setTab(tabKey)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === tabKey
                ? "border-[var(--primary)] text-[var(--primary)]"
                : "border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            }`}
          >
            {t(`tabs.${tabKey}`)}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-[var(--muted-foreground)]">{t("loading")}</p>
      ) : tab === "users" ? (
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)]">
                <th className="py-2 text-left font-medium">{t("tableHeaders.email")}</th>
                <th className="py-2 text-left font-medium">{t("tableHeaders.nickname")}</th>
                <th className="py-2 text-left font-medium">{t("tableHeaders.role")}</th>
                <th className="py-2 text-left font-medium">{t("tableHeaders.created")}</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-[var(--border)]">
                  <td className="py-2">{u.email}</td>
                  <td className="py-2">{u.nickname || "-"}</td>
                  <td className="py-2"><span className="rounded bg-[var(--muted)] px-1.5 py-0.5 text-xs">{u.role}</span></td>
                  <td className="py-2 text-[var(--muted-foreground)]">{new Date(u.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : tab === "resumes" ? (
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)]">
                <th className="py-2 text-left font-medium">{t("tableHeaders.title")}</th>
                <th className="py-2 text-left font-medium">{t("tableHeaders.status")}</th>
                <th className="py-2 text-left font-medium">{t("tableHeaders.updated")}</th>
              </tr>
            </thead>
            <tbody>
              {resumes.map((r) => (
                <tr key={r.id} className="border-b border-[var(--border)]">
                  <td className="py-2">{r.title}</td>
                  <td className="py-2"><span className="rounded bg-[var(--muted)] px-1.5 py-0.5 text-xs">{r.status}</span></td>
                  <td className="py-2 text-[var(--muted-foreground)]">{new Date(r.updatedAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)]">
                <th className="py-2 text-left font-medium">{t("tableHeaders.name")}</th>
                <th className="py-2 text-left font-medium">{t("tableHeaders.displayName")}</th>
                <th className="py-2 text-left font-medium">{t("tableHeaders.builtIn")}</th>
                <th className="py-2 text-left font-medium">{t("tableHeaders.description")}</th>
              </tr>
            </thead>
            <tbody>
              {templates.map((tpl) => (
                <tr key={tpl.id} className="border-b border-[var(--border)]">
                  <td className="py-2 font-mono text-xs">{tpl.name}</td>
                  <td className="py-2">{tpl.displayName}</td>
                  <td className="py-2">{tpl.isBuiltin ? t("yes") : t("no")}</td>
                  <td className="py-2 text-[var(--muted-foreground)]">{tpl.description || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
