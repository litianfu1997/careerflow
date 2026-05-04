import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { applyPatchWithVersion } from "@/lib/patches";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string; patchId: string }> }
) {
  const auth = await getAuthUser();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, patchId } = await params;
  const result = await applyPatchWithVersion({
    resumeId: id,
    userId: auth.userId,
    patchId,
  });

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ message: "Patch applied" });
}
