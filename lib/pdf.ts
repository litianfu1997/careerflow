import { renderResumeToHTML } from "./resume-renderer";
import type { ResumeContent } from "./resume-schema";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _browser: any = null;

async function getBrowser() {
  if (_browser) return _browser;
  const { chromium } = await import("playwright");
  _browser = await chromium.launch({ headless: true });
  return _browser;
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
    await page.close();
  }
}
