/** @format */

"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
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
	const searchParams = useSearchParams();
	const router = useRouter();
	const [results, setResults] = useState<UploadResponse | null>(null);
	const [activeTab, setActiveTab] = useState<"detections" | "recipe">("recipe");
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		try {
			const resultsParam = searchParams.get("results");
			if (!resultsParam) {
				setError("No results found in URL parameters. Please upload an image.");
				return;
			}

			const parsedResults = JSON.parse(decodeURIComponent(resultsParam));

			// Ensuring all necessary properties exist
			const sanitizedResults: UploadResponse = {
				detections: parsedResults.detections ?? [],
				recipe: parsedResults.recipe ?? null,
				count: parsedResults.count ?? parsedResults.detections?.length ?? 0,
				image_url: parsedResults.image_url ?? "",
			};

			setResults(sanitizedResults);

			// If no recipe exists, switch to detections tab
			if (!sanitizedResults.recipe) {
				setActiveTab("detections");
			}
		} catch (err) {
			console.error("Error parsing results:", err);
			setError("Invalid results data. Please try uploading the image again.");
		}
	}, [searchParams]);

	const handleBackClick = () => router.push("/dashboard");

	if (error) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="text-center p-6 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
					<h2 className="text-xl font-bold text-amber-600 dark:text-amber-400 mb-2">
						Error
					</h2>
					<p className="text-neutral-600 dark:text-neutral-300">{error}</p>
					<button
						onClick={handleBackClick}
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
				<p className="text-neutral-600 dark:text-white">Loading results...</p>
			</div>
		);
	}

	return (
		<ErrorBoundary>
			<div className="container mx-auto py-8 px-4 max-w-5xl">
				<button
					onClick={handleBackClick}
					className="mb-6 flex items-center text-neutral-600 hover:text-neutral-800 dark:text-neutral-300 dark:hover:text-white transition-colors">
					<IconArrowLeft className="w-5 h-5 mr-2" />
					Back to Upload
				</button>

				<div className="grid md:grid-cols-2 gap-8">
					{/* Image Column */}
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
									{results.count} {results.count === 1 ? "item" : "items"}{" "}
									detected
								</h2>
								<p className="text-neutral-600 dark:text-neutral-300 text-sm">
									{results.detections.length > 0
										? results.detections.map((item) => item.label).join(", ")
										: "No items detected"}
								</p>
							</div>
						</div>
					)}

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
						{activeTab === "recipe" && results.recipe ? (
							<div className="bg-white dark:bg-neutral-800 rounded-lg shadow-lg p-6">
								<h1 className="text-2xl font-bold mb-4 text-neutral-800 dark:text-white">
									{results.recipe.title}
								</h1>
								{/* Recipe Details */}
								{/* Similar structure as before */}
							</div>
						) : activeTab === "detections" ? (
							<div className="bg-white dark:bg-neutral-800 rounded-lg shadow-lg p-6">
								<h2 className="text-xl font-bold mb-4 text-neutral-800 dark:text-white">
									Detected Items
								</h2>
								{/* Display detected items */}
							</div>
						) : null}
					</div>
				</div>
			</div>
		</ErrorBoundary>
	);
}
