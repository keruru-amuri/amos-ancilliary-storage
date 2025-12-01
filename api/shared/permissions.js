/**
 * Folder permission system with inheritance
 * 
 * Permissions are stored in a separate Table Storage table: folderPermissions
 * When checking access, we walk up the folder hierarchy to find inherited permissions.
 * 
 * Permission Levels:
 * - NONE (0): No access
 * - READ (1): Can view folder and contents
 * - WRITE (2): Can create, edit, delete files/folders
 * - ADMIN (3): Can manage permissions for the folder
 */

const { isSystemAdmin } = require('./auth');

// Permission levels
const PERMISSION = {
  NONE: 0,
  READ: 1,
  WRITE: 2,
  ADMIN: 3
};

// Permission level names for display
const PERMISSION_NAMES = {
  [PERMISSION.NONE]: 'None',
  [PERMISSION.READ]: 'Read',
  [PERMISSION.WRITE]: 'Write',
  [PERMISSION.ADMIN]: 'Admin'
};

/**
 * Check if user has at least the required permission level for a folder
 * System admins bypass all permission checks
 * Public folders (isPublic: true) grant READ to all authenticated users
 * Anonymous users (null) get READ access to existing public data
 * 
 * @param {object|null} user - User object from getCurrentUser() or null for anonymous
 * @param {string} folderId - The folder ID to check (null for root)
 * @param {number} requiredLevel - Required permission level
 * @param {object} storageService - Storage service module
 * @returns {Promise<{allowed: boolean, level: number, inherited: boolean, fromFolderId: string|null}>}
 */
async function checkFolderAccess(user, folderId, requiredLevel, storageService) {
  // System admins have full access everywhere
  if (user && isSystemAdmin(user)) {
    return {
      allowed: true,
      level: PERMISSION.ADMIN,
      inherited: false,
      fromFolderId: null,
      reason: 'system_admin'
    };
  }
  
  // Anonymous users only get READ access to existing public data
  // WRITE and ADMIN operations always require authentication
  if (!user) {
    if (requiredLevel > PERMISSION.READ) {
      return {
        allowed: false,
        level: PERMISSION.NONE,
        inherited: false,
        fromFolderId: null,
        reason: 'auth_required'
      };
    }
    // For READ, treat as public access to existing data
    return {
      allowed: true,
      level: PERMISSION.READ,
      inherited: true,
      fromFolderId: null,
      reason: 'public_access'
    };
  }
  
  // Get effective permission by walking up folder hierarchy
  const effectivePermission = await getEffectivePermission(user, folderId, storageService);
  
  return {
    allowed: effectivePermission.level >= requiredLevel,
    level: effectivePermission.level,
    inherited: effectivePermission.inherited,
    fromFolderId: effectivePermission.fromFolderId,
    reason: effectivePermission.reason
  };
}

/**
 * Get the effective permission for a user on a folder
 * Walks up the folder hierarchy to find inherited permissions
 * 
 * @param {object} user - User object
 * @param {string} folderId - Folder ID (null for root)
 * @param {object} storageService - Storage service module
 * @returns {Promise<{level: number, inherited: boolean, fromFolderId: string|null, reason: string}>}
 */
