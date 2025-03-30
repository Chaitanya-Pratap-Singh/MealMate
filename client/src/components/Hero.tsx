/** @format */

"use client";
import { TypewriterEffectSmooth } from "../components/ui/typewriter-effect";
import { useRouter } from "next/navigation";

export function Hero() {
	const router = useRouter();

	const handleClick = () => {
		router.push("/dashboard");
	};
	const words = [
		{
			text: "Cook",
		},
		{
			text: "awesome",
		},
		{
			text: "food",
		},
		{
			text: "with",
		},
		{
			text: "MealMate.",
			className: "text-[#F9C2C2] dark:text-[#F9C2C2]",
		},
	];
	return (
		<div className="flex flex-col items-center justify-center pt-[10rem] pb-[5rem]">
			<p className="text-neutral-600 dark:text-[#FBF8F6] text-xs sm:text-base  ">
				Your smart companion for delicious meal ideas!
			</p>
			<TypewriterEffectSmooth words={words} />
			<div className="flex flex-col md:flex-row space-y-4 md:space-y-0 space-x-0 md:space-x-4">
				<button
					onClick={handleClick}
					className="w-40 h-10 rounded-xl bg-[#EE5F4C] border dark:border-white border-transparent text-[#FBF8F6] text-sm cursor-pointer">
					Start Cooking
				</button>
			</div>
		</div>
	);
}
