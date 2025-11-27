const { queryEntities, createEntity, getEntity } = require('../shared/storageService');
const { createSuccessResponse, createErrorResponse, handleError } = require('../shared/utils');

/**
 * Migration script to create INDEX entities for existing folders
 * This is a one-time operation to migrate folders to the secondary index pattern
 */
module.exports = async function (context, req) {
  try {
    context.log('Starting folder migration to secondary index pattern...');
    
    // Query all folder entities
    const filter = `type eq 'folder'`;
    const folders = await queryEntities(filter);
    
    context.log(`Found ${folders.length} folders to migrate`);
    
    let migratedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    const errors = [];
    
    for (const folder of folders) {
      try {
        // Check if INDEX entity already exists
        const existingIndex = await getEntity('INDEX', folder.rowKey);
        
        if (existingIndex) {
          context.log(`INDEX entity already exists for folder: ${folder.name} (${folder.rowKey})`);
          skippedCount++;
          continue;
        }
        
        // Create INDEX entity
        const indexEntity = {
          partitionKey: 'INDEX',
          rowKey: folder.rowKey,
          name: folder.name,
          type: 'folder',
          parentId: folder.parentId || null,
          size: folder.size || 0,
          createdAt: folder.createdAt
        };
        
        await createEntity(indexEntity);
        context.log(`Created INDEX entity for folder: ${folder.name} (${folder.rowKey})`);
        migratedCount++;
        
      } catch (error) {
        context.log.error(`Error migrating folder ${folder.name} (${folder.rowKey}):`, error);
        errorCount++;
        errors.push({
          folderId: folder.rowKey,
          folderName: folder.name,
          error: error.message
        });
      }
    }
    
    context.log('Migration completed');
    context.log(`Total folders: ${folders.length}`);
    context.log(`Migrated: ${migratedCount}`);
    context.log(`Skipped (already migrated): ${skippedCount}`);
    context.log(`Errors: ${errorCount}`);
    
    context.res = createSuccessResponse({
      success: true,
      totalFolders: folders.length,
      migratedCount,
      skippedCount,
      errorCount,
      errors: errorCount > 0 ? errors : undefined,
      message: errorCount === 0 
        ? 'Migration completed successfully' 
        : `Migration completed with ${errorCount} errors`
    });
    
  } catch (error) {
    context.log.error('Migration failed:', error);
    await handleError(context, error, 'Failed to migrate folders');
  }
};
