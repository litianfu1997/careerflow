"use client";

import { useCallback, useMemo } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { html } from "@codemirror/lang-html";
import { css } from "@codemirror/lang-css";
import { oneDark } from "@codemirror/theme-one-dark";

type Language = "html" | "css";

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language?: Language;
  placeholder?: string;
  minHeight?: string;
  readOnly?: boolean;
}

export function CodeEditor({
  value,
  onChange,
  language = "html",
  placeholder,
  minHeight = "200px",
  readOnly = false,
}: CodeEditorProps) {
  const extensions = useMemo(() => {
    if (language === "css") return [css()];
    return [html()];
  }, [language]);

  const handleChange = useCallback(
    (val: string) => {
      onChange(val);
    },
    [onChange]
  );

  // Detect if the page is in dark mode
  const isDark =
    typeof document !== "undefined" &&
    document.documentElement.classList.contains("dark");

  return (
    <div
      className="code-editor-wrapper"
      style={{
        border: "1px solid var(--border)",
        borderRadius: "var(--radius)",
        overflow: "hidden",
        minHeight,
      }}
    >
      <CodeMirror
        value={value}
        onChange={handleChange}
        extensions={extensions}
        theme={isDark ? oneDark : undefined}
        placeholder={placeholder}
        readOnly={readOnly}
        basicSetup={{
          lineNumbers: true,
          highlightActiveLine: true,
          bracketMatching: true,
          closeBrackets: true,
          foldGutter: true,
          autocompletion: true,
          indentOnInput: true,
        }}
        style={{
          fontSize: "13px",
          minHeight,
        }}
        className="cm-editor-wrapper"
      />
    </div>
  );
}
