const { queryEntities } = require('../shared/storageService');
const { createSuccessResponse, mapEntityToItem, handleError } = require('../shared/utils');

module.exports = async function (context, req) {
  try {
    const { parentId } = req.query;
    const partition = parentId || 'root';
    
    // Query files in the specified partition
    const filter = `PartitionKey eq '${partition}' and type eq 'file'`;
    const entities = await queryEntities(filter);
    
    const files = entities.map(mapEntityToItem);
    
    context.res = createSuccessResponse(files);
    
  } catch (error) {
    await handleError(context, error, 'Failed to list files');
  }
};
