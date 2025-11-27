const { queryEntities } = require('../shared/storageService');
const { createSuccessResponse, createErrorResponse, mapEntityToItem, handleError } = require('../shared/utils');

async function buildPath(folderId) {
  const path = [];
  let currentId = folderId;
  
  while (currentId) {
    // Clean the ID and query for both formats
    const cleanCurrentId = typeof currentId === 'string' ? currentId.split(':')[0] : currentId;
    const filter = `(rowKey eq '${cleanCurrentId}' or rowKey eq '${cleanCurrentId}:0') and type eq 'folder'`;
    
    // Find folder by ID
    const entities = await queryEntities(filter);
    
    if (entities.length === 0) {
      break;
    }
    
    const folder = entities[0];
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
