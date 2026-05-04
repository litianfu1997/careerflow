"use client";

import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  size?: "sm" | "default" | "lg";
  text?: string;
  className?: string;
}

const sizeMap = {
  sm: "h-4 w-4",
  default: "h-8 w-8",
  lg: "h-12 w-12",
};

export function LoadingSpinner({ size = "default", text, className }: LoadingSpinnerProps) {
  return (
    <div className={cn("flex flex-col items-center gap-3", className)}>
      <Loader2
        className={cn(
          "animate-spin text-[var(--primary)]",
          sizeMap[size]
        )}
      />
      {text && (
        <p className="animate-fade-in-up text-sm text-[var(--muted-foreground)]">
          {text}
        </p>
      )}
    </div>
  );
}
