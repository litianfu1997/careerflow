export type EditableTemplatePreset = {
  html: string;
  css: string;
};

const presets: Record<string, EditableTemplatePreset> = {
  "clean-cn": {
    html: `<!-- Clean Chinese Resume Template -->
<div class="resume">
  <header class="resume-header">
    {{header}}
  </header>

  {{summary}}

  <section class="resume-section">
    {{education}}
  </section>

  <section class="resume-section">
    {{workExperience}}
  </section>

  <section class="resume-section">
    {{projects}}
  </section>

  <section class="resume-section">
    {{skills}}
  </section>

  <section class="resume-section">
    {{certificates}}
  </section>

  <section class="resume-section">
    {{openSource}}
  </section>

  <section class="resume-section">
    {{customSections}}
  </section>
</div>`,
    css: `body {
  padding: 40px 48px;
  color: #333;
}

h1 {
  letter-spacing: 0;
}

.resume-header {
  text-align: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 2px solid #333;
}

.resume-section {
  margin-bottom: 16px;
}`,
  },
  "tech-cn": {
    html: `<!-- Tech-focused Chinese Resume Template -->
<div class="resume">
  <header class="resume-header">
    {{header}}
  </header>

  <!-- Skills come first for tech roles -->
  <section class="resume-section">
    {{skills}}
  </section>

  <section class="resume-section">
    {{workExperience}}
  </section>

  <section class="resume-section">
    {{projects}}
  </section>

  <section class="resume-section">
    {{openSource}}
  </section>

  <section class="resume-section">
    {{education}}
  </section>

  <section class="resume-section">
    {{certificates}}
  </section>

  <section class="resume-section">
    {{customSections}}
  </section>
</div>`,
    css: `body {
  padding: 38px 46px;
  color: #1f2937;
}

body::before {
  content: "";
  display: block;
  height: 4px;
  margin-bottom: 18px;
  background: #2563eb;
}

.resume-header {
  text-align: center;
  margin-bottom: 20px;
}

.resume-section {
  margin-bottom: 14px;
}`,
  },
  "ats-en": {
    html: `<!-- ATS-friendly English Resume Template -->
<div class="resume">
  <header class="resume-header">
    {{header}}
  </header>

  {{summary}}

  <section class="resume-section">
    {{workExperience}}
  </section>

  <section class="resume-section">
    {{education}}
  </section>

  <section class="resume-section">
    {{skills}}
  </section>

  <section class="resume-section">
    {{projects}}
  </section>

  <section class="resume-section">
    {{certificates}}
  </section>

  <section class="resume-section">
    {{openSource}}
  </section>

  <section class="resume-section">
    {{customSections}}
  </section>
</div>`,
    css: `body {
  padding: 36px 44px;
  color: #111;
  font-family: Arial, Helvetica, sans-serif;
}

h1, h2, h3 {
  font-weight: 600;
}

.resume-header {
  text-align: center;
  margin-bottom: 20px;
}

.resume-section {
  margin-bottom: 12px;
}`,
  },
  "modern-en": {
    html: `<!-- Modern Professional English Resume Template -->
<div class="resume">
  {{header}}
  {{summary}}
  <div class="resume-grid">
    <main class="resume-main">
      {{workExperience}}
      {{projects}}
      {{customSections}}
    </main>
    <aside class="resume-sidebar">
      {{skills}}
      {{education}}
      {{certificates}}
      {{openSource}}
    </aside>
  </div>
</div>`,
    css: `body {
  padding: 42px 46px;
  color: #0f172a;
}

body::before {
  content: "";
  display: block;
  width: 72px;
  height: 5px;
  margin-bottom: 18px;
  background: #0369a1;
}

.resume-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 210px;
  gap: 28px;
}

.resume-main {
  min-width: 0;
}

.resume-sidebar {
  min-width: 0;
}`,
  },
  "elegant-cn": {
    html: `<!-- Elegant Chinese Resume Template -->
<div class="resume">
  <header class="resume-header">
    {{header}}
  </header>

  {{summary}}

  <section class="resume-section">
    {{education}}
  </section>

  <section class="resume-section">
    {{workExperience}}
  </section>

  <section class="resume-section">
    {{projects}}
  </section>

  <section class="resume-section">
    {{skills}}
  </section>

  <section class="resume-section">
    {{certificates}}
  </section>

  <section class="resume-section">
    {{openSource}}
  </section>

  <section class="resume-section">
    {{customSections}}
  </section>
</div>`,
    css: `body {
  padding: 44px 52px;
  color: #2c2c2c;
  font-family: "Times New Roman", "Noto Serif SC", serif;
}

body::before {
  content: "";
  display: block;
  height: 1px;
  margin-bottom: 22px;
  background: #c9a96e;
}

.resume-header {
  text-align: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #c9a96e;
}

.resume-section {
  margin-bottom: 14px;
}`,
  },
  sidebar: {
    html: `<!-- Sidebar Layout Resume Template -->
<div class="resume-layout">
  <aside class="sidebar">
    {{header}}
    {{skills}}
    {{education}}
    {{certificates}}
    {{openSource}}
  </aside>
  <main class="main">
    {{summary}}
    {{workExperience}}
    {{projects}}
    {{customSections}}
  </main>
</div>`,
    css: `body {
  padding: 0;
}

.resume-layout {
  display: grid;
  grid-template-columns: 240px minmax(0, 1fr);
  min-height: 297mm;
}

.sidebar {
  padding: 32px 20px;
  background: #1e293b;
  color: #fff;
}

.main {
  padding: 32px 28px;
}`,
  },
  compact: {
    html: `<!-- Compact Dense Resume Template -->
<div class="resume">
  <header class="resume-header">
    {{header}}
  </header>

  {{summary}}

  <section class="resume-section">
    {{workExperience}}
  </section>

  <section class="resume-section">
    {{education}}
  </section>

  <section class="resume-section">
    {{skills}}
  </section>

  <section class="resume-section">
    {{projects}}
  </section>

  <section class="resume-section">
    {{certificates}}
  </section>

  <section class="resume-section">
    {{openSource}}
  </section>

  <section class="resume-section">
    {{customSections}}
  </section>
</div>`,
    css: `body {
  padding: 24px 32px;
  color: #111;
  font-size: 11px;
  line-height: 1.4;
}

ul {
  margin-top: 2px;
}

.resume-header {
  text-align: center;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #ccc;
}

.resume-section {
  margin-bottom: 8px;
}`,
  },
};

export function getEditableTemplatePreset(name: string): EditableTemplatePreset | null {
  return presets[name] || null;
}
