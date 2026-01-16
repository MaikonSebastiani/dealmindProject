"use client"

import { Trophy, TrendingUp, ArrowUpRight } from "lucide-react"
import Link from "next/link"

export type TopDeal = {
  id: string
  name: string
  propertyType: string
  profit: number
  roi: number
}

function formatBRL(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 })
}

const medalColors = [
  { bg: "bg-amber-500/20", border: "border-amber-500/40", text: "text-amber-400", icon: "🥇" },
  { bg: "bg-slate-400/20", border: "border-slate-400/40", text: "text-slate-300", icon: "🥈" },
  { bg: "bg-orange-600/20", border: "border-orange-600/40", text: "text-orange-400", icon: "🥉" },
]

const defaultDeals: TopDeal[] = [
  { id: "1", name: "Apartamento Vila Nova", propertyType: "Apartamento", profit: 85000, roi: 32.5 },
  { id: "2", name: "Casa Jardim Europa", propertyType: "Casa", profit: 62000, roi: 28.1 },
  { id: "3", name: "Lote Industrial", propertyType: "Comercial", profit: 45000, roi: 25.8 },
]

export function TopDealsRanking({ deals }: { deals?: TopDeal[] }) {
  const topDeals = deals && deals.length > 0 ? deals : defaultDeals
  const isRealData = deals && deals.length > 0

  if (topDeals.length === 0) {
    return (
      <div className="h-64 rounded-xl border border-[#141B29] bg-gradient-to-b from-[#0B1323]/60 to-[#0B0F17] flex flex-col items-center justify-center gap-3">
        <Trophy className="h-10 w-10 text-[#2A3548]" />
        <p className="text-sm text-[#7C889E]">Nenhum deal vendido ainda</p>
        <p className="text-xs text-[#5A6478]">Complete suas primeiras vendas para ver o ranking</p>
      </div>
    )
  }

  return (
    <div className="h-64 rounded-xl border border-[#141B29] bg-gradient-to-b from-[#0B1323]/60 to-[#0B0F17] relative overflow-hidden">
      {!isRealData && (
        <div className="absolute top-3 right-3 z-10 text-[10px] text-[#7C889E] bg-[#0B1323] px-2 py-1 rounded-lg border border-[#141B29]">
          Dados de exemplo
        </div>
      )}

      {/* Grid de fundo sutil */}
      <div 
        className="absolute inset-0 opacity-20 pointer-events-none" 
        style={{ 
          backgroundImage: "linear-gradient(#141B29 1px, transparent 1px), linear-gradient(90deg, #141B29 1px, transparent 1px)", 
          backgroundSize: "32px 32px" 
        }} 
      />

      <div className="relative p-4 h-full flex flex-col">
        {/* Lista de deals */}
        <div className="flex-1 flex flex-col gap-2">
          {topDeals.slice(0, 3).map((deal, index) => {
            const medal = medalColors[index]
            return (
              <Link
                key={deal.id}
                href={`/dashboard/deals/${deal.id}`}
                className={`group flex items-center gap-3 p-3 rounded-xl border ${medal.border} ${medal.bg} hover:bg-opacity-40 transition-all duration-200`}
              >
                {/* Posição */}
                <div className="text-xl">{medal.icon}</div>

                {/* Info do deal */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate group-hover:text-[#4F7DFF] transition-colors">
                    {deal.name}
                  </p>
                  <p className="text-xs text-[#7C889E]">{deal.propertyType}</p>
                </div>

                {/* Lucro e ROI */}
                <div className="text-right">
                  <p className={`text-sm font-semibold ${medal.text}`}>
                    {formatBRL(deal.profit)}
                  </p>
                  <div className="flex items-center justify-end gap-1">
                    <TrendingUp className="h-3 w-3 text-emerald-500" />
                    <span className="text-xs text-emerald-400">ROI {(deal.roi * 100).toFixed(1)}%</span>
                  </div>
                </div>

                {/* Seta */}
                <ArrowUpRight className="h-4 w-4 text-[#5A6478] group-hover:text-[#4F7DFF] transition-colors" />
              </Link>
            )
          })}
        </div>

        {/* Footer com total */}
        {topDeals.length > 0 && (
          <div className="pt-3 border-t border-[#141B29] mt-auto">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#7C889E]">Lucro total realizações</span>
              <span className="text-emerald-400 font-semibold">
                {formatBRL(topDeals.reduce((acc, d) => acc + d.profit, 0))}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

