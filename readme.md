<!-- @format -->

# MealMate - Food Recipe Generator

A full-stack application that uses AI to detect food items from images and
generate recipes. The project consists of a Flask backend server for food
detection and recipe generation, and a Next.js frontend client.

## Features

- Food detection from images using AI
- Recipe generation based on detected ingredients
- Modern, responsive UI built with Next.js
- Cloud storage for images using Cloudinary
- Cross-platform support (Windows, Linux, macOS)

## Prerequisites

- Python 3.8+ (for Flask server)
- Node.js 16+ (for Next.js client)
- Git
- Cloudinary account (for image storage)
- Google Gemini API key

## Environment Setup

Before running the application, you need to set up your environment files:

1. Create `flask-server/.env` with the following variables:

   ```
   SECRET_KEY="your-secret-key"
   FLASK_ENV=development
   FLASK_APP=app.py
   CORS_ALLOW_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
   FLASK_SERVER_URL=http://127.0.0.1:5000
   GEMINI_API_KEY="your-gemini-api-key"
   CLOUDINARY_CLOUD_NAME="your-cloud-name"
   CLOUDINARY_API_KEY="your-api-key"
   CLOUDINARY_API_SECRET="your-api-secret"
   ```

2. Create `client/.env` with the following variables:
   ```
   FLASK_SERVER_URL=http://127.0.0.1:5000
   NEXT_PUBLIC_FLASK_SERVER_URL=http://127.0.0.1:5000
   NEXT_PUBLIC_APP_NAME=MealMate
   NEXT_PUBLIC_APP_DESCRIPTION="AI-powered recipe generator from your ingredients"
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   NEXT_PUBLIC_GEMINI_API_KEY="your-gemini-api-key"
   CLOUDINARY_CLOUD_NAME="your-cloud-name"
   CLOUDINARY_API_KEY="your-api-key"
   CLOUDINARY_API_SECRET="your-api-secret"
   NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="your-cloud-name"
   NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET="mealmate_uploads"
   ```

## Getting Started

### Quick Setup

1. Clone the repository:

   ```bash
   git clone https://github.com/YOUR_USERNAME/MealMate.git
   cd MealMate
   ```

2. Install dependencies:

   **For Windows:**

   ```bash
   install_dependencies.bat
   ```

   **For Linux/macOS:**

   ```bash
   chmod +x install_dependencies.sh
   ./install_dependencies.sh
   ```

   This will:

   - Set up Python virtual environment
   - Install Python dependencies
   - Install Node.js dependencies
   - Create necessary directories

3. Run the application:

   **For Windows:**

   ```bash
   run.bat
   ```

   **For Linux/macOS:**

   ```bash
   chmod +x run.sh
   ./run.sh
   ```

   This will start:

   - Flask server on http://localhost:5000
   - Next.js development server on http://localhost:3000

### Manual Setup

If you prefer to set up each component separately:

#### Backend Setup (Flask Server)

1. Navigate to the Flask server directory:

   ```bash
   cd flask-server
   ```

2. Create and activate a virtual environment:

   ```bash
   # Windows
   python -m venv venv
   venv\Scripts\activate

   # Linux/macOS
   python3 -m venv venv
   source venv/bin/activate
   ```

3. Install dependencies:

   ```bash
   pip install -r requirements.txt
   ```

4. Create `.env` file with your configuration (see Environment Setup section)

5. Run the Flask server:
   ```bash
   python app.py
   ```

#### Frontend Setup (Next.js Client)

1. Navigate to the client directory:

   ```bash
   cd client
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create `.env` file with your configuration (see Environment Setup section)

4. Run the development server:
   ```bash
   npm run dev
   ```

## Project Structure

```
MealMate/
├── flask-server/          # Backend API
│   ├── app.py            # Main Flask application
│   ├── models/           # AI models directory
│   ├── uploads/          # Temporary image storage
│   ├── static/           # Static files
│   ├── venv/             # Python virtual environment
│   ├── __pycache__/      # Python cache files
│   ├── requirements.txt  # Python dependencies
│   ├── .env             # Environment variables
│   ├── .gitignore       # Git ignore rules
│   ├── wsgi.py          # WSGI entry point
│   ├── Procfile         # Heroku deployment config
│   ├── download_models.py    # Model download script
│   ├── test_detection.py     # Test detection script
│   ├── enhanced_detection.py # Enhanced detection module
│   ├── simplified_recipe.py  # Simplified recipe generation
│   ├── batch_object_detection.py    # Batch processing
│   ├── cpu_mmdet_object_detection.py # CPU detection
│   ├── mmdet_object_detection.py     # MMDetection wrapper
│   ├── object_detection.py           # Core detection
│   ├── recipe_generator.py           # Recipe generation
│   └── simplified_detection.py       # Simplified detection
├── client/               # Frontend application
│   ├── src/             # Source code
│   ├── public/          # Static assets
│   ├── .next/           # Next.js build output
│   ├── node_modules/    # Node.js dependencies
│   ├── package.json     # Node.js dependencies
│   ├── package-lock.json # Locked dependencies
│   ├── tsconfig.json    # TypeScript config
│   ├── next-env.d.ts    # Next.js type definitions
│   ├── postcss.config.mjs # PostCSS config
│   ├── next.config.js   # Next.js config
│   ├── next.config.ts   # TypeScript Next.js config
│   ├── .gitignore      # Git ignore rules
│   └── .env            # Environment variables
├── install_dependencies.bat  # Windows setup script
├── install_dependencies.sh   # Linux/macOS setup script
├── run.bat              # Windows run script
└── run.sh               # Linux/macOS run script
```

## Development

- The Flask server runs on port 5000
- The Next.js development server runs on port 3000
- Both servers must be running for the application to work
- Use the provided scripts to start both servers simultaneously

## Troubleshooting

1. If ports 3000 or 5000 are already in use:

   - The run scripts will attempt to kill existing processes
   - Manually kill processes if needed:

     ```bash
     # Windows
     netstat -ano | findstr :3000
     taskkill /PID <PID> /F

     # Linux/macOS
     lsof -i :3000
     kill -9 <PID>
     ```

2. If virtual environment is not found:

   - Run the installation script again
   - Make sure Python is installed and in PATH

3. If node_modules is missing:

   - Run `npm install` in the client directory
   - Or run the installation script again

4. If environment variables are missing:
   - Make sure you've created both `.env` files
   - Check the Environment Setup section in README
   - Verify all required variables are set

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for
details.
