# Teste de Validação - Cálculo de Parcelamento no ROI

## Cenário de Teste

### Dados de Entrada
- **Preço de compra**: R$ 100.000,00
- **Entrada**: 20% = R$ 20.000,00
- **Valor restante**: R$ 80.000,00
- **Parcelamento**: 12 parcelas
- **Parcela mensal**: R$ 80.000 / 12 = R$ 6.666,67
- **Venda em**: 6 meses
- **Preço de venda**: R$ 120.000,00
- **Desconto na venda**: 5% = R$ 6.000,00
- **Comissão corretor**: 6% sobre R$ 114.000 = R$ 6.840,00
- **Custos iniciais**: R$ 5.000,00 (ITBI, registro, etc)
- **Custos operacionais**: R$ 500/mês (condomínio + IPTU)

### Cálculo Esperado

1. **Investimento Inicial**
   - Entrada: R$ 20.000,00
   - Custos iniciais: R$ 5.000,00
   - **Total**: R$ 25.000,00

2. **Parcelas Pagas até a Venda (6 meses)**
   - Parcela mensal: R$ 6.666,67
   - Parcelas pagas: 6 × R$ 6.666,67 = **R$ 40.000,00**

3. **Saldo Devedor na Venda**
   - Valor restante: R$ 80.000,00
   - Parcelas pagas: R$ 40.000,00
   - **Saldo devedor**: R$ 80.000 - R$ 40.000 = **R$ 40.000,00**

4. **Custos Operacionais**
   - R$ 500/mês × 6 meses = **R$ 3.000,00**

5. **Total de Saída (Cash Outflow)**
   - Investimento inicial: R$ 25.000,00
   - Custos operacionais: R$ 3.000,00
   - Parcelas pagas: R$ 40.000,00
   - **Total**: R$ 68.000,00

6. **Venda Líquida**
   - Preço de venda: R$ 120.000,00
   - Desconto: R$ 6.000,00
   - Valor após desconto: R$ 114.000,00
   - Comissão corretor: R$ 6.840,00
   - **Venda líquida**: R$ 107.160,00

7. **Venda Líquida Após Quitar Saldo**
   - Venda líquida: R$ 107.160,00
   - Saldo devedor: R$ 40.000,00
   - **Total recebido**: R$ 107.160 - R$ 40.000 = **R$ 67.160,00**

8. **Lucro**
   - Entrada na venda: R$ 67.160,00
   - Total de saída: R$ 68.000,00
   - **Lucro**: R$ 67.160 - R$ 68.000 = **-R$ 840,00** (prejuízo)

9. **ROI**
   - ROI Total: -R$ 840 / R$ 68.000 = **-1,24%**
   - ROI Anualizado: [(1 + (-0.0124))^(12/6)] - 1 = **-2,47%**

## Validação do Código

O código deve calcular:
- ✅ `remainingAmount` = R$ 80.000
- ✅ `monthlyInstallment` = R$ 6.666,67
- ✅ `principalPaidUntilSale` = R$ 40.000 (6 parcelas)
- ✅ `remainingBalanceAtSale` = R$ 40.000
- ✅ `totalOutflow` = R$ 68.000
- ✅ `saleNetAfterLoan` = R$ 67.160
- ✅ `profit` = -R$ 840
- ✅ `roiTotal` = -1,24%

## Casos Edge a Verificar

1. **Venda antes de completar todas as parcelas** (k < termMonths) ✅ Tratado
2. **Venda após completar todas as parcelas** (k = termMonths) ✅ Tratado
3. **Venda imediata** (k = 0) ✅ Tratado
4. **Parcelamento com valor exato** (sem arredondamentos) ✅ Tratado

