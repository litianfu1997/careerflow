"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRouter, usePathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

export function LanguageSwitcher() {
  const locale = useLocale();
  const t = useTranslations("languageSwitcher");
  const router = useRouter();
  const pathname = usePathname();

  function switchLocale(newLocale: string) {
    router.push(pathname, { locale: newLocale });
  }

  return (
    <div className="flex items-center gap-1">
      {routing.locales.map((l) => (
        <button
          key={l}
          onClick={() => switchLocale(l)}
          className={`rounded px-2 py-0.5 text-xs ${
            locale === l
              ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
              : "hover:bg-[var(--muted)]"
          }`}
        >
          {t(l)}
        </button>
      ))}
    </div>
  );
}
