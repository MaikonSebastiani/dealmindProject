"use client"

import { useMemo, useState } from "react"

type Segment = {
  label: "Casa" | "Apartamento" | "Terreno" | "Comercial"
  percent: number
  color: string
}

function DonutTooltip(props: { label: string; percent: number }) {
  return (
    <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--surface-2))] px-5 py-4 shadow-[0_20px_50px_rgba(0,0,0,0.55)]">
      <div className="text-xl font-semibold text-white">{props.label}</div>
      <div className="mt-2 text-xl" style={{ color: "hsl(var(--primary))" }}>
        {props.percent}%
      </div>
    </div>
  )
}

export function PortfolioTypeDonutChart(props: { segments?: Segment[] }) {
  // mock default (pode ser trocado por dados reais depois)
  const segments: Segment[] = useMemo(
    () =>
      props.segments ?? [
        { label: "Casa", percent: 40, color: "#4F7DFF" },
        { label: "Apartamento", percent: 25, color: "#22C55E" },
        { label: "Comercial", percent: 20, color: "#F59E0B" },
        { label: "Terreno", percent: 15, color: "#EC4899" },
      ],
    [props.segments],
  )

  const [hovered, setHovered] = useState<Segment | null>(null)

  // converte % para strokeDasharray no mesmo padrão do SVG atual (total 100)
  const circles = useMemo(() => {
    let offset = 0
    return segments.map((s) => {
      const item = { ...s, dasharray: `${s.percent} ${100 - s.percent}`, dashoffset: -offset }
      offset += s.percent
      return item
    })
  }, [segments])

  return (
    <div className="h-64 rounded-xl border border-[#141B29] bg-gradient-to-b from-[#0B1323]/60 to-[#0B0F17] relative flex flex-col items-center justify-center gap-4 overflow-visible">
      <div className="relative h-40 w-40">
        <svg viewBox="0 0 42 42" className="h-full w-full -rotate-90 overflow-visible">
          <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#141B29" strokeWidth="6" />
          {circles.map((c) => (
            <g key={c.label}>
              {/* Hit area (invisível) para hover mais fácil */}
              <circle
                cx="21"
                cy="21"
                r="15.915"
                fill="transparent"
                stroke="transparent"
                strokeWidth="14"
                strokeDasharray={c.dasharray}
                strokeDashoffset={c.dashoffset}
                className="cursor-pointer"
                style={{ pointerEvents: "stroke" }}
                onMouseEnter={() => setHovered(c)}
                onMouseLeave={() => setHovered(null)}
              />

              {/* Círculo visível */}
              <circle
                cx="21"
                cy="21"
                r="15.915"
                fill="transparent"
                stroke={c.color}
                strokeWidth={hovered?.label === c.label ? 7 : 6}
                strokeDasharray={c.dasharray}
                strokeDashoffset={c.dashoffset}
                opacity={hovered ? (hovered.label === c.label ? 1 : 0.55) : 1}
                className="transition-all"
                style={{ pointerEvents: "none" }}
              />
            </g>
          ))}
        </svg>

        {hovered ? (
          <div className="pointer-events-none bg-secondary absolute left-[-50px] top-1/2 z-20 -translate-x-1/2 -translate-y-[120%]">
            <DonutTooltip label={hovered.label} percent={hovered.percent} />
          </div>
        ) : null}
      </div>

      <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 text-xs text-[#9AA6BC]">
        {segments.map((s) => (
          <span
            key={s.label}
            className="inline-flex items-center gap-1 cursor-default"
            onMouseEnter={() => setHovered(s)}
            onMouseLeave={() => setHovered(null)}
          >
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} />
            {s.label}
          </span>
        ))}
      </div>
    </div>
  )
}


