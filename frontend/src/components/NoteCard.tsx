import { Note } from '../types';

interface NoteCardProps {
  note: Note;
  onDelete: (id: number) => void;
  onEdit: (note: Note) => void;
}

export function NoteCard({ note, onDelete, onEdit }: NoteCardProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString();
  };

  return (
    <div className="note-card" onClick={() => onEdit(note)}>
      <div className="note-header">
        <span className="note-date">{formatDate(note.created_at)}</span>
        {note.current_version && note.current_version > 1 && (
          <span className="version-badge">v{note.current_version}</span>
        )}
        <button
          className="delete-btn"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(note.id);
          }}
          title="Delete note"
        >
          🗑️
        </button>
      </div>
      <div className="note-content">{note.content}</div>
      {note.tags && note.tags.length > 0 && (
        <div className="note-tags">
          {note.tags.map((tag) => (
            <span key={tag.id} className={`tag tag-${tag.source.toLowerCase()}`} title={`Source: ${tag.source}`}>
              {tag.name}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
