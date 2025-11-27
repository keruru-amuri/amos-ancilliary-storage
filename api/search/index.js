const { queryEntities } = require('../shared/storageService');
const { createSuccessResponse, createErrorResponse, mapEntityToItem, handleError } = require('../shared/utils');

module.exports = async function (context, req) {
  try {
    const { q, parentId } = req.query;
    
    if (!q || q.trim() === '') {
      context.res = createErrorResponse('Search query is required', 400);
      return;
    }
    
    const searchTerm = q.toLowerCase().trim();
    
    // Get all entities (basic implementation - in production, use Azure Search)
    let filter = '';
    if (parentId) {
      // Search within a specific folder
      filter = `PartitionKey eq '${parentId}'`;
    }
    
    const entities = await queryEntities(filter);
    
    // Filter by name match (case-insensitive)
    const results = entities
      .filter(entity => entity.name.toLowerCase().includes(searchTerm))
      .map(mapEntityToItem);
    
    // Sort: folders first, then files, alphabetically
    results.sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === 'folder' ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });
    
    context.res = createSuccessResponse(results);
    
  } catch (error) {
    await handleError(context, error, 'Failed to search');
  }
};
