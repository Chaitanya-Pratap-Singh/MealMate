/** @format */

import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";
import { marked } from "marked"; // Markdown parser

export async function POST(req: NextRequest) {
	try {
		const { ingredients } = await req.json();

		if (!ingredients || ingredients.length === 0) {
			return NextResponse.json(
				{ error: "No ingredients provided" },
				{ status: 400 }
			);
		}

		// Initialize Gemini API
		const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
		const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

		// Construct the prompt
		const prompt = `I have ${ingredients.join(
			", "
		)}. Suggest a detailed recipe using these ingredients.`;

		console.log("Prompt:", prompt);

		// Call Gemini API
		const result = await model.generateContent({
			contents: [{ role: "user", parts: [{ text: prompt }] }],
		});

		console.log("Gemini Raw Response:", result);

		// Extracting the text response safely
		const responseText =
			result?.response?.candidates?.[0]?.content?.parts?.[0]?.text;

		if (!responseText) {
			return NextResponse.json(
				{ error: "Failed to generate a recipe" },
				{ status: 500 }
			);
		}

		// Convert Markdown to HTML
		const recipeMarkdown = responseText;
		const recipeHTML = marked(recipeMarkdown);

		return NextResponse.json({ recipeMarkdown, recipeHTML });
	} catch (error) {
		console.error("API Error:", error);
		return NextResponse.json(
			{ error: "Server error", details: error },
			{ status: 500 }
		);
	}
}
