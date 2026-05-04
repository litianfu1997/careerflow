import type { ResumeContent } from "./resume-schema";
import { renderSections } from "./template-variables";
import { prisma } from "./prisma";

interface RenderContext {
  content: ResumeContent;
  templateName: string;
}

const builtinTemplates: Record<string, (content: ResumeContent) => string> = {
  "clean-cn": cleanCnTemplate,
  "tech-cn": techCnTemplate,
  "ats-en": atsEnTemplate,
  "modern-en": modernEnTemplate,
  "elegant-cn": elegantCnTemplate,
  "sidebar": sidebarTemplate,
  "compact": compactTemplate,
};

const templateCache = new Map<string, { html: string; css: string | null; fetchedAt: number }>();
const CACHE_TTL = 60_000;

export async function renderResumeToHTML(ctx: RenderContext): Promise<string> {
  const { content, templateName } = ctx;

  const builtinFn = builtinTemplates[templateName];
  if (builtinFn) return builtinFn(content);

  const cached = templateCache.get(templateName);
  let templateHtml: string | null = null;
  let templateCss: string | null = null;

  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL) {
    templateHtml = cached.html;
    templateCss = cached.css;
  } else {
    const dbTemplate = await prisma.resumeTemplate.findUnique({
      where: { name: templateName },
      select: { templateHtml: true, templateCss: true },
    });
    if (dbTemplate?.templateHtml) {
      templateHtml = dbTemplate.templateHtml;
      templateCss = dbTemplate.templateCss;
      templateCache.set(templateName, { html: templateHtml, css: templateCss, fetchedAt: Date.now() });
    }
  }

  if (templateHtml) {
    return renderCustomTemplate(content, templateHtml, templateCss);
  }

  return builtinTemplates["clean-cn"](content);
}

export function renderCustomTemplate(content: ResumeContent, templateHtml: string, templateCss: string | null): string {
  const sections = renderSections(content);
  const rendered = templateHtml.replace(/\{\{(\w+)\}\}/g, (_, key: string) => sections[key] || "");

  const cssBlock = templateCss ? `<style>${templateCss}</style>` : "";
  return `<!DOCTYPE html><html><head><meta charset="utf-8">
<style>
  @page { size: A4; margin: 0; orphans: 3; widows: 3; }
  * { box-sizing: border-box; }
  html, body { width: 210mm; padding: 0; margin: 0 auto; }
  body { font-family: system-ui, -apple-system, sans-serif; padding: 40px 48px; color: #333; line-height: 1.5; background: white; }
  h1, h2, h3 { page-break-after: avoid; }
  body > div { page-break-inside: avoid; }
  body > div > div { page-break-inside: avoid; }
  ul, ol { page-break-inside: avoid; }
  li { page-break-inside: avoid; }
  @media print { html, body { width: auto; overflow: visible; margin: 0; padding: 0; } @page { size: A4; margin: 10mm; } body { padding: 10mm; } }
</style>${cssBlock}</head><body>${rendered}</body></html>`;
}

