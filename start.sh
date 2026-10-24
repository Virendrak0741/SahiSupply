#!/usr/bin/env bash
# SahiSupply AI — Quick Startup Script
set -e

echo "=========================================================="
echo "🚀 Starting SahiSupply AI Full-Stack Platform"
echo "=========================================================="

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# 1. Start Backend Server
echo "Starting Backend REST API on http://localhost:5001..."
cd "$SCRIPT_DIR/backend"
node src/server.js &
BACKEND_PID=$!

# 2. Start Frontend Dev Server
echo "Starting Vite Frontend on http://localhost:5173..."
cd "$SCRIPT_DIR/frontend"
npx vite --host 0.0.0.0 --port 5173 &
FRONTEND_PID=$!

echo ""
echo "=========================================================="
echo "✨ SahiSupply AI is live!"
echo "   - Web Application: http://localhost:5173"
echo "   - Backend API:     http://localhost:5001"
echo "   - Python CLI:      python3 python_engine/cli.py --optimize"
echo "=========================================================="
echo "Press Ctrl+C to terminate both servers."

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true" EXIT
wait
