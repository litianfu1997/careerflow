import type { ResumeContent } from "./resume-schema";

export const sampleResumeContent: ResumeContent = {
  basic: {
    name: "张明",
    email: "zhangming@example.com",
    phone: "138-0000-0000",
    location: "北京市",
    website: "https://zhangming.dev",
    github: "github.com/zhangming",
    linkedin: "linkedin.com/in/zhangming",
    avatar: "",
  },
  summary: "拥有 5 年以上全栈开发经验的资深软件工程师，擅长 React、Node.js 和云原生技术。在多个大型项目中主导技术架构设计，具备优秀的团队协作和问题解决能力。",
  education: [
    {
      id: "1",
      school: "北京大学",
      degree: "硕士",
      major: "计算机科学与技术",
      startDate: "2016-09",
      endDate: "2019-06",
      gpa: "3.8/4.0",
      description: "研究方向为分布式系统与高性能计算",
    },
    {
      id: "2",
      school: "浙江大学",
      degree: "学士",
      major: "软件工程",
      startDate: "2012-09",
      endDate: "2016-06",
      gpa: "",
      description: "",
    },
  ],
  workExperience: [
    {
      id: "1",
      company: "字节跳动",
      position: "高级前端工程师",
      startDate: "2021-03",
      endDate: "至今",
      description: "负责抖音创作者平台的前端架构设计与核心功能开发",
      highlights: [
        "主导创作者数据分析平台重构，页面加载速度提升 60%",
        "设计并实现组件库，覆盖 50+ 业务组件，团队开发效率提升 40%",
        "推动 TypeScript 全面落地，代码质量评分从 B 提升至 A",
      ],
    },
    {
      id: "2",
      company: "阿里巴巴",
      position: "前端工程师",
      startDate: "2019-07",
      endDate: "2021-02",
      description: "参与淘宝商家后台系统开发",
      highlights: [
        "负责商品管理模块开发，日活用户 50 万+",
        "优化前端构建流程，CI 构建时间缩短 45%",
      ],
    },
  ],
  projects: [
    {
      id: "1",
      name: "DataViz Pro",
      role: "核心开发者",
      startDate: "2023-01",
      endDate: "2023-08",
      description: "开源数据可视化工具，支持拖拽式图表配置",
      url: "https://github.com/zhangming/dataviz-pro",
      highlights: [
        "GitHub Stars 2.3k+，周下载量 5000+",
        "支持 15+ 图表类型，可扩展插件体系",
      ],
    },
  ],
  skills: [
    { id: "1", name: "前端技术", skills: ["React", "Vue", "TypeScript", "Next.js", "Tailwind CSS"] },
    { id: "2", name: "后端技术", skills: ["Node.js", "Go", "PostgreSQL", "Redis", "Docker"] },
    { id: "3", name: "工具与其他", skills: ["Git", "CI/CD", "Kubernetes", "AWS", "Figma"] },
  ],
  certificates: [
    { id: "1", name: "AWS Solutions Architect", issuer: "Amazon Web Services", date: "2022-06", url: "" },
    { id: "2", name: "Kubernetes 认证管理员 (CKA)", issuer: "CNCF", date: "2021-11", url: "" },
  ],
  openSource: [
    { id: "1", name: "React Core", url: "https://github.com/facebook/react", description: "贡献了 3 个 PR，涉及并发渲染优化", role: "Contributor" },
  ],
  customSections: [],
};
