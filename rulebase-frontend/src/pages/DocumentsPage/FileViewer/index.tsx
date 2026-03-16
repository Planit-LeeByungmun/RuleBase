

import { useState, useEffect, useRef, useCallback } from 'react';
import { useFolderStore } from '../../../store/folderStore';
import { useQuery } from '@tanstack/react-query';
import { filesApi } from '../../../api/files';
import { useAuthStore } from '../../../store/authStore';
import type { FileItem } from '../../../types';
import { QAPanel } from './QAPanel';
import { PdfViewer, type PdfViewerHandle, type SearchMatch } from './PdfViewer';

export function FileViewer() {
  const { selectedFileId, setSelectedFile } = useFolderStore();
  const token = useAuthStore(s => s.token);
  const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api/v1';
  const pdfViewerRef = useRef<PdfViewerHandle>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [showSearch, setShowSearch] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchResults, setSearchResults] = useState<SearchMatch[]>([]);
  const [activeResultIdx, setActiveResultIdx] = useState(-1);
  const [searching, setSearching] = useState(false);
  const [searchedOnce, setSearchedOnce] = useState(false);

  const { data: files } = useQuery({
    queryKey: ['files', 'all'],
    queryFn: async () => {
      const res = await filesApi.getAll();
      return res.data.data as FileItem[];
    },
  });

  const file = files?.find(f => f.id === selectedFileId);

  // Determine if current file uses PdfViewer
  const isPdfViewable = file && (
    file.mime_type === 'application/pdf' ||
    ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(
      file.original_name.split('.').pop()?.toLowerCase() || ''
    ) ||
    OFFICE_MIME_TYPES.includes(file.mime_type)
  );

  // Cmd/Ctrl+F handler
  useEffect(() => {
    if (!selectedFileId || !isPdfViewable) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
        e.preventDefault();
        setShowSearch(true);
        setTimeout(() => searchInputRef.current?.focus(), 50);
      }
      if (e.key === 'Escape' && showSearch) {
        closeSearch();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedFileId, isPdfViewable, showSearch]);

  // Reset search when file changes
  useEffect(() => {
    closeSearch();
  }, [selectedFileId]);

  const closeSearch = useCallback(() => {
    setShowSearch(false);
    setSearchKeyword('');
    setSearchResults([]);
    setActiveResultIdx(-1);
    setSearching(false);
    setSearchedOnce(false);
    pdfViewerRef.current?.clearHighlight();
  }, []);

  const executeSearch = useCallback(async () => {
    if (!searchKeyword.trim() || !pdfViewerRef.current) return;
    setSearching(true);
    setSearchedOnce(true);
    const results = await pdfViewerRef.current.search(searchKeyword.trim());
    setSearchResults(results);
    setActiveResultIdx(results.length > 0 ? 0 : -1);
    if (results.length > 0) {
      pdfViewerRef.current.goToMatch(results[0]);
    }
    setSearching(false);
  }, [searchKeyword]);

  const goToResult = useCallback((idx: number) => {
    if (idx < 0 || idx >= searchResults.length) return;
    setActiveResultIdx(idx);
    pdfViewerRef.current?.goToMatch(searchResults[idx]);
  }, [searchResults]);

  const goNext = useCallback(() => {
    if (searchResults.length === 0) return;
    const next = (activeResultIdx + 1) % searchResults.length;
    goToResult(next);
  }, [activeResultIdx, searchResults, goToResult]);

  const goPrev = useCallback(() => {
    if (searchResults.length === 0) return;
    const prev = (activeResultIdx - 1 + searchResults.length) % searchResults.length;
    goToResult(prev);
  }, [activeResultIdx, searchResults, goToResult]);

  if (!selectedFileId || !file) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400 bg-gray-50">
        <div className="text-center">
          <div className="text-5xl mb-3">👆</div>
          <p className="text-sm">파일을 선택하면 여기서 열립니다</p>
        </div>
      </div>
    );
  }

  const viewUrl = `${apiBase}/files/${file.id}/view?token=${token}`;
  const previewUrl = `${apiBase}/files/${file.id}/preview?token=${token}`;
  const downloadUrl = `${apiBase}/files/${file.id}/download?token=${token}`;

  return (
    <div className="flex-1 flex overflow-hidden">
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header bar */}
        <div className="p-3 border-b flex items-center justify-between bg-white">
          <span className="text-sm font-medium text-gray-700 truncate" title={file.original_name}>{file.original_name}</span>
          <div className="flex items-center gap-2 ml-2">
            {isPdfViewable && (
              <button
                onClick={() => { setShowSearch(true); setTimeout(() => searchInputRef.current?.focus(), 50); }}
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
                title="검색 (Ctrl+F)"
              >
                🔍
              </button>
            )}
            <a href={downloadUrl} className="text-sm text-blue-600 hover:underline whitespace-nowrap" download>
              다운로드
            </a>
            <button
              onClick={() => setSelectedFile(null)}
              className="text-gray-400 hover:text-gray-600 text-lg leading-none px-1 transition-colors"
              title="닫기"
            >
              &times;
            </button>
          </div>
        </div>

        {/* Search bar */}
        {showSearch && (
          <div className="px-3 py-2 bg-yellow-50 border-b flex items-center gap-2">
            <input
              ref={searchInputRef}
              type="text"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  if (searchResults.length > 0 && searchKeyword.trim()) {
                    if (e.shiftKey) goPrev();
                    else goNext();
                  } else {
                    executeSearch();
                  }
                }
                if (e.key === 'Escape') closeSearch();
              }}
              placeholder="검색어 입력..."
              className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <button
              onClick={executeSearch}
              disabled={!searchKeyword.trim() || searching}
              className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {searching ? '...' : '검색'}
            </button>
            {searchResults.length > 0 && (
              <>
                <span className="text-xs text-gray-500 whitespace-nowrap">
                  {activeResultIdx + 1} / {searchResults.length}
                </span>
                <button onClick={goPrev} className="px-1 py-0.5 text-xs text-gray-600 hover:bg-gray-200 rounded" title="이전 (Shift+Enter)">▲</button>
                <button onClick={goNext} className="px-1 py-0.5 text-xs text-gray-600 hover:bg-gray-200 rounded" title="다음 (Enter)">▼</button>
              </>
            )}
            {searchedOnce && searchResults.length === 0 && searchKeyword && !searching && (
              <span className="text-xs text-red-400">결과 없음</span>
            )}
            <button onClick={closeSearch} className="text-gray-400 hover:text-gray-600 text-sm px-1" title="닫기">&times;</button>
          </div>
        )}

        {/* Preview area */}
        <div className="flex-1 overflow-hidden bg-gray-100">
          <FileRenderer file={file} viewUrl={viewUrl} previewUrl={previewUrl} pdfViewerRef={pdfViewerRef} />
        </div>
      </div>

      {/* Right panel: Search results + Q&A */}
      <div className="w-80 min-w-80 flex flex-col border-l border-gray-200">
        {searchResults.length > 0 && (
          <SearchResultsPanel
            results={searchResults}
            activeIdx={activeResultIdx}
            keyword={searchKeyword}
            onSelect={goToResult}
            onClose={closeSearch}
          />
        )}
        <div className="flex-1 overflow-hidden">
          <QAPanel fileId={file.id} />
        </div>
      </div>
    </div>
  );
}

