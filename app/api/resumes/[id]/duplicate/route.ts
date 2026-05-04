import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma, Prisma } from "@/lib/prisma";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getAuthUser();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const resume = await prisma.resume.findUnique({ where: { id } });
  if (!resume || resume.userId !== auth.userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const dup = await prisma.resume.create({
    data: {
      userId: auth.userId,
      title: `${resume.title} (Copy)`,
      contentJson: resume.contentJson as Prisma.InputJsonValue,
      templateId: resume.templateId,
    },
  });

  return NextResponse.json({ resume: dup }, { status: 201 });
}
