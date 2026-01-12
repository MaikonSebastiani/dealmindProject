import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { LucideIcon } from "lucide-react"

interface KpiCardProps {
  title: string
  value: string
  delta: string
  negative?: boolean
  icon: LucideIcon
}

export function KpiCard({ title, value, delta, negative, icon: Icon }: KpiCardProps) {
  return (
    <Card className="bg-[#0B0F17] border-[#141B29] shadow-[0_0_0_1px_rgba(20,27,41,0.6)] rounded-2xl">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <CardTitle className="text-xs font-medium text-[#7C889E]">{title}</CardTitle>
          <div className="h-8 w-8 rounded-xl bg-[#0B1323] border border-[#141B29] grid place-items-center">
            <Icon className="h-4 w-4 text-[#4F7DFF]" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="text-xl font-semibold text-white">{value}</div>
        <div className={negative ? "mt-1 text-xs text-[#FF5A6A]" : "mt-1 text-xs text-[#32D583]"}>
          {delta}
        </div>
      </CardContent>
    </Card>
  )
}
