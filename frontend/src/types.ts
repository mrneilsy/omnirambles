export interface Note {
  id: number;
  content: string;
  created_at: string;
  updated_at: string;
  tags?: Tag[];
}

export interface Tag {
  id: number;
  name: string;
}

export interface NoteFilters {
  tags?: string[];
  sortBy?: 'created_at' | 'updated_at';
  sortOrder?: 'asc' | 'desc';
}
