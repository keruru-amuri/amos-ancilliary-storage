import { BlockBlobClient } from '@azure/storage-blob';

const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || '/api';

export interface UploadProgress {
  fileName: string;
  uploadedBytes: number;
  totalBytes: number;
  percentage: number;
}

export interface SASTokenResponse {
  sasUrl: string;
  blobName: string;
  fileId: string;
  containerName: string;
  accountName: string;
  expiresOn: string;
  metadata: {
    fileId: string;
    fileName: string;
    parentId: string | null;
    fileType: string;
    fileSize: number;
  };
}

/**
 * Uploads a file directly to Azure Blob Storage using SAS token and chunked uploads
 * This bypasses Azure Functions size limits and supports files up to 190.7 TiB
 */
export async function uploadFileWithChunks(
  file: File,
  parentId: string | null,
  fileType: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<any> {
  try {
    // Initial progress callback (0%)
    if (onProgress) {
      onProgress({
        fileName: file.name,
        uploadedBytes: 0,
        totalBytes: file.size,
        percentage: 0
      });
    }

    // Step 1: Get SAS token from backend
    const sasResponse = await fetch(`${API_BASE_URL}/files/upload-sas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileName: file.name,
        parentId: parentId,
        fileType: fileType,
        fileSize: file.size
      })
    });

    if (!sasResponse.ok) {
      // Provide helpful client-facing messages for common failure modes
      const status = sasResponse.status;
      const errorData = await sasResponse.json().catch(() => ({ error: 'Failed to get upload token' }));

      if (status === 401) {
        throw new Error('Authentication required. Please sign in and try again.');
      }

      if (status === 403) {
        // Folder-level permissions may block uploads for non-admin users
        throw new Error(errorData.error || 'You do not have permission to upload to this folder. Ask an admin to grant you write access.');
      }

      throw new Error(errorData.error || 'Failed to get upload token');
    }

    const sasData: SASTokenResponse = await sasResponse.json();

    // Progress at 5% after getting SAS token
    if (onProgress) {
      onProgress({
        fileName: file.name,
        uploadedBytes: 0,
        totalBytes: file.size,
        percentage: 5
      });
    }

    // Step 2: Upload file directly to blob storage using manual chunked upload
    const blockBlobClient = new BlockBlobClient(sasData.sasUrl);
    const chunkSize = file.size > 10 * 1024 * 1024 
      ? 4 * 1024 * 1024   // 4 MB for files > 10 MB
      : 1 * 1024 * 1024;  // 1 MB for smaller files
    const totalChunks = Math.ceil(file.size / chunkSize);
    const blockIds: string[] = [];

    let uploadedBytes = 0;
    let lastReportedProgress = 5;

    for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
      const start = chunkIndex * chunkSize;
      const end = Math.min(start + chunkSize, file.size);
      const chunk = file.slice(start, end);

      // Azure block IDs must be base64 strings - pad the index for ordering
      const blockId = btoa(`block-${chunkIndex.toString().padStart(6, '0')}`);
      blockIds.push(blockId);

      await blockBlobClient.stageBlock(blockId, chunk, chunk.size);

      uploadedBytes = end;

      if (onProgress) {
        const uploadPercentage = Math.round((uploadedBytes / file.size) * 90) + 5;
        if (uploadPercentage > lastReportedProgress) {
          lastReportedProgress = uploadPercentage;
          onProgress({
            fileName: file.name,
            uploadedBytes,
            totalBytes: file.size,
            percentage: Math.min(uploadPercentage, 95)
          });
        }
      }
    }

    await blockBlobClient.commitBlockList(blockIds, {
      blobHTTPHeaders: {
        blobContentType: file.type || 'application/octet-stream'
      }
    });

    // Progress at 95% - upload complete, saving metadata
    if (onProgress) {
      onProgress({
        fileName: file.name,
        uploadedBytes: file.size,
        totalBytes: file.size,
        percentage: 95
      });
    }

    // Step 3: Commit metadata to backend (save to Azure Table Storage)
    const completeResponse = await fetch(`${API_BASE_URL}/files/upload-complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileId: sasData.metadata.fileId,
        fileName: sasData.metadata.fileName,
        parentId: sasData.metadata.parentId,
        fileType: sasData.metadata.fileType,
        blobName: sasData.blobName,
        fileSize: file.size
      })
    });

    if (!completeResponse.ok) {
      const status = completeResponse.status;
      const errorData = await completeResponse.json().catch(() => ({ error: 'Failed to save file metadata' }));

      if (status === 401) {
        throw new Error('Authentication required while committing upload. Please sign in and try again.');
      }

      if (status === 403) {
        throw new Error(errorData.error || 'You do not have permission to save files in this folder.');
      }

      throw new Error(errorData.error || 'Failed to save file metadata');
    }

    // Progress at 100% - fully complete
    if (onProgress) {
      onProgress({
        fileName: file.name,
        uploadedBytes: file.size,
        totalBytes: file.size,
        percentage: 100
      });
    }

    return await completeResponse.json();

  } catch (error: any) {
    console.error('Upload failed:', error);
    
    // Provide more specific error messages
    if (error.message?.includes('container does not exist')) {
      throw new Error('Storage container not configured. Please contact administrator.');
    } else if (error.message?.includes('SAS token')) {
      throw new Error('Upload token expired or invalid. Please try again.');
    } else if (error.message?.includes('network')) {
      throw new Error('Network error. Please check your connection and try again.');
    }
    
    throw new Error(error.message || 'Upload failed');
  }
}

/**
 * Determines if chunked upload should be used based on file size
 * Now always returns true to ensure progress tracking works for all files
 */
export function shouldUseChunkedUpload(fileSize: number): boolean {
  // Always use chunked upload for progress tracking
  // The Azure SDK handles small files efficiently anyway
  return true;
}
