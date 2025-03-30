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


# Kill any processes running on the needed ports
cleanup() {
  print_msg "Cleaning up existing processes..." "info"
  # Find and kill processes on port 3000 (Next.js)
  lsof -ti:3000 | xargs kill -9 2>/dev/null
  # Find and kill processes on port 5000 (Flask)
  lsof -ti:5000 | xargs kill -9 2>/dev/null
}

# Start the Flask server
start_flask() {
  print_msg "Starting Flask server..." "info"
  cd flask-server
  
  # Make sure uploads directory exists
  mkdir -p uploads
  
  # Start Flask in the background
  export FLASK_APP=app.py
  export FLASK_ENV=development
  
  # Try to run Flask from the system Python first
  python3 app.py &
  FLASK_PID=$!
  
  # Check if Flask started correctly
  sleep 2
  if ! ps -p $FLASK_PID > /dev/null; then
    print_msg "Warning: Failed to start Flask with system Python, attempting to use virtual environment..." "error"
    
    # Try to use virtual environment if it exists
    if [ -d "venv/bin" ]; then
      print_msg "Using virtual environment..." "info"
      ./venv/bin/python app.py &
      FLASK_PID=$!
    else
      print_msg "Virtual environment not found. Please run install_dependencies.sh first" "error"
      exit 1
    fi
  fi
  
  print_msg "Flask server running on http://localhost:5000" "success"
  cd ..
}

# Start the Next.js server
start_nextjs() {
  print_msg "Starting Next.js server..." "info"
  cd client
  
  # Check if node_modules exists
  if [ ! -d "node_modules" ]; then
    print_msg "Installing Next.js dependencies..." "info"
    npm install
  fi
  
  npm run dev &
  NEXT_PID=$!
  print_msg "Next.js server running on http://localhost:3000" "success"
  cd ..
}

# Setup trap to clean up when script exits
trap "kill $FLASK_PID $NEXT_PID 2>/dev/null" EXIT INT TERM

# Main execution
cleanup
start_flask
start_nextjs

print_msg "\n✨ Both servers are now running!" "success"
print_msg "- Next.js Frontend: http://localhost:3000" "info"
print_msg "- Flask Backend: http://localhost:5000/api/status" "info"
print_msg "- Press Ctrl+C to stop both servers\n" "info"

# Keep the script running
wait
