const storageService = require('../shared/storageService');
const { createSuccessResponse, createErrorResponse, handleError } = require('../shared/utils');
const { requireAdmin } = require('../shared/auth');

/**
 * User Group Assignments API
 * 
 * GET /api/user-group-assignments?userEmail={email} - Get groups for a user
 * GET /api/user-group-assignments?groupId={id} - Get users in a group
 * POST /api/user-group-assignments - Assign user to group
 * DELETE /api/user-group-assignments?userEmail={email}&groupId={id} - Remove user from group
 * 
 * Only system admins can manage user-group assignments.
 */
module.exports = async function (context, req) {
  try {
    // Require admin authentication
    const user = requireAdmin(context, req);
    if (!user) return;
    
    const method = req.method.toUpperCase();
    
    switch (method) {
      case 'GET':
        await handleGet(context, req);
        break;
      case 'POST':
        await handleAssign(context, req, user);
        break;
      case 'DELETE':
        await handleRemove(context, req);
        break;
      default:
        context.res = createErrorResponse('Method not allowed', 405);
    }
    
  } catch (error) {
    await handleError(context, error, 'Failed to manage user-group assignments');
  }
};

/**
 * Get assignments - either by user or by group
 */
async function handleGet(context, req) {
  const { userEmail, groupId } = req.query || {};
  
  if (userEmail) {
    // Get all groups for a user
    const assignments = await storageService.getUserGroups(userEmail);
    
    // Fetch group details for each assignment
    const groupDetails = await Promise.all(
      assignments.map(async (a) => {
        try {
          const group = await storageService.getWorkingGroup(a.groupId);
          return {
            groupId: a.groupId,
            groupName: group.name,
            groupDescription: group.description,
            assignedBy: a.assignedBy,
            assignedAt: a.assignedAt
          };
        } catch (error) {
          // Group might have been deleted
          return {
            groupId: a.groupId,
            groupName: '(Deleted Group)',
            groupDescription: '',
            assignedBy: a.assignedBy,
            assignedAt: a.assignedAt
          };
        }
      })
    );
    
    context.res = createSuccessResponse({
      userEmail: userEmail,
      groups: groupDetails
    });
  } else if (groupId) {
    // Get all users in a group
    const assignments = await storageService.getGroupUsers(groupId);
    
    const users = assignments.map(a => ({
      userEmail: a.userEmail,
      assignedBy: a.assignedBy,
      assignedAt: a.assignedAt
    }));
    
    context.res = createSuccessResponse({
      groupId: groupId,
      users: users
    });
  } else {
    context.res = createErrorResponse('Either userEmail or groupId query parameter is required', 400);
  }
}

/**
 * Assign user to group
 */
async function handleAssign(context, req, adminUser) {
  const { userEmail, groupId } = req.body || {};
  
  if (!userEmail || !groupId) {
    context.res = createErrorResponse('userEmail and groupId are required', 400);
    return;
  }
  
  // Validate group exists
  try {
    await storageService.getWorkingGroup(groupId);
  } catch (error) {
    if (error.statusCode === 404) {
      context.res = createErrorResponse('Working group not found', 404);
      return;
    }
    throw error;
  }
  
  // Create assignment
  const assignment = await storageService.assignUserToGroup(userEmail, groupId, adminUser.email);
  
  context.res = createSuccessResponse({
    assignment: {
      userEmail: assignment.userEmail,
      groupId: assignment.groupId,
      assignedBy: assignment.assignedBy,
      assignedAt: assignment.assignedAt
    }
  }, 201);
}

/**
 * Remove user from group
 */
async function handleRemove(context, req) {
  const { userEmail, groupId } = req.query || {};
  
  if (!userEmail || !groupId) {
    context.res = createErrorResponse('userEmail and groupId query parameters are required', 400);
    return;
  }
  
  try {
    await storageService.removeUserFromGroup(userEmail, groupId);
    
    context.res = createSuccessResponse({
      success: true,
      message: 'User removed from group successfully'
    });
  } catch (error) {
    if (error.statusCode === 404) {
      context.res = createErrorResponse('Assignment not found', 404);
    } else {
      throw error;
    }
  }
}
