import { FileText, BarChart3, TrendingUp, Download, Calendar, Lock, Sparkles } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function RelatoriosPage() {
  return (
    <>
      <header className="bg-[#05060B] border-b border-[#141B29]">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-4 sm:px-6 lg:px-10 py-4 sm:py-5">
          <div className="space-y-1 min-w-0 flex-1">
            <h1 className="text-lg sm:text-xl font-semibold">Relatórios</h1>
            <p className="text-xs sm:text-sm text-[#7C889E]">Análises e relatórios do seu portfólio</p>
          </div>
        </div>
      </header>

      <div className="px-4 sm:px-6 lg:px-10 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {/* Card Principal com Overlay */}
        <div className="relative rounded-xl border border-[#141B29] bg-[#0B0F17] overflow-hidden">
          {/* Conteúdo fake (blurred) */}
          <div className="p-6 blur-[2px] opacity-50 pointer-events-none select-none">
            <div className="space-y-6">
              {/* Header fake */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-white">Relatório de Portfólio</h2>
                  <p className="text-sm text-[#7C889E] mt-1">Análise completa do seu portfólio imobiliário</p>
                </div>
                <button className="px-4 py-2 rounded-lg bg-[#4F7DFF] text-white text-sm font-medium flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  Exportar PDF
                </button>
              </div>

              {/* Cards de métricas fake */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-[#05060B] border-[#141B29]">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-[#4F7DFF]/10">
                        <TrendingUp className="h-5 w-5 text-[#4F7DFF]" />
                      </div>
                      <div>
                        <div className="text-xs text-[#7C889E]">ROI Médio</div>
                        <div className="text-lg font-semibold text-white">18.5%</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-[#05060B] border-[#141B29]">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-emerald-500/10">
                        <BarChart3 className="h-5 w-5 text-emerald-400" />
                      </div>
                      <div>
                        <div className="text-xs text-[#7C889E]">Total Investido</div>
                        <div className="text-lg font-semibold text-white">R$ 2.450.000</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-[#05060B] border-[#141B29]">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-amber-500/10">
                        <FileText className="h-5 w-5 text-amber-400" />
                      </div>
                      <div>
                        <div className="text-xs text-[#7C889E]">Imóveis Ativos</div>
                        <div className="text-lg font-semibold text-white">12</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-[#05060B] border-[#141B29]">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-blue-500/10">
                        <Calendar className="h-5 w-5 text-blue-400" />
                      </div>
                      <div>
                        <div className="text-xs text-[#7C889E]">Período</div>
                        <div className="text-lg font-semibold text-white">Últimos 12 meses</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Gráficos fake */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card className="bg-[#05060B] border-[#141B29]">
                  <CardHeader>
                    <CardTitle className="text-sm">Evolução do Patrimônio</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-48 rounded-lg bg-[#0B0F17] border border-[#141B29] flex items-center justify-center">
                      <span className="text-xs text-[#7C889E]">Gráfico de linha</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-[#05060B] border-[#141B29]">
                  <CardHeader>
                    <CardTitle className="text-sm">Distribuição por Tipo</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-48 rounded-lg bg-[#0B0F17] border border-[#141B29] flex items-center justify-center">
                      <span className="text-xs text-[#7C889E]">Gráfico de pizza</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Tabela fake */}
              <Card className="bg-[#05060B] border-[#141B29]">
                <CardHeader>
                  <CardTitle className="text-sm">Detalhamento por Imóvel</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-[#0B0F17] border border-[#141B29]">
                        <div>
                          <div className="text-sm text-white">Apartamento {i}</div>
                          <div className="text-xs text-[#7C889E]">R$ 450.000 • ROI: 15.2%</div>
                        </div>
                        <div className="text-sm text-emerald-400 font-medium">+R$ 68.400</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Overlay */}
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-t from-[#0B0F17] via-[#0B0F17]/95 to-[#0B0F17]/80">
            {/* Badge */}
            <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-[#2D5BFF]/40 bg-[#2D5BFF]/10 mb-4">
              <Sparkles className="h-4 w-4 text-[#4F7DFF]" />
              <span className="text-sm font-medium text-[#4F7DFF]">Em Desenvolvimento</span>
            </div>

            {/* Ícone central */}
            <div className="relative mb-4">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-[#2D5BFF]/20 to-[#4F7DFF]/10 border border-[#2D5BFF]/30">
                <FileText className="h-10 w-10 text-[#4F7DFF]" />
              </div>
              <div className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-[#0B0F17] border border-[#141B29]">
                <Lock className="h-4 w-4 text-[#7C889E]" />
              </div>
            </div>

            {/* Título e descrição */}
            <h3 className="text-lg font-semibold text-white mb-2">
              Relatórios Avançados
            </h3>
            <p className="text-sm text-[#7C889E] text-center max-w-sm px-4 leading-relaxed">
              Gere relatórios detalhados do seu portfólio com análises de performance, 
              rentabilidade e projeções futuras.
            </p>

            {/* Features que virão */}
            <div className="flex flex-wrap justify-center gap-2 mt-4 px-4">
              {["Exportação PDF", "Gráficos Interativos", "Análise Comparativa", "Projeções"].map((feature) => (
                <span
                  key={feature}
                  className="inline-flex items-center px-2.5 py-1 rounded-full text-xs bg-[#141B29] text-[#9AA6BC] border border-[#1D2536]"
                >
                  {feature}
                </span>
              ))}
            </div>

            {/* CTA */}
            <button
              disabled
              className="mt-6 px-6 py-2.5 rounded-lg bg-[#141B29] border border-[#1D2536] text-[#7C889E] text-sm font-medium cursor-not-allowed flex items-center gap-2"
            >
              <Lock className="h-4 w-4" />
              Em breve disponível
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

