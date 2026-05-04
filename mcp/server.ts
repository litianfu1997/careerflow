#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

const API_BASE = process.env.CAREERFLOW_API_URL || "http://localhost:3000";
const API_KEY = process.env.CAREERFLOW_API_KEY || "";

async function apiCall(path: string, options: RequestInit = {}): Promise<any> {
  const url = `${API_BASE}/api/agent${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      "Authorization": `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `API error: ${res.status}`);
  return data;
}

const server = new Server(
  { name: "careerflow", version: "0.1.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "list_resumes",
      description: "List all resumes for the authenticated user",
      inputSchema: { type: "object", properties: {} },
    },
    {
      name: "get_resume",
      description: "Get full details of a specific resume",
      inputSchema: {
        type: "object",
        properties: { resumeId: { type: "string", description: "Resume ID" } },
        required: ["resumeId"],
      },
    },
    {
      name: "get_resume_sections",
      description: "Get all sections of a resume",
      inputSchema: {
        type: "object",
        properties: { resumeId: { type: "string", description: "Resume ID" } },
        required: ["resumeId"],
      },
    },
    {
      name: "get_resume_section",
      description: "Get a specific section of a resume",
      inputSchema: {
        type: "object",
        properties: {
          resumeId: { type: "string", description: "Resume ID" },
          sectionKey: { type: "string", description: "Section key (e.g. basic, education, workExperience)" },
        },
        required: ["resumeId", "sectionKey"],
      },
    },
    {
      name: "propose_resume_patch",
      description: "Propose a patch to modify a resume. The patch will be pending review until applied.",
      inputSchema: {
        type: "object",
        properties: {
          resumeId: { type: "string", description: "Resume ID" },
          title: { type: "string", description: "Short description of the patch" },
          description: { type: "string", description: "Detailed description" },
          operations: {
            type: "array",
            description: "JSON Patch operations (op, path, value)",
            items: {
              type: "object",
              properties: {
                op: { type: "string", enum: ["replace", "add", "remove"] },
                path: { type: "string", description: "JSON Pointer path" },
                value: { description: "Value for replace/add operations" },
              },
              required: ["op", "path"],
            },
          },
        },
        required: ["resumeId", "title", "operations"],
      },
    },
    {
      name: "apply_resume_patch",
      description: "Apply a pending patch to a resume (requires resume:apply_patch scope)",
      inputSchema: {
        type: "object",
        properties: {
          resumeId: { type: "string", description: "Resume ID" },
          patchId: { type: "string", description: "Patch ID" },
        },
        required: ["resumeId", "patchId"],
      },
    },
    {
      name: "list_patches",
      description: "List all patches for a resume",
      inputSchema: {
        type: "object",
        properties: { resumeId: { type: "string", description: "Resume ID" } },
        required: ["resumeId"],
      },
    },
    {
      name: "clone_resume",
      description: "Clone a resume",
      inputSchema: {
        type: "object",
        properties: { resumeId: { type: "string", description: "Resume ID" } },
        required: ["resumeId"],
      },
    },
    {
      name: "list_versions",
      description: "List version history of a resume",
      inputSchema: {
        type: "object",
        properties: { resumeId: { type: "string", description: "Resume ID" } },
        required: ["resumeId"],
      },
    },
    {
      name: "export_resume_markdown",
      description: "Export a resume as Markdown",
      inputSchema: {
        type: "object",
        properties: { resumeId: { type: "string", description: "Resume ID" } },
        required: ["resumeId"],
      },
    },
    {
      name: "export_resume_json",
      description: "Export a resume as JSON",
      inputSchema: {
        type: "object",
        properties: { resumeId: { type: "string", description: "Resume ID" } },
        required: ["resumeId"],
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "list_resumes": {
        const data = await apiCall("/resumes");
        return { content: [{ type: "text", text: JSON.stringify(data.resumes, null, 2) }] };
      }
      case "get_resume": {
        const data = await apiCall(`/resumes/${args!.resumeId}`);
        return { content: [{ type: "text", text: JSON.stringify(data.resume, null, 2) }] };
      }
      case "get_resume_sections": {
        const data = await apiCall(`/resumes/${args!.resumeId}/sections`);
        return { content: [{ type: "text", text: JSON.stringify(data.sections, null, 2) }] };
      }
      case "get_resume_section": {
        const data = await apiCall(`/resumes/${args!.resumeId}/sections/${args!.sectionKey}`);
        return { content: [{ type: "text", text: JSON.stringify(data.section, null, 2) }] };
      }
      case "propose_resume_patch": {
        const data = await apiCall(`/resumes/${args!.resumeId}/patches`, {
          method: "POST",
          body: JSON.stringify({
            title: args!.title,
            description: args!.description,
            patchJson: args!.operations,
          }),
        });
        return { content: [{ type: "text", text: JSON.stringify(data.patch, null, 2) }] };
      }
      case "apply_resume_patch": {
        await apiCall(`/resumes/${args!.resumeId}/patches/${args!.patchId}/apply`, {
          method: "POST",
        });
        return { content: [{ type: "text", text: "Patch applied successfully" }] };
      }
      case "list_patches": {
        const data = await apiCall(`/resumes/${args!.resumeId}/patches`);
        return { content: [{ type: "text", text: JSON.stringify(data.patches, null, 2) }] };
      }
      case "clone_resume": {
        const data = await apiCall(`/resumes/${args!.resumeId}/clone`, {
          method: "POST",
        });
        return { content: [{ type: "text", text: JSON.stringify(data.resume, null, 2) }] };
      }
      case "list_versions": {
        const data = await apiCall(`/resumes/${args!.resumeId}/versions`);
        return { content: [{ type: "text", text: JSON.stringify(data.versions, null, 2) }] };
      }
      case "export_resume_markdown": {
        const url = `${API_BASE}/api/agent/resumes/${args!.resumeId}/export/markdown`;
        const res = await fetch(url, {
          headers: { "Authorization": `Bearer ${API_KEY}` },
        });
        const text = await res.text();
        return { content: [{ type: "text", text }] };
      }
      case "export_resume_json": {
        const data = await apiCall(`/resumes/${args!.resumeId}/export/json`);
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      }
      default:
        return { content: [{ type: "text", text: `Unknown tool: ${name}` }], isError: true };
    }
  } catch (err: any) {
    return { content: [{ type: "text", text: `Error: ${err.message}` }], isError: true };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("CareerFlow MCP Server running on stdio");
}

main().catch(console.error);
