import { faker } from "@faker-js/faker"
import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"

import { submissionDiffLines, submissionIssues, submissions } from "./schema"

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const DATABASE_URL = process.env.DATABASE_URL
if (!DATABASE_URL) throw new Error("DATABASE_URL is not set")

const client = postgres(DATABASE_URL)
const db = drizzle(client, { casing: "snake_case" })

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const LANGS = [
	"javascript",
	"typescript",
	"python",
	"rust",
	"go",
	"java",
	"kotlin",
	"php",
	"ruby",
	"csharp",
	"cpp",
	"sql",
	"bash",
]

const VERDICTS = [
	"clean_code",
	"could_be_worse",
	"needs_work",
	"needs_serious_help",
	"delete_this_now",
] as const

const ROAST_MODES = ["honest", "roast"] as const

const ROAST_QUOTES = [
	"This code looks like it was written by someone who learned to program from a motivational poster.",
	"I've seen better structure in a bowl of spaghetti.",
	"Did you just `console.log` your way through every single function? Impressive dedication to chaos.",
	"This is the code equivalent of a cry for help.",
	"Whoever wrote this clearly believes variable names are just decorative.",
	"I've seen TODO comments before. Never an entire codebase made of them.",
	"The only thing more nested than these ifs is the developer's psychological issues.",
	"This would fail a code review at a bootcamp. A bad bootcamp.",
	"Reading this code felt like solving a mystery where the culprit is poor judgment.",
	"I'm not saying it's impossible to understand, but I did need a therapist after.",
	"If spaghetti could write code, this is what it would produce.",
	"The tests are passing. The tests are also completely wrong.",
	"This code is technically correct. That's the worst kind of correct.",
	"Somewhere, a senior engineer is crying and they don't know why. It's this.",
	"I've seen commented-out code before. Not entire commented-out architectures.",
	"You used a regex to parse HTML. We can't be friends anymore.",
	"This function does seven things. None of them well.",
	"The variable is called `data`. The function is called `doStuff`. The developer is called brave.",
	"At least it has one comment. It says `// fix later`. That was 3 years ago.",
	"Semicolons used: 0. Bugs introduced: countless.",
	"Every callback is nested inside another callback. It's callbacks all the way down.",
	"I genuinely respect the confidence it takes to push this to main.",
	"This passes lint because lint gave up halfway through.",
	"The code works on your machine. It also only works on your machine.",
	"God objects, global state, and zero tests. You absolute maverick.",
	"Mutating props directly is a choice. A wrong choice, but a choice.",
	"This is either genius or a cry for help. Statistically, it's the latter.",
	"You caught the exception and swallowed it whole. Bold. Idiotic. Bold.",
	"Magic numbers everywhere. A 42 here, a 9999 there. Delightful.",
	"The function is 400 lines long. I didn't count, I lost the will to.",
]

