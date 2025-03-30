/** @format */

import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";

// Configure Cloudinary
cloudinary.config({
	cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
	api_key: process.env.CLOUDINARY_API_KEY,
	api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Helper function to check if Cloudinary is properly configured
function isCloudinaryConfigured() {
	return (
		process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME &&
		process.env.CLOUDINARY_API_KEY &&
		process.env.CLOUDINARY_API_SECRET &&
		process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME !== "undefined" &&
		process.env.CLOUDINARY_API_KEY !== "undefined" &&
		process.env.CLOUDINARY_API_SECRET !== "undefined"
	);
}

export async function POST(request: NextRequest) {
	try {
		// Get the form data from the request
		const formData = await request.formData();
		const file = formData.get("file") as File;

		if (!file) {
			return NextResponse.json(
				{
					error: "No file provided",
				},
				{ status: 400 }
			);
		}

		// Get recipe type if provided
		const recipeType = formData.get("recipe_type") as string | null;
		const generateRecipe = formData.get("generate_recipe") === "true";
		const flaskServerUrl =
			process.env.NEXT_PUBLIC_FLASK_SERVER_URL || "http://localhost:5000";

		let cloudinaryResult = null;
		let flaskData = null;

		// Check if Cloudinary is configured
		const cloudinaryEnabled = isCloudinaryConfigured();

		// Try uploading to Cloudinary first if it's configured
		if (cloudinaryEnabled) {
			try {
				// Convert File to base64 for Cloudinary upload
				const arrayBuffer = await file.arrayBuffer();
				const buffer = Buffer.from(arrayBuffer);
				const base64 = buffer.toString("base64");
				const base64Data = `data:${file.type};base64,${base64}`;

				// Upload to Cloudinary
				const uploadResult = await cloudinary.uploader.upload(base64Data, {
					folder: "recipe-images",
					resource_type: "auto",
				});

				cloudinaryResult = {
					url: uploadResult.secure_url,
					public_id: uploadResult.public_id,
				};

				// Send Cloudinary URL to Flask server
				console.log("Sending to Flask with params:", {
					image_url: uploadResult.secure_url,
					generate_recipe: generateRecipe,
					recipe_type: recipeType || null,
				});

				const flaskResponse = await fetch(
					`${flaskServerUrl}/api/process-image`,
					{
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({
							image_url: uploadResult.secure_url,
							generate_recipe: generateRecipe,
							recipe_type: recipeType || null,
						}),
					}
				);

				flaskData = await flaskResponse.json();
				console.log("Flask response data:", flaskData);

				if (!flaskData.recipe) {
					console.log(
						"No recipe found in Flask response. Recipe field:",
						flaskData.recipe
					);
				}
			} catch (cloudinaryError) {
				console.error("Cloudinary upload failed:", cloudinaryError);
				// Continue to fallback
			}
		} else {
			console.log("Cloudinary is not configured, using direct upload to Flask");
		}

		// FALLBACK: Upload directly to Flask server if Cloudinary failed or isn't configured
		if (!flaskData) {
			console.log("Using direct upload to Flask server");

			// Create a new FormData for Flask upload
			const flaskFormData = new FormData();
			flaskFormData.append("file", file);

			if (generateRecipe) {
				flaskFormData.append("generate_recipe", "true");
				console.log("Setting generate_recipe=true in direct upload");
			}

			if (recipeType) {
				flaskFormData.append("recipe_type", recipeType);
				console.log("Setting recipe_type=", recipeType, "in direct upload");
			}

			// Make direct upload to Flask
			const directResponse = await fetch(`${flaskServerUrl}/api/upload`, {
				method: "POST",
				body: flaskFormData,
			});

			flaskData = await directResponse.json();
			console.log("Direct upload Flask response:", flaskData);

			if (flaskData.status === "success") {
				// Use Flask-provided URL
				cloudinaryResult = {
					url: `${flaskServerUrl}${flaskData.image_url}`,
					public_id: flaskData.filename,
				};
			}
		}

		if (!flaskData || flaskData.status !== "success") {
			return NextResponse.json(
				{
					status: "error",
					message: flaskData?.message || "Failed to process the image",
				},
				{ status: 500 }
			);
		}

		// Log final response structure
		console.log("Final response to client:", {
			status: "success",
			cloudinary: cloudinaryResult,
			flask_response: flaskData,
		});

		// Return the combined response
		return NextResponse.json({
			status: "success",
			cloudinary: cloudinaryResult,
			flask_response: flaskData,
		});
	} catch (error) {
		console.error("Error in upload route:", error);
		return NextResponse.json(
			{
				status: "error",
				message: "Failed to upload image",
			},
			{ status: 500 }
		);
	}
}
