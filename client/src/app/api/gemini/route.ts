/** @format */

import { NextRequest, NextResponse } from "next/server";

const FLASK_SERVER_URL =
	process.env.FLASK_SERVER_URL || "http://127.0.0.1:5000";

export async function POST(req: NextRequest) {
	try {
		const body = await req.json();

		// Forward the request to the Flask server
		const flaskResponse = await fetch(`${FLASK_SERVER_URL}/upload`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(body),
		});

		const data = await flaskResponse.json();

		// Return the response from the Flask server
		return NextResponse.json(data, { status: flaskResponse.status });
	} catch (error) {
		console.error("Error forwarding request to Flask server:", error);
		return NextResponse.json(
			{ error: "Failed to communicate with the Flask server" },
			{ status: 500 }
		);
	}
}
