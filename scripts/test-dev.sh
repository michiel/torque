#!/bin/bash

# Torque Development Test Script
# Starts the development environment and runs Playwright tests

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# Cleanup function
cleanup() {
    log "Cleaning up test environment..."
    
    # Kill background processes
    if [ ! -z "$DEV_PID" ]; then
        kill $DEV_PID 2>/dev/null || true
        wait $DEV_PID 2>/dev/null || true
    fi
    
    # Kill any processes on our ports
    lsof -ti:8080 | xargs -r kill -9 2>/dev/null || true
    lsof -ti:3000 | xargs -r kill -9 2>/dev/null || true
    
    success "Cleanup completed"
}

# Trap cleanup on script exit
trap cleanup EXIT INT TERM

# Check if we're in the right directory
check_directory() {
    if [ ! -f "scripts/dev.sh" ] || [ ! -f "scripts/test-frontend.js" ]; then
        error "Please run this script from the root torque directory"
        exit 1
    fi
}

# Check if Node.js and Playwright are available
check_dependencies() {
    log "Checking dependencies..."
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        error "Node.js is not installed. Please install Node.js first."
        exit 1
    fi
    
    # Check if we can run the test script
    if ! node -e "require('playwright')" 2>/dev/null; then
        warn "Playwright is not installed. Installing it now..."
        npm install -g playwright
        npx playwright install chromium
    fi
    
    success "Dependencies check passed"
}

# Start development environment in background
start_dev_environment() {
    log "Starting development environment..."
    
    # Start the dev script in background
    ./scripts/dev.sh > dev.log 2>&1 &
    DEV_PID=$!
    
    log "Development environment started (PID: $DEV_PID)"
    log "Waiting for services to be ready..."
    
    # Wait for services to be ready (up to 60 seconds)
    for i in {1..60}; do
        if curl -s http://localhost:8080/health >/dev/null 2>&1 && \
           curl -s http://localhost:3000 >/dev/null 2>&1; then
            success "Development environment is ready"
            return 0
        fi
        sleep 1
        
        # Show progress every 10 seconds
        if [ $((i % 10)) -eq 0 ]; then
            log "Still waiting for services to start... (${i}s)"
        fi
    done
    
    error "Development environment failed to start within 60 seconds"
    error "Check dev.log for details:"
    tail -20 dev.log
    return 1
}

# Run Playwright tests
run_tests() {
    log "Running Playwright tests..."
    
    # Run the test script
    if node scripts/test-frontend.js; then
        success "All tests passed! 🎉"
        return 0
    else
        error "Tests failed"
        return 1
    fi
}

# Show dev logs in case of failure
show_logs() {
    if [ -f "dev.log" ]; then
        echo ""
        warn "Development server logs (last 30 lines):"
        echo "----------------------------------------"
        tail -30 dev.log
        echo "----------------------------------------"
    fi
}

# Main execution
main() {
    echo ""
    echo "🧪 Torque Development Test Suite"
    echo "================================="
    echo ""
    
    check_directory
    check_dependencies
    
    # Start development environment
    if ! start_dev_environment; then
        show_logs
        exit 1
    fi
    
    # Run tests
    if run_tests; then
        echo ""
        success "🎉 All tests completed successfully!"
        echo ""
        echo "📍 Services tested:"
        echo "   • Backend:  http://localhost:8080"
        echo "   • Frontend: http://localhost:3000"
        echo "   • GraphQL:  http://localhost:8080/graphql"
        echo ""
        echo "✅ The Torque Model Editor is working correctly"
        echo "✅ Both backend and frontend are properly integrated"
        echo "✅ UI components are rendering and functioning"
        echo "✅ Navigation and routing work as expected"
        echo ""
        
        exit 0
    else
        echo ""
        error "Tests failed!"
        show_logs
        exit 1
    fi
}

# Run main function
main "$@"