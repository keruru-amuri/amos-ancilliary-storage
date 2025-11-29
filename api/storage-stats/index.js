const storageService = require('../shared/storageService');
const { queryEntities } = storageService;
const { createSuccessResponse, handleError } = require('../shared/utils');
const { requireAuth } = require('../shared/auth');

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
  
  // We do not enforce a local quota here — Azure storage accounts have very large limits.
  // Avoid returning a hard-coded total capacity to prevent clients from showing misleading quotas.
  return {
    usedBytes,
    // totalBytes intentionally omitted (null) so UI/clients should not show an arbitrary limit
    totalBytes: null,
    itemCount: fileEntities.length + folderEntities.length,
    fileCount: fileEntities.length,
    folderCount: folderEntities.length,
    usedGB: (usedBytes / (1024 * 1024 * 1024)).toFixed(2),
    totalGB: null,
    percentageUsed: null
  };
}

module.exports = async function (context, req) {
  try {
    // Require authentication
    const user = requireAuth(context, req);
    if (!user) return;
    const stats = await calculateStorageStats();
    context.res = createSuccessResponse(stats);
    
  } catch (error) {
    await handleError(context, error, 'Failed to get storage statistics');
  }
};
