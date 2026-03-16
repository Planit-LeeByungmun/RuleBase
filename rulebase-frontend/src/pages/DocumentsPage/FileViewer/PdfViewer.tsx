import { useEffect, useRef, useState, useCallback, useImperativeHandle, forwardRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url,
).toString();

export interface SearchMatch {
  page: number;
  index: number;
  matchLen: number;
  context: string;
  lineText: string;
}

export interface PdfViewerHandle {
  search: (keyword: string) => Promise<SearchMatch[]>;
  goToMatch: (match: SearchMatch) => void;
  clearHighlight: () => void;
}

interface PageTextData {
  text: string;
  items: any[];
  charToItem: { itemIdx: number; charOffset: number }[];
}

interface Props {
  src: string;
  title: string;
}

export const PdfViewer = forwardRef<PdfViewerHandle, Props>(function PdfViewer({ src, title }, ref) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const highlightCanvasRef = useRef<HTMLCanvasElement>(null);
  const pdfRef = useRef<pdfjsLib.PDFDocumentProxy | null>(null);
  const renderTaskRef = useRef<pdfjsLib.RenderTask | null>(null);
  const pageTextsRef = useRef<PageTextData[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [scale, setScale] = useState(1);
  const [pageInput, setPageInput] = useState('1');
  const activeMatchRef = useRef<SearchMatch | null>(null);
  const textExtractedRef = useRef(false);
  const cancelRef = useRef(false);

  // Load PDF document - show first page immediately, extract text in background
  useEffect(() => {
    cancelRef.current = false;
    setLoading(true);
    pageTextsRef.current = [];
    textExtractedRef.current = false;

    pdfjsLib.getDocument(src).promise.then((pdf) => {
      if (cancelRef.current) return;
      pdfRef.current = pdf;
      setTotalPages(pdf.numPages);
      setCurrentPage(1);
      setPageInput('1');
      setLoading(false);

      extractTextsInBackground(pdf);
    }).catch((err) => {
      console.error('[PdfViewer] Failed to load PDF:', err);
      setLoading(false);
    });

    return () => {
      cancelRef.current = true;
    };
  }, [src]);

  async function extractTextsInBackground(pdf: pdfjsLib.PDFDocumentProxy) {
    const texts: PageTextData[] = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      if (cancelRef.current) return;
      try {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const items = content.items as any[];

        let text = '';
        const charToItem: { itemIdx: number; charOffset: number }[] = [];
        let lastY: number | null = null;
        let lastEndX: number | null = null;

        for (let idx = 0; idx < items.length; idx++) {
          const item = items[idx];
          if (item.str === undefined) continue;
          const y = item.transform ? item.transform[5] : null;
          const x = item.transform ? item.transform[4] : null;

          if (text.length > 0) {
            if (lastY !== null && y !== null && Math.abs(y - lastY) > 3) {
              text += '\n';
              charToItem.push({ itemIdx: -1, charOffset: 0 });
            } else if (item.hasEOL) {
              text += '\n';
              charToItem.push({ itemIdx: -1, charOffset: 0 });
            } else if (lastEndX !== null && x !== null) {
              const fontSize = item.transform ? Math.sqrt(item.transform[0] ** 2 + item.transform[1] ** 2) : 10;
              const gap = x - lastEndX;
              if (gap > fontSize * 0.3) {
                text += ' ';
                charToItem.push({ itemIdx: -1, charOffset: 0 });
              }
            }
          }

          for (let c = 0; c < item.str.length; c++) {
            charToItem.push({ itemIdx: idx, charOffset: c });
          }
          text += item.str;
          if (y !== null) lastY = y;
          if (x !== null && item.width != null) {
            lastEndX = x + item.width;
          } else {
            lastEndX = null;
          }
        }

        texts.push({ text, items, charToItem });
      } catch (err) {
        console.error(`[PdfViewer] Text extraction failed for page ${i}:`, err);
        texts.push({ text: '', items: [], charToItem: [] });
      }
    }
    if (!cancelRef.current) {
      pageTextsRef.current = texts;
      textExtractedRef.current = true;
    }
  }

  // Render current page
  const renderPage = useCallback(async (pageNum: number) => {
    const pdf = pdfRef.current;
    const canvas = canvasRef.current;
    const highlightCanvas = highlightCanvasRef.current;
    const container = containerRef.current;
    if (!pdf || !canvas || !highlightCanvas || !container) return;

    if (renderTaskRef.current) {
      renderTaskRef.current.cancel();
      renderTaskRef.current = null;
    }

    const page = await pdf.getPage(pageNum);
    const containerWidth = container.clientWidth - 32;
    const containerHeight = container.clientHeight - 32;
    const unscaledViewport = page.getViewport({ scale: 1 });

    const scaleW = containerWidth / unscaledViewport.width;
    const scaleH = containerHeight / unscaledViewport.height;
    const fitScale = Math.min(scaleW, scaleH, 2);
    setScale(fitScale);

    const dpr = window.devicePixelRatio;
    const viewport = page.getViewport({ scale: fitScale * dpr });
    const cssWidth = viewport.width / dpr;
    const cssHeight = viewport.height / dpr;

    canvas.width = viewport.width;
    canvas.height = viewport.height;
    canvas.style.width = `${cssWidth}px`;
    canvas.style.height = `${cssHeight}px`;

    highlightCanvas.width = viewport.width;
    highlightCanvas.height = viewport.height;
    highlightCanvas.style.width = `${cssWidth}px`;
    highlightCanvas.style.height = `${cssHeight}px`;

    const ctx = canvas.getContext('2d')!;
    const renderTask = page.render({ canvasContext: ctx, viewport });
    renderTaskRef.current = renderTask;

    try {
      await renderTask.promise;
    } catch {
      // cancelled
    }

    const match = activeMatchRef.current;
    if (match && match.page === pageNum) {
      drawHighlight(pageNum, match.index, match.matchLen, fitScale);
    } else {
      const hctx = highlightCanvas.getContext('2d');
      hctx?.clearRect(0, 0, highlightCanvas.width, highlightCanvas.height);
    }
  }, []);

  const drawHighlight = useCallback(async (pageNum: number, charIndex: number, matchLen: number, currentScale?: number) => {
    const pdf = pdfRef.current;
    const highlightCanvas = highlightCanvasRef.current;
    if (!pdf || !highlightCanvas) return;

    const pageData = pageTextsRef.current[pageNum - 1];
    if (!pageData) return;

    const page = await pdf.getPage(pageNum);
    const usedScale = currentScale ?? scale;
    const dpr = window.devicePixelRatio;
    const viewport = page.getViewport({ scale: usedScale * dpr });

    const hctx = highlightCanvas.getContext('2d')!;
    hctx.clearRect(0, 0, highlightCanvas.width, highlightCanvas.height);
    hctx.fillStyle = 'rgba(255, 220, 0, 0.4)';

    const charToItem = pageData.charToItem;
    const highlightedItems = new Set<number>();

    for (let ci = charIndex; ci < charIndex + matchLen && ci < charToItem.length; ci++) {
      const mapping = charToItem[ci];
      if (mapping && mapping.itemIdx >= 0) {
        highlightedItems.add(mapping.itemIdx);
      }
    }

    for (const itemIdx of highlightedItems) {
      const item = pageData.items[itemIdx];
      if (!item || !item.transform) continue;
      const tx = pdfjsLib.Util.transform(viewport.transform, item.transform);
      const x = tx[4];
      const y = tx[5];
      const fontSize = Math.sqrt(tx[0] * tx[0] + tx[1] * tx[1]);
      const width = item.width * usedScale * dpr;
      hctx.fillRect(x, y - fontSize, width, fontSize * 1.2);
    }
  }, [scale]);

  useEffect(() => {
    if (!loading && totalPages > 0) {
      renderPage(currentPage);
    }
  }, [currentPage, loading, totalPages, renderPage]);

  useEffect(() => {
    if (loading) return;
    const handleResize = () => renderPage(currentPage);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [currentPage, loading, renderPage]);

  const goToPage = (page: number) => {
    const p = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(p);
    setPageInput(String(p));
  };

  // Expose search API to parent
  useImperativeHandle(ref, () => ({
    search: async (keyword: string): Promise<SearchMatch[]> => {
      const matches: SearchMatch[] = [];
      if (!keyword) return matches;

      // If text not yet extracted, do it now on demand
      if (!textExtractedRef.current && pdfRef.current) {
        await extractTextsInBackground(pdfRef.current);
      }

      const kw = keyword.toLowerCase();
      pageTextsRef.current.forEach((pageData, pageIdx) => {
        const text = pageData.text;
        const textLower = text.toLowerCase();
        let pos = 0;
        while ((pos = textLower.indexOf(kw, pos)) !== -1) {
          const lineStart = text.lastIndexOf('\n', pos - 1) + 1;
          let lineEnd = text.indexOf('\n', pos + kw.length);
          if (lineEnd === -1) lineEnd = text.length;
          const lineText = text.slice(lineStart, lineEnd).trim();

          const contextStart = Math.max(0, pos - 30);
          const contextEnd = Math.min(text.length, pos + kw.length + 30);
          const rawContext = text.slice(contextStart, contextEnd);
          const context = (contextStart > 0 ? '...' : '') + rawContext + (contextEnd < text.length ? '...' : '');

          matches.push({ page: pageIdx + 1, index: pos, matchLen: kw.length, context, lineText });
          pos += 1;
        }
      });
      return matches;
    },
    goToMatch: (match: SearchMatch) => {
      activeMatchRef.current = match;
      if (match.page !== currentPage) {
        goToPage(match.page);
      } else {
        drawHighlight(match.page, match.index, match.matchLen);
      }
    },
    clearHighlight: () => {
      activeMatchRef.current = null;
      const hctx = highlightCanvasRef.current?.getContext('2d');
      if (hctx && highlightCanvasRef.current) {
        hctx.clearRect(0, 0, highlightCanvasRef.current.width, highlightCanvasRef.current.height);
      }
    },
  }), [currentPage, drawHighlight]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-100">
        <div className="text-center text-gray-500">
          <div className="text-5xl mb-3 animate-pulse">⏳</div>
          <p className="text-sm">미리보기 준비 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Page navigation bar */}
      <div className="flex items-center justify-center gap-2 py-2 px-3 bg-white border-b text-sm">
        <button
          onClick={() => goToPage(1)}
          disabled={currentPage <= 1}
          className="px-2 py-1 text-gray-600 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          title="첫 페이지"
        >
          ⏮
        </button>
        <button
          onClick={() => goToPage(currentPage - 1)}
          disabled={currentPage <= 1}
          className="px-2 py-1 text-gray-600 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          title="이전 페이지"
        >
          ◀
        </button>
        <div className="flex items-center gap-1">
          <input
            type="text"
            value={pageInput}
            onChange={(e) => setPageInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const num = parseInt(pageInput, 10);
                if (!isNaN(num)) goToPage(num);
              }
            }}
            onBlur={() => {
              const num = parseInt(pageInput, 10);
              if (!isNaN(num)) goToPage(num);
              else setPageInput(String(currentPage));
            }}
            className="w-12 text-center px-1 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <span className="text-gray-500">/ {totalPages}</span>
        </div>
        <button
          onClick={() => goToPage(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="px-2 py-1 text-gray-600 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          title="다음 페이지"
        >
          ▶
        </button>
        <button
          onClick={() => goToPage(totalPages)}
          disabled={currentPage >= totalPages}
          className="px-2 py-1 text-gray-600 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          title="마지막 페이지"
        >
          ⏭
        </button>
      </div>

      {/* Canvas area */}
      <div ref={containerRef} className="flex-1 overflow-auto bg-gray-200 flex justify-center items-start p-4">
        <div className="relative">
          <canvas ref={canvasRef} className="shadow-lg bg-white" />
          <canvas
            ref={highlightCanvasRef}
            className="absolute top-0 left-0 pointer-events-none"
          />
        </div>
      </div>
    </div>
  );
});
