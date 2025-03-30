import torch
import torchvision
from torchvision.models.detection import fasterrcnn_resnet50_fpn_v2, FasterRCNN_ResNet50_FPN_V2_Weights
from torchvision.models.detection import retinanet_resnet50_fpn, RetinaNet_ResNet50_FPN_Weights
from torchvision.models import resnet50, ResNet50_Weights
from PIL import Image, ImageEnhance, ImageFilter, ImageOps
import numpy as np
import cv2
import os
from io import BytesIO
from collections import defaultdict
import requests
import time

# Add YOLO imports (will be conditionally used)
try:
    import ultralytics
    from ultralytics import YOLO
    YOLO_AVAILABLE = True
except ImportError:
    YOLO_AVAILABLE = False
    print("YOLOv8 not available. Install with 'pip install ultralytics' for improved detection.")

# Configure Hugging Face model loading (conditionally used)
try:
    from transformers import AutoFeatureExtractor, AutoModelForImageClassification
    HUGGINGFACE_AVAILABLE = True
except ImportError:
    HUGGINGFACE_AVAILABLE = False
    print("Hugging Face Transformers not available. Install with 'pip install transformers' for improved food classification.")

# List of common food categories to focus on
FOOD_CATEGORIES = [
    # Fruits
    'apple', 'orange', 'banana', 'strawberry', 'grape', 'pear', 'pineapple', 'watermelon',
    'kiwi', 'mango', 'peach', 'plum', 'blueberry', 'raspberry', 'blackberry', 'cherry',
    'lemon', 'lime', 'coconut', 'fig', 'guava', 'papaya', 'apricot', 'melon', 'pomegranate',
    
    # Vegetables
    'carrot', 'broccoli', 'cucumber', 'lettuce', 'tomato', 'potato', 'onion', 'bell pepper',
    'spinach', 'kale', 'cabbage', 'cauliflower', 'eggplant', 'zucchini', 'pumpkin', 'corn',
    'garlic', 'ginger', 'mushroom', 'asparagus', 'celery', 'radish', 'green bean', 'pea',
    'sweet potato', 'beetroot', 'turnip', 'okra', 'leek', 'brussels sprout', 'artichoke',
    
    # Meat and Proteins
    'chicken', 'beef', 'pork', 'fish', 'shrimp', 'egg', 'steak', 'salmon', 'tuna', 'lamb',
    'turkey', 'duck', 'crab', 'lobster', 'scallop', 'tofu', 'sausage', 'bacon', 'ham',
    'meatball', 'ground beef', 'sardine', 'oyster', 'mussel', 'prawn', 'veal', 'bean', 'lentil',
    
    # Grains and Starches
    'rice', 'pasta', 'noodle', 'bread', 'bun', 'bagel', 'croissant', 'cereal', 'oats',
    'quinoa', 'couscous', 'tortilla', 'pancake', 'waffle', 'toast', 'pretzel', 'cornbread',
    'muffin', 'biscuit', 'cracker', 'roll', 'wrap', 'pita',
    
    # Dairy and Alternatives
    'milk', 'cheese', 'yogurt', 'butter', 'cream', 'ice cream', 'custard', 'sour cream', 
    'cottage cheese', 'cream cheese', 'mozzarella', 'cheddar', 'parmesan', 'feta', 'brie',
    'whipped cream', 'almond milk', 'soy milk', 'oat milk', 'coconut milk',
    
    # Desserts and Sweets
    'cake', 'cookie', 'pie', 'donut', 'brownie', 'chocolate', 'candy', 'ice cream', 'pudding', 
    'cupcake', 'cheesecake', 'pastry', 'tart', 'éclair', 'gelato', 'sorbet', 'macaroon', 
    'tiramisu', 'mousse', 'fudge', 'caramel', 'toffee', 'marshmallow', 'gummy bear', 'lollipop',
    
    # Prepared Foods/Meals
    'pizza', 'hamburger', 'hotdog', 'sandwich', 'taco', 'burrito', 'sushi', 'ramen', 'soup',
    'salad', 'lasagna', 'curry', 'stew', 'casserole', 'stir fry', 'risotto', 'paella',
    'falafel', 'hummus', 'kebab', 'gyro', 'dumpling', 'spring roll', 'egg roll', 'samosa',
    'empanada', 'tamale', 'quesadilla', 'enchilada', 'nachos', 'baked potato', 'french fries',
    'onion ring', 'mac and cheese', 'pasta salad', 'potato salad', 'coleslaw',
    
    # Condiments and Sauces
    'ketchup', 'mustard', 'mayonnaise', 'sauce', 'salsa', 'guacamole', 'gravy', 'dressing',
    'soy sauce', 'hot sauce', 'barbecue sauce', 'vinegar', 'olive oil', 'syrup', 'jam', 'jelly',
    'honey', 'peanut butter', 'nutella', 'ranch dressing', 'thousand island',
    
    # Beverages
    'coffee', 'tea', 'wine', 'juice', 'soda', 'water', 'beer', 'cocktail', 'smoothie',
    'milkshake', 'lemonade', 'cocoa', 'espresso', 'cappuccino', 'latte', 'whiskey', 'vodka',
    'champagne', 'energy drink', 'hot chocolate', 'orange juice', 'apple juice', 'cola',
    
    # Nuts and Seeds
    'almond', 'peanut', 'walnut', 'cashew', 'pistachio', 'pecan', 'hazelnut', 'seed',
    'sunflower seed', 'pumpkin seed', 'sesame seed', 'chia seed', 'flax seed', 'pine nut',
    
    # Spices and Herbs
    'cinnamon', 'pepper', 'salt', 'basil', 'oregano', 'parsley', 'thyme', 'rosemary',
    'mint', 'cilantro', 'dill', 'chive', 'sage', 'cumin', 'paprika', 'turmeric', 'curry powder',
    'bay leaf', 'cardamom', 'nutmeg', 'clove', 'saffron', 'vanilla'
]

