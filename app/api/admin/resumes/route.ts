import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const auth = await getAuthUser();
  if (!auth || auth.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const resumes = await prisma.resume.findMany({
    orderBy: { updatedAt: "desc" },
    select: { id: true, title: true, userId: true, status: true, createdAt: true, updatedAt: true },
    take: 100,
  });

  return NextResponse.json({ resumes });
}
