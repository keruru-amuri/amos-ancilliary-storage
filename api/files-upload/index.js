const multiparty = require('multiparty');
const { v4: uuidv4 } = require('uuid');
const { createEntity, uploadBlob, getBlobNameForFile, getContentTypeFromFileName, determineFileType } = require('../shared/storageService');
const { createSuccessResponse, createErrorResponse, mapEntityToItem, handleError } = require('../shared/utils');

function parseMultipartForm(req) {
  return new Promise((resolve, reject) => {
    const form = new multiparty.Form();
    
    form.parse(req, (err, fields, files) => {
      if (err) {
        reject(err);
        return;
      }
      
      resolve({ fields, files });
    });
  });
}

module.exports = async function (context, req) {
  try {
    context.log('Upload started - parsing form data');
    
    // Parse multipart form data
    const { fields, files } = await parseMultipartForm(req);
    
    context.log('Form parsed:', { 
      hasFile: !!files.file, 
      fileCount: files.file?.length || 0,
      fields: Object.keys(fields)
    });
    
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
    fs.unlinkSync(uploadedFile.path);
    
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
    
    context.log('Upload completed successfully');
    
    const responseItem = mapEntityToItem(entity);
    context.res = createSuccessResponse(responseItem, 201);
    
  } catch (error) {
    context.log.error('Upload failed with error:', error);
    context.log.error('Error stack:', error.stack);
    context.log.error('Error details:', {
      message: error.message,
      code: error.code,
      statusCode: error.statusCode
    });
    await handleError(context, error, 'Failed to upload file');
  }
};