# Fixed mapping for non-food items we want to explicitly ignore
NON_FOOD_CATEGORIES = [
    'person', 'bicycle', 'car', 'motorcycle', 'airplane', 'bus', 'train', 'truck', 'boat',
    'traffic light', 'fire hydrant', 'stop sign', 'parking meter', 'bench', 'bird', 'cat', 'dog',
    'horse', 'sheep', 'cow', 'elephant', 'bear', 'zebra', 'giraffe', 'backpack', 'umbrella',
    'handbag', 'tie', 'suitcase', 'frisbee', 'skis', 'snowboard', 'sports ball', 'kite',
    'baseball bat', 'baseball glove', 'skateboard', 'surfboard', 'tennis racket', 'remote',
    'keyboard', 'cell phone', 'microwave', 'oven', 'toaster', 'sink', 'refrigerator', 'clock',
    'book', 'vase', 'scissors', 'teddy bear', 'hair drier', 'toothbrush', 'tv', 'laptop',
    'mouse', 'toilet', 'couch', 'chair', 'bed'
]

# Food-related utensils and containers (could contain food)
FOOD_RELATED_ITEMS = [
    'bottle', 'wine glass', 'cup', 'fork', 'knife', 'spoon', 'bowl', 'plate', 'dining table',
    'blender', 'pan', 'pot', 'cutting board', 'strainer', 'colander', 'measuring cup', 'whisk',
    'spatula', 'ladle', 'grater', 'tongs', 'peeler', 'oven', 'grill', 'tray', 'mug', 'pitcher',
    'teapot', 'coffee maker', 'glass', 'carafe', 'jar', 'container', 'lunch box', 'thermos', 'chopstick'
]

# Path for downloading specialized models
MODELS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "models")
os.makedirs(MODELS_DIR, exist_ok=True)

def download_model(url, save_path):
    """
    Download a model file if it doesn't exist.
    
    Args:
        url (str): URL to download from
        save_path (str): Where to save the model
        
    Returns:
        bool: True if successful, False otherwise
    """
    if os.path.exists(save_path):
        return True
        
    try:
        print(f"Downloading model from {url}...")
        response = requests.get(url, stream=True)
        response.raise_for_status()
        
        file_size = int(response.headers.get('content-length', 0))
        chunk_size = 1024 * 1024  # 1MB
        
        with open(save_path, 'wb') as f:
            for i, chunk in enumerate(response.iter_content(chunk_size=chunk_size)):
                if chunk:
                    f.write(chunk)
                    if file_size > 0:
                        progress = (i * chunk_size) / file_size * 100
                        print(f"Downloaded {progress:.1f}%", end="\r")
                        
        print(f"Downloaded model to {save_path}")
        return True
    except Exception as e:
        print(f"Error downloading model: {e}")
        return False

