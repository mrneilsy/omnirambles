import { useState } from 'react';

interface NoteFormProps {
  onSubmit: (content: string) => Promise<void>;
  isLoading: boolean;
}

export function NoteForm({ onSubmit, isLoading }: NoteFormProps) {
  const [content, setContent] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (content.trim()) {
      await onSubmit(content.trim());
      setContent('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="note-form">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Write your note here... It will be automatically categorized by AI."
        disabled={isLoading}
        rows={4}
      />
      <button type="submit" disabled={isLoading || !content.trim()}>
        {isLoading ? '💭 Analyzing & Saving...' : '💾 Save Note'}
      </button>
    </form>
  );
}
