/** @format */

"use client";

import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";

export default function RecipeGenerator() {
	const [ingredients, setIngredients] = useState<string>("");
	const [recipe, setRecipe] = useState<string>("");
	const [loading, setLoading] = useState(false);
	const [displayedRecipe, setDisplayedRecipe] = useState<string>("");

	const fetchRecipe = async () => {
		setLoading(true);
		setRecipe(""); // Reset previous recipe
		setDisplayedRecipe(""); // Reset typing effect

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
			setRecipe("Failed to generate a recipe.");
		}

		setLoading(false);
	};

	// Typing effect logic
	useEffect(() => {
		if (!loading && recipe) {
			let i = 0;
			const interval = setInterval(() => {
				setDisplayedRecipe((prev) => prev + recipe[i]);
				i++;
				if (i === recipe.length) clearInterval(interval);
			}, 20); // Speed of typing effect

			return () => clearInterval(interval);
		}
	}, [recipe, loading]);

	return (
		<div className="max-w-xl mx-auto p-6 bg-white rounded-lg shadow-lg">
			<h2 className="text-2xl font-semibold mb-4">AI Recipe Generator 🍽️</h2>

			{/* Input Field */}
			<input
				type="text"
				placeholder="Enter ingredients (e.g., chicken, onion)..."
				value={ingredients}
				onChange={(e) => setIngredients(e.target.value)}
				className="w-full p-2 border rounded-md focus:ring focus:ring-blue-300"
			/>

			{/* Generate Button */}
			<button
				onClick={fetchRecipe}
				disabled={loading}
				className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition">
				{loading ? "Generating..." : "Get Recipe"}
			</button>

			{/* Loader */}
			{loading && (
				<p className="mt-4 text-gray-600 animate-pulse">Thinking... 🤖</p>
			)}

			{/* Recipe Output */}
			<div className="mt-6 p-4">
				{displayedRecipe && <ReactMarkdown>{displayedRecipe}</ReactMarkdown>}
			</div>
		</div>
	);
}
