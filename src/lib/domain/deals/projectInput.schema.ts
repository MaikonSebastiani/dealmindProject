import { z } from "zod"
import { parsePtBRMoneyToNumber } from "@/lib/money"
import type { ProjectInput } from "./projectInput"

const money = z
  .string()
  .trim()
  .default("0")
  .transform((v) => parsePtBRMoneyToNumber(v))
  .refine((v) => Number.isFinite(v) && v >= 0, "Valor inválido")

const moneyRequiredPositive = z
  .string()
  .trim()
  .min(1, "Obrigatório")
  .transform((v) => parsePtBRMoneyToNumber(v))
  .refine((v) => Number.isFinite(v) && v > 0, "Informe um valor maior que zero")

const percent = z
  .string()
  .trim()
  .default("0")
  .transform((v) => Number(v.replace(",", ".")))
  .refine((v) => Number.isFinite(v) && v >= 0, "Percentual inválido")

const percentOptional = z
  .string()
  .trim()
  .default("")
  .transform((v) => (v === "" ? undefined : Number(v.replace(",", "."))))
  .refine((v) => v === undefined || (Number.isFinite(v) && v >= 0), "Percentual inválido")

const intPositive = z
  .string()
  .trim()
  .min(1, "Obrigatório")
  .transform((v) => Number(v))
  .refine((v) => Number.isInteger(v) && v > 0, "Informe um número inteiro maior que zero")

export const propertyTypes = ["Apartamento", "Casa", "Comercial", "Lote"] as const

export const projectInputFormSchema = z.object({
  propertyType: z.enum(propertyTypes),
  acquisition: z.object({
    purchasePrice: moneyRequiredPositive,
    downPaymentPercent: percent,
    auctioneerFeePercent: percentOptional,
    itbiPercent: percent,
    registryCost: money,
  }),
  financing: z.object({
    enabled: z.boolean(),
    interestRateAnnual: percent,
    termMonths: intPositive,
    amortizationType: z.enum(["PRICE", "SAC"]),
  }),
  liabilities: z.object({
    iptuDebt: money,
    condoDebt: money,
  }),
  operationAndExit: z.object({
    resalePrice: moneyRequiredPositive,
    resaleDiscountPercent: percent,
    brokerFeePercent: percent,
    monthlyCondoFee: money,
    monthlyIptu: money,
    expectedSaleMonths: intPositive,
  }),
})

export type ProjectInputFromForm = z.infer<typeof projectInputFormSchema>

export function toProjectInput(form: ProjectInputFromForm): ProjectInput {
  const financing = form.financing.enabled
    ? {
        enabled: true,
        interestRateAnnual: form.financing.interestRateAnnual,
        termMonths: form.financing.termMonths,
        amortizationType: form.financing.amortizationType,
      }
    : undefined

  return {
    acquisition: {
      purchasePrice: form.acquisition.purchasePrice,
      downPaymentPercent: form.acquisition.downPaymentPercent,
      auctioneerFeePercent: form.acquisition.auctioneerFeePercent,
      itbiPercent: form.acquisition.itbiPercent,
      registryCost: form.acquisition.registryCost,
    },
    financing,
    liabilities: {
      iptuDebt: form.liabilities.iptuDebt,
      condoDebt: form.liabilities.condoDebt,
    },
    operationAndExit: {
      resalePrice: form.operationAndExit.resalePrice,
      resaleDiscountPercent: form.operationAndExit.resaleDiscountPercent,
      brokerFeePercent: form.operationAndExit.brokerFeePercent,
      monthlyCondoFee: form.operationAndExit.monthlyCondoFee,
      monthlyIptu: form.operationAndExit.monthlyIptu,
      expectedSaleMonths: form.operationAndExit.expectedSaleMonths,
    },
  }
}

export const projectInputApiSchema = z.object({
  acquisition: z.object({
    purchasePrice: z.number().positive(),
    downPaymentPercent: z.number().min(0),
    auctioneerFeePercent: z.number().min(0).optional(),
    itbiPercent: z.number().min(0),
    registryCost: z.number().min(0),
  }),
  financing: z
    .object({
      enabled: z.boolean(),
      interestRateAnnual: z.number().min(0),
      termMonths: z.number().int().positive(),
      amortizationType: z.enum(["PRICE", "SAC"]),
    })
    .optional(),
  liabilities: z.object({
    iptuDebt: z.number().min(0),
    condoDebt: z.number().min(0),
  }),
  operationAndExit: z.object({
    resalePrice: z.number().positive(),
    resaleDiscountPercent: z.number().min(0),
    brokerFeePercent: z.number().min(0),
    monthlyCondoFee: z.number().min(0),
    monthlyIptu: z.number().min(0),
    expectedSaleMonths: z.number().int().positive(),
  }),
})

export type ProjectInputFromApi = z.infer<typeof projectInputApiSchema>

export function toProjectInputFromApi(api: ProjectInputFromApi): ProjectInput {
  const financing =
    api.financing && api.financing.enabled
      ? {
          enabled: true,
          interestRateAnnual: api.financing.interestRateAnnual,
          termMonths: api.financing.termMonths,
          amortizationType: api.financing.amortizationType,
        }
      : undefined

  return {
    acquisition: {
      purchasePrice: api.acquisition.purchasePrice,
      downPaymentPercent: api.acquisition.downPaymentPercent,
      auctioneerFeePercent: api.acquisition.auctioneerFeePercent,
      itbiPercent: api.acquisition.itbiPercent,
      registryCost: api.acquisition.registryCost,
    },
    financing,
    liabilities: {
      iptuDebt: api.liabilities.iptuDebt,
      condoDebt: api.liabilities.condoDebt,
    },
    operationAndExit: {
      resalePrice: api.operationAndExit.resalePrice,
      resaleDiscountPercent: api.operationAndExit.resaleDiscountPercent,
      brokerFeePercent: api.operationAndExit.brokerFeePercent,
      monthlyCondoFee: api.operationAndExit.monthlyCondoFee,
      monthlyIptu: api.operationAndExit.monthlyIptu,
      expectedSaleMonths: api.operationAndExit.expectedSaleMonths,
    },
  }
}


