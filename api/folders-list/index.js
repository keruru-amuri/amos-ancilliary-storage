const { queryEntities } = require('../shared/storageService');
const { createSuccessResponse, mapEntityToItem, handleError } = require('../shared/utils');

module.exports = async function (context, req) {
  try {
    const { parentId } = req.query;
    const partition = parentId || 'root';
    
    // Query folders in the specified partition
    const filter = `PartitionKey eq '${partition}' and type eq 'folder'`;
    const entities = await queryEntities(filter);
    
    const folders = entities.map(mapEntityToItem);
    
    context.res = createSuccessResponse(folders);
    
  } catch (error) {
    await handleError(context, error, 'Failed to list folders');
  }
};
