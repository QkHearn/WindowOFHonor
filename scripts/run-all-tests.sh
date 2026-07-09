#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "==> Starting test database..."
docker compose -f docker-compose.test.yml up -d --wait

export DATABASE_URL="postgresql://honor_test:test_password@localhost:5433/windowofhonor_test"
export JWT_SECRET="test-jwt-secret-min-32-characters-long"
export MCP_SERVICE_TOKEN="test-mcp-service-token"

echo "==> API unit tests..."
cd apps/api
npm run test:unit

echo "==> API e2e tests..."
npm run test:e2e

echo "==> MCP tests..."
cd ../mcp
npm test

echo "==> Web tests..."
cd ../web
npm test

echo ""
echo "✅ All tests passed"
