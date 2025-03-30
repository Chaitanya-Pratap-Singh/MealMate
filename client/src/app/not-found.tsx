/** @format */

export default function NotFound() {
	return (
		<div className="min-h-screen flex items-center justify-center">
			<div className="text-center">
				<h1 className="text-3xl font-bold text-neutral-800 dark:text-white mb-4">
					Page Not Found
				</h1>
				<p className="text-neutral-600 dark:text-neutral-300 mb-6">
					The page you are looking for doesn't exist or you haven't uploaded an
					image yet.
				</p>
				<a
					href="/dashboard"
					className="px-4 py-2 bg-neutral-200 dark:bg-neutral-700 rounded-md hover:bg-neutral-300 dark:hover:bg-neutral-600">
					Go to Upload
				</a>
			</div>
		</div>
	);
}
