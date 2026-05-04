import { NextResponse } from "next/server";
import { requireScope } from "@/lib/agent-auth";
import { applyPatchWithVersion } from "@/lib/patches";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string; patchId: string }> }
) {
  const check = await requireScope(req, [], "resume:apply_patch", "apply_patch");
  if (!check.allowed) return check.response!;

  const { id, patchId } = await params;
  const result = await applyPatchWithVersion({
    resumeId: id,
    userId: check.apiKey!.userId,
    patchId,
    apiKeyId: check.apiKey!.id,
  });

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ message: "Patch applied" });
}
