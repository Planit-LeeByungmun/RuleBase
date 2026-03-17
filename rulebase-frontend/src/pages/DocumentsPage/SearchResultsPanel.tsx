import { useEffect, useRef } from 'react';
import { useSearchStore } from '../../store/searchStore';
import type { PdfViewerHandle } from './FileViewer/PdfViewer';

interface Props {
  pdfViewerRef: React.RefObject<PdfViewerHandle | null>;
}

export function SearchResultsPanel({ pdfViewerRef }: Props) {
  const { results, activeIdx, keyword, setActiveIdx, clear } = useSearchStore();
  const activeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: 'nearest' });
  }, [activeIdx]);

  if (results.length === 0) return null;

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

  const handleSelect = (idx: number) => {
    setActiveIdx(idx);
    pdfViewerRef.current?.goToMatch(results[idx]);
  };

  return (
    <div className="border-t border-gray-200 bg-yellow-50 flex flex-col flex-1 min-h-0 overflow-hidden">
      <div className="px-3 py-2 flex items-center justify-between border-b border-yellow-200 flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-gray-700">검색 결과</span>
          <span className="text-xs font-medium px-1.5 py-0.5 rounded-full bg-yellow-200 text-yellow-800">
            {results.length}건
          </span>
        </div>
        <button onClick={clear} className="text-gray-400 hover:text-gray-600 text-sm">&times;</button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {results.map((match, idx) => (
          <div
            key={`${match.page}-${match.index}`}
            ref={idx === activeIdx ? activeRef : undefined}
            onClick={() => handleSelect(idx)}
            className={`px-3 py-2 cursor-pointer border-b border-yellow-100 transition-colors text-xs ${
              idx === activeIdx ? 'bg-yellow-200 border-l-2 border-l-yellow-500' : 'hover:bg-yellow-100'
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold text-blue-600">p.{match.page}</span>
              <span className="text-gray-400">#{idx + 1}</span>
            </div>
            <p className="text-gray-700 leading-relaxed break-words whitespace-pre-wrap line-clamp-2">
              {highlightKeyword(match.lineText || match.context, keyword)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
