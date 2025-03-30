/** @format */

"use client";

import React, { useState } from "react";
import { IconPlus, IconTrash, IconLoader2 } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { RecipeType } from "./UploadButton";
import { submitManualIngredients } from "../lib/api";
import { toast } from "sonner";

const ManualIngredientForm = () => {
	const [ingredients, setIngredients] = useState<string[]>([""]);
	const [recipeType, setRecipeType] = useState<RecipeType>(undefined);
	const [loading, setLoading] = useState(false);
	const router = useRouter();

	const handleIngredientChange = (index: number, value: string) => {
		const newIngredients = [...ingredients];
		newIngredients[index] = value;
		setIngredients(newIngredients);
	};

	const addIngredient = () => {
		setIngredients([...ingredients, ""]);
	};

	const removeIngredient = (index: number) => {
		if (ingredients.length === 1) {
			// Keep at least one ingredient field
			setIngredients([""]);
			return;
		}

		const newIngredients = [...ingredients];
		newIngredients.splice(index, 1);
		setIngredients(newIngredients);
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		// Filter out empty ingredients
		const filteredIngredients = ingredients.filter((ing) => ing.trim() !== "");

		if (filteredIngredients.length === 0) {
			toast.error("Please enter at least one ingredient");
			return;
		}

		setLoading(true);

		try {
			const response = await submitManualIngredients(
				filteredIngredients,
				recipeType
			);

			if (response.status === "success") {
				// Store results in session storage
				await fetch("/api/session", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						...response,
						manual_entry: true,
					}),
				});

				// Redirect to the Gemini page
				router.push("/gemini");
			} else {
				toast.error(response.message || "Failed to generate recipe");
			}
		} catch (error) {
			console.error("Error submitting ingredients:", error);
			toast.error("An error occurred while processing your ingredients");
		} finally {
			setLoading(false);
		}
	};

	return (
		<form onSubmit={handleSubmit} className="w-full">
			<div className="mb-6">
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

			<div className="mb-6">
				<label className="block text-sm font-medium mb-2 text-neutral-700 dark:text-neutral-200">
					Ingredients
				</label>
				<div className="space-y-3">
					{ingredients.map((ingredient, index) => (
						<div key={index} className="flex items-center gap-2">
							<input
								type="text"
								value={ingredient}
								onChange={(e) => handleIngredientChange(index, e.target.value)}
								placeholder={`Ingredient ${index + 1}`}
								className="flex-1 p-3 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-800 dark:text-white"
							/>
							<button
								type="button"
								onClick={() => removeIngredient(index)}
								className="p-2 rounded-lg bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50">
								<IconTrash size={20} />
							</button>
						</div>
					))}
				</div>

				<button
					type="button"
					onClick={addIngredient}
					className="mt-3 w-full flex items-center justify-center gap-2 p-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700">
					<IconPlus size={20} />
					<span>Add Ingredient</span>
				</button>
			</div>

			<button
				type="submit"
				disabled={loading}
				className="w-full p-3 rounded-lg bg-[#EE5F4C] text-white hover:bg-[#e54c39] disabled:opacity-70 flex items-center justify-center gap-2">
				{loading ? (
					<>
						<IconLoader2 className="animate-spin" size={20} />
						<span>Generating Recipe...</span>
					</>
				) : (
					<span>Generate Recipe</span>
				)}
			</button>
		</form>
	);
};

export default ManualIngredientForm;
