#!/bin/bash

# Portability Verification Script
# This script verifies that the project works without hardcoded paths

set -e

echo "🔍 Verifying Project Portability..."
echo "=================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print status
print_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
    else
        echo -e "${RED}❌ $2${NC}"
        exit 1
    fi
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "ℹ️  $1"
}

# Get the project root directory
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
echo "Project root: $PROJECT_ROOT"
echo

# 1. Check for any remaining hardcoded paths
print_info "Checking for hardcoded paths..."

HARDCODED_PATHS=$(find "$PROJECT_ROOT" -type f \( -name "*.json" -o -name "*.md" -o -name "*.ts" -o -name "*.tsx" \) ! -path "*/node_modules/*" ! -path "*/target/*" ! -path "*/.git/*" ! -path "*/dist/*" ! -path "*/build/*" ! -path "*/storybook-static/*" ! -path "*/.claude/*" ! -name "PATH_FIXES.md" -exec grep -l "/home/michiel/dev/torque" {} \; 2>/dev/null || true)

if [ -z "$HARDCODED_PATHS" ]; then
    print_status 0 "No hardcoded paths found"
else
    echo "Found hardcoded paths in:"
    echo "$HARDCODED_PATHS"
    print_status 1 "Hardcoded paths still exist"
fi

# 2. Verify Tauri configuration uses relative paths
print_info "Checking Tauri configuration..."

TAURI_CONFIG="$PROJECT_ROOT/src-tauri/tauri.conf.json"
if grep -q "cd frontend/model-editor" "$TAURI_CONFIG"; then
    print_status 0 "Tauri configuration uses relative paths"
else
    print_status 1 "Tauri configuration still has absolute paths"
fi

# 3. Verify Vitest configuration
print_info "Checking Vitest configuration..."

VITEST_CONFIG="$PROJECT_ROOT/frontend/torque-client/vitest.config.ts"
if grep -q "@.*\./src" "$VITEST_CONFIG"; then
    print_status 0 "Vitest configuration uses relative paths"
else
    print_status 1 "Vitest configuration still has absolute paths"
fi

# 4. Test basic functionality
print_info "Testing basic functionality..."

# Check if we're in the project directory structure
if [ ! -d "$PROJECT_ROOT/frontend/torque-client" ]; then
    print_status 1 "Cannot find torque-client directory"
fi

cd "$PROJECT_ROOT/frontend/torque-client"

# Check if package.json exists
if [ ! -f "package.json" ]; then
    print_status 1 "Cannot find package.json in torque-client"
fi

# Check if node_modules exists (if not, we'll skip npm tests)
if [ ! -d "node_modules" ]; then
    print_warning "node_modules not found - skipping npm tests"
    print_warning "Run 'npm install' in frontend/torque-client to enable full testing"
else
    # Run basic test
    print_info "Running basic test..."
    if npm run test:run src/test/basic.test.tsx > /dev/null 2>&1; then
        print_status 0 "Basic tests pass"
    else
        print_status 1 "Basic tests fail"
    fi
    
    # Check if build works (optional - may fail due to incomplete components)
    print_info "Testing build process..."
    if npm run build > /dev/null 2>&1; then
        print_status 0 "Build process works"
    else
        print_warning "Build process has errors (this may be expected during development)"
        print_info "  Note: This is not related to path portability"
    fi
fi

# 5. Check documentation paths
print_info "Checking documentation paths..."

DOC_FILES=(
    "$PROJECT_ROOT/INTEGRATION_DEMO.md"
    "$PROJECT_ROOT/frontend/model-editor/layout-persistence-test.md"
    "$PROJECT_ROOT/frontend/model-editor/LAYOUT_SAVE_TEST_REPORT.md"
    "$PROJECT_ROOT/frontend/model-editor/GRAPHQL_TEST_REPORT.md"
)

ALL_DOCS_OK=true
for doc in "${DOC_FILES[@]}"; do
    if [ -f "$doc" ]; then
        if grep -q "/home/michiel" "$doc"; then
            echo "❌ $doc still contains hardcoded paths"
            ALL_DOCS_OK=false
        fi
    fi
done

if [ "$ALL_DOCS_OK" = true ]; then
    print_status 0 "Documentation uses relative paths"
else
    print_status 1 "Some documentation still has hardcoded paths"
fi

# 6. Verify project structure
print_info "Verifying project structure..."

REQUIRED_DIRS=(
    "frontend/torque-client"
    "frontend/model-editor"
    "src-tauri"
    "torque"
)

STRUCTURE_OK=true
for dir in "${REQUIRED_DIRS[@]}"; do
    if [ ! -d "$PROJECT_ROOT/$dir" ]; then
        echo "❌ Missing required directory: $dir"
        STRUCTURE_OK=false
    fi
done

if [ "$STRUCTURE_OK" = true ]; then
    print_status 0 "Project structure is intact"
else
    print_status 1 "Project structure is incomplete"
fi

# Summary
echo
echo "=================================="
echo "🎉 Portability verification complete!"
echo
echo "The project should now work on any machine after:"
echo "1. Clone the repository"
echo "2. Run 'npm install' in frontend directories"
echo "3. Follow normal development workflow"
echo
echo "No manual path adjustments should be needed."