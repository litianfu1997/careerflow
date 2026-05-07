import { z } from "zod";

export const avatarStyleSchema = z.object({
  shape: z.enum(["circle", "square", "rounded"]).default("circle"),
  scale: z.number().min(1).max(3).default(1),
  offsetX: z.number().min(-50).max(50).default(0),
  offsetY: z.number().min(-50).max(50).default(0),
}).default({});

export const basicSchema = z.object({
  name: z.string().default(""),
  email: z.string().default(""),
  phone: z.string().default(""),
  location: z.string().default(""),
  website: z.string().default(""),
  github: z.string().default(""),
  linkedin: z.string().default(""),
  avatar: z.string().default(""),
  avatarStyle: avatarStyleSchema,
});

export const summarySchema = z.string().default("");

export const educationItemSchema = z.object({
  id: z.string(),
  school: z.string().default(""),
  degree: z.string().default(""),
  major: z.string().default(""),
  startDate: z.string().default(""),
  endDate: z.string().default(""),
  gpa: z.string().default(""),
  description: z.string().default(""),
});

export const workExperienceItemSchema = z.object({
  id: z.string(),
  company: z.string().default(""),
  position: z.string().default(""),
  startDate: z.string().default(""),
  endDate: z.string().default(""),
  description: z.string().default(""),
  highlights: z.array(z.string()).default([]),
});

export const projectItemSchema = z.object({
  id: z.string(),
  name: z.string().default(""),
  role: z.string().default(""),
  startDate: z.string().default(""),
  endDate: z.string().default(""),
  description: z.string().default(""),
  url: z.string().default(""),
  highlights: z.array(z.string()).default([]),
});

export const skillCategorySchema = z.object({
  id: z.string(),
  name: z.string().default(""),
  skills: z.array(z.string()).default([]),
});

export const certificateItemSchema = z.object({
  id: z.string(),
  name: z.string().default(""),
  issuer: z.string().default(""),
  date: z.string().default(""),
  url: z.string().default(""),
});

export const openSourceItemSchema = z.object({
  id: z.string(),
  name: z.string().default(""),
  url: z.string().default(""),
  description: z.string().default(""),
  role: z.string().default(""),
});

export const customSectionItemSchema = z.object({
  id: z.string(),
  title: z.string().default(""),
  content: z.string().default(""),
});

export const resumeContentSchema = z.object({
  basic: basicSchema.default({}),
  summary: summarySchema.default(""),
  education: z.array(educationItemSchema).default([]),
  workExperience: z.array(workExperienceItemSchema).default([]),
  projects: z.array(projectItemSchema).default([]),
  skills: z.array(skillCategorySchema).default([]),
  certificates: z.array(certificateItemSchema).default([]),
  openSource: z.array(openSourceItemSchema).default([]),
  customSections: z.array(customSectionItemSchema).default([]),
});

export type ResumeContent = z.infer<typeof resumeContentSchema>;
export type AvatarStyle = z.infer<typeof avatarStyleSchema>;
export type EducationItem = z.infer<typeof educationItemSchema>;
export type WorkExperienceItem = z.infer<typeof workExperienceItemSchema>;
export type ProjectItem = z.infer<typeof projectItemSchema>;
export type SkillCategory = z.infer<typeof skillCategorySchema>;
export type CertificateItem = z.infer<typeof certificateItemSchema>;
export type OpenSourceItem = z.infer<typeof openSourceItemSchema>;
export type CustomSectionItem = z.infer<typeof customSectionItemSchema>;

export function defaultResumeContent(): ResumeContent {
  return {
    basic: {
      name: "", email: "", phone: "", location: "",
      website: "", github: "", linkedin: "", avatar: "",
      avatarStyle: { shape: "circle", scale: 1, offsetX: 0, offsetY: 0 },
    },
    summary: "",
    education: [],
    workExperience: [],
    projects: [],
    skills: [],
    certificates: [],
    openSource: [],
    customSections: [],
  };
}
