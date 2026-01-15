# DealMind

Sistema de análise de viabilidade de imóveis.

## Setup (Desenvolvimento Local)

### 1. Configurar variáveis de ambiente

```bash
cp env.example .env
```

Edite o `.env` se necessário. O padrão já usa SQLite local:
```
DATABASE_URL="file:./dealmind.db"
AUTH_SECRET="sua-chave-secreta-aqui"
```

### 2. Instalar dependências

```bash
npm install
```

### 3. Criar banco de dados local

```bash
npm run prisma:db:push
```

Isso cria o arquivo `dealmind.db` na raiz do projeto.

### 4. Rodar o servidor de desenvolvimento

```bash
npm run dev
```

Acesse: http://localhost:3000

## Scripts úteis

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Inicia o servidor de desenvolvimento |
| `npm run prisma:db:push` | Sincroniza o schema com o banco SQLite |
| `npm run prisma:studio` | Abre interface visual para ver/editar dados |
| `npm run prisma:generate` | Regenera o Prisma Client |
| `npm run test` | Roda os testes |
