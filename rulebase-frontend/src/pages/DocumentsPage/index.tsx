

import { useRef } from 'react';
import { AppShell } from '../../components/layout/AppShell';
import { FolderSidebar } from './FolderSidebar';
import { FileList } from './FileList';
import { FileViewer } from './FileViewer';
import { SearchResultsPanel } from './SearchResultsPanel';
import { DashboardPanel } from '../DashboardPage';
import { useFolderStore } from '../../store/folderStore';
import { useSearchStore } from '../../store/searchStore';
import type { PdfViewerHandle } from './FileViewer/PdfViewer';

export function DocumentsPage() {
  const { selectedFileId, selectedFolderId } = useFolderStore();
  const searchResults = useSearchStore(s => s.results);
  const pdfViewerRef = useRef<PdfViewerHandle>(null);

  return (
    <AppShell>
      <div className="flex flex-1 overflow-hidden" style={{ height: 'calc(100vh - 56px)' }}>
        {/* Left column: Folder tree + Search results */}
        <div className="flex flex-col border-r border-gray-200 bg-white min-h-0" style={{ width: '16rem', minWidth: '16rem' }}>
          <div className="flex-shrink-0 overflow-y-auto" style={{ maxHeight: searchResults.length > 0 ? '50%' : undefined, flex: searchResults.length > 0 ? undefined : 1 }}>
            <FolderSidebar noBorder />
          </div>
          {searchResults.length > 0 && (
            <SearchResultsPanel pdfViewerRef={pdfViewerRef} />
          )}
        </div>
        {selectedFileId ? (
          <FileViewer pdfViewerRef={pdfViewerRef} />
        ) : selectedFolderId ? (
          <>
            <FileList />
            <DashboardPanel />
          </>
        ) : (
          <DashboardPanel />
        )}
      </div>
    </AppShell>
  );
}
