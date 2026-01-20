"use client"

import {
  Scale,
  Shield,
  ShieldCheck,
  FileSearch,
  AlertTriangle,
  Lock,
  Sparkles,
} from "lucide-react"

// Componente de Preview Bloqueado - Feature em Desenvolvimento
export function DueDiligenceCard() {
  return (
    <div className="relative rounded-xl border border-[#141B29] bg-[#0B0F17] overflow-hidden">
      {/* Conteúdo fake (blurred) */}
      <div className="p-4 blur-[2px] opacity-50 pointer-events-none select-none">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-8 w-8 text-emerald-400" />
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-white">15%</span>
                  <span className="text-sm font-medium text-emerald-400">
                    Baixo Risco
                  </span>
                </div>
                <div className="text-xs text-[#9AA6BC]">
                  3 processos • Recomendação: Prosseguir
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Cards de preview */}
        <div className="grid grid-cols-3 gap-3 mt-4">
          <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-3">
            <ShieldCheck className="h-5 w-5 text-emerald-400 mb-2" />
            <div className="text-xs text-emerald-400">Score de Risco</div>
            <div className="text-lg font-bold text-white">Baixo</div>
          </div>
          <div className="rounded-lg bg-[#05060B] border border-[#141B29] p-3">
            <FileSearch className="h-5 w-5 text-blue-400 mb-2" />
            <div className="text-xs text-[#7C889E]">Processos</div>
            <div className="text-lg font-bold text-white">3</div>
          </div>
          <div className="rounded-lg bg-[#05060B] border border-[#141B29] p-3">
            <Scale className="h-5 w-5 text-amber-400 mb-2" />
            <div className="text-xs text-[#7C889E]">Tribunais</div>
            <div className="text-lg font-bold text-white">TJ-SP, TRF-3</div>
          </div>
        </div>

        {/* Lista de items fake */}
        <div className="mt-4 space-y-2">
          <div className="flex items-center gap-2 p-2 rounded-lg bg-[#05060B] border border-[#141B29]">
            <AlertTriangle className="h-4 w-4 text-amber-400" />
            <div className="text-xs text-[#9AA6BC]">Análise de dívidas trabalhistas</div>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-lg bg-[#05060B] border border-[#141B29]">
            <Shield className="h-4 w-4 text-blue-400" />
            <div className="text-xs text-[#9AA6BC]">Busca em cartórios de protesto</div>
          </div>
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
            <Scale className="h-10 w-10 text-[#4F7DFF]" />
          </div>
          <div className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-[#0B0F17] border border-[#141B29]">
            <Lock className="h-4 w-4 text-[#7C889E]" />
          </div>
        </div>

        {/* Título e descrição */}
        <h3 className="text-lg font-semibold text-white mb-2">
          Apuração Jurídica Em Desenvolvimento
        </h3>
        <p className="text-sm text-[#7C889E] text-center max-w-sm px-4 leading-relaxed">
          Análise automática de riscos jurídicos do devedor com busca em tribunais, 
          cartórios de protesto e análise de processos por IA.
        </p>

        {/* Features que virão */}
        <div className="flex flex-wrap justify-center gap-2 mt-4 px-4">
          {["Busca Nacional", "Score de Risco", "Análise IA", "Relatório PDF"].map((feature) => (
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
  )
}
