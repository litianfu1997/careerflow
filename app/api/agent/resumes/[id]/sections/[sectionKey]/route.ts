import { NextResponse } from "next/server";
import { requireScope } from "@/lib/agent-auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string; sectionKey: string }> }
) {
  const check = await requireScope(req, [], "resume:read", "get_section");
  if (!check.allowed) return check.response!;

  const { id, sectionKey } = await params;
  const resume = await prisma.resume.findUnique({ where: { id } });
  if (!resume || resume.userId !== check.apiKey!.userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const content = typeof resume.contentJson === "string"
    ? JSON.parse(resume.contentJson)
    : resume.contentJson;

  const sectionData = (content as any)[sectionKey];
  if (sectionData === undefined) {
    return NextResponse.json({ error: `Section "${sectionKey}" not found` }, { status: 404 });
  }

  return NextResponse.json({ section: sectionData });
}