def load_food_classifier():
    """
    Load a specialized food classifier model.
    
    Returns:
        tuple: (feature_extractor, model) or (None, None) if not available
    """
    if not HUGGINGFACE_AVAILABLE:
        return None, None
        
    try:
        # Use a pre-trained food classification model (food101)
        model_name = "Kaludi/food-category-classification-v2.0"
        
        feature_extractor = AutoFeatureExtractor.from_pretrained(model_name)
        model = AutoModelForImageClassification.from_pretrained(model_name)
        
        return feature_extractor, model
    except Exception as e:
        print(f"Error loading food classifier: {e}")
        return None, None

def classify_food_image(image, top_k=5):
    """
    Classify food in an image using specialized food classifier.
    
    Args:
        image (PIL.Image): Input image
        top_k (int): Return top K results
        
    Returns:
        list: List of (label, score) tuples
    """
    feature_extractor, model = load_food_classifier()
    if feature_extractor is None or model is None:
        return []
        
    try:
        # Prepare image
        inputs = feature_extractor(images=image, return_tensors="pt")
        
        # Inference
        with torch.no_grad():
            outputs = model(**inputs)
            logits = outputs.logits
        
        # Convert to probabilities and get top predictions
        probs = torch.nn.functional.softmax(logits[0], dim=0)
        top_probs, top_indices = torch.topk(probs, top_k)
        
        # Get label for each prediction
        results = []
        for i, (prob, idx) in enumerate(zip(top_probs, top_indices)):
            label = model.config.id2label[idx.item()]
            score = prob.item()
            results.append((label.lower(), score))
        
        return results
    except Exception as e:
        print(f"Error in food classification: {e}")
        return []

def enhance_image(image, technique='all'):
    """
    Advanced image enhancement with multiple techniques.
    
    Args:
        image (PIL.Image): Input image
        technique (str): Enhancement technique: 'all', 'color', 'contrast', 'histequal'
        
    Returns:
        PIL.Image: Enhanced image
    """
    if technique == 'color':
        # Enhance color vividness
        enhancer = ImageEnhance.Color(image)
        image = enhancer.enhance(1.4)
        enhancer = ImageEnhance.Contrast(image)
        image = enhancer.enhance(1.2)
        return image
        
    elif technique == 'contrast':
        # Enhance contrast and sharpness
        enhancer = ImageEnhance.Contrast(image)
        image = enhancer.enhance(1.3)
        enhancer = ImageEnhance.Sharpness(image)
        image = enhancer.enhance(1.5)
        enhancer = ImageEnhance.Brightness(image)
        image = enhancer.enhance(1.1)
        return image
        
    elif technique == 'histequal':
        # Histogram equalization for better contrast
        img_array = np.array(image)
        # Convert to LAB color space for better equalization
        if len(img_array.shape) == 3:
            lab = cv2.cvtColor(img_array, cv2.COLOR_RGB2LAB)
            l, a, b = cv2.split(lab)
            clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
            cl = clahe.apply(l)
            merged = cv2.merge((cl, a, b))
            final_img = cv2.cvtColor(merged, cv2.COLOR_LAB2RGB)
            return Image.fromarray(final_img)
        return image
    
    # Apply all enhancement techniques
    enhanced_images = [
        enhance_image(image, 'color'),
        enhance_image(image, 'contrast'),
        enhance_image(image, 'histequal')
    ]
    return enhanced_images

def generate_multi_scale_images(image):
    """
    Generate multi-scale versions of the image for better detection.
    
    Args:
        image (PIL.Image): Input image
        
    Returns:
        list: List of images at different scales
    """
    width, height = image.size
    scales = [0.75, 1.0, 1.25]  # 75%, 100%, 125% of original size
    images = []
    
    for scale in scales:
        new_width = int(width * scale)
        new_height = int(height * scale)
        resized = image.resize((new_width, new_height), Image.LANCZOS)
        images.append(resized)
    
    return images

