# UI Component Patterns

> Reference for AI agents and developers creating components in `src/components/ui/`.

---

## Rules

### Exports
- Always use **named exports**. Never use `default export`.

```tsx
// correct
export function Button({ ... }: ButtonProps) {}

// wrong
export default function Button({ ... }: ButtonProps) {}
```

### TypeScript
- Always extend the native HTML element props via `ComponentProps<"element">`.
- Merge with `VariantProps<typeof componentVariant>` from `tailwind-variants`.

```tsx
import type { ComponentProps } from "react"
import { tv, type VariantProps } from "tailwind-variants"

type ButtonProps = ComponentProps<"button"> & VariantProps<typeof button>
```

### Styling
- Use `tailwind-variants` (`tv`) for all variant logic.
- Pass `className` directly into the `tv()` call — **do not use `twMerge` separately**.
  `tailwind-variants` handles class merging internally.

```tsx
// correct
export function Button({ variant, size, className, ...props }: ButtonProps) {
  return <button {...props} className={button({ variant, size, className })} />
}

// wrong — redundant twMerge
export function Button({ variant, size, className, ...props }: ButtonProps) {
  return <button {...props} className={twMerge(button({ variant, size }), className)} />
}
```

### Variant Structure
- Define a `base` array with shared classes.
- Group variants by concern: `variant` (visual style), `size` (dimensions).
- Always set `defaultVariants`.

```tsx
const component = tv({
  base: ["shared", "classes", "here"],
  variants: {
    variant: {
      primary: ["..."],
      secondary: ["..."],
    },
    size: {
      sm: "...",
      md: "...",
      lg: "...",
    },
  },
  defaultVariants: {
    variant: "primary",
    size: "md",
  },
})
```

### Typography
- Use **`font-sans`** for all regular/body text (resolves to the system UI font stack).
- Use **`font-mono`** for all monospaced/code text (resolves to JetBrains Mono).
- Never use custom classes like `font-primary` or `font-secondary`.
  These fonts are configured in `globals.css` via `@theme` by overriding `--font-sans` and
  `--font-mono` — Tailwind's built-in utilities pick them up automatically.

```tsx
// correct
"font-sans"   // → system UI stack (ui-sans-serif, system-ui, sans-serif …)
"font-mono"   // → JetBrains Mono, ui-monospace, monospace

// wrong
"font-primary"
"font-secondary"
"font-[var(--font-primary)]"
```

### Design Tokens
- All design tokens are defined as `--color-*` variables in the `@theme` block in `globals.css`.
- Tailwind v4 automatically generates utility classes from `--color-*` variables:
  `--color-accent-green` → `bg-accent-green`, `text-accent-green`, `border-accent-green`, etc.
- **Always use Tailwind utility classes directly.** Never use `var(--...)` arbitrary values in component code.

```tsx
// correct
"bg-accent-green text-text-primary border-border-primary"

// wrong — do not use arbitrary var() syntax
"bg-[var(--color-accent-green)] text-[var(--color-text-primary)]"

// wrong — do not use hardcoded Tailwind palette values
"bg-emerald-500 text-white"
```

Available token prefixes (see `globals.css` `@theme` block for the full list):
- **Background:** `bg-bg-page`, `bg-bg-card`, `bg-bg-input`, `bg-bg-overlay`
- **Text:** `text-text-primary`, `text-text-secondary`, `text-text-muted`, `text-text-inverse`
- **Accent:** `bg-accent-green`, `text-accent-green`, `bg-accent-amber`, `text-accent-amber`, `bg-accent-red`, `text-accent-red`
- **Border:** `border-border-primary`, `border-border-subtle`

### Import Order
Biome enforces import order. Follow this sequence:

1. React/framework (`react`, `next/*`)
2. Third-party libraries (`tailwind-variants`, etc.)
3. Internal aliases (`@/components/...`, `@/lib/...`)

```tsx
import type { ComponentProps } from "react"
import { tv, type VariantProps } from "tailwind-variants"
import { SomeHelper } from "@/lib/utils"
```

---

## Biome CSS Configuration

### `Unknown at rule @theme`

Tailwind 4 uses `@theme` and `@import "tailwindcss"` which are non-standard CSS at-rules.
Biome's CSS parser reports them as unknown unless `tailwindDirectives` is enabled.

**Fix — already applied in `biome.json`:**

```json
{
  "css": {
    "parser": {
      "tailwindDirectives": true
    }
  }
}
```

This enables parsing of Tailwind CSS 4.0 directives (`@theme`, `@layer`, `@utility`, etc.)
so the linter and formatter work correctly without false-positive errors.

If the editor still shows the warning, reload the Biome extension / restart the language server.

---

## Composition Pattern

For multi-part components, use **named sub-component exports** prefixed by the component name.
Do **not** use namespace objects (`Card.Root`, `Card.Title`, etc.).

### Naming convention

```
ComponentRoot       ← outermost wrapper
ComponentHeader     ← optional header area
ComponentBody       ← optional content area
ComponentTitle      ← text element
ComponentDescription ← secondary text
ComponentActions    ← action slot
ComponentBadge      ← badge/label slot
```

### Example

```tsx
// card.tsx
export function CardRoot({ className, ...props }: CardRootProps) { ... }
export function CardTitle({ className, ...props }: CardTitleProps) { ... }
export function CardDescription({ className, ...props }: CardDescriptionProps) { ... }
export function CardBadge({ className, ...props }: CardBadgeProps) { ... }
```

```tsx
// usage
import { CardRoot, CardTitle, CardDescription, CardBadge } from "@/components/ui/card"

<CardRoot>
  <CardBadge>new</CardBadge>
  <CardTitle>My title</CardTitle>
  <CardDescription>Some text here.</CardDescription>
</CardRoot>
```

### Current composed components

| File | Exports |
|------|---------|
| `card.tsx` | `CardRoot`, `CardBadge`, `CardTitle`, `CardDescription` |
| `navbar.tsx` | `NavbarRoot`, `NavbarLogo`, `NavbarActions`, `NavLink` |
| `leaderboard-row.tsx` | `LeaderboardRowRoot`, `LeaderboardRowRank`, `LeaderboardRowScore`, `LeaderboardRowCode`, `LeaderboardRowLang` |
| `code-block.tsx` | `CodeBlockRoot`, `CodeBlockBody` (async server component) |

---

## File Structure

```
src/components/ui/
├── AGENTS.md       ← this file
├── button.tsx
└── [component].tsx
```

Each component lives in its own file named after the component in `kebab-case`.

---

## Component Template

```tsx
import type { ComponentProps } from "react"
import { tv, type VariantProps } from "tailwind-variants"

const component = tv({
  base: ["base classes"],
  variants: {
    variant: {
      primary: ["..."],
    },
    size: {
      md: "...",
    },
  },
  defaultVariants: {
    variant: "primary",
    size: "md",
  },
})

type ComponentProps = ComponentProps<"div"> & VariantProps<typeof component>

export function Component({ variant, size, className, ...props }: ComponentProps) {
  return <div {...props} className={component({ variant, size, className })} />
}
```
