import { useState } from 'react';

interface NoteFormProps {
  onSubmit: (content: string) => Promise<void>;
  isLoading: boolean;
  onCancel?: () => void;
  onFocus?: () => void;
}

export function NoteForm({ onSubmit, isLoading, onCancel, onFocus }: NoteFormProps) {
  const [content, setContent] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (content.trim()) {
      await onSubmit(content.trim());
      setContent('');
    }
  };

  const handleCancel = () => {
    setContent('');
    if (onCancel) {
      onCancel();
    }
  };

  const handleFocus = () => {
    if (onFocus) {
      onFocus();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="note-form">
      <div className="note-form-actions">
        <button type="submit" disabled={isLoading || !content.trim()}>
          {isLoading ? '💭 Saving...' : '💾 Save Note'}
        </button>
        <button
          type="button"
          className="cancel-note-btn"
          onClick={handleCancel}
          disabled={isLoading}
        >
          ✕ Cancel
        </button>
      </div>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onFocus={handleFocus}
        placeholder="Write your note here..."
        disabled={isLoading}
        rows={8}
      />
    </form>
  );
}
