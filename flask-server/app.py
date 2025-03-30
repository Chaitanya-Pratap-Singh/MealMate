import os
import json
import uuid
import requests
from io import BytesIO
from flask import Flask, request, jsonify, send_from_directory, abort
from werkzeug.utils import secure_filename
from dotenv import load_dotenv
from flask_cors import CORS
import cloudinary
import cloudinary.uploader
import cloudinary.api
from PIL import Image

# Load environment variables from .env file
load_dotenv()

# Configure Cloudinary
cloudinary.config(
    cloud_name=os.environ.get('CLOUDINARY_CLOUD_NAME'),
    api_key=os.environ.get('CLOUDINARY_API_KEY'),
    api_secret=os.environ.get('CLOUDINARY_API_SECRET')
)

# Import object detection functionality
try:
    # Try to use the enhanced detection first for better accuracy
    from enhanced_detection import detect_objects
    DETECTION_FN = detect_objects
    IMPLEMENTATION = "Enhanced Food Detection"
except ImportError:
    try:
        # Fall back to simplified detection for Vercel
        from simplified_detection import detect_objects
        DETECTION_FN = detect_objects
        IMPLEMENTATION = "Simplified (Vercel)"
    except ImportError:
        try:
            from object_detection import detect_objects as torch_detect
            DETECTION_FN = torch_detect
            IMPLEMENTATION = "PyTorch"
        except ImportError:
            try:
                from cpu_mmdet_object_detection import detect_objects as mmdet_detect
                DETECTION_FN = lambda image_path: mmdet_detect(image_path, device='cpu')
                IMPLEMENTATION = "MMDetection (CPU)"
            except ImportError:
                print("WARNING: No object detection implementation found. Using fallback detection.")
                # Define a fallback detection function
                def fallback_detect(image_path):
                    return [{"label": "food", "confidence": 0.95, "bbox": [10, 10, 100, 100]}]
                DETECTION_FN = fallback_detect
                IMPLEMENTATION = "Fallback (No ML)"

# Import recipe generation functionality
try:
    # First try to import the simplified recipe generator for Vercel
    from simplified_recipe import generate_recipe as generate_recipe_fn
    RECIPE_GENERATION_AVAILABLE = True
except ImportError:
    try:
        from recipe_generator import generate_recipe as generate_recipe_fn
        RECIPE_GENERATION_AVAILABLE = True
    except ImportError:
        RECIPE_GENERATION_AVAILABLE = False
        print("WARNING: Recipe generation not available. Missing recipe modules or required dependencies.")

# Initialize Flask app
app = Flask(__name__, static_folder=None)

# Configure CORS from environment variables
cors_origins = os.environ.get('CORS_ALLOW_ORIGINS', '*')
if cors_origins != '*':
    # Split comma-separated list into array
    cors_origins = cors_origins.split(',')

CORS(app, 
    resources={r"/api/*": {"origins": cors_origins}}, 
    supports_credentials=True)

# Set secret key from environment or generate a random one
app.secret_key = os.environ.get('SECRET_KEY', os.urandom(24))

# Configure uploads and other settings
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max upload
app.config['ALLOWED_EXTENSIONS'] = {'png', 'jpg', 'jpeg'}

# Create upload directory if it doesn't exist
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

def normalize_detection_results(results):
    """
    Normalize detection results to ensure consistent field names 
    regardless of which detection method is used.
    
    Args:
        results (list): Detection results from any detection method
        
    Returns:
        list: Normalized detection results
    """
    normalized = []
    for item in results:
        # Create a new dict with standardized field names
        normalized_item = {
            # Use 'label' as the standard field name for the detected object
            'label': item.get('label', item.get('class', item.get('name', 'unknown'))),
            
            # Use 'confidence' as the standard field name for the detection score
            'confidence': item.get('confidence', item.get('score', 0.0)),
            
            # Use 'bbox' as the standard field name for bounding box
            'bbox': item.get('bbox', item.get('box', [0, 0, 0, 0]))
        }
        normalized.append(normalized_item)
    return normalized

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in app.config['ALLOWED_EXTENSIONS']

