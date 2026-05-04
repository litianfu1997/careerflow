import { NextResponse } from "next/server";
import { validateApiKey } from "./api-key";
import { writeAuditLog } from "./audit";

export async function authenticateAgent(request: Request): Promise<{
  authorized: boolean;
  response?: NextResponse;
  apiKey?: { id: string; userId: string; scopes: string[] };
}> {
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return {
      authorized: false,
      response: NextResponse.json({ error: "Missing or invalid Authorization header" }, { status: 401 }),
    };
  }

  const plainKey = authHeader.slice(7);
  const result = await validateApiKey(plainKey);

  if (!result.valid || !result.apiKey) {
    return {
      authorized: false,
      response: NextResponse.json({ error: "Invalid or revoked API key" }, { status: 401 }),
    };
  }

  return { authorized: true, apiKey: result.apiKey };
}

export async function requireScope(
  request: Request,
  _scopes: string[],
  requiredScope: string,
  action: string
): Promise<{
  allowed: boolean;
  response?: NextResponse;
  apiKey?: { id: string; userId: string; scopes: string[] };
}> {
  const auth = await authenticateAgent(request);
  if (!auth.authorized || !auth.apiKey) return { allowed: false, response: auth.response };

  if (!auth.apiKey.scopes.includes(requiredScope)) {
    await writeAuditLog({
      userId: auth.apiKey.userId,
      apiKeyId: auth.apiKey.id,
      action: `scope_denied:${action}`,
      resource: request.url,
    });
    return {
      allowed: false,
      apiKey: auth.apiKey,
      response: NextResponse.json({ error: `Missing required scope: ${requiredScope}` }, { status: 403 }),
    };
  }

  return { allowed: true, apiKey: auth.apiKey };
}
