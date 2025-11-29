const storageService = require('../shared/storageService');
const { queryEntities } = storageService;
const { createSuccessResponse, mapEntityToItem, handleError } = require('../shared/utils');
const { requireAuth } = require('../shared/auth');
const { PERMISSION, checkFolderAccess } = require('../shared/permissions');

module.exports = async function (context, req) {
  try {
    // Require authentication
    const user = requireAuth(context, req);
    if (!user) return;
    
    const { parentId } = req.query;
    
    // Check permission to view this folder
    const access = await checkFolderAccess(user, parentId || null, PERMISSION.READ, storageService);
    if (!access.allowed) {
      context.res = {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'You do not have permission to view this folder', statusCode: 403 })
      };
      return;
    }
    
    const partition = parentId || 'root';
    
    // Query folders in the specified partition
    const filter = `PartitionKey eq '${partition}' and type eq 'folder'`;
    const entities = await queryEntities(filter);
    
    const folders = entities.map(mapEntityToItem);
    
    context.res = createSuccessResponse(folders);
    
  } catch (error) {
    await handleError(context, error, 'Failed to list folders');
  }
};