async function getEffectivePermission(user, folderId, storageService) {
  // Start at the requested folder and walk up to root
  let currentFolderId = folderId;
  let depth = 0;
  const maxDepth = 50; // Prevent infinite loops
  
  while (depth < maxDepth) {
    // Check for explicit permission at current level
    const permission = await getFolderPermissionForUser(user, currentFolderId, storageService);
    
    if (permission) {
      return {
        level: permission.level,
        inherited: currentFolderId !== folderId,
        fromFolderId: currentFolderId,
        reason: 'explicit_permission'
      };
    }
    
    // Check if folder is public (for backward compatibility with existing data)
    if (currentFolderId) {
      const folder = await storageService.getEntityByRowKey(currentFolderId, 'folder');
      if (folder && folder.isPublic === true) {
        return {
          level: PERMISSION.READ,
          inherited: currentFolderId !== folderId,
          fromFolderId: currentFolderId,
          reason: 'public_folder'
        };
      }
      
      // Move to parent folder
      if (folder && folder.parentId) {
        currentFolderId = folder.parentId;
      } else {
        // Reached root, check root permissions
        currentFolderId = null;
      }
    } else {
      // At root level, check for root permissions
      const rootPermission = await getRootPermissionForUser(user, storageService);
      if (rootPermission) {
        return {
          level: rootPermission.level,
          inherited: folderId !== null,
          fromFolderId: null,
          reason: 'root_permission'
        };
      }
      
      // No permission found anywhere - default to READ for authenticated users
      // This ensures backward compatibility with existing public data
      return {
        level: PERMISSION.READ,
        inherited: true,
        fromFolderId: null,
        reason: 'default_authenticated'
      };
    }
    
    depth++;
  }
  
  // Reached max depth, deny access
  return {
    level: PERMISSION.NONE,
    inherited: false,
    fromFolderId: null,
    reason: 'max_depth_exceeded'
  };
}

/**
 * Get permission for a specific user on a specific folder
 * Checks both direct user permissions and group permissions
 * @param {object} user - User object
 * @param {string} folderId - Folder ID
 * @param {object} storageService - Storage service module
 * @returns {Promise<{level: number, grantedBy: string, grantedAt: string}|null>}
 */
async function getFolderPermissionForUser(user, folderId, storageService) {
  if (!user || !user.email) {
    return null;
  }
  
  try {
    // Check direct user permission first
    const partitionKey = folderId || 'root';
    const rowKey = sanitizeRowKey(user.email);
    
    const userPermission = await storageService.getPermissionEntity(partitionKey, rowKey);
    
    if (userPermission) {
      return {
        level: userPermission.permission || PERMISSION.NONE,
        grantedBy: userPermission.grantedBy,
        grantedAt: userPermission.grantedAt
      };
    }
    
    // Check group permissions
    const userGroups = await storageService.getUserGroups(user.email);
    let highestGroupPermission = null;
    
    for (const assignment of userGroups) {
      const groupRowKey = `GROUP_${assignment.groupId}`;
      const groupPermission = await storageService.getPermissionEntity(partitionKey, groupRowKey);
      
      if (groupPermission) {
        const level = groupPermission.permission || PERMISSION.NONE;
        if (!highestGroupPermission || level > highestGroupPermission.level) {
          highestGroupPermission = {
            level: level,
            grantedBy: groupPermission.grantedBy,
            grantedAt: groupPermission.grantedAt
          };
        }
      }
    }
    
    return highestGroupPermission;
  } catch (error) {
    console.error('Error getting folder permission:', error);
    return null;
  }
}

/**
 * Get root-level permission for a user
 * @param {object} user - User object
 * @param {object} storageService - Storage service module
 * @returns {Promise<{level: number}|null>}
 */
async function getRootPermissionForUser(user, storageService) {
  return getFolderPermissionForUser(user, null, storageService);
}

/**
 * Grant permission to a user for a folder
 * @param {string} folderId - Folder ID (null for root)
 * @param {string} userEmail - Email of user to grant permission to
 * @param {number} level - Permission level
 * @param {object} grantedByUser - User granting the permission
 * @param {object} storageService - Storage service module
 * @returns {Promise<object>}
 */
async function grantFolderPermission(folderId, userEmail, level, grantedByUser, storageService) {
  const partitionKey = folderId || 'root';
  const rowKey = sanitizeRowKey(userEmail.toLowerCase());
  
  const entity = {
    partitionKey: partitionKey,
    rowKey: rowKey,
    principalType: 'user',
    principalId: userEmail.toLowerCase(),
    userEmail: userEmail.toLowerCase(),
    folderId: folderId,
    permission: level,
    permissionName: PERMISSION_NAMES[level],
    grantedBy: grantedByUser.email,
    grantedAt: new Date().toISOString()
  };
  
  await storageService.upsertPermissionEntity(entity);
  return entity;
}

