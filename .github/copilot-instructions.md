# AMOS CloudStore - Copilot Instructions

## Architecture Overview

This is an Azure Static Web Apps project with a React/Vite frontend and Azure Functions backend (Node.js 20). Files are stored in Azure Blob Storage (Hot tier) with metadata in Azure Table Storage.

```
Frontend (src/)           →  API (api/)              →  Azure Storage
React 18 + Tailwind v4       13 HTTP-triggered          Blob: cloudstore-files
Vite + TypeScript            Functions (JS)             Table: filesMetadata
```

## Key Architectural Patterns

### Dual Storage Model
- **Blob Storage**: Actual file content at `{folderId}/{fileId}-{sanitizedFileName}`
- **Table Storage**: Metadata with dual-entity pattern:
  - Primary entity: `PartitionKey = parentId (or 'root'), RowKey = itemId`
  - Index entity: `PartitionKey = 'INDEX', RowKey = itemId` (for efficient lookups)

### Chunked Upload Flow (files > 100MB)
1. Frontend requests SAS token via `POST /api/files/upload-sas`
2. Client uploads directly to Blob using `@azure/storage-blob` with staged blocks
3. Client calls `POST /api/files/upload-complete` to create metadata entry

See `src/services/chunkedUpload.ts` and `api/files-upload-sas/index.js` for implementation.

### API Service Layer Pattern
All API calls go through `src/services/api.ts` which wraps fetch with error handling. When adding new endpoints:
```typescript
// Follow existing pattern in api.ts
async methodName(params): Promise<ReturnType> {
  const response = await fetch(`${API_BASE_URL}/endpoint`, { ... });
  return handleResponse<ReturnType>(response);
}
```

## Development Workflow

```bash
# Frontend only (API calls will fail without Functions running)
npm run dev

# Full stack local development (requires Azure Functions Core Tools)
# Terminal 1: npm run dev
# Terminal 2: cd api && func start

# Build for deployment
npm run build  # Outputs to /build and /build/amos-cloudstore
```

### Deploy & Verify Workflow
1. **Develop locally** - Make changes, test with `npm run dev` + `func start`
2. **Push to remote** - Commit and push branch to GitHub
3. **Merge PR** - Use GitHub MCP tools to create/merge pull request
4. **Wait for rebuild** - Azure Static Web Apps auto-deploys on merge (~2-3 min)
5. **Verify in production** - Use Chrome DevTools MCP to navigate to https://orange-rock-0bb7b9d00.3.azurestaticapps.net/ and validate changes

## Critical Files

| Purpose | Location |
|---------|----------|
| Storage client & auth | `api/shared/storageService.js` |
| Response helpers | `api/shared/utils.js` |
| Frontend API client | `src/services/api.ts` |
| Chunked upload | `src/services/chunkedUpload.ts` |
| Routing config | `staticwebapp.config.json` |

## Code Conventions

### Azure Functions Structure
Each function lives in `api/{function-name}/` with:
- `index.js` - Handler function
- `function.json` - HTTP binding configuration

Handler pattern:
```javascript
module.exports = async function (context, req) {
  try {
    // Use shared utilities
    const item = await getEntityByRowKey(id, 'file');  // Efficient INDEX lookup
    context.res = createSuccessResponse(data);
  } catch (error) {
    await handleError(context, error, 'Operation failed');
  }
};
```

### Storage Authentication Priority
`storageService.js` supports three auth methods (in priority order):
1. Connection string (`USE_CONNECTION_STRING=true`) - local dev
2. Account key (`AZURE_STORAGE_ACCOUNT_KEY`) - production

### UI Components
- Use Radix UI primitives from `src/components/ui/`
- Toast notifications via `sonner` (import as `sonner@2.0.3` due to Vite alias)
- Icons from `lucide-react`

## Environment Variables

**Local development** (`api/local.settings.json`):
```json
{
  "Values": {
    "USE_CONNECTION_STRING": "true",
    "AZURE_STORAGE_CONNECTION_STRING": "UseDevelopmentStorage=true"
  }
}
```

**Production** (Azure Static Web Apps settings):
- `AZURE_STORAGE_ACCOUNT_NAME`
- `AZURE_STORAGE_ACCOUNT_KEY`

## Common Pitfalls

1. **Table Storage RowKey restrictions**: Avoid `/`, `\`, `#`, `?` in IDs - use `uuid` for all entity IDs
2. **SAS token expiry**: Download URLs expire in 60 minutes, re-fetch before file operations
3. **Recursive folder delete**: Always use `deleteItemRecursive()` - it handles blobs + both entity types
4. **Vite aliases**: Import versioned packages like `sonner@2.0.3` due to `vite.config.ts` aliases
