import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const auth = await getAuthUser();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const templates = await prisma.resumeTemplate.findMany({
    where: {
      OR: [
        { isBuiltin: true },
        { userId: auth.userId },
      ],
    },
    orderBy: [{ isBuiltin: "desc" }, { createdAt: "asc" }],
  });

  return NextResponse.json(
    { templates },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
