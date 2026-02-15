import { useState, useRef, useEffect } from 'react';

export default function PDFViewer({ url, initialScale }: { url: string; initialScale?: string }) {
    const [searchText, setSearchText] = useState('');
    const [matchesCount, setMatchesCount] = useState({ current: 0, total: 0 });
    const [currentScale, setCurrentScale] = useState<number | null>(null);
    const iframeRef = useRef<HTMLIFrameElement>(null);

    const [responsiveScale, setResponsiveScale] = useState<string | null>(null);

    useEffect(() => {
        if (!initialScale) {
            const isMobile = window.innerWidth < 768;
            setResponsiveScale(isMobile ? '0.4' : '1.2');
        } else {
            setResponsiveScale(initialScale);
        }
    }, [initialScale]);

    // Communicate with iframe
    const sendMessage = (type: string, payload: any = {}) => {
        if (iframeRef.current && iframeRef.current.contentWindow) {
            iframeRef.current.contentWindow.postMessage({ type, payload }, '*');
        }
    };

    const handleSearch = (findPrevious = false, type = 'FIND') => {
        if (!searchText) return;
        sendMessage(type, { query: searchText, findPrevious });
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSearch(false, 'FIND'); // Trigger new search/next match
        }
    };

    useEffect(() => {
        const handler = (event: MessageEvent) => {
            if (!event.data || !event.data.type) return;

            if (event.data.type === 'MATCH_COUNT') {
                // Ensure we handle both 'matches' (legacy) and 'total' (fixed) just in case
                const { current, total, matches } = event.data.payload;
                setMatchesCount({
                    current: current || 0,
                    total: total || matches || 0
                });
            }
            if (event.data.type === 'NO_MATCH') {
                setMatchesCount({ current: 0, total: 0 });
            }
            if (event.data.type === 'SCALE_CHANGED') {
                setCurrentScale(event.data.payload.value);
            }
        };
        window.addEventListener('message', handler);
        return () => window.removeEventListener('message', handler);
    }, []);

    // Debounce search input? No, with native find usually explicit Enter/Button is better or immediate
    // We will do explicit search on enter and live update if user stops typing
    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchText.length >= 3) {
                handleSearch(false, 'FIND');
            } else if (searchText.length === 0) {
                // Clear search
                sendMessage('FIND', { query: '' });
                setMatchesCount({ current: 0, total: 0 });
            }
        }, 600);
        return () => clearTimeout(timer);
    }, [searchText]);

    return (
        <div className="flex flex-col gap-4">
            {/* Control Bar */}
            <div className="flex flex-col md:flex-row gap-3 items-center justify-between bg-rift-800 p-3 rounded-xl border border-rift-700 sticky top-0 z-20 shadow-lg">
                <div className="relative w-full md:w-1/2 flex items-center gap-2">
                    <div className="relative flex-1">
                        <input
                            type="text"
                            placeholder="Rechercher..."
                            className="w-full pl-9 pr-4 py-2 rounded-lg bg-rift-900 border border-rift-700 text-rift-100 placeholder-rift-500 focus:border-accent-spirit focus:ring-1 focus:ring-accent-spirit outline-none transition-all text-sm"
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                            onKeyDown={handleKeyDown}
                        />
                        <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-rift-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                    </div>

                    <div className="flex bg-rift-900 rounded-lg border border-rift-700">
                        <button
                            onClick={() => handleSearch(true, 'FIND_AGAIN')}
                            className="p-2 hover:text-accent-spirit disabled:opacity-30 disabled:hover:text-rift-500 transition-colors border-r border-rift-700"
                            title="Précédent"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
                        </button>
                        <button
                            onClick={() => handleSearch(false, 'FIND_AGAIN')}
                            className="p-2 hover:text-accent-spirit disabled:opacity-30 disabled:hover:text-rift-500 transition-colors"
                            title="Suivant"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-4 text-sm w-full md:w-auto justify-between md:justify-end">
                    {matchesCount.total > 0 && (
                        <span className="text-rift-300 font-mono text-xs whitespace-nowrap">
                            {matchesCount.current} / {matchesCount.total}
                        </span>
                    )}

                    <div className="flex items-center gap-2 bg-rift-900 rounded-lg p-1 border border-rift-700">
                        <button onClick={() => sendMessage('ZOOM', { value: 'out' })} className="p-1 hover:text-accent-spirit transition-colors"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4"></path></svg></button>
                        <span className="text-xs w-10 text-center text-rift-400 font-mono">
                            {currentScale ? `${Math.round(currentScale * 100)}%` : '--'}
                        </span>
                        <button onClick={() => sendMessage('ZOOM', { value: 'in' })} className="p-1 hover:text-accent-spirit transition-colors"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg></button>
                    </div>
                </div>
            </div>

            <div className="pdf-container bg-rift-900/50 rounded-xl border border-rift-700/50 overflow-hidden h-[800px] relative">
                <iframe
                    ref={iframeRef}
                    src={`/lib/pdfjs/viewer.html?file=${encodeURIComponent(url)}${responsiveScale ? `&zoom=${responsiveScale}` : ''}`}
                    className="w-full h-full border-none"
                    title="PDF Viewer"
                />
            </div>
        </div>
    );
}
