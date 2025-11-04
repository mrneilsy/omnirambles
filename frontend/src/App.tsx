import { useState, useEffect } from 'react';
import { NoteForm } from './components/NoteForm';
import { NoteCard } from './components/NoteCard';
import { FilterControls } from './components/FilterControls';
import { Note, Tag, NoteFilters } from './types';
import { createNote, getNotes, deleteNote, getAllTags } from './api';
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
      await createNote(content);
      await loadNotes();
      await loadTags();
    } catch (err) {
      console.error('Error creating note:', err);
      setError('Failed to create note. Make sure the backend and Ollama are running.');
    } finally {
      setIsLoading(false);
    }
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

  return (
    <div className="app">
      <header className="app-header">
        <h1>💭 OmniRambles</h1>
        <p>AI-powered note taking with automatic categorization</p>
      </header>

      <main className="app-main">
        <section className="note-input-section">
          <NoteForm onSubmit={handleCreateNote} isLoading={isLoading} />
          {error && <div className="error-message">{error}</div>}
        </section>

        <section className="filter-section">
          <FilterControls
            tags={tags}
            filters={filters}
            onFiltersChange={setFilters}
          />
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
                />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default App;
