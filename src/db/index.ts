import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"

import * as relations from "@/db/relations"
import * as schema from "@/db/schema"

const client = postgres(process.env.DATABASE_URL!)

export const db = drizzle(client, {
	casing: "snake_case",
	schema: { ...schema, ...relations },
})
