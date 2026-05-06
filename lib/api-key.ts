import crypto from "crypto";
import { prisma } from "./prisma";

const API_KEY_SECRET = process.env.API_KEY_SECRET || "dev-secret";
const KEY_PREFIX = "cf_live_";

export function generateApiKey(): { plainKey: string; keyHash: string; keyPrefix: string } {
  const raw = crypto.randomBytes(32).toString("hex");
  const plainKey = `${KEY_PREFIX}${raw}`;
  const keyHash = hashKey(plainKey);
  const keyPrefix = plainKey.slice(0, 12);
  return { plainKey, keyHash, keyPrefix };
}

export function hashKey(key: string): string {
  return crypto.createHash("sha256").update(key + API_KEY_SECRET).digest("hex");
}

type ApiKeyValidationResult = {
  valid: boolean;
  apiKey?: { id: string; userId: string; scopes: string[]; status: string; expiresAt: Date | null };
};

const keyCache = new Map<string, { result: ApiKeyValidationResult; expiresAt: number }>();
const keyHashById = new Map<string, string>();
const KEY_CACHE_TTL = 30_000;
const MAX_KEY_CACHE_SIZE = 1000;

export function invalidateApiKeyCache(apiKeyId: string) {
  const keyHash = keyHashById.get(apiKeyId);
  if (!keyHash) return;
  keyCache.delete(keyHash);
  keyHashById.delete(apiKeyId);
}

export async function validateApiKey(plainKey: string): Promise<ApiKeyValidationResult> {
  const keyHash = hashKey(plainKey);

  const cached = keyCache.get(keyHash);
  if (cached && Date.now() < cached.expiresAt) {
    return cached.result;
  }
  if (cached) keyCache.delete(keyHash);

  const apiKey = await prisma.apiKey.findUnique({
    where: { keyHash },
    select: { id: true, userId: true, scopes: true, status: true, expiresAt: true },
  });

  if (!apiKey) return { valid: false };
  if (apiKey.status !== "active") return { valid: false };
  if (apiKey.expiresAt && apiKey.expiresAt < new Date()) return { valid: false };

  const result = { valid: true, apiKey };
  const cacheExpiresAt = Math.min(
    Date.now() + KEY_CACHE_TTL,
    apiKey.expiresAt?.getTime() ?? Number.POSITIVE_INFINITY,
  );
  keyCache.set(keyHash, { result, expiresAt: cacheExpiresAt });
  keyHashById.set(apiKey.id, keyHash);

  if (keyCache.size > MAX_KEY_CACHE_SIZE) {
    const now = Date.now();
    for (const [k, v] of keyCache) {
      if (now >= v.expiresAt) {
        keyCache.delete(k);
        if (v.result.apiKey) keyHashById.delete(v.result.apiKey.id);
      }
    }
  }

  prisma.apiKey.update({
    where: { id: apiKey.id },
    data: { lastUsedAt: new Date() },
  }).catch(() => {});

  return result;
}
