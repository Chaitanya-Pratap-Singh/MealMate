import os
import sys
import time
import argparse
from PIL import Image, ImageDraw, ImageFont
import numpy as np
import inspect

# Import detection function
try:
    from enhanced_detection import detect_objects
    DETECTION_FN = detect_objects
    DETECTION_TYPE = "enhanced"
    print("Using enhanced detection")
except ImportError:
    try:
        from simplified_detection import detect_objects
        DETECTION_FN = detect_objects
        DETECTION_TYPE = "simplified"
        print("Using simplified detection")
    except ImportError:
        print("No detection module found. Please check your installation.")
        sys.exit(1)

# Check parameters the function accepts
ACCEPTS_THRESHOLD = len(inspect.signature(DETECTION_FN).parameters) > 1

def draw_boxes(image_path, detections, output_path=None):
    """
    Draw bounding boxes on an image based on detection results.
    
    Args:
        image_path (str): Path to the input image
        detections (list): List of detection results
        output_path (str): Path to save the annotated image
    
    Returns:
        PIL.Image: Annotated image
    """
    # Load the image
    image = Image.open(image_path).convert("RGB")
    draw = ImageDraw.Draw(image)
    
    # Try to load a font, use default if not available
    try:
        font = ImageFont.truetype("arial.ttf", 16)
    except IOError:
        font = ImageFont.load_default()
    
    # Colors for different food categories
    colors = {
        'fruit': (255, 0, 0),      # Red
        'vegetable': (0, 255, 0),  # Green
        'meat': (0, 0, 255),       # Blue
        'dairy': (255, 255, 0),    # Yellow
        'grain': (255, 0, 255),    # Purple
        'dessert': (0, 255, 255),  # Cyan
        'default': (255, 165, 0)   # Orange
    }
    
    # Draw each detection
    for detection in detections:
        label = detection.get('label', '')
        confidence = detection.get('confidence', detection.get('score', 0))
        box = detection.get('bbox', detection.get('box', [0, 0, 0, 0]))
        
        # Determine color based on food category
        color = colors['default']
        for category, c in colors.items():
            if category in label.lower():
                color = c
                break
        
        # Draw the box
        draw.rectangle(box, outline=color, width=3)
        
        # Draw the label with confidence
        label_text = f"{label}: {confidence:.2f}"
        text_size = draw.textsize(label_text, font=font) if hasattr(draw, 'textsize') else (100, 20)
        
        # Draw background for text
        draw.rectangle([box[0], box[1], box[0] + text_size[0], box[1] + text_size[1]], fill=color)
        
        # Draw text
        draw.text((box[0], box[1]), label_text, fill=(255, 255, 255), font=font)
    
    # Save the annotated image if output path is provided
    if output_path:
        os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)
        image.save(output_path)
        print(f"Saved annotated image to {output_path}")
    
    return image

def main():
    parser = argparse.ArgumentParser(description="Test food detection on an image.")
    parser.add_argument("image_path", help="Path to the input image")
    parser.add_argument("--output", "-o", help="Path to save the annotated image", default=None)
    parser.add_argument("--threshold", "-t", type=float, help="Detection confidence threshold (only for enhanced detection)", default=0.4)
    args = parser.parse_args()
    
    if not os.path.exists(args.image_path):
        print(f"Error: Image not found at {args.image_path}")
        return
    
    print(f"Running food detection on {args.image_path}...")
    start_time = time.time()
    
    # Run detection based on which function is available
    if ACCEPTS_THRESHOLD:
        print(f"Using threshold: {args.threshold}")
        detections = DETECTION_FN(args.image_path, args.threshold)
    else:
        print("Using simplified detection (no threshold parameter)")
        detections = DETECTION_FN(args.image_path)
    
    elapsed = time.time() - start_time
    print(f"Detection completed in {elapsed:.2f} seconds")
    
    # Print detection results
    print(f"Found {len(detections)} food item(s):")
    for i, detection in enumerate(detections):
        label = detection.get('label', '')
        confidence = detection.get('confidence', detection.get('score', 0))
        print(f"  {i+1}. {label}: {confidence:.2f}")
    
    # Draw boxes on the image
    if args.output or len(detections) > 0:
        output_path = args.output
        if not output_path:
            # Generate default output path
            basename = os.path.basename(args.image_path)
            name, ext = os.path.splitext(basename)
            output_path = f"{name}_detected{ext}"
        
        draw_boxes(args.image_path, detections, output_path)

if __name__ == "__main__":
    main() 