def download_image(url):
    """Download image from URL and save it to uploads folder"""
    try:
        response = requests.get(url, stream=True)
        response.raise_for_status()
        
        # Generate a unique filename
        ext = url.split('.')[-1].lower()
        if ext not in ['jpg', 'jpeg', 'png']:
            ext = 'jpg'  # Default to jpg if extension not recognized
        
        filename = f"{uuid.uuid4()}.{ext}"
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        
        # Save the image
        with open(filepath, 'wb') as f:
            for chunk in response.iter_content(1024):
                f.write(chunk)
        
        return filepath
    except Exception as e:
        print(f"Error downloading image: {e}")
        return None

@app.route('/api/status', methods=['GET'])
def api_status():
    return jsonify({
        'status': 'online',
        'implementation': IMPLEMENTATION,
        'recipe_available': RECIPE_GENERATION_AVAILABLE,
        'gemini_configured': bool(os.environ.get('GEMINI_API_KEY')),
        'version': '1.0.0',
        'env': os.environ.get('FLASK_ENV', 'production'),
        'cloudinary': bool(os.environ.get('CLOUDINARY_API_KEY'))
    })

@app.route('/api/process-image', methods=['POST'])
def process_image():
    """Process an image from a URL (Cloudinary)"""
    try:
        data = request.json
        image_url = data.get('image_url')
        # Force generate_recipe to True to always generate a recipe
        generate_recipe = True
        recipe_type = data.get('recipe_type')
        
        if not image_url:
            return jsonify({
                'status': 'error',
                'message': 'No image URL provided'
            }), 400
        
        # Download the image from the URL
        filepath = download_image(image_url)
        if not filepath:
            return jsonify({
                'status': 'error',
                'message': 'Failed to download image from URL'
            }), 400
            
        # Run object detection
        detection_results = DETECTION_FN(filepath)
        
        # Normalize results to ensure consistent field names
        detection_results = normalize_detection_results(detection_results)
        
        # Generate recipe if available, always generating a recipe for any detected items
        recipe_data = None
        no_food_detected = False
        if RECIPE_GENERATION_AVAILABLE:
            print(f"Generating recipe with type: {recipe_type}")
            recipe_data = generate_recipe_fn(detection_results, recipe_type)
            print(f"Recipe generated: {recipe_data is not None}")
            
            # Check if the recipe indicates no food items were detected
            if recipe_data and recipe_data.get('title') == "No Food Items Detected":
                no_food_detected = True
        
        # Extract just the filename from the path
        filename = os.path.basename(filepath)
        
        # Return results as JSON
        return jsonify({
            'status': 'success',
            'filename': filename,
            'image_url': image_url,  # Return the original Cloudinary URL
            'detections': detection_results,
            'count': len(detection_results),
            'recipe': recipe_data,  # This is now directly the recipe object
            'no_food_detected': no_food_detected
        })
        
    except Exception as e:
        print(f"Processing error: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': f"Processing error: {str(e)}"
        }), 500

