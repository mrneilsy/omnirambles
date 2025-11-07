-- Migration: Add Authentication and Multi-User Support
-- This migration adds users, sessions, and user ownership to existing tables
-- Run this after backing up your database!

-- ============================================================================
-- STEP 1: Create users table
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP WITH TIME ZONE,
    last_login TIMESTAMP WITH TIME ZONE
);

-- ============================================================================
-- STEP 2: Create sessions table for express-session with connect-pg-simple
-- ============================================================================
CREATE TABLE IF NOT EXISTS session (
    sid VARCHAR NOT NULL COLLATE "default",
    sess JSON NOT NULL,
    expire TIMESTAMP(6) NOT NULL,
    PRIMARY KEY (sid)
);

CREATE INDEX IF NOT EXISTS IDX_session_expire ON session (expire);

-- ============================================================================
-- STEP 3: Create password reset tokens table
-- ============================================================================
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    used_at TIMESTAMP WITH TIME ZONE
);

-- ============================================================================
-- STEP 4: Add user_id columns to existing tables
-- ============================================================================

-- Add user_id to notes table (nullable initially for migration)
ALTER TABLE notes ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE CASCADE;

-- Add user_id to tags table (nullable initially for migration)
ALTER TABLE tags ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE CASCADE;

-- ============================================================================
-- STEP 5: Create default admin user for existing data
-- ============================================================================
-- Password is 'admin123' - CHANGE THIS IMMEDIATELY AFTER MIGRATION!
-- This is a bcrypt hash with cost factor 12
INSERT INTO users (email, username, password_hash, is_active)
VALUES (
    'admin@omnirambles.local',
    'admin',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5yvSK3WZHD.3W',
    true
)
ON CONFLICT (email) DO NOTHING;

-- ============================================================================
-- STEP 6: Assign all existing notes and tags to admin user
-- ============================================================================
DO $$
DECLARE
    admin_user_id INTEGER;
BEGIN
    -- Get the admin user ID
    SELECT id INTO admin_user_id FROM users WHERE username = 'admin';

    -- Update all notes without a user_id
    UPDATE notes
    SET user_id = admin_user_id
    WHERE user_id IS NULL;

    -- Update all tags without a user_id
    UPDATE tags
    SET user_id = admin_user_id
    WHERE user_id IS NULL;

    RAISE NOTICE 'Assigned all existing data to admin user (ID: %)', admin_user_id;
END $$;

-- ============================================================================
-- STEP 7: Make user_id columns NOT NULL after data migration
-- ============================================================================
ALTER TABLE notes ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE tags ALTER COLUMN user_id SET NOT NULL;

-- ============================================================================
-- STEP 8: Create indexes for performance
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id);
CREATE INDEX IF NOT EXISTS idx_tags_user_id ON tags(user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires_at ON password_reset_tokens(expires_at);

-- ============================================================================
-- STEP 9: Add trigger to update users.updated_at
-- ============================================================================
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- STEP 10: Update tag uniqueness constraint
-- ============================================================================
-- Drop the old unique constraint on tag name (global)
ALTER TABLE tags DROP CONSTRAINT IF EXISTS tags_name_key;

-- Add new unique constraint: tag name must be unique per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_tags_name_user_id ON tags(name, user_id);

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================
-- Run these after migration to verify success:
--
-- SELECT COUNT(*) as total_users FROM users;
-- SELECT COUNT(*) as notes_with_users FROM notes WHERE user_id IS NOT NULL;
-- SELECT COUNT(*) as tags_with_users FROM tags WHERE user_id IS NOT NULL;
-- SELECT username, email, created_at FROM users;

-- ============================================================================
-- ROLLBACK SCRIPT (save separately before running migration!)
-- ============================================================================
-- ALTER TABLE notes DROP COLUMN IF EXISTS user_id;
-- ALTER TABLE tags DROP COLUMN IF EXISTS user_id;
-- DROP TABLE IF EXISTS password_reset_tokens;
-- DROP TABLE IF EXISTS session;
-- DROP TABLE IF EXISTS users CASCADE;
-- CREATE UNIQUE INDEX IF NOT EXISTS tags_name_key ON tags(name);
