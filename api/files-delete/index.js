const { getEntity, deleteEntity, deleteBlob, getEntityByRowKey } = require('../shared/storageService');
const { createSuccessResponse, createErrorResponse, handleError } = require('../shared/utils');

module.exports = async function (context, req) {
  try {
    const { id } = req.params;
    
    if (!id) {
      context.res = createErrorResponse('File ID is required', 400);
      return;
    }
    
    // Use efficient INDEX lookup to find the file
    const indexFile = await getEntityByRowKey(id, 'file');
    
    if (!indexFile) {
      context.res = createErrorResponse('File not found', 404);
      return;
    }
    
    // Get the actual primary entity using parentId as partition key
    const parentPartition = indexFile.parentId || 'root';
    const primaryFile = await getEntity(parentPartition, id);
    
    if (!primaryFile) {
      context.res = createErrorResponse('Primary file entity not found', 404);
      return;
    }
    
    // Delete the blob if it exists
    if (primaryFile.blobName) {
      await deleteBlob(primaryFile.blobName);
    }
    
    // Delete the primary metadata
    await deleteEntity(parentPartition, id);
    
    // Delete the INDEX entity
    try {
      await deleteEntity('INDEX', id);
    } catch (error) {
      // Index entity might not exist for old files, continue
      context.log.warn(`Index entity not found for file ${id}, skipping`);
    }
    
    context.res = createSuccessResponse({ success: true });
    
  } catch (error) {
    await handleError(context, error, 'Failed to delete file');
  }
};