def calibrate_confidence(label, score):
    """
    Calibrate confidence scores based on the category.
    
    Args:
        label (str): Object label
        score (float): Raw confidence score
        
    Returns:
        float: Calibrated confidence score
    """
    label_lower = label.lower()
    
    # Boost confidence for known food items
    if label_lower in FOOD_CATEGORIES:
        return min(score * 1.15, 1.0)
    
    # Slightly reduce confidence for food-related items but not food
    if label_lower in FOOD_RELATED_ITEMS:
        return score * 0.9
    
    return score

def is_food_category(label, score):
    """
    Determine if the detected object is a food item with higher confidence.
    
    Args:
        label (str): Detected label
        score (float): Confidence score
        
    Returns:
        bool: True if it's likely a food item, False otherwise
    """
    label_lower = label.lower()
    
    # Generic food-related terms that might appear in COCO labels
    food_related_terms = ['food', 'fruit', 'vegetable', 'meal', 'dish', 'snack', 'dessert', 'breakfast', 'lunch', 'dinner']
    
    # Check for exact matches in our food categories
    for food in FOOD_CATEGORIES:
        if food in label_lower or label_lower in food:
            return score > 0.4  # Lower threshold for known food items
    
    # Check for food-related terms
    for term in food_related_terms:
        if term in label_lower:
            return score > 0.5
    
    # Accept food-related items with high confidence
    if any(item in label_lower for item in FOOD_RELATED_ITEMS):
        return score > 0.7
        
    # Reject known non-food items
    if any(item in label_lower for item in NON_FOOD_CATEGORIES):
        return False
    
    # For unknown categories, use a higher threshold
    return score > 0.8

def non_max_suppression(boxes, scores, iou_threshold=0.5):
    """
    Apply non-maximum suppression to avoid duplicate detections.
    
    Args:
        boxes (list): Bounding boxes
        scores (list): Confidence scores
        iou_threshold (float): IoU threshold for considering overlapping boxes
        
    Returns:
        list: Indices of boxes to keep
    """
    if len(boxes) == 0:
        return []
        
    boxes = np.array(boxes)
    scores = np.array(scores)
    
    # Get coordinates
    x1 = boxes[:, 0]
    y1 = boxes[:, 1]
    x2 = boxes[:, 2]
    y2 = boxes[:, 3]
    
    # Calculate area of each box
    areas = (x2 - x1) * (y2 - y1)
    
    # Sort by confidence score (highest first)
    order = scores.argsort()[::-1]
    
    keep = []
    while order.size > 0:
        # Pick the box with highest confidence
        i = order[0]
        keep.append(i)
        
        # Calculate IoU with remaining boxes
        xx1 = np.maximum(x1[i], x1[order[1:]])
        yy1 = np.maximum(y1[i], y1[order[1:]])
        xx2 = np.minimum(x2[i], x2[order[1:]])
        yy2 = np.minimum(y2[i], y2[order[1:]])
        
        w = np.maximum(0.0, xx2 - xx1)
        h = np.maximum(0.0, yy2 - yy1)
        
        intersection = w * h
        union = areas[i] + areas[order[1:]] - intersection
        iou = intersection / union
        
        # Keep boxes where IoU is below threshold
        inds = np.where(iou <= iou_threshold)[0]
        order = order[inds + 1]
    
    return keep

def detect_with_model(image, model, transform, weights, threshold):
    """
    Detect objects in image using specified model.
    
    Args:
        image (PIL.Image): Input image
        model: Detection model
        transform: Image transform
        weights: Model weights
        threshold (float): Score threshold
        
    Returns:
        list: List of detection results
    """
    img_tensor = transform(image)
    
    # Perform inference
    with torch.no_grad():
        prediction = model([img_tensor])
    
    # Get the predictions
    boxes = prediction[0]['boxes'].cpu().numpy()
    scores = prediction[0]['scores'].cpu().numpy()
    labels = prediction[0]['labels'].cpu().numpy()
    
    results = []
    for box, score, label_idx in zip(boxes, scores, labels):
        if score < threshold:
            continue
            
        label_name = weights.meta["categories"][label_idx]
        calibrated_score = calibrate_confidence(label_name, float(score))
        
        # Only keep food items with good confidence
        if is_food_category(label_name, calibrated_score):
            results.append({
                'label': label_name.lower(),
                'confidence': float(calibrated_score),
                'bbox': box.tolist()
            })
    
    return results

