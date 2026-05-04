import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string; patchId: string }> }
) {
  const auth = await getAuthUser();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, patchId } = await params;
  const resume = await prisma.resume.findUnique({ where: { id } });
  if (!resume || resume.userId !== auth.userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const patch = await prisma.resumePatch.findUnique({ where: { id: patchId } });
  if (!patch || patch.resumeId !== id) {
    return NextResponse.json({ error: "Patch not found" }, { status: 404 });
  }

  await prisma.resumePatch.update({
    where: { id: patchId },
    data: { status: "rejected", reviewedAt: new Date() },
  });

  return NextResponse.json({ message: "Patch rejected" });
}
