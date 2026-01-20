# Arquitetura de Infraestrutura - Google Cloud Platform

Este documento descreve a arquitetura proposta para deploy do DealMind na Google Cloud Platform, utilizando um ecossistema integrado de serviços gerenciados.

## 📋 Visão Geral

A arquitetura foi projetada para ser:
- **Escalável**: Cresce automaticamente conforme a demanda
- **Econômica**: Custo inicial baixo (~$10-30/mês)
- **Segura**: Gerenciamento centralizado de secrets e permissões
- **Confiável**: Backups automáticos e alta disponibilidade
- **Integrada**: Todos os serviços trabalham em conjunto nativamente

---

## 🏗️ Componentes Principais

### 1. Aplicação Next.js — Cloud Run

**Serviço**: Cloud Run (Serverless Container)

**Descrição**: Hospeda a aplicação Next.js em containers serverless que escalam automaticamente.

**Vantagens**:
- ✅ Escala automaticamente (até zero quando inativo)
- ✅ Paga apenas pelo uso (pay-per-request)
- ✅ Suporta containers Docker
- ✅ HTTPS e domínio customizado incluídos
- ✅ Integração nativa com outros serviços GCP
- ✅ Deploy rápido e simples

**Configuração Sugerida**:
- **CPU**: 1-2 vCPUs
- **Memória**: 512MB-2GB (ajustar conforme uso)
- **Timeout**: 300s (necessário para análises de IA)
- **Concorrência**: 80 requisições por instância
- **Região**: us-central1 ou southamerica-east1 (São Paulo)

---

### 2. Banco de Dados — Cloud SQL (PostgreSQL)

**Serviço**: Cloud SQL for PostgreSQL

**Descrição**: Banco de dados gerenciado com PostgreSQL para substituir SQLite em produção.

**Vantagens**:
- ✅ Totalmente gerenciado (sem necessidade de manutenção)
- ✅ Backups automáticos diários
- ✅ Alta disponibilidade configurável
- ✅ Integração direta com Cloud Run
- ✅ Escalável vertical e horizontalmente
- ✅ SSL/TLS por padrão

**Configuração Sugerida (Inicial)**:
- **Instância**: `db-f1-micro` ou `db-g1-small`
- **Storage**: 20GB SSD (escalável)
- **Backups**: Automáticos diários (retenção 7 dias)
- **Manutenção**: Automática em janela de manutenção
- **Região**: Mesma região do Cloud Run

---

### 3. Armazenamento de Arquivos — Cloud Storage

**Serviço**: Cloud Storage

**Descrição**: Armazena os PDFs de documentos (matrícula e edital) de forma segura e escalável.

**Uso**:
- Armazenar PDFs de documentos (matrícula, edital)
- Substituir armazenamento em Bytes no Prisma (melhor performance)
- URLs assinadas para acesso seguro e temporário

**Configuração**:
- **Bucket**: Privado (não público)
- **Lifecycle Policies**: Arquivar/remover após X dias
- **CORS**: Configurado para permitir acesso do Cloud Run
- **Storage Class**: Standard (acesso frequente)
- **Versionamento**: Habilitado para recuperação

---

### 4. Secrets e Configuração — Secret Manager

**Serviço**: Secret Manager

**Descrição**: Armazena de forma segura todas as credenciais e chaves de API.

**Secrets a Armazenar**:
- `AUTH_SECRET` - Chave secreta do NextAuth
- `GEMINI_API_KEY` - Chave da API do Google Gemini
- `ESCAVADOR_API_KEY` - Chave da API do Escavador
- `GOOGLE_CLIENT_SECRET` - Secret do OAuth Google
- `DATABASE_URL` - String de conexão completa com credenciais

**Vantagens**:
- ✅ Rotação automática de secrets
- ✅ Auditoria completa de acesso
- ✅ Versionamento de secrets
- ✅ Integração nativa com Cloud Run
- ✅ Criptografia em repouso e em trânsito

---

### 5. CI/CD — Cloud Build

**Serviço**: Cloud Build

**Descrição**: Pipeline automatizado de build e deploy.

**Fluxo de CI/CD**:
1. Push no repositório → Trigger automático
2. Build da imagem Docker
3. Push para Container Registry
4. Deploy no Cloud Run
5. Executar migrações do Prisma (se necessário)

**Integração**: GitHub, GitLab ou Bitbucket

**Benefícios**:
- ✅ 120 minutos grátis por mês
- ✅ Builds paralelos
- ✅ Cache de dependências
- ✅ Integração com repositórios Git

---

### 6. Logging e Monitoramento

**Serviços**:
- **Cloud Logging**: Logs estruturados e centralizados
- **Cloud Monitoring**: Métricas, alertas e dashboards
- **Error Reporting**: Detecção automática de erros

**Funcionalidades**:
- Visualização de logs em tempo real
- Alertas configuráveis (email, SMS, Slack)
- Dashboards personalizados
- Rastreamento de performance
- Análise de erros e exceções

---

### 7. Rede e Segurança

**Componentes**:
- **Cloud Load Balancing** (opcional): Distribuição de carga e SSL/TLS
- **VPC** (opcional): Isolamento de rede para maior segurança
- **IAM**: Controle de acesso e permissões granulares
- **Firewall Rules**: Regras de firewall configuráveis

---

