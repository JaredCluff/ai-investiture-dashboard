#!/bin/bash
# AI-Investiture Dashboard — Deployment Script
#
# Builds the React app and starts/restarts the Podman nginx container.
# The container serves the built static files on port 8384, reachable
# publicly at https://investments.knowledgenexus.ai via Cloudflare tunnel.
#
# Usage:
#   ./deploy.sh          # Build + deploy (default)
#   ./deploy.sh build    # Build only
#   ./deploy.sh start    # Start container without rebuilding

set -e

MODE="${1:-deploy}"
CONTAINER_NAME="ai-investiture-dashboard"
RUNTIME="podman"
COMPOSE="${RUNTIME}-compose"

if ! command -v podman &>/dev/null; then
    RUNTIME="docker"
    COMPOSE="docker-compose"
fi

echo "AI-Investiture Dashboard — mode: $MODE"
echo ""

# ── Build ─────────────────────────────────────────────────────────────────────
if [ "$MODE" = "deploy" ] || [ "$MODE" = "build" ]; then
    echo "Installing dependencies..."
    npm ci

    echo "Building static assets..."
    npm run build

    echo "Build complete → dist/"
    echo ""
fi

# ── Deploy container ──────────────────────────────────────────────────────────
if [ "$MODE" = "deploy" ] || [ "$MODE" = "start" ]; then
    if [ ! -d "dist" ]; then
        echo "ERROR: dist/ not found. Run './deploy.sh build' first."
        exit 1
    fi

    if $COMPOSE ps "$CONTAINER_NAME" 2>/dev/null | grep -q "Up"; then
        echo "Restarting container '$CONTAINER_NAME'..."
        $COMPOSE restart
    else
        echo "Starting container '$CONTAINER_NAME'..."
        $COMPOSE up -d
    fi

    echo ""
    echo "Container:  http://localhost:8384"
    echo "Public URL: https://investments.knowledgenexus.ai"
fi

echo ""
echo "Done."
