const storageService = require('../shared/storageService');
const { createSuccessResponse, createErrorResponse, handleError } = require('../shared/utils');
const { requireAdmin } = require('../shared/auth');

/**
 * Initialize Storage Tables
 * 
 * POST /api/init-storage - Initialize all required storage tables
 * 
 * Only system admins can initialize storage.
 */
module.exports = async function (context, req) {
  try {
    // Require admin authentication
    const user = requireAdmin(context, req);
    if (!user) return;
    
    // Initialize storage (creates tables if they don't exist)
    await storageService.initializeStorage();
    
    context.res = createSuccessResponse({
      message: 'Storage initialized successfully',
      tables: [
        'filesMetadata',
        'folderPermissions',
        'workingGroups',
        'userGroupAssignments'
      ]
    });
    
  } catch (error) {
    await handleError(context, error, 'Failed to initialize storage');
  }
};
