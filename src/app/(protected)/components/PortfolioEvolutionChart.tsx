"use client"

import { useMemo, useState } from "react"

type DataPoint = {
  month: string // "Jan/24", "Fev/24", etc.
  value: number // Valor acumulado do patrimônio
  label: string // Label completo para tooltip
}

function formatBRL(value: number) {
  if (value >= 1000000) {
    return `R$ ${(value / 1000000).toFixed(1)}M`
  }
  if (value >= 1000) {
    return `R$ ${(value / 1000).toFixed(0)}K`
  }
  return `R$ ${value.toFixed(0)}`
}

function formatBRLFull(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

export function PortfolioEvolutionChart({ data }: { data?: DataPoint[] }) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  // Dados de exemplo quando não há dados reais
  const defaultData: DataPoint[] = useMemo(() => {
    const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]
    const currentMonth = new Date().getMonth()
    const currentYear = new Date().getFullYear()
    
    return months.slice(0, currentMonth + 1).map((m, i) => ({
      month: `${m}/${String(currentYear).slice(2)}`,
      value: 500000 + i * 150000 + Math.random() * 100000,
      label: `${m}/${currentYear}`,
    }))
  }, [])

  const chartData = data && data.length > 0 ? data : defaultData
  const isRealData = data && data.length > 0

  // Calcular dimensões do gráfico
  const width = 580
  const height = 200
  const padding = { top: 20, right: 20, bottom: 30, left: 60 }
  const chartWidth = width - padding.left - padding.right
  const chartHeight = height - padding.top - padding.bottom

  // Calcular escalas
  const maxValue = Math.max(...chartData.map(d => d.value), 1)
  const minValue = Math.min(...chartData.map(d => d.value), 0)
  const valueRange = maxValue - minValue || 1

  // Gerar pontos do gráfico
  const points = useMemo(() => {
    return chartData.map((d, i) => ({
      x: padding.left + (i / Math.max(chartData.length - 1, 1)) * chartWidth,
      y: padding.top + chartHeight - ((d.value - minValue) / valueRange) * chartHeight,
      ...d,
    }))
  }, [chartData, chartWidth, chartHeight, minValue, valueRange])

  // Gerar path SVG para a linha
  const linePath = useMemo(() => {
    if (points.length === 0) return ""
    return points
      .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
      .join(" ")
  }, [points])

  // Gerar path SVG para a área preenchida
  const areaPath = useMemo(() => {
    if (points.length === 0) return ""
    const firstPoint = points[0]
    const lastPoint = points[points.length - 1]
    return `${linePath} L ${lastPoint.x} ${padding.top + chartHeight} L ${firstPoint.x} ${padding.top + chartHeight} Z`
  }, [linePath, points, chartHeight])

  // Gerar linhas do grid Y
  const yGridLines = useMemo(() => {
    const lines = []
    const numLines = 4
    for (let i = 0; i <= numLines; i++) {
      const value = minValue + (valueRange * i) / numLines
      const y = padding.top + chartHeight - (i / numLines) * chartHeight
      lines.push({ y, value })
    }
    return lines
  }, [minValue, valueRange, chartHeight])

  const hoveredPoint = hoveredIndex !== null ? points[hoveredIndex] : null

  return (
    <div className="h-64 rounded-xl border border-[#141B29] bg-gradient-to-b from-[#0B1323]/60 to-[#0B0F17] relative overflow-hidden">
      {!isRealData && (
        <div className="absolute top-3 right-3 z-10 text-[10px] text-[#7C889E] bg-[#0B1323] px-2 py-1 rounded-lg border border-[#141B29]">
          Dados de exemplo
        </div>
      )}

      {/* Grid de fundo */}
      <div 
        className="absolute inset-0 opacity-30" 
        style={{ 
          backgroundImage: "linear-gradient(#141B29 1px, transparent 1px), linear-gradient(90deg, #141B29 1px, transparent 1px)", 
          backgroundSize: "48px 48px" 
        }} 
      />

      <svg viewBox={`0 0 ${width} ${height}`} className="absolute inset-0 h-full w-full">
        {/* Linhas do grid Y */}
        {yGridLines.map((line, i) => (
          <g key={i}>
            <line
              x1={padding.left}
              y1={line.y}
              x2={width - padding.right}
              y2={line.y}
              stroke="#141B29"
              strokeWidth="1"
            />
            <text
              x={padding.left - 8}
              y={line.y + 4}
              fill="#7C889E"
              fontSize="10"
              textAnchor="end"
            >
              {formatBRL(line.value)}
            </text>
          </g>
        ))}

        {/* Área preenchida */}
        <path
          d={areaPath}
          fill="url(#areaGradient)"
          opacity="0.3"
        />

        {/* Linha do gráfico */}
        <path
          d={linePath}
          fill="none"
          stroke="#4F7DFF"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Pontos interativos */}
        {points.map((p, i) => (
          <g key={i}>
            {/* Área de hover invisível maior */}
            <circle
              cx={p.x}
              cy={p.y}
              r="15"
              fill="transparent"
              style={{ cursor: "pointer" }}
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
            />
            {/* Ponto visível */}
            <circle
              cx={p.x}
              cy={p.y}
              r={hoveredIndex === i ? 6 : 4}
              fill={hoveredIndex === i ? "#4F7DFF" : "#0B0F17"}
              stroke="#4F7DFF"
              strokeWidth="2"
              className="transition-all"
            />
          </g>
        ))}

        {/* Labels do eixo X */}
        {points.map((p, i) => (
          // Mostrar apenas alguns labels para não ficar poluído
          (points.length <= 6 || i % Math.ceil(points.length / 6) === 0 || i === points.length - 1) && (
            <text
              key={i}
              x={p.x}
              y={height - 8}
              fill="#7C889E"
              fontSize="10"
              textAnchor="middle"
            >
              {p.month}
            </text>
          )
        ))}

        {/* Gradiente para área */}
        <defs>
          <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4F7DFF" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#4F7DFF" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>

      {/* Tooltip */}
      {hoveredPoint && (
        <div
          className="absolute z-20 pointer-events-none transform -translate-x-1/2 -translate-y-full"
          style={{
            left: `${(hoveredPoint.x / width) * 100}%`,
            top: `${(hoveredPoint.y / height) * 100}%`,
          }}
        >
          <div className="rounded-xl border border-[#141B29] bg-[#0B0F17] px-3 py-2 shadow-xl mb-2">
            <div className="text-xs text-[#7C889E]">{hoveredPoint.label}</div>
            <div className="text-sm font-semibold text-[#4F7DFF]">
              {formatBRLFull(hoveredPoint.value)}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

