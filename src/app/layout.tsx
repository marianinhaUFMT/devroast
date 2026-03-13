import type { Metadata } from "next"
import "./globals.css"

import { NavbarActions, NavbarLogo, NavbarRoot, NavLink } from "@/components/ui/navbar"

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
				<NavbarRoot>
					<NavbarLogo />
					<NavbarActions>
						<NavLink href="/leaderboard">leaderboard</NavLink>
					</NavbarActions>
				</NavbarRoot>
				{children}
			</body>
		</html>
	)
}