const RESULTS_PER_PAGE = 10;

function SearchResultsPanel({
  results,
  activeIdx,
  keyword,
  onSelect,
  onClose,
}: {
  results: SearchMatch[];
  activeIdx: number;
  keyword: string;
  onSelect: (idx: number) => void;
  onClose: () => void;
}) {
  const [page, setPage] = useState(0);
  const totalPages = Math.ceil(results.length / RESULTS_PER_PAGE);
  const pageStart = page * RESULTS_PER_PAGE;
  const pageEnd = Math.min(pageStart + RESULTS_PER_PAGE, results.length);
  const pageResults = results.slice(pageStart, pageEnd);

  // Auto-switch page when activeIdx changes (e.g. via prev/next buttons)
  useEffect(() => {
    if (activeIdx >= 0) {
      const targetPage = Math.floor(activeIdx / RESULTS_PER_PAGE);
      if (targetPage !== page) setPage(targetPage);
    }
  }, [activeIdx]);

  function highlightKeyword(text: string, kw: string) {
    if (!kw) return text;
    const regex = new RegExp(`(${kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, i) =>
      regex.test(part)
        ? <mark key={i} className="bg-yellow-300 text-yellow-900 rounded px-0.5 font-semibold">{part}</mark>
        : <span key={i}>{part}</span>
    );
  }

  return (
    <div className="border-b border-gray-200 bg-yellow-50 flex flex-col max-h-[50%] min-h-[120px]">
      <div className="px-3 py-2 flex items-center justify-between border-b border-yellow-200 flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-gray-700">검색 결과</span>
          <span className="text-xs font-medium px-1.5 py-0.5 rounded-full bg-yellow-200 text-yellow-800">
            {results.length}건
          </span>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-sm">&times;</button>
      </div>
      <div className="flex-1 overflow-hidden">
        {pageResults.map((match, i) => {
          const globalIdx = pageStart + i;
          return (
            <div
              key={`${match.page}-${match.index}`}
              onClick={() => onSelect(globalIdx)}
              className={`px-3 py-2 cursor-pointer border-b border-yellow-100 transition-colors text-xs ${
                globalIdx === activeIdx ? 'bg-yellow-200 border-l-2 border-l-yellow-500' : 'hover:bg-yellow-100'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-blue-600">p.{match.page}</span>
                <span className="text-gray-400">#{globalIdx + 1}</span>
              </div>
              <p className="text-gray-700 leading-relaxed break-words whitespace-pre-wrap line-clamp-2">
                {highlightKeyword(match.lineText || match.context, keyword)}
              </p>
            </div>
          );
        })}
      </div>
      {totalPages > 1 && (
        <div className="px-3 py-1.5 flex items-center justify-center gap-2 border-t border-yellow-200 flex-shrink-0">
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            className="px-1.5 py-0.5 text-xs text-gray-600 hover:bg-yellow-200 rounded disabled:opacity-30 disabled:cursor-not-allowed"
          >
            ◀
          </button>
          <span className="text-xs text-gray-600">
            {page + 1} / {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="px-1.5 py-0.5 text-xs text-gray-600 hover:bg-yellow-200 rounded disabled:opacity-30 disabled:cursor-not-allowed"
          >
            ▶
          </button>
        </div>
      )}
    </div>
  );
}

