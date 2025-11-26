#!/bin/bash
# scripts/prod.sh - Production environment startup script

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_DIR"

echo "=========================================="
echo "  전방 홈케어 - Production Environment"
echo "=========================================="

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "Error: .env file not found!"
    exit 1
fi

# Load environment variables
source .env

# Validate required environment variables
REQUIRED_VARS=(
    "DB_PASSWORD"
    "SECRET_KEY"
    "JWT_SECRET_KEY"
    "ENCRYPTION_KEY"
)

for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        echo "Error: $var is not set in .env"
        exit 1
    fi
done

# Check SSL certificates for production
SSL_DIR="$PROJECT_DIR/nginx/ssl"
if [ ! -f "$SSL_DIR/fullchain.pem" ] || [ ! -f "$SSL_DIR/privkey.pem" ]; then
    echo "Warning: SSL certificates not found in $SSL_DIR"
    echo "For production, please install SSL certificates:"
    echo "  - $SSL_DIR/fullchain.pem"
    echo "  - $SSL_DIR/privkey.pem"
    echo ""
    read -p "Continue without SSL? (y/N): " confirm
    if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
        exit 1
    fi
fi

echo ""
echo "Building production containers..."
echo ""

# Build containers
docker compose -f docker-compose.yml -f docker-compose.prod.yml build

echo ""
echo "Starting production containers..."
echo ""

# Start containers in detached mode
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d

echo ""
echo "=========================================="
echo "  Production environment is running!"
echo "=========================================="
echo ""
echo "Services:"
echo "  - Frontend: https://localhost"
echo "  - Backend API: https://localhost/api/v1"
echo ""
echo "Commands:"
echo "  - View logs: docker compose -f docker-compose.yml -f docker-compose.prod.yml logs -f"
echo "  - Stop: docker compose -f docker-compose.yml -f docker-compose.prod.yml down"
echo ""
