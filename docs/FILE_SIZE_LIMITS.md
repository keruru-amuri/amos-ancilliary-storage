# File Size Limits

## Current Configuration

### Maximum File Size: **100 MB**

The application enforces a 100 MB file size limit for uploads to ensure optimal performance and comply with Azure infrastructure limits.

## Configuration Files

### 1. Azure Functions (`api/host.json`)
```json
{
  "http": {
    "maxRequestBodySize": 104857600  // 100 MB in bytes
  }
}
```

### 2. Multiparty Parser (`api/files-upload/index.js`)
```javascript
const form = new multiparty.Form({
  maxFieldsSize: 100 * 1024 * 1024,  // 100 MB for fields
  maxFilesSize: 100 * 1024 * 1024,    // 100 MB total for files
});
```

### 3. Frontend Validation (`src/components/FileExplorer.tsx`)
- Pre-upload validation checks file size before showing confirmation modal
- Prevents files > 100 MB from being selected for upload
- Displays clear error message to user

### 4. API Error Handling (`src/services/api.ts`)
- Handles HTTP 413 (Payload Too Large) responses
- Provides user-friendly error messages

## User Experience

### Pre-Upload Validation
- Files exceeding 100 MB are rejected before upload starts
- User receives immediate feedback with file names that are too large

### Upload Confirmation Modal
- Shows warning for files > 50 MB
- Displays total size of all selected files
- Provides clear messaging about the 100 MB limit

### Error Handling
- 413 errors are caught and displayed with helpful context
- Backend errors about file size limits are properly communicated

## Why 100 MB?

1. **Azure Static Web Apps Limit**: Azure infrastructure has default limits for request body sizes
2. **Performance**: Large file uploads can cause timeouts and poor user experience
3. **Reliability**: Smaller files are more likely to complete successfully, especially on slower connections
4. **Cost Efficiency**: Prevents excessive bandwidth usage and storage costs

## Increasing the Limit

If you need to support larger files, consider these alternatives:

### Option 1: Use Azure Blob Storage SAS Tokens
- Generate SAS tokens in the backend
- Upload directly to Blob Storage from frontend
- Supports files up to 5 TB
- Requires code changes in both frontend and backend

### Option 2: Implement Chunked Uploads
- Break large files into smaller chunks
- Upload chunks sequentially or in parallel
- Reassemble on the backend
- More complex but supports very large files

### Option 3: Use Azure Front Door
- Configure Azure Front Door for larger request body sizes
- Update host.json and multiparty limits accordingly
- May incur additional costs

## Monitoring

To monitor upload failures due to file size:

1. Check Azure Application Insights for 413 errors
2. Review Azure Functions logs for "File size exceeds maximum" messages
3. Monitor user feedback and support requests

## Testing

To test file size limits:

```bash
# Create a test file of specific size (e.g., 50 MB)
dd if=/dev/zero of=test-50mb.bin bs=1M count=50

# Create a file just over the limit (101 MB)
dd if=/dev/zero of=test-101mb.bin bs=1M count=101
```

Then attempt to upload through the application UI.
