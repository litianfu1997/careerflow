import { NextResponse } from "next/server";
import { requireScope } from "@/lib/agent-auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string; patchId: string }> }
) {
  const check = await requireScope(req, [], "resume:read", "get_patch");
  if (!check.allowed) return check.response!;

  const { id, patchId } = await params;
  const resume = await prisma.resume.findUnique({ where: { id } });
  if (!resume || resume.userId !== check.apiKey!.userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const patch = await prisma.resumePatch.findUnique({ where: { id: patchId } });
  if (!patch || patch.resumeId !== id) {
    return NextResponse.json({ error: "Patch not found" }, { status: 404 });
  }

  return NextResponse.json({ patch });
}