const OFFICE_MIME_TYPES = [
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/x-hwp',
  'application/haansofthwp',
  'application/vnd.hancom.hwp',
];

function LoadingOverlay() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
      <div className="text-center text-gray-500">
        <div className="text-5xl mb-3 animate-pulse">⏳</div>
        <p className="text-sm">미리보기 준비 중...</p>
      </div>
    </div>
  );
}

function PreviewIframe({ src, title }: { src: string; title: string }) {
  const [loading, setLoading] = useState(true);

  return (
    <div className="relative w-full h-full">
      {loading && <LoadingOverlay />}
      <iframe
        src={src}
        className="w-full h-full border-0"
        title={title}
        onLoad={() => setLoading(false)}
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
}

function FileRenderer({
  file,
  viewUrl,
  previewUrl,
  pdfViewerRef,
}: {
  file: FileItem;
  viewUrl: string;
  previewUrl: string;
  pdfViewerRef: React.RefObject<PdfViewerHandle | null>;
}) {
  if (file.mime_type === 'application/pdf') {
    return <PdfViewer ref={pdfViewerRef} src={viewUrl} title={file.original_name} />;
  }

  if (file.mime_type.startsWith('text/')) {
    return <PreviewIframe src={viewUrl} title={file.original_name} />;
  }

  if (file.mime_type.startsWith('image/')) {
    const [loading, setLoading] = useState(true);
    return (
      <div className="relative flex items-center justify-center h-full p-4">
        {loading && <LoadingOverlay />}
        <img
          src={viewUrl}
          alt={file.original_name}
          className="max-w-full max-h-full object-contain rounded shadow"
          onLoad={() => setLoading(false)}
        />
      </div>
    );
  }

  const ext = file.original_name.split('.').pop()?.toLowerCase() || '';
  const OFFICE_EXTENSIONS = ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'];
  if (OFFICE_MIME_TYPES.includes(file.mime_type) || OFFICE_EXTENSIONS.includes(ext)) {
    return <PdfViewer ref={pdfViewerRef} src={previewUrl} title={file.original_name} />;
  }

  if (ext === 'hwp') {
    return <PreviewIframe src={previewUrl} title={file.original_name} />;
  }

  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center text-gray-500">
        <div className="text-5xl mb-3">📄</div>
        <p className="font-medium">{file.original_name}</p>
        <p className="text-sm mt-1">이 파일 형식은 미리보기를 지원하지 않습니다.</p>
        <a href={viewUrl} download className="mt-3 inline-block text-blue-600 hover:underline text-sm">
          다운로드하여 열기
        </a>
      </div>
    </div>
  );
}
