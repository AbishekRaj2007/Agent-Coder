import { useMemo } from "react";
import { useHighlighter } from "../hooks/useHighlighter";

type Props = {
  code: string;
  language?: string;
};

function detectLanguage(code: string): string {
  if (code.includes("def ") || (code.includes("import ") && code.includes(":"))) return "python";
  if (code.includes("function") || code.includes("const ") || code.includes("=>")) return "typescript";
  return "typescript";
}

export function CodeBlock({ code, language }: Props) {
  const highlighter = useHighlighter();

  const html = useMemo(() => {
    if (!highlighter || !code) return null;

    const lang = language || detectLanguage(code);

    try {
      return highlighter.codeToHtml(code, {
        lang,
        theme: "one-dark-pro",
      });
    } catch {
      return highlighter.codeToHtml(code, {
        lang: "typescript",
        theme: "one-dark-pro",
      });
    }
  }, [highlighter, code, language]);

  if (!html) {
    return (
      <pre style={{
        margin: 0, padding: "16px",
        background: "#282c34", color: "#abb2bf",
        fontSize: 13, lineHeight: 1.6,
        whiteSpace: "pre-wrap", wordBreak: "break-word",
        maxHeight: 400, overflowY: "auto",
        textAlign: "left",
      }}>
        {code}
      </pre>
    );
  }

  return (
    <>
      <style>{`
        .shiki {
          margin: 0 !important;
          padding: 16px !important;
          background: #282c34 !important;
          font-size: 13px !important;
          line-height: 1.6 !important;
          white-space: pre !important;
          word-break: normal !important;
          overflow-x: auto !important;
          overflow-y: auto !important;
          max-height: 400px !important;
          display: block !important;
          columns: unset !important;
          column-count: unset !important;
          text-align: left !important;
        }
        .shiki code {
          display: block !important;
          white-space: pre !important;
          columns: unset !important;
          column-count: unset !important;
          text-align: left !important;
          font-family: 'JetBrains Mono', 'Fira Code', monospace !important;
        }
        .shiki .line {
          display: block !important;
          white-space: pre !important;
          text-align: left !important;
        }
      `}</style>
      <div
        dangerouslySetInnerHTML={{ __html: html }}
        style={{ maxHeight: 400, overflowY: "auto" }}
      />
    </>
  );
}