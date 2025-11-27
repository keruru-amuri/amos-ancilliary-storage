const { queryEntities, deleteEntity, deleteBlob } = require('../shared/storageService');
const { createSuccessResponse, createErrorResponse, handleError } = require('../shared/utils');

module.exports = async function (context, req) {
  try {
    const { id } = req.params;
    
    if (!id) {
      context.res = createErrorResponse('File ID is required', 400);
      return;
    }
    
    // Try to find the file with the ID or ID with Azure Table Storage artifacts
    const cleanId = typeof id === 'string' ? id.split(':')[0] : id;
    const filter = `(rowKey eq '${cleanId}' or rowKey eq '${cleanId}:0') and type eq 'file'`;
    
    // Find the file
    const entities = await queryEntities(filter);
    
    if (entities.length === 0) {
      context.res = createErrorResponse('File not found', 404);
      return;
    }
    
    const file = entities[0];
    
    // Delete the blob if it exists
    if (file.blobName) {
      await deleteBlob(file.blobName);
    }
    
    // Delete the metadata
    await deleteEntity(file.partitionKey, file.rowKey);
    
    context.res = createSuccessResponse({ success: true });
    
  } catch (error) {
    await handleError(context, error, 'Failed to delete file');
  }
};
