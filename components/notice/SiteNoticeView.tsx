import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { SiteNoticeConfig, SiteNoticeHighlight } from "@/lib/site-notice"

function HighlightBlock({ highlight }: { highlight: SiteNoticeHighlight }) {
  if (highlight.kind === "comparison") {
    return (
      <div
        className={cn(
          "mx-auto flex max-w-2xl flex-col items-stretch gap-4 rounded-2xl border border-border/60 bg-muted/60 px-5 py-6 sm:flex-row sm:items-center sm:justify-center sm:gap-5"
        )}
      >
        {/*  기존 도메인 표시  */}
        <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-end">
          <Badge variant="outline" className="shrink-0 border-foreground/40">
            {highlight.beforeBadge}
          </Badge>
          <span className="text-center font-semibold text-foreground break-all sm:text-left">
            {highlight.beforeText}
          </span>
        </div>
        {/*  화살표 표시  */}
        <div>
          <ArrowRight
            className="mx-auto h-6 w-6 shrink-0 rotate-90 text-penta-blue sm:rotate-0"
            aria-hidden
          />
        </div>
        {/*  새 도메인 표시  */}
        <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
          <Badge className="shrink-0 border-transparent bg-penta-blue text-white hover:bg-penta-blue/90">
            {highlight.afterBadge}
          </Badge>
          {highlight.afterHref ? (
            <a
              href={highlight.afterHref}
              className="text-center font-semibold text-penta-blue underline-offset-4 hover:underline break-all sm:text-left"
              target="_blank"
              rel="noopener noreferrer"
            >
              {highlight.afterText}
            </a>          
          ) : (
            // afterHref 값이 없으면 링크 없이 텍스트만 표시
            <span className="text-center font-semibold text-penta-blue break-all sm:text-left">
              {highlight.afterText}
            </span>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl rounded-2xl border border-border/60 bg-muted/60 px-5 py-6 text-center sm:text-left">
      {highlight.title ? (
        <p className="mb-3 text-center font-semibold text-foreground sm:text-left">
          {highlight.title}
        </p>
      ) : null}
      <ul className="space-y-2 text-muted-foreground">
        {highlight.lines.map((line, i) => (
          <li key={i}>{line}</li>
        ))}
      </ul>
    </div>
  )
}

export function SiteNoticeView({ config }: { config: SiteNoticeConfig }) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="relative overflow-hidden bg-penta-blue px-4 py-12 text-white sm:py-14">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
            backgroundSize: "28px 28px",
          }}
          aria-hidden
        />
        <div className="relative mx-auto max-w-3xl text-center">
          {config.eyebrow ? (
            <p className="mb-2 text-sm font-medium text-white/90 sm:text-base">
              {config.eyebrow}
            </p>
          ) : null}
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl">
            {config.title}
          </h1>
        </div>
      </header>

      <main className="flex flex-1 flex-col px-4 py-10 sm:py-12">
        <div className="mx-auto w-full max-w-3xl flex-1 space-y-8">
          <div className="space-y-1 text-center text-foreground">
            {config.descriptionParagraphs.map((p, i) => (
              <p key={i} className="text-base leading-relaxed sm:text-lg">
                {p}
              </p>
            ))}
          </div>

          {config.highlight ? (
            <HighlightBlock highlight={config.highlight} />
          ) : null}

          {config.footerParagraphs && config.footerParagraphs.length > 0 ? (
            <div className="space-y-2 text-center text-sm leading-relaxed text-muted-foreground sm:text-base">
              {config.footerParagraphs.map((p, i) => (
                <p key={i} className="whitespace-pre-line">
                  {p.split(/(https?:\/\/[^\s]+)/g).map((part, j) =>
                    /^https?:\/\//.test(part) ? (
                      <a
                        key={j}
                        href={part}
                        className="font-medium text-penta-blue underline-offset-4 hover:underline"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {part}
                      </a>
                    ) : (
                      <span key={j}>{part}</span>
                    )
                  )}
                </p>
              ))}
            </div>
          ) : null}

          {/* 주요 액션 버튼 */}
          {/* <div className="flex flex-col items-center justify-center gap-3 pt-2 sm:flex-row sm:pt-4">
            {config.primaryCta ? (
              config.primaryCta.external ? (
                <Button size="lg" className="min-w-[200px] bg-penta-blue hover:bg-penta-blue/90" asChild>
                  <a
                    href={config.primaryCta.href}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {config.primaryCta.label}
                  </a>
                </Button>
              ) : (
                <Button size="lg" className="min-w-[200px] bg-penta-blue hover:bg-penta-blue/90" asChild>
                  <Link href={config.primaryCta.href}>
                    {config.primaryCta.label}
                  </Link>
                </Button>
              )
            ) : null}
            {config.secondaryCta ? (
              config.secondaryCta.external ? (
                <Button variant="outline" size="lg" asChild>
                  <a
                    href={config.secondaryCta.href}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {config.secondaryCta.label}
                  </a>
                </Button>
              ) : (
                <Button variant="outline" size="lg" asChild>
                  <Link href={config.secondaryCta.href}>
                    {config.secondaryCta.label}
                  </Link>
                </Button>
              )
            ) : null}
          </div> */}
        </div>
      </main>
    </div>
  )
}
