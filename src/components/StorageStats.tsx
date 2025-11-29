import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { HardDrive } from 'lucide-react';

interface StorageStatsProps {
  totalItems: number;
}

export function StorageStats({ totalItems }: StorageStatsProps) {
  const [stats, setStats] = useState<{
    usedGB: number;
    totalGB: number;
    itemCount: number;
    fileCount: number;
    folderCount: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const result = await api.storage.getStats();
        setStats({
          usedGB: parseFloat(result.usedGB || '0'),
          totalGB: parseFloat(result.totalGB || '50'),
          itemCount: result.itemCount,
          fileCount: result.fileCount,
          folderCount: result.folderCount
        });
      } catch (error) {
        console.error('Failed to fetch storage stats:', error);
        // Fall back to defaults
        setStats({
          usedGB: 0,
          totalGB: 50,
          itemCount: totalItems,
          fileCount: 0,
          folderCount: 0
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [totalItems]);

  const usedGB = stats?.usedGB || 0;

  return (
    <div className="p-6 border-t border-sidebar-border bg-card/50">
      <div className="flex items-center gap-2 mb-3">
        <HardDrive className="w-4 h-4 text-muted-foreground" />
        <p className="text-muted-foreground">Storage Usage</p>
      </div>
      
      {loading ? (
        <div className="flex items-center justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-baseline justify-between">
            <div className="flex items-center gap-2">
              <span className="text-foreground font-semibold text-lg">{usedGB.toFixed(1)} GB</span>
              <span className="text-muted-foreground text-sm">used</span>
            </div>
          </div>
          
          {/* omitted total counts to avoid confusion between account and folder scopes */}
        </div>
      )}
    </div>
  );
}
