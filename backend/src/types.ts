export interface Note {
  id: number;
  content: string;
  created_at: Date;
  updated_at: Date;
  current_version?: number;
  tags?: Tag[];
}

export interface Tag {
  id: number;
  name: string;
  source: 'Self';
  note_count?: number;
}

export interface NoteVersion {
  id: number;
  note_id: number;
  version: number;
  content: string;
  created_at: Date;
  tags?: Tag[];
}

export interface CreateNoteRequest {
  content: string;
}

export interface UpdateNoteRequest {
  content?: string;
  tags?: Array<{ name: string; source: 'Self' }>;
}

export interface AddTagRequest {
  noteId: number;
  tagName: string;
  source: 'Self';
}

export interface RemoveTagRequest {
  noteId: number;
  tagId: number;
}

export interface NoteFilters {
  tags?: string[];
  sortBy?: 'created_at' | 'updated_at';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

// ============================================================================
// Authentication & User Types
// ============================================================================

export interface User {
  id: number;
  email: string;
  username: string;
  password_hash: string;
  created_at: Date;
  updated_at: Date;
  is_active: boolean;
  failed_login_attempts: number;
  locked_until: Date | null;
  last_login: Date | null;
}

export interface SafeUser {
  id: number;
  email: string;
  username: string;
  created_at: Date;
  updated_at: Date;
  is_active: boolean;
  last_login: Date | null;
}

export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface PasswordResetToken {
  id: number;
  user_id: number;
  token: string;
  expires_at: Date;
  created_at: Date;
  used_at: Date | null;
}

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: SafeUser;
    }
  }
}
