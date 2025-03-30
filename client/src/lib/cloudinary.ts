/** @format */

import axios from "axios";

/**
 * Uploads an image file to Cloudinary
 * @param file The file to upload
 * @returns The Cloudinary URL of the uploaded image
 */
export const uploadToCloudinary = async (file: File): Promise<string> => {
	try {
		const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
		const uploadPreset =
			process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "mealmate_uploads";

		console.log("Cloudinary config:", {
			cloudName: cloudName || "undefined",
			uploadPreset: uploadPreset || "undefined",
		});

		// Check if Cloudinary is configured
		if (!cloudName || cloudName === "undefined") {
			console.warn(
				"Cloudinary cloud name not found in .env file. Make sure to set NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME. Falling back to direct upload."
			);
			return "DIRECT_UPLOAD";
		}

		if (!uploadPreset || uploadPreset === "undefined") {
			console.warn(
				"Cloudinary upload preset not found in .env file. Make sure to set NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET. Falling back to direct upload."
			);
			return "DIRECT_UPLOAD";
		}

		const formData = new FormData();
		formData.append("file", file);
		formData.append("upload_preset", uploadPreset);

		const response = await axios.post(
			`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
			formData
		);

		if (response.data && response.data.secure_url) {
			return response.data.secure_url;
		} else {
			console.error("Unexpected Cloudinary response:", response.data);
			return "DIRECT_UPLOAD";
		}
	} catch (error) {
		console.error("Error uploading to Cloudinary:", error);
		console.log("Falling back to direct upload");
		return "DIRECT_UPLOAD";
	}
};
