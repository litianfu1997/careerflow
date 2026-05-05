import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getEditableTemplatePreset } from "@/lib/editable-template-presets";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getAuthUser();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const template = await prisma.resumeTemplate.findUnique({ where: { id } });
  if (!template) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (!template.isBuiltin && template.userId !== auth.userId && auth.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const preset = template.isBuiltin ? getEditableTemplatePreset(template.name) : null;

  return NextResponse.json({
    template: {
      ...template,
      starterHtml: template.templateHtml || preset?.html || null,
      starterCss: template.templateCss || preset?.css || null,
    },
  });
}
