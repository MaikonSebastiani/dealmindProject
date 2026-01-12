export function calculateMonthlyCashFlow(input: {
  monthlyRent: number;
  monthlyExpenses: number;
  annualPropertyTax: number;
  financingMonthlyInstallment: number;
}): number {
  return (
    input.monthlyRent -
    input.monthlyExpenses -
    input.annualPropertyTax / 12 -
    input.financingMonthlyInstallment
  );
}