function cleanCnTemplate(c: ResumeContent): string {
  const b = c.basic;
  const sections: string[] = [];

  if (b.name || b.email || b.phone) {
    sections.push(`
      <div style="text-align:center;margin-bottom:20px;">
        <h1 style="margin:0;font-size:24px;font-weight:bold;">${esc(b.name)}</h1>
        <p style="margin:4px 0 0;color:#666;font-size:13px;">
          ${[b.email, b.phone, b.location, b.website, b.github, b.linkedin].filter(Boolean).map(esc).join(" | ")}
        </p>
      </div>
    `);
  }

  if (c.summary) {
    sections.push(section("Personal Summary", `<p style="margin:0;font-size:13px;line-height:1.6;white-space:pre-wrap;">${esc(c.summary)}</p>`));
  }

  if (c.education.length) {
    const items = c.education.map((e) => `
      ${itemDiv(`
        <div style="display:flex;justify-content:space-between;">
          <strong>${esc(e.school)}</strong>
          <span style="color:#666;font-size:12px;">${esc(e.startDate)} - ${esc(e.endDate)}</span>
        </div>
        <p style="margin:2px 0 0;font-size:13px;">${esc(e.degree)} ${esc(e.major)} ${e.gpa ? "· GPA: " + esc(e.gpa) : ""}</p>
        ${e.description ? `<p style="margin:2px 0 0;font-size:12px;color:#555;">${esc(e.description)}</p>` : ""}
      `, "8px")}
    `).join("");
    sections.push(section("Education", items));
  }

  if (c.workExperience.length) {
    const items = c.workExperience.map((w) => `
      ${itemDiv(`
        <div style="display:flex;justify-content:space-between;">
          <strong>${esc(w.company)}</strong>
          <span style="color:#666;font-size:12px;">${esc(w.startDate)} - ${esc(w.endDate)}</span>
        </div>
        <p style="margin:2px 0 0;font-size:13px;font-style:italic;">${esc(w.position)}</p>
        ${w.description ? `<p style="margin:4px 0 0;font-size:12px;line-height:1.5;">${esc(w.description)}</p>` : ""}
        ${w.highlights.length ? `<ul style="margin:4px 0 0;padding-left:16px;font-size:12px;line-height:1.5;">${w.highlights.map((h) => `<li>${esc(h)}</li>`).join("")}</ul>` : ""}
      `, "10px")}
    `).join("");
    sections.push(section("Work Experience", items));
  }

  if (c.projects.length) {
    const items = c.projects.map((p) => `
      ${itemDiv(`
        <div style="display:flex;justify-content:space-between;">
          <strong>${esc(p.name)}</strong>
          <span style="color:#666;font-size:12px;">${esc(p.startDate)} - ${esc(p.endDate)}</span>
        </div>
        ${p.role ? `<p style="margin:2px 0 0;font-size:13px;font-style:italic;">${esc(p.role)}</p>` : ""}
        ${p.description ? `<p style="margin:4px 0 0;font-size:12px;line-height:1.5;">${esc(p.description)}</p>` : ""}
        ${p.highlights.length ? `<ul style="margin:4px 0 0;padding-left:16px;font-size:12px;line-height:1.5;">${p.highlights.map((h) => `<li>${esc(h)}</li>`).join("")}</ul>` : ""}
      `, "8px")}
    `).join("");
    sections.push(section("Projects", items));
  }

  if (c.skills.length) {
    const items = c.skills.map((s) => `
      ${itemDiv(`<strong>${esc(s.name)}:</strong> <span style="font-size:13px;">${s.skills.map(esc).join(", ")}</span>`, "4px")}
    `).join("");
    sections.push(section("Skills", items));
  }

  if (c.certificates.length) {
    const items = c.certificates.map((cert) => `
      ${itemDiv(`
        <strong>${esc(cert.name)}</strong>
        ${cert.issuer ? ` - ${esc(cert.issuer)}` : ""}
        ${cert.date ? ` (${esc(cert.date)})` : ""}
      `, "4px")}
    `).join("");
    sections.push(section("Certificates & Awards", items));
  }

  if (c.openSource.length) {
    const items = c.openSource.map((o) => `
      ${itemDiv(`
        <strong>${esc(o.name)}</strong>
        ${o.role ? ` (${esc(o.role)})` : ""}
        ${o.description ? ` - ${esc(o.description)}` : ""}
      `, "4px")}
    `).join("");
    sections.push(section("Open Source", items));
  }

  c.customSections.forEach((cs) => {
    if (cs.title && cs.content) {
      sections.push(section(cs.title, `<p style="margin:0;font-size:13px;line-height:1.6;white-space:pre-wrap;">${esc(cs.content)}</p>`));
    }
  });

  return wrapPage(sections.join(""));
}

function techCnTemplate(c: ResumeContent): string {
  const b = c.basic;
  const sections: string[] = [];

  sections.push(`
    <div style="text-align:center;margin-bottom:16px;border-bottom:2px solid #2563eb;padding-bottom:12px;">
      <h1 style="margin:0;font-size:22px;font-weight:bold;">${esc(b.name)}</h1>
      <p style="margin:4px 0 0;color:#2563eb;font-size:12px;">
        ${[b.email, b.phone, b.location, b.github, b.website, b.linkedin].filter(Boolean).map(esc).join(" | ")}
      </p>
    </div>
  `);

  if (c.skills.length) {
    const items = c.skills.map((s) => `
      <div style="margin-bottom:4px;">
        <strong style="color:#2563eb;">${esc(s.name)}:</strong> <span style="font-size:12px;">${s.skills.map(esc).join(", ")}</span>
      </div>
    `).join("");
    sections.push(section("Technical Skills", items, "#2563eb"));
  }

  if (c.workExperience.length) {
    const items = c.workExperience.map((w) => `
      <div style="margin-bottom:10px;">
        <div style="display:flex;justify-content:space-between;">
          <strong style="color:#2563eb;">${esc(w.company)}</strong>
          <span style="color:#666;font-size:11px;">${esc(w.startDate)} - ${esc(w.endDate)}</span>
        </div>
        <p style="margin:2px 0 0;font-size:12px;font-style:italic;">${esc(w.position)}</p>
        ${w.description ? `<p style="margin:4px 0 0;font-size:12px;line-height:1.5;">${esc(w.description)}</p>` : ""}
        ${w.highlights.length ? `<ul style="margin:4px 0 0;padding-left:16px;font-size:12px;line-height:1.5;">${w.highlights.map((h) => `<li>${esc(h)}</li>`).join("")}</ul>` : ""}
      </div>
    `).join("");
    sections.push(section("Work Experience", items, "#2563eb"));
  }

  if (c.projects.length) {
    const items = c.projects.map((p) => `
      <div style="margin-bottom:8px;">
        <div style="display:flex;justify-content:space-between;">
          <strong style="color:#2563eb;">${esc(p.name)}</strong>
          <span style="color:#666;font-size:11px;">${esc(p.startDate)} - ${esc(p.endDate)}</span>
        </div>
        ${p.role ? `<p style="margin:2px 0 0;font-size:12px;font-style:italic;">${esc(p.role)}</p>` : ""}
        ${p.description ? `<p style="margin:4px 0 0;font-size:12px;line-height:1.5;">${esc(p.description)}</p>` : ""}
        ${p.highlights.length ? `<ul style="margin:4px 0 0;padding-left:16px;font-size:12px;line-height:1.5;">${p.highlights.map((h) => `<li>${esc(h)}</li>`).join("")}</ul>` : ""}
      </div>
    `).join("");
    sections.push(section("Projects", items, "#2563eb"));
  }

  if (c.openSource.length) {
    const items = c.openSource.map((o) => `
      <div style="margin-bottom:4px;">
        <strong style="color:#2563eb;">${esc(o.name)}</strong>
        ${o.role ? ` (${esc(o.role)})` : ""}
        ${o.description ? ` - ${esc(o.description)}` : ""}
      </div>
    `).join("");
    sections.push(section("Open Source", items, "#2563eb"));
  }

  if (c.education.length) {
    const items = c.education.map((e) => `
      <div style="margin-bottom:8px;">
        <div style="display:flex;justify-content:space-between;">
          <strong>${esc(e.school)}</strong>
          <span style="color:#666;font-size:11px;">${esc(e.startDate)} - ${esc(e.endDate)}</span>
        </div>
        <p style="margin:2px 0 0;font-size:12px;">${esc(e.degree)} ${esc(e.major)}</p>
      </div>
    `).join("");
    sections.push(section("Education", items, "#2563eb"));
  }

  if (c.certificates.length) {
    const items = c.certificates.map((cert) => `
      <div style="margin-bottom:4px;">
        <strong>${esc(cert.name)}</strong>
        ${cert.issuer ? ` - ${esc(cert.issuer)}` : ""}
      </div>
    `).join("");
    sections.push(section("Certificates", items, "#2563eb"));
  }

  return wrapPage(sections.join(""));
}

