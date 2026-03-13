export type LeaderboardEntry = {
	id: string
	rank: number
	score: number
	lang: string
	lines: number
	code: string
}

export const leaderboardEntries: LeaderboardEntry[] = [
	{
		id: "entry-1",
		rank: 1,
		score: 1.2,
		lang: "javascript",
		lines: 3,
		code: `eval(prompt("enter code"))
document.write(response)
// trust the user lol`,
	},
	{
		id: "entry-2",
		rank: 2,
		score: 1.8,
		lang: "typescript",
		lines: 3,
		code: `if (x == true) { return true; }
else if (x == false) { return false; }
else { return false; }`,
	},
	{
		id: "entry-3",
		rank: 3,
		score: 2.1,
		lang: "sql",
		lines: 2,
		code: `SELECT * FROM users WHERE 1=1
-- TODO: add authentication`,
	},
	{
		id: "entry-4",
		rank: 4,
		score: 2.3,
		lang: "java",
		lines: 3,
		code: `catch (e) {
  // ignore
}`,
	},
	{
		id: "entry-5",
		rank: 5,
		score: 2.5,
		lang: "javascript",
		lines: 3,
		code: `const sleep = (ms) =>
  new Date(Date.now() + ms)
  while(new Date() < end) {}`,
	},
]

export const leaderboardStats = {
	totalSubmissions: 2847,
	avgScore: 4.2,
}
