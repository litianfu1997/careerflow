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
  const resume = await prisma.resume.findUnique({ where: { id } });
  if (!resume || resume.userId !== auth.userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.resumeExport.create({
    data: { resumeId: id, userId: auth.userId, format: "json" },
  });

  const content = typeof resume.contentJson === "string"
    ? resume.contentJson
    : JSON.stringify(resume.contentJson, null, 2);

  return new Response(content, {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="${resume.title}.json"`,
    },
  });
}