/**
 * Grant permission to a working group for a folder
 * @param {string} folderId - Folder ID (null for root)
 * @param {string} groupId - ID of the working group
 * @param {number} level - Permission level
 * @param {object} grantedByUser - User granting the permission
 * @param {object} storageService - Storage service module
 * @returns {Promise<object>}
 */
async function grantFolderPermissionToGroup(folderId, groupId, level, grantedByUser, storageService) {
  const partitionKey = folderId || 'root';
  const rowKey = `GROUP_${groupId}`;
  
  const entity = {
    partitionKey: partitionKey,
    rowKey: rowKey,
    principalType: 'group',
    principalId: groupId,
    groupId: groupId,
    folderId: folderId,
    permission: level,
    permissionName: PERMISSION_NAMES[level],
    grantedBy: grantedByUser.email,
    grantedAt: new Date().toISOString()
  };
  
  await storageService.upsertPermissionEntity(entity);
  return entity;
}

/**
 * Revoke permission from a user for a folder
 * @param {string} folderId - Folder ID (null for root)
 * @param {string} userEmail - Email of user to revoke permission from
 * @param {object} storageService - Storage service module
 * @returns {Promise<boolean>}
 */
async function revokeFolderPermission(folderId, userEmail, storageService) {
  const partitionKey = folderId || 'root';
  const rowKey = sanitizeRowKey(userEmail.toLowerCase());
  
  try {
    await storageService.deletePermissionEntity(partitionKey, rowKey);
    return true;
  } catch (error) {
    if (error.statusCode === 404) {
      return false;
    }
    throw error;
  }
}

/**
 * Revoke permission from a working group for a folder
 * @param {string} folderId - Folder ID (null for root)
 * @param {string} groupId - ID of the working group
 * @param {object} storageService - Storage service module
 * @returns {Promise<boolean>}
 */
async function revokeFolderPermissionFromGroup(folderId, groupId, storageService) {
  const partitionKey = folderId || 'root';
  const rowKey = `GROUP_${groupId}`;
  
  try {
    await storageService.deletePermissionEntity(partitionKey, rowKey);
    return true;
  } catch (error) {
    if (error.statusCode === 404) {
      return false;
    }
    throw error;
  }
}

/**
 * List all permissions for a folder
 * @param {string} folderId - Folder ID (null for root)
 * @param {object} storageService - Storage service module
 * @returns {Promise<Array>}
 */
async function listFolderPermissions(folderId, storageService) {
  const partitionKey = folderId || 'root';
  return storageService.queryPermissionEntities(`PartitionKey eq '${partitionKey}'`);
}

/**
 * Sanitize email for use as Table Storage row key
 * Row keys cannot contain: / \ # ?
 * @param {string} email - Email address
 * @returns {string}
 */
function sanitizeRowKey(email) {
  return email
    .replace(/\//g, '_SLASH_')
    .replace(/\\/g, '_BSLASH_')
    .replace(/#/g, '_HASH_')
    .replace(/\?/g, '_QMARK_');
}

/**
 * Restore email from sanitized row key
 * @param {string} rowKey - Sanitized row key
 * @returns {string}
 */
function unsanitizeRowKey(rowKey) {
  return rowKey
    .replace(/_SLASH_/g, '/')
    .replace(/_BSLASH_/g, '\\')
    .replace(/_HASH_/g, '#')
    .replace(/_QMARK_/g, '?');
}

module.exports = {
  PERMISSION,
  PERMISSION_NAMES,
  checkFolderAccess,
  getEffectivePermission,
  getFolderPermissionForUser,
  grantFolderPermission,
  grantFolderPermissionToGroup,
  revokeFolderPermission,
  revokeFolderPermissionFromGroup,
  listFolderPermissions,
  sanitizeRowKey,
  unsanitizeRowKey
};
