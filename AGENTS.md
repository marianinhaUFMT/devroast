# DevRoast — Project Reference

> Quick reference for AI agents and developers working on this codebase.

---

## Stack

| Tool | Version | Role |
|------|---------|------|
| Next.js | 16 | Framework (App Router) |
| React | 19 | UI |
| TypeScript | 5 | Type safety |
| Tailwind CSS | 4 | Styling |
| tailwind-variants (`tv`) | 3 | Variant logic |
| Base UI (`@base-ui/react`) | 1 | Headless interactive components |
| Shiki | 4 | Syntax highlighting (server-only) |
| Biome | 2 | Linting + formatting |
| pnpm | — | Package manager |

## Node.js

Managed via `fnm`. Always activate before running commands:

```bash
export PATH="/home/marianinha/.local/share/fnm:$PATH" && eval "$(fnm env --shell bash)" && fnm use 22
```

## Commands

```bash
pnpm dev        # dev server
pnpm build      # production build
pnpm check      # biome lint + format (auto-fix)
```

---

## Key Conventions

- **No default exports** — always named exports
- **Extend native HTML props** — `ComponentProps<"element"> & VariantProps<typeof tv(...)>`
- **Styling** — `tailwind-variants` (`tv`) for all variants; pass `className` into the `tv()` call directly (no `twMerge`)
- **Design tokens** — defined in `globals.css` `@theme` block as `--color-*`; always use Tailwind utilities (`bg-accent-green`, `text-text-primary`) — never `var(--...)`
- **Fonts** — `font-mono` = JetBrains Mono, `font-sans` = system UI stack
- **Button hover** — use `enabled:hover:` so hover doesn't fire when disabled
- **Composition pattern** — multi-part components use named sub-exports (`CardRoot`, `CardTitle`, ...) — not namespace objects (`Card.Root`)
- **Interactive components** (Base UI) — use `"use client"` only where needed
- **CodeBlock** — `CodeBlockBody` is an `async` server component (Shiki); never import inside `"use client"` files
- **Content width** — `max-w-[960px] mx-auto`; navbar is full-width in `layout.tsx`
- **Data** — all static for now, no API

## Directory Structure

```
src/
├── app/
│   ├── globals.css          # @theme design tokens
│   ├── layout.tsx           # root layout + navbar
│   ├── page.tsx             # homepage
│   └── ui-preview/          # component kitchen sink
└── components/
    └── ui/                  # all UI components
        └── AGENTS.md        # component-level patterns (composition, variants, tokens)
```

See `src/components/ui/AGENTS.md` for component-specific rules and the full composition pattern reference.
