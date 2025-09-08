#!/bin/bash

# Torque Desktop Release Builder
# Creates platform-specific installers: DMG (macOS), MSI (Windows), DEB/RPM (Linux)

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
TAURI_DIR="src-tauri"
FRONTEND_DIR="frontend/model-editor"

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
    log "Cleaning up build processes..."
    exit 0
}

# Trap cleanup on script exit
trap cleanup EXIT INT TERM

# Check dependencies
check_dependencies() {
    log "Checking build dependencies..."
    
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
    
    success "Build dependencies check passed"
}

# Check if we're in the right directory
check_directory() {
    if [ ! -f "torque/Cargo.toml" ] || [ ! -f "src-tauri/Cargo.toml" ]; then
        error "Please run this script from the root torque directory"
        error "Expected structure: ./torque/Cargo.toml and ./src-tauri/Cargo.toml"
        exit 1
    fi
    
    if [ ! -d "$FRONTEND_DIR" ]; then
        error "Frontend directory not found: $FRONTEND_DIR"
        exit 1
    fi
}

# Build frontend for production
build_frontend() {
    log "Building frontend for production..."
    
    cd $FRONTEND_DIR
    
    # Install dependencies if needed
    if [ ! -d "node_modules" ]; then
        log "Installing frontend dependencies..."
        npm ci
    fi
    
    # Build frontend
    log "Building React frontend..."
    npm run build
    
    success "Frontend build completed"
    cd ../..
}

# Build Tauri application
build_tauri() {
    log "Building Tauri desktop application..."
    log "This will create platform-specific installers:"
    log "  • DMG file for macOS"
    log "  • MSI file for Windows" 
    log "  • DEB/RPM files for Linux"
    echo ""
    
    cd $TAURI_DIR
    
    # Build release
    log "Starting Tauri release build..."
    cargo tauri build --verbose
    
    success "Tauri build completed"
    cd ..
}

# Show build artifacts
show_artifacts() {
    log "Build artifacts created:"
    echo ""
    
    if [ -d "target/release/bundle" ]; then
        find target/release/bundle -name "*.dmg" -o -name "*.msi" -o -name "*.deb" -o -name "*.rpm" | while read file; do
            size=$(du -h "$file" | cut -f1)
            success "📦 $file ($size)"
        done
    else
        warn "No bundle directory found. Build may have failed."
    fi
    
    echo ""
    log "Release build complete! 🎉"
    log "Installers are ready for distribution."
}

# Main execution
main() {
    echo ""
    echo "🚀 Torque Desktop Release Builder"
    echo "=================================="
    echo ""
    
    # Perform checks
    check_directory
    check_dependencies
    
    echo ""
    success "🏗️  Starting release build process..."
    echo ""
    echo "📋 Build Plan:"
    echo "   • Clean and build React frontend"
    echo "   • Compile Rust backend in release mode"
    echo "   • Generate platform-specific installers"
    echo "   • Package with embedded server and dependencies"
    echo ""
    echo "⏱️  Estimated time: 5-10 minutes (first build may take longer)"
    echo "💾 Artifacts will be saved in: ./target/release/bundle/"
    echo ""
    
    # Build process
    build_frontend
    echo ""
    build_tauri
    echo ""
    show_artifacts
}

# Run main function
main "$@"