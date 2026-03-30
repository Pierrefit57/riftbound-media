import { useState } from 'react';
import PDFViewer from './PDFViewer';

interface Article {
    id?: string;
    title: string;
    content: string; // The PDF URL is stored here
    date?: string;
    activeClass?: string;
    textClass?: string;
    visualLink?: string;
    visualTitle?: string;
    visualImage?: string;
    visualSummary?: string;
    visualDate?: string;
    visualTags?: string[];
}

export default function ErrataViewer({ articles }: { articles: Article[] }) {
    const [selectedArticle, setSelectedArticle] = useState<Article | null>(articles.length > 0 ? articles[0] : null);
    const [isPopupOpen, setIsPopupOpen] = useState(false);

    if (!articles || articles.length === 0) {
        return (
            <div className="text-center py-12">
                <p className="text-rift-400 italic">Aucun document Errata ou FAQ disponible pour le moment.</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-8">
            {/* Document Selection Buttons */}
            <div className="flex flex-wrap justify-center gap-3">
                {articles.map((article, index) => (
                    <button
                        key={index}
                        onClick={() => setSelectedArticle(article)}
                        className={`px-4 py-2 rounded-lg font-display font-bold text-sm transition-all duration-300 border ${selectedArticle === article
                            ? (article.activeClass || 'bg-accent-sakura text-rift-950 border-accent-sakura shadow-lg shadow-accent-sakura/20')
                            : 'bg-rift-800/50 text-rift-300 border-rift-700/50 hover:bg-rift-700 hover:text-rift-100'
                            }`}
                    >
                        {article.title}
                    </button>
                ))}
            </div>

            <div className="w-full bg-rift-800/50 border border-rift-700/50 rounded-2xl p-4 md:p-8 text-center text-rift-300 animate-fade-in relative overflow-hidden">
                <div className="relative flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
                    {/* Left side: Visual Link Button */}
                    <div className="flex-1 flex justify-start z-10">
                        {selectedArticle?.visualLink && (
                            <button
                                onClick={() => setIsPopupOpen(true)}
                                className="group flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-accent-spirit/10 border border-accent-spirit/60 text-accent-spirit hover:bg-accent-spirit hover:text-white transition-all duration-300 shadow-[0_0_15px_rgba(255,102,51,0.3)] hover:shadow-[0_0_25px_rgba(255,102,51,0.5)] animate-[glow-pulse_2s_ease-in-out_infinite]"
                            >
                                <div className="w-7 h-7 rounded-lg overflow-hidden border border-accent-spirit/40 group-hover:border-white/50 transition-colors bg-rift-800 flex items-center justify-center relative">
                                    {selectedArticle.visualImage ? (
                                        <img
                                            src={selectedArticle.visualImage}
                                            alt=""
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).style.display = 'none';
                                            }}
                                        />
                                    ) : null}
                                    <svg className="w-3.5 h-3.5 absolute pointer-events-none group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                </div>
                                <span className="text-xs font-display font-bold uppercase tracking-wider pr-1">Visuels Errata</span>
                            </button>
                        )}
                    </div>

                    {/* Center: Title (absolute positioned on md+) */}
                    <h2 className={`text-2xl font-display font-bold md:absolute md:left-1/2 md:-translate-x-1/2 w-full md:w-auto text-center ${selectedArticle?.textClass || 'text-accent-sakura'}`}>
                        {selectedArticle?.title}
                    </h2>

                    {/* Right side: Update Date */}
                    <div className="flex-1 flex justify-end z-10">
                        {selectedArticle?.date && (
                            <span className="text-sm text-rift-500 italic">Mis à jour le {selectedArticle.date}</span>
                        )}
                    </div>
                </div>

                <div className="min-h-[800px] w-full bg-rift-900/50 flex flex-col justify-center rounded-xl overflow-hidden shadow-inner">
                    {selectedArticle?.content ? (
                        <PDFViewer url={selectedArticle.content} />
                    ) : (
                        <div className="flex items-center justify-center h-64 text-rift-500">
                            Document non disponible
                        </div>
                    )}
                </div>
            </div>

            {/* Visual Popup Modal */}
            {isPopupOpen && selectedArticle?.visualLink && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in">
                    <div
                        className="absolute inset-0 bg-rift-950/90 backdrop-blur-sm"
                        onClick={() => setIsPopupOpen(false)}
                    ></div>

                    <div className="relative w-full max-w-sm transform transition-all animate-slide-up-delay-2">
                        {/* Close button */}
                        <button
                            onClick={() => setIsPopupOpen(false)}
                            className="absolute -top-12 right-0 p-2 text-rift-400 hover:text-white transition-colors"
                        >
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>

                        <a
                            href={selectedArticle.visualLink}
                            className="group block bg-[#131a27] rounded-3xl overflow-hidden border border-rift-700/30 shadow-2xl shadow-black/80 hover:border-accent-spirit/50 transition-all duration-500"
                        >
                            {/* Image Section */}
                            <div className="relative h-56 overflow-hidden">
                                {selectedArticle.visualImage ? (
                                    <img
                                        src={selectedArticle.visualImage}
                                        alt={selectedArticle.visualTitle}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-rift-800 to-rift-900 flex items-center justify-center">
                                        <svg className="w-16 h-16 text-rift-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                )}
                            </div>

                            {/* Content Section */}
                            <div className="p-6 flex flex-col bg-[#131a27]">
                                {/* Tags */}
                                <div className="flex flex-wrap gap-2 mb-4">
                                    {(selectedArticle.visualTags || ['Règles', 'Errata']).map((tag) => (
                                        <span key={tag} className={`px-3 py-1 text-[10px] font-bold rounded-full border border-opacity-50 tracking-wider ${tag.toLowerCase() === 'règles' ? 'bg-[#1e293b] text-[#3b82f6] border-[#3b82f6]/30' :
                                            tag.toLowerCase() === 'errata' ? 'bg-[#2d1e1e] text-[#f59e0b] border-[#f59e0b]/30' :
                                                'bg-rift-800 text-rift-400 border-rift-700'
                                            }`}>
                                            {tag}
                                        </span>
                                    ))}
                                </div>

                                {/* Title */}
                                <h3 className="text-xl font-display font-black text-white mb-3 leading-tight tracking-wide uppercase group-hover:text-accent-spirit transition-colors duration-300">
                                    {selectedArticle.visualTitle || "LES ERRATA SPIRITFORGED"}
                                </h3>

                                {/* Summary */}
                                <p className="text-rift-300 text-sm leading-relaxed mb-6 block">
                                    {selectedArticle.visualSummary || "Un résumé rapide des derniers Erratas pour Origins et Spiritforged."}
                                </p>

                                {/* Date */}
                                <div className="mt-auto flex items-center justify-between border-t border-rift-800/50 pt-4">
                                    <span className="text-accent-spirit text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                                        Lire l'article
                                        <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                        </svg>
                                    </span>
                                    <span className="text-xs text-rift-500 font-medium">
                                        {selectedArticle.visualDate || "12 février 2026"}
                                    </span>
                                </div>
                            </div>
                        </a>
                    </div>
                </div>
            )}
        </div>
    );
}
