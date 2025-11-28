import React, { useState, useEffect } from 'react';
import { FileExplorer } from './components/FileExplorer';
import { FileViewer } from './components/FileViewer';
import { Header } from './components/Header';
import { Toaster, toast } from 'sonner@2.0.3';
import api, { type FileItem as ApiFileItem } from './services/api';

export interface FileItem {
  id: string;
  name: string;
  type: 'file' | 'folder';
  parentId: string | null;
  content?: string;
  fileType?: string; // e.g., 'text', 'pdf', 'image', etc.
  fileUrl?: string; // For uploaded files or SAS URLs
  createdAt: number;
  downloadUrl?: string; // SAS token URL from API
}

// Sample data to populate the file explorer
const getSampleData = (): FileItem[] => {
  return [
    // Root level folders
    { id: '1', name: 'Documents', type: 'folder', parentId: null, createdAt: Date.now() - 86400000 * 10 },
    { id: '2', name: 'Projects', type: 'folder', parentId: null, createdAt: Date.now() - 86400000 * 8 },
    { id: '3', name: 'Media', type: 'folder', parentId: null, createdAt: Date.now() - 86400000 * 5 },
    
    // Documents folder contents
    { id: '4', name: 'Meeting Notes.txt', type: 'file', parentId: '1', fileType: 'text', content: 'Team Meeting - Q4 2025\n\nAttendees:\n- Sarah Johnson\n- Michael Chen\n- Emily Rodriguez\n\nAgenda:\n1. Project updates\n2. Resource allocation\n3. Timeline review\n\nKey Decisions:\n- Launch delayed by 2 weeks\n- Additional testing phase required\n- Budget approved for extra resources', createdAt: Date.now() - 86400000 * 3 },
    { id: '5', name: 'Research', type: 'folder', parentId: '1', createdAt: Date.now() - 86400000 * 7 },
    { id: '6', name: 'Budget 2025.txt', type: 'file', parentId: '1', fileType: 'text', content: 'Annual Budget 2025\n\nQ1: $125,000\n- Marketing: $45,000\n- Development: $60,000\n- Operations: $20,000\n\nQ2: $140,000\n- Marketing: $50,000\n- Development: $70,000\n- Operations: $20,000\n\nTotal Year: $530,000', createdAt: Date.now() - 86400000 * 6 },
    { id: '17', name: 'Company Handbook.pdf', type: 'file', parentId: '1', fileType: 'pdf', fileUrl: 'https://pdfobject.com/pdf/sample.pdf', createdAt: Date.now() - 86400000 * 5 },
    { id: '22', name: 'Annual Report.docx', type: 'file', parentId: '1', fileType: 'docx', fileUrl: 'data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,sample', createdAt: Date.now() - 86400000 * 4 },
    
    // Research subfolder
    { id: '7', name: 'Market Analysis.txt', type: 'file', parentId: '5', fileType: 'text', content: 'Market Analysis Report\n\nIndustry Trends:\n- Cloud adoption increasing 45% YoY\n- Remote work tools in high demand\n- Security concerns driving investment\n\nCompetitor Overview:\n1. Company A - Market leader (35% share)\n2. Company B - Growing challenger (22% share)\n3. Company C - Niche player (12% share)\n\nOpportunities:\n- Underserved SMB market\n- Integration possibilities\n- Mobile-first approach', createdAt: Date.now() - 86400000 * 4 },
    { id: '8', name: 'User Feedback.txt', type: 'file', parentId: '5', fileType: 'text', content: 'Customer Feedback Summary\n\nPositive:\n- Intuitive interface (mentioned by 87%)\n- Fast performance\n- Excellent customer support\n\nAreas for Improvement:\n- Mobile app needs work\n- More integrations requested\n- Pricing structure unclear\n\nFeature Requests:\n- Dark mode (requested by 156 users)\n- Offline mode\n- Advanced search', createdAt: Date.now() - 86400000 * 2 },
    { id: '18', name: 'Technical Specs.pdf', type: 'file', parentId: '5', fileType: 'pdf', fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', createdAt: Date.now() - 86400000 * 3 },
    
    // Projects folder contents
    { id: '9', name: 'Website Redesign', type: 'folder', parentId: '2', createdAt: Date.now() - 86400000 * 5 },
    { id: '10', name: 'Mobile App', type: 'folder', parentId: '2', createdAt: Date.now() - 86400000 * 4 },
    { id: '11', name: 'Project Timeline.txt', type: 'file', parentId: '2', fileType: 'text', content: 'Project Timeline Overview\n\nWebsite Redesign:\n- Start: January 15, 2025\n- Design Phase: 3 weeks\n- Development: 6 weeks\n- Testing: 2 weeks\n- Launch: April 5, 2025\n\nMobile App:\n- Start: February 1, 2025\n- Design: 4 weeks\n- Development: 10 weeks\n- Beta Testing: 3 weeks\n- Launch: June 1, 2025', createdAt: Date.now() - 86400000 * 3 },
    { id: '19', name: 'Proposal.pdf', type: 'file', parentId: '2', fileType: 'pdf', fileUrl: 'https://pdfobject.com/pdf/sample.pdf', createdAt: Date.now() - 86400000 * 4 },
    
    // Website Redesign subfolder
    { id: '12', name: 'Design Brief.txt', type: 'file', parentId: '9', fileType: 'text', content: 'Website Redesign - Design Brief\n\nObjectives:\n- Modern, clean aesthetic\n- Improved user experience\n- Better mobile responsiveness\n- Faster load times\n\nTarget Audience:\n- Age: 25-45\n- Tech-savvy professionals\n- Small to medium business owners\n\nBrand Guidelines:\n- Primary colors: Blues and whites\n- Typography: Clean, professional fonts\n- Imagery: Authentic, diverse people', createdAt: Date.now() - 86400000 * 2 },
    { id: '13', name: 'Requirements.txt', type: 'file', parentId: '9', fileType: 'text', content: 'Technical Requirements\n\n1. Performance\n- Page load under 2 seconds\n- Mobile-first responsive design\n- Optimized images\n\n2. Features\n- Interactive navigation\n- Search functionality\n- User dashboard\n- Contact forms\n\n3. Technology Stack\n- React frontend\n- Node.js backend\n- PostgreSQL database\n- AWS hosting', createdAt: Date.now() - 86400000 * 1 },
    
    // Mobile App subfolder
    { id: '14', name: 'Feature List.txt', type: 'file', parentId: '10', fileType: 'text', content: 'Mobile App - Core Features\n\nVersion 1.0:\n- User authentication\n- File upload/download\n- Offline mode\n- Push notifications\n- Search and filter\n\nVersion 1.1 (Future):\n- Collaboration tools\n- Advanced sharing\n- Document scanning\n- Voice notes\n\nPlatforms:\n- iOS (minimum: iOS 15)\n- Android (minimum: Android 10)', createdAt: Date.now() - 86400000 },
    
    // Media folder contents
    { id: '15', name: 'Images', type: 'folder', parentId: '3', createdAt: Date.now() - 86400000 * 3 },
    { id: '16', name: 'Videos', type: 'folder', parentId: '3', createdAt: Date.now() - 86400000 * 2 },
    { id: '20', name: 'Brand Assets.txt', type: 'file', parentId: '3', fileType: 'text', content: 'Brand Assets Inventory\n\nLogos:\n- Primary logo (PNG, SVG)\n- Secondary logo variations\n- Monochrome versions\n\nColors:\n- Primary: #0D4689\n- Secondary: #1F4074\n- Accent: #7C8D97\n\nFonts:\n- Headings: Mundial DemiBold\n- Body: Mundial Light\n- UI Elements: Mundial Regular', createdAt: Date.now() - 86400000 },
    { id: '21', name: 'Brand Guidelines.pdf', type: 'file', parentId: '3', fileType: 'pdf', fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', createdAt: Date.now() - 86400000 * 2 },
    { id: '23', name: 'Q4 Financial Report.xlsx', type: 'file', parentId: '3', fileType: 'xlsx', fileUrl: 'data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,sample', createdAt: Date.now() - 86400000 * 1 },
    
    // Videos subfolder
    { id: '24', name: 'Product Demo.mp4', type: 'file', parentId: '16', fileType: 'video', fileUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', createdAt: Date.now() - 86400000 * 2 },
    { id: '25', name: 'Company Overview.mp4', type: 'file', parentId: '16', fileType: 'video', fileUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4', createdAt: Date.now() - 86400000 * 1 },
  ];
};

export default function App() {
  const [items, setItems] = useState<FileItem[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [breadcrumbPath, setBreadcrumbPath] = useState<FileItem[]>([]);

  // Load items from API on mount
  useEffect(() => {
    loadItems();
  }, []);

  // Load breadcrumb path when folder changes
  useEffect(() => {
    if (currentFolderId) {
      loadBreadcrumbPath(currentFolderId);
    } else {
      setBreadcrumbPath([]);
    }
  }, [currentFolderId]);

  // Load breadcrumb path for current folder
  const loadBreadcrumbPath = async (folderId: string) => {
    try {
      const path = await api.folders.getPath(folderId);
      setBreadcrumbPath(path);
    } catch (error: any) {
      console.error('Failed to load breadcrumb path:', error);
      // Don't show error toast for breadcrumbs, just use empty path
      setBreadcrumbPath([]);
    }
  };

  // Load items for current folder
  const loadItems = async (folderId: string | null = null) => {
    try {
      setLoading(true);
      const apiItems = await api.items.list(folderId);
      
      // Convert API items to app format
      const convertedItems: FileItem[] = apiItems.map(item => ({
        id: item.id,
        name: item.name,
        type: item.type,
        parentId: item.parentId,
        fileType: item.fileType,
        size: item.size,
        createdAt: new Date(item.createdAt).getTime(),
        downloadUrl: item.downloadUrl
      }));
      
      setItems(convertedItems);
    } catch (error: any) {
      console.error('Failed to load items:', error);
      toast.error('Failed to load files: ' + (error.message || 'Unknown error'));
      // Fall back to empty array
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  // Reload items when folder changes
  useEffect(() => {
    loadItems(currentFolderId);
  }, [currentFolderId]);

  // Reset selected file when navigating to another folder
  useEffect(() => {
    setSelectedFile(null);
  }, [currentFolderId]);

  const handleFileSelect = (file: FileItem) => {
    if (file.type === 'file') {
      setSelectedFile(file);
    }
  };

  const handleFileClose = () => {
    setSelectedFile(null);
  };

  const handleFileSave = (fileId: string, content: string) => {
    // File content updates would require API support
    // For now, just update local state
    setItems(prevItems =>
      prevItems.map(item =>
        item.id === fileId ? { ...item, content } : item
      )
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading files...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Toaster 
        position="top-right" 
        toastOptions={{
          style: {
            background: 'var(--card)',
            color: 'var(--card-foreground)',
            border: '1px solid var(--border)',
          },
        }}
      />
      
      {/* Header */}
      <Header />
      
      {/* Main Content */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* File Explorer Sidebar */}
        <div className={`${selectedFile ? 'w-80 lg:w-96' : 'w-full md:w-96'} border-r border-border flex-shrink-0 flex flex-col min-h-0`}>
          <div className="flex-1 min-h-0">
            <FileExplorer
              items={items}
              setItems={setItems}
              currentFolderId={currentFolderId}
              setCurrentFolderId={setCurrentFolderId}
              onFileSelect={handleFileSelect}
              selectedFileId={selectedFile?.id}
              onItemsChange={loadItems}
              breadcrumbPath={breadcrumbPath}
            />
          </div>
        </div>

        {/* File Viewer or Empty State */}
        {selectedFile ? (
          <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
            <FileViewer
              file={selectedFile}
              onClose={handleFileClose}
            />
          </div>
        ) : (
          <div className="hidden md:flex flex-1 min-h-0 items-center justify-center bg-card">
            <div className="text-center max-w-md px-6">
              <div className="mb-4 flex justify-center">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                  <svg className="w-10 h-10 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
              <h3 className="mb-2">No File Selected</h3>
              <p className="text-muted-foreground">
                Select a file from the explorer to view or download its contents
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}