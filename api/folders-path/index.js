const { getEntityByRowKey } = require('../shared/storageService');
const { createSuccessResponse, createErrorResponse, mapEntityToItem, handleError } = require('../shared/utils');

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
