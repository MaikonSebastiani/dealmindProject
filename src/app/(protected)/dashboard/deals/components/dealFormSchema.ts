import { z } from "zod"
import { parsePtBRMoneyToNumber } from "@/lib/money"

const moneyRequiredPositive = z
  .string()
  .trim()
  .min(1, "Obrigatório")
  .refine((v) => parsePtBRMoneyToNumber(v) > 0, "Informe um valor maior que zero")

const moneyNonNegative = z
  .string()
  .trim()
  .min(1, "Obrigatório")
  .refine((v) => parsePtBRMoneyToNumber(v) >= 0, "Informe um valor válido")

const moneyOptional = z
  .string()
  .trim()
  .optional()
  .refine((v) => !v || parsePtBRMoneyToNumber(v) >= 0, "Informe um valor válido")

const percentRequired = z
  .string()
  .trim()
  .min(1, "Obrigatório")
  .refine((v) => {
    const n = Number(v.replace(",", "."))
    return Number.isFinite(n) && n >= 0
  }, "Percentual inválido")

const percentOptional = z
  .string()
  .trim()
  .optional()
  .refine((v) => {
    if (!v) return true
    const n = Number(v.replace(",", "."))
    return Number.isFinite(n) && n >= 0
  }, "Percentual inválido")

const intPositive = z
  .string()
  .trim()
  .min(1, "Obrigatório")
  .refine((v) => {
    const n = Number(v)
    return Number.isInteger(n) && n > 0
  }, "Informe um número inteiro maior que zero")

export const propertyTypes = ["Apartamento", "Casa", "Comercial", "Lote"] as const
export type PropertyType = (typeof propertyTypes)[number]

export const paymentTypes = ["cash", "installment", "financing"] as const
export type PaymentType = (typeof paymentTypes)[number]

export const dealFormSchema = z
  .object({
    propertyName: z.string().trim().min(1, "Informe o nome do imóvel"),
    address: z.string().trim().optional(),
    propertyLink: z
      .string()
      .trim()
      .optional()
      .refine((v) => !v || v === "" || /^https?:\/\//.test(v), "Informe uma URL válida (http ou https)"),
    propertyType: z.enum(propertyTypes, {
      required_error: "Selecione o tipo de imóvel",
      invalid_type_error: "Tipo de imóvel inválido",
    }),
    acquisition: z.object({
      purchasePrice: moneyRequiredPositive,
      downPaymentPercent: percentRequired,
      auctioneerFeePercent: percentOptional,
      advisoryFeePercent: percentOptional,  // Porcentagem de assessoria sobre valor de compra
      itbiPercent: percentRequired,
      registryCost: moneyNonNegative,
      expectedRoiPercent: percentOptional,  // ROI esperado sobre investimento (%); base para viável ou não
    }),
    paymentType: z.enum(paymentTypes, {
      required_error: "Selecione o tipo de pagamento",
    }),
    installment: z.object({
      installmentsCount: intPositive,
    }),
    financing: z.object({
      enabled: z.boolean(),
      interestRateAnnual: percentRequired,
      termMonths: intPositive,
      amortizationType: z.enum(["PRICE", "SAC"]),
    }),
    liabilities: z.object({
      iptuDebt: moneyNonNegative,
      condoDebt: moneyNonNegative,
    }),
    renovation: z.object({
      costs: moneyNonNegative,
    }),
    operationAndExit: z.object({
      resalePrice: moneyRequiredPositive,
      resaleDiscountPercent: percentRequired,
      brokerFeePercent: percentRequired,
      monthlyCondoFee: moneyNonNegative,
      monthlyIptu: moneyNonNegative,
      expectedSaleMonths: intPositive,
    }),
  })
  .superRefine((data, ctx) => {
    // Validação para financiamento
    // Quando paymentType é "financing", o financiamento está automaticamente habilitado
    if (data.paymentType === "financing") {
      const interest = Number(data.financing.interestRateAnnual.replace(",", "."))
      if (!Number.isFinite(interest) || interest <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Obrigatório para financiamento",
          path: ["financing", "interestRateAnnual"],
        })
      }
    }

    // Validação para parcelamento
    if (data.paymentType === "installment") {
      const installments = Number(data.installment.installmentsCount)
      if (!Number.isInteger(installments) || installments <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Informe o número de parcelas",
          path: ["installment", "installmentsCount"],
        })
      }
    }
  })

export type DealFormValues = z.infer<typeof dealFormSchema>


