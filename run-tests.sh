#!/bin/bash

echo "🧪 Running automated tests for Memory Keeper application..."
echo "=================================================="

# Run the test suite
echo "Running frontend component tests..."
npx vitest run tests/frontend/components/ --reporter=verbose

echo ""
echo "Running frontend page tests..."
npx vitest run tests/frontend/pages/ --reporter=verbose

echo ""
echo "Running backend API tests..."
npx vitest run tests/backend/ --reporter=verbose

echo ""
echo "Running integration tests..."
npx vitest run tests/integration/ --reporter=verbose

echo ""
echo "=================================================="
echo "✅ All tests completed!"