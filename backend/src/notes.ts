import { pool } from './db';
import { Note, Tag, CreateNoteRequest, UpdateNoteRequest, NoteFilters } from './types';
import { categorizeTags } from './ollama';

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

    // Get AI-generated tags
    const tagNames = await categorizeTags(data.content);

    // Insert or get tags
    const tags: Tag[] = [];
    for (const tagName of tagNames) {
      const tagResult = await client.query(
        'INSERT INTO tags (name) VALUES ($1) ON CONFLICT (name) DO UPDATE SET name = $1 RETURNING *',
        [tagName]
      );
      const tag = tagResult.rows[0];
      tags.push(tag);

      // Link note to tag
      await client.query(
        'INSERT INTO note_tags (note_id, tag_id) VALUES ($1, $2)',
        [note.id, tag.id]
      );
    }

    await client.query('COMMIT');

    return {
      ...note,
      tags,
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

  let query = `
    SELECT n.*,
      json_agg(json_build_object('id', t.id, 'name', t.name)) FILTER (WHERE t.id IS NOT NULL) as tags
    FROM notes n
    LEFT JOIN note_tags nt ON n.id = nt.note_id
    LEFT JOIN tags t ON nt.tag_id = t.id
  `;

  const params: any[] = [];
  const conditions: string[] = [];

  if (tags.length > 0) {
    params.push(tags);
    conditions.push(`t.name = ANY($${params.length})`);
  }

  if (conditions.length > 0) {
    query += ` WHERE ${conditions.join(' AND ')}`;
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
      json_agg(json_build_object('id', t.id, 'name', t.name)) FILTER (WHERE t.id IS NOT NULL) as tags
    FROM notes n
    LEFT JOIN note_tags nt ON n.id = nt.note_id
    LEFT JOIN tags t ON nt.tag_id = t.id
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

    // Update note content if provided
    if (data.content !== undefined) {
      await client.query(
        'UPDATE notes SET content = $1 WHERE id = $2',
        [data.content, id]
      );
    }

    // Update tags if provided
    if (data.tags !== undefined) {
      // Remove existing tag associations
      await client.query('DELETE FROM note_tags WHERE note_id = $1', [id]);

      // Add new tags
      for (const tagName of data.tags) {
        const tagResult = await client.query(
          'INSERT INTO tags (name) VALUES ($1) ON CONFLICT (name) DO UPDATE SET name = $1 RETURNING *',
          [tagName.toLowerCase()]
        );
        const tag = tagResult.rows[0];

        await client.query(
          'INSERT INTO note_tags (note_id, tag_id) VALUES ($1, $2)',
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
