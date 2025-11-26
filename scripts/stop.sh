#!/bin/bash
# scripts/stop.sh - Stop all containers

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_DIR"

echo "Stopping containers..."

# Determine environment
if [ "$1" = "prod" ] || [ "$1" = "production" ]; then
    COMPOSE_FILE="-f docker-compose.yml -f docker-compose.prod.yml"
    ENV_NAME="production"
else
    COMPOSE_FILE="-f docker-compose.yml -f docker-compose.dev.yml"
    ENV_NAME="development"
fi

echo "Environment: $ENV_NAME"

# Stop containers
docker compose $COMPOSE_FILE down "$@"

echo ""
echo "All containers stopped."
