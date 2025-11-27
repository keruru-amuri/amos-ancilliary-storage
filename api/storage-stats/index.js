const { queryEntities, getContainerClient } = require('../shared/storageService');
const { createSuccessResponse, handleError } = require('../shared/utils');

async function calculateStorageStats() {
  // Get all file entities
  const fileFilter = `type eq 'file'`;
  const fileEntities = await queryEntities(fileFilter);
  
  // Get all folder entities
  const folderFilter = `type eq 'folder'`;
  const folderEntities = await queryEntities(folderFilter);
  
  // Calculate total size from files
  let usedBytes = 0;
  for (const file of fileEntities) {
    usedBytes += file.size || 0;
  }
  
  // For demo purposes, set a generous total capacity
  // In production, you might query the actual storage account quota
  const totalBytes = 50 * 1024 * 1024 * 1024; // 50 GB
  
  return {
    usedBytes,
    totalBytes,
    itemCount: fileEntities.length + folderEntities.length,
    fileCount: fileEntities.length,
    folderCount: folderEntities.length,
    usedGB: (usedBytes / (1024 * 1024 * 1024)).toFixed(2),
    totalGB: (totalBytes / (1024 * 1024 * 1024)).toFixed(1),
    percentageUsed: ((usedBytes / totalBytes) * 100).toFixed(1)
  };
}

module.exports = async function (context, req) {
  try {
    const stats = await calculateStorageStats();
    context.res = createSuccessResponse(stats);
    
  } catch (error) {
    await handleError(context, error, 'Failed to get storage statistics');
  }
};
