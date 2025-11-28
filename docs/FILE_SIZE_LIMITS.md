# File Size Limits

## Current Configuration

### Maximum File Size: **5 GB** (using chunked upload)

The application now supports large file uploads up to 5 GB using Azure Blob Storage's chunked upload mechanism. Files are automatically handled differently based on their size:

- **Small files (< 32 MB)**: Traditional upload through Azure Functions
- **Large files (≥ 32 MB)**: Direct chunked upload to Azure Blob Storage using SAS tokens
- **Maximum limit**: 5 GB per file (Azure Blob Storage block blob limit)

## How It Works

### Architecture Overview

1. **SAS Token Generation** (`/api/files/upload-sas`):
   - Client requests a SAS (Shared Access Signature) token
   - Backend generates a time-limited token with write-only permissions
   - Token is valid for 1 hour

2. **Direct Upload to Blob Storage**:
   - Client uploads file directly to Azure Blob Storage using the SAS token
   - File is split into 4 MB blocks automatically
   - Up to 4 blocks are uploaded in parallel for optimal performance
   - Progress is tracked in real-time

3. **Metadata Commitment** (`/api/files/upload-complete`):
   - After successful upload, client notifies backend
   - Backend saves file metadata to Azure Table Storage
   - File appears in the UI immediately

### Benefits of This Approach

✅ **Bypasses Azure Functions size limits** - No 100 MB restriction
✅ **Handles files up to 5 GB** - Supports video files, large datasets, etc.
✅ **Better performance** - Parallel block uploads
✅ **Real-time progress tracking** - Shows bytes uploaded
✅ **Cost efficient** - Minimizes Azure Functions execution time
✅ **Automatic retry** - Azure SDK handles network interruptions

## Configuration Files

### 1. Backend - SAS Token Generation (`api/files-upload-sas/index.js`)
```javascript
// Generates SAS token with 1-hour expiration
// Permissions: create and write only
const sasToken = generateBlobSASQueryParameters({
  containerName: containerName,
  blobName: blobName,
  permissions: BlobSASPermissions.parse('cw'),
  startsOn: new Date(),
  expiresOn: new Date(Date.now() + 3600000), // 1 hour
}, sharedKeyCredential);
```

### 2. Frontend - Chunked Upload (`src/services/chunkedUpload.ts`)
```typescript
const blockSize = 4 * 1024 * 1024; // 4 MB blocks
const maxConcurrency = 4;          // 4 parallel uploads

await blockBlobClient.uploadData(file, {
  blockSize: blockSize,
  concurrency: maxConcurrency,
  onProgress: (progressEvent) => {
    // Track upload progress
  }
});
```

### 3. Azure Functions Configuration (`api/host.json`)
```json
{
  "http": {
    "maxRequestBodySize": 104857600  // 100 MB (for small files)
  }
}
```

## User Experience

### File Size Thresholds

- **0-32 MB**: Traditional upload, no special handling
- **32 MB-100 MB**: Uses chunked upload, shows warning about upload time
- **100 MB-5 GB**: Uses chunked upload, requires patience for large files
- **> 5 GB**: Rejected with clear error message

### Upload Progress Display

- File count (e.g., "Uploading 2 of 5")
- Overall percentage
- Current file being uploaded
- **Bytes uploaded / Total bytes** (for chunked uploads)
- Visual progress bar

### Warning Messages

- **50-100 MB**: "Large file detected - Upload may take longer"
- **100 MB+**: "Large file detected - Will use chunked upload"
- **> 5 GB**: "File exceeds maximum size of 5 GB"

## Technical Details

### Block Size Selection

The 4 MB block size is optimal because:
- Small enough to handle network interruptions gracefully
- Large enough to minimize the number of requests
- Balances memory usage and performance
- Azure Storage allows up to 50,000 blocks per blob (4 MB × 50,000 = 195 GB theoretical max)

### Concurrency

4 parallel uploads because:
- Maximizes throughput on most connections
- Doesn't overwhelm client memory
- Provides good progress feedback
- Reduces total upload time significantly

### Security

- SAS tokens are time-limited (1 hour expiration)
- Write-only permissions (cannot read or delete)
- Unique blob names prevent conflicts
- Backend validates all metadata

## Testing

### Test Different File Sizes

```bash
# Create test files of various sizes
# 10 MB
dd if=/dev/zero of=test-10mb.bin bs=1M count=10

# 50 MB
dd if=/dev/zero of=test-50mb.bin bs=1M count=50

# 200 MB
dd if=/dev/zero of=test-200mb.bin bs=1M count=200

# 1 GB
dd if=/dev/zero of=test-1gb.bin bs=1M count=1024

# 5 GB
dd if=/dev/zero of=test-5gb.bin bs=1M count=5120
```

### Expected Results

| File Size | Upload Method | Expected Time (100 Mbps) |
|-----------|--------------|--------------------------|
| 10 MB     | Traditional  | ~1 second                |
| 50 MB     | Chunked      | ~4 seconds               |
| 200 MB    | Chunked      | ~16 seconds              |
| 1 GB      | Chunked      | ~80 seconds              |
| 5 GB      | Chunked      | ~6-7 minutes             |

*Times are approximate and depend on network speed, server load, and Azure region.*

## Troubleshooting

### Upload Fails with "SAS token expired"
- Token expires after 1 hour
- Refresh the page and try again
- For very large files, ensure good network connection

### Upload Progress Stuck
- Check network connection
- Azure SDK automatically retries failed blocks
- If stuck for > 5 minutes, cancel and retry

### "Failed to save file metadata" Error
- File was uploaded but metadata save failed
- File exists in Blob Storage but won't appear in UI
- Contact administrator to manually add metadata

## Future Enhancements

Possible improvements for even larger files:

1. **Resumable Uploads**: Save upload state, resume if interrupted
2. **Background Uploads**: Continue upload even if user closes tab
3. **Bandwidth Throttling**: Limit upload speed to prevent network congestion
4. **MD5 Validation**: Verify file integrity after upload
5. **Pause/Resume**: Allow users to pause and resume uploads

## Monitoring

Track upload performance in Azure:

1. **Application Insights**: Monitor SAS token generation endpoint
2. **Blob Storage Metrics**: Track ingress, transactions, latency
3. **Table Storage Metrics**: Monitor metadata writes
4. **Cost Analysis**: Track storage and egress costs
