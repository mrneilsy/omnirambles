import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import cookieParser from 'cookie-parser';
import { testConnection, pool } from './db';
import { createNote, getNotes, getNoteById, updateNote, deleteNote, getAllTags, createTag, updateTag, deleteTag, getNoteVersions, getNoteVersion, addTagToNote, removeTagFromNote } from './notes';
import { CreateNoteRequest, UpdateNoteRequest, NoteFilters, RegisterRequest, LoginRequest, ChangePasswordRequest, ForgotPasswordRequest, ResetPasswordRequest } from './types';
import { registerUser, authenticateUser, getUserById, changePassword, createPasswordResetToken, resetPassword, updateUserProfile, deleteUser } from './auth';
import { requireAuth, loadUser } from './middleware/auth';
import { securityHeaders, loginLimiter, registerLimiter, passwordResetLimiter, apiLimiter, writeLimiter } from './middleware/security';
import { handleValidationErrors, validateRegistration, validateLogin, validateChangePassword, validateForgotPassword, validateResetPassword, validateNoteCreation, validateNoteUpdate, validateNoteId, validateTagCreation, validateTagUpdate, validateTagId, validateAddTagToNote, validateNoteFilters } from './middleware/validation';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const PgSession = connectPgSimple(session);

// ============================================================================
// Middleware Stack
// ============================================================================

// Security headers
app.use(securityHeaders);

// Cookie parser (required for session)
app.use(cookieParser());

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parser
app.use(express.json());

// Session configuration
app.use(
  session({
    store: new PgSession({
      pool: pool,
      tableName: 'session',
      createTableIfMissing: false,
    }),
    secret: process.env.SESSION_SECRET || 'your-secret-key-change-this-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: parseInt(process.env.SESSION_TIMEOUT || '86400000'), // 24 hours
      sameSite: 'strict',
    },
    name: 'omnirambles.sid',
  })
);

// Load user from session
app.use(loadUser);

// Serve frontend static files in production
const frontendDistPath = path.join(__dirname, '../../frontend/dist');
app.use(express.static(frontendDistPath));

// ============================================================================
// Health Check Endpoint (Public)
// ============================================================================

app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    authenticated: !!req.user
  });
});

// ============================================================================
// Authentication Endpoints
// ============================================================================

// Register new user
app.post('/api/auth/register', registerLimiter, validateRegistration, handleValidationErrors, async (req: Request, res: Response) => {
  try {
    const data: RegisterRequest = req.body;
    const user = await registerUser(data);

    // Auto-login after registration
    req.session.userId = user.id;
    req.session.user = user;

    res.status(201).json({ user });
  } catch (error) {
    console.error('Error registering user:', error);
    const message = error instanceof Error ? error.message : 'Failed to register user';
    res.status(400).json({ error: message });
  }
});

// Login user
app.post('/api/auth/login', loginLimiter, validateLogin, handleValidationErrors, async (req: Request, res: Response) => {
  try {
    const data: LoginRequest = req.body;
    const user = await authenticateUser(data);

    // Create session
    req.session.userId = user.id;
    req.session.user = user;

    res.json({ user });
  } catch (error) {
    console.error('Error logging in:', error);
    const message = error instanceof Error ? error.message : 'Failed to log in';
    res.status(401).json({ error: message });
  }
});

// Logout user
app.post('/api/auth/logout', requireAuth, async (req: Request, res: Response) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Error destroying session:', err);
      res.status(500).json({ error: 'Failed to log out' });
      return;
    }
    res.clearCookie('omnirambles.sid');
    res.json({ message: 'Logged out successfully' });
  });
});

// Get current user
app.get('/api/auth/me', requireAuth, async (req: Request, res: Response) => {
  res.json({ user: req.user });
});

// Change password
app.post('/api/auth/change-password', requireAuth, validateChangePassword, handleValidationErrors, async (req: Request, res: Response) => {
  try {
    const data: ChangePasswordRequest = req.body;
    await changePassword(req.user!.id, data.currentPassword, data.newPassword);
    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Error changing password:', error);
    const message = error instanceof Error ? error.message : 'Failed to change password';
    res.status(400).json({ error: message });
  }
});

// Request password reset
app.post('/api/auth/forgot-password', passwordResetLimiter, validateForgotPassword, handleValidationErrors, async (req: Request, res: Response) => {
  try {
    const data: ForgotPasswordRequest = req.body;
    const token = await createPasswordResetToken(data.email);

    // TODO: Send email with reset link
    // For now, return token in response (REMOVE THIS IN PRODUCTION!)
    if (process.env.NODE_ENV !== 'production') {
      res.json({
        message: 'Password reset link sent to email',
        token: token // DEV ONLY - remove in production
      });
    } else {
      res.json({ message: 'If the email exists, a reset link has been sent' });
    }
  } catch (error) {
    console.error('Error requesting password reset:', error);
    res.json({ message: 'If the email exists, a reset link has been sent' });
  }
});

// Reset password with token
app.post('/api/auth/reset-password', passwordResetLimiter, validateResetPassword, handleValidationErrors, async (req: Request, res: Response) => {
  try {
    const data: ResetPasswordRequest = req.body;
    await resetPassword(data.token, data.newPassword);
    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Error resetting password:', error);
    const message = error instanceof Error ? error.message : 'Failed to reset password';
    res.status(400).json({ error: message });
  }
});

// Update user profile
app.put('/api/auth/profile', requireAuth, async (req: Request, res: Response) => {
  try {
    const { email, username } = req.body;
    const user = await updateUserProfile(req.user!.id, { email, username });

    // Update session
    req.session.user = user;

    res.json({ user });
  } catch (error) {
    console.error('Error updating profile:', error);
    const message = error instanceof Error ? error.message : 'Failed to update profile';
    res.status(400).json({ error: message });
  }
});

