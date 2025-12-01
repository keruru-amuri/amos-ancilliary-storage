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
