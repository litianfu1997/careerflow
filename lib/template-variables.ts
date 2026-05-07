import type { ResumeContent } from "./resume-schema";

function esc(s: string | undefined | null): string {
  if (!s) return "";
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function buildAvatarHtml(
  avatar: string, size: number, extra: string,
  style?: { shape?: string; scale?: number; offsetX?: number; offsetY?: number },
): string {
  if (!avatar) return "";
  const s = style || {};
  const shape = s.shape || "circle";
  const scale = s.scale ?? 1;
  const offsetX = s.offsetX ?? 0;
  const offsetY = s.offsetY ?? 0;
  let borderRadius = "50%";
  if (shape === "square") borderRadius = "0";
  else if (shape === "rounded") borderRadius = "12px";
  const imgSize = size * scale;
  const tx = offsetX * size / 100;
  const ty = offsetY * size / 100;
  return `<div style="width:${size}px;height:${size}px;border-radius:${borderRadius};overflow:hidden;position:relative;${extra}">` +
    `<img src="${esc(avatar)}" alt="" style="width:${imgSize}px;height:${imgSize}px;object-fit:cover;position:absolute;top:50%;left:50%;transform:translate(calc(-50% + ${tx}px), calc(-50% + ${ty}px));" />` +
    `</div>`;
}

export function renderSections(c: ResumeContent): Record<string, string> {
  const b = c.basic;
  const sections: Record<string, string> = {};

  const hasContact = [b.name, b.email, b.phone, b.location, b.website, b.github, b.linkedin, b.avatar].some(Boolean);

  const avatarHtml = b.avatar
    ? buildAvatarHtml(b.avatar, 100, "display:inline-block;", b.avatarStyle)
    : "";
  sections.avatar = avatarHtml;

  const avatarBlock = b.avatar ? `<div style="margin-bottom:12px;">${avatarHtml}</div>` : "";

  if (hasContact) {
    sections.header = `
      <div style="text-align:center;margin-bottom:20px;">
        ${avatarBlock}
        <h1 style="margin:0;font-size:24px;font-weight:bold;">${esc(b.name)}</h1>
        <p style="margin:4px 0 0;color:#666;font-size:13px;">
          ${[b.email, b.phone, b.location, b.website, b.github, b.linkedin].filter(Boolean).map(esc).join(" | ")}
        </p>
      </div>
    `;
  } else {
    sections.header = "";
  }

  sections.summary = c.summary
    ? `<div style="margin-bottom:14px;"><h2 style="font-size:15px;font-weight:bold;margin:0 0 6px;padding-bottom:4px;border-bottom:1px solid #333;color:#333;">Personal Summary</h2><p style="margin:0;font-size:13px;line-height:1.6;white-space:pre-wrap;">${esc(c.summary)}</p></div>`
    : "";

  sections.education = c.education.length
    ? renderEducationSection(c)
    : "";

  sections.workExperience = c.workExperience.length
    ? renderWorkExperienceSection(c)
    : "";

  sections.projects = c.projects.length
    ? renderProjectsSection(c)
    : "";

  sections.skills = c.skills.length
    ? renderSkillsSection(c)
    : "";

  sections.certificates = c.certificates.length
    ? renderCertificatesSection(c)
    : "";

  sections.openSource = c.openSource.length
    ? renderOpenSourceSection(c)
    : "";

  const customParts = c.customSections
    .filter((cs) => cs.title && cs.content)
    .map((cs) => `<div style="margin-bottom:14px;"><h2 style="font-size:15px;font-weight:bold;margin:0 0 6px;padding-bottom:4px;border-bottom:1px solid #333;color:#333;">${esc(cs.title)}</h2><p style="margin:0;font-size:13px;line-height:1.6;white-space:pre-wrap;">${esc(cs.content)}</p></div>`)
    .join("");
  sections.customSections = customParts;

  sections.fullName = esc(b.name);
  sections.email = esc(b.email);
  sections.phone = esc(b.phone);

  return sections;
}

function section(title: string, content: string, color = "#333"): string {
  return `
    <div style="margin-bottom:14px;">
      <h2 style="font-size:15px;font-weight:bold;margin:0 0 6px;padding-bottom:4px;border-bottom:1px solid ${color};color:${color};">${esc(title)}</h2>
      ${content}
    </div>
  `;
}

function renderEducationSection(c: ResumeContent): string {
  const items = c.education.map((e) => `
    <div style="margin-bottom:8px;">
      <div style="display:flex;justify-content:space-between;">
        <strong>${esc(e.school)}</strong>
        <span style="color:#666;font-size:12px;">${esc(e.startDate)} - ${esc(e.endDate)}</span>
      </div>
      <p style="margin:2px 0 0;font-size:13px;">${esc(e.degree)} ${esc(e.major)} ${e.gpa ? "· GPA: " + esc(e.gpa) : ""}</p>
      ${e.description ? `<p style="margin:2px 0 0;font-size:12px;color:#555;">${esc(e.description)}</p>` : ""}
    </div>
  `).join("");
  return section("Education", items);
}

function renderWorkExperienceSection(c: ResumeContent): string {
  const items = c.workExperience.map((w) => `
    <div style="margin-bottom:10px;">
      <div style="display:flex;justify-content:space-between;">
        <strong>${esc(w.company)}</strong>
        <span style="color:#666;font-size:12px;">${esc(w.startDate)} - ${esc(w.endDate)}</span>
      </div>
      <p style="margin:2px 0 0;font-size:13px;font-style:italic;">${esc(w.position)}</p>
      ${w.description ? `<p style="margin:4px 0 0;font-size:12px;line-height:1.5;">${esc(w.description)}</p>` : ""}
      ${w.highlights.length ? `<ul style="margin:4px 0 0;padding-left:16px;font-size:12px;line-height:1.5;">${w.highlights.map((h) => `<li>${esc(h)}</li>`).join("")}</ul>` : ""}
    </div>
  `).join("");
  return section("Work Experience", items);
}

function renderProjectsSection(c: ResumeContent): string {
  const items = c.projects.map((p) => `
    <div style="margin-bottom:8px;">
      <div style="display:flex;justify-content:space-between;">
        <strong>${esc(p.name)}</strong>
        <span style="color:#666;font-size:12px;">${esc(p.startDate)} - ${esc(p.endDate)}</span>
      </div>
      ${p.role ? `<p style="margin:2px 0 0;font-size:13px;font-style:italic;">${esc(p.role)}</p>` : ""}
      ${p.description ? `<p style="margin:4px 0 0;font-size:12px;line-height:1.5;">${esc(p.description)}</p>` : ""}
      ${p.highlights.length ? `<ul style="margin:4px 0 0;padding-left:16px;font-size:12px;line-height:1.5;">${p.highlights.map((h) => `<li>${esc(h)}</li>`).join("")}</ul>` : ""}
    </div>
  `).join("");
  return section("Projects", items);
}

function renderSkillsSection(c: ResumeContent): string {
  const items = c.skills.map((s) => `
    <div style="margin-bottom:4px;">
      <strong>${esc(s.name)}:</strong> <span style="font-size:13px;">${s.skills.map(esc).join(", ")}</span>
    </div>
  `).join("");
  return section("Skills", items);
}

function renderCertificatesSection(c: ResumeContent): string {
  const items = c.certificates.map((cert) => `
    <div style="margin-bottom:4px;">
      <strong>${esc(cert.name)}</strong>
      ${cert.issuer ? ` - ${esc(cert.issuer)}` : ""}
      ${cert.date ? ` (${esc(cert.date)})` : ""}
    </div>
  `).join("");
  return section("Certificates & Awards", items);
}

function renderOpenSourceSection(c: ResumeContent): string {
  const items = c.openSource.map((o) => `
    <div style="margin-bottom:4px;">
      <strong>${esc(o.name)}</strong>
      ${o.role ? ` (${esc(o.role)})` : ""}
      ${o.description ? ` - ${esc(o.description)}` : ""}
    </div>
  `).join("");
  return section("Open Source", items);
}
