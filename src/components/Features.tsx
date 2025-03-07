/** @format */

import { AnimatedTestimonials } from "@/components/ui/animated-testimonial";

export function Features() {
	const testimonials = [
		{
			quote:
				"Simply click a photo of any ingredient or dish, and our AI will suggest the perfect recipe in seconds!",
			name: "Instant Recipe Suggestions",
			designation: "",
			src: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8Zm9vZHxlbnwwfHwwfHx8MA%3D%3D",
		},
		{
			quote:
				"No more wasted ingredients! Upload an image of what’s left in your fridge, and our AI will generate meal ideas.",
			name: "Smart Ingredient Utilization",
			designation: "",
			src: "https://images.unsplash.com/photo-1484723091739-30a097e8f929?q=80&w=1547&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
		},
		{
			quote:
				"Get step-by-step cooking instructions tailored to your preferences, including dietary restrictions and cooking skill level.",
			name: "Personalized Cooking Guides",
			designation: "",
			src: "https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTZ8fGZvb2R8ZW58MHx8MHx8fDA%3D",
		},
		{
			quote:
				"Looking for healthy meal options? Our AI suggests recipes based on your nutritional goals and calorie intake.",
			name: "Health-Conscious Meal Planning",
			designation: "",
			src: "https://images.unsplash.com/photo-1498837167922-ddd27525d352?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
		},
		{
			quote:
				"Have dietary restrictions? Whether you're vegan, keto, or gluten-free, our AI suggests recipes that fit your needs.",
			name: "Dietary-Friendly Recipes",
			designation: "",
			src: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?q=80&w=2053&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
		},
	];
	return <AnimatedTestimonials testimonials={testimonials} />;
}
