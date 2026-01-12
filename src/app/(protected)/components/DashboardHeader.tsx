"use client"

import { Bell, Search } from "lucide-react"

export function DashboardHeader({ userName }: { userName: string }) {
  return (
    <header className="sticky top-0 z-40 bg-[#05060B]/80 backdrop-blur border-b border-[#141B29]">
      <div className="flex items-center justify-between px-10 py-5">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold">Visão Geral</h1>
          <div className="flex items-center gap-2 text-xs text-[#7C889E]">
            <span className="inline-flex h-6 items-center rounded-lg border border-[#141B29] bg-[#0B0F17] px-2">
              Últimos 12 meses
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-[320px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#7C889E]" />
            <input
              placeholder="Buscar imóveis..."
              className="h-9 w-full rounded-lg bg-[#0B0F17] border border-[#141B29] pl-10 pr-3 text-sm text-white placeholder-[#7C889E] outline-none focus:border-[#2D5BFF]"
            />
          </div>

          <button className="h-9 w-9 rounded-lg border border-[#141B29] bg-[#0B0F17] grid place-items-center">
            <Bell className="h-4 w-4 text-[#9AA6BC]" />
          </button>

          <div className="flex items-center gap-2 pl-2">
            <div className="h-9 w-9 rounded-full bg-[#0B0F17] border border-[#141B29] grid place-items-center text-xs text-white">
              {userName
                .split(" ")
                .slice(0, 2)
                .map((p) => p[0])
                .join("")
                .toUpperCase()}
            </div>
            <div className="text-sm text-[#9AA6BC]">{userName}</div>
          </div>
        </div>
      </div>
    </header>
  )
}
