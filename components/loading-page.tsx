"use client";

import { Loader2 } from "lucide-react";

interface LoadingPageProps {
  text?: string;
}

export function LoadingPage({ text }: LoadingPageProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Frosted glass overlay */}
      <div className="absolute inset-0 bg-[var(--background)]/70 backdrop-blur-xl" />

      {/* Spinner — transparent, blended with glass */}
      <div className="relative flex flex-col items-center gap-6 animate-fade-in-up">
        {/* Large outer glow */}
        <div className="absolute rounded-full blur-3xl animate-loading-pulse"
          style={{ backgroundColor: "var(--primary)", opacity: 0.25, inset: "-40px" }} />
        {/* Secondary warm glow */}
        <div className="absolute rounded-full blur-2xl"
          style={{ backgroundColor: "var(--primary)", opacity: 0.12, inset: "-60px" }} />

        {/* Ring container */}
        <div className="relative flex h-24 w-24 items-center justify-center">
          {/* Outer ring — slow clockwise, thick blue */}
          <div
            className="absolute inset-0 animate-spin rounded-full"
            style={{
              border: "4px solid rgba(37,99,235,0.12)",
              borderTopColor: "var(--primary)",
              borderTopWidth: "4px",
              animationDuration: "2.5s",
            }}
          />
          {/* Outer glow trail */}
          <div
            className="absolute inset-0 animate-spin rounded-full"
            style={{
              border: "4px solid transparent",
              borderTopColor: "var(--primary)",
              borderTopWidth: "4px",
              filter: "blur(4px)",
              opacity: 0.6,
              animationDuration: "2.5s",
            }}
          />

          {/* Middle ring — slower counter-clockwise */}
          <div
            className="absolute animate-spin rounded-full"
            style={{
              inset: "8px",
              border: "3px solid rgba(37,99,235,0.1)",
              borderBottomColor: "var(--primary)",
              borderBottomWidth: "3px",
              animationDuration: "3.5s",
              animationDirection: "reverse",
            }}
          />
          {/* Middle glow trail */}
          <div
            className="absolute animate-spin rounded-full"
            style={{
              inset: "8px",
              border: "3px solid transparent",
              borderBottomColor: "var(--primary)",
              borderBottomWidth: "3px",
              filter: "blur(3px)",
              opacity: 0.5,
              animationDuration: "3.5s",
              animationDirection: "reverse",
            }}
          />

          {/* Inner ring — medium speed */}
          <div
            className="absolute animate-spin rounded-full"
            style={{
              inset: "16px",
              border: "2.5px solid rgba(37,99,235,0.08)",
              borderTopColor: "var(--primary)",
              borderTopWidth: "2.5px",
              animationDuration: "1.8s",
            }}
          />
          {/* Inner glow trail */}
          <div
            className="absolute animate-spin rounded-full"
            style={{
              inset: "16px",
              border: "2.5px solid transparent",
              borderTopColor: "var(--primary)",
              borderTopWidth: "2.5px",
              filter: "blur(2px)",
              opacity: 0.4,
              animationDuration: "1.8s",
            }}
          />

          {/* Core spinner */}
          <Loader2
            className="relative h-10 w-10 animate-spin"
            style={{
              color: "var(--primary)",
              filter: "drop-shadow(0 0 12px var(--primary)) drop-shadow(0 0 24px var(--primary)) drop-shadow(0 0 48px var(--primary))",
            }}
          />
        </div>

        {text && (
          <p className="relative text-sm font-medium" style={{ color: "var(--primary)", opacity: 0.7 }}>
            {text}
          </p>
        )}
      </div>
    </div>
  );
}
