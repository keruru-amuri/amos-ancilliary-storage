# AMOS CloudStore - Azure File Management System

A modern, cloud-based file management system built with React and Azure Services. Upload, organize, and manage files with a sleek interface powered by Azure Blob Storage, Azure Functions, and Azure Table Storage.

![Azure Static Web Apps](https://img.shields.io/badge/Azure-Static%20Web%20Apps-blue)
![Storage Tier](https://img.shields.io/badge/Storage-Hot%20Tier-orange)
![React](https://img.shields.io/badge/React-18.3.1-61dafb)
![Node.js](https://img.shields.io/badge/Node.js-20+-green)
![License](https://img.shields.io/badge/License-MIT-green)

## Features

✨ **Modern UI** - Built with React 18 + Tailwind CSS v4 + Radix UI components  
☁️ **Azure Integration** - Blob Storage (Hot tier) + Table Storage + Azure Functions API  
🔐 **Secure Access** - Time-limited SAS tokens for file downloads (60-minute expiry)  
📁 **Folder Management** - Create, rename, delete folders with recursive operations  
📤 **File Upload** - Multi-file upload with support for images, videos, PDFs, Office docs  
👀 **File Preview** - In-browser preview for PDFs, images, videos, and text files  
📊 **Storage Stats** - Real-time storage usage and item counts  
🚀 **Auto-Deploy** - GitHub Actions CI/CD pipeline included  

## Tech Stack

### Frontend
- **React** 18.3.1 with TypeScript
- **Vite** 6.3.5 for blazing-fast builds
- **Tailwind CSS** v4.1.3 for styling
- **Radix UI** for accessible component primitives
- **Lucide React** for icons
- **Sonner** for toast notifications

### Backend (Azure)
- **Azure Static Web Apps** - Frontend hosting with integrated Functions
- **Azure Functions** (Node.js 20) - 13 HTTP-triggered API endpoints
- **Azure Blob Storage** (Hot tier) - File content storage
- **Azure Table Storage** - File/folder metadata
- **SAS Tokens** - Secure, time-limited file access

## Architecture

```
┌─────────────────────────────────────┐
│   Azure Static Web Apps             │
│  ┌────────────┐   ┌──────────────┐ │
│  │  React App │◄─►│   Functions  │ │
│  │   (Vite)   │   │  (Node.js)   │ │
│  └────────────┘   └──────┬───────┘ │
└──────────────────────────┼─────────┘
                           │
          ┌────────────────┴────────────┐
          │   Azure Storage Account     │
          │  ┌────────────────────────┐ │
          │  │  Blob Storage (Hot)    │ │
          │  │  cloudstore-files      │ │
          │  └────────────────────────┘ │
          │  ┌────────────────────────┐ │
          │  │  Table Storage         │ │
          │  │  filesMetadata         │ │
          │  └────────────────────────┘ │
          └─────────────────────────────┘
```

See **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)** for detailed architecture documentation.

## Getting Started

### Prerequisites

- **Node.js** 20+ and npm
- **Azure subscription** ([free account](https://azure.microsoft.com/free/))
- **Azure CLI** ([install](https://docs.microsoft.com/cli/azure/install-azure-cli))
- **Git** and GitHub account

### Local Development

```bash
# Clone the repository
git clone https://github.com/keruru-amuri/amos-ancilliary-storage.git
cd amos-ancilliary-storage

# Install frontend dependencies
npm install

# Install API dependencies
cd api
npm install
cd ..

# Start development server (frontend only)
npm run dev

# For full local testing with Functions:
# Install Azure Functions Core Tools
npm install -g azure-functions-core-tools@4

# In terminal 1: Start frontend
npm run dev

# In terminal 2: Start Functions
cd api
func start
```

Frontend: http://localhost:3000  
API: http://localhost:7071/api/*

**Note**: For full functionality, you need Azure Storage Account. For local development without Azure, the app will work in demo mode (API calls will fail gracefully).

## Deployment to Azure

### Quick Deploy (Recommended)

Follow the complete step-by-step guide: **[docs/DEPLOYMENT_GUIDE.md](docs/DEPLOYMENT_GUIDE.md)**

### Summary Steps

1. **Create Azure Storage Account** (Hot tier)
   ```bash
   az storage account create --name cloudstorestorage123 \
     --resource-group cloudstore-rg --sku Standard_LRS --access-tier Hot
   ```

2. **Create Blob Container & Table**
   ```bash
   az storage container create --name cloudstore-files --account-name cloudstorestorage123
   az storage table create --name filesMetadata --account-name cloudstorestorage123
   ```

3. **Create Azure Static Web App** (connects to GitHub)
   - Via Azure Portal: Create resource → Static Web App
   - Connect to your GitHub repo
   - Build configuration:
     - App location: `/`
     - API location: `api`
     - Output location: `build`

4. **Configure Environment Variables** in Static Web App settings:
   - `AZURE_STORAGE_CONNECTION_STRING`
   - `AZURE_STORAGE_ACCOUNT_NAME`
   - `AZURE_STORAGE_ACCOUNT_KEY`

5. **Push to GitHub** - automatic deployment via GitHub Actions!

## API Endpoints

### Folders
- `POST /api/folders` - Create folder
- `GET /api/folders?parentId={id}` - List folders
- `PATCH /api/folders/{id}` - Rename folder
- `DELETE /api/folders/{id}` - Delete folder (cascade)
- `GET /api/folders/{id}/path` - Get breadcrumb path

### Files
- `POST /api/files/upload` - Upload file (multipart/form-data)
- `GET /api/files/{id}/download` - Get SAS URL for download
- `PATCH /api/files/{id}` - Rename file
- `DELETE /api/files/{id}` - Delete file
- `GET /api/files?parentId={id}` - List files

### Utility
- `GET /api/items?parentId={id}` - List all items (files + folders)
- `GET /api/search?q={query}` - Search files/folders
- `GET /api/storage/stats` - Get storage statistics

Full API documentation: **[docs/ARCHITECTURE.md#api-specifications](docs/ARCHITECTURE.md#api-specifications)**

## Project Structure

```
mabes-amos-ancilliary/
├── src/                        # React frontend
│   ├── components/             # UI components
│   │   ├── FileExplorer.tsx    # Main file browser
│   │   ├── FileViewer.tsx      # File preview
│   │   ├── StorageStats.tsx    # Storage usage
│   │   └── ui/                 # Radix UI components
│   ├── services/
│   │   └── api.ts              # API client
│   └── App.tsx                 # Main app
├── api/                        # Azure Functions
│   ├── folders-*/              # Folder CRUD functions
│   ├── files-*/                # File CRUD functions
│   ├── items-list/             # Combined listing
│   ├── search/                 # Search function
│   ├── storage-stats/          # Stats function
│   └── shared/
│       ├── storageService.js   # Azure Storage utilities
│       └── utils.js            # Helper functions
├── docs/
│   ├── ARCHITECTURE.md         # System architecture & API specs
│   └── DEPLOYMENT.md           # Deployment guide
├── staticwebapp.config.json    # Azure SWA configuration
├── .github/workflows/          # GitHub Actions CI/CD
└── package.json
```

## Configuration

### Static Web App (`staticwebapp.config.json`)

```json
{
  "platform": { "apiRuntime": "node:20" },
  "routes": [
    { "route": "/amos-cloudstore/api/*", "rewrite": "/api/*", "allowedRoles": ["anonymous"] },
    { "route": "/amos-cloudstore/*", "rewrite": "/index.html" }
  ],
  "navigationFallback": { "rewrite": "/index.html" }
}
```

### Environment Variables (Azure Portal)

| Variable | Description |
|----------|-------------|
| `AZURE_STORAGE_CONNECTION_STRING` | Full connection string from Storage Account |
| `AZURE_STORAGE_ACCOUNT_NAME` | Storage account name |
| `AZURE_STORAGE_ACCOUNT_KEY` | Storage account access key |

## Storage Tier Decision

**Why Hot Tier?** 
- ❌ **Cold Tier rejected** due to:
  - 90-day minimum retention (early deletion charges)
  - Per-GB retrieval costs (expensive for file explorer)
  - Not suitable for frequently accessed files

- ✅ **Hot Tier chosen** because:
  - No retrieval costs
  - No minimum retention
  - Optimal for file explorer use case
  - Instant access with no latency

**Cost Optimization**: Optionally add lifecycle policy to move files not accessed in 90+ days to Cool tier.

## Security

- **Authentication**: Currently anonymous (single-user demo)
- **Storage Access**: Functions use account keys (never exposed to frontend)
- **File Access**: Time-limited SAS tokens (60-minute expiry)
- **CORS**: Configured for Static Web App domain only
- **Future**: Add Azure AD B2C for multi-user authentication

## Cost Estimate

Monthly costs for moderate usage (10GB storage, 1000 operations/day):

| Service | Cost |
|---------|------|
| Static Web Apps (Free tier) | $0.00 |
| Blob Storage (Hot, 10GB) | ~$0.20 |
| Table Storage (1GB metadata) | ~$0.10 |
| Blob Operations | ~$0.10 |
| Data Transfer (100GB egress) | ~$8.00 |
| **Total** | **~$8.40/month** |

## Roadmap

- [ ] User authentication (Azure AD B2C)
- [ ] File sharing with permissions
- [ ] Thumbnail generation for images
- [ ] Full-text search
- [ ] File versioning
- [ ] Folder size calculations
- [ ] Batch operations
- [ ] Mobile app

## Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## Support

- 📖 **Documentation**: [docs/](docs/)
- 🐛 **Issues**: [GitHub Issues](https://github.com/keruru-amuri/amos-ancilliary-storage/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/keruru-amuri/amos-ancilliary-storage/discussions)

## License

[MIT License](LICENSE)

## Credits

- Original design: [Figma - File Explorer Web App](https://www.figma.com/design/U18X52JGH351lk2ylSKHVa/File-Explorer-Web-App)
- Built with Azure Static Web Apps
- UI components by [Radix UI](https://www.radix-ui.com/)

---

**Built with ❤️ for Azure**