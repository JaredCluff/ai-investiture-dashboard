# AI-Investiture Dashboard — Podman / OCI Containerfile
#
# Multi-stage build: Node.js builds the React app, nginx:alpine serves it.
#
# Build:
#   podman build -t ai-investiture-dashboard:latest -f Containerfile .
#
# Run:
#   podman run --rm -d -p 8384:80 --name ai-investiture-dashboard ai-investiture-dashboard:latest

# ── Stage 1: Build ────────────────────────────────────────────────────────────
FROM docker.io/node:20-alpine AS builder

WORKDIR /build

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# ── Stage 2: Serve ────────────────────────────────────────────────────────────
FROM docker.io/nginx:alpine

LABEL org.opencontainers.image.title="AI-Investiture Dashboard"
LABEL org.opencontainers.image.description="Investment tracking dashboard — investments.knowledgenexus.ai"
LABEL org.opencontainers.image.source="https://github.com/JaredCluff/ai-investiture-dashboard"

COPY --from=builder /build/dist /usr/share/nginx/html
COPY docker/nginx.conf /etc/nginx/nginx.conf

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD curl -f http://localhost/health || exit 1

EXPOSE 80
