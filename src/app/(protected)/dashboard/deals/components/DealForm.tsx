"use client"

import Link from "next/link"
import { useMemo, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm } from "react-hook-form"
import { dealFormSchema, DealFormValues } from "./dealFormSchema"

type DealFormDefaults = Partial<DealFormValues>

function sanitizeToDigits(value: string) {
  return value.replace(/\D/g, "")
}

function MoneyField(props: {
  label: string
  name: string
  required?: boolean
  optionalHint?: string
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
  error?: string
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
          required={props.required}
          value={props.value}
          onChange={(e) => {
            const digits = sanitizeToDigits(e.target.value).slice(0, 15)
            if (!digits) {
              props.onChange("")
              return
            }
            const cents = Number(digits)
            if (!Number.isFinite(cents)) return
            props.onChange(formatter.format(cents / 100))
          }}
          onBlur={props.onBlur}
          className="h-10 bg-[#05060B] border-[#141B29] text-white placeholder-[#7C889E] pl-10 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-[#2D5BFF]"
          placeholder="0,00"
        />
      </div>
      {props.error ? <div className="mt-1 text-xs text-rose-400">{props.error}</div> : null}
    </div>
  )
}

function PercentField(props: {
  label: string
  name: string
  required?: boolean
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
  error?: string
  optionalHint?: string
  disabled?: boolean
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
      <div className="relative">
        <Input
          id={props.name}
          name={props.name}
          inputMode="decimal"
          type="text"
          required={props.required}
          disabled={props.disabled}
          value={props.value}
          onChange={(e) => props.onChange(e.target.value)}
          onBlur={props.onBlur}
          placeholder="0"
          className="h-10 bg-[#05060B] border-[#141B29] text-white placeholder-[#7C889E] pr-10 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-[#2D5BFF] disabled:opacity-60"
        />
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-[#7C889E]">%</span>
      </div>
      {props.error ? <div className="mt-1 text-xs text-rose-400">{props.error}</div> : null}
    </div>
  )
}

function TextField(props: {
  label: string
  name: string
  required?: boolean
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
  error?: string
  disabled?: boolean
  placeholder?: string
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
        type="text"
        required={props.required}
        disabled={props.disabled}
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        onBlur={props.onBlur}
        placeholder={props.placeholder}
        className="h-10 bg-[#05060B] border-[#141B29] text-white placeholder-[#7C889E] focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-[#2D5BFF] disabled:opacity-60"
      />
      {props.error ? <div className="mt-1 text-xs text-rose-400">{props.error}</div> : null}
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

export function DealForm(props: {
  title: string
  subtitle: string
  breadcrumb: { label: string; href: string }[]
  submitLabel: string
  cancelHref: string
  defaultValues?: DealFormDefaults
  action: (formData: FormData) => void | Promise<void>
}) {
  const [isPending, startTransition] = useTransition()

  const form = useForm<DealFormValues>({
    resolver: zodResolver(dealFormSchema),
    mode: "onBlur",
    defaultValues: props.defaultValues ?? {
      acquisition: {
        purchasePrice: "",
        downPaymentPercent: "20",
        auctioneerFeePercent: "",
        itbiPercent: "3",
        registryCost: "0,00",
      },
      financing: {
        enabled: true,
        interestRateAnnual: "12",
        termMonths: "360",
        amortizationType: "PRICE",
      },
      liabilities: {
        iptuDebt: "0,00",
        condoDebt: "0,00",
      },
      operationAndExit: {
        resalePrice: "",
        resaleDiscountPercent: "0",
        brokerFeePercent: "6",
        monthlyCondoFee: "0,00",
        monthlyIptu: "0,00",
        expectedSaleMonths: "12",
      },
    },
  })

  const { handleSubmit, formState, control, watch, setValue } = form
  const { errors } = formState
  const financingEnabled = watch("financing.enabled")

  const onSubmit = (values: DealFormValues) => {
    const formData = new FormData()
    formData.set("payload", JSON.stringify(values))
    startTransition(async () => {
      await props.action(formData)
    })
  }

  return (
    <>
      <header className="sticky top-0 z-40 bg-[#05060B]/80 backdrop-blur border-b border-[#141B29]">
        <div className="flex items-start md:items-center justify-between px-6 md:px-10 py-5 gap-4">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2 text-xs text-[#7C889E]">
              {props.breadcrumb.map((b, idx) => (
                <span key={`${b.href}-${idx}`} className="inline-flex items-center gap-2">
                  <Link href={b.href} className="hover:text-white">
                    {b.label}
                  </Link>
                  {idx < props.breadcrumb.length - 1 ? <span>/</span> : null}
                </span>
              ))}
            </div>
            <h1 className="text-xl font-semibold truncate">{props.title}</h1>
            <p className="text-sm text-[#7C889E]">{props.subtitle}</p>
          </div>
        </div>
      </header>

      <div className="px-6 md:px-10 py-6 space-y-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <SectionCard title="Aquisição">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              <Controller
                name="acquisition.purchasePrice"
                control={control}
                render={({ field }) => (
                  <MoneyField
                    label="Preço de compra"
                    name="purchasePrice"
                    required
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    error={errors.acquisition?.purchasePrice?.message as string | undefined}
                    className="md:col-span-6"
                  />
                )}
              />
              <Controller
                name="acquisition.downPaymentPercent"
                control={control}
                render={({ field }) => (
                  <PercentField
                    label="Entrada (%)"
                    name="downPaymentPercent"
                    required
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    error={errors.acquisition?.downPaymentPercent?.message as string | undefined}
                    className="md:col-span-3"
                  />
                )}
              />
              <Controller
                name="acquisition.auctioneerFeePercent"
                control={control}
                render={({ field }) => (
                  <PercentField
                    label="Comissão do leiloeiro (%)"
                    name="auctioneerFeePercent"
                    optionalHint="opcional"
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    error={errors.acquisition?.auctioneerFeePercent?.message as string | undefined}
                    className="md:col-span-3"
                  />
                )}
              />
              <Controller
                name="acquisition.itbiPercent"
                control={control}
                render={({ field }) => (
                  <PercentField
                    label="ITBI (%)"
                    name="itbiPercent"
                    required
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    error={errors.acquisition?.itbiPercent?.message as string | undefined}
                    className="md:col-span-3"
                  />
                )}
              />
              <Controller
                name="acquisition.registryCost"
                control={control}
                render={({ field }) => (
                  <MoneyField
                    label="Custo de registro"
                    name="registryCost"
                    required
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    error={errors.acquisition?.registryCost?.message as string | undefined}
                    className="md:col-span-3"
                  />
                )}
              />
            </div>
          </SectionCard>

          <SectionCard title="Financiamento">
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-xl border border-[#141B29] bg-[#05060B] px-4 py-3">
                <div>
                  <div className="text-sm font-medium text-white">Habilitar financiamento</div>
                  <div className="text-xs text-[#7C889E]">Taxa, prazo e sistema de amortização</div>
                </div>
                <input
                  type="checkbox"
                  checked={financingEnabled}
                  onChange={(e) => setValue("financing.enabled", e.target.checked, { shouldValidate: true })}
                  className="h-4 w-4 accent-[#4F7DFF]"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                <Controller
                  name="financing.interestRateAnnual"
                  control={control}
                  render={({ field }) => (
                    <PercentField
                      label="Taxa de juros Anual"
                      name="interestRateAnnual"
                      required={financingEnabled}
                      disabled={!financingEnabled}
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      error={errors.financing?.interestRateAnnual?.message as string | undefined}
                      className="md:col-span-4"
                    />
                  )}
                />
                <Controller
                  name="financing.termMonths"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      label="Prazo (meses)"
                      name="termMonths"
                      required={financingEnabled}
                      disabled={!financingEnabled}
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      error={errors.financing?.termMonths?.message as string | undefined}
                      placeholder="360"
                      className="md:col-span-4"
                    />
                  )}
                />
                <Controller
                  name="financing.amortizationType"
                  control={control}
                  render={({ field }) => (
                    <div className="md:col-span-4">
                      <div className="flex items-center justify-between gap-3">
                        <label className="text-sm text-[#9AA6BC]">Amortization</label>
                        <span className="text-xs text-[#7C889E]">&nbsp;</span>
                      </div>
                      <select
                        disabled={!financingEnabled}
                        value={field.value}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        className="h-10 w-full rounded-md bg-[#05060B] border border-[#141B29] px-3 text-sm text-white outline-none focus:border-[#2D5BFF] disabled:opacity-60"
                      >
                        <option value="PRICE">PRICE</option>
                        <option value="SAC">SAC</option>
                      </select>
                      {errors.financing?.amortizationType?.message ? (
                        <div className="mt-1 text-xs text-rose-400">{String(errors.financing.amortizationType.message)}</div>
                      ) : null}
                    </div>
                  )}
                />
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Dívidas herdadas">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              <Controller
                name="liabilities.iptuDebt"
                control={control}
                render={({ field }) => (
                  <MoneyField
                    label="Dívida de IPTU"
                    name="iptuDebt"
                    required
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    error={errors.liabilities?.iptuDebt?.message as string | undefined}
                    className="md:col-span-6"
                  />
                )}
              />
              <Controller
                name="liabilities.condoDebt"
                control={control}
                render={({ field }) => (
                  <MoneyField
                    label="Dívida de condomínio"
                    name="condoDebt"
                    required
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    error={errors.liabilities?.condoDebt?.message as string | undefined}
                    className="md:col-span-6"
                  />
                )}
              />
            </div>
          </SectionCard>

          <SectionCard title="Operação e saída">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              <Controller
                name="operationAndExit.resalePrice"
                control={control}
                render={({ field }) => (
                  <MoneyField
                    label="Preço de venda"
                    name="resalePrice"
                    required
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    error={errors.operationAndExit?.resalePrice?.message as string | undefined}
                    className="md:col-span-6"
                  />
                )}
              />
              <Controller
                name="operationAndExit.resaleDiscountPercent"
                control={control}
                render={({ field }) => (
                  <PercentField
                    label="Desconto de venda (%)"
                    name="resaleDiscountPercent"
                    required
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    error={errors.operationAndExit?.resaleDiscountPercent?.message as string | undefined}
                    className="md:col-span-3"
                  />
                )}
              />
              <Controller
                name="operationAndExit.brokerFeePercent"
                control={control}
                render={({ field }) => (
                  <PercentField
                    label="Comissão do corretor (%)"
                    name="brokerFeePercent"
                    required
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    error={errors.operationAndExit?.brokerFeePercent?.message as string | undefined}
                    className="md:col-span-3"
                  />
                )}
              />
              <Controller
                name="operationAndExit.monthlyCondoFee"
                control={control}
                render={({ field }) => (
                  <MoneyField
                    label="Condomínio mensal"
                    name="monthlyCondoFee"
                    required
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    error={errors.operationAndExit?.monthlyCondoFee?.message as string | undefined}
                    className="md:col-span-6"
                  />
                )}
              />
              <Controller
                name="operationAndExit.monthlyIptu"
                control={control}
                render={({ field }) => (
                  <MoneyField
                    label="IPTU mensal"
                    name="monthlyIptu"
                    required
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    error={errors.operationAndExit?.monthlyIptu?.message as string | undefined}
                    className="md:col-span-3"
                  />
                )}
              />
              <Controller
                name="operationAndExit.expectedSaleMonths"
                control={control}
                render={({ field }) => (
                  <TextField
                    label="Venda esperada (meses)"
                    name="expectedSaleMonths"
                    required
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    error={errors.operationAndExit?.expectedSaleMonths?.message as string | undefined}
                    placeholder="12"
                    className="md:col-span-3"
                  />
                )}
              />
            </div>
          </SectionCard>

          <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3">
            <Button
              asChild
              variant="outline"
              className="border-[#141B29] bg-[#0B0F17] hover:bg-[#0B1323] text-[#9AA6BC]"
            >
              <Link href={props.cancelHref}>Cancelar</Link>
            </Button>

            <Button type="submit" disabled={isPending} className="bg-[#4F7DFF] hover:bg-[#2D5BFF]">
              {isPending ? "Salvando..." : props.submitLabel}
            </Button>
          </div>
        </form>
      </div>
    </>
  )
}


