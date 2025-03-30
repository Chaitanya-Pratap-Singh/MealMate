/** @format */

"use client";
import React, { useState } from "react";
import { FileUpload } from "../components/ui/file-upload";
import { useRouter } from "next/navigation";
import { uploadImage } from "../lib/api";
import { IconLoader2 } from "@tabler/icons-react";
import { toast } from "sonner";
import { DetectionResult } from "../lib/api";

// Define recipe type options
export type RecipeType =
	| "breakfast"
	| "lunch"
	| "dinner"
	| "dessert"
	| "snack"
	| "vegetarian"
	| "vegan"
	| undefined;

// Define a type for raw detection data which might be incomplete
interface RawDetection {
	label?: string;
	confidence?: number;
	bbox?: number[];
	[key: string]: any;
}

export default function UploadButton() {
	const [loading, setLoading] = useState(false);
	const [recipeType, setRecipeType] = useState<RecipeType>(undefined);
	const [uploadStage, setUploadStage] = useState<
		"idle" | "uploading" | "processing"
	>("idle");
	const router = useRouter();

	const handleFileUpload = async (files: File[]) => {
		if (files.length === 0) return;

		setLoading(true);
		setUploadStage("uploading");

		const file = files[0];
		// Check file size (max 10MB)
		if (file.size > 10 * 1024 * 1024) {
			toast.error("File too large. Maximum size is 10MB.");
			setLoading(false);
			setUploadStage("idle");
			return;
		}

		try {
			// Create a FormData object to send the file
			const formData = new FormData();
			formData.append("file", file);

			// Add recipe type if selected
			if (recipeType) {
				formData.append("recipe_type", recipeType);
			}

			// Add generate_recipe flag
			formData.append("generate_recipe", "true");

			setUploadStage("processing");

			// Upload to our Next.js API endpoint that handles Cloudinary upload
			const uploadResponse = await fetch("/api/upload", {
				method: "POST",
				body: formData,
			});

			const response = await uploadResponse.json();
			console.log("Full response from server:", response);

			if (response.status === "success" && response.flask_response) {
				// Get the actual recipe data
				let recipeData = null;

				// Check all possible places where recipe might be in the response
				if (
					response.flask_response.recipe &&
					typeof response.flask_response.recipe === "object"
				) {
					// Direct recipe object
					recipeData = response.flask_response.recipe;
				} else if (
					response.flask_response.recipe &&
					response.flask_response.recipe.recipe
				) {
					// Nested recipe in success response
					recipeData = response.flask_response.recipe.recipe;
				}

				console.log("Extracted recipe data:", recipeData);

				// Ensure detections are properly formatted
				const detections = response.flask_response.detections || [];

				// Validate detections format
				const validatedDetections = detections.map(
					(detection: RawDetection): DetectionResult => ({
						label: detection.label || "Unknown",
						confidence: detection.confidence || 0,
						bbox:
							Array.isArray(detection.bbox) && detection.bbox.length === 4
								? detection.bbox
								: [0, 0, 0, 0],
					})
				);

				// Format the response to match the expected structure in the Gemini page
				const formattedResponse = {
					status: response.flask_response.status || "success",
					image_url:
						response.cloudinary?.url || response.flask_response.image_url || "",
					detections: validatedDetections,
					count:
						response.flask_response.count || validatedDetections.length || 0,
					recipe: recipeData,
					no_food_detected: response.flask_response.no_food_detected || false,
				};

				console.log("Sending to Gemini page:", formattedResponse);

				// Store the results in session API instead of URL parameters
				try {
					await fetch("/api/session", {
						method: "POST",
						headers: {
							"Content-Type": "application/json",
						},
						body: JSON.stringify(formattedResponse),
					});

					// Redirect to the Gemini page without URL parameters
					router.push("/gemini");
				} catch (error) {
					console.error("Failed to store session data:", error);
					toast.error("Failed to process results. Please try again.");
				}
			} else {
				console.error(
					"Error:",
					response.message || response.flask_response?.message
				);
				toast.error(
					response.message ||
						response.flask_response?.message ||
						"Failed to process the image. Please try again."
				);
			}
		} catch (error) {
			console.error("Error uploading file:", error);
			toast.error(
				"An error occurred while uploading the file. Please try again later."
			);
		} finally {
			setLoading(false);
			setUploadStage("idle");
		}
	};

	return (
		<div className="w-full">
			<div className="w-full mb-6">
				<label className="block text-sm font-medium mb-2 text-neutral-700 dark:text-neutral-200">
					Recipe Type (Optional)
				</label>
				<select
					value={recipeType || ""}
					onChange={(e) =>
						setRecipeType((e.target.value as RecipeType) || undefined)
					}
					className="w-full p-3 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-800 dark:text-white">
					<option value="">Any Recipe Type</option>
					<option value="breakfast">Breakfast</option>
					<option value="lunch">Lunch</option>
					<option value="dinner">Dinner</option>
					<option value="dessert">Dessert</option>
					<option value="snack">Snack</option>
					<option value="vegetarian">Vegetarian</option>
					<option value="vegan">Vegan</option>
				</select>
			</div>

			{loading ? (
				<div className="flex flex-col items-center">
					<IconLoader2 className="w-10 h-10 animate-spin text-[#EE5F4C]" />
					<p className="text-neutral-600 dark:text-white mt-4">
						{uploadStage === "uploading"
							? "Uploading image..."
							: "Processing your image..."}
					</p>
				</div>
			) : (
				<div className="w-full">
					<FileUpload
						onChange={handleFileUpload}
						className="border-2 border-dashed border-neutral-300 dark:border-neutral-700 hover:border-[#EE5F4C] dark:hover:border-[#EE5F4C] transition-colors duration-200"
					/>
					<p className="text-sm text-neutral-500 dark:text-neutral-400 mt-2 text-center">
						Supports JPG, PNG (max 10MB)
					</p>
				</div>
			)}
		</div>
	);
}
