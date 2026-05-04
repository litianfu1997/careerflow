"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { LoadingPage } from "@/components/loading-page";

type ApiKeyView = {
  id: string; name: string; keyPrefix: string; scopes: string[];
  status: string; lastUsedAt: string | null; expiresAt: string | null; createdAt: string;
};

export default function AgentSettingsPage() {
  const t = useTranslations("settings");
  const [keys, setKeys] = useState<ApiKeyView[]>([]);
  const [loading, setLoading] = useState(true);
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyScopes, setNewKeyScopes] = useState<string[]>(["resume:read", "resume:write_patch", "resume:export", "resume:version"]);
  const [revealedKey, setRevealedKey] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const allScopes = [
    { value: "resume:read", default: true },
    { value: "resume:write_patch", default: true },
    { value: "resume:export", default: true },
    { value: "resume:version", default: true },
    { value: "resume:apply_patch", default: false },
    { value: "resume:delete", default: false },
    { value: "profile:write", default: false },
  ];

  useEffect(() => {
    fetch("/api/settings/api-keys")
      .then((r) => r.json())
      .then((d) => setKeys(d.keys || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function createKey() {
    setCreating(true);
    try {
      const res = await fetch("/api/settings/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newKeyName || "API Key", scopes: newKeyScopes }),
      });
      if (res.ok) {
        const { key } = await res.json();
        setRevealedKey(key.plainKey);
        setNewKeyName("");
        const updated = await fetch("/api/settings/api-keys").then((r) => r.json());
        setKeys(updated.keys || []);
      }
    } finally {
      setCreating(false);
    }
  }

  async function revokeKey(id: string) {
    if (!confirm(t("confirmRevoke"))) return;
    await fetch(`/api/settings/api-keys/${id}`, { method: "DELETE" });
    setKeys((prev) => prev.map((k) => k.id === id ? { ...k, status: "revoked" } : k));
  }

  function toggleScope(scope: string) {
    setNewKeyScopes((prev) =>
      prev.includes(scope) ? prev.filter((s) => s !== scope) : [...prev, scope]
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">{t("title")}</h1>
      <p className="text-sm text-[var(--muted-foreground)]">
        {t("description")}
      </p>

      {revealedKey && (
        <div className="rounded-[var(--radius)] border-2 border-green-500 bg-green-50 p-4">
          <p className="text-sm font-medium text-green-800">{t("created")}</p>
          <code className="mt-2 block break-all rounded bg-white p-2 text-sm">{revealedKey}</code>
          <button
            onClick={() => setRevealedKey(null)}
            className="mt-2 text-xs text-green-700 hover:underline"
          >
            {t("dismiss")}
          </button>
        </div>
      )}

      <div className="rounded-[var(--radius)] border border-[var(--border)] p-4 space-y-4">
        <h2 className="font-semibold">{t("createNewKey")}</h2>
        <div>
          <label className="mb-1 block text-sm font-medium">{t("name")}</label>
          <input
            value={newKeyName}
            onChange={(e) => setNewKeyName(e.target.value)}
            placeholder="My API Key"
            autoComplete="off"
            maxLength={50}
            className="w-full rounded-[var(--radius)] border border-[var(--border)] px-3 py-2 text-sm outline-none focus:border-[var(--primary)]"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">{t("scopes")}</label>
          <div className="space-y-1">
            {allScopes.map((s) => (
              <label key={s.value} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={newKeyScopes.includes(s.value)}
                  onChange={() => toggleScope(s.value)}
                />
                <span>{t(`scopesList.${s.value}`)}</span>
              </label>
            ))}
          </div>
        </div>
        <button
          onClick={createKey}
          disabled={creating || newKeyScopes.length === 0}
          className="rounded-[var(--radius)] bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-foreground)] hover:opacity-90 disabled:opacity-50"
        >
          {creating ? t("creating") : t("createKey")}
        </button>
      </div>

      <div className="space-y-2">
        <h2 className="font-semibold">{t("yourKeys")}</h2>
        {loading ? (
          <LoadingPage text={t("loading")} />
        ) : keys.length === 0 ? (
          <p className="text-sm text-[var(--muted-foreground)]">{t("noKeys")}</p>
        ) : (
          keys.map((k) => (
            <div key={k.id} className="flex items-center justify-between rounded-[var(--radius)] border border-[var(--border)] p-3">
              <div>
                <p className="font-medium text-sm">{k.name}</p>
                <p className="text-xs text-[var(--muted-foreground)]">
                  {k.keyPrefix}... · {k.status} · {t("created")} {new Date(k.createdAt).toLocaleDateString()}
                  {k.lastUsedAt && ` · ${t("lastUsed")} ${new Date(k.lastUsedAt).toLocaleDateString()}`}
                </p>
                <div className="mt-1 flex flex-wrap gap-1">
                  {k.scopes.map((s) => (
                    <span key={s} className="rounded bg-[var(--muted)] px-1.5 py-0.5 text-xs">{s}</span>
                  ))}
                </div>
              </div>
              {k.status === "active" && (
                <button
                  onClick={() => revokeKey(k.id)}
                  className="text-xs text-red-500 hover:underline"
                >
                  {t("revoke")}
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
