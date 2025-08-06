#!/bin/bash

# Torque Tauri Desktop Development Script
# Starts the Tauri desktop application with embedded server and React frontend

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
TAURI_DIR="src-tauri"
FRONTEND_DIR="frontend/tauri"

# Function to print colored output
log() {
    echo -e "${BLUE}[$(date +'%H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}[$(date +'%H:%M:%S')]${NC} ✅ $1"
}

error() {
    echo -e "${RED}[$(date +'%H:%M:%S')]${NC} ❌ $1"
}

warn() {
    echo -e "${YELLOW}[$(date +'%H:%M:%S')]${NC} ⚠️  $1"
}

# Function to cleanup background processes
cleanup() {
    log "Shutting down Tauri development environment..."
    
    # Kill any Tauri processes
    pkill -f "torque-desktop" 2>/dev/null || true
    pkill -f "cargo tauri" 2>/dev/null || true
    
    # Kill frontend dev server processes 
    pkill -f "vite.*3001" 2>/dev/null || true
    pkill -f "npm run dev" 2>/dev/null || true
    
    success "Tauri development environment stopped"
    exit 0
}

# Trap cleanup on script exit
trap cleanup EXIT INT TERM

# Check dependencies
check_dependencies() {
    log "Checking dependencies..."
    
    # Check if cargo is installed
    if ! command -v cargo &> /dev/null; then
        error "cargo is not installed. Please install Rust first."
        exit 1
    fi
    
    # Check if npm is installed
    if ! command -v npm &> /dev/null; then
        error "npm is not installed. Please install Node.js first."
        exit 1
    fi
    
    # Check if Tauri CLI is installed
    if ! command -v cargo-tauri &> /dev/null; then
        warn "Tauri CLI not found. Attempting to install..."
        cargo install tauri-cli --version "^2.0" --locked
    fi
    
    success "Dependencies check passed"
}

# Check if we're in the right directory
check_directory() {
    if [ ! -f "torque/Cargo.toml" ] || [ ! -f "src-tauri/Cargo.toml" ]; then
        error "Please run this script from the root torque directory"
        error "Expected structure: ./torque/Cargo.toml and ./src-tauri/Cargo.toml"
        exit 1
    fi
    
    if [ ! -d "$FRONTEND_DIR" ]; then
        error "Tauri frontend directory not found: $FRONTEND_DIR"
        exit 1
    fi
}

# Install frontend dependencies if needed
check_frontend_deps() {
    log "Checking Tauri frontend dependencies..."
    
    cd $FRONTEND_DIR
    
    if [ ! -d "node_modules" ] || [ ! -f "node_modules/@tauri-apps/api/package.json" ]; then
        log "Installing Tauri frontend dependencies..."
        npm install
        success "Frontend dependencies installed"
    else
        success "Frontend dependencies already installed"
    fi
    
    cd ../..
}

# Test Rust compilation
test_compilation() {
    log "Testing Rust compilation..."
    
    cd $TAURI_DIR
    
    if cargo check --quiet; then
        success "Rust compilation test passed"
    else
        error "Rust compilation failed. Please fix compilation errors first."
        cd ..
        exit 1
    fi
    
    cd ..
}

# Check system dependencies for Tauri (Linux specific)
check_system_deps() {
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        log "Checking Linux system dependencies for Tauri..."
        
        # Check for GTK development libraries
        if ! pkg-config --exists gtk+-3.0; then
            error "GTK3 development libraries not found."
            error "Please install: sudo dnf install gtk3-devel glib2-devel webkit2gtk3-devel"
            exit 1
        fi
        
        # Check for WebKit2GTK
        if ! pkg-config --exists webkit2gtk-4.1; then
            error "WebKit2GTK development libraries not found."
            error "Please install: sudo dnf install webkit2gtk4.1-devel"
            exit 1
        fi
        
        success "Linux system dependencies check passed"
    fi
}

# Start Tauri in development mode
start_tauri_dev() {
    log "Starting Tauri desktop application..."
    log "This will:"
    log "  1. Start embedded Torque server with SQLite database"
    log "  2. Start React frontend on http://127.0.0.1:3001"
    log "  3. Launch desktop application window"
    log "  4. Enable hot reload for both frontend and backend"
    echo ""
    
    cd $TAURI_DIR
    
    # Start Tauri development mode
    # This will automatically start the frontend dev server and launch the desktop app
    cargo tauri dev
}

# Main execution
main() {
    echo ""
    echo "🖥️  Torque Tauri Desktop Development"
    echo "===================================="
    echo ""
    
    # Perform checks
    check_directory
    check_dependencies
    check_system_deps
    check_frontend_deps
    test_compilation
    
    echo ""
    success "🎉 Starting Tauri development environment..."
    echo ""
    echo "💡 What happens next:"
    echo "   • Embedded Torque server will start on random port"
    echo "   • Frontend dev server will start on port 3001"  
    echo "   • Desktop application window will open"
    echo "   • SQLite database: ~/.local/share/torque-desktop/torque.db"
    echo "   • All APIs available: GraphQL, JSON-RPC, WebSocket"
    echo "   • Hot reload enabled for code changes"
    echo ""
    echo "🔧 Development Features:"
    echo "   • Real-time server logs in terminal"
    echo "   • Frontend hot module replacement"
    echo "   • Rust code changes trigger rebuild"
    echo "   • Cross-platform desktop APIs available"
    echo ""
    echo "⚠️  Note: First launch may take longer due to compilation"
    echo "   Press Ctrl+C to stop the development environment"
    echo ""
    
    # Start Tauri development
    start_tauri_dev
}

# Run main function
main "$@"