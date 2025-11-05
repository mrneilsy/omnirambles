export interface Note {
  id: number;
  content: string;
  created_at: string;
  updated_at: string;
  current_version?: number;
  tags?: Tag[];
}

export interface Tag {
  id: number;
  name: string;
  source: 'Self';
}

export interface NoteVersion {
  id: number;
  note_id: number;
  version: number;
  content: string;
  created_at: string;
  tags?: Tag[];
}

export interface NoteFilters {
  tags?: string[];
  sortBy?: 'created_at' | 'updated_at';
  sortOrder?: 'asc' | 'desc';
}