function atsEnTemplate(c: ResumeContent): string {
  const b = c.basic;
  const sections: string[] = [];

  sections.push(`
    <div style="margin-bottom:12px;">
      <h1 style="margin:0;font-size:20px;font-weight:normal;">${esc(b.name)}</h1>
      <p style="margin:4px 0 0;font-size:12px;">
        ${[b.email, b.phone, b.location, b.website, b.linkedin, b.github].filter(Boolean).map(esc).join(" | ")}
      </p>
    </div>
  `);

  if (c.summary) {
    sections.push(`<div style="margin-bottom:10px;"><h2 style="font-size:14px;font-weight:bold;margin:0 0 4px;border-bottom:1px solid #000;">PROFESSIONAL SUMMARY</h2><p style="margin:0;font-size:12px;line-height:1.5;white-space:pre-wrap;">${esc(c.summary)}</p></div>`);
  }

  if (c.workExperience.length) {
    const items = c.workExperience.map((w) => `
      <div style="margin-bottom:8px;">
        <div style="display:flex;justify-content:space-between;">
          <strong style="font-size:13px;">${esc(w.company)}</strong>
          <span style="font-size:11px;">${esc(w.startDate)} - ${esc(w.endDate)}</span>
        </div>
        <p style="margin:1px 0 0;font-size:12px;">${esc(w.position)}</p>
        ${w.highlights.length ? `<ul style="margin:2px 0 0;padding-left:16px;font-size:11px;line-height:1.4;">${w.highlights.map((h) => `<li>${esc(h)}</li>`).join("")}</ul>` : ""}
      </div>
    `).join("");
    sections.push(`<div style="margin-bottom:10px;"><h2 style="font-size:14px;font-weight:bold;margin:0 0 4px;border-bottom:1px solid #000;">EXPERIENCE</h2>${items}</div>`);
  }

  if (c.education.length) {
    const items = c.education.map((e) => `
      <div style="margin-bottom:6px;">
        <strong style="font-size:13px;">${esc(e.school)}</strong>
        <span style="font-size:11px;"> - ${esc(e.degree)} ${esc(e.major)} (${esc(e.startDate)} - ${esc(e.endDate)})</span>
      </div>
    `).join("");
    sections.push(`<div style="margin-bottom:10px;"><h2 style="font-size:14px;font-weight:bold;margin:0 0 4px;border-bottom:1px solid #000;">EDUCATION</h2>${items}</div>`);
  }

  if (c.skills.length) {
    const items = c.skills.map((s) => `${esc(s.name)}: ${s.skills.map(esc).join(", ")}`).join(" | ");
    sections.push(`<div style="margin-bottom:10px;"><h2 style="font-size:14px;font-weight:bold;margin:0 0 4px;border-bottom:1px solid #000;">SKILLS</h2><p style="margin:0;font-size:12px;">${items}</p></div>`);
  }

  if (c.projects.length) {
    const items = c.projects.map((p) => `
      <div style="margin-bottom:6px;">
        <strong style="font-size:13px;">${esc(p.name)}</strong>
        ${p.highlights.length ? `<ul style="margin:2px 0 0;padding-left:16px;font-size:11px;line-height:1.4;">${p.highlights.map((h) => `<li>${esc(h)}</li>`).join("")}</ul>` : ""}
      </div>
    `).join("");
    sections.push(`<div style="margin-bottom:10px;"><h2 style="font-size:14px;font-weight:bold;margin:0 0 4px;border-bottom:1px solid #000;">PROJECTS</h2>${items}</div>`);
  }

  return wrapPage(sections.join(""));
}

