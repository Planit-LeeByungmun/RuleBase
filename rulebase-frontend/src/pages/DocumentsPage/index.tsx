import React from 'react';
import { AppShell } from '../../components/layout/AppShell';
import { FolderSidebar } from './FolderSidebar';
import { FileList } from './FileList';
import { FileViewer } from './FileViewer';
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
            {selectedFolderId && (
              <div className="flex-1 flex items-center justify-center text-gray-400 bg-gray-50">
                <div className="text-center">
                  <div className="text-5xl mb-3">👆</div>
                  <p className="text-sm">파일을 클릭하면 뷰어가 열립니다</p>
                </div>
              </div>
            )}
            {!selectedFolderId && (
              <div className="flex-1 flex items-center justify-center text-gray-400 bg-gray-50">
                <div className="text-center">
                  <div className="text-5xl mb-3">📂</div>
                  <p className="text-sm">왼쪽에서 폴더를 선택하세요</p>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}
