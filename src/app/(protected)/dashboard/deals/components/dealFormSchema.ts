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

export const dealFormSchema = z
  .object({
    propertyType: z.enum(propertyTypes, {
      required_error: "Selecione o tipo de imóvel",
      invalid_type_error: "Tipo de imóvel inválido",
    }),
    acquisition: z.object({
      purchasePrice: moneyRequiredPositive,
      downPaymentPercent: percentRequired,
      auctioneerFeePercent: percentOptional,
      itbiPercent: percentRequired,
      registryCost: moneyNonNegative,
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
    if (!data.financing.enabled) return

    const interest = Number(data.financing.interestRateAnnual.replace(",", "."))
    if (!Number.isFinite(interest) || interest <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Obrigatório quando financiamento está habilitado",
        path: ["financing", "interestRateAnnual"],
      })
    }
  })

export type DealFormValues = z.infer<typeof dealFormSchema>


