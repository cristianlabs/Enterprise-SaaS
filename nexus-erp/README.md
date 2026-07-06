# Nexus ERP

Plataforma SaaS modular de gestão empresarial construída com **Next.js 15**, **TypeScript**, **Prisma** e **Supabase**. Cobre CRM, pipeline de vendas, catálogo de produtos, tarefas e controle de acesso por papel (RBAC).

## Stack

| Camada | Tecnologia |
|---|---|
| Framework | Next.js 15 (App Router) |
| Linguagem | TypeScript (strict mode) |
| ORM | Prisma v6 com adapter-pg |
| Banco | PostgreSQL via Supabase |
| Auth | NextAuth.js v5 (JWT + 2FA OTP) |
| Estilo | Tailwind CSS |
| Deploy | Vercel |

## Funcionalidades

- **Autenticação** — login com e-mail/senha + verificação 2FA via OTP por e-mail
- **RBAC** — 5 papéis hierárquicos: OWNER → ADMIN → MANAGER → SELLER → EMPLOYEE
- **CRM** — pipeline visual kanban, negócios, clientes, atividades
- **Vendas** — cotações → pedidos com status rastreados
- **Produtos** — catálogo com SKU, categorias e alerta de estoque mínimo
- **Tarefas** — atribuição, prioridade e rastreamento de progresso
- **Auditoria** — log completo de ações por usuário
- **Notificações** — sistema de notificações por usuário

## Arquitetura

```
src/
├── app/
│   ├── (auth)/login/          # Página de login com 2FA
│   ├── (dashboard)/           # Área autenticada (layout + páginas)
│   │   ├── page.tsx           # Dashboard com métricas
│   │   ├── clientes/          # CRUD de clientes
│   │   ├── produtos/          # Catálogo de produtos
│   │   ├── vendas/cotacoes/   # Pipeline de cotações
│   │   └── crm/               # Pipeline kanban
│   └── api/                   # Route Handlers REST
│       ├── auth/[...nextauth] # NextAuth endpoints
│       ├── clientes/          # API de clientes
│       ├── produtos/          # API de produtos
│       └── vendas/cotacoes/   # API de cotações
├── components/layout/         # Sidebar + Header
└── lib/
    ├── auth.ts                # Configuração NextAuth
    ├── db.ts                  # Singleton Prisma Client
    ├── permissions.ts         # hasMinRole + DEFAULT_MODULE_PERMISSIONS
    └── utils.ts               # Helpers (cn, formatCurrency, etc.)
```

## Configuração

```bash
# 1. Clonar e instalar dependências
git clone https://github.com/SEU_USERNAME/nexus-erp
cd nexus-erp
npm install

# 2. Copiar variáveis de ambiente
cp .env.example .env
# Preencher DATABASE_URL, DIRECT_URL, NEXTAUTH_SECRET e SMTP_*

# 3. Sincronizar schema com o banco
npx prisma db push

# 4. Iniciar em desenvolvimento
npm run dev
```

> **Nota sobre conexão:** use a URL do Transaction Pooler (porta 6543) em `DATABASE_URL` para runtime, e a URL direta (porta 5432) em `DIRECT_URL` para `prisma db push`. O PgBouncer bloqueia DDL statements.

## RBAC — Permissões por módulo

| Módulo | OWNER | ADMIN | MANAGER | SELLER | EMPLOYEE |
|---|:---:|:---:|:---:|:---:|:---:|
| Dashboard | ✓ | ✓ | ✓ | ✓ | ✓ |
| Clientes | ✓ | ✓ | ✓ | ✓ | — |
| Produtos | ✓ | ✓ | ✓ | ✓ | ✓ |
| Cotações / Pedidos | ✓ | ✓ | ✓ | ✓ | — |
| CRM | ✓ | ✓ | ✓ | ✓ | — |
| Tarefas | ✓ | ✓ | ✓ | ✓ | ✓ |
| Relatórios | ✓ | ✓ | ✓ | — | — |
| Configurações | ✓ | ✓ | — | — | — |

## Scripts disponíveis

```bash
npm run dev        # Servidor de desenvolvimento com Turbopack
npm run build      # Build de produção
npm run db:push    # Sincroniza schema com o banco (usa DIRECT_URL)
npm run db:studio  # Abre o Prisma Studio
```

## Licença

MIT
