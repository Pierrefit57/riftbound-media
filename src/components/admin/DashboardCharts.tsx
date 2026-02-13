import React from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
} from 'recharts';

interface ChartData {
    dailyVisits: { date: string; visits: number; logins: number }[];
    topArticles?: { title: string; path: string; views: number }[];
    onlineCount: number;
}

const COLORS = ['#EC4E20', '#016FB9', '#FF9505', '#EC1920', '#A6A6A6'];

export default function DashboardCharts({ data }: { data: ChartData }) {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="bg-rift-800/50 rounded-2xl border border-rift-700/50 p-5 shadow-card">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base font-display font-bold text-rift-100">Visites (30 derniers jours)</h3>
                </div>
                <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data.dailyVisits}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                            <XAxis
                                dataKey="date"
                                stroke="#9CA3AF"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(value) => new Date(value).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}
                            />
                            <YAxis stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: '0.75rem', color: '#F3F4F6' }}
                                itemStyle={{ color: '#F3F4F6' }}
                                labelStyle={{ color: '#9CA3AF', marginBottom: '0.25rem' }}
                                cursor={{ fill: '#374151', opacity: 0.4 }}
                            />
                            <Legend wrapperStyle={{ paddingTop: '10px' }} />
                            <Bar dataKey="visits" name="Vues" fill="#EC4E20" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="logins" name="Connexions" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Articles Populaires (Liste) */}
            <div className="bg-rift-800/50 rounded-2xl border border-rift-700/50 p-5 shadow-card overflow-hidden flex flex-col">
                <h3 className="text-base font-display font-bold text-rift-100 mb-4">Articles Populaires</h3>
                <div className="flex-1 overflow-y-auto space-y-2 pr-2 scrollbar-thin scrollbar-thumb-rift-700 scrollbar-track-transparent">
                    {data.topArticles && data.topArticles.length > 0 ? (
                        data.topArticles.map((article, index) => (
                            <a
                                href={article.path}
                                target="_blank"
                                key={index}
                                className="flex items-center justify-between group p-3 hover:bg-rift-900/40 rounded-xl transition-all border border-transparent hover:border-rift-700/50"
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    <span className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-lg ${index < 3 ? 'bg-accent-spirit/10 text-accent-spirit border border-accent-spirit/20' : 'bg-rift-900 text-rift-500 border border-rift-800'}`}>
                                        {index + 1}
                                    </span>
                                    <span className="text-sm text-rift-300 group-hover:text-accent-spirit truncate transition-colors font-medium">
                                        {article.title}
                                    </span>
                                </div>
                                <span className="text-xs font-mono text-rift-400 bg-rift-950/50 px-2 py-1 rounded border border-rift-800/50">
                                    {article.views}
                                </span>
                            </a>
                        ))
                    ) : (
                        <div className="flex flex-col items-center justify-center h-40 text-rift-500 text-sm italic">
                            Aucune donnée
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
