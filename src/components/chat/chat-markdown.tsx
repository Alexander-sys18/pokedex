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
  p: ({ children }) => <p className="mb-2 leading-relaxed break-words last:mb-0">{children}</p>,
  strong: ({ children }) => <strong className="text-foreground font-semibold">{children}</strong>,
  em: ({ children }) => <em className="italic">{children}</em>,
  del: ({ children }) => <del className="text-muted-foreground line-through">{children}</del>,
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="text-foreground underline underline-offset-2 transition-opacity hover:opacity-75"
    >
      {children}
    </a>
  ),
  ul: ({ children }) => <ul className="mb-2 list-disc space-y-1 pl-4 last:mb-0">{children}</ul>,
  ol: ({ children }) => <ol className="mb-2 list-decimal space-y-1 pl-4 last:mb-0">{children}</ol>,
  li: ({ children }) => <li className="leading-snug">{children}</li>,
  code: ({ children }) => (
    <code className="bg-muted rounded px-1 py-0.5 font-mono text-[0.85em] break-words">
      {children}
    </code>
  ),
  // Fenced blocks were rendering as unstyled <pre> and could overflow the bubble.
  pre: ({ children }) => (
    <pre className="bg-muted mb-2 overflow-x-auto rounded-lg p-2.5 font-mono text-[0.8em] leading-relaxed last:mb-0 [&_code]:bg-transparent [&_code]:p-0">
      {children}
    </pre>
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
    <td className="border-border border-b px-2.5 py-1.5 align-top break-words last:border-b-0 [tr:last-child_&]:border-b-0">
      {children}
    </td>
  ),
};

export function ChatMarkdown({ content }: { content: string }) {
  return (
    // skipHtml: any raw HTML the model sneaks in (<br>, <sub>…) is dropped
    // instead of showing up as literal angle-bracket text in the bubble.
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={components} skipHtml>
      {content}
    </ReactMarkdown>
  );
}
