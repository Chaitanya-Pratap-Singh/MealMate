/** @format */

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DetectionResult, RecipeData, UploadResponse } from "../../lib/api";
import Image from "next/image";
import ErrorBoundary from "../../components/ErrorBoundary";
import {
	IconArrowLeft,
	IconChefHat,
	IconListCheck,
	IconSearch,
	IconPencil,
} from "@tabler/icons-react";

export default function GeminiPage() {
	const router = useRouter();
	const [results, setResults] = useState<UploadResponse | null>(null);
	const [activeTab, setActiveTab] = useState<"detections" | "recipe">("recipe");
	const [error, setError] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [isClient, setIsClient] = useState(false);

	// Add this effect to handle client-side mounting
	useEffect(() => {
		// This marks that we're on the client side
		setIsClient(true);
	}, []);

	useEffect(() => {
		// Skip fetching data if we're not on the client yet
		if (!isClient) return;

		// Get the results from the session API instead of URL params
		const fetchSessionData = async () => {
			try {
				const response = await fetch("/api/session", {
					method: "GET",
					headers: {
						"Content-Type": "application/json",
					},
				});

				if (!response.ok) {
					throw new Error("Failed to retrieve session data");
				}

				const sessionData = await response.json();

				if (!sessionData.success || !sessionData.data) {
					setError("No results found. Please upload an image first.");
					setIsLoading(false);
					return;
				}

				const sanitizedResults = {
					...sessionData.data,
					detections: sessionData.data.detections || [],
					recipe: sessionData.data.recipe || null,
					count:
						sessionData.data.count || sessionData.data.detections?.length || 0,
					image_url: sessionData.data.image_url || "",
					status: sessionData.data.status || "success",
					no_food_detected: sessionData.data.no_food_detected || false,
					manual_entry: sessionData.data.manual_entry || false,
				} as UploadResponse;

				setResults(sanitizedResults);

				// If no recipe or food items not detected, show detections tab
				if (!sanitizedResults.recipe || sanitizedResults.no_food_detected) {
					setActiveTab("detections");
				}
			} catch (error) {
				console.error("Error fetching session data:", error);
				setError(
					"Error retrieving results. Please try uploading the image again."
				);
			} finally {
				setIsLoading(false);
			}
		};

		fetchSessionData();
	}, [isClient]); // Only run when isClient changes to true

	// Show loading placeholder until client-side code takes over
	if (!isClient) {
		return (
			<div className="min-h-screen flex items-center justify-center"></div>
		);
	}

	if (isLoading) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<p className="text-neutral-600 dark:text-white">Loading results...</p>
			</div>
		);
	}

	if (error) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="text-center p-6 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
					<h2 className="text-xl font-bold text-amber-600 dark:text-amber-400 mb-2">
						Error
					</h2>
					<p className="text-neutral-600 dark:text-neutral-300">{error}</p>
					<button
						onClick={() => router.push("/dashboard")}
						className="mt-4 px-4 py-2 bg-neutral-200 dark:bg-neutral-700 rounded-md hover:bg-neutral-300 dark:hover:bg-neutral-600">
						Go to Dashboard
					</button>
				</div>
			</div>
		);
	}

	if (!results) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<p className="text-neutral-600 dark:text-white">No results found</p>
			</div>
		);
	}

	const renderDetections = () => (
		<div className="bg-white dark:bg-neutral-800 rounded-lg shadow-lg p-6">
			<h2 className="text-xl font-bold mb-4 text-neutral-800 dark:text-white flex items-center">
				{results.manual_entry ? (
					<>
						<IconPencil className="w-5 h-5 mr-2 text-[#EE5F4C]" />
						Entered Ingredients
					</>
				) : (
					<>
						<IconSearch className="w-5 h-5 mr-2 text-[#EE5F4C]" />
						Detected Items
					</>
				)}
			</h2>

			{results.detections && results.detections.length > 0 ? (
				<div className="space-y-4">
					{results.detections.map((item, index) => (
						<div
							key={index}
							className="p-3 border border-neutral-200 dark:border-neutral-700 rounded-lg">
							<div className="flex justify-between">
								<span className="font-medium text-neutral-800 dark:text-white capitalize">
									{item.label}
								</span>
								{!results.manual_entry && (
									<span className="text-[#EE5F4C] font-medium">
										{(item.confidence * 100).toFixed(1)}%
									</span>
								)}
							</div>
							{!results.manual_entry && (
								<div className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
									Position: [
									{item.bbox && Array.isArray(item.bbox)
										? item.bbox.map((b) => b.toFixed(0)).join(", ")
										: "N/A"}
									]
								</div>
							)}
						</div>
					))}
				</div>
			) : (
				<p className="text-neutral-600 dark:text-neutral-400">
					{results.manual_entry
						? "No ingredients were entered."
						: "No items were detected in this image."}
				</p>
			)}

			{!results.recipe && !results.no_food_detected && (
				<div className="mt-6 p-4 bg-amber-50 dark:bg-amber-900/30 rounded-lg border border-amber-200 dark:border-amber-800">
					<h3 className="font-medium text-amber-800 dark:text-amber-300 mb-1">
						No Recipe Generated
					</h3>
					<p className="text-amber-700 dark:text-amber-400 text-sm">
						{results.manual_entry
							? "We couldn't generate a recipe for the entered ingredients. Try adding more ingredients."
							: "We couldn't generate a recipe for the detected items. Try uploading an image with more food ingredients."}
					</p>
				</div>
			)}

			{results.no_food_detected && (
				<div className="mt-6 p-4 bg-amber-50 dark:bg-amber-900/30 rounded-lg border border-amber-200 dark:border-amber-800">
					<h3 className="font-medium text-amber-800 dark:text-amber-300 mb-1">
						No Food Items Detected
					</h3>
					<p className="text-amber-700 dark:text-amber-400 text-sm">
						We couldn't identify any food items in this image. Please try
						uploading an image with visible food ingredients.
					</p>
				</div>
			)}
		</div>
	);

	const renderRecipe = () => {
		if (!results.recipe) return null;

		return (
			<div className="bg-white dark:bg-neutral-800 rounded-lg shadow-lg p-6">
				<h1 className="text-2xl font-bold mb-4 text-neutral-800 dark:text-white">
					{results.recipe.title}
				</h1>

				<div className="mb-6">
					<h2 className="text-lg font-medium mb-3 flex items-center text-neutral-800 dark:text-white">
						<IconListCheck className="w-5 h-5 mr-2 text-[#EE5F4C]" />
						Ingredients
					</h2>
					<ul className="space-y-2">
						{results.recipe.ingredients?.map((ingredient, index) => (
							<li key={index} className="flex items-start">
								<span className="inline-block w-2 h-2 rounded-full bg-[#EE5F4C] mt-2 mr-3"></span>
								<span className="text-neutral-700 dark:text-neutral-300">
									{ingredient}
								</span>
							</li>
						))}
					</ul>
				</div>

				<div>
					<h2 className="text-lg font-medium mb-3 text-neutral-800 dark:text-white">
						Instructions
					</h2>
					<ul className="space-y-3">
						{results.recipe.instructions?.map((instruction, index) => (
							<li key={index} className="flex items-start">
								<span className="inline-block w-2 h-2 rounded-full bg-[#EE5F4C] mt-2 mr-3"></span>
								<span className="text-neutral-700 dark:text-neutral-300">
									{instruction}
								</span>
							</li>
						))}
					</ul>
				</div>

				{results.recipe.serving_suggestions && (
					<div className="mt-6 p-4 bg-neutral-50 dark:bg-neutral-700 rounded-lg">
						<h3 className="font-medium mb-2 text-neutral-800 dark:text-white">
							Serving Suggestions
						</h3>
						<p className="text-neutral-700 dark:text-neutral-300">
							{results.recipe.serving_suggestions}
						</p>
					</div>
				)}

				{results.recipe.nutritional_notes && (
					<div className="mt-4 p-4 bg-neutral-50 dark:bg-neutral-700 rounded-lg">
						<h3 className="font-medium mb-2 text-neutral-800 dark:text-white">
							Nutritional Notes
						</h3>
						<p className="text-neutral-700 dark:text-neutral-300">
							{results.recipe.nutritional_notes}
						</p>
					</div>
				)}
			</div>
		);
	};

	return (
		<ErrorBoundary>
			<div className="container mx-auto py-8 px-4 max-w-5xl">
				<button
					onClick={() => router.push("/dashboard")}
					className="mb-6 flex items-center text-neutral-600 hover:text-neutral-800 dark:text-neutral-300 dark:hover:text-white transition-colors">
					<IconArrowLeft className="w-5 h-5 mr-2" />
					Back to Dashboard
				</button>

				<div
					className={`grid ${
						!results.image_url && !results.manual_entry
							? "md:grid-cols-1"
							: "md:grid-cols-2"
					} gap-8`}>
					{/* Image/Ingredients Column */}
					<div>
						{results.image_url && !results.manual_entry ? (
							<div className="rounded-lg overflow-hidden shadow-lg bg-white dark:bg-neutral-800">
								<div className="relative aspect-video">
									<Image
										src={results.image_url}
										alt="Uploaded image"
										fill
										className="object-cover"
									/>
								</div>
								<div className="p-4">
									<h2 className="text-lg font-medium text-neutral-800 dark:text-white mb-2">
										{results.count || 0}{" "}
										{results.count === 1 ? "item" : "items"} detected
									</h2>
									<p className="text-neutral-600 dark:text-neutral-300 text-sm">
										{results.detections && results.detections.length > 0
											? results.detections.map((item) => item.label).join(", ")
											: "No items detected"}
									</p>
								</div>
							</div>
						) : results.manual_entry ? (
							<div className="rounded-lg overflow-hidden shadow-lg bg-white dark:bg-neutral-800 p-6">
								<div className="flex items-center mb-4">
									<IconPencil className="w-5 h-5 mr-2 text-[#EE5F4C]" />
									<h2 className="text-xl font-bold text-neutral-800 dark:text-white">
										Entered Ingredients
									</h2>
								</div>

								{results.detections && results.detections.length > 0 ? (
									<ul className="space-y-2">
										{results.detections.map((item, index) => (
											<li
												key={index}
												className="flex items-center p-3 border border-neutral-200 dark:border-neutral-700 rounded-lg">
												<span className="inline-block w-2 h-2 rounded-full bg-[#EE5F4C] mr-3"></span>
												<span className="font-medium text-neutral-800 dark:text-white capitalize">
													{item.label}
												</span>
											</li>
										))}
									</ul>
								) : (
									<p className="text-neutral-600 dark:text-neutral-400">
										No ingredients were entered.
									</p>
								)}

								<div className="mt-6 p-4 bg-neutral-100 dark:bg-neutral-700 rounded-lg">
									<p className="text-sm text-neutral-600 dark:text-neutral-300">
										These ingredients were used to generate your recipe. If
										you'd like to try with different ingredients, go back to the
										dashboard.
									</p>
								</div>
							</div>
						) : null}
					</div>

					{/* Results Column */}
					<div>
						{/* Tabs */}
						<div className="flex border-b border-neutral-200 dark:border-neutral-700 mb-6">
							<button
								onClick={() => setActiveTab("recipe")}
								className={`py-2 px-4 border-b-2 font-medium text-sm flex items-center ${
									activeTab === "recipe"
										? "border-[#EE5F4C] text-[#EE5F4C]"
										: "border-transparent text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-300"
								}`}
								disabled={!results.recipe || results.no_food_detected}>
								<IconChefHat className="w-5 h-5 mr-2" />
								Recipe
							</button>
							<button
								onClick={() => setActiveTab("detections")}
								className={`py-2 px-4 border-b-2 font-medium text-sm flex items-center ${
									activeTab === "detections"
										? "border-[#EE5F4C] text-[#EE5F4C]"
										: "border-transparent text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-300"
								}`}>
								{results.manual_entry ? (
									<>
										<IconPencil className="w-5 h-5 mr-2" />
										Ingredients
									</>
								) : (
									<>
										<IconSearch className="w-5 h-5 mr-2" />
										Detections
									</>
								)}
							</button>
						</div>

						{/* Tab Content */}
						{activeTab === "recipe" ? renderRecipe() : renderDetections()}
					</div>
				</div>
			</div>
		</ErrorBoundary>
	);
}

export const dynamic = "force-dynamic";
