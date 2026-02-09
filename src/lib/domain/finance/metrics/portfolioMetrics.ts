/**
 * Compara ROI médio com CDI/Selic
 * ROI no projeto é calculado como: annualCashFlow / initialInvestment
 * Então já está em formato anual (ex: 0.12 = 12% a.a.)
 */
export function compareROIWithCDI(averageROI: number, cdiAnnual: number = 0.1215) {
  // ROI já está em formato decimal anual (ex: 0.12 = 12% a.a.)
  // CDI também está em formato decimal (0.1215 = 12.15% a.a.)
  const roiAnnual = averageROI
  
  const difference = roiAnnual - cdiAnnual
  
  return {
    isAboveCDI: difference > 0,
    differencePercent: Math.abs(difference) * 100,
    cdiAnnual,
    roiAnnual,
  }
}

