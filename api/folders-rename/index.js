const { queryEntities, updateEntity, getEntityByRowKey, getEntity } = require('../shared/storageService');
const { createSuccessResponse, createErrorResponse, validateRequired, mapEntityToItem, handleError } = require('../shared/utils');

module.exports = async function (context, req) {
  try {
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
