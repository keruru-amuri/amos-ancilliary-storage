import React from 'react';
import { FileItem } from '../App';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbProps {
  currentFolderId: string | null;
  breadcrumbPath: FileItem[];
  onNavigate: (folderId: string | null) => void;
}

export function Breadcrumb({ currentFolderId, breadcrumbPath, onNavigate }: BreadcrumbProps) {
  // Build complete path with Home at the beginning
  const path: Array<{ id: string | null; name: string }> = [
    { id: null, name: 'Home' },
    ...breadcrumbPath.map(item => ({ id: item.id, name: item.name }))
  ];

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {path.map((segment, index) => (
        <React.Fragment key={segment.id || 'root'}>
          {index > 0 && (
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          )}
          <button
            onClick={() => onNavigate(segment.id)}
            className={`flex items-center gap-1.5 px-2 py-1 rounded-[var(--radius)] transition-colors ${
              index === path.length - 1
                ? 'text-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent/20'
            }`}
          >
            {index === 0 && <Home className="w-4 h-4" />}
            <span>{segment.name}</span>
          </button>
        </React.Fragment>
      ))}
    </div>
  );
}
