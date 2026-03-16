

import type { Folder } from '../../../types';
import { useFolderStore } from '../../../store/folderStore';

interface Props {
  folder: Folder;
  fileCountMap: Map<number, number>;
}

export function FolderTreeNode({ folder, fileCountMap }: Props) {
  const { selectedFolderId, expandedFolderIds, setSelectedFolder, toggleFolder } = useFolderStore();
  const isExpanded = expandedFolderIds.has(folder.id);
  const isSelected = selectedFolderId === folder.id;
  const hasChildren = folder.children && folder.children.length > 0;

  return (
    <div>
      <div
        className={`flex items-center gap-1 py-1.5 px-2 rounded cursor-pointer select-none transition-colors ${
          isSelected ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100 text-gray-700'
        }`}
        onClick={() => {
          setSelectedFolder(folder.id);
          if (hasChildren) toggleFolder(folder.id);
        }}
      >
        {hasChildren ? (
          <span className="text-xs text-gray-400 w-4">{isExpanded ? '▾' : '▸'}</span>
        ) : (
          <span className="w-4" />
        )}
        <span className="text-yellow-500 text-sm">📁</span>
        <span className="text-sm truncate">{folder.name}</span>
        {(fileCountMap.get(folder.id) ?? 0) > 0 && (
          <span className="text-xs text-gray-400 ml-1">({fileCountMap.get(folder.id)})</span>
        )}
      </div>
      {isExpanded && hasChildren && (
        <div className="ml-4 border-l border-gray-200">
          {folder.children.map(child => (
            <FolderTreeNode key={child.id} folder={child} fileCountMap={fileCountMap} />
          ))}
        </div>
      )}
    </div>
  );
}
