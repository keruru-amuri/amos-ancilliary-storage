const { BlobServiceClient, StorageSharedKeyCredential, generateBlobSASQueryParameters, BlobSASPermissions } = require('@azure/storage-blob');
const { v4: uuidv4 } = require('uuid');
const storageService = require('../shared/storageService');
const { createEntity, getBlobNameForFile, getContainerName } = storageService;
const { createSuccessResponse, createErrorResponse, mapEntityToItem } = require('../shared/utils');
const { requireAuth } = require('../shared/auth');
const { PERMISSION, checkFolderAccess } = require('../shared/permissions');

module.exports = async function (context, req) {
  try {
    // Require authentication OR allow anonymous uploads when configured
    const user = requireAuth(context, req);
    const allowAnonymous = process.env.ALLOW_ANONYMOUS_UPLOADS === 'true';

    // If user is not authenticated, allow anonymous uploads only when enabled
    // and only for root uploads (parentId === null)
    if (!user && !allowAnonymous) {
      return; // requireAuth already set 401
    }
    
    context.log('Generating SAS token for direct upload');

    const { fileName, parentId, fileType, fileSize } = req.body;

    // If anonymous uploads are allowed but user is anonymous, enforce restriction: root only
    if (!user && allowAnonymous && parentId) {
      context.res = createErrorResponse('Anonymous uploads are only permitted to the root folder', 403);
      return;
    }

    if (!fileName) {
      context.res = createErrorResponse('fileName is required', 400);
      return;
    }
    
    // Check permission to upload to this folder
    const access = await checkFolderAccess(user, parentId || null, PERMISSION.WRITE, storageService);
    if (!access.allowed) {
      context.res = createErrorResponse('You do not have permission to upload to this folder', 403);
      return;
    }

    // Get storage account credentials
    const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
    const accountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY;
    const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
    const containerName = getContainerName();

    if (!accountName && !connectionString) {
      context.log.error('Storage account credentials not configured');
      context.res = createErrorResponse('Storage configuration error', 500);
      return;
    }

    // Ensure container exists
    try {
      let blobServiceClient;
      if (connectionString) {
        blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
      } else if (accountKey) {
        const sharedKeyCredential = new StorageSharedKeyCredential(accountName, accountKey);
        blobServiceClient = new BlobServiceClient(
          `https://${accountName}.blob.core.windows.net`,
          sharedKeyCredential
        );
      } else {
        context.log.error('No valid credentials for container creation');
        context.res = createErrorResponse('Storage configuration error', 500);
        return;
      }

      const containerClient = blobServiceClient.getContainerClient(containerName);
      const exists = await containerClient.exists();
      
      if (!exists) {
        context.log(`Creating container: ${containerName}`);
        await containerClient.create();
        context.log('Container created successfully');
      }
    } catch (containerError) {
      context.log.error('Container check/creation failed:', containerError);
      // Continue - container might exist but we lack permissions to check
    }

    // Generate unique file ID and blob name
    const fileId = uuidv4();
    const blobName = getBlobNameForFile(parentId || null, fileId, fileName);

    context.log('Generated blob name:', blobName);

    // Create shared key credential for SAS token
    let sharedKeyCredential;
    let actualAccountName = accountName;
    
    if (connectionString) {
      // Extract account name and key from connection string
      const accountNameMatch = connectionString.match(/AccountName=([^;]+)/);
      const accountKeyMatch = connectionString.match(/AccountKey=([^;]+)/);
      
      if (accountNameMatch && accountKeyMatch) {
        actualAccountName = accountNameMatch[1];
        sharedKeyCredential = new StorageSharedKeyCredential(actualAccountName, accountKeyMatch[1]);
      } else {
        context.log.error('Could not parse connection string');
        context.res = createErrorResponse('Storage configuration error', 500);
        return;
      }
    } else if (accountKey) {
      sharedKeyCredential = new StorageSharedKeyCredential(accountName, accountKey);
    } else {
      context.log.error('No credentials available for SAS token generation');
      context.res = createErrorResponse('SAS token requires account key', 500);
      return;
    }

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
    const sasUrl = `https://${actualAccountName}.blob.core.windows.net/${containerName}/${blobName}?${sasToken}`;

    context.log('SAS token generated successfully');
    context.log('Container:', containerName);
    context.log('Account:', actualAccountName);

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
