const storageService = require('../shared/storageService');
const { createSuccessResponse, createErrorResponse, handleError } = require('../shared/utils');
const { requireAdmin } = require('../shared/auth');
const { v4: uuidv4 } = require('uuid');

/**
 * Working Groups API
 * 
 * GET /api/working-groups - List all working groups
 * POST /api/working-groups - Create a new working group
 * GET /api/working-groups/{groupId} - Get a specific working group
 * PATCH /api/working-groups/{groupId} - Update a working group
 * DELETE /api/working-groups/{groupId} - Delete a working group
 * 
 * Only system admins can manage working groups.
 */
module.exports = async function (context, req) {
  try {
    // Require admin authentication
    const user = requireAdmin(context, req);
    if (!user) return;
    
    const groupId = req.params.groupId;
    const method = req.method.toUpperCase();
    
    switch (method) {
      case 'GET':
        if (groupId) {
          await handleGetOne(context, groupId);
        } else {
          await handleList(context);
        }
        break;
      case 'POST':
        await handleCreate(context, req, user);
        break;
      case 'PATCH':
        await handleUpdate(context, req, groupId, user);
        break;
      case 'DELETE':
        await handleDelete(context, groupId);
        break;
      default:
        context.res = createErrorResponse('Method not allowed', 405);
    }
    
  } catch (error) {
    await handleError(context, error, 'Failed to manage working groups');
  }
};

/**
 * List all working groups
 */
async function handleList(context) {
  const groups = await storageService.listWorkingGroups();
  
  const result = groups.map(g => ({
    id: g.rowKey,
    name: g.name,
    description: g.description,
    createdBy: g.createdBy,
    createdAt: g.createdAt,
    updatedBy: g.updatedBy,
    updatedAt: g.updatedAt
  }));
  
  context.res = createSuccessResponse({ groups: result });
}

/**
 * Get a specific working group
 */
async function handleGetOne(context, groupId) {
  try {
    const group = await storageService.getWorkingGroup(groupId);
    
    context.res = createSuccessResponse({
      group: {
        id: group.rowKey,
        name: group.name,
        description: group.description,
        createdBy: group.createdBy,
        createdAt: group.createdAt,
        updatedBy: group.updatedBy,
        updatedAt: group.updatedAt
      }
    });
  } catch (error) {
    if (error.statusCode === 404) {
      context.res = createErrorResponse('Working group not found', 404);
    } else {
      throw error;
    }
  }
}

/**
 * Create a new working group
 */
async function handleCreate(context, req, user) {
  const { name, description } = req.body || {};
  
  if (!name) {
    context.res = createErrorResponse('name is required', 400);
    return;
  }
  
  const groupId = uuidv4();
  const now = new Date().toISOString();
  
  const entity = {
    partitionKey: 'GROUPS',
    rowKey: groupId,
    name: name,
    description: description || '',
    createdBy: user.email,
    createdAt: now,
    updatedBy: user.email,
    updatedAt: now
  };
  
  await storageService.createWorkingGroup(entity);
  
  context.res = createSuccessResponse({
    group: {
      id: groupId,
      name: entity.name,
      description: entity.description,
      createdBy: entity.createdBy,
      createdAt: entity.createdAt,
      updatedBy: entity.updatedBy,
      updatedAt: entity.updatedAt
    }
  }, 201);
}

/**
 * Update a working group
 */
async function handleUpdate(context, req, groupId, user) {
  if (!groupId) {
    context.res = createErrorResponse('groupId is required', 400);
    return;
  }
  
  const { name, description } = req.body || {};
  
  if (!name && description === undefined) {
    context.res = createErrorResponse('At least one field (name, description) must be provided', 400);
    return;
  }
  
  try {
    // Get existing group
    const existing = await storageService.getWorkingGroup(groupId);
    
    // Update fields
    const updated = {
      partitionKey: existing.partitionKey,
      rowKey: existing.rowKey,
      name: name || existing.name,
      description: description !== undefined ? description : existing.description,
      createdBy: existing.createdBy,
      createdAt: existing.createdAt,
      updatedBy: user.email,
      updatedAt: new Date().toISOString()
    };
    
    await storageService.updateWorkingGroup(updated);
    
    context.res = createSuccessResponse({
      group: {
        id: updated.rowKey,
        name: updated.name,
        description: updated.description,
        createdBy: updated.createdBy,
        createdAt: updated.createdAt,
        updatedBy: updated.updatedBy,
        updatedAt: updated.updatedAt
      }
    });
  } catch (error) {
    if (error.statusCode === 404) {
      context.res = createErrorResponse('Working group not found', 404);
    } else {
      throw error;
    }
  }
}

/**
 * Delete a working group
 */
async function handleDelete(context, groupId) {
  if (!groupId) {
    context.res = createErrorResponse('groupId is required', 400);
    return;
  }
  
  try {
    // Delete the group
    await storageService.deleteWorkingGroup(groupId);
    
    // Note: User assignments will remain but will be orphaned
    // Could add cleanup logic here if needed
    
    context.res = createSuccessResponse({ 
      success: true,
      message: 'Working group deleted successfully'
    });
  } catch (error) {
    if (error.statusCode === 404) {
      context.res = createErrorResponse('Working group not found', 404);
    } else {
      throw error;
    }
  }
}
