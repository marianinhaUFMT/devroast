# Spec: Editor com Syntax Highlight

> Pesquisa e especificação para implementação do editor de código com syntax highlighting e detecção automática de linguagem na homepage do DevRoast.

---

## Contexto

O editor da homepage precisa:
1. Receber código colado pelo usuário (paste)
2. Detectar automaticamente a linguagem do código
3. Aplicar syntax highlighting em tempo real conforme a linguagem detectada
4. Permitir que o usuário sobrescreva a linguagem manualmente via seletor

---

## Pesquisa: Como o ray.so faz

O ray.so (https://github.com/raycast/ray-so) é uma boa referência. A abordagem deles:

### Arquitetura

```
code.tsx          — inicializa Shiki (WASM) via useEffect, armazena o highlighter em Jotai atom
Editor.tsx        — <textarea> invisível sobreposto ao <div> com HTML highlighted
HighlightedCode   — useEffect que chama highlighter.codeToHtml() quando code ou lang mudam
LanguageControl   — dropdown/combobox para seleção manual de linguagem
```

### Técnica central: textarea + overlay

O ray.so usa o padrão **textarea + div overlay**:
- Um `<textarea>` real (invisível, `color: transparent`) captura o input do usuário
- Um `<div>` posicionado em cima renderiza o HTML highlighted via `dangerouslySetInnerHTML`
- Ambos têm o mesmo tamanho, font-size, padding — criando a ilusão de um editor com highlight

Isso evita dependências pesadas como CodeMirror ou Monaco.

### Shiki no browser (WASM)

O ray.so usa `getHighlighterCore` com `shiki/wasm` para rodar Shiki no browser:

```ts
import getWasm from "shiki/wasm"
import { getHighlighterCore } from "shiki"

getHighlighterCore({
  themes: [...],
  langs: [LANGUAGES.javascript.src(), ...], // lazy imports
  loadWasm: getWasm,
}).then(setHighlighter)
```

Linguagens são carregadas sob demanda via dynamic import quando necessário.

### Detecção de linguagem: o ray.so NÃO faz auto-detect

O ray.so **não detecta a linguagem automaticamente** — o usuário sempre escolhe manualmente. Isso é uma diferença chave do que queremos no DevRoast.

---

## Opções para Syntax Highlighting

### Opção A: Shiki WASM (client-side) — Recomendada

**Como funciona:** Shiki já está no projeto como dependência (usado server-side em `CodeBlockBody`). A versão WASM roda no browser via `createHighlighterCore` + `shiki/wasm`.

**Prós:**
- Já temos Shiki instalado — **zero dependência nova**
- Qualidade de highlighting idêntica à do `CodeBlock` existente
- Usa os mesmos tokens/temas do projeto (tema `vesper` já configurado)
- Lazy loading de gramáticas — só carrega a linguagem necessária
- Mesma abordagem do ray.so (confiança na solução)
- Output em HTML inline styles — sem CSS adicional necessário

**Contras:**
- WASM (~2MB) precisa ser baixado na primeira visita
- Inicialização assíncrona — precisa de estado de loading
- `createHighlighter` deve ser singleton (uma instância por sessão)

**Bundle size:** O WASM do Shiki é ~2MB mas é carregado uma única vez e cacheado.

---

### Opção B: highlight.js com `highlightAuto`

**Como funciona:** `highlight.js` tem `highlightAuto(code)` que tenta detectar a linguagem automaticamente com heurísticas de relevância.

**Prós:**
- API de auto-detect nativa: `hljs.highlightAuto(code)` retorna `{ language, relevance, value }`
- Bundle menor para subset de linguagens
- Síncrono — sem WASM

**Contras:**
- **Seria uma nova dependência** (não temos no projeto)
- Qualidade do highlighting inferior ao Shiki (TextMate grammars vs regex)
- Auto-detect com heurísticas pode ser impreciso para trechos curtos
- Temas/cores diferentes dos tokens Shiki já definidos em `globals.css`
- Conflito visual com o `CodeBlock` existente que usa Shiki

**Conclusão:** Descartado. Adicionar hljs só para auto-detect, sacrificando a qualidade do Shiki, não faz sentido.

---

### Opção C: Monaco Editor

**Como funciona:** O editor do VS Code, com highlighting, autocomplete, etc.

**Prós:**
- Editor completo com UX rica

**Contras:**
- Bundle **enorme** (~5-10MB) — inaceitável para uma landing page
- Overkill para o caso de uso (paste de código, não edição avançada)
- Conflito de estilos com o design system do projeto

**Conclusão:** Descartado.

---

### Opção D: CodeMirror 6

**Como funciona:** Editor modular com highlighting via lezer grammars.

**Prós:**
- Bundle modular e tree-shakeable
- API rica para edição

**Contras:**
- Nova dependência pesada (~200-400KB com linguagens)
- Lezer grammars são diferentes das TextMate grammars do Shiki — inconsistência visual
- Mais complexo de integrar com o design system existente

**Conclusão:** Descartado.

---

## Opções para Detecção Automática de Linguagem

### Opção 1: `@vscode/vscode-languagedetection` — Recomendada

**Como funciona:** Pacote da Microsoft que usa ML (modelo guesslang convertido para TensorFlow.js) para detectar linguagens. É o mesmo modelo que o VS Code usa internamente.

```ts
import { ModelOperations } from "@vscode/vscode-languagedetection"

const ops = new ModelOperations()
const results = await ops.runModel(code)
// [{ languageId: 'ts', confidence: 0.48 }, { languageId: 'js', confidence: 0.07 }, ...]
```

**Prós:**
- Alta precisão (mesmo modelo que o VS Code usa)
- Retorna confiança por linguagem — dá pra mostrar "detectado: TypeScript (48%)"
- Suporta 30+ linguagens
- Funciona no browser (TensorFlow.js)

**Contras:**
- Nova dependência (~5MB com o modelo ML)
- Carregamento assíncrono do modelo na primeira vez
- Pode ser pesado demais para uso casual

---

### Opção 2: `highlight.js` `highlightAuto` para detecção (sem renderização)

**Como funciona:** Usar hljs **só** para detecção da linguagem (pelo score de relevância), e depois passar a linguagem detectada para o Shiki renderizar.

```ts
import hljs from "highlight.js"

const result = hljs.highlightAuto(code, ["javascript", "typescript", "python", ...])
const detectedLang = result.language // "javascript"
// → passa para Shiki: highlighter.codeToHtml(code, { lang: detectedLang })
```

**Prós:**
- API simples e síncrona para detecção
- Funciona bem para as linguagens mais comuns
- Menor que o modelo ML

**Contras:**
- Ainda é uma nova dependência
- Precisão menor que ML para trechos curtos ou ambíguos
- Precisa carregar gramáticas hljs em memória

---

### Opção 3: Heurísticas manuais leves — Melhor custo/benefício

**Como funciona:** Implementar um conjunto de regex/heurísticas para detectar as linguagens mais comuns sem nenhuma dependência.

```ts
function detectLanguage(code: string): string {
  if (/^\s*<[a-zA-Z]/.test(code)) return "html"
  if (/import\s+.*\s+from\s+['"]/.test(code) && /:\s*(string|number|boolean)/.test(code)) return "typescript"
  if (/import\s+.*\s+from\s+['"]/.test(code)) return "javascript"
  if (/def\s+\w+\(|print\(|import\s+\w+/.test(code)) return "python"
  if (/func\s+\w+\(|let\s+\w+\s*=|var\s+\w+\s*=/.test(code) && /Swift/.test(code)) return "swift"
  // ...
  return "plaintext"
}
```

**Prós:**
- **Zero dependência nova**
- Instantâneo (síncrono, sem loading)
- Bundle size zero

**Contras:**
- Precisão limitada para linguagens similares (JS vs TS, C vs C++ vs Java)
- Necessita manutenção manual
- Falha em edge cases comuns

---

### Opção 4: Usar Shiki para detecção (abordagem híbrida)

**Como funciona:** Tentar highlight com múltiplas linguagens candidate e medir qual produziu mais tokens coloridos (proxy para "melhor parse"). Mais experimental.

**Conclusão:** Muito custoso computacionalmente. Descartado.

---

## Decisão Recomendada

### Highlighting: Shiki WASM (client-side)

Mesma lib já no projeto. Consistência visual garantida. Abordagem comprovada pelo ray.so.

### Detecção de linguagem: Híbrida (heurísticas + fallback manual)

1. **Primeira camada: heurísticas leves** — cobrir as 10-15 linguagens mais comuns (JS, TS, Python, Go, Rust, Java, CSS, HTML, SQL, JSON, YAML, Bash). Roda instantaneamente.
2. **Fallback: o próprio Shiki como validador** — se a heurística retornar `"plaintext"` ou confidence baixa, tentar um subset de linguagens no Shiki e ver qual produziu tokens sem erro.
3. **Override manual sempre disponível** — o usuário pode corrigir via dropdown.

Isso evita uma nova dependência pesada de ML para um caso de uso simples.

> **Pergunta aberta:** Caso a precisão das heurísticas seja insatisfatória após testes, adicionar `@vscode/vscode-languagedetection` como upgrade. O design da feature deve permitir trocar o detector de linguagem de forma isolada.

---

## Especificação de Implementação

### Componentes a criar

```
src/components/ui/
├── code-editor.tsx          # Componente principal do editor (client)
└── language-selector.tsx    # Dropdown/combobox de seleção de linguagem (client)

src/lib/
├── shiki-client.ts          # Singleton do highlighter Shiki WASM
└── language-detector.ts     # Heurísticas de detecção de linguagem
```

### `shiki-client.ts`

Responsável por inicializar e cachear a instância do Shiki WASM. Deve ser um singleton para não reinicializar a cada render.

```ts
// Pseudo-código
let highlighterPromise: Promise<Highlighter> | null = null

export function getHighlighter(): Promise<Highlighter> {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighterCore({
      themes: [import("shiki/themes/vesper.mjs")],
      langs: [], // carregadas sob demanda
      engine: createOnigurumaEngine(import("shiki/wasm")),
    })
  }
  return highlighterPromise
}

export async function highlight(code: string, lang: string): Promise<string> {
  const hl = await getHighlighter()
  // lazy load da linguagem se não carregada
  await ensureLangLoaded(hl, lang)
  return hl.codeToHtml(code, { lang, theme: "vesper" })
}
```

### `language-detector.ts`

Heurísticas para as principais linguagens. Retorna a linguagem detectada e um nível de confiança.

```ts
type DetectionResult = {
  language: string      // ID compatível com Shiki
  confidence: "high" | "medium" | "low"
}

export function detectLanguage(code: string): DetectionResult
```

Heurísticas a implementar (em ordem de prioridade):
- `json` — começa com `{` ou `[` + estrutura válida JSON
- `html` — começa com `<` + tags HTML conhecidas
- `css`/`scss` — seletores + propriedades CSS
- `yaml` — indentação + `: ` pattern
- `sql` — `SELECT`, `FROM`, `WHERE`, `INSERT` keywords
- `python` — `def `, `import `, `print(`, `if __name__`
- `rust` — `fn `, `let mut`, `impl `, `use `
- `go` — `func `, `package `, `import `, `:=`
- `java` — `public class`, `System.out`, `@Override`
- `typescript` — `import` + type annotations (`: string`, `interface`, `type `, `<T>`)
- `javascript` — `import`/`require`/`export`, arrow functions
- `bash` — `#!/bin/bash`, `echo `, `$VAR`

### `CodeEditor` component

```tsx
// src/components/ui/code-editor.tsx
"use client"

// Props
type CodeEditorProps = {
  value: string
  onChange: (code: string) => void
  className?: string
}

// Estado interno
// - detectedLang: string (resultado da detecção automática)
// - selectedLang: string | null (override manual do usuário)
// - highlightedHtml: string (output do Shiki)
// - isHighlighting: boolean (loading state)

// Efeito 1: ao mudar `value`, rodar detectLanguage() e atualizar detectedLang
// Efeito 2: ao mudar `detectedLang` ou `selectedLang`, chamar highlight() e atualizar highlightedHtml

// Render: textarea invisível + div overlay com dangerouslySetInnerHTML
```

**UX do editor:**
- Placeholder: "Cole seu código aqui..."
- Enquanto `highlightedHtml` é vazio (antes do Shiki inicializar), mostrar o texto sem highlight
- Transition suave ao aplicar as cores (opacity transition)
- O textarea e o overlay devem ter exatamente o mesmo `font-size`, `line-height`, `padding`, `font-family` (`font-mono`)

### `LanguageSelector` component

```tsx
// src/components/ui/language-selector.tsx
"use client"

// Props
type LanguageSelectorProps = {
  detectedLang: string           // linguagem detectada automaticamente
  selectedLang: string | null    // override manual (null = usar detected)
  onSelect: (lang: string | null) => void
}
```

**UX do seletor:**
- Posicionado **acima do editor**, na barra de controles do editor
- Estado auto: mostra `"TypeScript (auto)"` — label da linguagem + sufixo `(auto)` em `text-text-secondary`
- Estado manual: mostra `"TypeScript"` + botão `✕` para resetar para auto-detect
- É um botão que abre um dropdown/popover com a lista de linguagens suportadas
- O dropdown pode ter busca/filtro por nome (combobox)
- Usar `@base-ui/react` Select ou Popover + input de filtro interno
- Quando `code.length < 10`, mostrar `"Detectando..."` ou estado neutro

### Integração na homepage (`src/app/page.tsx`)

```tsx
// Estado a adicionar
const [code, setCode] = useState("")
const [selectedLang, setSelectedLang] = useState<string | null>(null)
// detectedLang vem do CodeEditor via callback ou via hook compartilhado

// Layout do editor
<div className="flex flex-col gap-2">
  <LanguageSelector
    detectedLang={detectedLang}
    selectedLang={selectedLang}
    onSelect={setSelectedLang}
  />
  <CodeEditor
    value={code}
    onChange={setCode}
    onDetect={setDetectedLang}
    activeLang={selectedLang ?? detectedLang}
  />
</div>
```

### Lista de linguagens suportadas no seletor

Linguagens a incluir no dropdown (mapeamento ID Shiki → label display):

| Shiki ID | Label |
|----------|-------|
| `javascript` | JavaScript |
| `typescript` | TypeScript |
| `tsx` | TSX |
| `jsx` | JSX |
| `python` | Python |
| `rust` | Rust |
| `go` | Go |
| `java` | Java |
| `kotlin` | Kotlin |
| `swift` | Swift |
| `css` | CSS |
| `scss` | SCSS |
| `html` | HTML |
| `json` | JSON |
| `yaml` | YAML |
| `sql` | SQL |
| `bash` | Bash |
| `dockerfile` | Dockerfile |
| `markdown` | Markdown |
| `php` | PHP |
| `ruby` | Ruby |
| `csharp` | C# |
| `cpp` | C++ |

---

## Considerações Técnicas

### Conflito com `CodeBlockBody` (server component)

O `CodeBlockBody` existente é um **async server component** que usa Shiki server-side. O novo editor usa Shiki **client-side com WASM**. São instâncias separadas — não há conflito.

**Regra:** Nunca importar `shiki-client.ts` dentro de arquivos sem `"use client"`.

### Debounce no highlighting

Aplicar debounce de **200ms** no `useEffect` que chama `detectLanguage()` e `highlight()`. Isso garante que ao digitar ou colar texto, a detecção e o highlight só disparam após 200ms de inatividade — evitando processamento desnecessário a cada keystroke.

O debounce se aplica tanto à detecção quanto ao highlight (podem compartilhar o mesmo timer). Ao colar (`paste` event), o debounce garante que o Shiki já recebe o texto completo.

### Tema Shiki

Usar o tema `vesper` — o mesmo usado no `CodeBlockBody` existente — para consistência visual.

### CSS do overlay

O overlay precisa de `pointer-events: none` e `user-select: none` para não interferir com o textarea. O textarea precisa de `caret-color: <cor>` para o cursor ficar visível com background transparente.

---

## Decisões de UX (respondidas)

1. **Posição do `LanguageSelector`:** Fora/acima do editor.

2. **Debounce no highlight:** Sim, aplicar debounce (~200ms) tanto na detecção quanto no highlight.

3. **Mínimo de caracteres para detectar:** `code.length >= 10` para acionar a detecção automática. Abaixo disso, manter `plaintext`.

4. **Visibilidade da detecção:** Sim — mostrar qual linguagem foi detectada, indicando "(auto)" quando for automática. Ex: badge `"TypeScript (auto)"` acima do editor que vira `"TypeScript"` quando o usuário seleciona manualmente.

5. **Sem detecção confiante:** Sempre tentar o melhor palpite — nunca mostrar `plaintext` se houver uma linguagem candidata, mesmo com baixa confiança.

---

## Layout da área do editor (atualizado)

```
┌─────────────────────────────────────────┐
│ [TypeScript (auto) ▾]                   │  ← LanguageSelector acima do editor
├─────────────────────────────────────────┤
│                                         │
│  <textarea invisível>                   │
│  <div overlay com HTML do Shiki>        │
│                                         │
│  Cole seu código aqui...                │
│                                         │
└─────────────────────────────────────────┘
[ $ roast_my_code ]   [roast mode toggle]
```

O `LanguageSelector` fica na barra acima do editor — alinhado à esquerda ou direita (a definir no layout final). Quando a detecção acontece automaticamente, mostra `"TypeScript (auto)"`. Quando o usuário seleciona manualmente, mostra só `"TypeScript"` + um botão `✕` para resetar para auto.

---

## To-dos de Implementação

- [ ] Criar `src/lib/shiki-client.ts` — singleton do Shiki WASM
- [ ] Criar `src/lib/language-detector.ts` — heurísticas de detecção
- [ ] Criar `src/components/ui/code-editor.tsx` — editor com overlay
- [ ] Criar `src/components/ui/language-selector.tsx` — seletor de linguagem
- [ ] Adicionar estilos necessários (CSS vars para o editor, caret color, overlay sync)
- [ ] Integrar `CodeEditor` + `LanguageSelector` na `src/app/page.tsx`
- [ ] Testar: paste de JS, TS, Python, JSON, HTML, CSS, SQL
- [ ] Testar: override manual de linguagem
- [ ] Testar: debounce e performance com trechos grandes
- [ ] Testar: loading state do Shiki WASM na primeira visita
- [ ] Verificar consistência visual com o `CodeBlock` existente (mesmo tema `vesper`)
- [ ] Rodar `pnpm check` (Biome) e corrigir eventuais problemas
- [ ] Rodar `pnpm build` e verificar que não há erros de build
