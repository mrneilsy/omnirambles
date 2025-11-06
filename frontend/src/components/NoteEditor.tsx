import { useState, useEffect } from 'react';
import { Note, NoteVersion, Tag } from '../types';
import { updateNote, getNoteVersions, addTagToNote, removeTagFromNote } from '../api';
import './NoteEditor.css';

interface NoteEditorProps {
  note: Note;
  allTags: Tag[];
  onClose: () => void;
  onUpdate: () => void;
}

export function NoteEditor({ note, allTags, onClose, onUpdate }: NoteEditorProps) {
  const [content, setContent] = useState(note.content);
  const [versions, setVersions] = useState<NoteVersion[]>([]);
  const [currentVersion, setCurrentVersion] = useState<number>(note.current_version || 1);
  const [viewingVersion, setViewingVersion] = useState<NoteVersion | null>(null);
  const [isLoadingVersions, setIsLoadingVersions] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showTagDropdown, setShowTagDropdown] = useState(false);
  const [newTagInput, setNewTagInput] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadVersions();
  }, [note.id]);

  const loadVersions = async () => {
    setIsLoadingVersions(true);
    try {
      const fetchedVersions = await getNoteVersions(note.id);
      setVersions(fetchedVersions);
    } catch (err) {
      console.error('Error loading versions:', err);
      setError('Failed to load versions');
    } finally {
      setIsLoadingVersions(false);
    }
  };

  const handleSave = async () => {
    if (content.trim() === note.content) {
      setError('No changes to save');
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      await updateNote(note.id, content.trim());
      await loadVersions();
      setCurrentVersion(currentVersion + 1);
      onUpdate();
      onClose();
    } catch (err) {
      console.error('Error saving note:', err);
      setError('Failed to save note');
    } finally {
      setIsSaving(false);
    }
  };

  const handleViewVersion = (version: NoteVersion) => {
    setViewingVersion(version);
    setContent(version.content);
  };

  const handleBackToCurrent = () => {
    setViewingVersion(null);
    setContent(note.content);
  };

  const handleAddTag = async (tagName: string) => {
    try {
      await addTagToNote(note.id, tagName, 'Self');
      onUpdate();
      setShowTagDropdown(false);
      setNewTagInput('');
    } catch (err) {
      console.error('Error adding tag:', err);
      setError('Failed to add tag');
    }
  };

  const handleRemoveTag = async (tagId: number) => {
    try {
      await removeTagFromNote(note.id, tagId);
      onUpdate();
    } catch (err) {
      console.error('Error removing tag:', err);
      setError('Failed to remove tag');
    }
  };

  const handleAddNewTag = () => {
    if (newTagInput.trim()) {
      handleAddTag(newTagInput.trim().toLowerCase());
    }
  };

  // Filter out tags already on this note
  const availableTags = allTags.filter(
    tag => !note.tags?.some(noteTag => noteTag.id === tag.id)
  );

  return (
    <div className="note-editor-overlay" onClick={onClose}>
      <div className="note-editor" onClick={(e) => e.stopPropagation()}>
        <div className="note-editor-header">
          <h2>Edit Note</h2>
          <div className="version-info">
            {viewingVersion ? (
              <span className="viewing-version">
                Viewing v{viewingVersion.version} of {currentVersion}
              </span>
            ) : (
              <span className="current-version">Current: v{currentVersion}</span>
            )}
          </div>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="note-editor-body">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            disabled={viewingVersion !== null || isSaving}
            rows={10}
            className="note-editor-textarea"
          />

          <div className="note-editor-actions">
            {viewingVersion ? (
              <button onClick={handleBackToCurrent} className="back-btn">
                Back to Current Version
              </button>
            ) : (
              <button
                onClick={handleSave}
                disabled={isSaving || content.trim() === note.content}
                className="save-btn"
              >
                {isSaving ? 'Saving...' : 'Save as New Version'}
              </button>
            )}
          </div>

          {/* Tag Management Section */}
          <div className="tag-management">
            <h3>Tags</h3>
            <div className="current-tags">
              {note.tags && note.tags.length > 0 ? (
                note.tags.map((tag) => (
                  <span key={tag.id} className="tag tag-self">
                    {tag.name}
                    <button
                      className="tag-remove-btn"
                      onClick={() => handleRemoveTag(tag.id)}
                      title="Remove tag"
                    >
                      ×
                    </button>
                  </span>
                ))
              ) : (
                <p className="no-tags">No tags</p>
              )}
            </div>

            <div className="add-tag-section">
              <button
                className="add-tag-btn"
                onClick={() => setShowTagDropdown(!showTagDropdown)}
              >
                + Add Tag
              </button>

              {showTagDropdown && (
                <div className="tag-dropdown">
                  <div className="tag-dropdown-section">
                    <h4>Existing Tags</h4>
                    <div className="tag-list">
                      {availableTags.length > 0 ? (
                        availableTags.map((tag) => (
                          <button
                            key={tag.id}
                            className="tag-option"
                            onClick={() => handleAddTag(tag.name)}
                          >
                            {tag.name}
                          </button>
                        ))
                      ) : (
                        <p className="no-tags-available">All tags are already added</p>
                      )}
                    </div>
                  </div>

                  <div className="tag-dropdown-section">
                    <h4>Add New Tag</h4>
                    <div className="new-tag-input">
                      <input
                        type="text"
                        value={newTagInput}
                        onChange={(e) => setNewTagInput(e.target.value)}
                        placeholder="Enter tag name..."
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleAddNewTag();
                          }
                        }}
                      />
                      <button onClick={handleAddNewTag} disabled={!newTagInput.trim()}>
                        Add
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Version History Section */}
          <div className="version-history">
            <h3>Version History</h3>
            {isLoadingVersions ? (
              <p>Loading versions...</p>
            ) : versions.length > 0 ? (
              <div className="version-list">
                {versions.map((version) => (
                  <div
                    key={version.id}
                    className={`version-item ${viewingVersion?.id === version.id ? 'active' : ''}`}
                  >
                    <button
                      className="version-btn"
                      onClick={() => handleViewVersion(version)}
                    >
                      v{version.version}
                    </button>
                    <span className="version-date">
                      {new Date(version.created_at).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p>No version history available</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
