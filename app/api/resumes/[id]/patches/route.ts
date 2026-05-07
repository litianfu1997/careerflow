import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getAuthUser();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const ownership = await prisma.resume.findUnique({
    where: { id },
    select: { userId: true },
  });
  if (!ownership || ownership.userId !== auth.userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const url = new URL(req.url);
  const cursor = url.searchParams.get("cursor");
  const limit = Math.min(Number.parseInt(url.searchParams.get("limit") || "20"), 100);

  const patches = await prisma.resumePatch.findMany({
    where: { resumeId: id },
    orderBy: { createdAt: "desc" },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });

  const hasMore = patches.length > limit;
  if (hasMore) patches.pop();

  return NextResponse.json({
    patches,
    nextCursor: hasMore ? patches.at(-1)!.id : null,
  });
}
