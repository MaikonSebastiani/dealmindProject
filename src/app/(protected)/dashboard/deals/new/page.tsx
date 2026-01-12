 "use client"

import Link from "next/link"
import { ChevronRight, Plus } from "lucide-react"
import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

function formatCentsToPtBR(cents: number) {
  const value = cents / 100
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

function sanitizeToDigits(value: string) {
  return value.replace(/\D/g, "")
}

function Field(props: {
  label: string
  name: string
  placeholder?: string
  type?: React.InputHTMLAttributes<HTMLInputElement>["type"]
  required?: boolean
  optionalHint?: string
  className?: string
}) {
  return (
    <div className={props.className}>
      <div className="flex items-center justify-between gap-3">
        <label htmlFor={props.name} className="text-sm text-[#9AA6BC]">
          {props.label}
        </label>
        {props.optionalHint ? <span className="text-xs text-[#7C889E]">{props.optionalHint}</span> : null}
      </div>
      <Input
        id={props.name}
        name={props.name}
        type={props.type ?? "text"}
        required={props.required}
        placeholder={props.placeholder}
        className="h-10 bg-[#05060B] border-[#141B29] text-white placeholder-[#7C889E] focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-[#2D5BFF]"
      />
    </div>
  )
}

function MoneyField(props: {
  label: string
  name: string
  placeholder?: string
  required?: boolean
  optionalHint?: string
  className?: string
}) {
  const formatter = useMemo(
    () =>
      new Intl.NumberFormat("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
    [],
  )

  const [displayValue, setDisplayValue] = useState("")

  return (
    <div className={props.className}>
      <div className="flex items-center justify-between gap-3">
        <label htmlFor={props.name} className="text-sm text-[#9AA6BC]">
          {props.label}
        </label>
        {props.optionalHint ? <span className="text-xs text-[#7C889E]">{props.optionalHint}</span> : null}
      </div>
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#7C889E]">R$</span>
        <Input
          id={props.name}
          name={props.name}
          inputMode="numeric"
          type="text"
          placeholder={props.placeholder ?? "0,00"}
          required={props.required}
          value={displayValue}
          onChange={(e) => {
            const digits = sanitizeToDigits(e.target.value).slice(0, 15)
            if (!digits) {
              setDisplayValue("")
              return
            }

            const cents = Number(digits)
            if (!Number.isFinite(cents)) {
              return
            }

            setDisplayValue(formatter.format(cents / 100))
          }}
          onBlur={() => {
            if (!displayValue) return
            const digits = sanitizeToDigits(displayValue)
            if (!digits) {
              setDisplayValue("")
              return
            }
            setDisplayValue(formatCentsToPtBR(Number(digits)))
          }}
          className="h-10 bg-[#05060B] border-[#141B29] text-white placeholder-[#7C889E] pl-10 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-[#2D5BFF]"
        />
      </div>
    </div>
  )
}

function SectionCard(props: { title: string; children: React.ReactNode }) {
  return (
    <Card className="bg-[#0B0F17] border-[#141B29] rounded-2xl">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">{props.title}</CardTitle>
      </CardHeader>
      <CardContent>{props.children}</CardContent>
    </Card>
  )
}

export default function NewDealPage() {
  return (
    <>
      <header className="sticky top-0 z-40 bg-[#05060B]/80 backdrop-blur border-b border-[#141B29]">
        <div className="flex items-start md:items-center justify-between px-6 md:px-10 py-5 gap-4">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2 text-xs text-[#7C889E]">
              <Link href="/dashboard/deals" className="hover:text-white">
                Deals
              </Link>
              <ChevronRight className="h-3 w-3 shrink-0" />
              <span>Novo Deal</span>
            </div>
            <h1 className="text-xl font-semibold truncate">Novo Deal</h1>
            <p className="text-sm text-[#7C889E]">
              Preencha as informações básicas do imóvel para calcular e analisar o deal.
            </p>
          </div>
        </div>
      </header>

      <div className="px-6 md:px-10 py-6 space-y-6">
        <form className="space-y-6">
          <SectionCard title="Informações do Imóvel">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Nome do imóvel" name="propertyName" placeholder="Ex: Apartamento Centro (SP)" required />

              <div>
                <label htmlFor="propertyType" className="text-sm text-[#9AA6BC]">
                  Tipo do imóvel
                </label>
                <select
                  id="propertyType"
                  name="propertyType"
                  required
                  defaultValue=""
                  className="mt-2 h-10 w-full rounded-md bg-[#05060B] border border-[#141B29] px-3 text-sm text-white outline-none focus:border-[#2D5BFF]"
                >
                  <option value="" disabled>
                    Selecione...
                  </option>
                  <option value="Casa">Casa</option>
                  <option value="Apartamento">Apartamento</option>
                  <option value="Terreno">Terreno</option>
                  <option value="Comercial">Comercial</option>
                </select>
              </div>

              <Field
                label="Endereço"
                name="address"
                placeholder="Ex: Av. Paulista, 1000 • São Paulo - SP"
                className="md:col-span-2"
              />
            </div>
          </SectionCard>

          <SectionCard title="Valores de Aquisição">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <MoneyField label="Preço de compra" name="purchasePrice" placeholder="0,00" required />
              <MoneyField label="Custos de aquisição" name="acquisitionCosts" placeholder="0,00" required />
              <MoneyField label="Pagamento inicial" name="downPayment" placeholder="0,00" optionalHint="opcional" />
            </div>
          </SectionCard>

          <SectionCard title="Receita">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <MoneyField label="Aluguel Mensal" name="monthlyRent" placeholder="0,00" required />
            </div>
          </SectionCard>

          <SectionCard title="Despesas">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <MoneyField label="Despesas Mensais" name="monthlyExpenses" placeholder="0,00" required />
              <MoneyField label="IPTU Anual" name="annualPropertyTax" placeholder="0,00" required />
            </div>
          </SectionCard>

          <SectionCard title="Financiamento">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <MoneyField label="Parcela Mensal" name="monthlyInstallment" placeholder="0,00" optionalHint="opcional" />
            </div>
          </SectionCard>

          <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3">
            <Button
              asChild
              variant="outline"
              className="border-[#141B29] bg-[#0B0F17] hover:bg-[#0B1323] text-[#9AA6BC]"
            >
              <Link href="/dashboard/deals">Cancelar</Link>
            </Button>

            <Button type="button" className="bg-[#4F7DFF] hover:bg-[#2D5BFF]">
              <Plus className="h-4 w-4 mr-2" />
              Calcular Deal
            </Button>
          </div>
        </form>
      </div>
    </>
  )
}


