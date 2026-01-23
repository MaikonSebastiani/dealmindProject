"use client"

import Link from "next/link"
import { FileText, Upload, X, Trash2 } from "lucide-react"
import { useMemo, useRef, useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm } from "react-hook-form"
import { dealFormSchema, DealFormValues, propertyTypes, PropertyType } from "./dealFormSchema"

type DealFormDefaults = Partial<DealFormValues> & { propertyType?: PropertyType }

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

function DocumentUpload(props: {
  label: string
  description: string
  inputRef: React.RefObject<HTMLInputElement | null>
  selectedFileName: string | null
  existingFileName: string | null
  onFileSelect: (file: File | null) => void
  onDelete: () => void
  markedForDeletion: boolean
}) {
  const hasNewFile = Boolean(props.selectedFileName)
  const hasExistingFile = Boolean(props.existingFileName) && !props.markedForDeletion

  return (
    <div className="rounded-xl sm:rounded-2xl border border-[#141B29] bg-[#05060B] p-3 sm:p-4">
      {/* Mobile Layout */}
      <div className="flex flex-col sm:hidden gap-3">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-[#0B0F17] border border-[#141B29] shrink-0">
            <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-[#7C889E]" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-white">{props.label}</div>
            <div className="text-xs text-[#7C889E] mt-0.5">{props.description}</div>
          </div>
        </div>

        {/* Status do arquivo - Mobile */}
        {props.markedForDeletion && (
          <div className="text-xs text-rose-400 px-3">
            Arquivo será removido ao salvar
          </div>
        )}

        {hasNewFile && (
          <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <div className="flex-1 min-w-0">
              <div className="text-xs text-emerald-400 font-medium mb-0.5">Novo arquivo</div>
              <div className="text-xs text-emerald-300 truncate">{props.selectedFileName}</div>
            </div>
            <button
              type="button"
              onClick={() => {
                props.onFileSelect(null)
                if (props.inputRef.current) props.inputRef.current.value = ""
              }}
              className="text-[#7C889E] hover:text-white shrink-0"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {!hasNewFile && hasExistingFile && (
          <div className="px-3 py-2 rounded-lg bg-[#0B0F17] border border-[#141B29]">
            <div className="text-xs text-[#7C889E] mb-0.5">Arquivo atual</div>
            <div className="text-xs text-[#9AA6BC] truncate">{props.existingFileName}</div>
          </div>
        )}

        {/* Ações - Mobile */}
        <div className="flex items-center gap-2">
          {(hasExistingFile || hasNewFile) && !props.markedForDeletion && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={props.onDelete}
              className="flex-1 h-9 text-xs text-[#7C889E] hover:text-rose-400 hover:bg-rose-400/10 border border-[#141B29]"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Remover
            </Button>
          )}

          {props.markedForDeletion && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={props.onDelete}
              className="flex-1 h-9 text-xs text-emerald-400 hover:text-emerald-300 hover:bg-emerald-400/10 border border-emerald-500/20"
            >
              Desfazer remoção
            </Button>
          )}

          <label className="flex-1 cursor-pointer">
            <div className="flex h-9 items-center justify-center gap-2 rounded-lg border border-[#141B29] bg-[#0B0F17] text-sm text-[#9AA6BC] hover:bg-[#0B1323] hover:text-white transition-colors">
              <Upload className="h-4 w-4" />
              <span>{hasNewFile || hasExistingFile ? "Substituir" : "Enviar"}</span>
            </div>
            <input
              ref={props.inputRef}
              type="file"
              accept="application/pdf"
              className="sr-only"
              onChange={(e) => {
                const file = e.target.files?.[0] ?? null
                props.onFileSelect(file)
              }}
            />
          </label>
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden sm:flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0B0F17] border border-[#141B29] shrink-0">
          <FileText className="h-5 w-5 text-[#7C889E]" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-white">{props.label}</div>
          <div className="text-xs text-[#7C889E] mt-0.5">{props.description}</div>

          {props.markedForDeletion && (
            <div className="mt-2 text-xs text-rose-400">
              Arquivo será removido ao salvar
            </div>
          )}

          {hasNewFile && (
            <div className="mt-2 flex items-center gap-2">
              <span className="text-xs text-emerald-400 truncate">
                Novo: {props.selectedFileName}
              </span>
              <button
                type="button"
                onClick={() => {
                  props.onFileSelect(null)
                  if (props.inputRef.current) props.inputRef.current.value = ""
                }}
                className="text-[#7C889E] hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {!hasNewFile && hasExistingFile && (
            <div className="mt-2 flex items-center gap-2">
              <span className="text-xs text-[#9AA6BC] truncate">
                Atual: {props.existingFileName}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {(hasExistingFile || hasNewFile) && !props.markedForDeletion && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={props.onDelete}
              className="h-9 w-9 p-0 text-[#7C889E] hover:text-rose-400 hover:bg-rose-400/10"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}

          {props.markedForDeletion && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={props.onDelete}
              className="h-9 px-3 text-xs text-emerald-400 hover:text-emerald-300 hover:bg-emerald-400/10"
            >
              Desfazer
            </Button>
          )}

          <label className="cursor-pointer">
            <div className="flex h-9 items-center gap-2 rounded-lg border border-[#141B29] bg-[#0B0F17] px-3 text-sm text-[#9AA6BC] hover:bg-[#0B1323] hover:text-white transition-colors">
              <Upload className="h-4 w-4" />
              <span>{hasNewFile || hasExistingFile ? "Substituir" : "Enviar"}</span>
            </div>
            <input
              ref={props.inputRef}
              type="file"
              accept="application/pdf"
              className="sr-only"
              onChange={(e) => {
                const file = e.target.files?.[0] ?? null
                props.onFileSelect(file)
              }}
            />
          </label>
        </div>
      </div>
    </div>
  )
}

export function DealForm(props: {
  title: string
  subtitle: string
  breadcrumb: { label: string; href: string }[]
  submitLabel: string
  cancelHref: string
  defaultValues?: DealFormDefaults
  dealId?: string
  existingDocuments?: {
    propertyRegistryFileName: string | null
    auctionNoticeFileName: string | null
  }
  action: (formData: FormData) => void | Promise<void>
}) {
  const [isPending, startTransition] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)
  const propertyRegistryRef = useRef<HTMLInputElement>(null)
  const auctionNoticeRef = useRef<HTMLInputElement>(null)

  const [propertyRegistryFile, setPropertyRegistryFile] = useState<File | null>(null)
  const [auctionNoticeFile, setAuctionNoticeFile] = useState<File | null>(null)
  const [deletePropertyRegistry, setDeletePropertyRegistry] = useState(false)
  const [deleteAuctionNotice, setDeleteAuctionNotice] = useState(false)

  const form = useForm<DealFormValues>({
    resolver: zodResolver(dealFormSchema),
    mode: "onBlur",
    defaultValues: props.defaultValues ?? {
      propertyName: "",
      address: "",
      propertyType: "Apartamento",
      acquisition: {
        purchasePrice: "",
        downPaymentPercent: "20",
        auctioneerFeePercent: "",
        advisoryFeePercent: "",
        itbiPercent: "3",
        registryCost: "0,00",
      },
      paymentType: "cash",
      installment: {
        installmentsCount: "12",
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
      renovation: {
        costs: "0,00",
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
  const paymentType = watch("paymentType") || "cash"
  const auctioneerFeePercent = watch("acquisition.auctioneerFeePercent") ?? ""
  const isAuction = Number(String(auctioneerFeePercent).replace(",", ".")) > 0

  const onSubmit = (values: DealFormValues) => {
    const formData = new FormData()
    formData.set("payload", JSON.stringify(values))

    // Arquivos
    if (propertyRegistryFile) {
      formData.set("propertyRegistryFile", propertyRegistryFile)
    }
    if (auctionNoticeFile) {
      formData.set("auctionNoticeFile", auctionNoticeFile)
    }

    // Flags de deleção
    formData.set("deletePropertyRegistry", deletePropertyRegistry ? "1" : "0")
    formData.set("deleteAuctionNotice", deleteAuctionNotice ? "1" : "0")

    startTransition(async () => {
      await props.action(formData)
    })
  }

  // Mostrar campo de edital se for leilão OU se já existe um arquivo de edital
  const showAuctionNotice = isAuction || Boolean(props.existingDocuments?.auctionNoticeFileName)

  return (
    <>
      <header className="bg-[#05060B]/80 backdrop-blur border-b border-[#141B29]">
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

      <div className="px-6 md:px-10 py-6 space-y-4">
        <form ref={formRef} onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Aquisição - inclui nome e tipo de imóvel */}
          <SectionCard title="Aquisição">
            <div className="grid grid-cols-2 md:grid-cols-12 gap-3">
              <Controller
                name="propertyName"
                control={control}
                render={({ field }) => (
                  <div className="col-span-2 md:col-span-4">
                    <label htmlFor="propertyName" className="text-sm text-[#9AA6BC]">Nome do imóvel</label>
                    <Input
                      id="propertyName"
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      placeholder="Ex: Apt Centro, Casa Praia..."
                      className="h-10 bg-[#05060B] border-[#141B29] text-white placeholder-[#7C889E] focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-[#2D5BFF]"
                    />
                    {errors.propertyName?.message && (
                      <div className="mt-1 text-xs text-rose-400">{String(errors.propertyName.message)}</div>
                    )}
                  </div>
                )}
              />
              <Controller
                name="address"
                control={control}
                render={({ field }) => (
                  <div className="col-span-2 md:col-span-6">
                    <label htmlFor="address" className="text-sm text-[#9AA6BC]">Endereço</label>
                    <Input
                      id="address"
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      placeholder="Rua, número, bairro, cidade..."
                      className="h-10 bg-[#05060B] border-[#141B29] text-white placeholder-[#7C889E] focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-[#2D5BFF]"
                    />
                  </div>
                )}
              />
              <Controller
                name="propertyType"
                control={control}
                render={({ field }) => (
                  <div className="col-span-2 md:col-span-2">
                    <label htmlFor="propertyType" className="text-sm text-[#9AA6BC]">Tipo</label>
                    <select
                      id="propertyType"
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      className="h-10 w-full rounded-md bg-[#05060B] border border-[#141B29] px-3 text-sm text-white outline-none focus:border-[#2D5BFF]"
                    >
                      {propertyTypes.map((type) => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                    {errors.propertyType?.message && (
                      <div className="mt-1 text-xs text-rose-400">{String(errors.propertyType.message)}</div>
                    )}
                  </div>
                )}
              />
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
                    className="col-span-2 md:col-span-4"
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
                    className="md:col-span-2"
                  />
                )}
              />
              <Controller
                name="acquisition.auctioneerFeePercent"
                control={control}
                render={({ field }) => (
                  <PercentField
                    label="Leiloeiro (%)"
                    name="auctioneerFeePercent"
                    optionalHint="opcional"
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    error={errors.acquisition?.auctioneerFeePercent?.message as string | undefined}
                    className="md:col-span-2"
                  />
                )}
              />
              <Controller
                name="acquisition.advisoryFeePercent"
                control={control}
                render={({ field }) => (
                  <PercentField
                    label="Assessoria (%)"
                    name="advisoryFeePercent"
                    optionalHint=""
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    error={errors.acquisition?.advisoryFeePercent?.message as string | undefined}
                    className="md:col-span-2"
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
                    className="md:col-span-2"
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
                    className="col-span-2 md:col-span-4"
                  />
                )}
              />
            </div>
          </SectionCard>

          {/* Documentos e Financiamento lado a lado */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <SectionCard title="Documentos">
              <div className="space-y-3">
                <DocumentUpload
                  label="Matrícula do imóvel"
                  description="PDF da matrícula atualizada"
                  inputRef={propertyRegistryRef}
                  selectedFileName={propertyRegistryFile?.name ?? null}
                  existingFileName={props.existingDocuments?.propertyRegistryFileName ?? null}
                  onFileSelect={(file) => {
                    setPropertyRegistryFile(file)
                    if (file) setDeletePropertyRegistry(false)
                  }}
                  onDelete={() => {
                    if (deletePropertyRegistry) {
                      setDeletePropertyRegistry(false)
                    } else {
                      setPropertyRegistryFile(null)
                      if (propertyRegistryRef.current) propertyRegistryRef.current.value = ""
                      if (props.existingDocuments?.propertyRegistryFileName) {
                        setDeletePropertyRegistry(true)
                      }
                    }
                  }}
                  markedForDeletion={deletePropertyRegistry}
                />

                {showAuctionNotice ? (
                  <DocumentUpload
                    label="Edital do leilão"
                    description="PDF do edital do leilão"
                    inputRef={auctionNoticeRef}
                    selectedFileName={auctionNoticeFile?.name ?? null}
                    existingFileName={props.existingDocuments?.auctionNoticeFileName ?? null}
                    onFileSelect={(file) => {
                      setAuctionNoticeFile(file)
                      if (file) setDeleteAuctionNotice(false)
                    }}
                    onDelete={() => {
                      if (deleteAuctionNotice) {
                        setDeleteAuctionNotice(false)
                      } else {
                        setAuctionNoticeFile(null)
                        if (auctionNoticeRef.current) auctionNoticeRef.current.value = ""
                        if (props.existingDocuments?.auctionNoticeFileName) {
                          setDeleteAuctionNotice(true)
                        }
                      }
                    }}
                    markedForDeletion={deleteAuctionNotice}
                  />
                ) : (
                  <div className="rounded-xl border border-dashed border-[#141B29] bg-[#05060B]/50 p-3">
                    <div className="flex items-center gap-3 text-[#7C889E]">
                      <FileText className="h-4 w-4" />
                      <div className="text-xs">Preencha comissão do leiloeiro para habilitar edital</div>
                    </div>
                  </div>
                )}
              </div>
            </SectionCard>

            <SectionCard title="Forma de Pagamento">
              <div className="space-y-4">
                {/* Seleção de tipo de pagamento */}
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setValue("paymentType", "cash", { shouldValidate: true })
                    }}
                    className={`px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                      paymentType === "cash"
                        ? "bg-[#4F7DFF] border-[#4F7DFF] text-white"
                        : "bg-[#05060B] border-[#141B29] text-[#9AA6BC] hover:bg-[#0B0F17]"
                    }`}
                  >
                    À Vista
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setValue("paymentType", "installment", { shouldValidate: true })
                    }}
                    className={`px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                      paymentType === "installment"
                        ? "bg-[#4F7DFF] border-[#4F7DFF] text-white"
                        : "bg-[#05060B] border-[#141B29] text-[#9AA6BC] hover:bg-[#0B0F17]"
                    }`}
                  >
                    Parcelamento
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setValue("paymentType", "financing", { shouldValidate: true })
                    }}
                    className={`px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                      paymentType === "financing"
                        ? "bg-[#4F7DFF] border-[#4F7DFF] text-white"
                        : "bg-[#05060B] border-[#141B29] text-[#9AA6BC] hover:bg-[#0B0F17]"
                    }`}
                  >
                    Financiamento
                  </button>
                </div>

                {/* Campos de Parcelamento */}
                {paymentType === "installment" && (
                  <div className="rounded-xl border border-[#141B29] bg-[#05060B] p-3 space-y-3">
                    <div className="text-sm font-medium text-white mb-2">Parcelamento</div>
                    <Controller
                      name="installment.installmentsCount"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          label="Número de parcelas"
                          name="installmentsCount"
                          required
                          value={field.value}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          error={errors.installment?.installmentsCount?.message as string | undefined}
                          placeholder="12"
                        />
                      )}
                    />
                    <div className="text-xs text-[#7C889E] mt-2">
                      O valor restante (após entrada) será dividido em parcelas iguais sem juros.
                    </div>
                  </div>
                )}

                {/* Campos de Financiamento */}
                {paymentType === "financing" && (
                  <div className="rounded-xl border border-[#141B29] bg-[#05060B] p-3 space-y-3">
                    <div className="text-sm font-medium text-white mb-2">Financiamento</div>

                    <div className="grid grid-cols-3 gap-3">
                      <Controller
                        name="financing.interestRateAnnual"
                        control={control}
                        render={({ field }) => (
                          <PercentField
                            label="Juros a.a."
                            name="interestRateAnnual"
                            required
                            value={field.value}
                            onChange={field.onChange}
                            onBlur={field.onBlur}
                            error={errors.financing?.interestRateAnnual?.message as string | undefined}
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
                            required
                            value={field.value}
                            onChange={field.onChange}
                            onBlur={field.onBlur}
                            error={errors.financing?.termMonths?.message as string | undefined}
                            placeholder="360"
                          />
                        )}
                      />
                      <Controller
                        name="financing.amortizationType"
                        control={control}
                        render={({ field }) => (
                          <div>
                            <label className="text-sm text-[#9AA6BC]">Amortização</label>
                            <select
                              value={field.value}
                              onChange={field.onChange}
                              onBlur={field.onBlur}
                              className="h-10 w-full rounded-md bg-[#05060B] border border-[#141B29] px-3 text-sm text-white outline-none focus:border-[#2D5BFF]"
                            >
                              <option value="PRICE">PRICE</option>
                              <option value="SAC">SAC</option>
                            </select>
                            {errors.financing?.amortizationType?.message && (
                              <div className="mt-1 text-xs text-rose-400">{String(errors.financing.amortizationType.message)}</div>
                            )}
                          </div>
                        )}
                      />
                    </div>
                  </div>
                )}

                {/* Mensagem para à vista */}
                {paymentType === "cash" && (
                  <div className="rounded-xl border border-[#141B29] bg-[#05060B] p-3">
                    <div className="text-sm text-[#7C889E]">
                      Pagamento à vista. O valor total será pago no momento da compra.
                    </div>
                  </div>
                )}
              </div>
            </SectionCard>
          </div>

          {/* Dívidas e Reforma */}
          <SectionCard title="Custos adicionais">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
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
                  />
                )}
              />
              <Controller
                name="renovation.costs"
                control={control}
                render={({ field }) => (
                  <MoneyField
                    label="Custo de reforma"
                    name="renovationCosts"
                    required
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    error={errors.renovation?.costs?.message as string | undefined}
                  />
                )}
              />
            </div>
          </SectionCard>

          {/* Operação e saída */}
          <SectionCard title="Operação e saída">
            <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
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
                    className="col-span-2 md:col-span-2"
                  />
                )}
              />
              <Controller
                name="operationAndExit.resaleDiscountPercent"
                control={control}
                render={({ field }) => (
                  <PercentField
                    label="Desconto (%)"
                    name="resaleDiscountPercent"
                    required
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    error={errors.operationAndExit?.resaleDiscountPercent?.message as string | undefined}
                  />
                )}
              />
              <Controller
                name="operationAndExit.brokerFeePercent"
                control={control}
                render={({ field }) => (
                  <PercentField
                    label="Corretor (%)"
                    name="brokerFeePercent"
                    required
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    error={errors.operationAndExit?.brokerFeePercent?.message as string | undefined}
                  />
                )}
              />
              <Controller
                name="operationAndExit.expectedSaleMonths"
                control={control}
                render={({ field }) => (
                  <TextField
                    label="Prazo (meses)"
                    name="expectedSaleMonths"
                    required
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    error={errors.operationAndExit?.expectedSaleMonths?.message as string | undefined}
                    placeholder="12"
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
