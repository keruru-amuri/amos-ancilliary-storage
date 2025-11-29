const { createSuccessResponse } = require('../shared/utils');

/**
 * POST /api/auth/logout
 * 
 * Mock logout endpoint - clears the mock session.
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

  // Simply return success - the frontend will clear its stored token
  context.res = createSuccessResponse({
    success: true,
    message: 'Logged out successfully'
  });
};
