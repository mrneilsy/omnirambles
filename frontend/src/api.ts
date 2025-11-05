import axios from 'axios';
import { Note, Tag, NoteFilters, NoteVersion } from './types';

const API_BASE = '/api';

export async function createNote(content: string, skipAiTagging: boolean = false): Promise<Note> {
  const response = await axios.post(`${API_BASE}/notes`, { content, skipAiTagging });
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

export async function updateNote(id: number, content: string): Promise<Note> {
  const response = await axios.put(`${API_BASE}/notes/${id}`, { content });
  return response.data;
}

export async function getAllTags(): Promise<Tag[]> {
  const response = await axios.get(`${API_BASE}/tags`);
  return response.data;
}

// Version history API
export async function getNoteVersions(noteId: number): Promise<NoteVersion[]> {
  const response = await axios.get(`${API_BASE}/notes/${noteId}/versions`);
  return response.data;
}

export async function getNoteVersion(noteId: number, version: number): Promise<NoteVersion> {
  const response = await axios.get(`${API_BASE}/notes/${noteId}/versions/${version}`);
  return response.data;
}

// Tag management API
export async function addTagToNote(noteId: number, tagName: string, source: 'AI' | 'Self'): Promise<Note> {
  const response = await axios.post(`${API_BASE}/notes/${noteId}/tags`, { tagName, source });
  return response.data;
}

export async function removeTagFromNote(noteId: number, tagId: number): Promise<Note> {
  const response = await axios.delete(`${API_BASE}/notes/${noteId}/tags/${tagId}`);
  return response.data;
}
