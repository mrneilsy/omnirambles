-- Migration script to add version history and tag source tracking
-- Run this if you already have an existing database

-- Add source column to tags table
ALTER TABLE tags ADD COLUMN IF NOT EXISTS source VARCHAR(10) DEFAULT 'AI' CHECK (source IN ('AI', 'Self'));

-- Update existing tags to have 'AI' source
UPDATE tags SET source = 'AI' WHERE source IS NULL;

-- Create note_versions table for version history
CREATE TABLE IF NOT EXISTS note_versions (
    id SERIAL PRIMARY KEY,
    note_id INTEGER REFERENCES notes(id) ON DELETE CASCADE,
    version INTEGER NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (note_id, version)
);

-- Create note_version_tags junction table for version-specific tags
CREATE TABLE IF NOT EXISTS note_version_tags (
    note_version_id INTEGER REFERENCES note_versions(id) ON DELETE CASCADE,
    tag_id INTEGER REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (note_version_id, tag_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_note_versions_note_id ON note_versions(note_id);
CREATE INDEX IF NOT EXISTS idx_note_versions_version ON note_versions(note_id, version);
CREATE INDEX IF NOT EXISTS idx_note_version_tags_note_version_id ON note_version_tags(note_version_id);
CREATE INDEX IF NOT EXISTS idx_note_version_tags_tag_id ON note_version_tags(tag_id);

-- Create initial versions for existing notes
INSERT INTO note_versions (note_id, version, content, created_at)
SELECT id, 1, content, created_at
FROM notes
WHERE NOT EXISTS (
    SELECT 1 FROM note_versions WHERE note_versions.note_id = notes.id
);

-- Copy existing note tags to version 1
INSERT INTO note_version_tags (note_version_id, tag_id)
SELECT nv.id, nt.tag_id
FROM note_versions nv
JOIN note_tags nt ON nv.note_id = nt.note_id
WHERE nv.version = 1
ON CONFLICT DO NOTHING;
