CREATE TYPE "public"."diff_line_type" AS ENUM('removed', 'added', 'context');--> statement-breakpoint
CREATE TYPE "public"."issue_severity" AS ENUM('critical', 'warning', 'good');--> statement-breakpoint
CREATE TYPE "public"."roast_mode" AS ENUM('honest', 'roast');--> statement-breakpoint
CREATE TYPE "public"."verdict" AS ENUM('clean_code', 'could_be_worse', 'needs_work', 'needs_serious_help', 'delete_this_now');--> statement-breakpoint
CREATE TABLE "submission_diff_lines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"submission_id" uuid NOT NULL,
	"type" "diff_line_type" NOT NULL,
	"content" text NOT NULL,
	"line_number" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "submission_issues" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"submission_id" uuid NOT NULL,
	"severity" "issue_severity" NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "submissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"lang" varchar(50),
	"line_count" integer,
	"roast_mode" "roast_mode" NOT NULL,
	"score" numeric(4, 2) NOT NULL,
	"verdict" "verdict" NOT NULL,
	"roast_quote" text NOT NULL,
	"suggested_fix" text,
	"is_public" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "submission_diff_lines" ADD CONSTRAINT "submission_diff_lines_submission_id_submissions_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."submissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submission_issues" ADD CONSTRAINT "submission_issues_submission_id_submissions_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."submissions"("id") ON DELETE cascade ON UPDATE no action;