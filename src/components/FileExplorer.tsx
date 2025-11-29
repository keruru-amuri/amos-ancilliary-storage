import React, { useState, useEffect } from 'react';
import { FileItem } from '../App';
import api from '../services/api';
import { uploadFileWithChunks, shouldUseChunkedUpload } from '../services/chunkedUpload';
import { Breadcrumb } from './Breadcrumb';
import { FileItemComponent } from './FileItemComponent';
import { CreateItemModal } from './CreateItemModal';
import { UploadConfirmationModal } from './UploadConfirmationModal';
import { StorageStats } from './StorageStats';
import { FolderPlus, Upload, ArrowUp, Search, X } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

interface FileExplorerProps {
  items: FileItem[];
  setItems: React.Dispatch<React.SetStateAction<FileItem[]>>;
  currentFolderId: string | null;
  setCurrentFolderId: (id: string | null) => void;
  onFileSelect: (file: FileItem) => void;
  selectedFileId?: string;
  onItemsChange?: (folderId: string | null) => void;
  breadcrumbPath: FileItem[];
}

export function FileExplorer({
  items,
  setItems,
  currentFolderId,
  setCurrentFolderId,
  onFileSelect,
  selectedFileId,
  onItemsChange,
  breadcrumbPath,
}: FileExplorerProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createType, setCreateType] = useState<'file' | 'folder'>('folder');
  const [uploading, setUploading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState({ 
    current: 0, 
    total: 0, 
    currentFileName: '', 
    percentage: 0 
  });

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<FileItem[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Get current folder's items
  const currentItems = items.filter(item => item.parentId === currentFolderId);

  // Get current folder details
  const currentFolder = currentFolderId ? items.find(item => item.id === currentFolderId) : null;

  const handleCreateItem = async (name: string) => {
    // Check if name already exists in current folder
    const nameExists = currentItems.some(
      item => item.name.toLowerCase() === name.toLowerCase()
    );

    if (nameExists) {
      toast.error(`A ${createType} with this name already exists`);
      return;
    }

    try {
      if (createType === 'folder') {
        const newFolder = await api.folders.create(name, currentFolderId);
        const folderItem: FileItem = {
          id: newFolder.id,
          name: newFolder.name,
          type: newFolder.type,
          parentId: newFolder.parentId,
          createdAt: new Date(newFolder.createdAt).getTime()
        };
        setItems(prev => [...prev, folderItem]);
        toast.success('Folder created successfully');
      } else {
        // For files, we still need the upload flow
        toast.info('Please use the upload button to add files');
      }
      setShowCreateModal(false);
      if (onItemsChange) {
        onItemsChange(currentFolderId);
      }
    } catch (error: any) {
      console.error('Failed to create item:', error);
      toast.error('Failed to create ' + createType + ': ' + (error.message || 'Unknown error'));
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    // Check file sizes - warn but don't block for very large files
    const WARN_SIZE = 100 * 1024 * 1024; // 100 MB
    const MAX_SIZE = 5 * 1024 * 1024 * 1024; // 5 GB (Azure Blob limit for single block blob)
    
    const oversizedFiles = Array.from(files).filter(file => file.size > MAX_SIZE);
    const largeFiles = Array.from(files).filter(file => file.size > WARN_SIZE && file.size <= MAX_SIZE);
    
    if (oversizedFiles.length > 0) {
      const fileNames = oversizedFiles.map(f => f.name).join(', ');
      toast.error(`The following files exceed the 5 GB limit: ${fileNames}`);
      event.target.value = '';
      return;
    }

    if (largeFiles.length > 0) {
      const fileNames = largeFiles.map(f => f.name).join(', ');
      toast.info(`Large files detected: ${fileNames}. Upload may take several minutes.`);
    }

    // Store selected files and show confirmation modal
    setSelectedFiles(Array.from(files));
    setShowUploadModal(true);
    
    // Reset input
    event.target.value = '';
  };

  const handleConfirmUpload = async () => {
    if (selectedFiles.length === 0) return;

    setUploading(true);
    const totalFiles = selectedFiles.length;
    
    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      
      // Initial progress for this file (0%)
      setUploadProgress({
        current: i + 1,
        total: totalFiles,
        currentFileName: file.name,
        percentage: 0,
        bytesUploaded: 0,
        totalBytes: file.size
      });

      // Check if name already exists
      const nameExists = currentItems.some(
        item => item.name.toLowerCase() === file.name.toLowerCase()
      );

      if (nameExists) {
        toast.error(`A file named "${file.name}" already exists`);
        continue;
      }

      try {
        // Determine file type from extension
        const fileExtension = file.name.split('.').pop()?.toLowerCase();
        let fileType = 'other';
        
        if (fileExtension === 'txt' || fileExtension === 'md' || file.type.startsWith('text/')) {
          fileType = 'text';
        } else if (fileExtension === 'pdf' || file.type === 'application/pdf') {
          fileType = 'pdf';
        } else if (fileExtension === 'docx' || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
          fileType = 'docx';
        } else if (fileExtension === 'xlsx' || file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
          fileType = 'xlsx';
        } else if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'bmp'].includes(fileExtension || '') || file.type.startsWith('image/')) {
          fileType = 'image';
        } else if (['mp4', 'webm', 'ogg', 'mov', 'avi'].includes(fileExtension || '') || file.type.startsWith('video/')) {
          fileType = 'video';
        }

        let uploadedFile;
        
        // Always use chunked upload for progress tracking
        uploadedFile = await uploadFileWithChunks(
          file, 
          currentFolderId, 
          fileType,
          (progress) => {
            // Update progress with bytes uploaded - this is the file-specific progress
            setUploadProgress({
              current: i + 1,
              total: totalFiles,
              currentFileName: file.name,
              percentage: progress.percentage,
              bytesUploaded: progress.uploadedBytes,
              totalBytes: progress.totalBytes
            });
          }
        );
        
        const newItem: FileItem = {
          id: uploadedFile.id,
          name: uploadedFile.name,
          type: 'file',
          parentId: uploadedFile.parentId,
          fileType: uploadedFile.fileType,
          size: uploadedFile.size,
          createdAt: new Date(uploadedFile.createdAt).getTime(),
        };

        setItems(prev => [...prev, newItem]);
        toast.success(`"${file.name}" uploaded successfully`);
      } catch (error: any) {
        console.error('Failed to upload file:', error);
        const msg = error?.message || 'Unknown error';

        // Friendly hints for common failure reasons
        if (msg.toLowerCase().includes('permission')) {
          toast.error(`Failed to upload "${file.name}": ${msg} — you may need write access for this folder.`);
        } else if (msg.toLowerCase().includes('authentication') || msg.toLowerCase().includes('sign in')) {
          toast.error(`Failed to upload "${file.name}": ${msg} — please sign in and try again.`);
        } else {
          toast.error(`Failed to upload "${file.name}": ${msg}`);
        }
      }
    }

    // Update final progress
    setUploadProgress({
      current: totalFiles,
      total: totalFiles,
      currentFileName: '',
      percentage: 100
    });

    setUploading(false);
    setShowUploadModal(false);
    setSelectedFiles([]);
    setUploadProgress({ current: 0, total: 0, currentFileName: '', percentage: 0 });
    
    if (onItemsChange) {
      onItemsChange(currentFolderId);
    }
  };

  const handleCancelUpload = () => {
    if (!uploading) {
      setShowUploadModal(false);
      setSelectedFiles([]);
      setUploadProgress({ current: 0, total: 0, currentFileName: '', percentage: 0 });
    }
  };

  const handleRename = async (id: string, newName: string) => {
    const item = items.find(i => i.id === id);
    if (!item) return;

    // Check if new name already exists in same folder
    const nameExists = currentItems.some(
      i => i.id !== id && i.name.toLowerCase() === newName.toLowerCase()
    );

    if (nameExists) {
      toast.error(`A ${item.type} with this name already exists`);
      return;
    }

    try {
      if (item.type === 'folder') {
        await api.folders.rename(id, newName);
      } else {
        await api.files.rename(id, newName);
      }
      
      setItems(prev =>
        prev.map(item => (item.id === id ? { ...item, name: newName } : item))
      );
      toast.success('Renamed successfully');
      
      if (onItemsChange) {
        onItemsChange(currentFolderId);
      }
    } catch (error: any) {
      console.error('Failed to rename:', error);
      toast.error('Failed to rename: ' + (error.message || 'Unknown error'));
    }
  };

  const handleDelete = async (id: string) => {
    const item = items.find(i => i.id === id);
    if (!item) return;

    try {
      if (item.type === 'folder') {
        const result = await api.folders.delete(id);
        toast.success(`Folder deleted (${result.deletedCount} items)`);
      } else {
        await api.files.delete(id);
        toast.success('File deleted');
      }
      
      // Remove from local state
      setItems(prev => prev.filter(i => i.id !== id));
      
      if (onItemsChange) {
        onItemsChange(currentFolderId);
      }
    } catch (error: any) {
      console.error('Failed to delete:', error);
      toast.error('Failed to delete: ' + (error.message || 'Unknown error'));
    }
  };

  const handleFolderClick = (folderId: string) => {
    setCurrentFolderId(folderId);
  };

  // Debounced search effect — queries the API.search endpoint
  useEffect(() => {
    if (!searchQuery || searchQuery.trim() === '') {
      setSearchResults(null);
      setSearchError(null);
      setIsSearching(false);
      return;
    }

    const query = searchQuery.trim();
    const timer = setTimeout(async () => {
      setIsSearching(true);
      setSearchError(null);
      try {
        const results = await api.search.search(query, currentFolderId);
        // convert results to local FileItem shape
        const converted = results.map(r => ({
          id: r.id,
          name: r.name,
          type: r.type,
          parentId: r.parentId,
          fileType: r.fileType,
          size: r.size,
          createdAt: new Date(r.createdAt).getTime(),
          downloadUrl: r.downloadUrl
        }));
        setSearchResults(converted);
      } catch (err: any) {
        console.error('Search failed', err);
        setSearchResults([]);
        setSearchError(err?.message || 'Search failed');
      } finally {
        setIsSearching(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [searchQuery, currentFolderId]);

  const handleGoUp = () => {
    // Get parent from breadcrumb path instead of items array
    if (breadcrumbPath.length > 0) {
      const currentIndex = breadcrumbPath.findIndex(item => item.id === currentFolderId);
      if (currentIndex > 0) {
        // Go to previous breadcrumb item
        setCurrentFolderId(breadcrumbPath[currentIndex - 1].id);
      } else if (currentIndex === 0) {
        // Go to root
        setCurrentFolderId(null);
      }
    }
  };

  return (
    <div className="flex flex-col h-full min-h-0 bg-sidebar">

      {/* Search (moved to the sidebar) */}
      <div className="px-6 py-4 border-b border-sidebar-border bg-card flex-shrink-0">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            aria-label="Search files and folders"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search files and folders..."
            className="w-full pl-10 pr-10 py-2.5 bg-input-background border border-border rounded-[var(--radius)] outline-none focus:ring-2 focus:ring-ring"
          />
          {searchQuery && (
            <button
              title="Clear search"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-[var(--radius)] hover:bg-accent/10 transition-colors"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
          {/* moved searching indicator into the file list area so it doesn't overlap the input */}
        </div>
      </div>

      {/* Breadcrumb Navigation */}
      <div className="px-6 py-4 border-b border-sidebar-border bg-card flex-shrink-0">
        <Breadcrumb
          currentFolderId={currentFolderId}
          breadcrumbPath={breadcrumbPath}
          onNavigate={setCurrentFolderId}
        />
      </div>

      {/* Action Buttons */}
      <div className="p-6 border-b border-sidebar-border flex gap-3 flex-wrap flex-shrink-0">
        <button
          onClick={() => {
            setCreateType('folder');
            setShowCreateModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-[var(--radius-button)] hover:opacity-90 transition-opacity"
        >
          <FolderPlus className="w-4 h-4" />
          <span>New Folder</span>
        </button>
        <label className="flex items-center gap-2 px-4 py-2.5 bg-secondary text-secondary-foreground rounded-[var(--radius-button)] hover:opacity-90 transition-opacity cursor-pointer">
          <Upload className="w-4 h-4" />
          <span>{uploading ? 'Uploading...' : 'Upload'}</span>
          <input
            type="file"
            multiple
            onChange={handleFileUpload}
            className="hidden"
            accept="*/*"
            disabled={uploading}
          />
        </label>
      </div>

      {/* Go Up Button */}
      {currentFolderId && (
        <div className="px-6 pt-4 flex-shrink-0">
          <button
            onClick={handleGoUp}
            className="flex items-center gap-2 px-3 py-2 w-full text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground rounded-[var(--radius)] transition-colors"
          >
            <ArrowUp className="w-4 h-4" />
            <span>Go Up</span>
          </button>
        </div>
      )}

      {/* File/Folder List (or search results) */}
      <div className="flex-1 min-h-0 overflow-y-auto p-6">
        {/* Global searching indicator — visible in the explorer area instead of inside the input */}
        {isSearching && (
          <div className="mb-4 px-2 py-2 flex items-center gap-2 text-sm text-muted-foreground">
            <span className="inline-block w-4 h-4 rounded-full border-2 border-t-primary border-muted/30 animate-spin" />
            <span>Searching…</span>
          </div>
        )}
        {/* Determine items to show: searchResults when present, otherwise current folder items */}
        {((searchResults !== null) ? (searchResults.length === 0) : currentItems.length === 0) ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-muted/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
            </div>
            <p className="text-muted-foreground">This folder is empty</p>
            <p className="text-muted-foreground mt-1">Create a new file or folder to get started</p>
          </div>
        ) : (
          <div className="space-y-1">
            {/* Folders first, then files */}
            {(searchResults ?? currentItems)
              .sort((a, b) => {
                if (a.type === b.type) {
                  return a.name.localeCompare(b.name);
                }
                return a.type === 'folder' ? -1 : 1;
              })
              .map(item => (
                <FileItemComponent
                  key={item.id}
                  item={item}
                  onRename={handleRename}
                  onDelete={handleDelete}
                  onFolderClick={(id) => {
                    // If user clicks a folder from search results, navigate into it
                    handleFolderClick(id);
                    // clear search so user sees folder contents
                    setSearchQuery('');
                    setSearchResults(null);
                  }}
                  onFileClick={onFileSelect}
                  isSelected={item.id === selectedFileId}
                />
              ))}
          </div>
        )}
      </div>

      {/* Storage Stats */}
      <StorageStats totalItems={items.length} />

      {/* Create Modal */}
      {showCreateModal && (
        <CreateItemModal
          type={createType}
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateItem}
        />
      )}

      {/* Upload Confirmation Modal */}
      {showUploadModal && (
        <UploadConfirmationModal
          files={selectedFiles}
          onConfirm={handleConfirmUpload}
          onCancel={handleCancelUpload}
          isUploading={uploading}
          uploadProgress={uploadProgress}
        />
      )}
    </div>
  );
}