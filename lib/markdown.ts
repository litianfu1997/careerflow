import type { ResumeContent } from "./resume-schema";

export function resumeToMarkdown(content: ResumeContent): string {
  const lines: string[] = [];
  const b = content.basic;

  if (b.name) lines.push(`# ${b.name}`, "");
  const contact = [b.email, b.phone, b.location, b.website, b.github, b.linkedin].filter(Boolean);
  if (contact.length) lines.push(contact.join(" | "), "");

  if (content.summary) lines.push("## Summary", "", content.summary, "");

  if (content.education.length) {
    lines.push("## Education", "");
    content.education.forEach((e) => {
      lines.push(`### ${e.school}`);
      lines.push(`${e.degree} ${e.major} | ${e.startDate} - ${e.endDate}`);
      if (e.gpa) lines.push(`GPA: ${e.gpa}`);
      if (e.description) lines.push("", e.description);
      lines.push("");
    });
  }

  if (content.workExperience.length) {
    lines.push("## Work Experience", "");
    content.workExperience.forEach((w) => {
      lines.push(`### ${w.company} | ${w.position}`);
      lines.push(`${w.startDate} - ${w.endDate}`);
      if (w.description) lines.push("", w.description);
      if (w.highlights.length) {
        lines.push("");
        w.highlights.forEach((h) => lines.push(`- ${h}`));
      }
      lines.push("");
    });
  }

  if (content.projects.length) {
    lines.push("## Projects", "");
    content.projects.forEach((p) => {
      lines.push(`### ${p.name}${p.role ? ` | ${p.role}` : ""}`);
      if (p.startDate) lines.push(`${p.startDate} - ${p.endDate || "Present"}`);
      if (p.url) lines.push(`URL: ${p.url}`);
      if (p.description) lines.push("", p.description);
      if (p.highlights.length) {
        lines.push("");
        p.highlights.forEach((h) => lines.push(`- ${h}`));
      }
      lines.push("");
    });
  }

  if (content.skills.length) {
    lines.push("## Skills", "");
    content.skills.forEach((s) => {
      lines.push(`**${s.name}:** ${s.skills.join(", ")}`);
    });
    lines.push("");
  }

  if (content.certificates.length) {
    lines.push("## Certificates & Awards", "");
    content.certificates.forEach((c) => {
      lines.push(`- **${c.name}**${c.issuer ? ` - ${c.issuer}` : ""}${c.date ? ` (${c.date})` : ""}`);
    });
    lines.push("");
  }

  if (content.openSource.length) {
    lines.push("## Open Source", "");
    content.openSource.forEach((o) => {
      lines.push(`- **${o.name}**${o.role ? ` (${o.role})` : ""}${o.description ? ` - ${o.description}` : ""}`);
    });
    lines.push("");
  }

  content.customSections.forEach((cs) => {
    if (cs.title) {
      lines.push(`## ${cs.title}`, "", cs.content, "");
    }
  });

  return lines.join("\n");
}
