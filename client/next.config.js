/**
 * @format
 * @type {import('next').NextConfig}
 */

const nextConfig = {
	reactStrictMode: true,
	images: {
		domains: [
			"localhost",
			"127.0.0.1",
			"res.cloudinary.com",
			process.env.FLASK_SERVER_URL
				? new URL(process.env.FLASK_SERVER_URL).hostname
				: "",
		].filter(Boolean),
		remotePatterns: [
			{
				protocol: "http",
				hostname: "**",
			},
			{
				protocol: "https",
				hostname: "**",
			},
		],
	},
	// Make environment variables available to the browser
	env: {
		NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME:
			process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
		NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET:
			process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET,
		NEXT_PUBLIC_FLASK_SERVER_URL:
			process.env.NEXT_PUBLIC_FLASK_SERVER_URL || "http://localhost:5000",
		NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME || "MealMate",
		NEXT_PUBLIC_APP_DESCRIPTION:
			process.env.NEXT_PUBLIC_APP_DESCRIPTION || "AI-powered recipe generator",
	},
	async rewrites() {
		return [
			{
				source: "/api/:path*",
				destination: `${
					process.env.FLASK_SERVER_URL || "http://localhost:5000"
				}/api/:path*`,
			},
		];
	},
	// Add server-only packages to webpack config
	webpack: (config, { isServer }) => {
		if (!isServer) {
			// Don't resolve 'fs' module on the client to prevent this from being included
			config.resolve.fallback = {
				fs: false,
				stream: false,
				os: false,
				path: false,
			};
		}
		return config;
	},
};

module.exports = nextConfig;
