/**
 * Sistema de Logging Estruturado
 * 
 * Fornece logging consistente em todo o projeto com níveis apropriados
 * e formatação estruturada para desenvolvimento e produção.
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  context?: string
  [key: string]: unknown
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development'
  private isProduction = process.env.NODE_ENV === 'production'

  /**
   * Cria uma entrada de log estruturada
   */
  private createLogEntry(
    level: LogLevel,
    message: string,
    meta?: Record<string, unknown>,
    context?: string
  ): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...(context && { context }),
      ...meta,
    }
  }

  /**
   * Output do log baseado no ambiente
   */
  private output(level: LogLevel, entry: LogEntry): void {
    if (this.isDevelopment) {
      // Em desenvolvimento: output colorido e legível
      const colors = {
        debug: '\x1b[36m', // Cyan
        info: '\x1b[32m',  // Green
        warn: '\x1b[33m',  // Yellow
        error: '\x1b[31m', // Red
      }
      const reset = '\x1b[0m'
      const color = colors[level]
      
      const prefix = `${color}[${entry.level.toUpperCase()}]${reset}`
      const contextStr = entry.context ? `[${entry.context}]` : ''
      const timeStr = new Date(entry.timestamp).toLocaleTimeString('pt-BR')
      
      console[level === 'error' ? 'error' : 'log'](
        `${prefix} ${timeStr} ${contextStr} ${entry.message}`,
        entry.context || Object.keys(entry).length > 4 
          ? { ...entry, timestamp: undefined, level: undefined, message: undefined, context: undefined }
          : ''
      )
    } else if (this.isProduction) {
      // Em produção: JSON estruturado (para serviços de log)
      const output = JSON.stringify(entry)
      
      if (level === 'error') {
        console.error(output)
        // TODO: Integrar com Sentry ou serviço de logging
        // if (typeof window === 'undefined') {
        //   Sentry.captureException(new Error(entry.message), { extra: entry })
        // }
      } else {
        console.log(output)
      }
    }
  }

  /**
   * Log de debug - apenas em desenvolvimento
   */
  debug(message: string, meta?: Record<string, unknown>, context?: string): void {
    if (this.isDevelopment) {
      const entry = this.createLogEntry('debug', message, meta, context)
      this.output('debug', entry)
    }
  }

  /**
   * Log informativo
   */
  info(message: string, meta?: Record<string, unknown>, context?: string): void {
    const entry = this.createLogEntry('info', message, meta, context)
    this.output('info', entry)
  }

  /**
   * Log de aviso
   */
  warn(message: string, meta?: Record<string, unknown>, context?: string): void {
    const entry = this.createLogEntry('warn', message, meta, context)
    this.output('warn', entry)
  }

  /**
   * Log de erro
   */
  error(
    message: string,
    error?: Error | unknown,
    meta?: Record<string, unknown>,
    context?: string
  ): void {
    const errorMeta = {
      ...meta,
      ...(error instanceof Error
        ? {
            error: {
              name: error.name,
              message: error.message,
              stack: this.isDevelopment ? error.stack : undefined,
            },
          }
        : error
        ? { error: String(error) }
        : {}),
    }

    const entry = this.createLogEntry('error', message, errorMeta, context)
    this.output('error', entry)
  }

  /**
   * Cria um logger com contexto pré-definido
   */
  withContext(context: string): ContextLogger {
    return new ContextLogger(context, this)
  }
}

/**
 * Logger com contexto pré-definido
 */
class ContextLogger {
  constructor(
    private context: string,
    private parent: Logger
  ) {}

  debug(message: string, meta?: Record<string, unknown>): void {
    this.parent.debug(message, meta, this.context)
  }

  info(message: string, meta?: Record<string, unknown>): void {
    this.parent.info(message, meta, this.context)
  }

  warn(message: string, meta?: Record<string, unknown>): void {
    this.parent.warn(message, meta, this.context)
  }

  error(message: string, error?: Error | unknown, meta?: Record<string, unknown>): void {
    this.parent.error(message, error, meta, this.context)
  }
}

// Exportar instância singleton
export const logger = new Logger()

// Exportar tipos
export type { LogLevel, LogEntry }

