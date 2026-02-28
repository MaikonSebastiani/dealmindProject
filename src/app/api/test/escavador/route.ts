/**
 * Rota de teste para validar a API do Escavador
 * 
 * Permite testar a integração sem usar créditos reais
 * Use apenas em desenvolvimento
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { EscavadorV2Provider } from '@/lib/due-diligence/providers/escavador-v2'

export async function GET(req: NextRequest) {
  // Apenas em desenvolvimento
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Esta rota está disponível apenas em desenvolvimento' },
      { status: 403 }
    )
  }

  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  const apiKey = process.env.ESCAVADOR_API_KEY
  if (!apiKey) {
    return NextResponse.json({
      success: false,
      message: 'ESCAVADOR_API_KEY não configurada no .env',
      instructions: [
        '1. Acesse https://www.escavador.com/ e crie uma conta',
        '2. Vá para o painel da API e gere um token',
        '3. Adicione ESCAVADOR_API_KEY="seu-token" no arquivo .env',
        '4. Reinicie o servidor',
      ],
    })
  }

  const { searchParams } = new URL(req.url)
  const testType = searchParams.get('type') || 'status'
  const numeroCNJ = searchParams.get('cnj') || '0018063-19.2013.8.26.0002' // Exemplo da documentação
  const cpf = searchParams.get('cpf')
  const name = searchParams.get('name')

  const provider = new EscavadorV2Provider(apiKey)

  try {
    switch (testType) {
      case 'status': {
        const status = await provider.getProcessStatus(numeroCNJ)
        return NextResponse.json({
          success: true,
          test: 'Status de atualização',
          input: { numeroCNJ },
          result: status,
        })
      }

      case 'search-cnj': {
        const processo = await provider.searchByCNJ(numeroCNJ)
        return NextResponse.json({
          success: true,
          test: 'Busca por número CNJ',
          input: { numeroCNJ },
          result: processo,
        })
      }

      case 'search-cpf': {
        if (!cpf) {
          return NextResponse.json({
            success: false,
            error: 'Parâmetro "cpf" é obrigatório para este teste',
          }, { status: 400 })
        }
        const processos = await provider.searchByCPF(cpf)
        
        const response: any = {
          success: true,
          test: 'Busca por CPF',
          input: { cpf: cpf.substring(0, 3) + '***' }, // Não expor CPF completo
          result: {
            total: processos.length,
            processos: processos.slice(0, 5), // Limita a 5 para não sobrecarregar
          },
        }

        // Adicionar informações sobre limitações se não encontrou resultados
        if (processos.length === 0) {
          response.warnings = [
            'Nenhum processo encontrado para este CPF.',
            'Possíveis razões:',
            '- CPF não está indexado no banco do Escavador',
            '- Processos existem no TJSP mas não foram indexados pelo Escavador',
            '- Atraso na indexação de processos recentes',
            '- Cobertura incompleta do Escavador (não cobre 100% dos tribunais)',
          ]
          response.suggestions = [
            'Tente buscar pelo nome da pessoa usando o parâmetro "name" na busca completa',
            'Verifique diretamente no site do tribunal se há processos',
            'O Escavador pode ter limitações de cobertura dependendo do tribunal',
          ]
        }

        return NextResponse.json(response)
      }

      case 'search-complete': {
        const processos = await provider.searchComplete(cpf || undefined, name || undefined)
        
        const response: any = {
          success: true,
          test: 'Busca completa (CPF com fallback para nome)',
          input: {
            cpf: cpf ? cpf.substring(0, 3) + '***' : 'não fornecido',
            name: name || 'não fornecido',
          },
          result: {
            total: processos.length,
            processos: processos.slice(0, 5), // Limita a 5 para não sobrecarregar
          },
        }

        if (processos.length === 0) {
          response.warnings = [
            'Nenhum processo encontrado.',
            'A busca tentou primeiro por CPF, depois por nome (se fornecido).',
          ]
          if (!cpf && !name) {
            response.error = 'É necessário fornecer pelo menos CPF ou nome para busca completa'
          }
        }

        return NextResponse.json(response)
      }

      default:
        return NextResponse.json({
          success: false,
          error: 'Tipo de teste inválido',
          availableTypes: ['status', 'search-cnj', 'search-cpf', 'search-complete'],
        }, { status: 400 })
    }
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      details: process.env.NODE_ENV === 'development' 
        ? (error instanceof Error ? error.stack : undefined)
        : undefined,
    }, { status: 500 })
  }
}

