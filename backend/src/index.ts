import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { testConnection } from './db';
import { createNote, getNotes, getNoteById, updateNote, deleteNote, getAllTags, createTag, updateTag, deleteTag, getNoteVersions, getNoteVersion, addTagToNote, removeTagFromNote } from './notes';
import { CreateNoteRequest, UpdateNoteRequest, NoteFilters } from './types';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Serve frontend static files in production
const frontendDistPath = path.join(__dirname, '../../frontend/dist');
app.use(express.static(frontendDistPath));

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Notes endpoints
app.post('/api/notes', async (req: Request, res: Response) => {
  try {
    const data: CreateNoteRequest = req.body;

    if (!data.content || data.content.trim().length === 0) {
      res.status(400).json({ error: 'Note content is required' });
      return;
    }

    const note = await createNote(data);
    res.status(201).json(note);
  } catch (error) {
    console.error('Error creating note:', error);
    res.status(500).json({ error: 'Failed to create note' });
  }
});

app.get('/api/notes', async (req: Request, res: Response) => {
  try {
    const filters: NoteFilters = {
      tags: req.query.tags ? (req.query.tags as string).split(',') : undefined,
      sortBy: (req.query.sortBy as 'created_at' | 'updated_at') || 'created_at',
      sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc',
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      offset: req.query.offset ? parseInt(req.query.offset as string) : undefined,
    };

    const notes = await getNotes(filters);
    res.json(notes);
  } catch (error) {
    console.error('Error fetching notes:', error);
    res.status(500).json({ error: 'Failed to fetch notes' });
  }
});

app.get('/api/notes/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const note = await getNoteById(id);

    if (!note) {
      res.status(404).json({ error: 'Note not found' });
      return;
    }

    res.json(note);
  } catch (error) {
    console.error('Error fetching note:', error);
    res.status(500).json({ error: 'Failed to fetch note' });
  }
});

app.put('/api/notes/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const data: UpdateNoteRequest = req.body;

    const note = await updateNote(id, data);

    if (!note) {
      res.status(404).json({ error: 'Note not found' });
      return;
    }

    res.json(note);
  } catch (error) {
    console.error('Error updating note:', error);
    res.status(500).json({ error: 'Failed to update note' });
  }
});

app.delete('/api/notes/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const deleted = await deleteNote(id);

    if (!deleted) {
      res.status(404).json({ error: 'Note not found' });
      return;
    }

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting note:', error);
    res.status(500).json({ error: 'Failed to delete note' });
  }
});

app.get('/api/tags', async (req: Request, res: Response) => {
  try {
    const tags = await getAllTags();
    res.json(tags);
  } catch (error) {
    console.error('Error fetching tags:', error);
    res.status(500).json({ error: 'Failed to fetch tags' });
  }
});

app.post('/api/tags', async (req: Request, res: Response) => {
  try {
    const { name, source } = req.body;

    if (!name || name.trim().length === 0) {
      res.status(400).json({ error: 'Tag name is required' });
      return;
    }

    if (source !== 'Self') {
      res.status(400).json({ error: 'source must be "Self"' });
      return;
    }

    const tag = await createTag(name, source);
    res.status(201).json(tag);
  } catch (error) {
    console.error('Error creating tag:', error);
    res.status(500).json({ error: 'Failed to create tag' });
  }
});

app.put('/api/tags/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const { name } = req.body;

    if (!name || name.trim().length === 0) {
      res.status(400).json({ error: 'Tag name is required' });
      return;
    }

    const tag = await updateTag(id, name);

    if (!tag) {
      res.status(404).json({ error: 'Tag not found' });
      return;
    }

    res.json(tag);
  } catch (error) {
    console.error('Error updating tag:', error);
    res.status(500).json({ error: 'Failed to update tag' });
  }
});

app.delete('/api/tags/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const deleted = await deleteTag(id);

    if (!deleted) {
      res.status(404).json({ error: 'Tag not found' });
      return;
    }

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting tag:', error);
    res.status(500).json({ error: 'Failed to delete tag' });
  }
});

// Version history endpoints
app.get('/api/notes/:id/versions', async (req: Request, res: Response) => {
  try {
    const noteId = parseInt(req.params.id);
    const versions = await getNoteVersions(noteId);
    res.json(versions);
  } catch (error) {
    console.error('Error fetching note versions:', error);
    res.status(500).json({ error: 'Failed to fetch note versions' });
  }
});

app.get('/api/notes/:id/versions/:version', async (req: Request, res: Response) => {
  try {
    const noteId = parseInt(req.params.id);
    const version = parseInt(req.params.version);
    const noteVersion = await getNoteVersion(noteId, version);

    if (!noteVersion) {
      res.status(404).json({ error: 'Version not found' });
      return;
    }

    res.json(noteVersion);
  } catch (error) {
    console.error('Error fetching note version:', error);
    res.status(500).json({ error: 'Failed to fetch note version' });
  }
});

// Tag management endpoints
app.post('/api/notes/:id/tags', async (req: Request, res: Response) => {
  try {
    const noteId = parseInt(req.params.id);
    const { tagName, source } = req.body;

    if (!tagName || !source) {
      res.status(400).json({ error: 'tagName and source are required' });
      return;
    }

    if (source !== 'Self') {
      res.status(400).json({ error: 'source must be "Self"' });
      return;
    }

    const note = await addTagToNote(noteId, tagName, source);

    if (!note) {
      res.status(404).json({ error: 'Note not found' });
      return;
    }

    res.json(note);
  } catch (error) {
    console.error('Error adding tag to note:', error);
    res.status(500).json({ error: 'Failed to add tag to note' });
  }
});

app.delete('/api/notes/:id/tags/:tagId', async (req: Request, res: Response) => {
  try {
    const noteId = parseInt(req.params.id);
    const tagId = parseInt(req.params.tagId);

    const note = await removeTagFromNote(noteId, tagId);

    if (!note) {
      res.status(404).json({ error: 'Note not found' });
      return;
    }

    res.json(note);
  } catch (error) {
    console.error('Error removing tag from note:', error);
    res.status(500).json({ error: 'Failed to remove tag from note' });
  }
});

// Catch-all route to serve index.html for client-side routing
app.get('*', (req: Request, res: Response) => {
  res.sendFile(path.join(frontendDistPath, 'index.html'));
});

// Start server
async function start() {
  try {
    await testConnection();
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();
