/** @format */

import axios from "axios";

// Create an axios instance with the base URL
const api = axios.create({
	baseURL: process.env.NEXT_PUBLIC_FLASK_SERVER_URL || "http://localhost:5000",
	headers: {
		"Content-Type": "application/json",
	},
});

// Types
export interface DetectionResult {
	label: string;
	confidence: number;
	bbox: number[];
}

export interface RecipeData {
	title: string;
	ingredients: string[];
	instructions: string[];
	serving_suggestions?: string;
	nutritional_notes?: string;
}

export interface UploadResponse {
	status: "success" | "error";
	filename?: string;
	image_url?: string;
	detections?: DetectionResult[];
	count?: number;
	recipe?: RecipeData;
	message?: string;
	no_food_detected?: boolean;
	manual_entry?: boolean;
}

export interface RecipeGenerationResponse {
	status: "success" | "error";
	recipe?: RecipeData;
	message?: string;
}

// API functions
export const uploadImage = async (
	fileOrUrl: File | string,
	generateRecipe: boolean = false,
	recipeType?: string
): Promise<UploadResponse> => {
	try {
		// Handle both file upload and URL input
		if (typeof fileOrUrl === "string") {
			// If fileOrUrl is a string, it's a Cloudinary URL
			const response = await api.post("/api/process-image", {
				image_url: fileOrUrl,
				generate_recipe: generateRecipe,
				recipe_type: recipeType || null,
			});
			return response.data;
		} else {
			// If fileOrUrl is a File, upload it directly
			const formData = new FormData();
			formData.append("file", fileOrUrl);

			if (generateRecipe) {
				formData.append("generate_recipe", "true");
			}

			if (recipeType) {
				formData.append("recipe_type", recipeType);
			}

			const response = await api.post("/api/upload", formData, {
				headers: {
					"Content-Type": "multipart/form-data",
				},
			});

			return response.data;
		}
	} catch (error) {
		if (axios.isAxiosError(error) && error.response) {
			return error.response.data as UploadResponse;
		}
		return {
			status: "error",
			message: "Network error occurred",
		};
	}
};

export const generateRecipe = async (
	detections: DetectionResult[],
	recipeType?: string
): Promise<RecipeGenerationResponse> => {
	try {
		const response = await api.post("/api/generate-recipe", {
			detections,
			recipe_type: recipeType,
		});

		return response.data;
	} catch (error) {
		if (axios.isAxiosError(error) && error.response) {
			return error.response.data as RecipeGenerationResponse;
		}
		return {
			status: "error",
			message: "Network error occurred",
		};
	}
};

export const getApiStatus = async (): Promise<{
	status: string;
	implementation: string;
	recipe_available: boolean;
	gemini_configured: boolean;
	version: string;
}> => {
	try {
		const response = await api.get("/api/status");
		return response.data;
	} catch (error) {
		throw new Error("Failed to fetch API status");
	}
};

export const submitManualIngredients = async (
	ingredients: string[],
	recipeType?: string
): Promise<UploadResponse> => {
	try {
		const response = await api.post("/api/manual-ingredients", {
			ingredients,
			recipe_type: recipeType || null,
		});

		return response.data;
	} catch (error) {
		if (axios.isAxiosError(error) && error.response) {
			return error.response.data as UploadResponse;
		}
		return {
			status: "error",
			message: "Network error occurred",
		};
	}
};

export default api;
