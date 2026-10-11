"use client"

import * as React from "react"
import katex from "katex"
import { cn } from "cn"

interface MathRendererProps {
  content: string
  className?: string
}

/**
 * Tokenizer & Renderer for text containing KaTeX math ($...$ inline, $$...$$ block)
 * and basic markdown formatting. Strictly preserves LTR direction for formulas.
 */
export function MathRenderer({ content, className }: MathRendererProps) {
  const renderedElements = React.useMemo(() => {
    if (!content) return null

    // Split content by display math blocks: $$...$$
    const blockParts = content.split(/(\$\$[\s\S]*?\$\$)/g)

    return blockParts.map((blockPart, blockIdx) => {
      // 1. Check if this part is a block math $$...$$
      if (blockPart.startsWith("$$") && blockPart.endsWith("$$")) {
        const mathExpr = blockPart.slice(2, -2).trim()
        try {
          const html = katex.renderToString(mathExpr, {
            displayMode: true,
            throwOnError: false,
          })
          return (
            <div
              key={`block-${blockIdx}`}
              dir="ltr"
              className="my-3 overflow-x-auto text-center [unicode-bidi:isolate] select-text"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          )
        } catch {
          return (
            <pre
              key={`block-err-${blockIdx}`}
              dir="ltr"
              className="my-3 overflow-x-auto rounded bg-muted/60 p-2 text-xs font-mono"
            >
              {mathExpr}
            </pre>
          )
        }
      }

      // 2. Otherwise, parse inline math $...$ and markdown within the text segment
      const inlineParts = blockPart.split(/(\$[^$\n\r]+?\$)/g)

      return (
        <span key={`text-seg-${blockIdx}`}>
          {inlineParts.map((inlinePart, inlineIdx) => {
            if (inlinePart.startsWith("$") && inlinePart.endsWith("$") && inlinePart.length > 2) {
              const mathExpr = inlinePart.slice(1, -1).trim()
              try {
                const html = katex.renderToString(mathExpr, {
                  displayMode: false,
                  throwOnError: false,
                })
                return (
                  <span
                    key={`inline-${blockIdx}-${inlineIdx}`}
                    dir="ltr"
                    className="inline-block px-0.5 align-middle [unicode-bidi:isolate] select-text"
                    dangerouslySetInnerHTML={{ __html: html }}
                  />
                )
              } catch {
                return (
                  <code
                    key={`inline-err-${blockIdx}-${inlineIdx}`}
                    dir="ltr"
                    className="rounded bg-muted px-1 py-0.5 text-xs font-mono"
                  >
                    {mathExpr}
                  </code>
                )
              }
            }

            // Normal text with line breaks
            return (
              <span key={`plain-${blockIdx}-${inlineIdx}`} className="whitespace-pre-wrap leading-relaxed">
                {renderFormattedText(inlinePart)}
              </span>
            )
          })}
        </span>
      )
    })
  }, [content])

  return (
    <div className={cn("prose-sm max-w-none text-foreground/90 font-sans break-words", className)}>
      {renderedElements}
    </div>
  )
}

/**
 * Helper to render basic markdown elements like bold, italic, and inline code
 */
function renderFormattedText(text: string): React.ReactNode {
  if (!text) return null

  // Split by bold (**...**) and inline code (`...`)
  const parts = text.split(/(\*\*[\s\S]*?\*\*|`[^`\n\r]+?`)/g)

  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={index} className="font-semibold text-foreground">
          {part.slice(2, -2)}
        </strong>
      )
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code
          key={index}
          className="rounded bg-muted/80 px-1.5 py-0.5 font-mono text-xs text-foreground/90 border border-border/40"
        >
          {part.slice(1, -1)}
        </code>
      )
    }
    return part
  })
}
