import { relations } from "drizzle-orm"

import { submissionDiffLines, submissionIssues, submissions } from "@/db/schema"

export const submissionsRelations = relations(submissions, ({ many }) => ({
	issues: many(submissionIssues),
	diffLines: many(submissionDiffLines),
}))

export const submissionIssuesRelations = relations(submissionIssues, ({ one }) => ({
	submission: one(submissions, {
		fields: [submissionIssues.submissionId],
		references: [submissions.id],
	}),
}))

export const submissionDiffLinesRelations = relations(submissionDiffLines, ({ one }) => ({
	submission: one(submissions, {
		fields: [submissionDiffLines.submissionId],
		references: [submissions.id],
	}),
}))
