import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  Layout,
  Shield,
  FileText,
  Download,
  GitMerge,
  Users,
  FileDown,
  Palette,
  ArrowRight,
  Zap,
  Check,
  MousePointerClick,
  Globe,
} from "lucide-react";

export default async function Home() {
  const t = await getTranslations("landing");

  const features = [
    {
      icon: Sparkles,
      color: "blue",
      key: "ai",
    },
    {
      icon: Layout,
      color: "emerald",
      key: "templates",
    },
    {
      icon: Shield,
      color: "violet",
      key: "security",
    },
  ] as const;

  const steps = [
    {
      step: 1,
      icon: FileText,
      color: "blue",
      key: "step1",
    },
    {
      step: 2,
      icon: Zap,
      color: "violet",
      key: "step2",
    },
    {
      step: 3,
      icon: Download,
      color: "emerald",
      key: "step3",
    },
  ] as const;

  const stats = [
    { icon: Palette, value: "3+", key: "templates", color: "blue" },
    { icon: FileDown, value: "10K+", key: "exports", color: "emerald" },
    { icon: GitMerge, value: "50K+", key: "patches", color: "violet" },
    { icon: Users, value: "5K+", key: "users", color: "amber" },
  ] as const;

  const colorMap = {
    blue: {
      iconBg: "bg-blue-100 dark:bg-blue-900/40",
      iconText: "text-blue-600 dark:text-blue-400",
      ring: "ring-blue-200 dark:ring-blue-800/50",
      gradient: "from-blue-500 to-blue-600",
      badge: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
    },
    emerald: {
      iconBg: "bg-emerald-100 dark:bg-emerald-900/40",
      iconText: "text-emerald-600 dark:text-emerald-400",
      ring: "ring-emerald-200 dark:ring-emerald-800/50",
      gradient: "from-emerald-500 to-emerald-600",
      badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
    },
    violet: {
      iconBg: "bg-violet-100 dark:bg-violet-900/40",
      iconText: "text-violet-600 dark:text-violet-400",
      ring: "ring-violet-200 dark:ring-violet-800/50",
      gradient: "from-violet-500 to-violet-600",
      badge: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
    },
    amber: {
      iconBg: "bg-amber-100 dark:bg-amber-900/40",
      iconText: "text-amber-600 dark:text-amber-400",
      ring: "ring-amber-200 dark:ring-amber-800/50",
      gradient: "from-amber-500 to-amber-600",
      badge: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
    },
  };

  return (
    <div className="flex flex-col">
      {/* ========== Hero Section ========== */}
      <section className="relative flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center overflow-hidden px-4 pb-8 pt-20">
        {/* Background gradient */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(59,130,246,0.12),transparent)]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_80%_50%,rgba(139,92,246,0.08),transparent)]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_20%_80%,rgba(16,185,129,0.06),transparent)]" />

        {/* Floating orbs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="animate-float absolute -right-24 top-[10%] h-72 w-72 rounded-full bg-blue-500/15 blur-3xl" />
          <div className="animate-float-delayed absolute -left-24 bottom-[15%] h-64 w-64 rounded-full bg-violet-500/15 blur-3xl" />
        </div>

        {/* Grid pattern */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage:
              "linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)",
            backgroundSize: "64px 64px",
          }}
        />

        <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col items-center text-center">
          {/* Badge */}
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-blue-200/60 bg-blue-50/80 px-5 py-2 text-sm font-medium text-blue-700 shadow-xs backdrop-blur-sm dark:border-blue-800/40 dark:bg-blue-950/50 dark:text-blue-300">
            <Sparkles className="h-4 w-4" />
            {t("subtitle")}
          </div>

          {/* Main heading */}
          <h1 className="max-w-4xl text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
            <span className="bg-linear-to-r from-blue-600 via-violet-600 to-cyan-500 bg-clip-text text-transparent">
              {t("title")}
            </span>
          </h1>

          {/* Subtitle */}
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-[var(--muted-foreground)] sm:text-xl">
            {t("heroSubtitle")}
          </p>

          {/* CTA Buttons */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Button
              asChild
              size="lg"
              className="group h-13 rounded-full px-8 text-base font-semibold shadow-lg shadow-blue-500/20 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/30 hover:-translate-y-0.5"
            >
              <Link href="/register">
                {t("register")}
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="h-13 rounded-full border-[var(--border)] bg-[var(--card)]/80 px-8 text-base font-semibold backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:bg-[var(--card)]"
            >
              <Link href="/login">{t("login")}</Link>
            </Button>
          </div>

          {/* Product Preview - Browser Mockup */}
          <div className="relative mx-auto mt-16 w-full max-w-4xl">
            {/* Glow behind the mockup */}
            <div className="pointer-events-none absolute inset-0 -bottom-8 rounded-2xl bg-blue-500/10 blur-3xl" />

            <div className="relative overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-2xl shadow-black/10">
              {/* Browser chrome */}
              <div className="flex items-center gap-2 border-b border-[var(--border)] bg-[var(--muted)] px-4 py-3">
                <div className="flex gap-1.5">
                  <div className="h-3 w-3 rounded-full bg-red-400" />
                  <div className="h-3 w-3 rounded-full bg-amber-400" />
                  <div className="h-3 w-3 rounded-full bg-green-400" />
                </div>
                <div className="ml-3 flex-1">
                  <div className="mx-auto flex h-7 max-w-md items-center rounded-md bg-[var(--background)] px-3 text-xs text-[var(--muted-foreground)]">
                    <Globe className="mr-2 h-3 w-3" />
                    careerflow.app/dashboard
                  </div>
                </div>
              </div>

              {/* App content mockup */}
              <div className="grid grid-cols-12 gap-0">
                {/* Sidebar */}
                <div className="col-span-3 border-r border-[var(--border)] bg-[var(--muted)]/50 p-4 hidden sm:block">
                  <div className="mb-4 h-6 w-24 rounded bg-[var(--primary)]/15" />
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 rounded-md bg-[var(--primary)]/10 px-3 py-2">
                      <div className="h-4 w-4 rounded bg-[var(--primary)]/30" />
                      <div className="h-3 w-16 rounded bg-[var(--foreground)]/20" />
                    </div>
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="flex items-center gap-2 px-3 py-2">
                        <div className="h-4 w-4 rounded bg-[var(--muted-foreground)]/20" />
                        <div className="h-3 w-20 rounded bg-[var(--muted-foreground)]/15" />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Main content area */}
                <div className="col-span-12 sm:col-span-9 p-6">
                  <div className="mb-6 flex items-center justify-between">
                    <div>
                      <div className="mb-2 h-5 w-32 rounded bg-[var(--foreground)]/20" />
                      <div className="h-3 w-48 rounded bg-[var(--muted-foreground)]/15" />
                    </div>
                    <div className="h-9 w-28 rounded-lg bg-[var(--primary)]/20" />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-3">
                    {[
                      { color: "bg-blue-500/15", accent: "bg-blue-500/30" },
                      { color: "bg-violet-500/15", accent: "bg-violet-500/30" },
                      { color: "bg-emerald-500/15", accent: "bg-emerald-500/30" },
                    ].map((card, i) => (
                      <div key={i} className="rounded-lg border border-[var(--border)] p-4">
                        <div className={`mb-3 h-10 w-10 rounded-lg ${card.color}`} />
                        <div className="mb-2 h-3 w-3/4 rounded bg-[var(--foreground)]/15" />
                        <div className="mb-1 h-2 w-full rounded bg-[var(--muted-foreground)]/10" />
                        <div className="h-2 w-2/3 rounded bg-[var(--muted-foreground)]/10" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom fade */}
            <div className="pointer-events-none absolute inset-x-0 -bottom-1 h-24 bg-gradient-to-t from-[var(--background)] to-transparent" />
          </div>
        </div>
      </section>

      {/* ========== Features Section ========== */}
      <section className="relative px-4 py-28 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          {/* Section header */}
          <div className="mx-auto mb-20 max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              {t("features.title")}
            </h2>
            <div className="mx-auto mt-3 h-1 w-12 rounded-full bg-linear-to-r from-blue-500 to-violet-500" />
            <p className="mt-5 text-lg text-[var(--muted-foreground)]">
              {t("features.subtitle")}
            </p>
          </div>

          {/* Feature cards */}
          <div className="grid gap-8 md:grid-cols-3">
            {features.map(({ icon: Icon, color, key }) => (
              <div
                key={key}
                className="group relative rounded-2xl border border-[var(--border)] bg-[var(--card)] p-8 transition-all duration-500 hover:border-transparent hover:shadow-2xl hover:shadow-black/5"
              >
                {/* Gradient border on hover */}
                <div className="absolute -inset-px rounded-2xl bg-gradient-to-b from-transparent via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100 group-hover:from-blue-500/20 group-hover:via-violet-500/10 group-hover:to-emerald-500/20" />

                <div className="relative">
                  <div
                    className={`mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl ${colorMap[color].iconBg} ${colorMap[color].iconText} transition-transform duration-300 group-hover:scale-110`}
                  >
                    <Icon className="h-7 w-7" />
                  </div>
                  <h3 className="mb-3 text-xl font-bold tracking-tight">
                    {t(`features.${key}.title`)}
                  </h3>
                  <p className="leading-relaxed text-[var(--muted-foreground)]">
                    {t(`features.${key}.desc`)}
                  </p>

                  {/* Learn more link */}
                  <div className="mt-5 inline-flex items-center gap-1 text-sm font-medium text-[var(--primary)] opacity-0 transition-all duration-300 group-hover:opacity-100">
                    <MousePointerClick className="h-4 w-4" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== How It Works Section ========== */}
      <section className="relative overflow-hidden bg-[var(--muted)]/40 px-4 py-28 sm:px-6 lg:px-8">
        {/* Background decoration */}
        <div className="pointer-events-none absolute left-1/2 top-0 h-px w-3/4 -translate-x-1/2 bg-gradient-to-r from-transparent via-[var(--border)] to-transparent" />

        <div className="mx-auto max-w-7xl">
          {/* Section header */}
          <div className="mx-auto mb-20 max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              {t("howItWorks.title")}
            </h2>
            <div className="mx-auto mt-3 h-1 w-12 rounded-full bg-gradient-to-r from-blue-500 to-violet-500" />
            <p className="mt-5 text-lg text-[var(--muted-foreground)]">
              {t("howItWorks.subtitle")}
            </p>
          </div>

          {/* Steps */}
          <div className="relative grid gap-8 md:grid-cols-3">
            {/* Connecting line (desktop) */}
            <div className="absolute left-[16.67%] right-[16.67%] top-[4.5rem] hidden h-px bg-[var(--border)] md:block" />

            {steps.map(({ step, icon: Icon, color, key }) => {
              const cm = colorMap[color as keyof typeof colorMap];
              return (
                <div
                  key={key}
                  className="group relative flex flex-col items-center rounded-2xl border border-[var(--border)] bg-[var(--card)] p-8 text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                >
                  {/* Step badge */}
                  <div
                    className={`mb-5 flex h-16 w-16 items-center justify-center rounded-2xl ${cm.iconBg} ${cm.iconText} shadow-sm ring-4 ring-[var(--card)] transition-transform duration-300 group-hover:scale-105`}
                  >
                    <Icon className="h-8 w-8" />
                  </div>

                  <span
                    className={`mb-3 inline-flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-b ${cm.gradient} text-xs font-bold text-white shadow-sm`}
                  >
                    {step}
                  </span>

                  <h3 className="mb-3 text-xl font-bold tracking-tight">
                    {t(`howItWorks.${key}.title`)}
                  </h3>
                  <p className="leading-relaxed text-[var(--muted-foreground)]">
                    {t(`howItWorks.${key}.desc`)}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ========== Stats Section ========== */}
      <section className="relative overflow-hidden px-4 py-28 sm:px-6 lg:px-8">
        {/* Background accents */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-0 top-0 h-px w-full bg-gradient-to-r from-transparent via-[var(--border)] to-transparent" />
          <div className="absolute bottom-0 left-0 h-px w-full bg-gradient-to-r from-transparent via-[var(--border)] to-transparent" />
        </div>

        <div className="relative mx-auto max-w-6xl">
          {/* Section header */}
          <div className="mx-auto mb-16 max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              {t("stats.title")}
            </h2>
            <div className="mx-auto mt-3 h-1 w-12 rounded-full bg-gradient-to-r from-blue-500 to-violet-500" />
            <p className="mt-5 text-lg text-[var(--muted-foreground)]">
              {t("stats.subtitle")}
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map(({ icon: Icon, value, key, color }) => {
              const cm = colorMap[color as keyof typeof colorMap];
              return (
                <div
                  key={key}
                  className="group relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] p-8 text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                >
                  {/* Top accent bar */}
                  <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${cm.gradient}`} />

                  <div className="relative">
                    <div
                      className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl ${cm.iconBg} ${cm.iconText} transition-transform duration-300 group-hover:scale-110`}
                    >
                      <Icon className="h-7 w-7" />
                    </div>
                    <div className="text-4xl font-extrabold tracking-tight">
                      {value}
                    </div>
                    <div className="mt-2 text-sm font-medium text-[var(--muted-foreground)]">
                      {t(`stats.${key}`)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ========== CTA Section ========== */}
      <section className="px-4 py-28 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-blue-700 to-violet-700 px-8 py-20 text-center shadow-2xl shadow-blue-900/20 sm:px-16">
            {/* Decorative elements */}
            <div className="pointer-events-none absolute inset-0 opacity-[0.07]">
              <div
                className="h-full w-full"
                style={{
                  backgroundImage:
                    "radial-gradient(circle, white 1px, transparent 1px)",
                  backgroundSize: "28px 28px",
                }}
              />
            </div>
            <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-cyan-400/15 blur-3xl" />
            <div className="pointer-events-none absolute left-1/2 top-1/2 h-48 w-48 -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-400/10 blur-3xl" />

            <div className="relative">
              {/* Check icon */}
              <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-white/15 ring-1 ring-white/20">
                <Check className="h-7 w-7 text-white" />
              </div>

              <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
                {t("cta.title")}
              </h2>

              <div className="mt-8">
                <Button
                  asChild
                  size="lg"
                  className="group h-13 rounded-full bg-white px-10 text-base font-semibold text-blue-700 shadow-lg transition-all duration-300 hover:bg-white/95 hover:shadow-xl hover:-translate-y-0.5"
                >
                  <Link href="/register">
                    {t("cta.button")}
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
