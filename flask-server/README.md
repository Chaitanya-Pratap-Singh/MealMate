<!-- @format -->

# MealMate Food Detection API

The MealMate Food Detection API provides advanced food detection capabilities
using state-of-the-art machine learning models. This system uses an ensemble of
multiple detection models including Faster R-CNN, RetinaNet, and YOLOv8,
combined with specialized food classification, to provide highly accurate food
item detection.

## Features

- **Enhanced Food Detection**: Multi-model ensemble approach for robust
  detection
- **Specialized Food Classification**: Dedicated food recognition using
  pre-trained models
- **Advanced Image Processing**: Multiple enhancement techniques to improve
  detection in challenging images
- **Focused Region Analysis**: Two-pass detection to focus on regions likely to
  contain food
- **Fallback Mechanisms**: Multiple strategies to ensure food items are detected
  even in difficult cases

## Setup

1. Create a virtual environment and activate it:

   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. Install dependencies:

   ```bash
   pip install -r requirements.txt
   ```

3. Download required models:

   ```bash
   python download_models.py
   ```

4. Start the API server:
   ```bash
   python app.py
   ```

## Testing the Food Detection

You can test the food detection directly using the provided test script:

```bash
python test_detection.py path/to/your/food/image.jpg
```

This will run detection on the image and save a visualization of the results.

Options:

- `--output` or `-o`: Specify output path for the annotated image
- `--threshold` or `-t`: Set detection confidence threshold (default: 0.4)

## How it Works

The food detection system uses a multi-stage approach:

1. **Specialized Food Classification**: First tries to identify specific food
   items using a dedicated food classifier
2. **Image Enhancement**: Applies multiple enhancement techniques (contrast,
   color, histogram equalization) to improve detection
3. **Multi-Scale Detection**: Analyzes the image at different scales to detect
   both large and small food items
4. **Model Ensemble**: Combines results from multiple models (Faster R-CNN,
   RetinaNet, YOLOv8) for more robust detection
5. **Focused Region Analysis**: Performs a second analysis focusing on regions
   likely to contain food
6. **Confidence Calibration**: Adjusts confidence scores based on food-specific
   knowledge
7. **Fallback Strategies**: Uses increasingly aggressive detection parameters if
   initial attempts fail

## API Endpoints

- `POST /api/process-image`: Main endpoint for food detection

  - Accepts an image URL in JSON format:
    `{"image_url": "https://example.com/image.jpg"}`
  - Returns detected food items with confidence scores and bounding boxes

- `GET /api/status`: Check API status and available features

## Updating Models

To update or use different models:

1. Edit `download_models.py` to include new model URLs
2. Run `python download_models.py` to download the new models
3. Models will be stored in the `models` directory

## Troubleshooting

If detection quality is poor:

1. Ensure all dependencies are correctly installed:

   ```bash
   pip install -r requirements.txt
   ```

2. Make sure models are downloaded:

   ```bash
   python download_models.py
   ```

3. Check the image quality (good lighting, clear view of food items)

4. Try different enhancement techniques by editing the `enhance_image` function
   in `enhanced_detection.py`
