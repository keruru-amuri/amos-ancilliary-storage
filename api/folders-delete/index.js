const { getEntity, deleteEntity, queryEntities, getEntityByRowKey } = require('../shared/storageService');
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
    
    // Delete the index entity for this folder
    try {
      await deleteEntity('INDEX', rowKey);
    } catch (error) {
      // Index entity might not exist for old folders, continue
      console.warn(`Index entity not found for folder ${rowKey}, skipping`);
    }
  } else if (item.type === 'file' && item.blobName) {
    // Delete the blob
    await deleteBlob(item.blobName);
  }
  
  // Delete the primary item itself
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
    
    // Use efficient INDEX lookup to find the folder
    const folder = await getEntityByRowKey(id, 'folder');
    
    if (!folder) {
      context.res = createErrorResponse('Folder not found', 404);
      return;
    }
    
    const deletedCount = await deleteItemRecursive(folder.partitionKey, folder.rowKey);
    
    context.res = createSuccessResponse({
      success: true,
      deletedCount
    });
    
  } catch (error) {
    await handleError(context, error, 'Failed to delete folder');
  }
};
