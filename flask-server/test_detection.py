"""Standalone script for testing object detection without server."""

import os
import torch
import mmcv
from mmdet.apis import inference_detector, init_detector
from mmdet.registry import VISUALIZERS
import matplotlib.pyplot as plt
from PIL import Image

def init_model():
    """Initialize the detection model."""
    model = init_detector(
        'models/food_detection_config.py',
        'models/food_detection_model.pth',
        device='cuda' if torch.cuda.is_available() else 'cpu'
    )
    return model

def init_visualizer():
    """Initialize the visualizer."""
    visualizer = VISUALIZERS.build(dict(
        type='DetLocalVisualizer',
        vis_backends=[dict(type='LocalVisBackend')],
        save_dir='static/visualization',
        alpha=0.5,
    ))
    return visualizer

def detect_objects(image_path, confidence_threshold=0.5):
    """
    Detect objects in an image.
    
    Args:
        image_path (str): Path to the image file
        confidence_threshold (float): Minimum confidence score for detections
        
    Returns:
        tuple: (detections list, visualization image)
    """
    try:
        # Initialize model and visualizer
        model = init_model()
        visualizer = init_visualizer()
        
        # Read the image
        img = mmcv.imread(image_path)
        
        # Run inference
        result = inference_detector(model, img)
        
        # Process results
        detections = []
        for i, (bboxes, labels, scores) in enumerate(result):
            for bbox, label, score in zip(bboxes, labels, scores):
                if score > confidence_threshold:
                    detections.append({
                        'label': model.dataset_meta['classes'][label],
                        'confidence': float(score),
                        'bbox': bbox.tolist()
                    })
        
        # Visualize results
        visualizer.add_datasample(
            'result',
            img,
            data_sample=result,
            draw_gt=False,
            wait_time=0,
            out_file='static/visualization/result.jpg'
        )
        
        # Read the visualization
        vis_img = Image.open('static/visualization/result.jpg')
        
        return detections, vis_img
        
    except Exception as e:
        print(f"Error during detection: {str(e)}")
        return [], None

def display_results(detections, vis_img):
    """Display detection results and visualization."""
    print("\nDetection Results:")
    print(f"Number of detections: {len(detections)}")
    print("\nDetected items:")
    for detection in detections:
        print(f"- {detection['label']} (Confidence: {detection['confidence']:.2f})")
    
    if vis_img:
        plt.figure(figsize=(10, 10))
        plt.imshow(vis_img)
        plt.axis('off')
        plt.show()

def main():
    """Main function to run the detection test."""
    # Get image path from command line or use default
    import sys
    if len(sys.argv) > 1:
        image_path = sys.argv[1]
    else:
        image_path = input("Enter the path to your image: ")
    
    # Verify image exists
    if not os.path.exists(image_path):
        print(f"Error: Image file not found at {image_path}")
        return
    
    # Run detection
    detections, vis_img = detect_objects(image_path)
    
    # Display results
    display_results(detections, vis_img)

if __name__ == "__main__":
    main() 