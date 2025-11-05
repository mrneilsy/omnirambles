import { useState, useEffect } from 'react';
import { NoteForm } from './components/NoteForm';
import { NoteCard } from './components/NoteCard';
import { NoteEditor } from './components/NoteEditor';
import { FilterControls } from './components/FilterControls';
import { TagSelector } from './components/TagSelector';
import { Note, Tag, NoteFilters } from './types';
import { createNote, getNotes, deleteNote, getAllTags, addTagToNote } from './api';
import './App.css';

function App() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [filters, setFilters] = useState<NoteFilters>({
    sortBy: 'created_at',
    sortOrder: 'desc',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [newNoteForTagging, setNewNoteForTagging] = useState<Note | null>(null);

  // Load notes and tags
  useEffect(() => {
    loadNotes();
    loadTags();
  }, [filters]);

  const loadNotes = async () => {
    try {
      setError(null);
      const fetchedNotes = await getNotes(filters);
      setNotes(fetchedNotes);
    } catch (err) {
      console.error('Error loading notes:', err);
      setError('Failed to load notes. Make sure the backend is running.');
    }
  };

  const loadTags = async () => {
    try {
      const fetchedTags = await getAllTags();
      setTags(fetchedTags);
    } catch (err) {
      console.error('Error loading tags:', err);
    }
  };

  const handleCreateNote = async (content: string) => {
    setIsLoading(true);
    setError(null);
    try {
      // Create note
      const newNote = await createNote(content);
      await loadNotes();
      await loadTags();
      // Show tag selector for the newly created note
      setNewNoteForTagging(newNote);
    } catch (err) {
      console.error('Error creating note:', err);
      setError('Failed to create note. Make sure the backend is running.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveTags = async (selectedTags: string[], newTags: string[]) => {
    if (!newNoteForTagging) return;

    try {
      // Add all selected existing tags
      for (const tagName of selectedTags) {
        await addTagToNote(newNoteForTagging.id, tagName, 'Self');
      }

      // Add all new tags
      for (const tagName of newTags) {
        await addTagToNote(newNoteForTagging.id, tagName, 'Self');
      }

      // Reload notes and tags
      await loadNotes();
      await loadTags();
    } catch (err) {
      console.error('Error saving tags:', err);
      throw err;
    }
  };

  const handleCloseTagSelector = () => {
    setNewNoteForTagging(null);
  };

  const handleDeleteNote = async (id: number) => {
    if (confirm('Are you sure you want to delete this note?')) {
      try {
        await deleteNote(id);
        await loadNotes();
      } catch (err) {
        console.error('Error deleting note:', err);
        setError('Failed to delete note.');
      }
    }
  };

  const handleEditNote = (note: Note) => {
    setEditingNote(note);
  };

  const handleCloseEditor = () => {
    setEditingNote(null);
  };

  const handleUpdateNote = async () => {
    await loadNotes();
    await loadTags();
    // Refresh the editing note data
    if (editingNote) {
      const updatedNotes = await getNotes();
      const updatedNote = updatedNotes.find(n => n.id === editingNote.id);
      if (updatedNote) {
        setEditingNote(updatedNote);
      }
    }
  };

  return (
    <div className="app">
      <FilterControls
        tags={tags}
        filters={filters}
        onFiltersChange={setFilters}
      />

      <main className="app-main">
        <section className="note-input-section">
          <NoteForm onSubmit={handleCreateNote} isLoading={isLoading} />
          {error && <div className="error-message">{error}</div>}
        </section>

        <section className="notes-section">
          <h2>
            Your Notes {notes.length > 0 && <span className="note-count">({notes.length})</span>}
          </h2>
          {notes.length === 0 ? (
            <div className="empty-state">
              <p>No notes yet. Start writing your first note above!</p>
            </div>
          ) : (
            <div className="notes-grid">
              {notes.map((note) => (
                <NoteCard
                  key={note.id}
                  note={note}
                  onDelete={handleDeleteNote}
                  onEdit={handleEditNote}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      {editingNote && (
        <NoteEditor
          note={editingNote}
          allTags={tags}
          onClose={handleCloseEditor}
          onUpdate={handleUpdateNote}
        />
      )}

      {newNoteForTagging && (
        <TagSelector
          availableTags={tags}
          onClose={handleCloseTagSelector}
          onSave={handleSaveTags}
        />
      )}
    </div>
  );
}

export default App;
