import type { Metadata } from "next"
import { Suspense } from "react"
import "./globals.css"

import { NavbarActions, NavbarLogo, NavbarRoot, NavLink } from "@/components/ui/navbar"
import { TRPCReactProvider } from "@/trpc/client"

export const metadata: Metadata = {
	title: "DevRoast",
	description: "paste your code. get roasted.",
}

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode
}>) {
	return (
		<html lang="pt-BR">
			<body>
				<Suspense>
					<TRPCReactProvider>
						<NavbarRoot>
							<NavbarLogo />
							<NavbarActions>
								<NavLink href="/leaderboard">leaderboard</NavLink>
							</NavbarActions>
						</NavbarRoot>
						{children}
					</TRPCReactProvider>
				</Suspense>
			</body>
		</html>
	)
}
