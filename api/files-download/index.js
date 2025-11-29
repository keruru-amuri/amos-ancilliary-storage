const storageService = require('../shared/storageService');
const { getEntityByRowKey, generateSasUrl } = storageService;
const { createSuccessResponse, createErrorResponse, handleError } = require('../shared/utils');
const { requireAuth } = require('../shared/auth');
const { PERMISSION, checkFolderAccess } = require('../shared/permissions');

module.exports = async function (context, req) {
  try {
    // Require authentication
    const user = requireAuth(context, req);
    if (!user) return;
    
    const { id } = req.params;
    
    if (!id) {
      context.res = createErrorResponse('File ID is required', 400);
      return;
    }
    
    // Use efficient INDEX lookup to find the file
    const file = await getEntityByRowKey(id, 'file');
    
    if (!file) {
      context.res = createErrorResponse('File not found', 404);
      return;
    }
    
    // Check permission to download (need READ on parent folder)
    const parentId = file.parentId || null;
    const access = await checkFolderAccess(user, parentId, PERMISSION.READ, storageService);
    if (!access.allowed) {
      context.res = createErrorResponse('You do not have permission to download this file', 403);
      return;
    }
    
    if (!file.blobName) {
      context.res = createErrorResponse('File has no blob data', 404);
      return;
    }
    
    // Generate SAS URL with 60-minute expiry
    const downloadUrl = generateSasUrl(file.blobName, 60);
    
    context.res = createSuccessResponse({
      downloadUrl,
      fileName: file.name,
      fileType: file.fileType,
      size: file.size
    });
    
  } catch (error) {
    await handleError(context, error, 'Failed to get file download URL');
  }
};
