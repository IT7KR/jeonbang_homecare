#!/bin/bash
# scripts/dev.sh - Development environment startup script

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_DIR"

echo "=========================================="
echo "  전방 홈케어 - Development Environment"
echo "=========================================="

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "Error: .env file not found!"
    echo "Please copy .env.example to .env and configure it:"
    echo "  cp .env.example .env"
    exit 1
fi

# Load environment variables
source .env

# Check required variables
if [ -z "$DB_PASSWORD" ] || [ "$DB_PASSWORD" = "your_secure_password_here" ]; then
    echo "Error: DB_PASSWORD is not set in .env"
    exit 1
fi

if [ -z "$SECRET_KEY" ] || [ "$SECRET_KEY" = "your_secret_key_here" ]; then
    echo "Error: SECRET_KEY is not set in .env"
    exit 1
fi

if [ -z "$JWT_SECRET_KEY" ] || [ "$JWT_SECRET_KEY" = "your_jwt_secret_here" ]; then
    echo "Error: JWT_SECRET_KEY is not set in .env"
    exit 1
fi

if [ -z "$ENCRYPTION_KEY" ] || [ "$ENCRYPTION_KEY" = "your_encryption_key_here" ]; then
    echo "Error: ENCRYPTION_KEY is not set in .env"
    exit 1
fi

echo ""
echo "Starting development containers..."
echo ""

# Build and start containers
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build "$@"
