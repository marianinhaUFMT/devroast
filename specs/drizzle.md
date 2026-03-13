# Drizzle ORM — Especificação de Implementação

> Especificação para adicionar persistência ao DevRoast com Drizzle ORM + PostgreSQL via Docker Compose.

---

## Contexto

O DevRoast permite que usuários colem código, escolham um modo de roast (honesto ou sarcástico) e recebam:

- Uma **nota de vergonha** de 0 a 10 (quanto menor, pior o código)
- Um **veredicto** categorizado (ex: `needs_serious_help`)
- Uma **frase de roast** gerada pela IA
- Uma **análise detalhada** com cards de issues (critical / warning / good)
- Um **diff sugerido** com a correção

Cada submissão pode aparecer no **leaderboard** público, ranqueado pelo menor score.

---

## Infraestrutura

### Docker Compose

```yaml
# docker-compose.yml
services:
  db:
    image: postgres:16-alpine
    restart: unless-stopped
    environment:
      POSTGRES_USER: devroast
      POSTGRES_PASSWORD: devroast
      POSTGRES_DB: devroast
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

### Variáveis de Ambiente

```env
# .env.local
DATABASE_URL="postgresql://devroast:devroast@localhost:5432/devroast"
```

---

## Enums

### `roast_mode`

Representa o modo escolhido pelo usuário no momento da submissão.

```ts
export const roastModeEnum = pgEnum("roast_mode", [
  "honest",   // feedback direto, sem sarcasmo
  "roast",    // modo máximo de sarcasmo
])
```

### `verdict`

Veredicto gerado pela IA com base no score. Exibido como badge na tela de resultados (Screen 2) e no OG Image (Screen 4).

```ts
export const verdictEnum = pgEnum("verdict", [
  "clean_code",          // score alto (8–10) — código exemplar
  "could_be_worse",      // score médio-alto (6–7.9)
  "needs_work",          // score médio (4–5.9)
  "needs_serious_help",  // score baixo (2–3.9) — visto no layout
  "delete_this_now",     // score crítico (0–1.9)
])
```

### `issue_severity`

Severidade de cada item da análise detalhada. Mapeia diretamente aos cards da tela de resultados (Section `detailed_analysis`) e ao componente `<Badge>`.

```ts
export const issueSeverityEnum = pgEnum("issue_severity", [
  "critical",  // dot vermelho — accent-red
  "warning",   // dot âmbar — accent-amber
  "good",      // dot verde — accent-green
])
```

### `diff_line_type`

Tipo de linha no diff sugerido. Mapeia ao componente `<DiffLine variant="removed" | "added" | "context">`.

```ts
export const diffLineTypeEnum = pgEnum("diff_line_type", [
  "removed",  // linha removida (prefixo -)
  "added",    // linha adicionada (prefixo +)
  "context",  // linha de contexto (sem prefixo)
])
```

---

## Tabelas

### `submissions`

Tabela principal. Registra cada código submetido, o modo escolhido e todos os resultados do roast.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | `uuid` PK default `gen_random_uuid()` | Identificador único da submissão |
| `code` | `text` NOT NULL | Código original submetido pelo usuário |
| `lang` | `varchar(50)` | Linguagem detectada (ex: `"javascript"`, `"python"`) |
| `line_count` | `integer` | Número de linhas do código submetido |
| `roast_mode` | `roast_mode` NOT NULL | Modo selecionado pelo usuário |
| `score` | `numeric(4,2)` NOT NULL | Nota de 0.00 a 10.00 |
| `verdict` | `verdict` NOT NULL | Veredicto categorizado gerado pela IA |
| `roast_quote` | `text` NOT NULL | Frase principal do roast (exibida em destaque no Screen 2 e no OG Image) |
| `suggested_fix` | `text` | Código completo com a correção sugerida (opcional) |
| `is_public` | `boolean` NOT NULL default `true` | Se aparece no leaderboard público |
| `created_at` | `timestamp` NOT NULL default `now()` | Data de criação |

```ts
export const submissions = pgTable("submissions", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: text("code").notNull(),
  lang: varchar("lang", { length: 50 }),
  lineCount: integer("line_count"),
  roastMode: roastModeEnum("roast_mode").notNull(),
  score: numeric("score", { precision: 4, scale: 2 }).notNull(),
  verdict: verdictEnum("verdict").notNull(),
  roastQuote: text("roast_quote").notNull(),
  suggestedFix: text("suggested_fix"),
  isPublic: boolean("is_public").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
})
```

---

### `submission_issues`

Issues da análise detalhada de cada submissão. Cada submissão pode ter de 1 a N issues. Exibidas nos cards da seção `detailed_analysis` no Screen 2.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | `uuid` PK default `gen_random_uuid()` | Identificador único do issue |
| `submission_id` | `uuid` FK → `submissions.id` ON DELETE CASCADE | Submissão a que pertence |
| `severity` | `issue_severity` NOT NULL | Severidade: critical / warning / good |
| `title` | `varchar(255)` NOT NULL | Título curto (ex: `"using var instead of const/let"`) |
| `description` | `text` NOT NULL | Explicação detalhada do issue |
| `order` | `integer` NOT NULL default `0` | Ordem de exibição nos cards |

```ts
export const submissionIssues = pgTable("submission_issues", {
  id: uuid("id").primaryKey().defaultRandom(),
  submissionId: uuid("submission_id")
    .notNull()
    .references(() => submissions.id, { onDelete: "cascade" }),
  severity: issueSeverityEnum("severity").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  order: integer("order").notNull().default(0),
})
```

---

### `submission_diff_lines`

Linhas do diff sugerido. Cada linha é armazenada separadamente para facilitar a renderização com o componente `<DiffLine>`.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | `uuid` PK default `gen_random_uuid()` | Identificador único da linha |
| `submission_id` | `uuid` FK → `submissions.id` ON DELETE CASCADE | Submissão a que pertence |
| `type` | `diff_line_type` NOT NULL | Tipo: removed / added / context |
| `content` | `text` NOT NULL | Conteúdo da linha de código |
| `line_number` | `integer` NOT NULL | Número da linha no diff (ordem de exibição) |

```ts
export const submissionDiffLines = pgTable("submission_diff_lines", {
  id: uuid("id").primaryKey().defaultRandom(),
  submissionId: uuid("submission_id")
    .notNull()
    .references(() => submissions.id, { onDelete: "cascade" }),
  type: diffLineTypeEnum("type").notNull(),
  content: text("content").notNull(),
  lineNumber: integer("line_number").notNull(),
})
```

---

## Relations

```ts
export const submissionsRelations = relations(submissions, ({ many }) => ({
  issues: many(submissionIssues),
  diffLines: many(submissionDiffLines),
}))

