import { defaultShouldDehydrateQuery, QueryClient } from "@tanstack/react-query"

export function makeQueryClient() {
	return new QueryClient({
		defaultOptions: {
			queries: {
				staleTime: 30 * 1000,
			},
			dehydrate: {
				// Include pending queries so streaming SSR works:
				// prefetch fires on server, promise is hydrated on the client
				shouldDehydrateQuery: (query) =>
					defaultShouldDehydrateQuery(query) || query.state.status === "pending",
			},
		},
	})
}
