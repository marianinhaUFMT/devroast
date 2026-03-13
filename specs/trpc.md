# Spec: tRPC como camada de API

> Substituir os dados estáticos em `src/db/leaderboard.ts` e `src/db/roast.ts` por procedures tRPC tipadas, integradas com Drizzle e compatíveis com Server Components do Next.js App Router.

---

## Contexto

O projeto já tem Drizzle + PostgreSQL configurado (`src/db/`). As páginas ainda consomem dados estáticos — a integração real com o banco passa por criar uma camada de API. tRPC resolve isso com type-safety end-to-end sem geração de código, e se integra naturalmente com TanStack Query para prefetch em Server Components e reatividade em Client Components.

---

## Pesquisa / Opções

### Opção A: Server Actions do Next.js

**Prós:** zero dependência, nativo do framework, type-safe por inferência.

**Contras:** sem contrato de API explícito; difícil de invocar fora do React (testes, scripts); sem batching automático; validação de input manual.

**Conclusão:** Descartada para a camada de API principal. Pode coexistir para mutations simples no futuro.

---

### Opção B: Route Handlers REST (`app/api/`)

**Prós:** padrão HTTP, fácil de documentar.

**Contras:** sem type-safety no cliente; boilerplate de serialização/deserialização; query keys do React Query manuais.

**Conclusão:** Descartada. tRPC resolve o mesmo problema com melhor DX.

---

### Opção C: tRPC v11 + TanStack React Query — Recomendada

**Prós:**
- Type-safety end-to-end — o tipo da procedure é inferido no cliente sem codegen
- Integração nativa com TanStack Query: `trpc.procedure.queryOptions()`, `trpc.procedure.mutationOptions()`
- Suporte a prefetch em Server Components via `createTRPCOptionsProxy` + `HydrationBoundary`
- `httpBatchLink` agrupa múltiplas chamadas em um único request HTTP
- Validação de input com Zod — mesma lib já usada no projeto

**Contras:**
- Dependência adicional (`@trpc/server`, `@trpc/client`, `@trpc/tanstack-react-query`)
- Requer um API route handler (`/api/trpc/[trpc]`)

**Conclusão:** Escolhida.

---

## Decisão

**tRPC v11** com o adapter **TanStack React Query** (`@trpc/tanstack-react-query`).

Padrão de uso:
- **Server Components** → `trpc` proxy de `src/trpc/server.ts` para prefetch via `HydrationBoundary`
- **Client Components** → `useTRPC()` + hooks do TanStack Query (`useQuery`, `useMutation`, `useSuspenseQuery`)
- **Server Components que só precisam do dado** → `caller` direto (sem passar pelo cache do Query Client)

---

## Especificação de Implementação

### Estrutura de arquivos

```
src/
└── trpc/
    ├── init.ts           # initTRPC, createTRPCContext, baseProcedure
    ├── query-client.ts   # makeQueryClient() com configurações de SSR
    ├── client.tsx        # "use client" — TRPCReactProvider, useTRPC
    ├── server.ts         # server-only — trpc proxy, getQueryClient, HydrateClient, prefetch, caller
    └── routers/
        ├── _app.ts       # appRouter (merge de todos os routers)
        ├── leaderboard.ts
        └── submissions.ts
src/app/api/trpc/[trpc]/
    └── route.ts          # fetch adapter handler (GET + POST)
```

---

### `src/trpc/init.ts`

```ts
import { initTRPC } from "@trpc/server"
import { cache } from "react"

export const createTRPCContext = cache(async () => {
  // Futuramente: extrair headers/session aqui
  return {}
})

const t = initTRPC.create()

export const createTRPCRouter = t.router
export const createCallerFactory = t.createCallerFactory
export const baseProcedure = t.procedure
```

---

### `src/trpc/query-client.ts`

```ts
import { defaultShouldDehydrateQuery, QueryClient } from "@tanstack/react-query"

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { staleTime: 30 * 1000 },
      dehydrate: {
        shouldDehydrateQuery: (query) =>
          defaultShouldDehydrateQuery(query) || query.state.status === "pending",
      },
    },
  })
}
```

`shouldDehydrateQuery` extendido para incluir queries `pending` — necessário para o streaming SSR funcionar (prefetch dispara no server, promise é hidratada no cliente).

---

### `src/trpc/client.tsx`

```tsx
"use client"

import { QueryClientProvider } from "@tanstack/react-query"
import { createTRPCClient, httpBatchLink } from "@trpc/client"
import { createTRPCContext } from "@trpc/tanstack-react-query"
import { useState } from "react"
import { makeQueryClient } from "./query-client"
import type { AppRouter } from "./routers/_app"

export const { TRPCProvider, useTRPC } = createTRPCContext<AppRouter>()

let browserQueryClient: QueryClient | undefined

function getQueryClient() {
  if (typeof window === "undefined") return makeQueryClient()
  if (!browserQueryClient) browserQueryClient = makeQueryClient()
  return browserQueryClient
}

export function TRPCReactProvider({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient()
  const [trpcClient] = useState(() =>
    createTRPCClient<AppRouter>({
      links: [httpBatchLink({ url: "/api/trpc" })],
    }),
  )
  return (
    <QueryClientProvider client={queryClient}>
      <TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
        {children}
      </TRPCProvider>
    </QueryClientProvider>
  )
}
```

`TRPCReactProvider` é montado no `src/app/layout.tsx`.

