import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getAuthUser();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const resume = await prisma.resume.findUnique({
    where: { id },
    include: { template: { select: { name: true } } },
  });
  if (!resume || resume.userId !== auth.userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ resume });
}

export async function PUT(
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

  const body = await req.json();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: Record<string, any> = {};
  if (body.title !== undefined) data.title = body.title;
  if (body.contentJson !== undefined) data.contentJson = body.contentJson;
  if (body.status !== undefined) data.status = body.status;
  if (body.templateId !== undefined) data.templateId = body.templateId;

  const updated = await prisma.resume.update({
    where: { id },
    data,
  });

  return NextResponse.json({ resume: updated });
}

export async function DELETE(
  _req: Request,
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

  await prisma.resume.delete({ where: { id } });
  return NextResponse.json({ message: "Deleted" });
}
