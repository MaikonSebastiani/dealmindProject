interface TransactionItemProps {
  label: string
  subtitle?: string
  value: string
  negative?: boolean
}

export function TransactionItem({ label, subtitle, value, negative }: TransactionItemProps) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-[#141B29] bg-[#0B0F17]/60 px-3 py-2">
      <div className="min-w-0">
        <div className="text-sm text-white truncate">{label}</div>
        {subtitle ? <div className="text-xs text-[#7C889E]">{subtitle}</div> : null}
      </div>
      <div className={negative ? "text-sm text-[#FF5A6A]" : "text-sm text-[#32D583]"}>{value}</div>
    </div>
  )
}
