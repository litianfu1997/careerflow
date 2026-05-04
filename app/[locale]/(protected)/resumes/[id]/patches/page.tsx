"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { LoadingPage } from "@/components/loading-page";

type Patch = {
  id: string;
  title: string;
  description: string | null;
  patchJson: any;
  status: string;
  createdAt: string;
  appliedAt: string | null;
};

export default function PatchesPage() {
  const params = useParams();
  const t = useTranslations("patches");
  const id = params.id as string;
  const [patches, setPatches] = useState<Patch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/resumes/${id}/patches`)
      .then((r) => r.json())
      .then((d) => setPatches(d.patches || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  async function applyPatch(patchId: string) {
    if (!confirm(t("confirmApply"))) return;
    const res = await fetch(`/api/resumes/${id}/patches/${patchId}/apply`, { method: "POST" });
    if (res.ok) {
      setPatches((prev) =>
        prev.map((p) => p.id === patchId ? { ...p, status: "applied", appliedAt: new Date().toISOString() } : p)
      );
    }
  }

  async function rejectPatch(patchId: string) {
    if (!confirm(t("confirmReject"))) return;
    const res = await fetch(`/api/resumes/${id}/patches/${patchId}/reject`, { method: "POST" });
    if (res.ok) {
      setPatches((prev) =>
        prev.map((p) => p.id === patchId ? { ...p, status: "rejected" } : p)
      );
    }
  }

  if (loading) return <LoadingPage text={t("loading")} />;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <Link
          href={`/resumes/${id}/edit`}
          className="text-sm text-[var(--primary)] hover:underline"
        >
          {t("backToEditor")}
        </Link>
      </div>

      {patches.length === 0 ? (
        <p className="text-sm text-[var(--muted-foreground)]">{t("noPatches")}</p>
      ) : (
        <div className="space-y-4">
          {patches.map((p) => (
            <div key={p.id} className="rounded-[var(--radius)] border border-[var(--border)] p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">{p.title}</h3>
                  <p className="text-xs text-[var(--muted-foreground)]">
                    {p.status} · {new Date(p.createdAt).toLocaleString()}
                    {p.appliedAt && ` · ${t("applied")} ${new Date(p.appliedAt).toLocaleString()}`}
                  </p>
                </div>
                {p.status === "pending_review" && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => applyPatch(p.id)}
                      className="rounded bg-green-600 px-3 py-1 text-xs text-white hover:bg-green-700"
                    >
                      {t("apply")}
                    </button>
                    <button
                      onClick={() => rejectPatch(p.id)}
                      className="rounded bg-red-600 px-3 py-1 text-xs text-white hover:bg-red-700"
                    >
                      {t("reject")}
                    </button>
                  </div>
                )}
              </div>
              {p.description && (
                <p className="text-sm text-[var(--muted-foreground)]">{p.description}</p>
              )}
              <details>
                <summary className="cursor-pointer text-xs text-[var(--muted-foreground)]">{t("viewOperations")}</summary>
                <pre className="mt-2 overflow-auto rounded bg-[var(--muted)] p-3 text-xs">
                  {JSON.stringify(p.patchJson, null, 2)}
                </pre>
              </details>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
