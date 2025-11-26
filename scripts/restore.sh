#!/bin/bash
# scripts/restore.sh - Database restore script

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_DIR"

# Load environment variables
if [ -f ".env" ]; then
    source .env
fi

# Default values
DB_USER="${DB_USER:-jeonbang}"
DB_NAME="${DB_NAME:-jeonbang_homecare}"
BACKUP_DIR="${PROJECT_DIR}/backups"

echo "=========================================="
echo "  Database Restore"
echo "=========================================="

# Check if backup file is provided
if [ -z "$1" ]; then
    echo ""
    echo "Available backups:"
    ls -lh "$BACKUP_DIR"/*.gz 2>/dev/null || echo "No backups found"
    echo ""
    echo "Usage: $0 <backup_file>"
    echo "Example: $0 backups/jeonbang_homecare_20240101_120000.sql.gz"
    exit 1
fi

BACKUP_FILE="$1"

if [ ! -f "$BACKUP_FILE" ]; then
    echo "Error: Backup file not found: $BACKUP_FILE"
    exit 1
fi

echo ""
echo "Database: $DB_NAME"
echo "Backup file: $BACKUP_FILE"
echo ""
echo "WARNING: This will overwrite the current database!"
read -p "Are you sure you want to continue? (y/N): " confirm

if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
    echo "Restore cancelled."
    exit 0
fi

echo ""
echo "Restoring database..."

# Check if file is gzipped
if [[ "$BACKUP_FILE" == *.gz ]]; then
    gunzip -c "$BACKUP_FILE" | docker exec -i jeonbang-db psql -U "$DB_USER" -d "$DB_NAME"
else
    docker exec -i jeonbang-db psql -U "$DB_USER" -d "$DB_NAME" < "$BACKUP_FILE"
fi

echo ""
echo "Database restored successfully!"
