const createResponse = (statusCode, body) => ({
    statusCode,
    body: JSON.stringify(body)
  });
  
  const successResponse = (data) => createResponse(200, data);
  
  const errorResponse = (error) => createResponse(500, {
    error: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString()
  });
  
  module.exports = {
    createResponse,
    successResponse,
    errorResponse
  };