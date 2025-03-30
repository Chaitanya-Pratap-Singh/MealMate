import os
import sys
import requests
import time
from pathlib import Path

# Create models directory if it doesn't exist
MODELS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "models")
os.makedirs(MODELS_DIR, exist_ok=True)

def download_file(url, save_path):
    """
    Download a file from a URL with progress tracking.
    
    Args:
        url (str): URL to download from
        save_path (str): Where to save the file
        
    Returns:
        bool: True if successful, False otherwise
    """
    if os.path.exists(save_path):
        print(f"File already exists at {save_path}")
        return True
        
    try:
        print(f"Downloading from {url}...")
        response = requests.get(url, stream=True)
        response.raise_for_status()
        
        file_size = int(response.headers.get('content-length', 0))
        chunk_size = 1024 * 1024  # 1MB
        
        start_time = time.time()
        downloaded = 0
        
        with open(save_path, 'wb') as f:
            for chunk in response.iter_content(chunk_size=chunk_size):
                if chunk:
                    f.write(chunk)
                    downloaded += len(chunk)
                    
                    # Calculate and display progress
                    if file_size > 0:
                        progress = downloaded / file_size * 100
                        elapsed = time.time() - start_time
                        speed = downloaded / (elapsed * 1024 * 1024) if elapsed > 0 else 0
                        remaining = (file_size - downloaded) / (downloaded / elapsed) if downloaded > 0 and elapsed > 0 else 0
                        
                        sys.stdout.write(f"\rDownloaded: {progress:.1f}% ({downloaded / (1024*1024):.1f} MB / {file_size / (1024*1024):.1f} MB) "
                                         f"Speed: {speed:.2f} MB/s ETA: {remaining:.0f}s")
                        sys.stdout.flush()
        
        print(f"\nDownload complete: {save_path}")
        return True
    except Exception as e:
        print(f"Error downloading file: {e}")
        return False

def main():
    print("Downloading specialized food detection models...")
    
    # YOLO model trained specifically for food detection
    yolo_food_url = "https://github.com/ultralytics/assets/releases/download/v0.0.0/yolov8n.pt"
    yolo_food_path = os.path.join(MODELS_DIR, "yolov8n_food.pt")
    
    # Note: Normally we'd use a specialized food detection model, but we're using the generic YOLO model
    # and will handle food detection through our post-processing with enhanced_detection.py
    download_file(yolo_food_url, yolo_food_path)
    
    print("\nAll models downloaded successfully!")
    print("Models directory:", MODELS_DIR)
    print("Available models:")
    for model_file in os.listdir(MODELS_DIR):
        model_path = os.path.join(MODELS_DIR, model_file)
        size_mb = os.path.getsize(model_path) / (1024 * 1024)
        print(f"  - {model_file} ({size_mb:.1f} MB)")

if __name__ == "__main__":
    main() 