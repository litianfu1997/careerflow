import { renderResumeToHTML } from "./resume-renderer";
import type { ResumeContent } from "./resume-schema";
import type { Browser } from "playwright";
import { readFile } from "fs/promises";
import path from "path";
import { getAvatarFilePath } from "./storage";

let _browser: Browser | null = null;
let _browserLaunching: Promise<Browser> | null = null;

async function getBrowser(): Promise<Browser> {
  if (_browser && _browser.isConnected()) return _browser;
  if (_browserLaunching) return _browserLaunching;

  _browserLaunching = (async () => {
    try {
      const { chromium } = await import("playwright");
      const browser = await chromium.launch({
        headless: true,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-gpu",
          "--disable-dev-shm-usage",
        ],
      });
      _browser = browser;
      return browser;
    } finally {
      _browserLaunching = null;
    }
  })();

  return _browserLaunching;
}

async function embedAvatarAsBase64(content: ResumeContent): Promise<ResumeContent> {
  const avatar = content.basic.avatar;
  if (!avatar?.startsWith("/api/uploads/avatars/")) return content;

  const match = /^\/api\/uploads\/avatars\/([^/]+)\/([^/]+)$/.exec(avatar);
  if (!match) return content;

  const filePath = await getAvatarFilePath(match[1], match[2]);
  if (!filePath) return content;

  const buffer = await readFile(filePath);
  const ext = path.extname(filePath).slice(1);
  const mime = ext === "jpg" ? "image/jpeg" : `image/${ext}`;
  const base64 = buffer.toString("base64");

  return {
    ...content,
    basic: { ...content.basic, avatar: `data:${mime};base64,${base64}` },
  };
}

export async function generatePDF(content: ResumeContent, templateName: string): Promise<Buffer> {
  const embedded = await embedAvatarAsBase64(content);
  const html = await renderResumeToHTML({ content: embedded, templateName });
  const browser = await getBrowser();
  const page = await browser.newPage();

  try {
    await page.setContent(html, { waitUntil: "networkidle" });
    const pdf = await page.pdf({
      format: "A4",
      margin: { top: "0", bottom: "0", left: "0", right: "0" },
      printBackground: true,
    });
    return Buffer.from(pdf);
  } finally {
    await page.close().catch(() => {});
  }
}
