import { pool } from './db';
import { Note, Tag, NoteVersion, CreateNoteRequest, UpdateNoteRequest, NoteFilters } from './types';

export async function createNote(data: CreateNoteRequest): Promise<Note> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Insert note
    const noteResult = await client.query(
      'INSERT INTO notes (content) VALUES ($1) RETURNING *',
      [data.content]
    );
    const note = noteResult.rows[0];

    // Create version 1
    const versionResult = await client.query(
      'INSERT INTO note_versions (note_id, version, content) VALUES ($1, 1, $2) RETURNING *',
      [note.id, data.content]
    );

    await client.query('COMMIT');

    return {
      ...note,
      current_version: 1,
      tags: [],
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function getNotes(filters: NoteFilters = {}): Promise<Note[]> {
  const {
    tags = [],
    sortBy = 'created_at',
    sortOrder = 'desc',
    limit = 100,
    offset = 0,
  } = filters;

  const params: any[] = [];
  const conditions: string[] = [];

  let query = `
    SELECT n.*,
      COALESCE(MAX(nv.version), 1) as current_version,
      COALESCE(
        (SELECT json_agg(json_build_object('id', t.id, 'name', t.name, 'source', t.source))
         FROM (SELECT DISTINCT t.id, t.name, t.source
               FROM note_tags nt2
               JOIN tags t ON nt2.tag_id = t.id
               WHERE nt2.note_id = n.id) t),
        '[]'::json
      ) as tags
    FROM notes n
    LEFT JOIN note_versions nv ON n.id = nv.note_id
  `;

  // Add tag filtering if needed
  if (tags.length > 0) {
    params.push(tags);
    query += `
    WHERE n.id IN (
      SELECT DISTINCT nt.note_id
      FROM note_tags nt
      JOIN tags t ON nt.tag_id = t.id
      WHERE t.name = ANY($${params.length})
    )`;
  }

  query += ` GROUP BY n.id`;
  query += ` ORDER BY n.${sortBy} ${sortOrder.toUpperCase()}`;
  query += ` LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;

  params.push(limit, offset);

  const result = await pool.query(query, params);
  return result.rows;
}

export async function getNoteById(id: number): Promise<Note | null> {
  const result = await pool.query(
    `
    SELECT n.*,
      COALESCE(MAX(nv.version), 1) as current_version,
      COALESCE(
        (SELECT json_agg(json_build_object('id', t.id, 'name', t.name, 'source', t.source))
         FROM (SELECT DISTINCT t.id, t.name, t.source
               FROM note_tags nt2
               JOIN tags t ON nt2.tag_id = t.id
               WHERE nt2.note_id = n.id) t),
        '[]'::json
      ) as tags
    FROM notes n
    LEFT JOIN note_versions nv ON n.id = nv.note_id
    WHERE n.id = $1
    GROUP BY n.id
    `,
    [id]
  );

  return result.rows[0] || null;
}

export async function updateNote(id: number, data: UpdateNoteRequest): Promise<Note | null> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // If content is being updated, create a new version
    if (data.content !== undefined) {
      // Get current max version
      const versionResult = await client.query(
        'SELECT COALESCE(MAX(version), 0) as max_version FROM note_versions WHERE note_id = $1',
        [id]
      );
      const newVersion = versionResult.rows[0].max_version + 1;

      // Update note content
      await client.query(
        'UPDATE notes SET content = $1 WHERE id = $2',
        [data.content, id]
      );

      // Create new version
      const newVersionResult = await client.query(
        'INSERT INTO note_versions (note_id, version, content) VALUES ($1, $2, $3) RETURNING *',
        [id, newVersion, data.content]
      );
      const version = newVersionResult.rows[0];

      // Copy current tags to new version
      await client.query(
        `INSERT INTO note_version_tags (note_version_id, tag_id)
         SELECT $1, tag_id FROM note_tags WHERE note_id = $2`,
        [version.id, id]
      );
    }

    // Update tags if provided
    if (data.tags !== undefined) {
      // Remove existing tag associations
      await client.query('DELETE FROM note_tags WHERE note_id = $1', [id]);

      // Add new tags
      for (const tagData of data.tags) {
        const tagResult = await client.query(
          'INSERT INTO tags (name, source) VALUES ($1, $2) ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING *',
          [tagData.name.toLowerCase(), tagData.source]
        );
        const tag = tagResult.rows[0];

        await client.query(
          'INSERT INTO note_tags (note_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [id, tag.id]
        );
      }
    }

    await client.query('COMMIT');

    return await getNoteById(id);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function deleteNote(id: number): Promise<boolean> {
  const result = await pool.query('DELETE FROM notes WHERE id = $1', [id]);
  return result.rowCount ? result.rowCount > 0 : false;
}

export async function getAllTags(): Promise<Tag[]> {
  const result = await pool.query(
    'SELECT * FROM tags ORDER BY name ASC'
  );
  return result.rows;
}

// Version history functions
export async function getNoteVersions(noteId: number): Promise<NoteVersion[]> {
  const result = await pool.query(
    `
    SELECT nv.*,
      COALESCE(
        (SELECT json_agg(json_build_object('id', t.id, 'name', t.name, 'source', t.source))
         FROM (SELECT DISTINCT t.id, t.name, t.source
               FROM note_version_tags nvt2
               JOIN tags t ON nvt2.tag_id = t.id
               WHERE nvt2.note_version_id = nv.id) t),
        '[]'::json
      ) as tags
    FROM note_versions nv
    WHERE nv.note_id = $1
    ORDER BY nv.version ASC
    `,
    [noteId]
  );
  return result.rows;
}

export async function getNoteVersion(noteId: number, version: number): Promise<NoteVersion | null> {
  const result = await pool.query(
    `
    SELECT nv.*,
      COALESCE(
        (SELECT json_agg(json_build_object('id', t.id, 'name', t.name, 'source', t.source))
         FROM (SELECT DISTINCT t.id, t.name, t.source
               FROM note_version_tags nvt2
               JOIN tags t ON nvt2.tag_id = t.id
               WHERE nvt2.note_version_id = nv.id) t),
        '[]'::json
      ) as tags
    FROM note_versions nv
    WHERE nv.note_id = $1 AND nv.version = $2
    `,
    [noteId, version]
  );
  return result.rows[0] || null;
}

// Tag management functions
export async function addTagToNote(noteId: number, tagName: string, source: 'AI' | 'Self'): Promise<Note | null> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Insert or get tag
    const tagResult = await client.query(
      'INSERT INTO tags (name, source) VALUES ($1, $2) ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING *',
      [tagName.toLowerCase(), source]
    );
    const tag = tagResult.rows[0];

    // Link note to tag
    await client.query(
      'INSERT INTO note_tags (note_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [noteId, tag.id]
    );

    await client.query('COMMIT');

    return await getNoteById(noteId);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function removeTagFromNote(noteId: number, tagId: number): Promise<Note | null> {
  await pool.query(
    'DELETE FROM note_tags WHERE note_id = $1 AND tag_id = $2',
    [noteId, tagId]
  );
  return await getNoteById(noteId);
}
