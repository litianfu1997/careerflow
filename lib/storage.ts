import { mkdir, readFile, unlink, writeFile } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { nanoid } from "nanoid";

const STORAGE_DIR = process.env.STORAGE_DIR || "./storage";
const AVATARS_DIR = path.resolve(STORAGE_DIR, "avatars");

const ALLOWED_EXTENSIONS = ["jpg", "jpeg", "png", "webp"];
const USER_ID_RE = /^[a-z0-9]{8,30}$/;
const FILENAME_RE = /^[a-zA-Z0-9_-]+\.(jpg|jpeg|png|webp)$/;

function validateUserId(userId: string) {
  if (!USER_ID_RE.test(userId)) throw new Error("Invalid userId");
}

function validateFilename(filename: string) {
  if (!FILENAME_RE.test(filename)) throw new Error("Invalid filename");
}

function ensureInAvatarsDir(resolved: string) {
  if (!resolved.startsWith(AVATARS_DIR + path.sep) && resolved !== AVATARS_DIR) {
    throw new Error("Path traversal detected");
  }
}

export async function saveAvatarFile(userId: string, buffer: Buffer, extension: string): Promise<string> {
  if (!ALLOWED_EXTENSIONS.includes(extension)) throw new Error("Invalid extension");
  validateUserId(userId);

  const filename = `${nanoid()}.${extension}`;
  const userDir = path.join(AVATARS_DIR, userId);
  const fullPath = path.resolve(userDir, filename);

  ensureInAvatarsDir(path.resolve(userDir));

  if (!existsSync(userDir)) {
    await mkdir(userDir, { recursive: true });
  }

  await writeFile(fullPath, buffer);
  return `/api/uploads/avatars/${userId}/${filename}`;
}

export async function getAvatarFilePath(userId: string, filename: string): Promise<string | null> {
  validateUserId(userId);
  validateFilename(filename);

  const fullPath = path.resolve(AVATARS_DIR, userId, filename);
  ensureInAvatarsDir(fullPath);

  if (!existsSync(fullPath)) return null;
  return fullPath;
}

export async function deleteAvatarFile(avatarUrl: string): Promise<void> {
  const match = avatarUrl.match(/^\/api\/uploads\/avatars\/([^/]+)\/([^/]+)$/);
  if (!match) return;

  const [, userId, filename] = match;
  validateUserId(userId);
  validateFilename(filename);

  const fullPath = path.resolve(AVATARS_DIR, userId, filename);
  ensureInAvatarsDir(fullPath);

  if (existsSync(fullPath)) {
    await unlink(fullPath);
  }
}
