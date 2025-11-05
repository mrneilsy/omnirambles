import { useState } from 'react';
import { Tag } from '../types';
import { createTag, updateTag, deleteTag } from '../api';

interface TagManagerProps {
  tags: Tag[];
  onTagsChange: () => void;
}

type SortMode = 'alpha-asc' | 'alpha-desc' | 'popularity-asc' | 'popularity-desc';

export function TagManager({ tags, onTagsChange }: TagManagerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [editingTagId, setEditingTagId] = useState<number | null>(null);
  const [editingTagName, setEditingTagName] = useState('');
  const [sortMode, setSortMode] = useState<SortMode>('alpha-asc');

  const openFlyout = () => {
    setIsOpen(true);
  };

  const closeFlyout = () => {
    setIsOpen(false);
    setNewTagName('');
    setEditingTagId(null);
    setEditingTagName('');
  };

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;

    try {
      await createTag(newTagName.trim(), 'Self');
      setNewTagName('');
      onTagsChange();
    } catch (error) {
      console.error('Error creating tag:', error);
      alert('Failed to create tag');
    }
  };

  const handleEditClick = (tag: Tag) => {
    setEditingTagId(tag.id);
    setEditingTagName(tag.name);
  };

  const handleSaveEdit = async (tagId: number) => {
    if (!editingTagName.trim()) return;

    try {
      await updateTag(tagId, editingTagName.trim());
      setEditingTagId(null);
      setEditingTagName('');
      onTagsChange();
    } catch (error) {
      console.error('Error updating tag:', error);
      alert('Failed to update tag');
    }
  };

  const handleCancelEdit = () => {
    setEditingTagId(null);
    setEditingTagName('');
  };

  const handleDeleteTag = async (tagId: number, tagName: string) => {
    if (!confirm(`Delete tag "${tagName}"? This will remove it from all notes.`)) {
      return;
    }

    try {
      await deleteTag(tagId);
      onTagsChange();
    } catch (error) {
      console.error('Error deleting tag:', error);
      alert('Failed to delete tag');
    }
  };

  const handleSortChange = (newSortMode: SortMode) => {
    setSortMode(newSortMode);
    // Reload tags from backend when sort changes
    onTagsChange();
  };

  const getSortedTags = (): Tag[] => {
    const tagsCopy = [...tags];

    switch (sortMode) {
      case 'alpha-asc':
        return tagsCopy.sort((a, b) => a.name.localeCompare(b.name));
      case 'alpha-desc':
        return tagsCopy.sort((a, b) => b.name.localeCompare(a.name));
      case 'popularity-asc':
        return tagsCopy.sort((a, b) => (a.note_count || 0) - (b.note_count || 0));
      case 'popularity-desc':
        return tagsCopy.sort((a, b) => (b.note_count || 0) - (a.note_count || 0));
      default:
        return tagsCopy;
    }
  };

  const sortedTags = getSortedTags();

  return (
    <>
      <button className="tag-manager-btn" onClick={openFlyout} aria-label="Tag Manager">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M12 1v3m0 16v3M4.22 4.22l2.12 2.12m11.32 11.32l2.12 2.12M1 12h3m16 0h3M4.22 19.78l2.12-2.12m11.32-11.32l2.12-2.12" />
        </svg>
        <span>Tags</span>
      </button>

      {isOpen && <div className="tag-manager-overlay" onClick={closeFlyout} />}

      <div className={`tag-manager-flyout ${isOpen ? 'open' : ''}`}>
        <div className="tag-manager-flyout-header">
          <h2>Tag Manager</h2>
          <button className="close-btn" onClick={closeFlyout} aria-label="Close tag manager">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="tag-manager-flyout-content">
          <div className="tag-manager-section">
            <h3>Add New Tag</h3>
            <div className="tag-add-row">
              <input
                type="text"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateTag()}
                placeholder="Enter tag name..."
                className="tag-input"
              />
              <button onClick={handleCreateTag} className="tag-add-btn">
                Add
              </button>
            </div>
          </div>

          <div className="tag-manager-section">
            <div className="tag-list-header">
              <h3>All Tags ({tags.length})</h3>
              <select
                value={sortMode}
                onChange={(e) => handleSortChange(e.target.value as SortMode)}
                className="tag-sort-select"
              >
                <option value="alpha-asc">A → Z</option>
                <option value="alpha-desc">Z → A</option>
                <option value="popularity-desc">Most Popular</option>
                <option value="popularity-asc">Least Popular</option>
              </select>
            </div>

            <div className="tag-list">
              {sortedTags.length === 0 ? (
                <span className="no-tags">No tags yet. Create one above!</span>
              ) : (
                sortedTags.map((tag) => (
                  <div key={tag.id} className={`tag-item ${editingTagId === tag.id ? 'editing' : ''}`}>
                    {editingTagId === tag.id ? (
                      <div className="tag-edit-row">
                        <input
                          type="text"
                          value={editingTagName}
                          onChange={(e) => setEditingTagName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveEdit(tag.id);
                            if (e.key === 'Escape') handleCancelEdit();
                          }}
                          className="tag-edit-input"
                          autoFocus
                        />
                        <div className="tag-edit-actions">
                          <button onClick={() => handleSaveEdit(tag.id)} className="tag-save-btn">
                            ✓
                          </button>
                          <button onClick={handleCancelEdit} className="tag-cancel-btn">
                            ✕
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="tag-info">
                          <span className="tag-name">{tag.name}</span>
                          <span className="tag-count">{tag.note_count || 0}</span>
                        </div>
                        <div className="tag-actions">
                          <button onClick={() => handleEditClick(tag)} className="tag-edit-btn" title="Edit tag">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                          </button>
                          <button onClick={() => handleDeleteTag(tag.id, tag.name)} className="tag-delete-btn" title="Delete tag">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            </svg>
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
