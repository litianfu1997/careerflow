import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getAvatarFilePath } from "@/lib/storage";
import { readFile } from "fs/promises";
import path from "path";

const EXT_TO_MIME: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ userId: string; filename: string }> },
) {
  const auth = await getAuthUser();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { userId, filename } = await params;
  if (userId !== auth.userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const filePath = await getAvatarFilePath(userId, filename);
  if (!filePath) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const ext = path.extname(filePath).slice(1).toLowerCase();
  const mime = EXT_TO_MIME[ext] || "application/octet-stream";
  const buffer = await readFile(filePath);

  return new Response(buffer, {
    headers: {
      "Content-Type": mime,
      "Cache-Control": "public, max-age=86400",
      "Content-Disposition": "inline",
    },
  });
}
