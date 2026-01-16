import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { LucideIcon } from "lucide-react"

interface KpiCardProps {
  title: string
  value: string
  delta: string
  negative?: boolean
  highlight?: boolean
  icon: LucideIcon
}

export function KpiCard({ title, value, delta, negative, highlight, icon: Icon }: KpiCardProps) {
  return (
    <Card className={`bg-[#0B0F17] border-[#141B29] shadow-[0_0_0_1px_rgba(20,27,41,0.6)] rounded-2xl ${highlight ? "ring-1 ring-[#32D583]/30" : ""}`}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <CardTitle className="text-xs font-medium text-[#7C889E]">{title}</CardTitle>
          <div className={`h-8 w-8 rounded-xl border grid place-items-center ${highlight ? "bg-[#32D583]/10 border-[#32D583]/30" : "bg-[#0B1323] border-[#141B29]"}`}>
            <Icon className={`h-4 w-4 ${highlight ? "text-[#32D583]" : "text-[#4F7DFF]"}`} />
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className={`text-xl font-semibold ${highlight ? "text-[#32D583]" : "text-white"}`}>{value}</div>
        <div className={negative ? "mt-1 text-xs text-[#FF5A6A]" : "mt-1 text-xs text-[#32D583]"}>
          {delta}
        </div>
      </CardContent>
    </Card>
  )
}
