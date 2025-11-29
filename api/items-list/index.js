const storageService = require('../shared/storageService');
const { queryEntities } = storageService;
const { createSuccessResponse, mapEntityToItem, handleError } = require('../shared/utils');
const { getCurrentUser } = require('../shared/auth');
const { PERMISSION, checkFolderAccess } = require('../shared/permissions');

module.exports = async function (context, req) {
  try {
    // Get user (can be null for anonymous access)
    const user = getCurrentUser(req);
    
    const { parentId } = req.query;
    
    // Check permission to view this folder (anonymous users get public READ access)
    const access = await checkFolderAccess(user, parentId || null, PERMISSION.READ, storageService);
    if (!access.allowed) {
      context.res = {
        status: user ? 403 : 401,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          error: user ? 'You do not have permission to view this folder' : 'Authentication required',
          statusCode: user ? 403 : 401 
        })
      };
      return;
    }
    
    const partition = parentId || 'root';
    
    // Query all items (files and folders) in the specified partition
    const filter = `PartitionKey eq '${partition}'`;
    const entities = await queryEntities(filter);
    
    const items = entities.map(mapEntityToItem);
    
    // Sort: folders first, then files, alphabetically
    items.sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === 'folder' ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });
    
    context.res = createSuccessResponse(items);
    
  } catch (error) {
    await handleError(context, error, 'Failed to list items');
  }
};
