import { useState, useEffect } from 'react';
import { NoteForm } from './components/NoteForm';
import { NoteCard } from './components/NoteCard';
import { NoteEditor } from './components/NoteEditor';
import { FilterControls } from './components/FilterControls';
import { TagSelector } from './components/TagSelector';
import { TagManager } from './components/TagManager';
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
  const [showNoteEntry, setShowNoteEntry] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

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
      setIsTyping(false);
      setShowNoteEntry(false);
    } catch (err) {
      console.error('Error creating note:', err);
      setError('Failed to create note. Make sure the backend is running.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNoteCancel = () => {
    setIsTyping(false);
    setShowNoteEntry(false);
  };

  const handleNoteFocus = () => {
    setIsTyping(true);
  };

  const handleShowNoteEntry = () => {
    setShowNoteEntry(true);
    setIsTyping(true);
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
  };

  return (
    <div className="app">
      <main className="app-main">
        {showNoteEntry ? (
          <section className={`note-input-section ${isTyping ? 'expanded' : ''}`}>
            <NoteForm
              onSubmit={handleCreateNote}
              isLoading={isLoading}
              onCancel={handleNoteCancel}
              onFocus={handleNoteFocus}
            />
            {error && <div className="error-message">{error}</div>}
          </section>
        ) : (
          <button className="new-note-fab" onClick={handleShowNoteEntry}>
            <svg viewBox="0 0 24 24" fill="white" stroke="white" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="12" y1="18" x2="12" y2="12" />
              <line x1="9" y1="15" x2="15" y2="15" />
            </svg>
          </button>
        )}

        {!isTyping && <section className="notes-section">
          <div className="notes-section-header">
            <div className="notes-section-title">
              <h2>Your Notes {notes.length > 0 && <span className="note-count">({notes.length})</span>}</h2>
            </div>
            <div className="notes-actions">
              <FilterControls
                tags={tags}
                filters={filters}
                onFiltersChange={setFilters}
              />
              <TagManager
                tags={tags}
                onTagsChange={() => {
                  loadTags();
                  loadNotes();
                }}
              />
            </div>
          </div>
          <div className="notes-content expanded">
            {notes.length === 0 ? (
              <div className="empty-state">
                <p>No notes yet. Click the button above to create your first note!</p>
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
          </div>
        </section>}
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
