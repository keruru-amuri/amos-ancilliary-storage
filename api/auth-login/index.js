/**
 * POST /api/auth/login
 * 
 * This endpoint has been disabled. Authentication is now handled by Azure Entra ID.
 * Users should navigate to /.auth/login/aad to sign in.
 */
module.exports = async function (context, req) {
  context.res = {
    status: 410,
    headers: {
      'Content-Type': 'application/json'
    },
    body: {
      error: 'This endpoint is no longer available. Authentication is now handled by Azure Entra ID.',
      loginUrl: '/.auth/login/aad'
    }
  };
};
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
