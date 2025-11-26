#!/bin/bash
# scripts/logs.sh - View container logs

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_DIR"

# Determine environment
if [ "$1" = "prod" ] || [ "$1" = "production" ]; then
    COMPOSE_FILE="-f docker-compose.yml -f docker-compose.prod.yml"
    shift
else
    COMPOSE_FILE="-f docker-compose.yml -f docker-compose.dev.yml"
    if [ "$1" = "dev" ] || [ "$1" = "development" ]; then
        shift
    fi
fi

# Show logs
docker compose $COMPOSE_FILE logs -f "$@"
