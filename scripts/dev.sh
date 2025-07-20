#!/bin/bash

# Torque Development Server Script
# Starts the Rust backend with SQLite database and React frontends (Model Editor & TorqueApp)

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BACKEND_PORT=8080
FRONTEND_PORT=3000
TORQUE_CLIENT_PORT=3002
BACKEND_DIR="torque"
FRONTEND_DIR="frontend/model-editor"
TORQUE_CLIENT_DIR="frontend/torque-client"

# Parse command line arguments
TORQUE_CLIENT_MODE="dev" # Default to dev mode
for arg in "$@"; do
    case $arg in
        --production-client)
            TORQUE_CLIENT_MODE="production"
            shift
            ;;
        --help)
            echo "Usage: $0 [options]"
            echo "Options:"
            echo "  --production-client  Run TorqueApp client in production mode (faster loading)"
            echo "  --help              Show this help message"
            exit 0
            ;;
    esac
done

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
    log "Shutting down development servers..."
    
    # Kill all background jobs
    jobs -p | xargs -r kill 2>/dev/null || true
    
    # Kill any processes on our ports
    lsof -ti:$BACKEND_PORT | xargs -r kill -9 2>/dev/null || true
    lsof -ti:$FRONTEND_PORT | xargs -r kill -9 2>/dev/null || true
    lsof -ti:$TORQUE_CLIENT_PORT | xargs -r kill -9 2>/dev/null || true
    
    success "Development servers stopped"
    exit 0
}

# Trap cleanup on script exit
trap cleanup EXIT INT TERM

# Check if ports are available
check_port() {
    local port=$1
    local name=$2
    
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null ; then
        error "Port $port is already in use (needed for $name)"
        error "Please stop the service using port $port and try again"
        exit 1
    fi
}

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
    
    success "Dependencies check passed"
}

# Start the Rust backend
start_backend() {
    log "Starting Torque backend server..."
    
    # Ensure the dev database directory exists
    mkdir -p data
    
    # Get absolute path for database
    DB_PATH=$(pwd)/data/dev.db
    
    # Build and start the backend with development database from workspace root
    RUST_LOG=info cargo run --release -p torque -- --database-url "sqlite:${DB_PATH}" server &
    BACKEND_PID=$!
    
    # Wait for backend to be ready
    log "Waiting for backend to start on port $BACKEND_PORT..."
    
    for i in {1..180}; do
        if curl -s http://localhost:$BACKEND_PORT/graphql -H "Content-Type: application/json" -d '{"query":"{ __schema { queryType { name } } }"}' >/dev/null 2>&1; then
            success "Backend server started successfully on http://localhost:$BACKEND_PORT"
            return 0
        fi
        sleep 1
    done
    
    error "Backend server failed to start within 180 seconds"
    return 1
}

# Start the React frontend
start_frontend() {
    log "Starting React Model Editor frontend..."
    
    cd $FRONTEND_DIR
    
    # Install dependencies if node_modules doesn't exist
    if [ ! -d "node_modules" ]; then
        log "Installing frontend dependencies..."
        npm install
    fi
    
    # Start the frontend development server
    npm run dev &
    FRONTEND_PID=$!
    
    cd ../..
    
    # Wait for frontend to be ready
    log "Waiting for frontend to start on port $FRONTEND_PORT..."
    
    for i in {1..30}; do
        if curl -s http://localhost:$FRONTEND_PORT >/dev/null 2>&1; then
            success "Frontend server started successfully on http://localhost:$FRONTEND_PORT"
            return 0
        fi
        sleep 1
    done
    
    error "Frontend server failed to start within 30 seconds"
    return 1
}