function modernEnTemplate(c: ResumeContent): string {
  const b = c.basic;
  const sections: string[] = [];
  const accent = "#0369a1";

  sections.push(`
    <div style="margin-bottom:20px;padding-left:16px;border-left:4px solid ${accent};">
      <h1 style="margin:0;font-size:26px;font-weight:700;color:#0f172a;letter-spacing:-0.5px;">${esc(b.name)}</h1>
      <p style="margin:6px 0 0;font-size:12px;color:#64748b;">
        ${[b.email, b.phone, b.location, b.website, b.linkedin, b.github].filter(Boolean).map(esc).join(" · ")}
      </p>
    </div>
  `);

  if (c.summary) {
    sections.push(`<div style="margin-bottom:16px;padding-left:16px;border-left:4px solid #e2e8f0;">
      <p style="margin:0;font-size:13px;line-height:1.7;color:#334155;white-space:pre-wrap;">${esc(c.summary)}</p>
    </div>`);
  }

  if (c.workExperience.length) {
    const items = c.workExperience.map((w) => `
      <div style="margin-bottom:12px;">
        <div style="display:flex;justify-content:space-between;align-items:baseline;">
          <h3 style="margin:0;font-size:14px;font-weight:600;color:#0f172a;">${esc(w.position)}</h3>
          <span style="font-size:11px;color:#64748b;">${esc(w.startDate)} — ${esc(w.endDate)}</span>
        </div>
        <p style="margin:2px 0 0;font-size:12px;color:${accent};font-weight:500;">${esc(w.company)}</p>
        ${w.description ? `<p style="margin:4px 0 0;font-size:12px;color:#475569;line-height:1.6;">${esc(w.description)}</p>` : ""}
        ${w.highlights.length ? `<ul style="margin:6px 0 0;padding-left:18px;font-size:12px;color:#475569;line-height:1.6;">${w.highlights.map((h) => `<li style="margin-bottom:2px;">${esc(h)}</li>`).join("")}</ul>` : ""}
      </div>
    `).join("");
    sections.push(modernSection("Experience", items, accent));
  }

  if (c.education.length) {
    const items = c.education.map((e) => `
      <div style="margin-bottom:8px;">
        <div style="display:flex;justify-content:space-between;align-items:baseline;">
          <strong style="font-size:13px;color:#0f172a;">${esc(e.school)}</strong>
          <span style="font-size:11px;color:#64748b;">${esc(e.startDate)} — ${esc(e.endDate)}</span>
        </div>
        <p style="margin:2px 0 0;font-size:12px;color:#475569;">${esc(e.degree)} ${esc(e.major)}${e.gpa ? " · GPA: " + esc(e.gpa) : ""}</p>
      </div>
    `).join("");
    sections.push(modernSection("Education", items, accent));
  }

  if (c.skills.length) {
    const items = c.skills.map((s) => `
      <div style="margin-bottom:4px;">
        <span style="font-size:12px;font-weight:600;color:#0f172a;">${esc(s.name)}:</span>
        <span style="font-size:12px;color:#475569;"> ${s.skills.map(esc).join(" · ")}</span>
      </div>
    `).join("");
    sections.push(modernSection("Skills", items, accent));
  }

  if (c.projects.length) {
    const items = c.projects.map((p) => `
      <div style="margin-bottom:8px;">
        <div style="display:flex;justify-content:space-between;align-items:baseline;">
          <strong style="font-size:13px;color:#0f172a;">${esc(p.name)}</strong>
          <span style="font-size:11px;color:#64748b;">${esc(p.startDate)} — ${esc(p.endDate)}</span>
        </div>
        ${p.role ? `<p style="margin:2px 0 0;font-size:12px;color:${accent};">${esc(p.role)}</p>` : ""}
        ${p.highlights.length ? `<ul style="margin:4px 0 0;padding-left:18px;font-size:12px;color:#475569;line-height:1.6;">${p.highlights.map((h) => `<li style="margin-bottom:2px;">${esc(h)}</li>`).join("")}</ul>` : ""}
      </div>
    `).join("");
    sections.push(modernSection("Projects", items, accent));
  }

  if (c.certificates.length) {
    const items = c.certificates.map((cert) => `
      <div style="margin-bottom:4px;">
        <strong style="font-size:12px;color:#0f172a;">${esc(cert.name)}</strong>
        ${cert.issuer ? `<span style="font-size:12px;color:#475569;"> — ${esc(cert.issuer)}</span>` : ""}
        ${cert.date ? `<span style="font-size:11px;color:#64748b;"> (${esc(cert.date)})</span>` : ""}
      </div>
    `).join("");
    sections.push(modernSection("Certifications", items, accent));
  }

  if (c.openSource.length) {
    const items = c.openSource.map((o) => `
      <div style="margin-bottom:4px;">
        <strong style="font-size:12px;color:#0f172a;">${esc(o.name)}</strong>
        ${o.role ? `<span style="font-size:12px;color:#475569;"> (${esc(o.role)})</span>` : ""}
        ${o.description ? `<span style="font-size:12px;color:#475569;"> — ${esc(o.description)}</span>` : ""}
      </div>
    `).join("");
    sections.push(modernSection("Open Source", items, accent));
  }

  c.customSections.forEach((cs) => {
    if (cs.title && cs.content) {
      sections.push(modernSection(cs.title, `<p style="margin:0;font-size:12px;color:#475569;line-height:1.7;white-space:pre-wrap;">${esc(cs.content)}</p>`, accent));
    }
  });

  return wrapPage(sections.join(""));
}

