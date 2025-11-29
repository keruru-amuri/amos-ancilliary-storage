const storageService = require('../shared/storageService');
const { getEntity, getEntityByRowKey, queryEntities, updateEntity } = storageService;
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
      context.res = createErrorResponse('File ID is required', 400);
      return;
    }
    
    const validation = validateRequired(['name'], { name });
    if (!validation.valid) {
      context.res = createErrorResponse(validation.message, 400);
      return;
    }
    
    // Use efficient INDEX lookup to find the file
    const indexFile = await getEntityByRowKey(id, 'file');
    
    if (!indexFile) {
      context.res = createErrorResponse('File not found', 404);
      return;
    }
    
    // Check permission to rename (need WRITE on parent folder)
    const parentId = indexFile.parentId || null;
    const access = await checkFolderAccess(user, parentId, PERMISSION.WRITE, storageService);
    if (!access.allowed) {
      context.res = createErrorResponse('You do not have permission to rename this file', 403);
      return;
    }
    
    // Get the primary entity
    const parentPartition = indexFile.parentId || 'root';
    const file = await getEntity(parentPartition, id);
    
    if (!file) {
      context.res = createErrorResponse('Primary file entity not found', 404);
      return;
    }
    
    // Check for duplicate name in same parent
    const partition = file.parentId || 'root';
    const duplicateFilter = `PartitionKey eq '${partition}' and name eq '${name}' and type eq 'file' and rowKey ne '${id}'`;
    const duplicates = await queryEntities(duplicateFilter);
    
    if (duplicates.length > 0) {
      context.res = createErrorResponse(
        `A file named "${name}" already exists in this location`,
        409
      );
      return;
    }
    
    // Update the primary file
    file.name = name;
    await updateEntity(file);
    
    // Update the INDEX entity
    indexFile.name = name;
    await updateEntity(indexFile);
    
    const responseItem = mapEntityToItem(file);
    context.res = createSuccessResponse(responseItem);
    
  } catch (error) {
    await handleError(context, error, 'Failed to rename file');
  }
};
