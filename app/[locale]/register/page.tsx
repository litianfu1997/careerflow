"use client";

import { useState } from "react";
import { useRouter, Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function RegisterPage() {
  const router = useRouter();
  const t = useTranslations("auth");
  const [form, setForm] = useState({ email: "", password: "", confirmPassword: "", nickname: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        const msgs = Object.values(data.error || {}).flat().join("; ");
        setError(msgs || t("registrationFailed"));
        return;
      }
      router.push("/dashboard");
    } catch {
      setError(t("networkError"));
    } finally {
      setLoading(false);
    }
  }

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">{t("registerTitle")}</CardTitle>
          <CardDescription>Join CareerFlow today to start managing your resumes</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div className="rounded-[var(--radius)] bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
            )}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">{t("email")}</label>
              <Input
                type="email"
                placeholder="name@example.com"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">{t("nickname")}</label>
              <Input
                placeholder="Optional"
                value={form.nickname}
                onChange={(e) => update("nickname", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">{t("password")}</label>
              <Input
                type="password"
                value={form.password}
                onChange={(e) => update("password", e.target.value)}
                required
                minLength={6}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">{t("confirmPassword")}</label>
              <Input
                type="password"
                value={form.confirmPassword}
                onChange={(e) => update("confirmPassword", e.target.value)}
                required
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? t("creatingAccount") : t("createAccount")}
            </Button>
            <p className="text-center text-sm text-[var(--muted-foreground)]">
              {t("hasAccount")}{" "}
              <Link href="/login" className="text-[var(--primary)] hover:underline">{t("signInLink")}</Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