---

### `src/trpc/server.ts`

```ts
import "server-only"
import { dehydrate, HydrationBoundary } from "@tanstack/react-query"
import { createTRPCOptionsProxy, type TRPCQueryOptions } from "@trpc/tanstack-react-query"
import { cache } from "react"
import { createTRPCContext, createCallerFactory } from "./init"
import { makeQueryClient } from "./query-client"
import { appRouter } from "./routers/_app"
import type { AppRouter } from "./routers/_app"

export const getQueryClient = cache(makeQueryClient)

export const trpc = createTRPCOptionsProxy({
  ctx: createTRPCContext,
  router: appRouter,
  queryClient: getQueryClient,
})

// Caller direto — para Server Components que só precisam do dado (não hidrata no cliente)
const createCaller = createCallerFactory(appRouter)
export const caller = createCaller(createTRPCContext)

// Helpers de conveniência para prefetch + hydration
export function HydrateClient({ children }: { children: React.ReactNode }) {
  return (
    <HydrationBoundary state={dehydrate(getQueryClient())}>
      {children}
    </HydrationBoundary>
  )
}

export function prefetch<T extends ReturnType<TRPCQueryOptions<any>>>(queryOptions: T) {
  const qc = getQueryClient()
  if (queryOptions.queryKey[1]?.type === "infinite") {
    void qc.prefetchInfiniteQuery(queryOptions as any)
  } else {
    void qc.prefetchQuery(queryOptions)
  }
}
```

---

### `src/app/api/trpc/[trpc]/route.ts`

```ts
import { fetchRequestHandler } from "@trpc/server/adapters/fetch"
import { createTRPCContext } from "@/trpc/init"
import { appRouter } from "@/trpc/routers/_app"

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: createTRPCContext,
  })

export { handler as GET, handler as POST }
```

---

### Routers

#### `src/trpc/routers/leaderboard.ts`

Procedures a expor:

| Procedure | Tipo | Input | Descrição |
|-----------|------|-------|-----------|
| `leaderboard.list` | query | `{ limit?: number }` | Top N submissões públicas ordenadas por score ASC |
| `leaderboard.stats` | query | — | `{ total, avgScore }` para o rodapé da homepage |

#### `src/trpc/routers/submissions.ts`

| Procedure | Tipo | Input | Descrição |
|-----------|------|-------|-----------|
| `submissions.byId` | query | `{ id: string }` | Submissão completa com issues e diffLines |
| `submissions.submit` | mutation | `{ code, lang, roastMode }` | Persiste submissão + resultado da IA, retorna `id` |

#### `src/trpc/routers/_app.ts`

```ts
import { createTRPCRouter } from "../init"
import { leaderboardRouter } from "./leaderboard"
import { submissionsRouter } from "./submissions"

export const appRouter = createTRPCRouter({
  leaderboard: leaderboardRouter,
  submissions: submissionsRouter,
})

export type AppRouter = typeof appRouter
```

---

### Padrão de uso nas páginas

**Server Component com prefetch (recomendado):**

```tsx
// src/app/leaderboard/page.tsx
import { HydrateClient, prefetch, trpc } from "@/trpc/server"
import { LeaderboardClient } from "./leaderboard-client"

export default function LeaderboardPage() {
  prefetch(trpc.leaderboard.list.queryOptions({ limit: 50 }))
  prefetch(trpc.leaderboard.stats.queryOptions())
  return (
    <HydrateClient>
      <LeaderboardClient />
    </HydrateClient>
  )
}
```

**Server Component que só precisa do dado (sem hidratação):**

```tsx
// quando não há Client Component filho que precise do mesmo dado
const data = await caller.leaderboard.stats()
```

**Client Component:**

```tsx
"use client"
import { useQuery } from "@tanstack/react-query"
import { useTRPC } from "@/trpc/client"

export function LeaderboardClient() {
  const trpc = useTRPC()
  const { data } = useQuery(trpc.leaderboard.list.queryOptions({ limit: 50 }))
  // ...
}
```

---

## To-dos de Implementação

### Setup

- [ ] Instalar dependências: `pnpm add @trpc/server @trpc/client @trpc/tanstack-react-query @tanstack/react-query server-only client-only zod`
- [ ] Criar `src/trpc/init.ts`
- [ ] Criar `src/trpc/query-client.ts`
- [ ] Criar `src/trpc/client.tsx`
- [ ] Criar `src/trpc/server.ts`
- [ ] Criar `src/app/api/trpc/[trpc]/route.ts`
- [ ] Montar `TRPCReactProvider` no `src/app/layout.tsx`

### Routers

- [ ] Criar `src/trpc/routers/leaderboard.ts` com `list` e `stats`
- [ ] Criar `src/trpc/routers/submissions.ts` com `byId` e `submit`
- [ ] Criar `src/trpc/routers/_app.ts` com merge final

### Integração nas páginas

- [ ] Migrar `src/app/leaderboard/page.tsx` para usar `prefetch` + `HydrateClient` + Client Component
- [ ] Migrar `src/app/roast/[id]/page.tsx` para `submissions.byId`
- [ ] Migrar stats da homepage para `leaderboard.stats`
- [ ] Conectar o botão "roast my code" na homepage à mutation `submissions.submit`

### Qualidade

- [ ] Rodar `pnpm check` (Biome) e corrigir
- [ ] Rodar `pnpm build` e verificar ausência de erros
