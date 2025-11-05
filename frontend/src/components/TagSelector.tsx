import { useState } from 'react';
import { Tag } from '../types';

interface TagSelectorProps {
  availableTags: Tag[];
  onClose: () => void;
  onSave: (selectedTags: string[], newTags: string[]) => Promise<void>;
}

export function TagSelector({ availableTags, onClose, onSave }: TagSelectorProps) {
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [newTagInput, setNewTagInput] = useState('');
  const [newTags, setNewTags] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const toggleTag = (tagName: string) => {
    const updated = new Set(selectedTags);
    if (updated.has(tagName)) {
      updated.delete(tagName);
    } else {
      updated.add(tagName);
    }
    setSelectedTags(updated);
  };

  const addNewTag = () => {
    const trimmed = newTagInput.trim().toLowerCase();
    if (trimmed && !newTags.includes(trimmed) && !availableTags.some(t => t.name === trimmed)) {
      setNewTags([...newTags, trimmed]);
      setNewTagInput('');
    }
  };

  const removeNewTag = (tagName: string) => {
    setNewTags(newTags.filter(t => t !== tagName));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addNewTag();
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(Array.from(selectedTags), newTags);
      onClose();
    } catch (error) {
      console.error('Error saving tags:', error);
      alert('Failed to save tags. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <div className="tag-selector-overlay" onClick={onClose} />

      <div className="tag-selector-modal">
        <div className="tag-selector-header">
          <h2>Select Tags</h2>
          <button className="close-btn" onClick={onClose} aria-label="Close tag selector">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="tag-selector-content">
          <div className="tag-selector-section">
            <h3>Add New Tag</h3>
            <div className="new-tag-input-group">
              <input
                type="text"
                value={newTagInput}
                onChange={(e) => setNewTagInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Enter tag name..."
                className="new-tag-input"
              />
              <button
                onClick={addNewTag}
                disabled={!newTagInput.trim()}
                className="add-tag-btn"
              >
                Add
              </button>
            </div>

            {newTags.length > 0 && (
              <div className="new-tags-list">
                {newTags.map((tagName) => (
                  <div key={tagName} className="new-tag-item">
                    <span>{tagName}</span>
                    <button
                      onClick={() => removeNewTag(tagName)}
                      className="remove-new-tag-btn"
                      aria-label={`Remove ${tagName}`}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {availableTags.length > 0 && (
            <div className="tag-selector-section">
              <h3>Existing Tags</h3>
              <div className="tag-options">
                {availableTags.map((tag) => (
                  <button
                    key={tag.id}
                    className={`tag-option ${selectedTags.has(tag.name) ? 'selected' : ''}`}
                    onClick={() => toggleTag(tag.name)}
                  >
                    {tag.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="tag-selector-actions">
          <button className="cancel-btn" onClick={onClose} disabled={isSaving}>
            Skip
          </button>
          <button
            className="save-tags-btn"
            onClick={handleSave}
            disabled={isSaving || (selectedTags.size === 0 && newTags.length === 0)}
          >
            {isSaving ? 'Saving...' : 'Save Tags'}
          </button>
        </div>
      </div>
    </>
  );
}
