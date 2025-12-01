const storageService = require('../shared/storageService');
const { createSuccessResponse, createErrorResponse, handleError } = require('../shared/utils');
const { requireAuth, isSystemAdmin } = require('../shared/auth');
const { 
  PERMISSION, 
  PERMISSION_NAMES,
  checkFolderAccess, 
  grantFolderPermission,
  grantFolderPermissionToGroup,
  revokeFolderPermission,
  revokeFolderPermissionFromGroup,
  listFolderPermissions 
} = require('../shared/permissions');

/**
 * Folder Permissions API
 * 
 * GET /api/folder-permissions/{folderId} - List permissions for a folder
 * POST /api/folder-permissions/{folderId} - Grant permission to a user
 * DELETE /api/folder-permissions/{folderId} - Revoke permission from a user
 * 
 * Only system admins or folder admins can manage permissions.
 */
module.exports = async function (context, req) {
  try {
    // Require authentication
    const user = requireAuth(context, req);
    if (!user) return;
    
    const folderId = req.params.folderId || null;
    const method = req.method.toUpperCase();
    
    // Check if user has admin access to this folder
    const access = await checkFolderAccess(user, folderId, PERMISSION.ADMIN, storageService);
    
    if (!access.allowed) {
      context.res = createErrorResponse('You do not have permission to manage this folder', 403);
      return;
    }
    
    switch (method) {
      case 'GET':
        await handleList(context, folderId);
        break;
      case 'POST':
        await handleGrant(context, req, folderId, user);
        break;
      case 'DELETE':
        await handleRevoke(context, req, folderId);
        break;
      default:
        context.res = createErrorResponse('Method not allowed', 405);
    }
    
  } catch (error) {
    await handleError(context, error, 'Failed to manage folder permissions');
  }
};

/**
 * List all permissions for a folder
 */
async function handleList(context, folderId) {
  const permissions = await listFolderPermissions(folderId, storageService);
  
  // Fetch group names for group permissions
  const result = await Promise.all(permissions.map(async (p) => {
    const base = {
      permission: p.permission,
      permissionName: PERMISSION_NAMES[p.permission] || 'Unknown',
      grantedBy: p.grantedBy,
      grantedAt: p.grantedAt
    };
    
    if (p.principalType === 'group') {
      try {
        const group = await storageService.getWorkingGroup(p.groupId);
        return {
          ...base,
          principalType: 'group',
          groupId: p.groupId,
          groupName: group.name
        };
      } catch (error) {
        return {
          ...base,
          principalType: 'group',
          groupId: p.groupId,
          groupName: '(Deleted Group)'
        };
      }
    } else {
      return {
        ...base,
        principalType: 'user',
        userEmail: p.userEmail
      };
    }
  }));
  
  context.res = createSuccessResponse({
    folderId: folderId || 'root',
    permissions: result
  });
}

/**
 * Grant permission to a user or group
 */
async function handleGrant(context, req, folderId, grantedByUser) {
  const { userEmail, groupId, permission } = req.body || {};
  
  if (!userEmail && !groupId) {
    context.res = createErrorResponse('Either userEmail or groupId is required', 400);
    return;
  }
  
  if (userEmail && groupId) {
    context.res = createErrorResponse('Cannot specify both userEmail and groupId', 400);
    return;
  }
  
  // Validate permission level
  const level = parseInt(permission, 10);
  if (isNaN(level) || level < PERMISSION.NONE || level > PERMISSION.ADMIN) {
    context.res = createErrorResponse(
      `Invalid permission level. Valid values: ${Object.entries(PERMISSION_NAMES).map(([k, v]) => `${k}=${v}`).join(', ')}`,
      400
    );
    return;
  }
  
  let entity;
  
  if (groupId) {
    // Verify group exists
    try {
      await storageService.getWorkingGroup(groupId);
    } catch (error) {
      if (error.statusCode === 404) {
        context.res = createErrorResponse('Working group not found', 404);
        return;
      }
      throw error;
    }
    
    // Grant permission to group
    entity = await grantFolderPermissionToGroup(folderId, groupId, level, grantedByUser, storageService);
  } else {
    // Grant permission to user
    entity = await grantFolderPermission(folderId, userEmail, level, grantedByUser, storageService);
  }
  
  context.res = createSuccessResponse({
    message: groupId ? `Permission granted to group` : `Permission granted to ${userEmail}`,
    folderId: folderId || 'root',
    principalType: entity.principalType,
    principalId: entity.principalId,
    userEmail: entity.userEmail,
    groupId: entity.groupId,
    permission: entity.permission,
    permissionName: entity.permissionName,
    grantedBy: entity.grantedBy,
    grantedAt: entity.grantedAt
  }, 201);
}

/**
 * Revoke permission from a user or group
 */
async function handleRevoke(context, req, folderId) {
  const { userEmail, groupId } = req.body || req.query || {};
  
  if (!userEmail && !groupId) {
    context.res = createErrorResponse('Either userEmail or groupId is required', 400);
    return;
  }
  
  if (userEmail && groupId) {
    context.res = createErrorResponse('Cannot specify both userEmail and groupId', 400);
    return;
  }
  
  let revoked;
  if (groupId) {
    revoked = await revokeFolderPermissionFromGroup(folderId, groupId, storageService);
  } else {
    revoked = await revokeFolderPermission(folderId, userEmail, storageService);
  }
  
  if (revoked) {
    context.res = createSuccessResponse({
      message: groupId ? `Permission revoked from group` : `Permission revoked from ${userEmail}`,
      folderId: folderId || 'root'
    });
  } else {
    context.res = createErrorResponse('Permission not found', 404);
  }
}
