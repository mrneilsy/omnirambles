import axios from 'axios';
import { Note, Tag, NoteFilters } from './types';

const API_BASE = '/api';

export async function createNote(content: string): Promise<Note> {
  const response = await axios.post(`${API_BASE}/notes`, { content });
  return response.data;
}

export async function getNotes(filters?: NoteFilters): Promise<Note[]> {
  const params = new URLSearchParams();

  if (filters?.tags && filters.tags.length > 0) {
    params.append('tags', filters.tags.join(','));
  }
  if (filters?.sortBy) {
    params.append('sortBy', filters.sortBy);
  }
  if (filters?.sortOrder) {
    params.append('sortOrder', filters.sortOrder);
  }

  const response = await axios.get(`${API_BASE}/notes?${params.toString()}`);
  return response.data;
}

export async function deleteNote(id: number): Promise<void> {
  await axios.delete(`${API_BASE}/notes/${id}`);
}

export async function updateNoteTags(id: number, tags: string[]): Promise<Note> {
  const response = await axios.put(`${API_BASE}/notes/${id}`, { tags });
  return response.data;
}

export async function getAllTags(): Promise<Tag[]> {
  const response = await axios.get(`${API_BASE}/tags`);
  return response.data;
}
