const { DefaultAzureCredential } = require("@azure/identity");
const { TableClient } = require("@azure/data-tables");
const { BlobServiceClient, StorageSharedKeyCredential, generateBlobSASQueryParameters, BlobSASPermissions } = require("@azure/storage-blob");

// Environment variables
const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
const accountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY;
const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
const useConnectionString = process.env.USE_CONNECTION_STRING === 'true';
const managedIdentityClientId = process.env.AZURE_CLIENT_ID;

// Constants
const TABLE_NAME = "filesMetadata";
const PERMISSIONS_TABLE_NAME = "folderPermissions";
const CONTAINER_NAME = "cloudstore-files";

// Helper function to get container name
function getContainerName() {
  return CONTAINER_NAME;
}

// Determine authentication method
// Priority: 1) Connection String (if USE_CONNECTION_STRING=true), 2) Account Key, 3) Managed Identity
const useManagedIdentity = !useConnectionString && !accountKey;

// Managed Identity credential
let credential = null;

function getCredential() {
  if (!credential && useManagedIdentity) {
    // Use explicit client ID for user-assigned managed identity if provided
    const options = managedIdentityClientId 
      ? { managedIdentityClientId: managedIdentityClientId }
      : {};
    credential = new DefaultAzureCredential(options);
  }
  return credential;
}

// Table Storage Client
let tableClient = null;
let permissionsTableClient = null;

function getTableClient() {
  if (!tableClient) {
    if (useConnectionString) {
      // Local development with connection string
      tableClient = TableClient.fromConnectionString(connectionString, TABLE_NAME);
    } else if (accountKey) {
      // Production with account key (works without RBAC permissions)
      const sharedKeyCredential = new StorageSharedKeyCredential(accountName, accountKey);
      tableClient = new TableClient(
        `https://${accountName}.table.core.windows.net`,
        TABLE_NAME,
        sharedKeyCredential
      );
    } else {
      // Production with managed identity (requires RBAC roles)
      const cred = getCredential();
      tableClient = new TableClient(
        `https://${accountName}.table.core.windows.net`,
        TABLE_NAME,
        cred
      );
    }
  }
  return tableClient;
}

function getPermissionsTableClient() {
  if (!permissionsTableClient) {
    if (useConnectionString) {
      permissionsTableClient = TableClient.fromConnectionString(connectionString, PERMISSIONS_TABLE_NAME);
    } else if (accountKey) {
      const sharedKeyCredential = new StorageSharedKeyCredential(accountName, accountKey);
      permissionsTableClient = new TableClient(
        `https://${accountName}.table.core.windows.net`,
        PERMISSIONS_TABLE_NAME,
        sharedKeyCredential
      );
    } else {
      const cred = getCredential();
      permissionsTableClient = new TableClient(
        `https://${accountName}.table.core.windows.net`,
        PERMISSIONS_TABLE_NAME,
        cred
      );
    }
  }
  return permissionsTableClient;
}

// Blob Storage Client
let blobServiceClient = null;
let containerClient = null;

function getBlobServiceClient() {
  if (!blobServiceClient) {
    if (useConnectionString) {
      // Local development with connection string
      blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
    } else if (accountKey) {
      // Production with account key (works without RBAC permissions)
      const sharedKeyCredential = new StorageSharedKeyCredential(accountName, accountKey);
      blobServiceClient = new BlobServiceClient(
        `https://${accountName}.blob.core.windows.net`,
        sharedKeyCredential
      );
    } else {
      // Production with managed identity (requires RBAC roles)
      const cred = getCredential();
      blobServiceClient = new BlobServiceClient(
        `https://${accountName}.blob.core.windows.net`,
        cred
      );
    }
  }
  return blobServiceClient;
}

function getContainerClient() {
  if (!containerClient) {
    const blobService = getBlobServiceClient();
    containerClient = blobService.getContainerClient(CONTAINER_NAME);
  }
  return containerClient;
}

// Table Storage Operations
async function createEntity(entity) {
  const client = getTableClient();
  await client.createEntity(entity);
  return entity;
}

async function getEntity(partitionKey, rowKey) {
  const client = getTableClient();
  try {
    return await client.getEntity(partitionKey, rowKey);
  } catch (error) {
    if (error.statusCode === 404) {
      return null;
    }
    throw error;
  }
}

