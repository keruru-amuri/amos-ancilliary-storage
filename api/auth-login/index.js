const { createSuccessResponse, createErrorResponse } = require('../shared/utils');
const { ADMIN_USERS } = require('../shared/auth');

/**
 * POST /api/auth/login
 * 
 * Mock login endpoint - allows login with any email while Azure AD admin consent is pending.
 * This bypasses the SWA built-in auth and uses a simple session approach.
 * 
 * Body: { email: string }
 * 
 * IMPORTANT: This is a TEMPORARY workaround. Once Azure AD admin consent is granted,
 * this endpoint should be removed and the SWA built-in auth should be used.
 */
module.exports = async function (context, req) {
  if (req.method === 'OPTIONS') {
    context.res = {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-Mock-User'
      }
    };
    return;
  }

  if (req.method !== 'POST') {
    context.res = createErrorResponse('Method not allowed', 405);
    return;
  }

  const { email } = req.body || {};

  if (!email || typeof email !== 'string') {
    context.res = createErrorResponse('Email is required', 400);
    return;
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    context.res = createErrorResponse('Invalid email format', 400);
    return;
  }

  // Generate a mock user ID (in production this would come from Azure AD)
  const userId = Buffer.from(email.toLowerCase()).toString('base64');
  
  // Check if this user is an admin
  const isAdmin = ADMIN_USERS.includes(email.toLowerCase());

  // Create a mock client principal that mimics SWA's format
  const mockPrincipal = {
    identityProvider: 'mock',
    userId: userId,
    userDetails: email,
    userRoles: ['authenticated', 'anonymous']
  };

  // Return success with user info
  // The frontend will store this and pass it in headers for subsequent requests
  context.res = createSuccessResponse({
    success: true,
    user: {
      email: email,
      displayName: email.split('@')[0],
      userId: userId,
      identityProvider: 'mock'
    },
    isAdmin: isAdmin,
    // This token is a base64 encoded mock principal that the frontend will send
    // in the X-Mock-User header for subsequent requests
    mockToken: Buffer.from(JSON.stringify(mockPrincipal)).toString('base64')
  });
};