@app.route('/api/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({
            'status': 'error',
            'message': 'No file part'
        }), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({
            'status': 'error',
            'message': 'No selected file'
        }), 400
    
    if file and allowed_file(file.filename):
        # Generate a unique filename to prevent collisions
        filename = secure_filename(file.filename)
        unique_filename = f"{str(uuid.uuid4())}_{filename}"
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], unique_filename)
        file.save(filepath)
        
        try:
            # Run object detection
            detection_results = DETECTION_FN(filepath)
            
            # Normalize results to ensure consistent field names
            detection_results = normalize_detection_results(detection_results)
            
            # Get recipe type if specified
            recipe_type = request.form.get('recipe_type', None)
            
            # Always generate recipe if available, regardless of request parameter or detection count
            recipe_data = None
            no_food_detected = False
            if RECIPE_GENERATION_AVAILABLE:
                print(f"Generating recipe with type: {recipe_type}")
                recipe_data = generate_recipe_fn(detection_results, recipe_type)
                print(f"Recipe generated: {recipe_data is not None}")
                
                # Check if the recipe indicates no food items were detected
                if recipe_data and recipe_data.get('title') == "No Food Items Detected":
                    no_food_detected = True
            
            # Return results as JSON
            return jsonify({
                'status': 'success',
                'filename': unique_filename,
                'image_url': f"/api/uploads/{unique_filename}",
                'detections': detection_results,
                'count': len(detection_results),
                'recipe': recipe_data,  # This is now directly the recipe object
                'no_food_detected': no_food_detected
            })
        except Exception as e:
            print(f"Detection error: {str(e)}")
            return jsonify({
                'status': 'error',
                'message': f"Detection error: {str(e)}"
            }), 500
    
    return jsonify({
        'status': 'error',
        'message': 'Invalid file type. Allowed types: jpg, jpeg, png'
    }), 400

@app.route('/api/uploads/<filename>')
def uploaded_file(filename):
    # For security, verify the file exists and is in the allowed uploads folder
    filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    if not os.path.exists(filepath):
        abort(404)
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

@app.route('/api/generate-recipe', methods=['POST'])
def generate_recipe_api():
    if not RECIPE_GENERATION_AVAILABLE:
        return jsonify({
            'status': 'error',
            'message': 'Recipe generation is not available'
        }), 501
    
    try:
        data = request.json
        detection_results = data.get('detections', [])
        recipe_type = data.get('recipe_type')
        
        recipe_data = generate_recipe_fn(detection_results, recipe_type)
        
        return jsonify({
            'status': 'success',
            'recipe': recipe_data
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f"Error generating recipe: {str(e)}"
        }), 500

@app.route('/api/manual-ingredients', methods=['POST'])
def manual_ingredients():
    """
    Handle manually entered ingredients and generate a recipe.
    
    Expected request format:
    {
        "ingredients": ["apple", "banana", "flour"],
        "recipe_type": "breakfast"  // optional
    }
    """
    if not RECIPE_GENERATION_AVAILABLE:
        return jsonify({
            'status': 'error',
            'message': 'Recipe generation is not available'
        }), 501
    
    try:
        data = request.json
        ingredients = data.get('ingredients', [])
        recipe_type = data.get('recipe_type')
        
        if not ingredients:
            return jsonify({
                'status': 'error',
                'message': 'No ingredients provided'
            }), 400
        
        # Convert ingredients to detection-like format for the recipe generator
        detection_results = [
            {
                'label': ingredient,
                'confidence': 0.95,  # High confidence for manual entries
                'bbox': [10, 10, 100, 100]  # Dummy bounding box
            }
            for ingredient in ingredients
        ]
        
        # Generate recipe
        recipe_data = generate_recipe_fn(detection_results, recipe_type)
        
        # Return recipe data along with formatted detection results
        return jsonify({
            'status': 'success',
            'detections': detection_results,
            'count': len(detection_results),
            'recipe': recipe_data,
            'manual_entry': True,
            'no_food_detected': False
        })
    except Exception as e:
        print(f"Manual ingredient processing error: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': f"Error processing ingredients: {str(e)}"
        }), 500

# Error handlers
@app.errorhandler(404)
def not_found(error):
    return jsonify({
        'status': 'error',
        'message': 'Resource not found'
    }), 404

@app.errorhandler(500)
def server_error(error):
    return jsonify({
        'status': 'error',
        'message': 'Internal server error'
    }), 500

# Vercel serverless function entry point
def handler(event, context):
    return app

if __name__ == '__main__':
    # Use debug mode in development
    debug_mode = os.environ.get('FLASK_ENV') == 'development'
    app.run(debug=debug_mode)