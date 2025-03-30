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
} from "@tabler/icons-react";

export default function GeminiPage() {
	const router = useRouter();
	const [results, setResults] = useState<UploadResponse | null>(null);
	const [activeTab, setActiveTab] = useState<"detections" | "recipe">("recipe");
	const [error, setError] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		// Get the results from the URL search params without using useSearchParams
		const url = new URL(window.location.href);
		const resultsParam = url.searchParams.get("results");

		if (!resultsParam) {
			setError(
				"No results found in URL parameters. Please upload an image first."
			);
			setIsLoading(false);
			return;
		}

		try {
			const parsedResults = JSON.parse(decodeURIComponent(resultsParam));
			const sanitizedResults = {
				...parsedResults,
				detections: parsedResults.detections || [],
				recipe: parsedResults.recipe || null,
				count: parsedResults.count || parsedResults.detections?.length || 0,
				image_url: parsedResults.image_url || "",
				status: parsedResults.status || "success",
			} as UploadResponse;

			setResults(sanitizedResults);

			if (!sanitizedResults.recipe) {
				setActiveTab("detections");
			}
		} catch (error) {
			setError(
				"Error parsing results data. Please try uploading the image again."
			);
		} finally {
			setIsLoading(false);
		}
	}, []);

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
						Go to Upload
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
			<h2 className="text-xl font-bold mb-4 text-neutral-800 dark:text-white">
				Detected Items
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
								<span className="text-[#EE5F4C] font-medium">
									{(item.confidence * 100).toFixed(1)}%
								</span>
							</div>
							<div className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
								Position: [
								{item.bbox && Array.isArray(item.bbox)
									? item.bbox.map((b) => b.toFixed(0)).join(", ")
									: "N/A"}
								]
							</div>
						</div>
					))}
				</div>
			) : (
				<p className="text-neutral-600 dark:text-neutral-400">
					No items were detected in this image.
				</p>
			)}

			{!results.recipe && (
				<div className="mt-6 p-4 bg-amber-50 dark:bg-amber-900/30 rounded-lg border border-amber-200 dark:border-amber-800">
					<h3 className="font-medium text-amber-800 dark:text-amber-300 mb-1">
						No Recipe Generated
					</h3>
					<p className="text-amber-700 dark:text-amber-400 text-sm">
						We couldn't generate a recipe for the detected items. Try uploading
						an image with more food ingredients.
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
					<ol className="space-y-3">
						{results.recipe.instructions?.map((instruction, index) => (
							<li key={index} className="flex">
								<span className="inline-block bg-[#EE5F4C] text-white rounded-full w-6 h-6 text-sm items-center justify-center mr-3 flex-shrink-0 mt-0.5">
									{index + 1}
								</span>
								<span className="text-neutral-700 dark:text-neutral-300">
									{instruction}
								</span>
							</li>
						))}
					</ol>
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
					Back to Upload
				</button>

				<div className="grid md:grid-cols-2 gap-8">
					{/* Image Column */}
					<div>
						{results.image_url && (
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
						)}
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
								disabled={!results.recipe}>
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
								<IconSearch className="w-5 h-5 mr-2" />
								Detections
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
