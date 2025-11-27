const { queryEntities, updateEntity } = require('../shared/storageService');
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
    
    // Try to find the folder with the ID or ID with Azure Table Storage artifacts
    const cleanId = typeof id === 'string' ? id.split(':')[0] : id;
    const filter = `(rowKey eq '${cleanId}' or rowKey eq '${cleanId}:0') and type eq 'folder'`;
    
    // Find the folder
    const entities = await queryEntities(filter);
    
    if (entities.length === 0) {
      context.res = createErrorResponse('Folder not found', 404);
      return;
    }
    
    const folder = entities[0];
    
    // Check for duplicate name in same parent
    const partition = folder.parentId || 'root';
    const duplicateFilter = `PartitionKey eq '${partition}' and name eq '${name}' and type eq 'folder' and rowKey ne '${id}'`;
    const duplicates = await queryEntities(duplicateFilter);
    
    if (duplicates.length > 0) {
      context.res = createErrorResponse(
        `A folder named "${name}" already exists in this location`,
        409
      );
      return;
    }
    
    // Update the folder
    folder.name = name;
    await updateEntity(folder);
    
    const responseItem = mapEntityToItem(folder);
    context.res = createSuccessResponse(responseItem);
    
  } catch (error) {
    await handleError(context, error, 'Failed to rename folder');
  }
};
