import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { saveAvatarFile, deleteAvatarFile } from "@/lib/storage";

const MAX_SIZE = 2 * 1024 * 1024;
const ALLOWED_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

const MAGIC_BYTES: Record<string, number[]> = {
  jpg: [0xff, 0xd8, 0xff],
  png: [0x89, 0x50, 0x4e, 0x47],
  webp: [0x52, 0x49, 0x46, 0x46],
};

function checkMagicBytes(buffer: Buffer, ext: string): boolean {
  const magic = MAGIC_BYTES[ext === "jpeg" ? "jpg" : ext];
  if (!magic) return false;
  return magic.every((byte, i) => buffer[i] === byte);
}

export async function POST(req: Request) {
  const auth = await getAuthUser();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file");
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "File too large. Maximum size is 2MB." }, { status: 400 });
  }

  const ext = ALLOWED_MIME[file.type];
  if (!ext) {
    return NextResponse.json({ error: "Invalid file type. Allowed: JPG, PNG, WebP." }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  if (!checkMagicBytes(buffer, ext)) {
    return NextResponse.json({ error: "Invalid file type. Allowed: JPG, PNG, WebP." }, { status: 400 });
  }

  try {
    const url = await saveAvatarFile(auth.userId, buffer, ext);
    return NextResponse.json({ url });
  } catch {
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const auth = await getAuthUser();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { url } = await req.json();
  if (!url || typeof url !== "string") {
    return NextResponse.json({ error: "No url provided" }, { status: 400 });
  }

  // Verify the URL belongs to the authenticated user
  const prefix = `/api/uploads/avatars/${auth.userId}/`;
  if (!url.startsWith(prefix)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    await deleteAvatarFile(url);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
