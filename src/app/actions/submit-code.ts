"use server"

type SubmitCodeInput = {
	code: string
	lang: string
	roastMode: "roast" | "honest"
}

export async function submitCode(_input: SubmitCodeInput): Promise<string> {
	// TODO: implement — stub to unblock build
	throw new Error("Not implemented")
}
