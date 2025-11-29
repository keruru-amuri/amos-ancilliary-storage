const storageService = require('../shared/storageService');
const { getEntity, deleteEntity, queryEntities, getEntityByRowKey, deleteBlob } = storageService;
const { createSuccessResponse, createErrorResponse, handleError } = require('../shared/utils');
const { requireAuth } = require('../shared/auth');
const { PERMISSION, checkFolderAccess } = require('../shared/permissions');

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
    // Require authentication
    const user = requireAuth(context, req);
    if (!user) return;
    
    const { id } = req.params;
    
    if (!id) {
      context.res = createErrorResponse('Folder ID is required', 400);
      return;
    }
    
    // Use efficient INDEX lookup to find the folder
    const indexFolder = await getEntityByRowKey(id, 'folder');
    
    if (!indexFolder) {
      context.res = createErrorResponse('Folder not found', 404);
      return;
    }
    
    // Check permission to delete (need WRITE on parent folder)
    const parentId = indexFolder.parentId || null;
    const access = await checkFolderAccess(user, parentId, PERMISSION.WRITE, storageService);
    if (!access.allowed) {
      context.res = createErrorResponse('You do not have permission to delete this folder', 403);
      return;
    }
    
    // Get the actual primary entity using parentId as partition key
    const parentPartition = indexFolder.parentId || 'root';
    const primaryFolder = await getEntity(parentPartition, id);
    
    if (!primaryFolder) {
      context.res = createErrorResponse('Primary folder entity not found', 404);
      return;
    }
    
    // Delete using the correct partition key from primary entity
    const deletedCount = await deleteItemRecursive(parentPartition, id);
    
    context.res = createSuccessResponse({
      success: true,
      deletedCount
    });
    
  } catch (error) {
    await handleError(context, error, 'Failed to delete folder');
  }
};