# Start the TorqueApp client
start_torque_client() {
    log "Starting TorqueApp client..."
    
    cd $TORQUE_CLIENT_DIR
    
    # Install dependencies if node_modules doesn't exist
    if [ ! -d "node_modules" ]; then
        log "Installing TorqueApp client dependencies..."
        npm install
    fi
    
    # Start the client based on mode
    if [ "$TORQUE_CLIENT_MODE" = "production" ]; then
        log "Building TorqueApp client for production mode..."
        npm run build
        log "Starting TorqueApp client in production mode..."
        npm run preview &
        TORQUE_CLIENT_PID=$!
    else
        log "Starting TorqueApp client in development mode..."
        npm run dev &
        TORQUE_CLIENT_PID=$!
    fi
    
    cd ../..
    
    # Wait for client to be ready
    log "Waiting for TorqueApp client to start on port $TORQUE_CLIENT_PORT..."
    
    for i in {1..60}; do
        if curl -s http://localhost:$TORQUE_CLIENT_PORT >/dev/null 2>&1; then
            success "TorqueApp client started successfully on http://localhost:$TORQUE_CLIENT_PORT"
            return 0
        fi
        sleep 1
    done
    
    error "TorqueApp client failed to start within 60 seconds"
    return 1
}

# Test the GraphQL endpoint and playground
test_graphql() {
    log "Testing GraphQL endpoints..."
    
    # Test GraphQL API with a simple query
    local api_response=$(curl -s -X POST \
        -H "Content-Type: application/json" \
        -d '{"query":"query { __typename }"}' \
        http://localhost:$BACKEND_PORT/graphql 2>/dev/null)
    
    if echo "$api_response" | grep -q "__typename"; then
        success "GraphQL API is working"
    else
        warn "GraphQL API test failed, but servers are running"
    fi
    
    # Test GraphiQL playground
    local playground_response=$(curl -s http://localhost:$BACKEND_PORT/graphql/playground 2>/dev/null)
    
    if echo "$playground_response" | grep -q -i "playground"; then
        success "GraphiQL playground is accessible"
    else
        warn "GraphiQL playground test failed, but servers are running"
    fi
}

# Main execution
main() {
    echo ""
    echo "🚀 Torque Development Environment"
    echo "================================="
    echo ""
    
    # Check if we're in the right directory
    if [ ! -f "torque/Cargo.toml" ] || [ ! -f "frontend/model-editor/package.json" ]; then
        error "Please run this script from the root torque directory"
        exit 1
    fi
    
    # Perform checks
    check_dependencies
    check_port $BACKEND_PORT "Torque backend"
    check_port $FRONTEND_PORT "Model Editor frontend"
    check_port $TORQUE_CLIENT_PORT "TorqueApp client"
    
    # Start services
    start_backend
    start_frontend
    start_torque_client
    test_graphql
    
    echo ""
    success "🎉 Development environment is ready!"
    echo ""
    echo "📍 Services:"
    echo "   • Backend:       http://localhost:$BACKEND_PORT"
    echo "   • Model Editor:  http://localhost:$FRONTEND_PORT"
    echo "   • TorqueApp:     http://localhost:$TORQUE_CLIENT_PORT"
    echo ""
    echo "🔧 Backend APIs:"
    echo "   • GraphQL API:   http://localhost:$BACKEND_PORT/graphql"
    echo "   • GraphiQL:      http://localhost:$BACKEND_PORT/graphql/playground"
    echo "   • JSON-RPC API:  http://localhost:$BACKEND_PORT/rpc"
    echo "   • WebSocket:     ws://localhost:$BACKEND_PORT/ws"
    echo "   • Health Check:  http://localhost:$BACKEND_PORT/health"
    echo "   • Metrics:       http://localhost:$BACKEND_PORT/metrics"
    echo ""
    echo "💡 Tips:"
    echo "   • The backend uses SQLite database at data/dev.db"
    echo "   • Frontend has hot module replacement enabled"
    echo "   • Use GraphiQL playground for interactive GraphQL queries and schema exploration"
    echo "   • WebSocket endpoint available for real-time model synchronization"
    if [ "$TORQUE_CLIENT_MODE" = "production" ]; then
        echo "   • TorqueApp is running in production mode (faster loading)"
    else
        echo "   • TorqueApp is running in dev mode (use --production-client for faster loading)"
    fi
    echo "   • Press Ctrl+C to stop all services"
    echo ""
    
    # Keep the script running and show logs
    log "Development servers are running. Press Ctrl+C to stop."
    wait
}

# Run main function
main "$@"
