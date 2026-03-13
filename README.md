# DevRoast

> paste your code. get roasted.

DevRoast is a web app that brutally rates your code — from "brutally honest" to "full roast mode". Paste any snippet, get a shame score, and see how you rank on the leaderboard.

Built during **NLW (Next Level Week)** by [Rocketseat](https://rocketseat.com.br), Brazil's largest developer community.

---

## Features

- **Code input** — paste any snippet and submit for analysis
- **Roast modes** — toggle between honest feedback and maximum sarcasm
- **Shame score** — get a rating from 0 to 10 (lower = worse code)
- **Leaderboard** — the worst code on the internet, ranked by shame

## Tech Stack

| Tool | Role |
|------|------|
| [Next.js 16](https://nextjs.org) (App Router) | Framework |
| [React 19](https://react.dev) | UI |
| [TypeScript 5](https://www.typescriptlang.org) | Type safety |
| [Tailwind CSS 4](https://tailwindcss.com) | Styling |
| [tailwind-variants](https://www.tailwind-variants.org) | Variant logic |
| [Base UI](https://base-ui.com) | Headless interactive components |
| [Shiki](https://shiki.style) | Syntax highlighting |
| [Biome](https://biomejs.dev) | Linting + formatting |

## Getting Started

**Requirements:** Node.js 22+ and pnpm.

```bash
# install dependencies
pnpm install

# run the dev server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

```bash
pnpm build   # production build
pnpm check   # lint + format (auto-fix)
```

## Project Structure

```
src/
├── app/
│   ├── globals.css      # design tokens (@theme)
│   ├── layout.tsx       # root layout + navbar
│   └── page.tsx         # homepage
└── components/
    └── ui/              # all UI components
```

---

Built with during **NLW** — [Rocketseat](https://rocketseat.com.br)
