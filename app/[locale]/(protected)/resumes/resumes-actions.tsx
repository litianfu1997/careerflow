"use client";

import { Button } from "@/components/ui/button";
import { Copy, Eye, Trash2 } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { useRouter } from "@/i18n/navigation";

export function ResumesActions({ resumeId, t }: Readonly<{
  resumeId: string;
  t: { duplicate: string; preview: string; delete: string; confirmDelete: string };
}>) {
  const router = useRouter();

  async function deleteResume() {
    if (!confirm(t.confirmDelete)) return;
    await fetch(`/api/resumes/${resumeId}`, { method: "DELETE" });
    router.refresh();
  }

  async function duplicateResume() {
    const res = await fetch(`/api/resumes/${resumeId}/duplicate`, { method: "POST" });
    if (res.ok) router.refresh();
  }

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" onClick={duplicateResume} title={t.duplicate}>
        <Copy className="mr-2 h-3 w-3" />
        <span className="hidden sm:inline">{t.duplicate}</span>
      </Button>
      <Button variant="outline" size="sm" asChild title={t.preview}>
        <Link href={`/resumes/${resumeId}/preview`}>
          <Eye className="mr-2 h-3 w-3" />
          <span className="hidden sm:inline">{t.preview}</span>
        </Link>
      </Button>
      <Button variant="outline" size="sm" onClick={deleteResume} title={t.delete} className="text-red-600 hover:bg-red-50 hover:text-red-600">
        <Trash2 className="mr-2 h-3 w-3" />
        <span className="hidden sm:inline">{t.delete}</span>
      </Button>
    </div>
  );
}
