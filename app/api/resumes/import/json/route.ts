import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma, Prisma } from "@/lib/prisma";
import { resumeContentSchema } from "@/lib/resume-schema";

export async function POST(req: Request) {
  const auth = await getAuthUser();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { title, contentJson } = body;

  const parsed = resumeContentSchema.safeParse(contentJson);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid resume content", details: parsed.error.flatten() }, { status: 400 });
  }

  const resume = await prisma.resume.create({
    data: {
      userId: auth.userId,
      title: title || "Imported Resume",
      contentJson: parsed.data as unknown as Prisma.InputJsonValue,
    },
  });

  return NextResponse.json({ resume }, { status: 201 });
}
