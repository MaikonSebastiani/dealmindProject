import { describe, it, expect } from 'vitest'
import { evaluateDealRisk } from '../riskEvaluator'

describe('Deal Risk Evaluation', () => {
  it('flags negative cash flow as high risk', () => {
    const risk = evaluateDealRisk({
      monthlyCashFlow: -300,
      roi: 0.15,
      leverageRatio: 0.5,
    })

    expect(risk.negativeCashFlow).toBe(true)
  })

  it('flags low ROI as risk', () => {
    const risk = evaluateDealRisk({
      monthlyCashFlow: 500,
      roi: 0.03,
      leverageRatio: 0.4,
    })

    expect(risk.lowROI).toBe(true)
  })

  it('flags high leverage as risk', () => {
    const risk = evaluateDealRisk({
      monthlyCashFlow: 800,
      roi: 0.12,
      leverageRatio: 0.85,
    })

    expect(risk.highLeverage).toBe(true)
  })
})