const ISSUE_POOL: Array<{
	severity: "critical" | "warning" | "good"
	title: string
	description: string
}> = [
	{
		severity: "critical",
		title: "using var instead of const/let",
		description:
			"All variable declarations use `var`, which has function scope and leads to subtle, hard-to-debug issues. Use `const` for immutable bindings and `let` for reassignable ones.",
	},
	{
		severity: "critical",
		title: "eval() usage detected",
		description:
			"Using `eval()` executes arbitrary strings as code and is a critical security vulnerability. It also prevents JavaScript engines from optimizing the surrounding code. Remove it entirely.",
	},
	{
		severity: "critical",
		title: "SQL query built via string concatenation",
		description:
			"Building SQL queries by concatenating user input is the textbook definition of SQL injection. Use parameterized queries or a query builder instead.",
	},
	{
		severity: "critical",
		title: "catching exceptions silently",
		description:
			"Errors are caught and discarded with an empty catch block. Silent failures are the hardest bugs to find. At minimum, log the error.",
	},
	{
		severity: "critical",
		title: "hardcoded credentials in source code",
		description:
			"Passwords, API keys, and tokens are hardcoded directly in the source. This is a severe security risk, especially if the code is version-controlled. Use environment variables.",
	},
	{
		severity: "critical",
		title: "mutating function arguments directly",
		description:
			"Function parameters are being mutated directly, causing unexpected side effects for callers. Always treat function arguments as read-only and return new values instead.",
	},
	{
		severity: "critical",
		title: "infinite recursion risk",
		description:
			"This recursive function has no guaranteed base case for certain inputs, which will cause a stack overflow at runtime. Add proper termination conditions.",
	},
	{
		severity: "critical",
		title: "using innerHTML with user input",
		description:
			"Setting `innerHTML` directly from user-controlled data opens the door to XSS attacks. Use `textContent` or sanitize the input before rendering.",
	},
	{
		severity: "warning",
		title: "no error handling on async operations",
		description:
			"Async calls have no try/catch or `.catch()` handler. Unhandled promise rejections will crash the process in Node.js and cause silent failures in browsers.",
	},
	{
		severity: "warning",
		title: "function exceeds 50 lines",
		description:
			"This function is doing too many things. Functions should have a single responsibility. Break it into smaller, focused functions that are easier to test and understand.",
	},
	{
		severity: "warning",
		title: "magic numbers without explanation",
		description:
			"Numeric literals like `86400`, `42`, and `9999` are scattered throughout the code with no context. Extract them into named constants that explain their meaning.",
	},
	{
		severity: "warning",
		title: "deeply nested conditionals",
		description:
			"Nesting if/else statements more than 3 levels deep makes code extremely hard to follow. Use early returns, guard clauses, or refactor into separate functions.",
	},
	{
		severity: "warning",
		title: "callback hell detected",
		description:
			"Multiple levels of nested callbacks make this code nearly unreadable. Use async/await or Promises to flatten the control flow.",
	},
	{
		severity: "warning",
		title: "duplicate code blocks",
		description:
			"The same logic is repeated in multiple places. Any future bug fix will require updating each copy. Extract the duplicated logic into a shared function.",
	},
	{
		severity: "warning",
		title: "mutable global state",
		description:
			"Variables defined at module scope are being mutated by multiple functions. This makes the program's behavior unpredictable and nearly impossible to test.",
	},
	{
		severity: "warning",
		title: "console.log left in production code",
		description:
			"Debug `console.log` statements were left in the code. These pollute the console output and can accidentally leak sensitive data. Remove them before shipping.",
	},
	{
		severity: "warning",
		title: "using == instead of ===",
		description:
			"Loose equality (`==`) performs type coercion, which can produce surprising results (`0 == false` is `true`). Always use strict equality (`===`) unless you have a very specific reason not to.",
	},
	{
		severity: "warning",
		title: "no input validation",
		description:
			"Function parameters are used directly without any validation. Pass unexpected types or null values and this will blow up at runtime. Validate and sanitize all inputs.",
	},
	{
		severity: "good",
		title: "function is at least named",
		description:
			"The function has a descriptive name, which helps with stack traces and makes the code somewhat self-documenting. Small victories.",
	},
	{
		severity: "good",
		title: "consistent indentation",
		description:
			"The code uses consistent indentation throughout. It's the absolute minimum bar, but it was cleared.",
	},
	{
		severity: "good",
		title: "some type annotations present",
		description:
			"At least a few type annotations were added. Not enough, and not always correct, but the intent is there.",
	},
	{
		severity: "good",
		title: "imports are organized",
		description:
			"Imports are grouped and sorted in a consistent order. This is appreciated and more common than it should be.",
	},
	{
		severity: "good",
		title: "no obvious memory leaks",
		description:
			"Event listeners and timers appear to be cleaned up properly. This is genuinely good practice and prevents a whole class of bugs.",
	},
]

// ---------------------------------------------------------------------------
// Code snippets per language
// ---------------------------------------------------------------------------

