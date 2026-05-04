import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateApiKey } from "@/lib/api-key";
import { validateScopes, DEFAULT_SCOPES } from "@/lib/permissions";
import { writeAuditLog } from "@/lib/audit";

export async function GET() {
  const auth = await getAuthUser();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const keys = await prisma.apiKey.findMany({
    where: { userId: auth.userId },
    select: {
      id: true, name: true, keyPrefix: true, scopes: true,
      status: true, lastUsedAt: true, expiresAt: true, createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ keys });
}

export async function POST(req: Request) {
  const auth = await getAuthUser();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const name = body.name || "Default Key";
  const scopes = body.scopes || DEFAULT_SCOPES;

  const { valid, invalid } = validateScopes(scopes);
  if (!valid) {
    return NextResponse.json({ error: `Invalid scopes: ${invalid.join(", ")}` }, { status: 400 });
  }

  const { plainKey, keyHash, keyPrefix } = generateApiKey();

  const apiKey = await prisma.apiKey.create({
    data: { userId: auth.userId, name, keyHash, keyPrefix, scopes },
  });

  await writeAuditLog({
    userId: auth.userId,
    action: "create_api_key",
    resource: `api-key/${apiKey.id}`,
  });

  return NextResponse.json({
    key: {
      id: apiKey.id,
      name: apiKey.name,
      plainKey, // Only shown once
      keyPrefix: apiKey.keyPrefix,
      scopes: apiKey.scopes,
      createdAt: apiKey.createdAt,
    },
  }, { status: 201 });
}
