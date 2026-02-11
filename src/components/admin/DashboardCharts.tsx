import React from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend,
} from 'recharts';

interface ChartData {
    dailyVisits: { date: string; visits: number; logins: number }[];
    topPages: { name: string; value: number }[];
    onlineCount: number;
}

const COLORS = ['#EC4E20', '#016FB9', '#FF9505', '#EC1920', '#A6A6A6'];

export default function DashboardCharts({ data }: { data: ChartData }) {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Visites par jour + En ligne */}
            <div className="bg-rift-800/50 rounded-2xl border border-rift-700/50 p-5 shadow-card">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base font-display font-bold text-rift-100">Visites (30 derniers jours)</h3>
                    <div className="flex items-center gap-2 px-3 py-1 bg-rift-900/50 rounded-full border border-rift-700/50">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </span>
                        <span className="text-xs font-medium text-green-400">{data.onlineCount} en ligne</span>
                    </div>
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

            {/* Pages populaires (Camembert) */}
            <div className="bg-rift-800/50 rounded-2xl border border-rift-700/50 p-5 shadow-card">
                <h3 className="text-base font-display font-bold text-rift-100 mb-4">Pages Populaires</h3>
                <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={data.topPages}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {data.topPages.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="rgba(0,0,0,0)" />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: '0.75rem', color: '#F3F4F6' }}
                                itemStyle={{ color: '#F3F4F6' }}
                            />
                            <Legend
                                layout="vertical"
                                verticalAlign="middle"
                                align="right"
                                wrapperStyle={{ fontSize: '12px', color: '#9CA3AF' }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}