async function updateEntity(entity) {
  const client = getTableClient();
  await client.updateEntity(entity, "Merge");
  return entity;
}

async function deleteEntity(partitionKey, rowKey) {
  const client = getTableClient();
  await client.deleteEntity(partitionKey, rowKey);
}

async function queryEntities(filter) {
  const client = getTableClient();
  const entities = [];
  const iterator = client.listEntities({ queryOptions: { filter } });
  
  for await (const entity of iterator) {
    entities.push(entity);
  }
  
  return entities;
}

// Efficient lookup by rowKey using INDEX partition
async function getEntityByRowKey(rowKey, type = null) {
  const client = getTableClient();
  try {
    const entity = await client.getEntity('INDEX', rowKey);
    
    // Optionally filter by type
    if (type && entity.type !== type) {
      return null;
    }
    
    return entity;
  } catch (error) {
    if (error.statusCode === 404) {
      return null;
    }
    throw error;
  }
}

// Permission Table Operations
async function getPermissionEntity(partitionKey, rowKey) {
  const client = getPermissionsTableClient();
  try {
    return await client.getEntity(partitionKey, rowKey);
  } catch (error) {
    if (error.statusCode === 404) {
      return null;
    }
    throw error;
  }
}

async function upsertPermissionEntity(entity) {
  const client = getPermissionsTableClient();
  await client.upsertEntity(entity, "Replace");
  return entity;
}

async function deletePermissionEntity(partitionKey, rowKey) {
  const client = getPermissionsTableClient();
  await client.deleteEntity(partitionKey, rowKey);
}

async function queryPermissionEntities(filter) {
  const client = getPermissionsTableClient();
  const entities = [];
  const iterator = client.listEntities({ queryOptions: { filter } });
  
  for await (const entity of iterator) {
    entities.push(entity);
  }
  
  return entities;
}

// Blob Storage Operations
async function uploadBlob(blobName, buffer, contentType) {
  const container = getContainerClient();
  const blockBlobClient = container.getBlockBlobClient(blobName);
  
  await blockBlobClient.upload(buffer, buffer.length, {
    blobHTTPHeaders: { blobContentType: contentType }
  });
  
  return blockBlobClient.url;
}

async function deleteBlob(blobName) {
  const container = getContainerClient();
  const blockBlobClient = container.getBlockBlobClient(blobName);
  await blockBlobClient.deleteIfExists();
}

async function getBlobProperties(blobName) {
  const container = getContainerClient();
  const blockBlobClient = container.getBlockBlobClient(blobName);
  
  try {
    const properties = await blockBlobClient.getProperties();
    return properties;
  } catch (error) {
    if (error.statusCode === 404) {
      return null;
    }
    throw error;
  }
}

// SAS Token Generation
async function generateSasUrl(blobName, expiryMinutes = 60) {
  // If we have account key and account name, use traditional SAS (for local dev with connection string)
  if (accountKey && accountName) {
    const sharedKeyCredential = new StorageSharedKeyCredential(accountName, accountKey);
    
    const sasOptions = {
      containerName: CONTAINER_NAME,
      blobName: blobName,
      permissions: BlobSASPermissions.parse("r"), // read-only
      startsOn: new Date(new Date().valueOf() - 15 * 60 * 1000), // 15 min buffer for clock skew
      expiresOn: new Date(new Date().valueOf() + expiryMinutes * 60 * 1000)
    };
    
    const sasToken = generateBlobSASQueryParameters(sasOptions, sharedKeyCredential).toString();
    const sasUrl = `https://${accountName}.blob.core.windows.net/${CONTAINER_NAME}/${blobName}?${sasToken}`;
    
    return sasUrl;
  }
  
  // With Managed Identity, use User Delegation SAS
  const blobServiceClient = getBlobServiceClient();
  
  const startsOn = new Date(new Date().valueOf() - 15 * 60 * 1000);
  const expiresOn = new Date(new Date().valueOf() + expiryMinutes * 60 * 1000);
  
  // Get user delegation key (valid for up to 7 days)
  const userDelegationKey = await blobServiceClient.getUserDelegationKey(startsOn, expiresOn);
  
  const sasOptions = {
    containerName: CONTAINER_NAME,
    blobName: blobName,
    permissions: BlobSASPermissions.parse("r"),
    startsOn: startsOn,
    expiresOn: expiresOn
  };
  
  const sasToken = generateBlobSASQueryParameters(sasOptions, userDelegationKey, accountName).toString();
  return `https://${accountName}.blob.core.windows.net/${CONTAINER_NAME}/${blobName}?${sasToken}`;
}

