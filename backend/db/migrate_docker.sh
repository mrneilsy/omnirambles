#!/bin/bash

# ============================================================================
# Docker PostgreSQL Migration Script
# Run authentication migration on Docker PostgreSQL
# ============================================================================

set -e  # Exit on error

# Configuration
CONTAINER_NAME="${POSTGRES_CONTAINER:-authsample-postgres}"
DB_USER="${POSTGRES_USER:-authuser}"
DB_NAME="${POSTGRES_DB:-omnirambles}"
MIGRATION_FILE="$(dirname "$0")/migration_add_auth.sql"

echo "======================================"
echo "OmniRambles Auth Migration (Docker)"
echo "======================================"
echo ""
echo "Container: $CONTAINER_NAME"
echo "Database:  $DB_NAME"
echo "User:      $DB_USER"
echo ""

# Check if container is running
if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    echo "❌ Error: Container '$CONTAINER_NAME' is not running"
    echo ""
    echo "Available containers:"
    docker ps --format "table {{.Names}}\t{{.Image}}\t{{.Status}}"
    echo ""
    echo "Usage: POSTGRES_CONTAINER=your-container-name ./migrate_docker.sh"
    exit 1
fi

# Check if migration file exists
if [ ! -f "$MIGRATION_FILE" ]; then
    echo "❌ Error: Migration file not found: $MIGRATION_FILE"
    exit 1
fi

echo "📦 Checking database..."
if ! docker exec "$CONTAINER_NAME" psql -U "$DB_USER" -lqt | cut -d \| -f 1 | grep -qw "$DB_NAME"; then
    echo "❌ Error: Database '$DB_NAME' does not exist"
    echo ""
    echo "Create it first with:"
    echo "  docker exec $CONTAINER_NAME psql -U $DB_USER -d postgres -c \"CREATE DATABASE $DB_NAME;\""
    exit 1
fi

echo "✅ Database exists"
echo ""

# Offer to backup
read -p "🔒 Create backup before migration? (recommended) [Y/n] " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Nn]$ ]]; then
    BACKUP_FILE="backup_before_auth_$(date +%Y%m%d_%H%M%S).sql"
    echo "📥 Creating backup: $BACKUP_FILE"
    docker exec "$CONTAINER_NAME" pg_dump -U "$DB_USER" "$DB_NAME" > "$BACKUP_FILE"
    echo "✅ Backup created: $BACKUP_FILE"
    echo ""
fi

# Run migration
read -p "🚀 Run authentication migration? [Y/n] " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Nn]$ ]]; then
    echo "🔧 Running migration..."
    docker exec -i "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" < "$MIGRATION_FILE"
    echo ""
    echo "✅ Migration complete!"
    echo ""

    # Verify
    echo "🔍 Verifying migration..."
    echo ""
    echo "Users table:"
    docker exec "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" -c "SELECT id, username, email, created_at FROM users;"
    echo ""
    echo "Notes with user_id:"
    docker exec "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" -c "SELECT COUNT(*) as notes_with_user_id FROM notes WHERE user_id IS NOT NULL;"
    echo ""
    echo "Tags with user_id:"
    docker exec "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" -c "SELECT COUNT(*) as tags_with_user_id FROM tags WHERE user_id IS NOT NULL;"
    echo ""

    echo "======================================"
    echo "✅ Migration Successful!"
    echo "======================================"
    echo ""
    echo "⚠️  Default admin credentials (CHANGE IMMEDIATELY):"
    echo "   Email:    admin@omnirambles.local"
    echo "   Username: admin"
    echo "   Password: admin123"
    echo ""
    echo "Next steps:"
    echo "1. Update backend/.env with SESSION_SECRET"
    echo "2. Restart the backend server"
    echo "3. Change admin password via API"
    echo ""
else
    echo "❌ Migration cancelled"
    exit 1
fi