function modernSection(title: string, content: string, accent: string): string {
  return `
    <div style="margin-bottom:16px;">
      <h2 style="font-size:13px;font-weight:700;margin:0 0 8px;text-transform:uppercase;letter-spacing:1px;color:${accent};">${esc(title)}</h2>
      ${content}
    </div>
  `;
}

function elegantCnTemplate(c: ResumeContent): string {
  const b = c.basic;
  const sections: string[] = [];
  const border = "#c9a96e";

  sections.push(`
    <div style="text-align:center;margin-bottom:24px;padding-bottom:16px;border-bottom:1px solid ${border};">
      <h1 style="margin:0;font-size:24px;font-weight:normal;letter-spacing:4px;color:#2c2c2c;">${esc(b.name)}</h1>
      <p style="margin:10px 0 0;font-size:12px;color:#666;letter-spacing:1px;">
        ${[b.email, b.phone, b.location, b.website, b.github, b.linkedin].filter(Boolean).map(esc).join(" ｜ ")}
      </p>
    </div>
  `);

  if (c.summary) {
    sections.push(elegantSection("个人简介", `<p style="margin:0;font-size:13px;line-height:1.8;color:#444;white-space:pre-wrap;">${esc(c.summary)}</p>`, border));
  }

  if (c.workExperience.length) {
    const items = c.workExperience.map((w) => `
      <div style="margin-bottom:14px;">
        <div style="display:flex;justify-content:space-between;align-items:baseline;border-bottom:1px dotted #ddd;padding-bottom:2px;">
          <strong style="font-size:14px;color:#2c2c2c;">${esc(w.company)}</strong>
          <span style="font-size:11px;color:#999;">${esc(w.startDate)} — ${esc(w.endDate)}</span>
        </div>
        <p style="margin:4px 0 0;font-size:13px;color:${border};">${esc(w.position)}</p>
        ${w.description ? `<p style="margin:6px 0 0;font-size:12px;line-height:1.7;color:#555;">${esc(w.description)}</p>` : ""}
        ${w.highlights.length ? `<ul style="margin:6px 0 0;padding-left:18px;font-size:12px;line-height:1.7;color:#555;">${w.highlights.map((h) => `<li style="margin-bottom:3px;">${esc(h)}</li>`).join("")}</ul>` : ""}
      </div>
    `).join("");
    sections.push(elegantSection("工作经历", items, border));
  }

  if (c.education.length) {
    const items = c.education.map((e) => `
      <div style="margin-bottom:10px;">
        <div style="display:flex;justify-content:space-between;align-items:baseline;">
          <strong style="font-size:13px;color:#2c2c2c;">${esc(e.school)}</strong>
          <span style="font-size:11px;color:#999;">${esc(e.startDate)} — ${esc(e.endDate)}</span>
        </div>
        <p style="margin:2px 0 0;font-size:12px;color:#555;">${esc(e.degree)} · ${esc(e.major)}${e.gpa ? " · GPA: " + esc(e.gpa) : ""}</p>
        ${e.description ? `<p style="margin:2px 0 0;font-size:11px;color:#777;">${esc(e.description)}</p>` : ""}
      </div>
    `).join("");
    sections.push(elegantSection("教育背景", items, border));
  }

  if (c.projects.length) {
    const items = c.projects.map((p) => `
      <div style="margin-bottom:10px;">
        <div style="display:flex;justify-content:space-between;align-items:baseline;">
          <strong style="font-size:13px;color:#2c2c2c;">${esc(p.name)}</strong>
          <span style="font-size:11px;color:#999;">${esc(p.startDate)} — ${esc(p.endDate)}</span>
        </div>
        ${p.role ? `<p style="margin:2px 0 0;font-size:12px;color:${border};">${esc(p.role)}</p>` : ""}
        ${p.description ? `<p style="margin:4px 0 0;font-size:12px;line-height:1.7;color:#555;">${esc(p.description)}</p>` : ""}
        ${p.highlights.length ? `<ul style="margin:4px 0 0;padding-left:18px;font-size:12px;line-height:1.7;color:#555;">${p.highlights.map((h) => `<li style="margin-bottom:3px;">${esc(h)}</li>`).join("")}</ul>` : ""}
      </div>
    `).join("");
    sections.push(elegantSection("项目经历", items, border));
  }

  if (c.skills.length) {
    const items = c.skills.map((s) => `
      <div style="display:flex;margin-bottom:6px;">
        <span style="min-width:100px;font-size:13px;font-weight:600;color:#2c2c2c;">${esc(s.name)}</span>
        <span style="font-size:12px;color:#555;">${s.skills.map(esc).join(" / ")}</span>
      </div>
    `).join("");
    sections.push(elegantSection("专业技能", items, border));
  }

  if (c.certificates.length) {
    const items = c.certificates.map((cert) => `
      <div style="margin-bottom:4px;">
        <strong style="font-size:12px;color:#2c2c2c;">${esc(cert.name)}</strong>
        ${cert.issuer ? `<span style="font-size:12px;color:#555;"> — ${esc(cert.issuer)}</span>` : ""}
        ${cert.date ? `<span style="font-size:11px;color:#999;"> (${esc(cert.date)})</span>` : ""}
      </div>
    `).join("");
    sections.push(elegantSection("证书与荣誉", items, border));
  }

  if (c.openSource.length) {
    const items = c.openSource.map((o) => `
      <div style="margin-bottom:4px;">
        <strong style="font-size:12px;color:#2c2c2c;">${esc(o.name)}</strong>
        ${o.role ? `<span style="font-size:12px;color:${border};"> (${esc(o.role)})</span>` : ""}
        ${o.description ? `<span style="font-size:12px;color:#555;"> — ${esc(o.description)}</span>` : ""}
      </div>
    `).join("");
    sections.push(elegantSection("开源贡献", items, border));
  }

  c.customSections.forEach((cs) => {
    if (cs.title && cs.content) {
      sections.push(elegantSection(cs.title, `<p style="margin:0;font-size:12px;line-height:1.8;color:#555;white-space:pre-wrap;">${esc(cs.content)}</p>`, border));
    }
  });

  return wrapPage(sections.join(""));
}

