import { Tag, NoteFilters } from '../types';

interface FilterControlsProps {
  tags: Tag[];
  filters: NoteFilters;
  onFiltersChange: (filters: NoteFilters) => void;
}

export function FilterControls({ tags, filters, onFiltersChange }: FilterControlsProps) {
  const toggleTag = (tagName: string) => {
    const currentTags = filters.tags || [];
    const newTags = currentTags.includes(tagName)
      ? currentTags.filter(t => t !== tagName)
      : [...currentTags, tagName];

    onFiltersChange({
      ...filters,
      tags: newTags.length > 0 ? newTags : undefined,
    });
  };

  const handleSortChange = (sortBy: 'created_at' | 'updated_at') => {
    onFiltersChange({ ...filters, sortBy });
  };

  const handleOrderChange = (sortOrder: 'asc' | 'desc') => {
    onFiltersChange({ ...filters, sortOrder });
  };

  const clearFilters = () => {
    onFiltersChange({
      sortBy: 'created_at',
      sortOrder: 'desc',
    });
  };

  const hasActiveFilters = (filters.tags && filters.tags.length > 0);

  return (
    <div className="filter-controls">
      <div className="filter-section">
        <h3>Filter by Tags</h3>
        <div className="tag-filters">
          {tags.length === 0 ? (
            <span className="no-tags">No tags yet. Create some notes!</span>
          ) : (
            tags.map((tag) => (
              <button
                key={tag.id}
                className={`tag-filter ${filters.tags?.includes(tag.name) ? 'active' : ''}`}
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
            value={filters.sortBy || 'created_at'}
            onChange={(e) => handleSortChange(e.target.value as 'created_at' | 'updated_at')}
          >
            <option value="created_at">Date Created</option>
            <option value="updated_at">Date Updated</option>
          </select>

          <select
            value={filters.sortOrder || 'desc'}
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
  );
}
