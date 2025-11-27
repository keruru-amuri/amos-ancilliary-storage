import React, { useState, useRef, useEffect } from 'react';
import { X } from 'lucide-react';

interface CreateItemModalProps {
  type: 'file' | 'folder';
  onClose: () => void;
  onCreate: (name: string) => void;
}

export function CreateItemModal({ type, onClose, onCreate }: CreateItemModalProps) {
  const [name, setName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onCreate(name.trim());
      setName('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-card border border-border rounded-[var(--radius-card)] shadow-[var(--elevation-sm)] w-full max-w-md"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3>Create New {type === 'file' ? 'File' : 'Folder'}</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-[var(--radius)] hover:bg-accent/20 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-4">
          <div className="space-y-2">
            <label htmlFor="item-name">Name</label>
            <input
              ref={inputRef}
              id="item-name"
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Enter ${type} name`}
              className="w-full px-3 py-2 bg-input-background border border-border rounded-[var(--radius)] outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Footer */}
          <div className="flex gap-2 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-secondary text-secondary-foreground rounded-[var(--radius-button)] hover:opacity-90 transition-opacity"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-[var(--radius-button)] hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
