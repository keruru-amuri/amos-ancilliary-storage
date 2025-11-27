function createSuccessResponse(data, statusCode = 200) {
  return {
    status: statusCode,
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  };
}

function createErrorResponse(message, statusCode = 500, details = null) {
  const error = {
    error: message,
    statusCode
  };
  
  if (details) {
    error.details = details;
  }
  
  return {
    status: statusCode,
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(error)
  };
}

function validateRequired(fields, object) {
  const missing = [];
  
  for (const field of fields) {
    if (object[field] === undefined || object[field] === null || object[field] === '') {
      missing.push(field);
    }
  }
  
  if (missing.length > 0) {
    return {
      valid: false,
      message: `Missing required fields: ${missing.join(', ')}`
    };
  }
  
  return { valid: true };
}

function mapEntityToItem(entity) {
  // Strip any trailing `:0` or similar artifacts from Azure Table Storage
  const cleanId = typeof entity.rowKey === 'string' 
    ? entity.rowKey.split(':')[0] 
    : entity.rowKey;
  
  const cleanParentId = entity.parentId && typeof entity.parentId === 'string'
    ? entity.parentId.split(':')[0]
    : entity.parentId;
  
  return {
    id: cleanId,
    name: entity.name,
    type: entity.type,
    parentId: cleanParentId || null,
    fileType: entity.fileType || undefined,
    blobName: entity.blobName || undefined,
    size: entity.size || 0,
    createdAt: entity.createdAt
  };
}

async function handleError(context, error, customMessage = 'An error occurred') {
  console.error(`${customMessage}:`, error);
  
  if (error.statusCode === 404) {
    context.res = createErrorResponse('Resource not found', 404);
  } else if (error.statusCode === 409) {
    context.res = createErrorResponse('Resource already exists', 409, error.message);
  } else {
    context.res = createErrorResponse(customMessage, 500, error.message);
  }
}

module.exports = {
  createSuccessResponse,
  createErrorResponse,
  validateRequired,
  mapEntityToItem,
  handleError
};
