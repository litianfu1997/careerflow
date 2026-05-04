"use client";

import { Link, useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { LanguageSwitcher } from "./language-switcher";

type NavUser = { id: string; email: string; nickname: string | null; role: string };

export function Header() {
  const router = useRouter();
  const t = useTranslations("header");
  const [user, setUser] = useState<NavUser | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d?.user && setUser(d.user))
      .catch(() => {});
  }, []);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <header className="border-b border-[var(--border)] bg-[var(--background)]">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        <Link href="/dashboard" className="text-lg font-bold">
          CareerFlow
        </Link>
        {user ? (
          <div className="flex items-center gap-4">
            <nav className="flex gap-3 text-sm">
              <Link href="/dashboard" className="hover:text-[var(--primary)]">{t("dashboard")}</Link>
              <Link href="/resumes" className="hover:text-[var(--primary)]">{t("resumes")}</Link>
              <Link href="/templates" className="hover:text-[var(--primary)]">{t("templates")}</Link>
              <Link href="/settings/agent" className="hover:text-[var(--primary)]">{t("apiKeys")}</Link>
              {user.role === "admin" && (
                <Link href="/admin" className="hover:text-[var(--primary)]">{t("admin")}</Link>
              )}
            </nav>
            <LanguageSwitcher />
            <span className="text-sm text-[var(--muted-foreground)]">
              {user.nickname || user.email}
            </span>
            <button
              onClick={logout}
              className="text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            >
              {t("logout")}
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <Link href="/login" className="text-sm hover:text-[var(--primary)]">{t("signIn")}</Link>
            <Link href="/register" className="text-sm hover:text-[var(--primary)]">{t("register")}</Link>
          </div>
        )}
      </div>
    </header>
  );
}
