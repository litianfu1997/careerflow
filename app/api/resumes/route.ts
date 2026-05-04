import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma, Prisma } from "@/lib/prisma";
import { defaultResumeContent } from "@/lib/resume-schema";

export async function GET() {
  const auth = await getAuthUser();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const resumes = await prisma.resume.findMany({
    where: { userId: auth.userId },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true, title: true, status: true, templateId: true,
      createdAt: true, updatedAt: true,
    },
  });

  return NextResponse.json({ resumes });
}

export async function POST(req: Request) {
  const auth = await getAuthUser();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { title, templateId } = await req.json();
  const resume = await prisma.resume.create({
    data: {
      userId: auth.userId,
      title: title || "Untitled Resume",
      contentJson: defaultResumeContent() as unknown as Prisma.InputJsonValue,
      templateId: templateId || null,
    },
  });

  return NextResponse.json({ resume }, { status: 201 });
}
