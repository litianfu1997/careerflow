import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma, Prisma } from "@/lib/prisma";
import { defaultResumeContent } from "@/lib/resume-schema";

export async function GET(req: Request) {
  const auth = await getAuthUser();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const cursor = url.searchParams.get("cursor");
  const limit = Math.min(Number.parseInt(url.searchParams.get("limit") || "50"), 100);

  const resumes = await prisma.resume.findMany({
    where: { userId: auth.userId },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true, title: true, status: true, templateId: true,
      createdAt: true, updatedAt: true,
    },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });

  const hasMore = resumes.length > limit;
  if (hasMore) resumes.pop();

  return NextResponse.json(
    { resumes, nextCursor: hasMore ? resumes.at(-1)!.id : null },
    { headers: { "Cache-Control": "private, max-age=10, stale-while-revalidate=30" } },
  );
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
