import { create } from 'zustand';
import type { SearchMatch } from '../pages/DocumentsPage/FileViewer/PdfViewer';

interface SearchState {
  results: SearchMatch[];
  activeIdx: number;
  keyword: string;
  setSearch: (results: SearchMatch[], keyword: string) => void;
  setActiveIdx: (idx: number) => void;
  clear: () => void;
}

export const useSearchStore = create<SearchState>((set) => ({
  results: [],
  activeIdx: -1,
  keyword: '',
  setSearch: (results, keyword) => set({ results, keyword, activeIdx: results.length > 0 ? 0 : -1 }),
  setActiveIdx: (idx) => set({ activeIdx: idx }),
  clear: () => set({ results: [], activeIdx: -1, keyword: '' }),
}));
