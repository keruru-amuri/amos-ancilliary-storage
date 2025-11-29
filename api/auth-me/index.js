const { createSuccessResponse } = require('../shared/utils');
const { getCurrentUser, isSystemAdmin, ADMIN_USERS } = require('../shared/auth');

/**
 * GET /api/auth/me
 * 
 * Returns the current user's information including admin status.
 * This endpoint does NOT require authentication - it returns null if not logged in.
 * The frontend uses this to determine login state.
 */
module.exports = async function (context, req) {
  const user = getCurrentUser(req);
  
  if (!user) {
    // Not authenticated - return null user
    context.res = createSuccessResponse({
      user: null,
      isAuthenticated: false,
      isAdmin: false
    });
    return;
  }
  
  // Return user info with admin status
  context.res = createSuccessResponse({
    user: {
      email: user.email,
      displayName: user.displayName,
      userId: user.userId,
      identityProvider: user.identityProvider
    },
    isAuthenticated: true,
    isAdmin: isSystemAdmin(user)
  });
};