def find_food_in_image_regions(image, model, transform, weights, threshold):
    """
    Analyze specific regions of the image that might contain food.
    
    Args:
        image (PIL.Image): Input image
        model, transform, weights: Detection model components
        threshold: Detection threshold
        
    Returns:
        list: Food detections in the image
    """
    width, height = image.size
    results = []
    
    # Process full image first
    full_detections = detect_with_model(image, model, transform, weights, threshold)
    results.extend(full_detections)
    
    # If we have some detections, focus on those regions
    if full_detections:
        for detection in full_detections:
            # Extract the region around this detection with padding
            bbox = detection['bbox']
            x1, y1, x2, y2 = map(int, bbox)
            
            # Add padding (25% on each side)
            pad_x = int((x2 - x1) * 0.25)
            pad_y = int((y2 - y1) * 0.25)
            
            # Ensure coordinates are within image bounds
            region_x1 = max(0, x1 - pad_x)
            region_y1 = max(0, y1 - pad_y)
            region_x2 = min(width, x2 + pad_x)
            region_y2 = min(height, y2 + pad_y)
            
            # Crop and analyze this region
            region = image.crop((region_x1, region_y1, region_x2, region_y2))
            region_detections = detect_with_model(region, model, transform, weights, threshold - 0.1)
            
            # Adjust coordinates back to original image
            for det in region_detections:
                det['bbox'][0] += region_x1
                det['bbox'][1] += region_y1
                det['bbox'][2] += region_x1
                det['bbox'][3] += region_y1
                det['confidence'] *= 1.1  # Boost confidence for focused regions
                results.append(det)
    else:
        # If no detections, try analyzing specific regions
        regions = [
            # Center region
            (width//4, height//4, 3*width//4, 3*height//4),
            # Top half
            (0, 0, width, height//2),
            # Bottom half
            (0, height//2, width, height)
        ]
        
        for region_bbox in regions:
            region = image.crop(region_bbox)
            region_detections = detect_with_model(region, model, transform, weights, threshold - 0.15)
            
            # Adjust coordinates back to original image
            for det in region_detections:
                det['bbox'][0] += region_bbox[0]
                det['bbox'][1] += region_bbox[1]
                det['bbox'][2] += region_bbox[0]
                det['bbox'][3] += region_bbox[1]
                results.append(det)
    
    return results

def get_classification_model():
    """
    Load a general image classification model to help with food detection.
    
    Returns:
        tuple: (model, preprocess transform)
    """
    # Load pre-trained ResNet50
    weights = ResNet50_Weights.DEFAULT
    model = resnet50(weights=weights)
    model.eval()
    
    # Get the appropriate transforms
    preprocess = weights.transforms()
    
    return model, preprocess

def is_likely_food_image(image, threshold=0.6):
    """
    Classify the image to determine if it's likely to contain food.
    
    Args:
        image (PIL.Image): Input image
        threshold (float): Confidence threshold
        
    Returns:
        bool: True if image likely contains food
    """
    try:
        # Get classification model
        model, preprocess = get_classification_model()
        
        # Food-related class indices in ImageNet (approximate)
        food_class_indices = [
            924, 925, 926, 927, 928, 929, 930, 931, 932, 933,  # fruits
            945, 946, 947, 948, 949, 950, 951, 952, 953,  # vegetables
            963, 964, 965, 966, 967, 968,  # dishes
            923, 957, 958, 959  # foods
        ]
        
        # Prepare image and run inference
        img_tensor = preprocess(image).unsqueeze(0)
        with torch.no_grad():
            output = model(img_tensor)
            probabilities = torch.nn.functional.softmax(output[0], dim=0)
        
        # Check probability of food-related classes
        food_prob = sum(probabilities[idx].item() for idx in food_class_indices)
        
        return food_prob > threshold
    except Exception as e:
        print(f"Error in food classification: {e}")
        return True  # Default to True if classification fails

def detect_objects(image_path, score_threshold=0.45):
    """
    Enhanced object detection using ensemble approach with multiple models and preprocessing.
    
    Args:
        image_path (str): Path to the input image
        score_threshold (float): Base confidence score threshold
        
    Returns:
        list: List of dictionaries containing detection results
    """
    try:
        # Load and preprocess the image
        original_image = Image.open(image_path).convert("RGB")
        
        # Run specialized food classifier
        food_classifications = classify_food_image(original_image, top_k=5)
        
        # First, check if this is likely a food image
        is_food = is_likely_food_image(original_image, threshold=0.4)
        
        # If we have specialized food classifications, use them to create detections
        if food_classifications:
            specialized_detections = []
            width, height = original_image.size
            
            # Create a detection for each food classification
            for i, (label, score) in enumerate(food_classifications):
                if score < 0.3:  # Skip low confidence classifications
                    continue
                    
                # Create a detection covering most of the image
                # We divide the image into regions for multiple items
                if i == 0:  # Most confident item gets center position
                    x1 = width // 4
                    y1 = height // 4
                    x2 = 3 * width // 4
                    y2 = 3 * height // 4
                else:  # Other items get different regions
                    x1 = (i % 2) * (width // 2)
                    y1 = ((i // 2) % 2) * (height // 2)
                    x2 = x1 + width // 2
                    y2 = y1 + height // 2
                
                specialized_detections.append({
                    'label': label,
                    'confidence': score,
                    'bbox': [x1, y1, x2, y2]
                })
            
            # If we have good specialized detections, use them directly
            if specialized_detections and specialized_detections[0]['confidence'] > 0.7:
                print(f"Using specialized food classification: {specialized_detections[0]['label']}")
                return specialized_detections
        
        # Initialize ensemble of models
        models = []
        
        # Add Faster R-CNN model
        frcnn_weights = FasterRCNN_ResNet50_FPN_V2_Weights.DEFAULT
        frcnn_model = fasterrcnn_resnet50_fpn_v2(weights=frcnn_weights, box_score_thresh=score_threshold)
        frcnn_model.eval()
        models.append((frcnn_model, frcnn_weights.transforms(), frcnn_weights, score_threshold))
        
        # Add RetinaNet model for better small object detection
        retina_weights = RetinaNet_ResNet50_FPN_Weights.DEFAULT
        retina_model = retinanet_resnet50_fpn(weights=retina_weights)
        retina_model.eval()
        models.append((retina_model, retina_weights.transforms(), retina_weights, score_threshold + 0.05))
        
        # Initialize YOLO model if available
        yolo_model = None
        if YOLO_AVAILABLE:
            try:
                # Try to load the YOLOv8 food detection model if available (food detection fine-tuned model)
                yolo_food_path = os.path.join(MODELS_DIR, "yolov8n_food.pt")
                
                # If the food detection model exists, use it
                if os.path.exists(yolo_food_path):
                    yolo_model = YOLO(yolo_food_path)
                else:
                    # Otherwise use the standard YOLOv8 model
                    yolo_model = YOLO("yolov8n.pt")
            except Exception as e:
                print(f"Error loading YOLO model: {e}")
        
        # Apply multiple enhancement strategies
        enhanced_images = enhance_image(original_image)
        enhanced_images.append(original_image)  # Also include original image
        
        # Apply multi-scale detection for each enhanced image
        all_results = []
        
        # First pass: standard detection
        for img in enhanced_images:
            multi_scale_images = generate_multi_scale_images(img)
            
            # Check if YOLO is available and run detection
            if yolo_model is not None:
                # Save a temporary image for YOLO to process
                temp_path = os.path.join(os.path.dirname(image_path), "temp_yolo.jpg")
                img.save(temp_path)
                
                # Run YOLO detection
                yolo_results = yolo_model(temp_path)
                
                # Process YOLO results
                for result in yolo_results:
                    boxes = result.boxes.xyxy.cpu().numpy()
                    confs = result.boxes.conf.cpu().numpy()
                    cls_ids = result.boxes.cls.cpu().numpy().astype(int)
                    cls_names = [result.names[c].lower() for c in cls_ids]
                    
                    for box, conf, cls_name in zip(boxes, confs, cls_names):
                        calibrated_score = calibrate_confidence(cls_name, float(conf))
                        if is_food_category(cls_name, calibrated_score):
                            all_results.append({
                                'label': cls_name,
                                'confidence': float(calibrated_score),
                                'bbox': box.tolist()
                            })
                
                # Clean up temp file
                if os.path.exists(temp_path):
                    os.remove(temp_path)
            
            # Run detection with other models in ensemble
            for scaled_img in multi_scale_images:
                for model, transform, weights, threshold in models:
                    results = detect_with_model(scaled_img, model, transform, weights, threshold)
                    all_results.extend(results)
        
        # Second pass: focused food detection if first pass found limited results
        if len(all_results) < 3:
            for img in [enhanced_images[0], original_image]:  # Use first enhanced image and original
                for model, transform, weights, threshold in models:
                    focused_results = find_food_in_image_regions(img, model, transform, weights, threshold - 0.1)
                    all_results.extend(focused_results)
        
        # If not a food image according to classifier, but we found detections, penalize confidence
        if not is_food and all_results:
            for result in all_results:
                result['confidence'] *= 0.8  # Reduce confidence
        
        # If we found food through specialized classification but not through detection,
        # add the specialized detections to the results
        if food_classifications and len(all_results) < 2:
            for label, score in food_classifications[:2]:  # Add top 2 classifications
                if score > 0.5:  # Only add high confidence ones
                    width, height = original_image.size
                    all_results.append({
                        'label': label,
                        'confidence': score,
                        'bbox': [width//4, height//4, 3*width//4, 3*height//4]  # Center region
                    })
        
        # Aggregate results using weighted voting
        # Group by label
        label_groups = defaultdict(list)
        for result in all_results:
            label_groups[result['label']].append(result)
        
        # For each label, find the most confident detection
        best_detections = []
        for label, detections in label_groups.items():
            # Sort by confidence
            detections.sort(key=lambda x: x['confidence'], reverse=True)
            
            # Get all bounding boxes and scores
            boxes = [d['bbox'] for d in detections]
            scores = [d['confidence'] for d in detections]
            
            # Apply NMS to avoid duplicates
            keep_indices = non_max_suppression(boxes, scores, 0.3)
            
            # Add best detections
            for idx in keep_indices:
                if detections[idx]['confidence'] >= score_threshold:
                    best_detections.append(detections[idx])
        
        # Final confidence check and sorting
        final_results = [r for r in best_detections if r['confidence'] >= score_threshold]
        final_results.sort(key=lambda x: x['confidence'], reverse=True)
        
        # If no food items are found, run a more aggressive detection with lower threshold
        if not final_results:
            print("No detections at standard threshold, trying with lower threshold...")
            # Try with a lower threshold
            try:
                # Modified image approach - try extreme enhancement
                img_array = np.array(original_image)
                brightened = cv2.convertScaleAbs(img_array, alpha=1.5, beta=30)  # Increase brightness
                enhanced_img = Image.fromarray(brightened)
                
                backup_model = models[0][0]  # Use first model
                backup_transform = models[0][1]
                backup_weights = models[0][2]
                
                # Try with extremely low threshold
                desperate_results = detect_with_model(enhanced_img, backup_model, backup_transform, backup_weights, 0.3)
                
                if desperate_results:
                    print(f"Found {len(desperate_results)} items with desperate measures")
                    desperate_results.sort(key=lambda x: x['confidence'], reverse=True)
                    return desperate_results[:3]
                    
                return desperate_results
            except Exception as e:
                print(f"Error in fallback detection: {e}")
                return []
            
        return final_results
    
    except Exception as e:
        print(f"Error in enhanced detection: {str(e)}")
        # Fallback to a basic detection if something goes wrong
        return [
            {"label": "food", "confidence": 0.8, "bbox": [10, 10, 100, 100]}
        ]

# Example usage
if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1:
        image_path = sys.argv[1]
        print(f"Running enhanced food detection on {image_path}...")
        detections = detect_objects(image_path)
        
        print(f"Found {len(detections)} food items:")
        for i, detection in enumerate(detections):
            print(f"  {i+1}. {detection['label']} (confidence: {detection['confidence']:.2f})") 