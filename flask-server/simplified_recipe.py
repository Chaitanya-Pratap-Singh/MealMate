import os
import random
from typing import List, Dict, Any, Optional
import json

# Try to import Google Generative AI for Gemini API
try:
    import google.generativeai as genai
    GEMINI_AVAILABLE = True
except ImportError:
    GEMINI_AVAILABLE = False

# Load Gemini API key from environment
GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY')

# Fallback recipes for common ingredients
FALLBACK_RECIPES = {
    "apple": {
        "title": "Simple Apple Dessert",
        "ingredients": [
            "2 apples, sliced",
            "2 tablespoons honey or maple syrup",
            "1/2 teaspoon cinnamon",
            "1/4 cup granola",
            "Greek yogurt (optional)"
        ],
        "instructions": [
            "Slice the apples into thin pieces.",
            "Mix with honey and cinnamon.",
            "Top with granola and yogurt if desired.",
            "Serve immediately or chill for a refreshing dessert."
        ],
        "serving_suggestions": "Serve in a decorative bowl with a mint leaf for garnish.",
        "nutritional_notes": "Apples are rich in fiber and antioxidants. This dessert provides natural sweetness with minimal added sugars."
    },
    "banana": {
        "title": "Banana Smoothie Bowl",
        "ingredients": [
            "2 ripe bananas, frozen",
            "1/2 cup milk of choice",
            "1 tablespoon nut butter",
            "1/2 teaspoon vanilla extract",
            "Toppings: sliced fruits, nuts, seeds, granola"
        ],
        "instructions": [
            "Blend frozen bananas, milk, nut butter, and vanilla until smooth.",
            "Pour into a bowl.",
            "Top with your favorite toppings.",
            "Enjoy immediately."
        ],
        "serving_suggestions": "Best enjoyed fresh. Add a drizzle of honey or maple syrup for extra sweetness.",
        "nutritional_notes": "Bananas provide potassium and natural energy. This bowl makes a nutritious breakfast or post-workout snack."
    }
}

# Add more common food items for better coverage with enhanced detection
COMMON_FOODS = [
    'apple', 'orange', 'banana', 'strawberry', 'grape', 'pear', 'pineapple', 'watermelon',
    'bread', 'bun', 'cake', 'sandwich', 'pizza', 'hamburger', 'hotdog', 'donut',
    'carrot', 'broccoli', 'cucumber', 'lettuce', 'tomato', 'potato', 'onion', 'bell pepper',
    'chicken', 'beef', 'pork', 'fish', 'shrimp', 'egg',
    'rice', 'pasta', 'noodle', 'soup', 'salad',
    'coffee', 'tea', 'wine', 'juice', 'milk'
]

def setup_gemini():
    """Initialize the Gemini API with the provided key."""
    if not GEMINI_API_KEY or not GEMINI_AVAILABLE:
        return False
    
    try:
        genai.configure(api_key=GEMINI_API_KEY)
        return True
    except:
        return False

