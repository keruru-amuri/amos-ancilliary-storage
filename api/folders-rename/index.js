const storageService = require('../shared/storageService');
const { queryEntities, updateEntity, getEntityByRowKey, getEntity } = storageService;
const { createSuccessResponse, createErrorResponse, validateRequired, mapEntityToItem, handleError } = require('../shared/utils');
const { requireAuth } = require('../shared/auth');
const { PERMISSION, checkFolderAccess } = require('../shared/permissions');

module.exports = async function (context, req) {
  try {
    // Require authentication
    const user = requireAuth(context, req);
    if (!user) return;
    
    const { id } = req.params;
    const { name } = req.body || {};
    
    // Validate
    if (!id) {
      context.res = createErrorResponse('Folder ID is required', 400);
      return;
    }
    
    const validation = validateRequired(['name'], { name });
    if (!validation.valid) {
      context.res = createErrorResponse(validation.message, 400);
      return;
    }
    
    // Use efficient INDEX lookup to find the folder
    const indexFolder = await getEntityByRowKey(id, 'folder');
    
    if (!indexFolder) {
      context.res = createErrorResponse('Folder not found', 404);
      return;
    }
    
    // Check permission to rename (need WRITE on parent folder)
    const parentId = indexFolder.parentId || null;
    const access = await checkFolderAccess(user, parentId, PERMISSION.WRITE, storageService);
    if (!access.allowed) {
      context.res = createErrorResponse('You do not have permission to rename this folder', 403);
      return;
    }
    
    // Get the primary entity
    const primaryFolder = await getEntity(indexFolder.partitionKey, indexFolder.rowKey);
    
    if (!primaryFolder) {
      context.res = createErrorResponse('Folder not found', 404);
      return;
    }
    
    // Check for duplicate name in same parent
    const partition = primaryFolder.parentId || 'root';
    const duplicateFilter = `PartitionKey eq '${partition}' and name eq '${name}' and type eq 'folder' and rowKey ne '${id}'`;
    const duplicates = await queryEntities(duplicateFilter);
    
    if (duplicates.length > 0) {
      context.res = createErrorResponse(
        `A folder named "${name}" already exists in this location`,
        409
      );
      return;
    }
    
    // Update both primary and index entities
    primaryFolder.name = name;
    indexFolder.name = name;
    
    await updateEntity(primaryFolder);
    await updateEntity(indexFolder);
    
    const responseItem = mapEntityToItem(primaryFolder);
    context.res = createSuccessResponse(responseItem);
    
  } catch (error) {
    await handleError(context, error, 'Failed to rename folder');
  }
};
