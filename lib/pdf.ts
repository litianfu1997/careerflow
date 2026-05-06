import { renderResumeToHTML } from "./resume-renderer";
import type { ResumeContent } from "./resume-schema";
import type { Browser } from "playwright";

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

export async function generatePDF(content: ResumeContent, templateName: string): Promise<Buffer> {
  const html = await renderResumeToHTML({ content, templateName });
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
