<!-- @format -->

# Food Recipe Generator

This project consists of a Flask backend server for food detection and recipe
generation, and a Next.js frontend client.

## Project Structure

- `flask-server/`: Backend API with food detection and recipe generation
  capabilities
- `client/`: Next.js frontend application

## Prerequisites

- Python 3.8+ (for Flask server)
- Node.js 16+ (for Next.js client)
- Git

## Getting Started

### Quick Setup (Using Scripts)

For quick setup and running the application, you can use the provided scripts:

1. Clone the repository:

   ```bash
   git clone https://github.com/YOUR_USERNAME/minor-project.git
   cd minor-project
   ```

2. Install all dependencies using the setup script:

   ```bash
   chmod +x install_dependencies.sh
   ./install_dependencies.sh
   ```

   This script will:

   - Create required environment files if they don't exist
   - Set up Python virtual environment for the Flask server
   - Install Python dependencies
   - Install Node.js dependencies for the Next.js client
   - Create necessary directories like `uploads/`

3. Run both servers with a single command:
   ```bash
   chmod +x run.sh
   ./run.sh
   ```
   This script will:
   - Start the Flask server on http://localhost:5000
   - Start the Next.js development server on http://localhost:3000
   - Properly handle cleanup when you stop the servers

### Manual Setup

If you prefer to set up each component separately, follow these instructions:

#### Backend Setup (Flask Server)

1. Navigate to the Flask server directory:

   ```bash
   cd flask-server
   ```

2. Create and activate a virtual environment:

   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install the required dependencies:

   ```bash
   pip install -r requirements.txt
   ```

4. Create a `.env` file based on the example:

   ```bash
   cp .env.example .env  # Then edit .env with your configuration
   ```

5. Run the Flask server:
   ```bash
   python app.py
   ```
   The server will be available at http://localhost:5000

#### Frontend Setup (Next.js Client)

1. Navigate to the client directory:

   ```bash
   cd client
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a `.env.local` file based on the example:

   ```bash
   cp .env.example .env.local  # Then edit .env.local with your configuration
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```
   The client will be available at http://localhost:3000

## Features

- Food detection from images
- Recipe generation based on detected ingredients
- User-friendly web interface for uploading images and viewing recipes

## API Documentation

The Flask server exposes the following endpoints:

- `POST /detect`: Upload an image and detect food items
- `POST /generate`: Generate a recipe from detected ingredients

## Advanced Usage

### Batch Processing (For Developers)

The project includes scripts for batch processing images:

```bash
cd flask-server

# Process a directory of images for food detection
python batch_object_detection.py /path/to/images --output results.json

# Run simplified detection on a single image
python simplified_detection.py /path/to/image.jpg

# Process images and generate recipes
python recipe_generator.py --input /path/to/images --output /path/to/results
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

Distributed under the MIT License. See `LICENSE` for more information.