## 📊 Arquitetura Visual

```
┌─────────────────┐
│   Usuários      │
└────────┬────────┘
         │ HTTPS
         ▼
┌─────────────────────────────────────┐
│      Cloud Load Balancer (opcional) │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│         Cloud Run                   │
│   ┌─────────────────────────────┐  │
│   │   Next.js Application       │  │
│   │   - SSR/SSG                 │  │
│   │   - API Routes              │  │
│   │   - Server Actions          │  │
│   └─────────────────────────────┘  │
└───────┬───────────────┬─────────────┘
        │               │
        │               │
        ▼               ▼
┌──────────────┐  ┌──────────────┐
│  Cloud SQL   │  │ Cloud Storage│
│ (PostgreSQL) │  │   (PDFs)     │
└──────────────┘  └──────────────┘
        │
        │
        ▼
┌─────────────────────┐
│  Secret Manager     │
│  (API Keys, etc)    │
└─────────────────────┘
```

---

## 💰 Custos Estimados (Inicial)

| Serviço | Custo Mensal Estimado | Observações |
|---------|----------------------|-------------|
| **Cloud Run** | $0-20 | Pay-per-use, gratuito até 2 milhões de requisições |
| **Cloud SQL** (db-f1-micro) | $7-10 | Instância mínima recomendada |
| **Cloud Storage** | $0.02/GB | Primeiros 5GB gratuitos |
| **Secret Manager** | $0.06/secret | Primeiros 6 secrets gratuitos |
| **Cloud Build** | $0 | 120 minutos grátis/mês |
| **Cloud Logging** | $0 | Primeiros 50GB/mês gratuitos |
| **TOTAL** | **~$10-30/mês** | Para uso baixo/médio |

> **Nota**: Custos podem variar conforme o uso real. Google Cloud oferece créditos gratuitos para novos usuários.

---

## 🚀 Passos de Implementação

### Fase 1: Preparar o Projeto

1. **Criar Dockerfile** para containerizar a aplicação Next.js
2. **Migrar Prisma** de SQLite para PostgreSQL
3. **Mover uploads** de Bytes no Prisma para Cloud Storage
4. **Configurar variáveis** de ambiente para usar Secret Manager
5. **Criar scripts** de migração de dados

### Fase 2: Configurar no GCP

1. **Criar projeto** no Google Cloud Console
2. **Habilitar APIs** necessárias:
   - Cloud Run API
   - Cloud SQL Admin API
   - Cloud Storage API
   - Secret Manager API
   - Cloud Build API
3. **Criar instância** Cloud SQL (PostgreSQL)
4. **Criar bucket** no Cloud Storage
5. **Criar secrets** no Secret Manager
6. **Configurar IAM** e permissões

### Fase 3: Deploy

1. **Configurar Cloud Build** com arquivo `cloudbuild.yaml`
2. **Criar trigger** de CI/CD conectado ao repositório
3. **Fazer primeiro deploy** manual ou via trigger
4. **Configurar domínio** customizado (opcional)
5. **Configurar SSL/TLS** (automático com Cloud Run)

---

## 📁 Arquivos Necessários

Para implementar esta arquitetura, serão necessários os seguintes arquivos:

1. **`Dockerfile`** - Container da aplicação Next.js
2. **`.dockerignore`** - Otimizar build excluindo arquivos desnecessários
3. **`cloudbuild.yaml`** - Configuração do pipeline CI/CD
4. **`.gcloudignore`** - Arquivos a ignorar no deploy
5. **Scripts de migração** - Para migrar dados do SQLite para PostgreSQL
6. **Documentação de deploy** - Guia passo a passo

---

## ✅ Vantagens desta Arquitetura

- 🔗 **Integração Nativa**: Todos os serviços trabalham juntos sem configuração complexa
- 📈 **Escalabilidade Automática**: Cresce e diminui conforme a demanda
- 💵 **Custo Eficiente**: Paga apenas pelo que usa, ideal para MVP
- 🔒 **Segurança Gerenciada**: Secrets e permissões centralizados
- 💾 **Backups Automáticos**: Banco de dados com backups diários
- 📊 **Monitoramento Integrado**: Logs e métricas em um só lugar
- 🌍 **Multi-região**: Suporte para deploy em múltiplas regiões
- ⚡ **Deploy Rápido**: CI/CD automatizado com Cloud Build

---

## 📝 Próximos Passos

1. ✅ Criar os arquivos de configuração (Dockerfile, cloudbuild.yaml, etc.)
2. ✅ Documentar o processo de deploy passo a passo
3. ✅ Criar scripts de migração de dados (SQLite → PostgreSQL)
4. ✅ Configurar variáveis de ambiente no Secret Manager
5. ✅ Testar o deploy em ambiente de staging
6. ✅ Configurar monitoramento e alertas
7. ✅ Documentar procedimentos de backup e recuperação

---

## 🔗 Recursos Úteis

- [Documentação Cloud Run](https://cloud.google.com/run/docs)
- [Documentação Cloud SQL](https://cloud.google.com/sql/docs/postgres)
- [Documentação Cloud Storage](https://cloud.google.com/storage/docs)
- [Documentação Secret Manager](https://cloud.google.com/secret-manager/docs)
- [Documentação Cloud Build](https://cloud.google.com/build/docs)

---

**Última atualização**: Janeiro 2025
