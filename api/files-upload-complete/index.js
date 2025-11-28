const { createEntity } = require('../shared/storageService');
const { createSuccessResponse, createErrorResponse, mapEntityToItem } = require('../shared/utils');

module.exports = async function (context, req) {
  try {
    context.log('Committing upload metadata');

    const { fileId, fileName, parentId, fileType, blobName, fileSize } = req.body;

    if (!fileId || !fileName || !blobName) {
      context.res = createErrorResponse('fileId, fileName, and blobName are required', 400);
      return;
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
