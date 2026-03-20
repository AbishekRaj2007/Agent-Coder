import { useEffect, useState } from "react";
import { createHighlighter, type Highlighter } from "shiki";

// We create the highlighter once and reuse it — it's expensive to initialize
let highlighterPromise: Promise<Highlighter> | null = null;

function getHighlighter() {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighter({
      themes: ["one-dark-pro"],
      langs: ["typescript", "javascript", "python", "bash", "json"],
    });
  }
  return highlighterPromise;
}

export function useHighlighter() {
  const [highlighter, setHighlighter] = useState<Highlighter | null>(null);

  useEffect(() => {
    getHighlighter().then(setHighlighter);
  }, []);

  return highlighter;
}