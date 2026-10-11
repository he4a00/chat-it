"use client"

import * as React from "react"
import { PrismLight as SyntaxHighlighter } from "react-syntax-highlighter"
import bash from "react-syntax-highlighter/dist/cjs/languages/prism/bash"
import css from "react-syntax-highlighter/dist/cjs/languages/prism/css"
import javascript from "react-syntax-highlighter/dist/cjs/languages/prism/javascript"
import json from "react-syntax-highlighter/dist/cjs/languages/prism/json"
import jsx from "react-syntax-highlighter/dist/cjs/languages/prism/jsx"
import markup from "react-syntax-highlighter/dist/cjs/languages/prism/markup"
import python from "react-syntax-highlighter/dist/cjs/languages/prism/python"
import sql from "react-syntax-highlighter/dist/cjs/languages/prism/sql"
import tsx from "react-syntax-highlighter/dist/cjs/languages/prism/tsx"
import typescript from "react-syntax-highlighter/dist/cjs/languages/prism/typescript"
import { oneDark, oneLight } from "react-syntax-highlighter/dist/cjs/styles/prism"
import { Check, Copy } from "lucide-react"
import { useTheme } from "next-themes"
import { cn } from "cn"

// Registry of the only languages we ship, keeping the bundle small.
SyntaxHighlighter.registerLanguage("bash", bash)
SyntaxHighlighter.registerLanguage("css", css)
SyntaxHighlighter.registerLanguage("javascript", javascript)
SyntaxHighlighter.registerLanguage("json", json)
SyntaxHighlighter.registerLanguage("jsx", jsx)
SyntaxHighlighter.registerLanguage("markup", markup)
SyntaxHighlighter.registerLanguage("python", python)
SyntaxHighlighter.registerLanguage("sql", sql)
SyntaxHighlighter.registerLanguage("tsx", tsx)
SyntaxHighlighter.registerLanguage("typescript", typescript)

const LANGUAGE_ALIASES: Record<string, string> = {
  ts: "typescript",
  typescript: "typescript",
  tsx: "tsx",
  js: "javascript",
  mjs: "javascript",
  cjs: "javascript",
  javascript: "javascript",
  jsx: "jsx",
  py: "python",
  python: "python",
  json: "json",
  sh: "bash",
  bash: "bash",
  shell: "bash",
  zsh: "bash",
  sql: "sql",
  html: "markup",
  xml: "markup",
  svg: "markup",
  markup: "markup",
  css: "css",
}

function resolveLanguage(language?: string): string | null {
  if (!language) return null
  return LANGUAGE_ALIASES[language.toLowerCase()] ?? null
}

const MONO_FONT =
  'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace'

export interface CodeBlockProps {
  code: string
  language?: string
  filename?: string
  className?: string
}

/**
 * Theme-aware code block for chat messages: a language/filename header with a
 * copy button and a syntax-highlighted body. Always LTR so code never mirrors
 * inside RTL (Arabic) layouts.
 */
export function CodeBlock({ code, language, filename, className }: CodeBlockProps) {
  const { resolvedTheme } = useTheme()
  const [copied, setCopied] = React.useState(false)

  const prismLanguage = resolveLanguage(language)
  const label = (language || "text").toLowerCase()
  const content = code.replace(/\n$/, "")

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard can be unavailable (insecure context); ignore.
    }
  }

  return (
    <div
      dir="ltr"
      className={cn(
        "my-3 overflow-hidden rounded-xl border border-border bg-muted/40 text-foreground",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2 border-b border-border/60 px-3 py-1.5">
        <span className="truncate font-mono text-[11px] tracking-wide text-muted-foreground">
          {filename ?? label}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          aria-label={copied ? "Copied" : "Copy code"}
          className="flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          {copied ? <Check className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />}
        </button>
      </div>

      {prismLanguage ? (
        <SyntaxHighlighter
          language={prismLanguage}
          style={resolvedTheme === "dark" ? oneDark : oneLight}
          customStyle={{
            margin: 0,
            padding: "0.875rem 1rem",
            background: "transparent",
            fontSize: "0.8125rem",
            fontFamily: MONO_FONT,
          }}
          codeTagProps={{ style: { fontFamily: MONO_FONT } }}
          lineNumberStyle={{ color: "var(--muted-foreground)", opacity: 0.45, minWidth: "1.75em" }}
          showLineNumbers
          PreTag="div"
        >
          {content}
        </SyntaxHighlighter>
      ) : (
        <pre className="overflow-x-auto p-4 font-mono text-[13px] leading-relaxed">
          <code>{content}</code>
        </pre>
      )}
    </div>
  )
}
