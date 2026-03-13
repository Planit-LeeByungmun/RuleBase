import React from 'react';
import { AppShell } from '../../components/layout/AppShell';
import { FolderSidebar } from './FolderSidebar';
import { FileList } from './FileList';
import { FileViewer } from './FileViewer';
import { DashboardPanel } from '../DashboardPage';
import { useFolderStore } from '../../store/folderStore';

export function DocumentsPage() {
  const { selectedFileId, selectedFolderId } = useFolderStore();

  return (
    <AppShell>
      <div className="flex flex-1 overflow-hidden" style={{ height: 'calc(100vh - 56px)' }}>
        <FolderSidebar />
        {selectedFileId ? (
          <FileViewer />
        ) : (
          <>
            <FileList />
            <DashboardPanel />
          </>
        )}
      </div>
    </AppShell>
  );
}
