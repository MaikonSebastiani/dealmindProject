"use client"

import { useMemo, useRef, useState } from "react"

type RoiBar = {
  month: string
  roi: number
}

function RoiTooltip(props: { month: string; roi: number }) {
  return (
    <div className="rounded-1xl border border-border bg-secondary px-6 py-5 shadow-[0_20px_50px_rgba(0,0,0,0.55)] min-w-[150px] flex flex-col items-center">
      <div className="text-1xl font-semibold text-foreground">{props.month}</div>
      <div className="mt-3 text-1xl tracking-tight" style={{ color: "hsl(var(--primary))" }}>
        ROI : {props.roi.toFixed(1)}%
      </div>
    </div>
  )
}

export function RoiMonthlyChart(props: { bars: RoiBar[] }) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [hovered, setHovered] = useState<
    { month: string; roi: number; left: number; bottom: number } | null
  >(null)

  const roiMeta = useMemo(() => {
    const values = props.bars.map((b) => b.roi)
    const min = Math.min(...values)
    const max = Math.max(...values)
    return { min, max }
  }, [props.bars])

  const toHeightPercent = (roi: number) => {
    const { min, max } = roiMeta
    if (max === min) return 70
    const t = (roi - min) / (max - min)
    return 55 + t * 40
  }

  return (
    <div className="relative">
      <div className="h-64 w-full relative overflow-hidden rounded-xl border border-border bg-gradient-to-b from-secondary/60 to-card">
        <div
          className="absolute inset-0 opacity-25 pointer-events-none"
          style={{
            backgroundImage: "linear-gradient(#141B29 1px, transparent 1px)",
            backgroundSize: "100% 48px",
          }}
        />
        <div ref={containerRef} className="absolute inset-x-6 bottom-6 top-8 flex items-end gap-3">
          {props.bars.map((bar) => (
            <div
              key={bar.month}
              className="group relative flex-1 h-full flex items-end"
              onMouseEnter={(e) => {
                const container = containerRef.current
                const containerRect = container?.getBoundingClientRect()
                const elRect = e.currentTarget.getBoundingClientRect()

                if (!containerRect) {
                  return
                }

                const left = elRect.left - containerRect.left + elRect.width / 2
                const topInside = elRect.top - containerRect.top
                const bottom = containerRect.height - topInside + 12

                setHovered({
                  month: bar.month,
                  roi: bar.roi,
                  left,
                  bottom,
                })
              }}
              onMouseLeave={() => setHovered(null)}
              onMouseMove={(e) => {
                const container = containerRef.current
                const containerRect = container?.getBoundingClientRect()
                const elRect = e.currentTarget.getBoundingClientRect()

                if (!containerRect) {
                  return
                }

                const left = elRect.left - containerRect.left + elRect.width / 2
                const topInside = elRect.top - containerRect.top
                const bottom = containerRect.height - topInside + 12

                setHovered((state) =>
                  state
                    ? {
                        ...state,
                        left,
                        bottom,
                      }
                    : state,
                )
              }}
            >
              <div
                className="w-full rounded-md bg-[#5B6CFF] group-hover:bg-[#7F8FFF] transition"
                style={{ height: `${toHeightPercent(bar.roi)}%`, opacity: 0.95 }}
              />
            </div>
          ))}
        </div>
      </div>
      {hovered && (
        <div
          className="pointer-events-none absolute inset-x-0 z-20 flex justify-center"
          style={{
            left: hovered.left,
            bottom: hovered.bottom,
            transform: "translateX(-50%)",
          }}
        >
          <RoiTooltip month={hovered.month} roi={hovered.roi} />
        </div>
      )}
    </div>
  )
}


