/**
 * POST /api/auth/logout
 * 
 * This endpoint has been disabled. Authentication is now handled by Azure Entra ID.
 * Users should navigate to /.auth/logout to sign out.
 */
module.exports = async function (context, req) {
  context.res = {
    status: 410,
    headers: {
      'Content-Type': 'application/json'
    },
    body: {
      error: 'This endpoint is no longer available. Authentication is now handled by Azure Entra ID.',
      logoutUrl: '/.auth/logout'
    }
  };
};
