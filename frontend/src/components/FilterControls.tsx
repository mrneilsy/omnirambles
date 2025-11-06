import { useState } from 'react';
import { Tag, NoteFilters } from '../types';

interface FilterControlsProps {
  tags: Tag[];
  filters: NoteFilters;
  onFiltersChange: (filters: NoteFilters) => void;
}

export function FilterControls({ tags, filters, onFiltersChange }: FilterControlsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [tempFilters, setTempFilters] = useState<NoteFilters>(filters);

  const openFlyout = () => {
    setTempFilters(filters); // Sync with current filters when opening
    setIsOpen(true);
  };

  const toggleTag = (tagName: string) => {
    const currentTags = tempFilters.tags || [];
    const newTags = currentTags.includes(tagName)
      ? currentTags.filter(t => t !== tagName)
      : [...currentTags, tagName];

    setTempFilters({
      ...tempFilters,
      tags: newTags.length > 0 ? newTags : undefined,
    });
  };

  const handleSortChange = (sortBy: 'created_at' | 'updated_at') => {
    setTempFilters({ ...tempFilters, sortBy });
  };

  const handleOrderChange = (sortOrder: 'asc' | 'desc') => {
    setTempFilters({ ...tempFilters, sortOrder });
  };

  const clearFilters = () => {
    setTempFilters({
      sortBy: 'created_at',
      sortOrder: 'desc',
    });
  };

  const applyFilters = () => {
    onFiltersChange(tempFilters);
    setIsOpen(false);
  };

  const cancelFilters = () => {
    setTempFilters(filters);
    setIsOpen(false);
  };

  const hasActiveFilters = (tempFilters.tags && tempFilters.tags.length > 0);

  return (
    <>
      <button className="filter-fab" onClick={openFlyout} aria-label="Open filters">
        <svg viewBox="0 0 24 24" fill="white" stroke="white" strokeWidth="2">
          <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
        </svg>
      </button>

      {isOpen && <div className="filter-overlay" onClick={cancelFilters} />}

      <div className={`filter-flyout ${isOpen ? 'open' : ''}`}>
        <div className="filter-flyout-header">
          <h2>Filters</h2>
          <button className="flyout-close-btn" onClick={cancelFilters} aria-label="Close filters">
            ×
          </button>
        </div>

        <div className="filter-flyout-content">
          <div className="filter-section">
            <h3>Filter by Tags</h3>
            <div className="tag-filters">
              {tags.length === 0 ? (
                <span className="no-tags">No tags yet. Create some notes!</span>
              ) : (
                tags.map((tag) => (
                  <button
                    key={tag.id}
                    className={`tag-filter ${tempFilters.tags?.includes(tag.name) ? 'active' : ''}`}
                    onClick={() => toggleTag(tag.name)}
                  >
                    {tag.name}
                  </button>
                ))
              )}
            </div>
          </div>

          <div className="filter-section">
            <h3>Sort</h3>
            <div className="sort-controls">
              <select
                value={tempFilters.sortBy || 'created_at'}
                onChange={(e) => handleSortChange(e.target.value as 'created_at' | 'updated_at')}
              >
                <option value="created_at">Date Created</option>
                <option value="updated_at">Date Updated</option>
              </select>

              <select
                value={tempFilters.sortOrder || 'desc'}
                onChange={(e) => handleOrderChange(e.target.value as 'asc' | 'desc')}
              >
                <option value="desc">Newest First</option>
                <option value="asc">Oldest First</option>
              </select>
            </div>
          </div>

          {hasActiveFilters && (
            <button className="clear-filters" onClick={clearFilters}>
              Clear Filters
            </button>
          )}
        </div>

        <div className="filter-flyout-actions">
          <button className="cancel-btn" onClick={cancelFilters}>
            Cancel
          </button>
          <button className="apply-btn" onClick={applyFilters}>
            Apply Filters
          </button>
        </div>
      </div>
    </>
  );
}
