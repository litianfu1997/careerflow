import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const auth = await getAuthUser();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { name, displayName, description, templateHtml, templateCss } = body;

  if (!name || !displayName || !templateHtml) {
    return NextResponse.json(
      { error: "name, displayName, and templateHtml are required" },
      { status: 400 }
    );
  }

  if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(name) && name.length > 1) {
    return NextResponse.json(
      { error: "name must be lowercase alphanumeric with hyphens (e.g., my-template)" },
      { status: 400 }
    );
  }

  const existing = await prisma.resumeTemplate.findUnique({ where: { name } });
  if (existing) {
    return NextResponse.json(
      { error: "Template name already exists" },
      { status: 409 }
    );
  }

  const template = await prisma.resumeTemplate.create({
    data: {
      name,
      displayName,
      description: description || null,
      templateHtml,
      templateCss: templateCss || null,
      userId: auth.userId,
      isBuiltin: false,
    },
  });

  return NextResponse.json({ template }, { status: 201 });
}