const CODE_SNIPPETS: Record<string, string[]> = {
	javascript: [
		`var getData = function() {
  var url = "https://api.example.com/data"
  var result = eval(fetch(url))
  return result
}

var processData = function(data) {
  for (var i = 0; i < data.length; i++) {
    var item = data[i]
    console.log(item)
  }
}`,
		`function doEverything(user, db, email, config, flag) {
  if (user) {
    if (user.active) {
      if (db) {
        if (db.connected) {
          db.query("SELECT * FROM users WHERE id = " + user.id, function(err, res) {
            if (!err) {
              if (res.length > 0) {
                email.send(user.email, res, function(err2) {
                  if (!err2) {
                    console.log("done")
                  }
                })
              }
            }
          })
        }
      }
    }
  }
}`,
		`const PASSWORD = "super_secret_123"
const API_KEY = "sk-live-abc123def456"

function login(user, pass) {
  if (pass == PASSWORD) {
    return true
  }
  return false
}`,
	],
	typescript: [
		`function calculate(a: any, b: any, op: any): any {
  if (op == "add") return a + b
  if (op == "sub") return a - b
  if (op == "mul") return a * b
  if (op == "div") return a / b
  return null
}

// TODO: add proper types
// TODO: add error handling
// TODO: fix the division by zero thing
// TODO: actually test this`,
		`class UserManager {
  users: any = []
  data: any = {}
  temp: any = null
  flag: any = false
  count: any = 0

  doStuff(x: any) {
    this.temp = x
    this.flag = true
    for (var i = 0; i < 9999; i++) {
      this.users.push(this.temp)
    }
    return this.users
  }
}`,
	],
	python: [
		`def get_user(id):
    query = "SELECT * FROM users WHERE id = " + str(id)
    result = db.execute(query)
    return result

def process_users():
    users = get_user("1 OR 1=1")
    for u in users:
        print(u)
        # TODO: do something with u`,
		`import os
import pickle

SECRET_KEY = "my_very_secret_key_123"
DB_PASSWORD = "password123"

def load_data(filename):
    with open(filename, 'rb') as f:
        return pickle.load(f)  # loading from untrusted source

def run_command(cmd):
    os.system(cmd)  # never do this with user input`,
	],
	rust: [
		`fn divide(a: i32, b: i32) -> i32 {
    // what could go wrong
    a / b
}

fn main() {
    let result = divide(10, 0);
    println!("Result: {}", result);

    let v: Vec<i32> = vec![1, 2, 3];
    println!("{}", v[99]);
}`,
	],
	go: [
		`func getUser(id string) User {
    query := "SELECT * FROM users WHERE id = " + id
    row := db.QueryRow(query)
    var user User
    row.Scan(&user)  // ignoring the error
    return user
}

func main() {
    user := getUser("1 OR 1=1")
    fmt.Println(user)
}`,
	],
	java: [
		`public class Main {
    static String password = "admin123";
    static int MAGIC_NUMBER = 42;

    public static void main(String[] args) {
        try {
            riskyOperation();
        } catch (Exception e) {
            // it'll be fine
        }
    }

    public static void riskyOperation() throws Exception {
        int[] arr = new int[5];
        arr[MAGIC_NUMBER] = 1;
    }
}`,
	],
	sql: [
		`SELECT * FROM users, orders, products, categories
WHERE users.id = orders.user_id
AND orders.product_id = products.id
AND 1=1
ORDER BY users.id

-- TODO: add indexes maybe
-- SELECT * is fine for now`,
		`UPDATE users SET admin = true WHERE id > 0;

DELETE FROM logs;

DROP TABLE IF EXISTS audit_trail;`,
	],
	php: [
		`<?php
$id = $_GET['id'];
$query = "SELECT * FROM users WHERE id = $id";
$result = mysql_query($query);

while ($row = mysql_fetch_array($result)) {
    echo $row['password'];  // oops
}
?>`,
	],
	bash: [
		`#!/bin/bash
# deploy script

rm -rf /
echo "Deploying..."
eval $1
sudo chmod 777 /etc/passwd
curl http://example.com/script.sh | bash`,
	],
	kotlin: [
		`fun processData(data: Any?) {
    val list = data as ArrayList<String>  // unsafe cast
    for (i in 0..list.size) {            // off-by-one
        println(list.get(i))
    }
}

var globalState = mutableListOf<String>()
var counter = 0`,
	],
	ruby: [
		`def get_users(filter)
  query = "SELECT * FROM users WHERE name = '#{filter}'"
  ActiveRecord::Base.connection.execute(query)
end

PASSWORD = "hunter2"
puts PASSWORD`,
	],
	csharp: [
		`public class DataProcessor {
    public static List<object> allData = new List<object>();

    public void Process(string input) {
        try {
            var result = JsonConvert.DeserializeObject(input);
            allData.Add(result);
        } catch {
            // swallow exception
        }
    }
}`,
	],
	cpp: [
		`#include <iostream>
#include <string.h>

void copyData(char* dest, const char* src) {
    strcpy(dest, src);  // buffer overflow waiting to happen
}

int main() {
    char buf[10];
    copyData(buf, "this string is way too long for the buffer");
    std::cout << buf << std::endl;
}`,
	],
}

