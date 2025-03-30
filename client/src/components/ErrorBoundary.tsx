/** @format */

"use client";

import { useEffect, useState } from "react";

export default function ErrorBoundary({
	children,
}: {
	children: React.ReactNode;
}) {
	const [hasError, setHasError] = useState(false);

	useEffect(() => {
		const handleError = () => setHasError(true);
		window.addEventListener("error", handleError);
		return () => window.removeEventListener("error", handleError);
	}, []);

	if (hasError) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="text-center p-6 bg-red-50 dark:bg-red-900/20 rounded-lg">
					<h2 className="text-xl font-bold text-red-600 dark:text-red-400 mb-2">
						Something went wrong
					</h2>
					<p className="text-neutral-600 dark:text-neutral-300">
						Please go back and try again
					</p>
					<button
						onClick={() => window.history.back()}
						className="mt-4 px-4 py-2 bg-neutral-200 dark:bg-neutral-700 rounded-md hover:bg-neutral-300 dark:hover:bg-neutral-600">
						Go Back
					</button>
				</div>
			</div>
		);
	}

	return <>{children}</>;
}
