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
