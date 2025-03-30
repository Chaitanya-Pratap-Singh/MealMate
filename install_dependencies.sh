#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored messages
print_msg() {
  case $2 in
    "success") echo -e "${GREEN}$1${NC}" ;;
    "error") echo -e "${RED}$1${NC}" ;;
    "info") echo -e "${BLUE}$1${NC}" ;;
    *) echo "$1" ;;
  esac
}

print_msg "Installing project dependencies..." "info"

# Create Flask server .env file if it doesn't exist
if [ ! -f "flask-server/.env" ]; then
  print_msg "Creating flask-server/.env file..." "info"
  cat > flask-server/.env << EOF
GEMINI_API_KEY="your-gemini-api-key"
SECRET_KEY="dev-secret-key-change-in-production"
FLASK_ENV=development
FLASK_APP=app.py
CORS_ALLOW_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

# Cloudinary settings
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"
EOF
  print_msg "Flask .env file created" "success"
fi

# Install backend dependencies
print_msg "Setting up Flask backend..." "info"
cd flask-server

# Create uploads directory
mkdir -p uploads

# Create virtual environment
if [ ! -d "venv" ]; then
  print_msg "Creating Python virtual environment..." "info"
  python3 -m venv venv
  
  if [ $? -ne 0 ]; then
    print_msg "Failed to create virtual environment. Make sure python3-venv is installed." "error"
    print_msg "On Ubuntu/Debian: sudo apt install python3-venv" "info"
    print_msg "On Fedora: sudo dnf install python3-virtualenv" "info"
    exit 1
  fi
fi

# Activate and install dependencies
print_msg "Installing Python dependencies..." "info"
source venv/bin/activate || { print_msg "Failed to activate virtual environment" "error"; exit 1; }
pip install -r requirements.txt
deactivate
cd ..

# Install frontend dependencies
print_msg "Setting up Next.js frontend..." "info"
cd client
npm install
cd ..

print_msg "Dependencies installation completed!" "success"

# Reminder to update Cloudinary credentials
print_msg "\nIMPORTANT: Remember to update your Cloudinary credentials in:" "info"
print_msg "- flask-server/.env" "info"
print_msg "- client/.env.local" "info"
print_msg "\nVisit https://cloudinary.com to get your Cloud Name, API Key, and API Secret." "info"

print_msg "\nTo run the project, use: ./run.sh" "success"
