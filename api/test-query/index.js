const { queryEntities } = require('../shared/storageService');

module.exports = async function (context, req) {
  try {
    context.log('Starting test query...');
    
    const filter = `PartitionKey eq 'root'`;
    context.log(`Filter: ${filter}`);
    
    const entities = await queryEntities(filter);
    context.log(`Found ${entities.length} entities`);
    
    context.res = {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: true,
        count: entities.length,
        entities: entities.map(e => ({
          partition: e.partitionKey,
          row: e.rowKey,
          name: e.name,
          type: e.type
        }))
      })
    };
  } catch (error) {
    context.log.error('Error in test-query:', error);
    
    context.res = {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: false,
        error: error.message,
        stack: error.stack,
        statusCode: error.statusCode
      })
    };
  }
};