// Helper Functions
function sanitizeFileName(fileName) {
  // Remove or replace characters that might cause issues
  return fileName
    .replace(/[<>:"/\\|?*\x00-\x1f]/g, '_')
    .replace(/\.\./g, '_')
    .trim();
}

function getBlobNameForFile(folderId, fileId, fileName) {
  const sanitized = sanitizeFileName(fileName);
  const folder = folderId || 'root';
  return `${folder}/${fileId}-${sanitized}`;
}

function getContentTypeFromFileName(fileName) {
  const ext = fileName.split('.').pop().toLowerCase();
  
  const contentTypes = {
    // Text
    'txt': 'text/plain',
    'md': 'text/markdown',
    'json': 'application/json',
    'xml': 'text/xml',
    'csv': 'text/csv',
    
    // Documents
    'pdf': 'application/pdf',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'xls': 'application/vnd.ms-excel',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'ppt': 'application/vnd.ms-powerpoint',
    'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    
    // Images
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'svg': 'image/svg+xml',
    'webp': 'image/webp',
    'bmp': 'image/bmp',
    
    // Video
    'mp4': 'video/mp4',
    'webm': 'video/webm',
    'ogg': 'video/ogg',
    'mov': 'video/quicktime',
    'avi': 'video/x-msvideo',
    
    // Audio
    'mp3': 'audio/mpeg',
    'wav': 'audio/wav',
    'ogg': 'audio/ogg',
    
    // Archives
    'zip': 'application/zip',
    'rar': 'application/x-rar-compressed',
    '7z': 'application/x-7z-compressed'
  };
  
  return contentTypes[ext] || 'application/octet-stream';
}

function determineFileType(fileName) {
  const ext = fileName.split('.').pop().toLowerCase();
  
  const textTypes = ['txt', 'md', 'json', 'xml', 'csv'];
  const imageTypes = ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'bmp'];
  const videoTypes = ['mp4', 'webm', 'ogg', 'mov', 'avi'];
  const audioTypes = ['mp3', 'wav', 'ogg'];
  
  if (ext === 'pdf') return 'pdf';
  if (ext === 'docx' || ext === 'doc') return 'docx';
  if (ext === 'xlsx' || ext === 'xls') return 'xlsx';
  if (ext === 'pptx' || ext === 'ppt') return 'pptx';
  if (textTypes.includes(ext)) return 'text';
  if (imageTypes.includes(ext)) return 'image';
  if (videoTypes.includes(ext)) return 'video';
  if (audioTypes.includes(ext)) return 'audio';
  
  return 'other';
}

// Initialize container and table
async function initializeStorage() {
  try {
    // Create container if it doesn't exist
    const container = getContainerClient();
    await container.createIfNotExists({
      access: 'none' // Private container
    });
    
    // Create files metadata table if it doesn't exist
    const client = getTableClient();
    await client.createTable().catch(() => {
      // Table might already exist, ignore error
    });
    
    // Create permissions table if it doesn't exist
    const permClient = getPermissionsTableClient();
    await permClient.createTable().catch(() => {
      // Table might already exist, ignore error
    });
    
    return true;
  } catch (error) {
    console.error('Failed to initialize storage:', error);
    throw error;
  }
}

module.exports = {
  // Table Storage
  createEntity,
  getEntity,
  updateEntity,
  deleteEntity,
  queryEntities,
  getEntityByRowKey,
  
  // Permission Table Storage
  getPermissionEntity,
  upsertPermissionEntity,
  deletePermissionEntity,
  queryPermissionEntities,
  
  // Blob Storage
  uploadBlob,
  deleteBlob,
  getBlobProperties,
  generateSasUrl,
  
  // Helpers
  sanitizeFileName,
  getBlobNameForFile,
  getContentTypeFromFileName,
  determineFileType,
  initializeStorage,
  getContainerName,
  
  // Constants
  TABLE_NAME,
  PERMISSIONS_TABLE_NAME,
  CONTAINER_NAME
};
