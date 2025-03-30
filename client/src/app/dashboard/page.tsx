/** @format */

"use client";

import React, { useState } from "react";
import UploadButton from "../../components/UploadButton";
import ManualIngredientForm from "../../components/ManualIngredientForm";
import { IconPhoto, IconList } from "@tabler/icons-react";

const Dashboard = () => {
	const [activeTab, setActiveTab] = useState<"upload" | "manual">("upload");

	return (
		<div className="min-h-screen w-full py-8 bg-white dark:bg-[#0e2825] flex flex-col items-center justify-center">
			<div className="w-full max-w-md px-4">
				<div className="mb-8 text-center">
					<h1 className="text-3xl font-bold mb-2 text-neutral-800 dark:text-white">
						MealMate
					</h1>
					<p className="text-neutral-600 dark:text-neutral-300">
						Get recipe suggestions based on your ingredients
					</p>
				</div>

				{/* Tab Navigation */}
				<div className="flex w-full mb-6 rounded-lg overflow-hidden border border-neutral-300 dark:border-neutral-700">
					<button
						onClick={() => setActiveTab("upload")}
						className={`flex-1 py-3 px-4 flex items-center justify-center gap-2 ${
							activeTab === "upload"
								? "bg-[#EE5F4C] text-white"
								: "bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300"
						}`}>
						<IconPhoto size={20} />
						<span>Upload Image</span>
					</button>
					<button
						onClick={() => setActiveTab("manual")}
						className={`flex-1 py-3 px-4 flex items-center justify-center gap-2 ${
							activeTab === "manual"
								? "bg-[#EE5F4C] text-white"
								: "bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300"
						}`}>
						<IconList size={20} />
						<span>Type Ingredients</span>
					</button>
				</div>

				{/* Content based on active tab */}
				<div className="w-full mb-8">
					{activeTab === "upload" ? <UploadButton /> : <ManualIngredientForm />}
				</div>
			</div>
		</div>
	);
};

export default Dashboard;
