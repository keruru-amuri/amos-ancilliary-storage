const { v4: uuidv4 } = require('uuid');
const { createEntity, queryEntities } = require('../shared/storageService');
const { createSuccessResponse, createErrorResponse, validateRequired, mapEntityToItem, handleError } = require('../shared/utils');

module.exports = async function (context, req) {
  try {
    context.log('Starting folder creation...');
    const { name, parentId } = req.body || {};
    context.log(`Creating folder: ${name}, parentId: ${parentId}`);
    
    // Validate required fields
    const validation = validateRequired(['name'], { name });
    if (!validation.valid) {
      context.res = createErrorResponse(validation.message, 400);
      return;
    }
    
    // Check for duplicate folder name in same parent
    const partition = parentId || 'root';
    const filter = `PartitionKey eq '${partition}' and name eq '${name}' and type eq 'folder'`;
    context.log(`Querying existing folders with filter: ${filter}`);
    const existingFolders = await queryEntities(filter);
    
    if (existingFolders.length > 0) {
      context.res = createErrorResponse(
        `A folder named "${name}" already exists in this location`,
        409
      );
      return;
    }
    
    // Create folder entity
    const folderId = uuidv4();
    const entity = {
      partitionKey: partition,
      rowKey: folderId,
      name: name,
      type: 'folder',
      parentId: parentId || null,
      size: 0,
      createdAt: new Date().toISOString()
    };
    
    context.log('Creating entity:', JSON.stringify(entity));
    await createEntity(entity);
    context.log('Entity created successfully');
    
    const responseItem = mapEntityToItem(entity);
    context.res = createSuccessResponse(responseItem, 201);
    
  } catch (error) {
    context.log.error('Error in folder creation:', error);
    await handleError(context, error, 'Failed to create folder');
  }
};
