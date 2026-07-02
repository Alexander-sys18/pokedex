"use client";

import type { ComponentProps } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type MarkdownComponents = ComponentProps<typeof ReactMarkdown>["components"];

/**
 * Styled renderer for assistant messages: GitHub-flavored Markdown (bold,
 * lists, tables…) mapped to our design tokens. Kept lean — the whole chat
 * panel (including this) is lazy-loaded on first open.
 */
const components: MarkdownComponents = {
  p: ({ children }) => <p className="mb-2 leading-relaxed last:mb-0">{children}</p>,
  strong: ({ children }) => <strong className="text-foreground font-semibold">{children}</strong>,
  em: ({ children }) => <em className="italic">{children}</em>,
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="text-foreground underline underline-offset-2"
    >
      {children}
    </a>
  ),
  ul: ({ children }) => <ul className="mb-2 list-disc space-y-1 pl-4 last:mb-0">{children}</ul>,
  ol: ({ children }) => <ol className="mb-2 list-decimal space-y-1 pl-4 last:mb-0">{children}</ol>,
  li: ({ children }) => <li className="leading-snug">{children}</li>,
  code: ({ children }) => (
    <code className="bg-muted rounded px-1 py-0.5 font-mono text-[0.85em]">{children}</code>
  ),
  h1: ({ children }) => (
    <p className="text-foreground mt-2 mb-1 font-bold first:mt-0">{children}</p>
  ),
  h2: ({ children }) => (
    <p className="text-foreground mt-2 mb-1 font-bold first:mt-0">{children}</p>
  ),
  h3: ({ children }) => (
    <p className="text-foreground mt-2 mb-1 font-semibold first:mt-0">{children}</p>
  ),
  blockquote: ({ children }) => (
    <blockquote className="border-border text-muted-foreground mb-2 border-l-2 pl-2.5">
      {children}
    </blockquote>
  ),
  hr: () => <hr className="border-border my-2" />,
  table: ({ children }) => (
    <div className="border-border mb-2 overflow-x-auto rounded-lg border last:mb-0">
      <table className="w-full border-collapse text-xs">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead>{children}</thead>,
  th: ({ children }) => (
    <th className="border-border bg-muted text-foreground border-b px-2.5 py-1.5 text-left font-semibold whitespace-nowrap">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="border-border border-b px-2.5 py-1.5 align-top last:border-b-0 [tr:last-child_&]:border-b-0">
      {children}
    </td>
  ),
};

export function ChatMarkdown({ content }: { content: string }) {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
      {content}
    </ReactMarkdown>
  );
}
