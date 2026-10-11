"use client"

import * as React from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import remarkMath from "remark-math"
import rehypeKatex from "rehype-katex"
import { cn } from "cn"
import { CodeBlock } from "@/components/ui/code-block"

interface MarkdownProps {
  content: string
  className?: string
}

/**
 * Renders assistant/widget text as GitHub-flavored markdown with KaTeX math
 * (inline `$…$`, display `$$…$$`) and fenced code blocks routed to <CodeBlock/>.
 * Code stays LTR; prose follows the surrounding direction.
 */
export const Markdown = React.memo(function Markdown({ content, className }: MarkdownProps) {
  if (!content) return null

  return (
    <div
      className={cn(
        "max-w-none break-words font-sans text-sm leading-relaxed text-foreground/90",
        className,
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          p({ children }) {
            return <p className="my-2 leading-relaxed first:mt-0 last:mb-0">{children}</p>
          },
          a({ children, href }) {
            return (
              <a
                href={href}
                target="_blank"
                rel="noreferrer noopener"
                className="font-medium text-primary underline underline-offset-2 hover:opacity-80"
              >
                {children}
              </a>
            )
          },
          // Fenced code is owned by <CodeBlock/>; unwrap the default <pre> so we
          // never nest a block element inside it.
          pre({ children }) {
            return <>{children}</>
          },
          code({ className, children }) {
            const match = /language-(\w+)/.exec(className || "")
            const text = String(children).replace(/\n$/, "")
            const isBlock = Boolean(match) || text.includes("\n")

            if (!isBlock) {
              return (
                <code className="rounded bg-muted/80 px-1.5 py-0.5 font-mono text-[0.85em] text-foreground">
                  {children}
                </code>
              )
            }

            return <CodeBlock code={text} language={match?.[1]} />
          },
          ul({ children }) {
            return <ul className="my-2 list-disc ps-5">{children}</ul>
          },
          ol({ children }) {
            return <ol className="my-2 list-decimal ps-5">{children}</ol>
          },
          li({ children }) {
            return <li className="my-1 leading-relaxed">{children}</li>
          },
          h1({ children }) {
            return <h1 className="mt-4 mb-2 text-lg font-semibold text-foreground">{children}</h1>
          },
          h2({ children }) {
            return <h2 className="mt-4 mb-2 text-base font-semibold text-foreground">{children}</h2>
          },
          h3({ children }) {
            return <h3 className="mt-3 mb-1.5 text-sm font-semibold text-foreground">{children}</h3>
          },
          h4({ children }) {
            return <h4 className="mt-3 mb-1.5 text-sm font-semibold text-foreground">{children}</h4>
          },
          blockquote({ children }) {
            return (
              <blockquote className="my-3 border-s-2 border-primary/40 ps-3 text-muted-foreground">
                {children}
              </blockquote>
            )
          },
          hr() {
            return <hr className="my-4 border-border" />
          },
          table({ children }) {
            return (
              <div className="my-3 w-full overflow-x-auto rounded-lg border border-border">
                <table className="w-full border-collapse text-sm">{children}</table>
              </div>
            )
          },
          th({ children }) {
            return (
              <th className="border-b border-border bg-muted/40 px-3 py-1.5 text-start font-semibold text-foreground">
                {children}
              </th>
            )
          },
          td({ children }) {
            return <td className="border-b border-border/60 px-3 py-1.5 align-top">{children}</td>
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
})
