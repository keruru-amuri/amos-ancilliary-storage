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
      const errorData = await sasResponse.json().catch(() => ({ error: 'Failed to get upload token' }));
      throw new Error(errorData.error || 'Failed to get upload token');
    }

    const sasData: SASTokenResponse = await sasResponse.json();

    // Step 2: Upload file directly to blob storage using chunked upload
    const blockBlobClient = new BlockBlobClient(sasData.sasUrl);

    // Configure upload options
    const blockSize = 4 * 1024 * 1024; // 4 MB blocks (optimal for most scenarios)
    const maxConcurrency = 4; // Upload up to 4 blocks in parallel

    // Perform the upload with progress tracking
    await blockBlobClient.uploadData(file, {
      blockSize: blockSize,
      concurrency: maxConcurrency,
      onProgress: (progressEvent) => {
        if (onProgress && progressEvent.loadedBytes) {
          onProgress({
            fileName: file.name,
            uploadedBytes: progressEvent.loadedBytes,
            totalBytes: file.size,
            percentage: Math.round((progressEvent.loadedBytes / file.size) * 100)
          });
        }
      },
      // Set blob HTTP headers
      blobHTTPHeaders: {
        blobContentType: file.type || 'application/octet-stream'
      }
    });

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
      const errorData = await completeResponse.json().catch(() => ({ error: 'Failed to save file metadata' }));
      throw new Error(errorData.error || 'Failed to save file metadata');
    }

    return await completeResponse.json();

  } catch (error: any) {
    console.error('Upload failed:', error);
    throw new Error(error.message || 'Upload failed');
  }
}

/**
 * Determines if chunked upload should be used based on file size
 * Files larger than 32 MB use chunked upload
 */
export function shouldUseChunkedUpload(fileSize: number): boolean {
  const CHUNK_THRESHOLD = 32 * 1024 * 1024; // 32 MB
  return fileSize > CHUNK_THRESHOLD;
}
