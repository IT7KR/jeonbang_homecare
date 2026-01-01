#!/bin/bash
# scripts/deploy.sh - Production deployment script

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_DIR"

# Parse options
NO_CACHE=""
while [ $# -gt 0 ]; do
    case "$1" in
        --no-cache|-f)
            NO_CACHE="--no-cache"
            shift
            ;;
        *)
            shift
            ;;
    esac
done

echo "=========================================="
echo "  전방 홈케어 - Production Deployment"
echo "=========================================="

if [ -n "$NO_CACHE" ]; then
    echo "  Mode: Full rebuild (no cache)"
else
    echo "  Mode: Incremental build (cached)"
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "Error: .env file not found!"
    exit 1
fi

# Load environment variables
source .env

echo ""
echo "Step 1: Creating backup before deployment..."
"$SCRIPT_DIR/backup.sh" || echo "Warning: Backup failed or no existing database"

echo ""
echo "Step 2: Pulling latest code..."
if [ -d ".git" ]; then
    git pull origin main || git pull origin master || echo "Warning: Git pull failed"
fi

echo ""
echo "Step 3: Building new images..."
docker compose -f docker-compose.yml -f docker-compose.prod.yml build $NO_CACHE

echo ""
echo "Step 4: Stopping old containers..."
docker compose -f docker-compose.yml -f docker-compose.prod.yml down

echo ""
echo "Step 5: Starting new containers..."
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d

echo ""
echo "Step 6: Waiting for services to start..."
sleep 10

echo ""
echo "Step 7: Health check..."
HEALTH_URL="http://localhost/health"
MAX_RETRIES=30
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if curl -s -o /dev/null -w "%{http_code}" "$HEALTH_URL" | grep -q "200"; then
        echo "Health check passed!"
        break
    fi
    RETRY_COUNT=$((RETRY_COUNT + 1))
    echo "Waiting for services... ($RETRY_COUNT/$MAX_RETRIES)"
    sleep 2
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
    echo "Warning: Health check failed after $MAX_RETRIES retries"
    echo "Check logs with: ./scripts/logs.sh prod"
fi

echo ""
echo "Step 8: Cleaning up old images..."
docker image prune -f

echo ""
echo "=========================================="
echo "  Deployment Complete!"
echo "=========================================="
echo ""
docker compose -f docker-compose.yml -f docker-compose.prod.yml ps
echo ""
