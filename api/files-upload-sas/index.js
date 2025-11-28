const { BlobServiceClient, StorageSharedKeyCredential, generateBlobSASQueryParameters, BlobSASPermissions } = require('@azure/storage-blob');
const { v4: uuidv4 } = require('uuid');
const { createEntity, getBlobNameForFile } = require('../shared/storageService');
const { createSuccessResponse, createErrorResponse, mapEntityToItem } = require('../shared/utils');

module.exports = async function (context, req) {
  try {
    context.log('Generating SAS token for direct upload');

    const { fileName, parentId, fileType, fileSize } = req.body;

    if (!fileName) {
      context.res = createErrorResponse('fileName is required', 400);
      return;
    }

    // Get storage account credentials
    const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
    const accountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY;
    const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME || 'files';

    if (!accountName || !accountKey) {
      context.log.error('Storage account credentials not configured');
      context.res = createErrorResponse('Storage configuration error', 500);
      return;
    }

    // Generate unique file ID and blob name
    const fileId = uuidv4();
    const blobName = getBlobNameForFile(parentId || null, fileId, fileName);

    context.log('Generated blob name:', blobName);

    // Create shared key credential
    const sharedKeyCredential = new StorageSharedKeyCredential(accountName, accountKey);

    // Set SAS token expiration (1 hour from now)
    const startsOn = new Date();
    const expiresOn = new Date(startsOn);
    expiresOn.setHours(startsOn.getHours() + 1);

    // Define SAS permissions (write only for upload)
    const permissions = BlobSASPermissions.parse('cw'); // create and write

    // Generate SAS token
    const sasToken = generateBlobSASQueryParameters(
      {
        containerName: containerName,
        blobName: blobName,
        permissions: permissions,
        startsOn: startsOn,
        expiresOn: expiresOn,
      },
      sharedKeyCredential
    ).toString();

    // Construct the full SAS URL
    const sasUrl = `https://${accountName}.blob.core.windows.net/${containerName}/${blobName}?${sasToken}`;

    context.log('SAS token generated successfully');

    // Return SAS URL and metadata
    context.res = createSuccessResponse({
      sasUrl: sasUrl,
      blobName: blobName,
      fileId: fileId,
      containerName: containerName,
      accountName: accountName,
      expiresOn: expiresOn.toISOString(),
      // Metadata to be saved after upload
      metadata: {
        fileId: fileId,
        fileName: fileName,
        parentId: parentId || null,
        fileType: fileType || 'other',
        fileSize: fileSize || 0
      }
    }, 200);

  } catch (error) {
    context.log.error('Failed to generate SAS token:', error);
    context.log.error('Error stack:', error.stack);
    context.res = createErrorResponse('Failed to generate upload token: ' + error.message, 500);
  }
};