export const submissionIssuesRelations = relations(submissionIssues, ({ one }) => ({
  submission: one(submissions, {
    fields: [submissionIssues.submissionId],
    references: [submissions.id],
  }),
}))

export const submissionDiffLinesRelations = relations(submissionDiffLines, ({ one }) => ({
  submission: one(submissions, {
    fields: [submissionDiffLines.submissionId],
    references: [submissions.id],
  }),
}))
```

---

## Queries de Referência

### Leaderboard (Screen 3)

Busca as submissões públicas com menor score, com contagem de linhas e linguagem — para preencher os cards do leaderboard.

```ts
// As 10 piores submissões públicas
const leaderboard = await db
  .select()
  .from(submissions)
  .where(eq(submissions.isPublic, true))
  .orderBy(asc(submissions.score))
  .limit(10)
```

### Stats da homepage (Screen 1)

Contagem total + média de score para o rodapé do editor (`"2,847 codes roasted"` / `"avg score: 4.2/10"`).

```ts
const stats = await db
  .select({
    total: count(),
    avgScore: avg(submissions.score),
  })
  .from(submissions)
  .where(eq(submissions.isPublic, true))
```

### Submissão completa (Screen 2)

Busca uma submissão com todos os seus issues e linhas de diff.

```ts
const submission = await db.query.submissions.findFirst({
  where: eq(submissions.id, submissionId),
  with: {
    issues: { orderBy: asc(submissionIssues.order) },
    diffLines: { orderBy: asc(submissionDiffLines.lineNumber) },
  },
})
```

---

## To-dos de Implementação

### Setup e Infra

- [ ] Adicionar `docker-compose.yml` na raiz do projeto
- [ ] Adicionar `.env.local` com `DATABASE_URL` (e `.env.example` sem credenciais reais)
- [ ] Instalar dependências: `pnpm add drizzle-orm postgres` e `pnpm add -D drizzle-kit`
- [ ] Criar `drizzle.config.ts` na raiz apontando para `src/db/schema.ts`

### Schema

- [ ] Criar `src/db/schema.ts` com enums e tabelas conforme especificado acima
- [ ] Criar `src/db/relations.ts` (ou incluir no schema) com as relations do Drizzle
- [ ] Criar `src/db/index.ts` — instância do cliente Drizzle (`drizzle(pool, { schema })`)

### Migrations

- [ ] Rodar `pnpm drizzle-kit generate` para gerar a migration inicial
- [ ] Adicionar script `pnpm db:migrate` no `package.json` para aplicar migrations
- [ ] Adicionar script `pnpm db:studio` para abrir o Drizzle Studio

### Integração com a Aplicação

- [ ] Criar Server Action `submitCode` em `src/app/actions/submit-code.ts`:
  - Recebe `{ code, roastMode }`, chama a IA, persiste a submissão + issues + diff lines, retorna o `id`
- [ ] Criar rota `src/app/roast/[id]/page.tsx` para exibir o Screen 2 (Roast Results) buscando a submissão pelo `id`
- [ ] Criar rota `src/app/leaderboard/page.tsx` para o Screen 3 com query de leaderboard
- [ ] Atualizar `src/app/page.tsx` para buscar as stats dinamicamente e redirecionar para `/roast/[id]` após submissão

### OG Image

- [ ] Criar `src/app/roast/[id]/opengraph-image.tsx` usando Next.js `ImageResponse` para gerar o OG Image do Screen 4 dinamicamente com os dados da submissão

---

## Estrutura de Arquivos Proposta

```
src/
└── db/
    ├── index.ts        # cliente Drizzle (pool + instância)
    ├── schema.ts       # enums + tabelas
    └── relations.ts    # relations do Drizzle ORM
drizzle/
└── migrations/         # arquivos gerados pelo drizzle-kit
drizzle.config.ts       # configuração do drizzle-kit
docker-compose.yml      # PostgreSQL via Docker
```