// Delete account
app.delete('/api/auth/account', requireAuth, async (req: Request, res: Response) => {
  try {
    await deleteUser(req.user!.id);

    req.session.destroy((err) => {
      if (err) {
        console.error('Error destroying session:', err);
      }
      res.clearCookie('omnirambles.sid');
      res.json({ message: 'Account deleted successfully' });
    });
  } catch (error) {
    console.error('Error deleting account:', error);
    res.status(500).json({ error: 'Failed to delete account' });
  }
});

// ============================================================================
// Notes Endpoints (Protected)
// ============================================================================

// Create note
app.post('/api/notes', requireAuth, apiLimiter, writeLimiter, validateNoteCreation, handleValidationErrors, async (req: Request, res: Response) => {
  try {
    const data: CreateNoteRequest = req.body;
    const note = await createNote(req.user!.id, data);
    res.status(201).json(note);
  } catch (error) {
    console.error('Error creating note:', error);
    res.status(500).json({ error: 'Failed to create note' });
  }
});

// Get all notes (with filters)
app.get('/api/notes', requireAuth, apiLimiter, validateNoteFilters, handleValidationErrors, async (req: Request, res: Response) => {
  try {
    const filters: NoteFilters = {
      tags: req.query.tags ? (req.query.tags as string).split(',') : undefined,
      sortBy: (req.query.sortBy as 'created_at' | 'updated_at') || 'created_at',
      sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc',
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      offset: req.query.offset ? parseInt(req.query.offset as string) : undefined,
    };

    const notes = await getNotes(req.user!.id, filters);
    res.json(notes);
  } catch (error) {
    console.error('Error fetching notes:', error);
    res.status(500).json({ error: 'Failed to fetch notes' });
  }
});

// Get single note
app.get('/api/notes/:id', requireAuth, apiLimiter, validateNoteId, handleValidationErrors, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const note = await getNoteById(req.user!.id, id);

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

// Update note
app.put('/api/notes/:id', requireAuth, apiLimiter, writeLimiter, validateNoteUpdate, handleValidationErrors, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const data: UpdateNoteRequest = req.body;

    const note = await updateNote(req.user!.id, id, data);

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

// Delete note
app.delete('/api/notes/:id', requireAuth, apiLimiter, writeLimiter, validateNoteId, handleValidationErrors, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const deleted = await deleteNote(req.user!.id, id);

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

// ============================================================================
// Tags Endpoints (Protected)
// ============================================================================

// Get all tags
app.get('/api/tags', requireAuth, apiLimiter, async (req: Request, res: Response) => {
  try {
    const tags = await getAllTags(req.user!.id);
    res.json(tags);
  } catch (error) {
    console.error('Error fetching tags:', error);
    res.status(500).json({ error: 'Failed to fetch tags' });
  }
});

// Create tag
app.post('/api/tags', requireAuth, apiLimiter, writeLimiter, validateTagCreation, handleValidationErrors, async (req: Request, res: Response) => {
  try {
    const { name, source } = req.body;
    const tag = await createTag(req.user!.id, name, source);
    res.status(201).json(tag);
  } catch (error) {
    console.error('Error creating tag:', error);
    res.status(500).json({ error: 'Failed to create tag' });
  }
});

// Update tag
app.put('/api/tags/:id', requireAuth, apiLimiter, writeLimiter, validateTagUpdate, handleValidationErrors, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const { name } = req.body;

    const tag = await updateTag(req.user!.id, id, name);

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

// Delete tag
app.delete('/api/tags/:id', requireAuth, apiLimiter, writeLimiter, validateTagId, handleValidationErrors, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const deleted = await deleteTag(req.user!.id, id);

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

// ============================================================================
// Version History Endpoints (Protected)
// ============================================================================

// Get all versions of a note
app.get('/api/notes/:id/versions', requireAuth, apiLimiter, validateNoteId, handleValidationErrors, async (req: Request, res: Response) => {
  try {
    const noteId = parseInt(req.params.id);
    const versions = await getNoteVersions(req.user!.id, noteId);
    res.json(versions);
  } catch (error) {
    console.error('Error fetching note versions:', error);
    res.status(500).json({ error: 'Failed to fetch note versions' });
  }
});

// Get specific version of a note
app.get('/api/notes/:id/versions/:version', requireAuth, apiLimiter, async (req: Request, res: Response) => {
  try {
    const noteId = parseInt(req.params.id);
    const version = parseInt(req.params.version);
    const noteVersion = await getNoteVersion(req.user!.id, noteId, version);

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

// ============================================================================
// Note-Tag Management Endpoints (Protected)
// ============================================================================

// Add tag to note
app.post('/api/notes/:id/tags', requireAuth, apiLimiter, writeLimiter, validateAddTagToNote, handleValidationErrors, async (req: Request, res: Response) => {
  try {
    const noteId = parseInt(req.params.id);
    const { tagName, source } = req.body;

    const note = await addTagToNote(req.user!.id, noteId, tagName, source);

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

// Remove tag from note
app.delete('/api/notes/:id/tags/:tagId', requireAuth, apiLimiter, writeLimiter, async (req: Request, res: Response) => {
  try {
    const noteId = parseInt(req.params.id);
    const tagId = parseInt(req.params.tagId);

    const note = await removeTagFromNote(req.user!.id, noteId, tagId);

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
    const port = typeof PORT === 'string' ? parseInt(PORT) : PORT;
    app.listen(port, '0.0.0.0', () => {
      console.log(`🚀 Server running on http://0.0.0.0:${port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();
