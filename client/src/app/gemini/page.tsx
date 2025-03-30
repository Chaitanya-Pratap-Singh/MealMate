"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

type UploadResponse = {
	status: string; // Ensuring 'status' is present
	detections: any[];
	recipe: any | null;
	count: number;
	image_url: string;
};

export default function UploadResult() {
	const searchParams = useSearchParams();
	const [uploadResponse, setUploadResponse] = useState<UploadResponse | null>(
		null
	);

	useEffect(() => {
		const results = searchParams.get("results");
		if (!results) return;

		try {
			const parsedResults = JSON.parse(results);

			// Ensure required properties exist in parsedResults
			const sanitizedResults: UploadResponse = {
				status: parsedResults.status ?? "success", // Default to "success" if missing
				detections: parsedResults.detections ?? [],
				recipe: parsedResults.recipe ?? null,
				count: parsedResults.count ?? parsedResults.detections?.length ?? 0,
				image_url: parsedResults.image_url ?? "",
			};

			setUploadResponse(sanitizedResults);
		} catch (error) {
			console.error("Error parsing results:", error);
		}
	}, [searchParams]);

	if (!uploadResponse) return <p>Loading...</p>;

	return (
		<div>
			<h2>Upload Results</h2>
			<p>Status: {uploadResponse.status}</p>
			<p>Detected Items: {uploadResponse.detections.length}</p>
			<p>Recipe: {uploadResponse.recipe ? uploadResponse.recipe : "None"}</p>
			<p>Image URL: {uploadResponse.image_url}</p>
		</div>
	);
}
