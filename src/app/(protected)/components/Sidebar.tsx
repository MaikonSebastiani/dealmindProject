import Link from "next/link"
import { BarChart3, Building2, FileText, HelpCircle, Home, LogOut, Settings, Wallet } from "lucide-react"

const nav = [
  { href: "/dashboard", label: "Visão Geral", icon: Home, active: true },
  { href: "/dashboard/imoveis", label: "Imóveis", icon: Building2 },
  { href: "/dashboard/investimentos", label: "Investimentos", icon: BarChart3 },
  { href: "/dashboard/carteira", label: "Carteira", icon: Wallet },
  { href: "/dashboard/relatorios", label: "Relatórios", icon: FileText },
]

export function Sidebar() {
  return (
    <aside className="w-[280px] shrink-0 border-r border-[#141B29] bg-[#060810]">
      <div className="h-full flex flex-col justify-between px-5 py-6">
        <div className="space-y-6">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-xl bg-[#0B1323] border border-[#141B29] flex items-center justify-center">
              <span className="text-sm font-semibold text-white">ib</span>
            </div>
            <div className="leading-tight">
              <div className="text-sm font-semibold text-white">InvestImóveis</div>
              <div className="text-xs text-[#7C889E]">Dashboard</div>
            </div>
          </div>

          <nav className="space-y-1">
            {nav.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={[
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition",
                    item.active
                      ? "bg-[#0B1323] text-white border border-[#141B29]"
                      : "text-[#9AA6BC] hover:bg-[#0B1323]/70 hover:text-white",
                  ].join(" ")}
                >
                  <Icon className={item.active ? "h-4 w-4 text-[#4F7DFF]" : "h-4 w-4 text-[#7C889E]"} />
                  <span className="font-medium">{item.label}</span>
                </Link>
              )
            })}
          </nav>
        </div>

        <div className="space-y-2 pt-4 border-t border-[#141B29]">
          <Link href="/dashboard/configuracoes" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-[#9AA6BC] hover:bg-[#0B1323]/70 hover:text-white">
            <Settings className="h-4 w-4 text-[#7C889E]" />
            Configurações
          </Link>
          <Link href="/dashboard/ajuda" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-[#9AA6BC] hover:bg-[#0B1323]/70 hover:text-white">
            <HelpCircle className="h-4 w-4 text-[#7C889E]" />
            Ajuda
          </Link>
          <button className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-[#FF5A6A] hover:bg-[#0B1323]/70">
            <LogOut className="h-4 w-4" />
            Sair
          </button>
        </div>
      </div>
    </aside>
  )
}


