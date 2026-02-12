import { useState } from 'react';
import PDFViewer from './PDFViewer';

interface Article {
    id?: string;
    title: string;
    content: string; // The PDF URL is stored here
    date?: string;
    activeClass?: string;
    textClass?: string;
}

export default function ErrataViewer({ articles }: { articles: Article[] }) {
    const [selectedArticle, setSelectedArticle] = useState<Article | null>(articles.length > 0 ? articles[0] : null);

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

            {/* Content Area */}
            <div className="bg-rift-800/50 border border-rift-700/50 rounded-2xl p-4 md:p-8 text-center text-rift-300 animate-fade-in">
                <div className="relative flex flex-col md:flex-row items-center justify-center md:justify-end gap-2 mb-6">
                    <h2 className={`text-2xl font-display font-bold md:absolute md:left-1/2 md:-translate-x-1/2 w-full md:w-auto text-center ${selectedArticle?.textClass || 'text-accent-sakura'}`}>
                        {selectedArticle?.title}
                    </h2>
                    {selectedArticle?.date && (
                        <span className="text-sm text-rift-500 italic relative z-10">Mis à jour le {selectedArticle.date}</span>
                    )}
                </div>

                <div className="min-h-[600px] w-full bg-rift-900/50 flex flex-col justify-center rounded-xl overflow-hidden">
                    {selectedArticle?.content ? (
                        <PDFViewer url={selectedArticle.content} initialScale="1.0" />
                    ) : (
                        <div className="flex items-center justify-center h-64 text-rift-500">
                            Document non disponible
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
