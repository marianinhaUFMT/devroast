import type { ReactNode } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CardBadge, CardDescription, CardRoot, CardTitle } from "@/components/ui/card"
import { CodeBlockBody, CodeBlockRoot } from "@/components/ui/code-block"
import { DiffLine } from "@/components/ui/diff-line"
import {
	LeaderboardRowCode,
	LeaderboardRowLang,
	LeaderboardRowRank,
	LeaderboardRowRoot,
	LeaderboardRowScore,
} from "@/components/ui/leaderboard-row"
import { NavbarActions, NavbarLogo, NavbarRoot, NavLink } from "@/components/ui/navbar"
import { ScoreRing } from "@/components/ui/score-ring"
import { Toggle } from "@/components/ui/toggle"

function Section({ title, children }: { title: string; children: ReactNode }) {
	return (
		<section className="flex flex-col gap-4">
			<h2 className="border-b border-border-primary pb-2 font-mono text-xs uppercase tracking-widest text-text-secondary">
				{title}
			</h2>
			<div className="flex flex-wrap items-start gap-3">{children}</div>
		</section>
	)
}

function ComponentBlock({ title, children }: { title: string; children: ReactNode }) {
	return (
		<div className="flex flex-col gap-6">
			<h2 className="font-mono text-lg font-medium text-text-primary">{title}</h2>
			{children}
		</div>
	)
}

const SAMPLE_CODE = `function calculateTotal(items) {
  var total = 0;
  for (let i = 0; i < items.length; i++) {
    total += items[i].price;
  }
  return total;
}`

