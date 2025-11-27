const { getEntity, deleteEntity, queryEntities } = require('../shared/storageService');
const { deleteBlob } = require('../shared/storageService');
const { createSuccessResponse, createErrorResponse, handleError } = require('../shared/utils');

async function deleteItemRecursive(partitionKey, rowKey) {
  let deletedCount = 0;
  
  // Get the item
  const item = await getEntity(partitionKey, rowKey);
  if (!item) {
    return deletedCount;
  }
  
  if (item.type === 'folder') {
    // Find all children in this folder
    const filter = `PartitionKey eq '${rowKey}'`;
    const children = await queryEntities(filter);
    
    // Recursively delete all children
    for (const child of children) {
      deletedCount += await deleteItemRecursive(child.partitionKey, child.rowKey);
    }
  } else if (item.type === 'file' && item.blobName) {
    // Delete the blob
    await deleteBlob(item.blobName);
  }
  
  // Delete the item itself
  await deleteEntity(partitionKey, rowKey);
  deletedCount++;
  
  return deletedCount;
}

module.exports = async function (context, req) {
  try {
    const { id } = req.params;
    
    if (!id) {
      context.res = createErrorResponse('Folder ID is required', 400);
      return;
    }
    
    // Find the folder
    const entities = await queryEntities(`rowKey eq '${id}' and type eq 'folder'`);
    
    if (entities.length === 0) {
      context.res = createErrorResponse('Folder not found', 404);
      return;
    }
    
    const folder = entities[0];
    const deletedCount = await deleteItemRecursive(folder.partitionKey, folder.rowKey);
    
    context.res = createSuccessResponse({
      success: true,
      deletedCount
    });
    
  } catch (error) {
    await handleError(context, error, 'Failed to delete folder');
  }
};
