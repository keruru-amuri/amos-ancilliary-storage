const { v4: uuidv4 } = require('uuid');
const storageService = require('../shared/storageService');
const { createEntity, queryEntities } = storageService;
const { createSuccessResponse, createErrorResponse, validateRequired, mapEntityToItem, handleError } = require('../shared/utils');
const { requireAuth } = require('../shared/auth');
const { PERMISSION, checkFolderAccess } = require('../shared/permissions');

module.exports = async function (context, req) {
  try {
    // Require authentication
    const user = requireAuth(context, req);
    if (!user) return;
    
    context.log('Starting folder creation...');
    const { name, parentId } = req.body || {};
    context.log(`Creating folder: ${name}, parentId: ${parentId}`);
    
    // Check permission to create in parent folder
    const access = await checkFolderAccess(user, parentId, PERMISSION.WRITE, storageService);
    if (!access.allowed) {
      context.res = createErrorResponse('You do not have permission to create folders here', 403);
      return;
    }
    
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
    const timestamp = new Date().toISOString();
    
    // Primary entity (for parent-child listing)
    const primaryEntity = {
      partitionKey: partition,
      rowKey: folderId,
      name: name,
      type: 'folder',
      parentId: parentId || null,
      size: 0,
      createdAt: timestamp
    };
    
    // Index entity (for efficient direct ID lookup)
    const indexEntity = {
      partitionKey: 'INDEX',
      rowKey: folderId,
      name: name,
      type: 'folder',
      parentId: parentId || null,
      size: 0,
      createdAt: timestamp
    };
    
    context.log('Creating primary entity:', JSON.stringify(primaryEntity));
    await createEntity(primaryEntity);
    context.log('Primary entity created successfully');
    
    context.log('Creating index entity:', JSON.stringify(indexEntity));
    await createEntity(indexEntity);
    context.log('Index entity created successfully');
    
    const responseItem = mapEntityToItem(primaryEntity);
    context.res = createSuccessResponse(responseItem, 201);
    
  } catch (error) {
    context.log.error('Error in folder creation:', error);
    await handleError(context, error, 'Failed to create folder');
  }
};
