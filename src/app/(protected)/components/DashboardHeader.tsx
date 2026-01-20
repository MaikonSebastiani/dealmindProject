"use client"

import { Bell } from "lucide-react"
import { UserMenu } from "./UserMenu"

interface DashboardHeaderProps {
  userName: string
  userEmail?: string
}

export function DashboardHeader({ userName, userEmail }: DashboardHeaderProps) {
  return (
    <header className="sticky top-0 z-30 bg-[#05060B]/80 backdrop-blur border-b border-[#141B29]">
      <div className="flex items-center justify-between px-4 sm:px-6 lg:px-10 py-4 sm:py-5 gap-3">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          <h1 className="text-lg sm:text-xl font-semibold truncate">Visão Geral</h1>
          <div className="hidden sm:flex items-center gap-2 text-xs text-[#7C889E]">
            <span className="inline-flex h-6 items-center rounded-lg border border-[#141B29] bg-[#0B0F17] px-2 whitespace-nowrap">
              Últimos 12 meses
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Desktop Notifications and User */}
          <div className="hidden lg:flex items-center gap-2 sm:gap-3">
            <button className="h-9 w-9 rounded-lg border border-[#141B29] bg-[#0B0F17] grid place-items-center hover:bg-[#0B1323] transition-colors shrink-0">
              <Bell className="h-4 w-4 text-[#9AA6BC]" />
            </button>
            <UserMenu userName={userName} userEmail={userEmail} />
          </div>
        </div>
      </div>
    </header>
  )
}
