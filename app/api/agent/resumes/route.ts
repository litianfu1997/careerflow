import { NextResponse } from "next/server";
import { requireScope } from "@/lib/agent-auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const check = await requireScope(req, [], "resume:read", "list_resumes");
  if (!check.allowed) return check.response!;

  const resumes = await prisma.resume.findMany({
    where: { userId: check.apiKey!.userId },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true, title: true, status: true, templateId: true,
      createdAt: true, updatedAt: true,
    },
  });

  return NextResponse.json({ resumes });
}
