const multiparty = require('multiparty');
const { Readable } = require('stream');
const { v4: uuidv4 } = require('uuid');
const { createEntity, uploadBlob, getBlobNameForFile, getContentTypeFromFileName, determineFileType } = require('../shared/storageService');
const { createSuccessResponse, createErrorResponse, mapEntityToItem, handleError } = require('../shared/utils');

function parseMultipartForm(req) {
  return new Promise((resolve, reject) => {
    try {
      const form = new multiparty.Form({
        maxFieldsSize: 200 * 1024 * 1024 // 200 MB
      });
      
      // Create a readable stream from the request
      let stream;
      if (req.body && Buffer.isBuffer(req.body)) {
        stream = Readable.from(req.body);
      } else if (req.rawBody) {
        stream = Readable.from(Buffer.from(req.rawBody, 'binary'));
      } else {
        reject(new Error('No request body available'));
        return;
      }
      
      // Set headers for multiparty
      stream.headers = req.headers;
      
      form.parse(stream, (err, fields, files) => {
        if (err) {
          reject(err);
          return;
        }
        
        resolve({ fields, files });
      });
    } catch (error) {
      reject(error);
    }
  });
}

module.exports = async function (context, req) {
  try {
    context.log('Upload started');
    context.log('Content-Type:', req.headers['content-type']);
    context.log('Body type:', typeof req.body);
    context.log('Has rawBody:', !!req.rawBody);
    
    // Parse multipart form data
    const { fields, files } = await parseMultipartForm(req);
    
    context.log('Form parsed successfully');
    context.log('Fields:', Object.keys(fields));
    context.log('Files:', Object.keys(files));
    
    if (!files.file || files.file.length === 0) {
      context.log.error('No file uploaded');
      context.res = createErrorResponse('No file uploaded', 400);
      return;
    }
    
    const uploadedFile = files.file[0];
    const parentId = fields.parentId && fields.parentId[0] ? fields.parentId[0] : null;
    const fileType = fields.fileType && fields.fileType[0] ? fields.fileType[0] : determineFileType(uploadedFile.originalFilename);
    
    context.log('File info:', {
      name: uploadedFile.originalFilename,
      size: uploadedFile.size,
      path: uploadedFile.path,
      parentId: parentId
    });
    
    // Read file buffer
    const fs = require('fs');
    const fileBuffer = fs.readFileSync(uploadedFile.path);
    context.log('File buffer read, size:', fileBuffer.length);
    
    // Generate unique file ID and blob name
    const fileId = uuidv4();
    const blobName = getBlobNameForFile(parentId, fileId, uploadedFile.originalFilename);
    const contentType = getContentTypeFromFileName(uploadedFile.originalFilename);
    
    context.log('Uploading to blob:', blobName);
    
    // Upload to blob storage
    await uploadBlob(blobName, fileBuffer, contentType);
    
    context.log('Blob uploaded successfully');
    
    // Clean up temp file
    try {
      fs.unlinkSync(uploadedFile.path);
      context.log('Temp file cleaned up');
    } catch (cleanupError) {
      context.log.warn('Failed to cleanup temp file:', cleanupError.message);
    }
    
    // Create metadata entity
    const partition = parentId || 'root';
    const entity = {
      partitionKey: partition,
      rowKey: fileId,
      name: uploadedFile.originalFilename,
      type: 'file',
      parentId: parentId || null,
      fileType: fileType,
      blobName: blobName,
      size: uploadedFile.size,
      createdAt: new Date().toISOString()
    };
    
    context.log('Creating metadata entity');
    await createEntity(entity);
    
    // Create INDEX entity for efficient lookups
    const indexEntity = {
      partitionKey: 'INDEX',
      rowKey: fileId,
      name: uploadedFile.originalFilename,
      type: 'file',
      parentId: parentId || null,
      fileType: fileType,
      blobName: blobName,
      size: uploadedFile.size,
      createdAt: new Date().toISOString()
    };
    
    context.log('Creating INDEX entity');
    await createEntity(indexEntity);
    
    context.log('Upload completed successfully');
    
    const responseItem = mapEntityToItem(entity);
    context.res = createSuccessResponse(responseItem, 201);
    
  } catch (error) {
    context.log.error('Upload failed with error:', error);
    context.log.error('Error stack:', error.stack);
    context.log.error('Error details:', {
      message: error.message,
      code: error.code,
      statusCode: error.statusCode,
      name: error.name
    });
    await handleError(context, error, 'Failed to upload file');
  }
};
