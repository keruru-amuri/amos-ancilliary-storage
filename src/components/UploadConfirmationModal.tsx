import React from 'react';
import { X, Upload, File } from 'lucide-react';
import { Progress } from './ui/progress';

interface UploadConfirmationModalProps {
  files: File[];
  onConfirm: () => void;
  onCancel: () => void;
  isUploading: boolean;
  uploadProgress: { 
    current: number; 
    total: number; 
    currentFileName: string; 
    percentage: number;
    bytesUploaded?: number;
    totalBytes?: number;
  };
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function UploadConfirmationModal({ 
  files, 
  onConfirm, 
  onCancel, 
  isUploading,
  uploadProgress 
}: UploadConfirmationModalProps) {
  const totalSize = files.reduce((acc, file) => acc + file.size, 0);
  const totalCount = files.length;
  const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100 MB
  const hasLargeFiles = files.some(file => file.size > 50 * 1024 * 1024); // Warn for files > 50MB

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={!isUploading ? onCancel : undefined}
    >
      <div
        className="bg-card border border-border rounded-[var(--radius-card)] shadow-[var(--elevation-sm)] w-full max-w-2xl max-h-[80vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            <h3 className="text-lg font-semibold">
              {isUploading ? 'Uploading Files...' : 'Confirm Upload'}
            </h3>
          </div>
          {!isUploading && (
            <button
              onClick={onCancel}
              className="p-1 rounded-[var(--radius)] hover:bg-accent/20 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Body */}
        <div className="p-4 overflow-y-auto flex-1">
          {/* Summary */}
          <div className="mb-4 p-3 bg-muted rounded-[var(--radius)] border border-border">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">
                {totalCount} {totalCount === 1 ? 'file' : 'files'} selected
              </span>
              <span className="text-sm text-muted-foreground">
                Total size: {formatFileSize(totalSize)}
              </span>
            </div>
          </div>

          {/* Large File Warning */}
          {hasLargeFiles && !isUploading && (
            <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-[var(--radius)] text-sm">
              <div className="flex gap-2">
                <span className="text-yellow-600 dark:text-yellow-400">⚠️</span>
                <div>
                  <div className="font-medium text-yellow-700 dark:text-yellow-300">Large file detected</div>
                  <div className="text-yellow-600/90 dark:text-yellow-400/90 mt-1">
                    Files larger than 100 MB will use chunked upload. Upload time depends on file size and connection speed.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Progress Section */}
          {isUploading && (
            <div className="mb-4 p-4 bg-muted rounded-[var(--radius)] border border-border space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="font-medium">
                  Uploading file {uploadProgress.current} of {uploadProgress.total}
                </span>
                <span className="text-muted-foreground font-medium">
                  {uploadProgress.percentage}%
                </span>
              </div>
              <Progress value={uploadProgress.percentage} className="h-3" />
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground truncate max-w-[60%]">
                  {uploadProgress.currentFileName}
                </span>
                {uploadProgress.bytesUploaded !== undefined && uploadProgress.totalBytes !== undefined && (
                  <span className="text-xs text-muted-foreground">
                    {formatFileSize(uploadProgress.bytesUploaded)} / {formatFileSize(uploadProgress.totalBytes)}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* File List */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium mb-2">Files to upload:</h4>
            <div className="space-y-1 max-h-60 overflow-y-auto">
              {files.map((file, index) => {
                const isCurrentFile = isUploading && uploadProgress.current === index + 1;
                const isCompleted = isUploading && uploadProgress.current > index + 1;
                // Use the percentage directly from uploadProgress for current file
                const filePercentage = isCurrentFile ? uploadProgress.percentage : 0;
                
                return (
                  <div
                    key={index}
                    className={`flex flex-col gap-2 p-2 bg-background border rounded-[var(--radius)] transition-colors ${
                      isCurrentFile ? 'border-primary bg-primary/5' : 'border-border hover:bg-accent/10'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <File className={`w-4 h-4 flex-shrink-0 ${isCurrentFile ? 'text-primary' : 'text-muted-foreground'}`} />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{file.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {formatFileSize(file.size)}
                        </div>
                      </div>
                      {isCompleted && (
                        <span className="text-xs text-green-600 dark:text-green-400 flex-shrink-0">
                          ✓
                        </span>
                      )}
                      {isCurrentFile && (
                        <span className="text-xs text-primary flex-shrink-0 font-medium">
                          {filePercentage}%
                        </span>
                      )}
                    </div>
                    
                    {/* Individual file progress bar */}
                    {isCurrentFile && uploadProgress.bytesUploaded !== undefined && (
                      <div className="space-y-1">
                        <Progress value={filePercentage} className="h-1.5" />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{formatFileSize(uploadProgress.bytesUploaded || 0)}</span>
                          <span>{formatFileSize(uploadProgress.totalBytes || file.size)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-2 p-4 border-t border-border">
          <button
            type="button"
            onClick={onCancel}
            disabled={isUploading}
            className="flex-1 px-4 py-2 bg-secondary text-secondary-foreground rounded-[var(--radius-button)] hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isUploading || files.length === 0}
            className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-[var(--radius-button)] hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isUploading ? (
              <>
                <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Upload {totalCount} {totalCount === 1 ? 'File' : 'Files'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