function elegantSection(title: string, content: string, border: string): string {
  return `
    <div style="margin-bottom:18px;">
      <h2 style="font-size:14px;font-weight:normal;margin:0 0 10px;padding-bottom:6px;border-bottom:1px solid ${border};letter-spacing:2px;color:#2c2c2c;">${esc(title)}</h2>
      ${content}
    </div>
  `;
}

function sidebarTemplate(c: ResumeContent): string {
  const b = c.basic;
  const sidebarSections: string[] = [];
  const mainSections: string[] = [];
  const dark = "#1e293b";
  const light = "#f8fafc";

  sidebarSections.push(`
    <h1 style="margin:0 0 12px;font-size:20px;font-weight:700;color:#fff;letter-spacing:1px;">${esc(b.name)}</h1>
    <div style="font-size:11px;color:#94a3b8;line-height:2;">
      ${b.email ? `<div>✉ ${esc(b.email)}</div>` : ""}
      ${b.phone ? `<div>☎ ${esc(b.phone)}</div>` : ""}
      ${b.location ? `<div>📍 ${esc(b.location)}</div>` : ""}
      ${b.website ? `<div>🌐 ${esc(b.website)}</div>` : ""}
      ${b.github ? `<div>💻 ${esc(b.github)}</div>` : ""}
      ${b.linkedin ? `<div>🔗 ${esc(b.linkedin)}</div>` : ""}
    </div>
  `);

  if (c.skills.length) {
    const items = c.skills.map((s) => `
      <div style="margin-bottom:8px;">
        <div style="font-size:11px;font-weight:600;color:#e2e8f0;margin-bottom:3px;">${esc(s.name)}</div>
        <div style="font-size:10px;color:#94a3b8;">${s.skills.map(esc).join(" · ")}</div>
      </div>
    `).join("");
    sidebarSections.push(sidebarSection("Skills", items));
  }

  if (c.education.length) {
    const items = c.education.map((e) => `
      <div style="margin-bottom:8px;">
        <div style="font-size:11px;font-weight:600;color:#e2e8f0;">${esc(e.school)}</div>
        <div style="font-size:10px;color:#94a3b8;">${esc(e.degree)} ${esc(e.major)}</div>
        <div style="font-size:10px;color:#64748b;">${esc(e.startDate)} — ${esc(e.endDate)}</div>
      </div>
    `).join("");
    sidebarSections.push(sidebarSection("Education", items));
  }

  if (c.certificates.length) {
    const items = c.certificates.map((cert) => `
      <div style="margin-bottom:4px;">
        <div style="font-size:10px;color:#94a3b8;">${esc(cert.name)}</div>
        ${cert.issuer ? `<div style="font-size:9px;color:#64748b;">${esc(cert.issuer)}</div>` : ""}
      </div>
    `).join("");
    sidebarSections.push(sidebarSection("Certificates", items));
  }

  if (c.openSource.length) {
    const items = c.openSource.map((o) => `
      <div style="margin-bottom:4px;">
        <div style="font-size:10px;color:#94a3b8;">${esc(o.name)}</div>
        ${o.role ? `<div style="font-size:9px;color:#64748b;">${esc(o.role)}</div>` : ""}
      </div>
    `).join("");
    sidebarSections.push(sidebarSection("Open Source", items));
  }

  if (c.summary) {
    mainSections.push(`<div style="margin-bottom:16px;">
      <p style="margin:0;font-size:12px;line-height:1.7;color:#475569;white-space:pre-wrap;">${esc(c.summary)}</p>
    </div>`);
  }

  if (c.workExperience.length) {
    const items = c.workExperience.map((w) => `
      <div style="margin-bottom:14px;">
        <div style="display:flex;justify-content:space-between;align-items:baseline;">
          <h3 style="margin:0;font-size:14px;font-weight:600;color:#0f172a;">${esc(w.position)}</h3>
          <span style="font-size:10px;color:#94a3b8;">${esc(w.startDate)} — ${esc(w.endDate)}</span>
        </div>
        <p style="margin:2px 0 0;font-size:12px;color:#0ea5e9;font-weight:500;">${esc(w.company)}</p>
        ${w.description ? `<p style="margin:6px 0 0;font-size:12px;color:#475569;line-height:1.6;">${esc(w.description)}</p>` : ""}
        ${w.highlights.length ? `<ul style="margin:6px 0 0;padding-left:16px;font-size:11px;color:#475569;line-height:1.6;">${w.highlights.map((h) => `<li style="margin-bottom:2px;">${esc(h)}</li>`).join("")}</ul>` : ""}
      </div>
    `).join("");
    mainSections.push(mainSection("Experience", items));
  }

  if (c.projects.length) {
    const items = c.projects.map((p) => `
      <div style="margin-bottom:12px;">
        <div style="display:flex;justify-content:space-between;align-items:baseline;">
          <strong style="font-size:13px;color:#0f172a;">${esc(p.name)}</strong>
          <span style="font-size:10px;color:#94a3b8;">${esc(p.startDate)} — ${esc(p.endDate)}</span>
        </div>
        ${p.role ? `<p style="margin:2px 0 0;font-size:11px;color:#0ea5e9;">${esc(p.role)}</p>` : ""}
        ${p.highlights.length ? `<ul style="margin:4px 0 0;padding-left:16px;font-size:11px;color:#475569;line-height:1.6;">${p.highlights.map((h) => `<li style="margin-bottom:2px;">${esc(h)}</li>`).join("")}</ul>` : ""}
      </div>
    `).join("");
    mainSections.push(mainSection("Projects", items));
  }

  c.customSections.forEach((cs) => {
    if (cs.title && cs.content) {
      mainSections.push(mainSection(cs.title, `<p style="margin:0;font-size:12px;color:#475569;line-height:1.7;white-space:pre-wrap;">${esc(cs.content)}</p>`));
    }
  });

  const sidebarHtml = sidebarSections.join("");
  const mainHtml = mainSections.join("");

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
    @page{size:A4;margin:0;}
    *{box-sizing:border-box;}
    html,body{width:210mm;min-height:297mm;padding:0;margin:0 auto;overflow:hidden;}
    body{font-family:system-ui,-apple-system,sans-serif;margin:0;padding:0;color:#333;line-height:1.5;}
    .page{display:flex;min-height:297mm;}
    .sidebar{width:240px;background:${dark};padding:32px 20px;color:#fff;flex-shrink:0;}
    .main{flex:1;padding:32px 28px;background:#fff;}
    ul{margin:0;}li{margin-bottom:2px;}
    @media print{html,body{width:auto;min-height:auto;overflow:visible;}}
  </style></head><body>
    <div class="page">
      <div class="sidebar">${sidebarHtml}</div>
      <div class="main">${mainHtml}</div>
    </div>
  </body></html>`;
}

function sidebarSection(title: string, content: string): string {
  return `
    <div style="margin-top:20px;">
      <h2 style="font-size:11px;font-weight:700;margin:0 0 8px;text-transform:uppercase;letter-spacing:1.5px;color:#64748b;border-bottom:1px solid #334155;padding-bottom:4px;">${esc(title)}</h2>
      ${content}
    </div>
  `;
}

function mainSection(title: string, content: string): string {
  return `
    <div style="margin-bottom:16px;">
      <h2 style="font-size:13px;font-weight:700;margin:0 0 8px;text-transform:uppercase;letter-spacing:0.5px;color:#1e293b;padding-bottom:4px;border-bottom:2px solid #0ea5e9;">${esc(title)}</h2>
      ${content}
    </div>
  `;
}

function compactTemplate(c: ResumeContent): string {
  const b = c.basic;
  const sections: string[] = [];

  sections.push(`
    <div style="margin-bottom:10px;padding-bottom:8px;border-bottom:2px solid #111;">
      <h1 style="margin:0;font-size:18px;font-weight:700;text-transform:uppercase;letter-spacing:2px;">${esc(b.name)}</h1>
      <p style="margin:3px 0 0;font-size:10px;color:#555;">
        ${[b.email, b.phone, b.location, b.website, b.github, b.linkedin].filter(Boolean).map(esc).join(" · ")}
      </p>
    </div>
  `);

  if (c.summary) {
    sections.push(`<div style="margin-bottom:8px;padding:6px 8px;background:#f8f8f8;border-radius:3px;">
      <p style="margin:0;font-size:11px;line-height:1.5;white-space:pre-wrap;">${esc(c.summary)}</p>
    </div>`);
  }

  if (c.workExperience.length) {
    const items = c.workExperience.map((w) => `
      <div style="margin-bottom:6px;">
        <div style="display:flex;justify-content:space-between;">
          <strong style="font-size:12px;">${esc(w.company)}</strong>
          <span style="font-size:9px;color:#888;">${esc(w.startDate)} — ${esc(w.endDate)}</span>
        </div>
        <span style="font-size:10px;color:#555;font-style:italic;">${esc(w.position)}</span>
        ${w.highlights.length ? `<ul style="margin:2px 0 0;padding-left:14px;font-size:10px;line-height:1.4;">${w.highlights.map((h) => `<li>${esc(h)}</li>`).join("")}</ul>` : ""}
      </div>
    `).join("");
    sections.push(compactSection("Experience", items));
  }

  if (c.projects.length) {
    const items = c.projects.map((p) => `
      <div style="margin-bottom:5px;">
        <div style="display:flex;justify-content:space-between;">
          <strong style="font-size:11px;">${esc(p.name)}</strong>
          <span style="font-size:9px;color:#888;">${esc(p.startDate)} — ${esc(p.endDate)}</span>
        </div>
        ${p.role ? `<span style="font-size:10px;color:#555;">${esc(p.role)}</span>` : ""}
        ${p.highlights.length ? `<ul style="margin:2px 0 0;padding-left:14px;font-size:10px;line-height:1.4;">${p.highlights.map((h) => `<li>${esc(h)}</li>`).join("")}</ul>` : ""}
      </div>
    `).join("");
    sections.push(compactSection("Projects", items));
  }

  if (c.education.length) {
    const items = c.education.map((e) => `
      <div style="margin-bottom:4px;">
        <strong style="font-size:11px;">${esc(e.school)}</strong>
        <span style="font-size:10px;"> — ${esc(e.degree)} ${esc(e.major)}${e.gpa ? " (" + esc(e.gpa) + ")" : ""}</span>
        <span style="font-size:9px;color:#888;"> ${esc(e.startDate)} — ${esc(e.endDate)}</span>
      </div>
    `).join("");
    sections.push(compactSection("Education", items));
  }

  if (c.skills.length) {
    const items = c.skills.map((s) => `<strong style="font-size:10px;">${esc(s.name)}:</strong> <span style="font-size:10px;">${s.skills.map(esc).join(", ")}</span>`).join("&nbsp;&nbsp;|&nbsp;&nbsp;");
    sections.push(compactSection("Skills", `<p style="margin:0;font-size:10px;">${items}</p>`));
  }

  if (c.certificates.length) {
    const items = c.certificates.map((cert) => `${esc(cert.name)}${cert.issuer ? " — " + esc(cert.issuer) : ""}`).join(" · ");
    sections.push(compactSection("Certificates", `<p style="margin:0;font-size:10px;">${items}</p>`));
  }

  if (c.openSource.length) {
    const items = c.openSource.map((o) => `${esc(o.name)}${o.role ? " (" + esc(o.role) + ")" : ""}`).join(" · ");
    sections.push(compactSection("Open Source", `<p style="margin:0;font-size:10px;">${items}</p>`));
  }

  c.customSections.forEach((cs) => {
    if (cs.title && cs.content) {
      sections.push(compactSection(cs.title, `<p style="margin:0;font-size:10px;line-height:1.4;white-space:pre-wrap;">${esc(cs.content)}</p>`));
    }
  });

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
    @page{size:A4;margin:0;}
    *{box-sizing:border-box;}
    html,body{width:210mm;min-height:297mm;padding:0;margin:0 auto;overflow:hidden;}
    body{font-family:system-ui,-apple-system,sans-serif;margin:0;padding:24px 32px;color:#111;line-height:1.4;font-size:11px;}
    ul{margin:0;}li{margin-bottom:1px;}
    @media print{html,body{width:auto;min-height:auto;overflow:visible;}}
  </style></head><body>${sections.join("")}</body></html>`;
}

function compactSection(title: string, content: string): string {
  return `<div style="margin-bottom:6px;">
    <h2 style="font-size:11px;font-weight:700;margin:0 0 3px;text-transform:uppercase;letter-spacing:0.5px;border-bottom:1px solid #ccc;padding-bottom:2px;">${esc(title)}</h2>
    ${content}
  </div>`;
}

function section(title: string, content: string, color = "#333"): string {
  return `
    <div style="margin-bottom:14px;page-break-inside:avoid;">
      <h2 style="font-size:15px;font-weight:bold;margin:0 0 6px;padding-bottom:4px;border-bottom:1px solid ${color};color:${color};page-break-after:avoid;">${esc(title)}</h2>
      ${content}
    </div>
  `;
}

function itemDiv(content: string, marginBottom = "10px"): string {
  return `<div style="margin-bottom:${marginBottom};page-break-inside:avoid;">${content}</div>`;
}

function wrapPage(body: string): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8">
<style>
  @page { size: A4; margin: 0; orphans: 3; widows: 3; }
  * { box-sizing: border-box; }
  html, body {
    width: 210mm;
    padding: 0;
    margin: 0 auto;
    font-family: system-ui, -apple-system, sans-serif;
    color: #333;
    line-height: 1.5;
    background: white;
  }
  body { padding: 40px 48px; }
  /* Prevent page breaks inside headings */
  h1, h2, h3 { page-break-after: avoid; }
  /* Prevent page breaks inside section containers */
  body > div { page-break-inside: avoid; }
  body > div > div { page-break-inside: avoid; }
  /* Prevent page breaks inside list items and content blocks */
  ul, ol { page-break-inside: avoid; }
  li { page-break-inside: avoid; }
  @media print {
    html, body { width: auto; overflow: visible; margin: 0; padding: 0; }
    @page { size: A4; margin: 10mm; }
    body { padding: 10mm; }
  }
</style></head><body>${body}</body></html>`;
}

function esc(s: string | undefined | null): string {
  if (!s) return "";
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
