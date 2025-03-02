/** @format */

"use client";
import React, { useState } from "react";
import { FileUpload } from "@/components/ui/file-upload";

export default function UploadButton() {
	const [files, setFiles] = useState<File[]>([]);

	const handleFileUpload = (files: File[]) => {
		setFiles(files);
		console.log(files);
	};

	return (
		<div className="fixed inset-0 bg-white dark:bg-[#0e2825] flex items-center justify-center">
			<FileUpload onChange={handleFileUpload} />
		</div>
	);
}
