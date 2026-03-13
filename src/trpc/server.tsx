import "server-only"

import { dehydrate, HydrationBoundary } from "@tanstack/react-query"
import { createTRPCOptionsProxy } from "@trpc/tanstack-react-query"
import { cache } from "react"
import { createCallerFactory, createTRPCContext } from "./init"
import { makeQueryClient } from "./query-client"
import { appRouter } from "./routers/_app"

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
	return <HydrationBoundary state={dehydrate(getQueryClient())}>{children}</HydrationBoundary>
}

// biome-ignore lint/suspicious/noExplicitAny: TanStack Query internal type — queryOptions shape is not narrowable
export function prefetch(queryOptions: any) {
	const qc = getQueryClient()
	if (queryOptions.queryKey?.[1]?.type === "infinite") {
		void qc.prefetchInfiniteQuery(queryOptions)
	} else {
		void qc.prefetchQuery(queryOptions)
	}
}
