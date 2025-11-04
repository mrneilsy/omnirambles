#!/bin/bash

# Database setup script for existing PostgreSQL instance
# This creates the omnirambles database and runs the schema

echo "Creating omnirambles database..."

# Update these variables to match your PostgreSQL setup
DB_USER="${DB_USER:-postgres}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="omnirambles"

# Create database (will fail if it already exists, which is fine)
psql -U "$DB_USER" -h "$DB_HOST" -p "$DB_PORT" -c "CREATE DATABASE $DB_NAME;" 2>/dev/null || echo "Database already exists"

# Run the schema
echo "Setting up schema..."
psql -U "$DB_USER" -h "$DB_HOST" -p "$DB_PORT" -d "$DB_NAME" -f init.sql

echo "✅ Database setup complete!"
echo ""
echo "Next steps:"
echo "1. Copy .env.example to .env and update your database credentials"
echo "2. Run 'npm install' to install dependencies"
echo "3. Run 'npm run dev' to start the backend"