export default function UIPreviewPage() {
	return (
		<main className="min-h-screen bg-bg-page p-16">
			<div className="mx-auto flex max-w-3xl flex-col gap-12">
				<header className="flex flex-col gap-1">
					<h1 className="font-mono text-2xl font-semibold text-text-primary">UI Components</h1>
					<p className="font-mono text-sm text-text-secondary">Visual reference for all variants</p>
				</header>

				{/* Button */}
				<ComponentBlock title="Button">
					<Section title="variant">
						<Button variant="primary">primary</Button>
						<Button variant="secondary">secondary</Button>
						<Button variant="ghost">ghost</Button>
						<Button variant="outline">outline</Button>
						<Button variant="danger">danger</Button>
					</Section>
					<Section title="size">
						<Button size="sm">small</Button>
						<Button size="md">medium</Button>
						<Button size="lg">large</Button>
					</Section>
					<Section title="disabled">
						<Button variant="primary" disabled>
							primary
						</Button>
						<Button variant="secondary" disabled>
							secondary
						</Button>
						<Button variant="ghost" disabled>
							ghost
						</Button>
						<Button variant="outline" disabled>
							outline
						</Button>
						<Button variant="danger" disabled>
							danger
						</Button>
					</Section>
				</ComponentBlock>

				{/* Badge */}
				<ComponentBlock title="Badge">
					<Section title="variant">
						<Badge variant="critical" label="critical" />
						<Badge variant="warning" label="warning" />
						<Badge variant="good" label="good" />
						<Badge variant="critical" label="needs_serious_help" />
					</Section>
				</ComponentBlock>

				{/* Toggle */}
				<ComponentBlock title="Toggle">
					<Section title="state">
						<Toggle defaultChecked={false} />
						<Toggle defaultChecked={true} />
					</Section>
				</ComponentBlock>

				{/* Card — composition pattern */}
				<ComponentBlock title="Card">
					<Section title="composition">
						<CardRoot className="max-w-[480px]">
							<CardBadge variant="critical" />
							<CardTitle>using var instead of const/let</CardTitle>
							<CardDescription>
								the var keyword is function-scoped rather than block-scoped, which can lead to
								unexpected behavior and bugs. modern javascript uses const for immutable bindings
								and let for mutable ones.
							</CardDescription>
						</CardRoot>
						<CardRoot className="max-w-[480px]">
							<CardBadge variant="warning" />
							<CardTitle>missing error handling in async functions</CardTitle>
							<CardDescription>
								async functions can throw errors that are silently swallowed without try/catch
								blocks or .catch() handlers.
							</CardDescription>
						</CardRoot>
						<CardRoot className="max-w-[480px]">
							<CardBadge variant="good" />
							<CardTitle>good use of destructuring</CardTitle>
							<CardDescription>
								destructuring assignment is used correctly here to extract values from objects and
								arrays.
							</CardDescription>
						</CardRoot>
					</Section>
				</ComponentBlock>

				{/* CodeBlock — composition pattern */}
				<ComponentBlock title="CodeBlock">
					<Section title="javascript">
						<CodeBlockRoot className="w-full max-w-[560px]">
							<div className="flex h-10 items-center gap-3 border-b border-border-primary px-4">
								<span className="size-[10px] rounded-full bg-accent-red" />
								<span className="size-[10px] rounded-full bg-accent-amber" />
								<span className="size-[10px] rounded-full bg-accent-green" />
								<span className="flex-1" />
								<span className="font-mono text-xs text-text-tertiary">calculate.js</span>
							</div>
							<CodeBlockBody code={SAMPLE_CODE} lang="javascript" />
						</CodeBlockRoot>
					</Section>
				</ComponentBlock>

				{/* DiffLine */}
				<ComponentBlock title="DiffLine">
					<Section title="variant">
						<div className="w-full max-w-[560px] overflow-hidden border border-border-primary">
							<DiffLine variant="removed" code="var total = 0;" />
							<DiffLine variant="added" code="const total = 0;" />
							<DiffLine variant="context" code="for (let i = 0; i < items.length; i++) {" />
						</div>
					</Section>
				</ComponentBlock>

				{/* LeaderboardRow — composition pattern */}
				<ComponentBlock title="LeaderboardRow">
					<Section title="composition">
						<div className="w-full overflow-hidden border border-border-primary">
							<LeaderboardRowRoot>
								<LeaderboardRowRank variant="highlight">1</LeaderboardRowRank>
								<LeaderboardRowScore variant="critical">2.1</LeaderboardRowScore>
								<LeaderboardRowCode>
									<span className="font-mono text-xs text-text-primary">
										function calculateTotal(items) {"{ var total = 0; ..."}
									</span>
								</LeaderboardRowCode>
								<LeaderboardRowLang>javascript</LeaderboardRowLang>
							</LeaderboardRowRoot>
							<LeaderboardRowRoot>
								<LeaderboardRowRank>2</LeaderboardRowRank>
								<LeaderboardRowScore variant="warning">4.5</LeaderboardRowScore>
								<LeaderboardRowCode>
									<span className="font-mono text-xs text-text-primary">
										def process_data(df): return df.dropna().reset_index() ...
									</span>
								</LeaderboardRowCode>
								<LeaderboardRowLang>python</LeaderboardRowLang>
							</LeaderboardRowRoot>
							<LeaderboardRowRoot>
								<LeaderboardRowRank>3</LeaderboardRowRank>
								<LeaderboardRowScore variant="good">7.8</LeaderboardRowScore>
								<LeaderboardRowCode>
									<span className="font-mono text-xs text-text-primary">
										{"const fetchUser = async (id) => await api.get(`/users/${id}`) ..."}
									</span>
								</LeaderboardRowCode>
								<LeaderboardRowLang>typescript</LeaderboardRowLang>
							</LeaderboardRowRoot>
						</div>
					</Section>
				</ComponentBlock>

				{/* Navbar — composition pattern */}
				<ComponentBlock title="Navbar">
					<Section title="composition">
						<NavbarRoot className="max-w-[560px]">
							<NavbarLogo />
							<span className="flex-1" />
							<NavbarActions>
								<NavLink href="#">leaderboard</NavLink>
							</NavbarActions>
						</NavbarRoot>
					</Section>
				</ComponentBlock>

				{/* ScoreRing */}
				<ComponentBlock title="ScoreRing">
					<Section title="scores">
						<ScoreRing score={3.5} />
						<ScoreRing score={6} />
						<ScoreRing score={9} />
					</Section>
				</ComponentBlock>
			</div>
		</main>
	)
}
