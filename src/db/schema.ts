import {
	boolean,
	integer,
	numeric,
	pgEnum,
	pgTable,
	text,
	timestamp,
	uuid,
	varchar,
} from "drizzle-orm/pg-core"

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export const roastModeEnum = pgEnum("roast_mode", ["honest", "roast"])

export const verdictEnum = pgEnum("verdict", [
	"clean_code",
	"could_be_worse",
	"needs_work",
	"needs_serious_help",
	"delete_this_now",
])

export const issueSeverityEnum = pgEnum("issue_severity", ["critical", "warning", "good"])

export const diffLineTypeEnum = pgEnum("diff_line_type", ["removed", "added", "context"])

// ---------------------------------------------------------------------------
// Tables
// ---------------------------------------------------------------------------

export const submissions = pgTable("submissions", {
	id: uuid().primaryKey().defaultRandom(),
	code: text().notNull(),
	lang: varchar({ length: 50 }),
	lineCount: integer(),
	roastMode: roastModeEnum().notNull(),
	score: numeric({ precision: 4, scale: 2 }).notNull(),
	verdict: verdictEnum().notNull(),
	roastQuote: text().notNull(),
	suggestedFix: text(),
	isPublic: boolean().notNull().default(true),
	createdAt: timestamp().notNull().defaultNow(),
})

export const submissionIssues = pgTable("submission_issues", {
	id: uuid().primaryKey().defaultRandom(),
	submissionId: uuid()
		.notNull()
		.references(() => submissions.id, { onDelete: "cascade" }),
	severity: issueSeverityEnum().notNull(),
	title: varchar({ length: 255 }).notNull(),
	description: text().notNull(),
	order: integer().notNull().default(0),
})

export const submissionDiffLines = pgTable("submission_diff_lines", {
	id: uuid().primaryKey().defaultRandom(),
	submissionId: uuid()
		.notNull()
		.references(() => submissions.id, { onDelete: "cascade" }),
	type: diffLineTypeEnum().notNull(),
	content: text().notNull(),
	lineNumber: integer().notNull(),
})
