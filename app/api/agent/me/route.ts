import { NextResponse } from "next/server";
import { authenticateAgent } from "@/lib/agent-auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const auth = await authenticateAgent(req);
  if (!auth.authorized || !auth.apiKey) return auth.response!;

  const user = await prisma.user.findUnique({
    where: { id: auth.apiKey.userId },
    select: { id: true, email: true, nickname: true },
  });

  return NextResponse.json({
    user,
    apiKey: { id: auth.apiKey.id, scopes: auth.apiKey.scopes },
  });
}
