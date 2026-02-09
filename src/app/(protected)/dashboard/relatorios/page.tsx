import { FileText, BarChart3, TrendingUp, Calendar } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ExportButton } from "./components/ExportButton"

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
        {/* Card Principal */}
        <Card className="bg-[#0B0F17] border-[#141B29]">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">Relatório de Portfólio</CardTitle>
                <p className="text-sm text-[#7C889E] mt-1">Análise completa do seu portfólio imobiliário</p>
              </div>
              <ExportButton reportType="portfolio" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">

              {/* Informações do relatório */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card className="bg-[#05060B] border-[#141B29]">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-[#4F7DFF]/10">
                          <TrendingUp className="h-5 w-5 text-[#4F7DFF]" />
                        </div>
                        <div>
                          <div className="text-xs text-[#7C889E]">ROI Médio</div>
                          <div className="text-lg font-semibold text-white">Calculado no PDF</div>
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
                          <div className="text-lg font-semibold text-white">Incluído no PDF</div>
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
                          <div className="text-xs text-[#7C889E]">Imóveis</div>
                          <div className="text-lg font-semibold text-white">Todos os deals</div>
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
                          <div className="text-lg font-semibold text-white">Contexto geral</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Descrição */}
                <div className="rounded-lg bg-[#05060B] border border-[#141B29] p-4">
                  <p className="text-sm text-[#7C889E]">
                    O relatório PDF inclui uma análise completa do seu portfólio, incluindo:
                  </p>
                  <ul className="mt-3 space-y-2 text-sm text-[#7C889E] list-disc list-inside">
                    <li>Métricas de visão geral (Pipeline, Portfólio Ativo, Alugados, Vendidos)</li>
                    <li>Análise de rentabilidade (anualizada e total)</li>
                    <li>Tabela detalhada com todos os imóveis e suas métricas</li>
                    <li>Dados atualizados no momento da geração</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}

