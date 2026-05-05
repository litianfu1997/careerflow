"use client";

import { usePathname } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

export function Footer() {
  const t = useTranslations("footer");
  const pathname = usePathname();
  const isWorkbenchPage =
    /^\/resumes\/[^/]+\/(edit|preview)$/.test(pathname) ||
    pathname === "/templates/new" ||
    /^\/templates\/[^/]+\/(edit|preview)$/.test(pathname);

  if (isWorkbenchPage) return null;

  return (
    <footer className="border-t border-[var(--border)] bg-[var(--background)]">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <p className="text-sm text-[var(--muted-foreground)]">
            © {new Date().getFullYear()} CareerFlow. {t("allRightsReserved")}
          </p>
          <div className="flex gap-6 text-sm text-[var(--muted-foreground)]">
            <a href="#" className="hover:text-[var(--foreground)]">{t("privacy")}</a>
            <a href="#" className="hover:text-[var(--foreground)]">{t("terms")}</a>
            <a href="https://github.com" className="hover:text-[var(--foreground)]">GitHub</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
