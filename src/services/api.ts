// API Configuration
const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || '/api';

// Helper to get headers with optional content type
function getAuthHeaders(contentType?: string): HeadersInit {
  const headers: HeadersInit = {};
  
  if (contentType) {
    headers['Content-Type'] = contentType;
  }
  
  // SWA automatically includes x-ms-client-principal header for authenticated requests
  // No need to manually add auth headers
  
  return headers;
}

// Types
export interface FileItem {
  id: string;
  name: string;
  type: 'file' | 'folder';
  parentId: string | null;
  fileType?: string;
  size?: number;
  createdAt: string;
  downloadUrl?: string;
}

export interface StorageStats {
  usedBytes: number;
  totalBytes: number;
  itemCount: number;
  fileCount: number;
  folderCount: number;
  usedGB?: string;
  totalGB?: string;
  percentageUsed?: string;
}

// Error handling
class ApiError extends Error {
  constructor(public statusCode: number, message: string, public details?: any) {
    super(message);
    this.name = 'ApiError';
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    // Handle specific HTTP status codes
    if (response.status === 413) {
      throw new ApiError(
        413,
        'File is too large. Maximum file size is 100 MB.',
        { limit: '100 MB' }
      );
    }
    
    if (response.status === 401) {
      throw new ApiError(
        401,
        'Please sign in to continue.',
        { requiresAuth: true }
      );
    }
    
    if (response.status === 403) {
      throw new ApiError(
        403,
        'You do not have permission to perform this action.',
        { forbidden: true }
      );
    }
    
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new ApiError(
      response.status,
      errorData.error || `Request failed with status ${response.status}`,
      errorData.details
    );
  }
  return response.json();
}

// Folder API
export const foldersApi = {
  async create(name: string, parentId: string | null = null): Promise<FileItem> {
    const response = await fetch(`${API_BASE_URL}/folders`, {
      method: 'POST',
      headers: getAuthHeaders('application/json'),
      body: JSON.stringify({ name, parentId })
    });
    return handleResponse<FileItem>(response);
  },

  async list(parentId: string | null = null): Promise<FileItem[]> {
    const url = parentId 
      ? `${API_BASE_URL}/folders?parentId=${encodeURIComponent(parentId)}`
      : `${API_BASE_URL}/folders`;
    const response = await fetch(url, {
      headers: getAuthHeaders()
    });
    return handleResponse<FileItem[]>(response);
  },

  async delete(id: string): Promise<{ success: boolean; deletedCount: number }> {
    const response = await fetch(`${API_BASE_URL}/folders/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  async rename(id: string, name: string): Promise<FileItem> {
    const response = await fetch(`${API_BASE_URL}/folders/${id}`, {
      method: 'PATCH',
      headers: getAuthHeaders('application/json'),
      body: JSON.stringify({ name })
    });
    return handleResponse<FileItem>(response);
  },

  async getPath(id: string): Promise<FileItem[]> {
    const response = await fetch(`${API_BASE_URL}/folders/${id}/path`, {
      headers: getAuthHeaders()
    });
    return handleResponse<FileItem[]>(response);
  }
};

// Files API
export const filesApi = {
  async upload(file: File, parentId: string | null = null, fileType?: string): Promise<FileItem> {
    const formData = new FormData();
    formData.append('file', file);
    if (parentId) formData.append('parentId', parentId);
    if (fileType) formData.append('fileType', fileType);

    // For FormData, don't set Content-Type (browser sets it with boundary)
    // SWA automatically includes x-ms-client-principal header for authenticated requests
    const response = await fetch(`${API_BASE_URL}/files/upload`, {
      method: 'POST',
      body: formData
    });
    return handleResponse<FileItem>(response);
  },

  async getDownloadUrl(id: string): Promise<{ downloadUrl: string; fileName: string; fileType: string; size: number }> {
    const response = await fetch(`${API_BASE_URL}/files/${id}/download`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  async delete(id: string): Promise<{ success: boolean }> {
    const response = await fetch(`${API_BASE_URL}/files/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  async rename(id: string, name: string): Promise<FileItem> {
    const response = await fetch(`${API_BASE_URL}/files/${id}`, {
      method: 'PATCH',
      headers: getAuthHeaders('application/json'),
      body: JSON.stringify({ name })
    });
    return handleResponse<FileItem>(response);
  },

  async list(parentId: string | null = null): Promise<FileItem[]> {
    const url = parentId 
      ? `${API_BASE_URL}/files?parentId=${encodeURIComponent(parentId)}`
      : `${API_BASE_URL}/files`;
    const response = await fetch(url, {
      headers: getAuthHeaders()
    });
    return handleResponse<FileItem[]>(response);
  }
};

// Items API (combined files + folders)
export const itemsApi = {
  async list(parentId: string | null = null): Promise<FileItem[]> {
    const url = parentId 
      ? `${API_BASE_URL}/items?parentId=${encodeURIComponent(parentId)}`
      : `${API_BASE_URL}/items`;
    const response = await fetch(url, {
      headers: getAuthHeaders()
    });
    return handleResponse<FileItem[]>(response);
  }
};

// Search API
export const searchApi = {
  async search(query: string, parentId: string | null = null): Promise<FileItem[]> {
    const params = new URLSearchParams({ q: query });
    if (parentId) params.append('parentId', parentId);
    
    const response = await fetch(`${API_BASE_URL}/search?${params.toString()}`, {
      headers: getAuthHeaders()
    });
    return handleResponse<FileItem[]>(response);
  }
};

// Storage Stats API
export const storageApi = {
  async getStats(): Promise<StorageStats> {
    const response = await fetch(`${API_BASE_URL}/storage/stats`, {
      headers: getAuthHeaders()
    });
    return handleResponse<StorageStats>(response);
  }
};

// Combined API export
const api = {
  folders: foldersApi,
  files: filesApi,
  items: itemsApi,
  search: searchApi,
  storage: storageApi
};

export default api;
export { ApiError };
