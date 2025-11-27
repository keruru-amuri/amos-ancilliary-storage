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
    // Parse multipart form data
    const { fields, files } = await parseMultipartForm(req);
    
    if (!files.file || files.file.length === 0) {
      context.res = createErrorResponse('No file uploaded', 400);
      return;
    }
    
    const uploadedFile = files.file[0];
    const parentId = fields.parentId && fields.parentId[0] ? fields.parentId[0] : null;
    const fileType = fields.fileType && fields.fileType[0] ? fields.fileType[0] : determineFileType(uploadedFile.originalFilename);
    
    // Read file buffer
    const fs = require('fs');
    const fileBuffer = fs.readFileSync(uploadedFile.path);
    
    // Generate unique file ID and blob name
    const fileId = uuidv4();
    const blobName = getBlobNameForFile(parentId, fileId, uploadedFile.originalFilename);
    const contentType = getContentTypeFromFileName(uploadedFile.originalFilename);
    
    // Upload to blob storage
    await uploadBlob(blobName, fileBuffer, contentType);
    
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
    
    await createEntity(entity);
    
    const responseItem = mapEntityToItem(entity);
    context.res = createSuccessResponse(responseItem, 201);
    
  } catch (error) {
    await handleError(context, error, 'Failed to upload file');
  }
};