def generate_recipe(detection_results: List[Dict[str, Any]], recipe_type: Optional[str] = None) -> Dict[str, Any]:
    """
    Generate a recipe based on the detected objects in an image.
    Will use Gemini API if available, otherwise falls back to pre-defined recipes.
    
    Args:
        detection_results: List of dictionaries containing detection results.
        recipe_type: Optional type of recipe to generate.
                    
    Returns:
        Dict containing the generated recipe with title, ingredients, instructions, and notes.
    """
    try:
        # Extract food items from detection results, handle both 'label' and 'confidence' fields
        food_items = []
        for item in detection_results:
            # Get the label, could be in 'label' or 'class' field
            label = item.get('label', item.get('class', ''))
            
            # Check if it's a food item (in our fallback recipes or food categories list)
            if (label.lower() in FALLBACK_RECIPES or 
                label.lower() in COMMON_FOODS or 
                'food' in label.lower()):
                food_items.append(label.lower())
        
        # If no food items found, return a clear message instead of a generic recipe
        if not food_items:
            return {
                "title": "No Food Items Detected",
                "ingredients": [],
                "instructions": ["No recognizable food items were detected in the image."],
                "serving_suggestions": "Please try again with a clearer image of food ingredients.",
                "nutritional_notes": "Unable to generate recipe due to no food items being detected."
            }

        # Try to use Gemini API if available
        gemini_setup = GEMINI_AVAILABLE and GEMINI_API_KEY and setup_gemini()
        
        if gemini_setup:
            # Create the prompt for Gemini
            recipe_type_text = f" for a {recipe_type} dish" if recipe_type else ""
            prompt = f"""
            I have detected the following food items in an image: {', '.join(food_items)}.
            Please generate a creative recipe{recipe_type_text} using these ingredients.
            
            The recipe should include:
            1. A creative title
            2. List of ingredients (including the detected items and suggesting complementary ingredients)
            3. Step-by-step cooking instructions
            4. Serving suggestions
            5. Nutritional notes (optional)
            
            Format the response as JSON with the following structure:
            {{
                "title": "Recipe Title",
                "ingredients": ["Ingredient 1", "Ingredient 2", ...],
                "instructions": ["Step 1...", "Step 2...", ...],
                "serving_suggestions": "Suggestion text",
                "nutritional_notes": "Notes text"
            }}
            """
            
            try:
                # First try with gemini-1.0-pro or gemini-pro
                model_name = "gemini-pro" # Adjust model name based on Gemini API version
                model = genai.GenerativeModel(model_name)
                response = model.generate_content(prompt)
                
                # Parse the response
                if hasattr(response, 'text'):
                    response_text = response.text
                    
                    # Extract JSON from the response
                    if "```json" in response_text and "```" in response_text:
                        json_str = response_text.split("```json")[1].split("```")[0].strip()
                    elif "{" in response_text and "}" in response_text:
                        start = response_text.find("{")
                        end = response_text.rfind("}") + 1
                        json_str = response_text[start:end]
                    else:
                        json_str = response_text
                    
                    try:
                        recipe_data = json.loads(json_str)
                        # Return just the recipe data directly
                        return recipe_data
                    except json.JSONDecodeError:
                        # Fall back to our simplified approach
                        pass
            except Exception as e:
                print(f"Gemini API error: {str(e)}")
                # Continue to fallback method
        
        # Fallback recipe generation logic
        main_ingredient = food_items[0]  # Use the first detected food item
        
        if main_ingredient in FALLBACK_RECIPES:
            recipe = FALLBACK_RECIPES[main_ingredient]
        else:
            # Create a recipe that prominently features the detected ingredients
            recipe = {
                "title": f"{'Breakfast' if recipe_type == 'breakfast' else 'Delicious'} {' & '.join(food_items)} Recipe",
                "ingredients": [f"{food_items[i]} {'(chopped)' if i % 2 == 0 else '(whole)'}" for i in range(len(food_items))] + 
                              ["Salt and pepper to taste", "Olive oil", "Fresh herbs (optional)"],
                "instructions": [
                    f"Prepare the {', '.join(food_items)} by washing and cutting them as needed.",
                    f"Heat a pan and add a small amount of olive oil.",
                    f"Add the {food_items[0]} to the pan" + (f" followed by {', '.join(food_items[1:])}" if len(food_items) > 1 else "."),
                    "Cook until tender, stirring occasionally.",
                    "Season with salt, pepper, and your favorite herbs.",
                    f"Serve your {' & '.join(food_items)} dish hot and enjoy!"
                ],
                "serving_suggestions": f"Serve your {' & '.join(food_items)} creation with a side of your choice.",
                "nutritional_notes": f"This recipe features {', '.join(food_items)}, which provide various nutrients and flavors."
            }
            
            # Modify recipe based on recipe type if specified
            if recipe_type:
                recipe["title"] = f"{recipe_type.capitalize()} {' & '.join(food_items)} Recipe"
                
                if recipe_type == "breakfast":
                    recipe["instructions"] = [
                        f"Prepare the {', '.join(food_items)} by washing and cutting them as needed.",
                        "Heat a pan and add a small amount of butter or oil.",
                        f"Cook the {food_items[0]} until golden" + (f" along with {', '.join(food_items[1:])}" if len(food_items) > 1 else "."),
                        "Season with a pinch of salt and pepper.",
                        "Serve hot as a delicious breakfast item."
                    ]
                elif recipe_type == "dessert":
                    recipe["ingredients"].append("2 tablespoons of honey or sugar")
                    recipe["instructions"] = [
                        f"Prepare the {', '.join(food_items)} by washing and cutting them into bite-size pieces.",
                        f"Place the {food_items[0]} in a bowl" + (f" with {', '.join(food_items[1:])}" if len(food_items) > 1 else "."),
                        "Add honey or sugar and gently mix.",
                        "Refrigerate for 30 minutes before serving.",
                        "Enjoy this simple and refreshing dessert!"
                    ]
                elif recipe_type == "dinner":
                    recipe["ingredients"].append("Your choice of protein (chicken, fish, tofu)")
                    recipe["instructions"] = [
                        "Cook your protein of choice until done.",
                        f"Prepare the {', '.join(food_items)} by washing and cutting them appropriately.",
                        f"In a separate pan, sauté the {food_items[0]}" + (f" and {', '.join(food_items[1:])}" if len(food_items) > 1 else "."),
                        "Combine everything and season with salt, pepper, and herbs.",
                        "Serve hot as a complete dinner meal."
                    ]
        
        # Return just the recipe directly
        return recipe
            
    except Exception as e:
        print(f"Recipe generation error: {str(e)}")
        return None 