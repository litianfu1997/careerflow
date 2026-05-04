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

export async function validateApiKey(plainKey: string): Promise<{
  valid: boolean;
  apiKey?: {
    id: string;
    userId: string;
    scopes: string[];
    status: string;
    expiresAt: Date | null;
  };
}> {
  const keyHash = hashKey(plainKey);
  const apiKey = await prisma.apiKey.findUnique({
    where: { keyHash },
    select: { id: true, userId: true, scopes: true, status: true, expiresAt: true },
  });

  if (!apiKey) return { valid: false };
  if (apiKey.status !== "active") return { valid: false };
  if (apiKey.expiresAt && apiKey.expiresAt < new Date()) return { valid: false };

  await prisma.apiKey.update({
    where: { id: apiKey.id },
    data: { lastUsedAt: new Date() },
  });

  return { valid: true, apiKey };
}
