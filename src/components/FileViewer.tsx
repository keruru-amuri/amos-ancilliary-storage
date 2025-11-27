import React, { useState, useEffect } from 'react';
import { FileItem } from '../App';
import api from '../services/api';
import { X, Download, FileText, FileSpreadsheet, Video, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

interface FileViewerProps {
  file: FileItem;
  onClose: () => void;
}

export function FileViewer({ file, onClose }: FileViewerProps) {
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Fetch SAS URL when component mounts or file changes
  useEffect(() => {
    const fetchFileUrl = async () => {
      if (file.type === 'file' && !file.content) {
        setLoading(true);
        try {
          const result = await api.files.getDownloadUrl(file.id);
          setFileUrl(result.downloadUrl);
        } catch (error: any) {
          console.error('Failed to get file URL:', error);
          toast.error('Failed to load file: ' + (error.message || 'Unknown error'));
        } finally {
          setLoading(false);
        }
      }
    };

    fetchFileUrl();
  }, [file.id, file.content, file.type]);

  const handleDownload = async () => {
    try {
      let downloadUrl = fileUrl;
      
      // If we don't have a URL yet, fetch it
      if (!downloadUrl && file.type === 'file') {
        const result = await api.files.getDownloadUrl(file.id);
        downloadUrl = result.downloadUrl;
      }

      if (file.fileType === 'text' && file.content) {
        // Create a blob for text content
        const blob = new Blob([file.content], { type: 'text/plain' });
        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = file.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(blobUrl);
      } else if (downloadUrl) {
        // Use SAS URL for download
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = file.name;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

      toast.success('File downloaded successfully');
    } catch (error: any) {
      console.error('Failed to download file:', error);
      toast.error('Failed to download: ' + (error.message || 'Unknown error'));
    }
  };

  const getFileIcon = () => {
    switch (file.fileType) {
      case 'pdf':
        return (
          <div className="w-10 h-10 bg-destructive/10 rounded-[var(--radius)] flex items-center justify-center">
            <span className="text-destructive">PDF</span>
          </div>
        );
      case 'text':
        return (
          <div className="w-10 h-10 bg-primary/10 rounded-[var(--radius)] flex items-center justify-center">
            <FileText className="w-5 h-5 text-primary" />
          </div>
        );
      case 'docx':
        return (
          <div className="w-10 h-10 bg-[#2B579A]/10 rounded-[var(--radius)] flex items-center justify-center">
            <FileText className="w-5 h-5 text-[#2B579A]" />
          </div>
        );
      case 'xlsx':
        return (
          <div className="w-10 h-10 bg-[#217346]/10 rounded-[var(--radius)] flex items-center justify-center">
            <FileSpreadsheet className="w-5 h-5 text-[#217346]" />
          </div>
        );
      case 'image':
        return (
          <div className="w-10 h-10 bg-accent/20 rounded-[var(--radius)] flex items-center justify-center">
            <ImageIcon className="w-5 h-5 text-accent" />
          </div>
        );
      case 'video':
        return (
          <div className="w-10 h-10 bg-purple-500/10 rounded-[var(--radius)] flex items-center justify-center">
            <Video className="w-5 h-5 text-purple-500" />
          </div>
        );
      default:
        return (
          <div className="w-10 h-10 bg-muted/20 rounded-[var(--radius)] flex items-center justify-center">
            <FileText className="w-5 h-5 text-muted" />
          </div>
        );
    }
  };

  const getFileInfo = () => {
    if (file.fileType === 'text' && file.content) {
      return `${file.content.length} characters`;
    }
    if (file.fileType === 'pdf') {
      return 'PDF Document';
    }
    if (file.fileType === 'docx') {
      return 'Word Document';
    }
    if (file.fileType === 'xlsx') {
      return 'Excel Spreadsheet';
    }
    if (file.fileType === 'image') {
      return 'Image File';
    }
    if (file.fileType === 'video') {
      return 'Video File';
    }
    return 'File';
  };

  const renderFileContent = () => {
    // Text files - check for both fileType and content existence
    if ((file.fileType === 'text' || file.name.endsWith('.txt') || file.name.endsWith('.md')) && file.content !== undefined) {
      return (
        <div className="h-full p-6 overflow-auto bg-card">
          <pre className="whitespace-pre-wrap break-words">{file.content || '(Empty file)'}</pre>
        </div>
      );
    }

    // PDF files
    if (file.fileType === 'pdf' && (fileUrl || file.fileUrl)) {
      const pdfUrl = fileUrl || file.fileUrl;
      return (
        <div className="h-full bg-muted/5">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading PDF...</p>
              </div>
            </div>
          ) : pdfUrl ? (
            <iframe
              src={pdfUrl}
              className="w-full h-full border-0"
              title={file.name}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground">Unable to load PDF</p>
            </div>
          )}
        </div>
      );
    }

    // Word documents (docx) - using Google Docs Viewer
    if (file.fileType === 'docx' && file.fileUrl) {
      // For data URLs, we show a message. For actual URLs, we can use Google Docs Viewer
      if (file.fileUrl.startsWith('data:')) {
        return (
          <div className="h-full bg-card p-6 overflow-auto">
            <div className="max-w-4xl mx-auto bg-background border border-border rounded-[var(--radius)] p-8">
              <div className="mb-6 pb-6 border-b border-border">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 bg-[#2B579A]/10 rounded-[var(--radius)] flex items-center justify-center">
                    <FileText className="w-4 h-4 text-[#2B579A]" />
                  </div>
                  <h3>Word Document Preview</h3>
                </div>
                <p className="text-muted-foreground">Microsoft Word Document (.docx)</p>
              </div>
              
              <div className="space-y-4 text-foreground">
                <p>This is a simulated preview of a Word document. In a production environment, you would see the actual document content here.</p>
                
                <div className="bg-muted/20 rounded-[var(--radius)] p-4 my-6">
                  <h4 className="mb-2">Document: {file.name}</h4>
                  <p className="text-muted-foreground">
                    This preview demonstrates how Word documents would be displayed in the file manager. 
                    The actual implementation would use document processing libraries or cloud services to render the real content.
                  </p>
                </div>

                <p>Sample features that would be available:</p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li>Full text formatting preservation</li>
                  <li>Images and embedded media</li>
                  <li>Tables and charts</li>
                  <li>Headers and footers</li>
                  <li>Page layout and styling</li>
                </ul>
              </div>
            </div>
          </div>
        );
      }
      
      // For actual URLs, use Google Docs Viewer
      const viewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(file.fileUrl)}&embedded=true`;
      return (
        <div className="h-full bg-muted/5">
          <iframe
            src={viewerUrl}
            className="w-full h-full border-0"
            title={file.name}
          />
        </div>
      );
    }

    // Excel spreadsheets (xlsx)
    if (file.fileType === 'xlsx' && file.fileUrl) {
      return (
        <div className="h-full bg-card p-6 overflow-auto">
          <div className="max-w-6xl mx-auto bg-background border border-border rounded-[var(--radius)] p-8">
            <div className="mb-6 pb-6 border-b border-border">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 bg-[#217346]/10 rounded-[var(--radius)] flex items-center justify-center">
                  <FileSpreadsheet className="w-4 h-4 text-[#217346]" />
                </div>
                <h3>Excel Spreadsheet Preview</h3>
              </div>
              <p className="text-muted-foreground">Microsoft Excel Spreadsheet (.xlsx)</p>
            </div>
            
            {/* Sample spreadsheet preview */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-border">
                <thead>
                  <tr className="bg-muted/30">
                    <th className="border border-border px-4 py-2">A</th>
                    <th className="border border-border px-4 py-2">B</th>
                    <th className="border border-border px-4 py-2">C</th>
                    <th className="border border-border px-4 py-2">D</th>
                    <th className="border border-border px-4 py-2">E</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-border px-4 py-2">Quarter</td>
                    <td className="border border-border px-4 py-2">Revenue</td>
                    <td className="border border-border px-4 py-2">Expenses</td>
                    <td className="border border-border px-4 py-2">Profit</td>
                    <td className="border border-border px-4 py-2">Margin</td>
                  </tr>
                  <tr>
                    <td className="border border-border px-4 py-2">Q1 2025</td>
                    <td className="border border-border px-4 py-2">$125,000</td>
                    <td className="border border-border px-4 py-2">$85,000</td>
                    <td className="border border-border px-4 py-2">$40,000</td>
                    <td className="border border-border px-4 py-2">32%</td>
                  </tr>
                  <tr>
                    <td className="border border-border px-4 py-2">Q2 2025</td>
                    <td className="border border-border px-4 py-2">$140,000</td>
                    <td className="border border-border px-4 py-2">$92,000</td>
                    <td className="border border-border px-4 py-2">$48,000</td>
                    <td className="border border-border px-4 py-2">34%</td>
                  </tr>
                  <tr>
                    <td className="border border-border px-4 py-2">Q3 2025</td>
                    <td className="border border-border px-4 py-2">$158,000</td>
                    <td className="border border-border px-4 py-2">$98,000</td>
                    <td className="border border-border px-4 py-2">$60,000</td>
                    <td className="border border-border px-4 py-2">38%</td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            <div className="mt-6 p-4 bg-muted/20 rounded-[var(--radius)]">
              <p className="text-muted-foreground">
                This is a simulated spreadsheet preview showing sample data. In production, the actual Excel file content would be rendered here using spreadsheet processing libraries.
              </p>
            </div>
          </div>
        </div>
      );
    }

    // Images
    if (file.fileType === 'image' && (fileUrl || file.fileUrl)) {
      const imageUrl = fileUrl || file.fileUrl;
      return (
        <div className="h-full flex items-center justify-center p-6 overflow-auto bg-muted/5">
          {loading ? (
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading image...</p>
            </div>
          ) : imageUrl ? (
            <img
              src={imageUrl}
              alt={file.name}
              className="max-w-full max-h-full object-contain rounded-[var(--radius)]"
            />
          ) : (
            <p className="text-muted-foreground">Unable to load image</p>
          )}
        </div>
      );
    }

    // Videos
    if (file.fileType === 'video' && (fileUrl || file.fileUrl)) {
      const videoUrl = fileUrl || file.fileUrl;
      return (
        <div className="h-full flex items-center justify-center p-6 bg-muted/5">
          {loading ? (
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading video...</p>
            </div>
          ) : videoUrl ? (
            <div className="max-w-5xl w-full">
              <video
                controls
                className="w-full rounded-[var(--radius)] shadow-lg"
                src={videoUrl}
              >
                Your browser does not support the video tag.
              </video>
              <div className="mt-4 text-center">
                <p className="text-muted-foreground">{file.name}</p>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground">Unable to load video</p>
          )}
        </div>
      );
    }

    // Unsupported file type
    return (
      <div className="h-full flex items-center justify-center bg-card">
        <div className="text-center max-w-md px-6">
          <div className="w-20 h-20 bg-muted/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-10 h-10 text-muted" />
          </div>
          <h3 className="mb-2">Preview Not Available</h3>
          <p className="text-muted-foreground mb-6">
            This file type cannot be previewed in the browser. Click the download button to view it locally.
          </p>
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-[var(--radius-button)] hover:opacity-90 transition-opacity mx-auto"
          >
            <Download className="w-4 h-4" />
            <span>Download File</span>
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-card">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="flex-shrink-0">
            {getFileIcon()}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="truncate">{file.name}</h3>
            <p className="text-muted-foreground truncate">
              {getFileInfo()}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0 ml-4">
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-[var(--radius-button)] hover:opacity-90 transition-opacity"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Download</span>
          </button>
          <button
            onClick={onClose}
            className="p-2 rounded-[var(--radius)] hover:bg-accent/20 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {renderFileContent()}
      </div>
    </div>
  );
}