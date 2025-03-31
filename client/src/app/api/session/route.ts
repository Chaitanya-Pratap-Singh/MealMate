/** @format */

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { v4 as uuidv4 } from "uuid";

// Simple in-memory store for sessions
// In a production app, this should be a database or Redis
let sessionStore: Record<string, any> = {};

// Session expiration time (15 minutes)
const SESSION_EXPIRY = 15 * 60 * 1000;

// IMPORTANT: Only initialize timer on the server side
// This avoids hydration issues caused by different execution environments
if (typeof window === "undefined") {
	// Clean up expired sessions periodically
	setInterval(() => {
		const now = Date.now();
		Object.entries(sessionStore).forEach(([id, session]) => {
			if (session.expiresAt < now) {
				delete sessionStore[id];
			}
		});
	}, 5 * 60 * 1000); // Clean every 5 minutes
}

export async function POST(req: NextRequest) {
	try {
		const data = await req.json();

		// Get the cookie from the request headers directly
		const sessionCookie = req.cookies.get("mealmate_session");
		const sessionId = sessionCookie?.value || uuidv4();

		// Store the data with expiration time
		sessionStore[sessionId] = {
			data,
			expiresAt: Date.now() + SESSION_EXPIRY,
		};

		// Create response
		const response = NextResponse.json({ success: true, sessionId });

		// Set cookie on the response
		response.cookies.set("mealmate_session", sessionId, {
			httpOnly: true,
			maxAge: SESSION_EXPIRY / 1000,
			path: "/",
			sameSite: "strict",
		});

		return response;
	} catch (error) {
		console.error("Session storage error:", error);
		return NextResponse.json(
			{ error: "Failed to store session data" },
			{ status: 500 }
		);
	}
}

export async function GET(req: NextRequest) {
	try {
		// Get the cookie from the request headers directly
		const sessionCookie = req.cookies.get("mealmate_session");
		const sessionId = sessionCookie?.value;

		if (!sessionId || !sessionStore[sessionId]) {
			return NextResponse.json(
				{ error: "No session data found" },
				{ status: 404 }
			);
		}

		// Update expiration time
		sessionStore[sessionId].expiresAt = Date.now() + SESSION_EXPIRY;

		// Create response
		const response = NextResponse.json({
			success: true,
			data: sessionStore[sessionId].data,
		});

		// Refresh cookie
		response.cookies.set("mealmate_session", sessionId, {
			httpOnly: true,
			maxAge: SESSION_EXPIRY / 1000,
			path: "/",
			sameSite: "strict",
		});

		return response;
	} catch (error) {
		console.error("Session retrieval error:", error);
		return NextResponse.json(
			{ error: "Failed to retrieve session data" },
			{ status: 500 }
		);
	}
}
