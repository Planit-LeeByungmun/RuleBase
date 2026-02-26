import { useQuery } from '@tanstack/react-query';
import { foldersApi } from '../api/folders';
import type { Folder } from '../types';

function flattenTree(folders: Folder[]): number[] {
  const ids: number[] = [];
  function recurse(nodes: Folder[]) {
    nodes.forEach(n => {
      ids.push(n.id);
      if (n.children?.length) recurse(n.children);
    });
  }
  recurse(folders);
  return ids;
}

export function useFolderTree() {
  const query = useQuery({
    queryKey: ['folders', 'tree'],
    queryFn: async () => {
      const res = await foldersApi.getTree();
      return res.data.data as Folder[];
    },
  });

  return {
    ...query,
    allFolderIds: query.data ? flattenTree(query.data) : [],
  };
}
