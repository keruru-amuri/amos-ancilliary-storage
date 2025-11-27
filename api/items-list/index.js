const { queryEntities } = require('../shared/storageService');
const { createSuccessResponse, mapEntityToItem, handleError } = require('../shared/utils');

module.exports = async function (context, req) {
  try {
    const { parentId } = req.query;
    const partition = parentId || 'root';
    
    // Query all items (files and folders) in the specified partition
    const filter = `PartitionKey eq '${partition}'`;
    const entities = await queryEntities(filter);
    
    const items = entities.map(mapEntityToItem);
    
    // Sort: folders first, then files, alphabetically
    items.sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === 'folder' ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });
    
    context.res = createSuccessResponse(items);
    
  } catch (error) {
    await handleError(context, error, 'Failed to list items');
  }
};
