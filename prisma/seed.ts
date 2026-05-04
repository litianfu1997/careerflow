import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Seed built-in templates
  const templates = [
    {
      name: "clean-cn",
      displayName: "Chinese Clean",
      description: "A clean single-column Chinese resume template",
      isBuiltin: true,
    },
    {
      name: "tech-cn",
      displayName: "Chinese Tech",
      description: "A tech-focused Chinese resume highlighting skills and projects",
      isBuiltin: true,
    },
    {
      name: "ats-en",
      displayName: "ATS English",
      description: "A minimal ATS-friendly English resume template",
      isBuiltin: true,
    },
    {
      name: "modern-en",
      displayName: "Modern Professional",
      description: "A modern English template with accent borders and clean typography",
      isBuiltin: true,
    },
    {
      name: "elegant-cn",
      displayName: "Elegant Chinese",
      description: "An elegant Chinese template with refined borders and sophisticated layout",
      isBuiltin: true,
    },
    {
      name: "sidebar",
      displayName: "Sidebar Layout",
      description: "A two-column layout with a dark sidebar for contact info and skills",
      isBuiltin: true,
    },
    {
      name: "compact",
      displayName: "Compact Dense",
      description: "A space-efficient compact template for content-heavy resumes",
      isBuiltin: true,
    },
  ];

  for (const t of templates) {
    await prisma.resumeTemplate.upsert({
      where: { name: t.name },
      update: t,
      create: t,
    });
  }

  console.log("Seeded templates:", templates.map((t) => t.name));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
