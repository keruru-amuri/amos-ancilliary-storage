import React, { useState, useRef, useEffect } from 'react';
import { FileItem } from '../App';
import api from '../services/api';
import { Folder, File, MoreVertical, Edit2, Trash2, Download } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';

interface FileItemComponentProps {
  item: FileItem;
  onRename: (id: string, newName: string) => void;
  onDelete: (id: string) => void;
  onFolderClick: (id: string) => void;
  onFileClick: (file: FileItem) => void;
  isSelected?: boolean;
}

export function FileItemComponent({
  item,
  onRename,
  onDelete,
  onFolderClick,
  onFileClick,
  isSelected,
}: FileItemComponentProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(item.name);
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showMenu]);

  const handleClick = () => {
    if (item.type === 'folder') {
      onFolderClick(item.id);
    } else {
      onFileClick(item);
    }
  };

  const handleRename = () => {
    if (editName.trim() && editName !== item.name) {
      onRename(item.id, editName.trim());
    } else {
      setEditName(item.name);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleRename();
    } else if (e.key === 'Escape') {
      setEditName(item.name);
      setIsEditing(false);
    }
  };

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(false);

    if (item.type === 'file') {
      try {
        // Get SAS URL from API
        const result = await api.files.getDownloadUrl(item.id);
        
        // Trigger download
        const link = document.createElement('a');
        link.href = result.downloadUrl;
        link.download = item.name;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast.success(`"${item.name}" downloaded successfully`);
      } catch (error: any) {
        console.error('Failed to download file:', error);
        toast.error('Failed to download: ' + (error.message || 'Unknown error'));
      }
    }
  };

  return (
    <div
      className={`group flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius)] transition-colors ${
        isSelected
          ? 'bg-sidebar-primary text-sidebar-primary-foreground'
          : 'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
      }`}
      onClick={() => { if (!isEditing) handleClick(); }}
      role="link"
      tabIndex={0}
      onKeyDown={(e) => {
        if (isEditing) return;
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      {/* Icon */}
      <div className="flex-shrink-0">
        {item.type === 'folder' ? (
          <Folder className="w-5 h-5" />
        ) : (
          <File className="w-5 h-5" />
        )}
      </div>

      {/* Name */}
      <div className="flex-1 min-w-0">
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            value={editName}
            onChange={e => setEditName(e.target.value)}
            onBlur={handleRename}
            onKeyDown={handleKeyDown}
            className="w-full px-2 py-1 bg-input-background border border-border rounded-[var(--radius)] outline-none focus:ring-2 focus:ring-ring text-foreground"
          />
        ) : (
          <div className="w-full text-left truncate">{item.name}</div>
        )}
      </div>

      {/* Actions Menu */}
      <div className="relative flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" ref={menuRef}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowMenu(!showMenu);
          }}
          className="p-1.5 rounded-[var(--radius)] hover:bg-accent/20"
        >
          <MoreVertical className="w-4 h-4" />
        </button>

        {showMenu && (
          <div className="absolute right-0 mt-1 w-44 bg-popover border border-border rounded-[var(--radius-popover)] shadow-[var(--elevation-sm)] z-10 overflow-hidden">
            {item.type === 'file' && (
              <button
                onClick={handleDownload}
                className="w-full flex items-center gap-2 px-3 py-2 text-popover-foreground hover:bg-accent/20 transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Download</span>
              </button>
            )}
            <button
              onClick={() => {
                setIsEditing(true);
                setShowMenu(false);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-popover-foreground hover:bg-accent/20 transition-colors"
            >
              <Edit2 className="w-4 h-4" />
              <span>Rename</span>
            </button>
            <button
              onClick={() => {
                setShowDeleteDialog(true);
                setShowMenu(false);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-destructive hover:bg-destructive/10 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete</span>
            </button>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogDescription>
            Are you sure you want to delete "{item.name}"?
            {item.type === 'folder' && (
              <span className="block mt-2 text-destructive font-medium">
                This will also delete all files and folders inside it. This action cannot be undone.
              </span>
            )}
            {item.type === 'file' && (
              <span className="block mt-2">
                This action cannot be undone.
              </span>
            )}
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onDelete(item.id);
                setShowDeleteDialog(false);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}