/** @format */

"use client";

import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { TypewriterEffectSmooth } from "@/components/ui/typewriter-effect";

export default function RecipeGenerator() {
	const [ingredients, setIngredients] = useState<string>("");
	const [recipe, setRecipe] = useState<string>("");
	const [loading, setLoading] = useState(false);
	const [displayedRecipe, setDisplayedRecipe] = useState<string>("");

	const fetchRecipe = async () => {
		setLoading(true);
		setRecipe("");
		setDisplayedRecipe("");

		try {
			const response = await fetch("/api/gemini", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ ingredients: ingredients.split(",") }),
			});

			const data = await response.json();
			if (data.recipeMarkdown) {
				setRecipe(data.recipeMarkdown);
			}
		} catch (error) {
			console.error("Error fetching recipe:", error);
			setRecipe("⚠️ Failed to generate a recipe.");
		}

		setLoading(false);
	};

	// Typing effect for smooth text reveal
	useEffect(() => {
		if (!loading && recipe) {
			let i = 0;
			const interval = setInterval(() => {
				setDisplayedRecipe((prev) => prev + recipe[i]);
				i++;
				if (i === recipe.length) clearInterval(interval);
			}, 20);
			return () => clearInterval(interval);
		}
	}, [recipe, loading]);

	return (
		<div className="flex flex-col items-center justify-center pt-20 pb-10">
			<p className="text-neutral-600 dark:text-[#FBF8F6] text-xs sm:text-base mb-2">
				Your AI-powered recipe generator! 🍽️
			</p>

	

			{/* Input Field */}
			<input
				type="text"
				placeholder="Enter ingredients (e.g., chicken, onion)..."
				value={ingredients}
				onChange={(e) => setIngredients(e.target.value)}
				className="mt-6 w-[90%] md:w-[500px] px-4 py-2 text-sm rounded-lg border border-neutral-300 dark:border-white bg-white dark:bg-[#1E1E1E] text-black dark:text-[#FBF8F6] focus:ring-2 focus:ring-[#F9C2C2] outline-none"
			/>

			{/* Generate Button */}
			<button
				onClick={fetchRecipe}
				disabled={loading}
				className="mt-4 px-6 py-2 bg-[#EE5F4C] text-white text-sm rounded-xl border dark:border-white border-transparent hover:bg-[#F97A60] transition disabled:opacity-50">
				{loading ? "Generating..." : "Get Recipe"}
			</button>

			{/* Loader */}
			{loading && (
				<p className="mt-4 text-gray-600 dark:text-[#FBF8F6] animate-pulse">
					Thinking... 🤖
				</p>
			)}

			{/* Recipe Output */}
			<div className="mt-6  w-[90%] p-4 rounded-lg bg-white dark:bg-[#1E1E1E] text-black dark:text-[#FBF8F6] border border-neutral-300 dark:border-white">
				{displayedRecipe ? (
					<ReactMarkdown>{displayedRecipe}</ReactMarkdown>
				) : (
					<p className="text-center text-neutral-500 dark:text-neutral-400">
						Your recipe will appear here! 🍲
					</p>
				)}
			</div>
		</div>
	);
}
