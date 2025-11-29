const storageService = require('../shared/storageService');
const { createEntity } = storageService;
const { createSuccessResponse, createErrorResponse, mapEntityToItem } = require('../shared/utils');
const { requireAuth } = require('../shared/auth');
const { PERMISSION, checkFolderAccess } = require('../shared/permissions');

module.exports = async function (context, req) {
  try {
    // Require authentication, or allow anonymous uploads when configured
    const user = requireAuth(context, req);
    const allowAnonymous = process.env.ALLOW_ANONYMOUS_UPLOADS === 'true';

    if (!user && !allowAnonymous) {
      return; // requireAuth already set 401
    }
    
    context.log('Committing upload metadata');

    const { fileId, fileName, parentId, fileType, blobName, fileSize } = req.body;

    if (!fileId || !fileName || !blobName) {
      context.res = createErrorResponse('fileId, fileName, and blobName are required', 400);
      return;
    }
    
    // Check permission to upload to this folder. For anonymous, allow only root
    if (!user && allowAnonymous && parentId) {
      context.res = createErrorResponse('Anonymous uploads are only permitted to the root folder', 403);
      return;
    }

    if (user) {
      const access = await checkFolderAccess(user, parentId || null, PERMISSION.WRITE, storageService);
      if (!access.allowed) {
        context.res = createErrorResponse('You do not have permission to upload to this folder', 403);
        return;
      }
    }

    context.log('File info:', {
      fileId,
      fileName,
      parentId,
      fileType,
      blobName,
      fileSize
    });

    // Create metadata entity
    const partition = parentId || 'root';
    const entity = {
      partitionKey: partition,
      rowKey: fileId,
      name: fileName,
      type: 'file',
      parentId: parentId || null,
      fileType: fileType || 'other',
      blobName: blobName,
      size: fileSize || 0,
      createdAt: new Date().toISOString()
    };

    context.log('Creating metadata entity');
    await createEntity(entity);

    // Create INDEX entity for efficient lookups
    const indexEntity = {
      partitionKey: 'INDEX',
      rowKey: fileId,
      name: fileName,
      type: 'file',
      parentId: parentId || null,
      fileType: fileType || 'other',
      blobName: blobName,
      size: fileSize || 0,
      createdAt: new Date().toISOString()
    };

    context.log('Creating INDEX entity');
    await createEntity(indexEntity);

    context.log('Upload metadata committed successfully');

    const responseItem = mapEntityToItem(entity);
    context.res = createSuccessResponse(responseItem, 201);

  } catch (error) {
    context.log.error('Failed to commit upload metadata:', error);
    context.log.error('Error stack:', error.stack);
    context.res = createErrorResponse('Failed to save file metadata: ' + error.message, 500);
  }
};
