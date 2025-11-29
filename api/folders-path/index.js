const storageService = require('../shared/storageService');
const { getEntityByRowKey } = storageService;
const { createSuccessResponse, createErrorResponse, mapEntityToItem, handleError } = require('../shared/utils');
const { requireAuth } = require('../shared/auth');

async function buildPath(folderId) {
  const path = [];
  let currentId = folderId;
  
  while (currentId) {
    // Efficient point query using INDEX partition
    const folder = await getEntityByRowKey(currentId, 'folder');
    
    if (!folder) {
      break;
    }
    
    path.unshift(mapEntityToItem(folder));
    currentId = folder.parentId;
  }
  
  return path;
}

module.exports = async function (context, req) {
  try {
    // Require authentication
    const user = requireAuth(context, req);
    if (!user) return;
    const { id } = req.params;
    
    if (!id) {
      context.res = createErrorResponse('Folder ID is required', 400);
      return;
    }
    
    const path = await buildPath(id);
    
    if (path.length === 0) {
      context.res = createErrorResponse('Folder not found', 404);
      return;
    }
    
    context.res = createSuccessResponse(path);
    
  } catch (error) {
    await handleError(context, error, 'Failed to get folder path');
  }
};
