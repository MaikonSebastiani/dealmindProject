"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { BarChart3, Building2, FileText, HelpCircle, Home, LogOut, Menu, Settings, Wallet, X, Search, Bell } from "lucide-react"

const nav = [
  { href: "/dashboard", label: "Visão Geral", icon: Home },
  { href: "/dashboard/deals", label: "Imóveis", icon: Building2 },
  // { href: "/dashboard/investimentos", label: "Investimentos", icon: BarChart3 },
  // { href: "/dashboard/carteira", label: "Carteira", icon: Wallet },
  // { href: "/dashboard/relatorios", label: "Relatórios", icon: FileText },
]

interface SidebarProps {
  userName?: string
  userEmail?: string
}

export function Sidebar({ userName = "Usuário", userEmail }: SidebarProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const pathname = usePathname()

  const SidebarContent = () => (
    <>
      <div className="space-y-6">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-xl bg-[#0B1323] border border-[#141B29] flex items-center justify-center shrink-0">
            <span className="text-sm font-semibold text-white">ib</span>
          </div>
          <div className="leading-tight min-w-0">
            <div className="text-sm font-semibold text-white">InvestImóveis</div>
            <div className="text-xs text-[#7C889E]">Dashboard</div>
          </div>
        </div>

        <nav className="space-y-1">
          {nav.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname?.startsWith(item.href))
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileOpen(false)}
                className={[
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition w-full",
                  isActive
                    ? "bg-[#0B1323] text-white border border-[#141B29]"
                    : "text-[#9AA6BC] hover:bg-[#0B1323]/70 hover:text-white",
                ].join(" ")}
              >
                <Icon className={isActive ? "h-4 w-4 text-[#4F7DFF]" : "h-4 w-4 text-[#7C889E] shrink-0"} />
                <span className="font-medium">{item.label}</span>
              </Link>
            )
          })}
        </nav>
      </div>

      <div className="space-y-2 pt-4 border-t border-[#141B29]">
        <Link 
          href="/dashboard/configuracoes" 
          onClick={() => setIsMobileOpen(false)}
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-[#9AA6BC] hover:bg-[#0B1323]/70 hover:text-white"
        >
          <Settings className="h-4 w-4 text-[#7C889E] shrink-0" />
          Configurações
        </Link>
        <Link 
          href="/dashboard/ajuda" 
          onClick={() => setIsMobileOpen(false)}
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-[#9AA6BC] hover:bg-[#0B1323]/70 hover:text-white"
        >
          <HelpCircle className="h-4 w-4 text-[#7C889E] shrink-0" />
          Ajuda
        </Link>
        <button className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-[#FF5A6A] hover:bg-[#0B1323]/70">
          <LogOut className="h-4 w-4 shrink-0" />
          Sair
        </button>
      </div>
    </>
  )

  const MobileMenuContent = () => (
    <>
      {/* Seção de Ações Rápidas (Mobile) */}
      <div className="lg:hidden space-y-3 pb-4 border-b border-[#141B29]">
        {/* Busca */}
        <div className="space-y-2">
          <button
            onClick={() => setIsSearchOpen(!isSearchOpen)}
            className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-[#9AA6BC] hover:bg-[#0B1323]/70 hover:text-white transition-colors"
          >
            <Search className="h-4 w-4 text-[#7C889E] shrink-0" />
            <span className="font-medium">Buscar imóveis</span>
          </button>
          {isSearchOpen && (
            <div className="px-3 pb-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#7C889E]" />
                <input
                  placeholder="Buscar imóveis..."
                  autoFocus
                  className="h-9 w-full rounded-lg bg-[#0B0F17] border border-[#141B29] pl-10 pr-3 text-sm text-white placeholder-[#7C889E] outline-none focus:border-[#2D5BFF]"
                />
              </div>
            </div>
          )}
        </div>

        {/* Notificações */}
        <button className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-[#9AA6BC] hover:bg-[#0B1323]/70 hover:text-white transition-colors">
          <Bell className="h-4 w-4 text-[#7C889E] shrink-0" />
          <span className="font-medium">Notificações</span>
        </button>

        {/* Usuário */}
        <div className="px-3">
          <div className="flex items-center gap-3 rounded-xl px-3 py-2.5 bg-[#0B1323] border border-[#141B29]">
            <div className="h-9 w-9 rounded-full bg-[#0B0F17] border border-[#141B29] grid place-items-center text-xs text-white font-medium shrink-0">
              {userName
                .split(" ")
                .slice(0, 2)
                .map((p) => p[0])
                .join("")
                .toUpperCase() || "U"}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm text-white truncate">{userName}</div>
              {userEmail && (
                <div className="text-xs text-[#7C889E] truncate">{userEmail}</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo normal do menu */}
      <SidebarContent />
    </>
  )

  return (
    <>
      {/* Mobile Menu Button - Direita */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="lg:hidden fixed top-4 right-4 z-50 h-10 w-10 rounded-lg border border-[#141B29] bg-[#0B0F17] grid place-items-center hover:bg-[#0B1323] transition-colors"
        aria-label="Toggle menu"
      >
        {isMobileOpen ? (
          <X className="h-5 w-5 text-white" />
        ) : (
          <Menu className="h-5 w-5 text-white" />
        )}
      </button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-[280px] shrink-0 border-r border-[#141B29] bg-[#060810]">
        <div className="h-full w-full flex flex-col justify-between px-5 py-6">
          <SidebarContent />
        </div>
      </aside>

      {/* Mobile Sidebar - Direita */}
      <aside
        className={[
          "lg:hidden fixed right-0 top-0 z-40 h-full w-[280px] border-l border-[#141B29] bg-[#060810] transform transition-transform duration-300 ease-in-out",
          isMobileOpen ? "translate-x-0" : "translate-x-full",
        ].join(" ")}
      >
        <div className="h-full w-full flex flex-col justify-between px-5 py-6 pt-16 overflow-y-auto">
          <MobileMenuContent />
        </div>
      </aside>
    </>
  )
}
