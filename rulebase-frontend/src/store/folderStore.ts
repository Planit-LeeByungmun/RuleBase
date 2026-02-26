import { create } from 'zustand';

interface FolderStore {
  selectedFolderId: number | null;
  selectedFileId: number | null;
  expandedFolderIds: Set<number>;
  setSelectedFolder: (id: number | null) => void;
  setSelectedFile: (id: number | null) => void;
  toggleFolder: (id: number) => void;
  expandAll: (allIds: number[]) => void;
  collapseAll: () => void;
}

export const useFolderStore = create<FolderStore>(set => ({
  selectedFolderId: null,
  selectedFileId: null,
  expandedFolderIds: new Set(),
  setSelectedFolder: (id) => set({ selectedFolderId: id, selectedFileId: null }),
  setSelectedFile: (id) => set({ selectedFileId: id }),
  toggleFolder: (id) =>
    set(state => {
      const next = new Set(state.expandedFolderIds);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return { expandedFolderIds: next };
    }),
  expandAll: (allIds) => set({ expandedFolderIds: new Set(allIds) }),
  collapseAll: () => set({ expandedFolderIds: new Set() }),
}));
