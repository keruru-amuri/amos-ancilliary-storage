const storageService = require('../shared/storageService');
const { queryEntities } = storageService;
const { createSuccessResponse, createErrorResponse, mapEntityToItem, handleError } = require('../shared/utils');

module.exports = async function (context, req) {
  try {
    // Search is public - no auth required for viewing public data
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
    // Filter to matching entities
    const matches = entities.filter(entity => entity.name && entity.name.toLowerCase().includes(searchTerm));

    // Map and deduplicate results by rowKey (id). The storage pattern uses an INDEX partition
    // with the same rowKey as the primary entity — that causes duplicates when we query all
    // entities. Prefer the primary record (partitionKey !== 'INDEX') when duplicates exist.
    const seen = new Map();
    for (const e of matches) {
      const id = e.rowKey;
      const existing = seen.get(id);
      // if we haven't seen this id yet OR the existing entry is an INDEX record while this one is primary, replace
      if (!existing) {
        seen.set(id, e);
      } else if (existing.partitionKey === 'INDEX' && e.partitionKey !== 'INDEX') {
        seen.set(id, e);
      }
    }

    const results = Array.from(seen.values()).map(mapEntityToItem);
    
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
