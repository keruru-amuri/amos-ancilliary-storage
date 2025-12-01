/**
 * Authentication helpers for Azure Static Web Apps
 * 
 * Parses the x-ms-client-principal header provided by SWA
 * and provides utilities for checking user identity and admin status.
 */

// System administrators - hardcoded for now, will be replaced with Azure AD groups later
const ADMIN_USERS = [
  'khairulamri.mdsohod@malaysiaairlines.com'
];

// Allowed email domains (empty array = allow all authenticated users)
// Add domains here to restrict access: ['malaysiaairlines.com']
const ALLOWED_DOMAINS = [];

/**
 * Parse the x-ms-client-principal header from SWA
 * @param {object} req - The HTTP request object
 * @returns {object|null} - The client principal or null if not authenticated
 */
function getClientPrincipal(req) {
  const swaHeader = req.headers['x-ms-client-principal'];
  
  if (swaHeader) {
    try {
      const encoded = Buffer.from(swaHeader, 'base64');
      const decoded = encoded.toString('utf8');
      return JSON.parse(decoded);
    } catch (error) {
      console.error('Failed to parse SWA client principal:', error);
    }
  }
  
  return null;
}

/**
 * Get current user information from request
 * @param {object} req - The HTTP request object
 * @returns {object|null} - User object with email, userId, roles, etc.
 */
function getCurrentUser(req) {
  const clientPrincipal = getClientPrincipal(req);
  
  if (!clientPrincipal) {
    return null;
  }
  
  // Extract email from userDetails (AAD provides email)
  const email = clientPrincipal.userDetails?.toLowerCase() || null;
  
  return {
    userId: clientPrincipal.userId,
    email: email,
    displayName: clientPrincipal.userDetails,
    roles: clientPrincipal.userRoles || [],
    identityProvider: clientPrincipal.identityProvider,
    claims: clientPrincipal.claims || []
  };
}

/**
 * Check if request is from an authenticated user
 * @param {object} req - The HTTP request object
 * @returns {boolean}
 */
function isAuthenticated(req) {
  const user = getCurrentUser(req);
  return user !== null && user.roles.includes('authenticated');
}

/**
 * Check if user is a system administrator
 * @param {object} user - User object from getCurrentUser()
 * @returns {boolean}
 */
function isSystemAdmin(user) {
  if (!user || !user.email) {
    return false;
  }
  return ADMIN_USERS.includes(user.email.toLowerCase());
}

/**
 * Check if user's email domain is allowed
 * @param {object} user - User object from getCurrentUser()
 * @returns {boolean}
 */
function isAllowedDomain(user) {
  // If no domain restrictions, allow all
  if (ALLOWED_DOMAINS.length === 0) {
    return true;
  }
  
  if (!user || !user.email) {
    return false;
  }
  
  const domain = user.email.split('@')[1];
  return ALLOWED_DOMAINS.includes(domain?.toLowerCase());
}

/**
 * Require authentication middleware helper
 * Returns error response if not authenticated
 * @param {object} context - Azure Function context
 * @param {object} req - The HTTP request object
 * @returns {object|null} - User object if authenticated, null if error response was set
 */
function requireAuth(context, req) {
  const user = getCurrentUser(req);
  
  if (!user) {
    context.res = {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Authentication required',
        statusCode: 401
      })
    };
    return null;
  }
  
  if (!isAllowedDomain(user)) {
    context.res = {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Access denied. Your email domain is not authorized.',
        statusCode: 403
      })
    };
    return null;
  }
  
  return user;
}

/**
 * Require admin privileges
 * @param {object} context - Azure Function context
 * @param {object} req - The HTTP request object
 * @returns {object|null} - User object if admin, null if error response was set
 */
function requireAdmin(context, req) {
  const user = requireAuth(context, req);
  
  if (!user) {
    return null; // Error already set by requireAuth
  }
  
  if (!isSystemAdmin(user)) {
    context.res = {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Admin privileges required',
        statusCode: 403
      })
    };
    return null;
  }
  
  return user;
}

module.exports = {
  getClientPrincipal,
  getCurrentUser,
  isAuthenticated,
  isSystemAdmin,
  isAllowedDomain,
  requireAuth,
  requireAdmin,
  ADMIN_USERS,
  ALLOWED_DOMAINS
};
