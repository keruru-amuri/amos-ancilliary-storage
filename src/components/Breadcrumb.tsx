import React from 'react';
import { FileItem } from '../App';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbProps {
  currentFolderId: string | null;
  items: FileItem[];
  onNavigate: (folderId: string | null) => void;
}

export function Breadcrumb({ currentFolderId, items, onNavigate }: BreadcrumbProps) {
  // Build breadcrumb path
  const buildPath = (): Array<{ id: string | null; name: string }> => {
    const path: Array<{ id: string | null; name: string }> = [{ id: null, name: 'Root' }];

    if (!currentFolderId) return path;

    const buildPathRecursive = (folderId: string) => {
      const folder = items.find(item => item.id === folderId);
      if (!folder) return;

      if (folder.parentId) {
        buildPathRecursive(folder.parentId);
      }

      path.push({ id: folder.id, name: folder.name });
    };

    buildPathRecursive(currentFolderId);
    return path;
  };

  const path = buildPath();

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
