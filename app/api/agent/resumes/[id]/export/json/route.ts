import { NextResponse } from "next/server";
import { requireScope } from "@/lib/agent-auth";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const check = await requireScope(req, [], "resume:export", "export_json");
  if (!check.allowed) return check.response!;

  const { id } = await params;
  const resume = await prisma.resume.findUnique({ where: { id } });
  if (!resume || resume.userId !== check.apiKey!.userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await writeAuditLog({
    userId: check.apiKey!.userId,
    apiKeyId: check.apiKey!.id,
    action: "export_json",
    resource: `resume/${id}`,
  });

  const content = typeof resume.contentJson === "string"
    ? resume.contentJson
    : JSON.stringify(resume.contentJson, null, 2);

  return new Response(content, {
    headers: { "Content-Type": "application/json" },
  });
}
