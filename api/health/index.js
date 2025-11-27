module.exports = async function (context, req) {
  try {
    const envCheck = {
      hasStorageAccountName: !!process.env.AZURE_STORAGE_ACCOUNT_NAME,
      hasStorageAccountKey: !!process.env.AZURE_STORAGE_ACCOUNT_KEY,
      hasConnectionString: !!process.env.AZURE_STORAGE_CONNECTION_STRING,
      useConnectionString: process.env.USE_CONNECTION_STRING,
      nodeVersion: process.version,
      timestamp: new Date().toISOString()
    };

    context.res = {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        status: 'healthy',
        environment: envCheck
      })
    };
  } catch (error) {
    context.res = {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        status: 'error',
        message: error.message
      })
    };
  }
};