// ---------------------------------------------------------------------------
// Diff snippets per lang
// ---------------------------------------------------------------------------

const DIFF_SNIPPETS: Record<
	string,
	Array<{ type: "removed" | "added" | "context"; content: string }>
> = {
	javascript: [
		{ type: "removed", content: "var getData = function() {" },
		{ type: "added", content: "async function getData() {" },
		{ type: "removed", content: "  var result = eval(fetch(url))" },
		{ type: "added", content: "  const result = await fetch(url)" },
		{ type: "context", content: "  return result.json()" },
		{ type: "context", content: "}" },
	],
	typescript: [
		{ type: "removed", content: "function calculate(a: any, b: any): any {" },
		{ type: "added", content: "function calculate(a: number, b: number): number {" },
		{ type: "removed", content: "  if (op == 'add') return a + b" },
		{ type: "added", content: '  if (op === "add") return a + b' },
		{ type: "context", content: "  return 0" },
		{ type: "context", content: "}" },
	],
	python: [
		{ type: "removed", content: '    query = "SELECT * FROM users WHERE id = " + str(id)' },
		{ type: "added", content: '    query = "SELECT * FROM users WHERE id = %s"' },
		{ type: "removed", content: "    result = db.execute(query)" },
		{ type: "added", content: "    result = db.execute(query, (id,))" },
		{ type: "context", content: "    return result" },
	],
	go: [
		{ type: "removed", content: '    query := "SELECT * FROM users WHERE id = " + id' },
		{ type: "added", content: '    query := "SELECT * FROM users WHERE id = $1"' },
		{ type: "removed", content: "    row.Scan(&user)" },
		{ type: "added", content: "    if err := row.Scan(&user); err != nil { return User{}, err }" },
		{ type: "context", content: "    return user" },
	],
	sql: [
		{ type: "removed", content: "SELECT * FROM users, orders" },
		{
			type: "added",
			content: "SELECT u.id, u.name, o.total FROM users u",
		},
		{ type: "removed", content: "WHERE 1=1" },
		{ type: "added", content: "INNER JOIN orders o ON o.user_id = u.id" },
		{ type: "added", content: "WHERE u.active = true" },
		{ type: "context", content: "ORDER BY u.id" },
	],
	default: [
		{ type: "removed", content: "// old implementation" },
		{ type: "removed", content: "var result = doUnsafeThing(input)" },
		{ type: "added", content: "// improved implementation" },
		{ type: "added", content: "const result = await doSafeThing(input)" },
		{ type: "context", content: "return result" },
	],
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function pickRandom<T>(arr: readonly T[]): T {
	return arr[Math.floor(Math.random() * arr.length)]
}

function pickRandomN<T>(arr: readonly T[], n: number): T[] {
	const shuffled = [...arr].sort(() => Math.random() - 0.5)
	return shuffled.slice(0, n)
}

function scoreToVerdict(score: number): (typeof VERDICTS)[number] {
	if (score >= 8) return "clean_code"
	if (score >= 6) return "could_be_worse"
	if (score >= 4) return "needs_work"
	if (score >= 2) return "needs_serious_help"
	return "delete_this_now"
}

function getCodeForLang(lang: string): string {
	const snippets = CODE_SNIPPETS[lang] ?? CODE_SNIPPETS["javascript"]
	return pickRandom(snippets)
}

function getDiffForLang(
	lang: string
): Array<{ type: "removed" | "added" | "context"; content: string }> {
	return DIFF_SNIPPETS[lang] ?? DIFF_SNIPPETS["default"]
}

function generateIssues(score: number) {
	const criticalPool = ISSUE_POOL.filter((i) => i.severity === "critical")
	const warningPool = ISSUE_POOL.filter((i) => i.severity === "warning")
	const goodPool = ISSUE_POOL.filter((i) => i.severity === "good")

	let criticalCount: number
	let warningCount: number
	let goodCount: number

	if (score < 2) {
		criticalCount = faker.number.int({ min: 3, max: 4 })
		warningCount = faker.number.int({ min: 1, max: 2 })
		goodCount = 0
	} else if (score < 4) {
		criticalCount = faker.number.int({ min: 2, max: 3 })
		warningCount = faker.number.int({ min: 1, max: 2 })
		goodCount = faker.number.int({ min: 0, max: 1 })
	} else if (score < 6) {
		criticalCount = faker.number.int({ min: 1, max: 2 })
		warningCount = faker.number.int({ min: 2, max: 3 })
		goodCount = faker.number.int({ min: 1, max: 2 })
	} else if (score < 8) {
		criticalCount = faker.number.int({ min: 0, max: 1 })
		warningCount = faker.number.int({ min: 1, max: 2 })
		goodCount = faker.number.int({ min: 2, max: 3 })
	} else {
		criticalCount = 0
		warningCount = faker.number.int({ min: 0, max: 1 })
		goodCount = faker.number.int({ min: 3, max: 4 })
	}

	return [
		...pickRandomN(criticalPool, Math.min(criticalCount, criticalPool.length)),
		...pickRandomN(warningPool, Math.min(warningCount, warningPool.length)),
		...pickRandomN(goodPool, Math.min(goodCount, goodPool.length)),
	]
}

// ---------------------------------------------------------------------------
// Seed
// ---------------------------------------------------------------------------

async function seed() {
	console.log("🌱 Seeding database...")

	// Clear existing data
	await db.delete(submissionDiffLines)
	await db.delete(submissionIssues)
	await db.delete(submissions)
	console.log("🗑️  Cleared existing data")

	const TOTAL = 100

	for (let i = 0; i < TOTAL; i++) {
		const lang = pickRandom(LANGS)
		const roastMode = pickRandom(ROAST_MODES)
		const code = getCodeForLang(lang)
		const lineCount = code.split("\n").length

		// Skew scores toward lower values — it's a shame leaderboard after all
		const rawRoll = Math.random()
		const skewed = rawRoll ** 0.6 // bias toward lower scores
		const score = Math.round(skewed * 10 * 100) / 100 // 0.00 – 10.00

		const verdict = scoreToVerdict(score)
		const roastQuote = pickRandom(ROAST_QUOTES)
		const isPublic = Math.random() > 0.1 // 90% public

		// Insert submission
		const [submission] = await db
			.insert(submissions)
			.values({
				code,
				lang,
				lineCount,
				roastMode: roastMode as "honest" | "roast",
				score: String(score),
				verdict: verdict as (typeof VERDICTS)[number],
				roastQuote,
				isPublic,
				createdAt: faker.date.recent({ days: 90 }),
			})
			.returning({ id: submissions.id })

		const submissionId = submission.id

		// Insert issues
		const issues = generateIssues(score)
		if (issues.length > 0) {
			await db.insert(submissionIssues).values(
				issues.map((issue, order) => ({
					submissionId,
					severity: issue.severity,
					title: issue.title,
					description: issue.description,
					order,
				}))
			)
		}

		// Insert diff lines
		const diffLines = getDiffForLang(lang)
		await db.insert(submissionDiffLines).values(
			diffLines.map((line, idx) => ({
				submissionId,
				type: line.type,
				content: line.content,
				lineNumber: idx + 1,
			}))
		)

		if ((i + 1) % 10 === 0) {
			console.log(`  ✓ ${i + 1}/${TOTAL} submissions inserted`)
		}
	}

	console.log(`\n✅ Seed complete — ${TOTAL} submissions inserted`)
	process.exit(0)
}

seed().catch((err) => {
	console.error("❌ Seed failed:", err)
	process.exit(1)
})
