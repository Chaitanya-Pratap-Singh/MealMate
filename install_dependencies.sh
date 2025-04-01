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

# Reminder about environment files
print_msg "\nIMPORTANT: Make sure you have set up your environment files:" "info"
print_msg "- flask-server/.env" "info"
print_msg "- client/.env.local" "info"
print_msg "\nSee the README.md for required environment variables." "info"

print_msg "\nTo run the project, use: ./run.sh" "success"
