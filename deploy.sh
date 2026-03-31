#!/bin/bash
# AI-Investiture Dashboard — Deployment Script
#
# Builds the React frontend + FastAPI backend and starts/restarts containers.
# Frontend served on port 8384 (nginx), backend on 127.0.0.1:8385 (FastAPI).
# Public URL: https://investments.knowledgenexus.ai via Cloudflare tunnel.
#
# Usage:
#   ./deploy.sh          # Build frontend + deploy both containers (default)
#   ./deploy.sh build    # Build frontend only
#   ./deploy.sh start    # Start containers without rebuilding frontend
#   ./deploy.sh restart  # Restart all containers

set -e

MODE="${1:-deploy}"
RUNTIME="podman"
COMPOSE="${RUNTIME}-compose"

if ! command -v podman &>/dev/null; then
    RUNTIME="docker"
    COMPOSE="docker-compose"
fi

echo "AI-Investiture Dashboard — mode: $MODE"
echo ""

# ── Build frontend ────────────────────────────────────────────────────────────
if [ "$MODE" = "deploy" ] || [ "$MODE" = "build" ]; then
    echo "Installing frontend dependencies..."
    npm ci

    echo "Building static assets..."
    npm run build

    echo "Frontend build complete → dist/"
    echo ""
fi

# ── Deploy containers ─────────────────────────────────────────────────────────
if [ "$MODE" = "deploy" ] || [ "$MODE" = "start" ] || [ "$MODE" = "restart" ]; then
    if [ "$MODE" = "deploy" ] || [ "$MODE" = "start" ]; then
        if [ ! -d "dist" ]; then
            echo "ERROR: dist/ not found. Run './deploy.sh build' first."
            exit 1
        fi
    fi

    echo "Building backend container image..."
    $COMPOSE build aii-backend

    if [ "$MODE" = "restart" ]; then
        echo "Restarting all containers..."
        $COMPOSE restart
    else
        echo "Starting all containers..."
        $COMPOSE up -d
    fi

    echo ""
    echo "Waiting for health checks..."
    sleep 3
    curl -sf http://localhost:8385/api/health && echo " ✓ Backend healthy" || echo " ✗ Backend not ready"
    curl -sf http://localhost:8384/health && echo " ✓ Frontend healthy" || echo " ✗ Frontend not ready"
    echo ""
    echo "Container (frontend): http://localhost:8384"
    echo "Container (backend):  http://localhost:8385"
    echo "Public URL:           https://investments.knowledgenexus.ai"
fi

echo ""
echo "Done."
