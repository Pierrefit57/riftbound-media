import React from 'react';

interface StatCardProps {
    title: string;
    value: string | number;
    icon?: React.ReactNode;
    trend?: string;
    trendUp?: boolean;
    color?: 'spirit' | 'forge' | 'sakura' | 'blue';
}

export default function StatCard({ title, value, icon, trend, trendUp, color = 'spirit' }: StatCardProps) {

    const colorClasses = {
        spirit: 'text-accent-spirit',
        forge: 'text-accent-forge',
        sakura: 'text-accent-sakura',
        blue: 'text-blue-400',
    };

    const activeColor = colorClasses[color] || colorClasses.spirit;

    return (
        <div className="bg-rift-800/50 rounded-2xl border border-rift-700/50 p-5 shadow-card hover:border-rift-600 transition-colors relative overflow-hidden group">
            <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity ${activeColor}`}>
                {icon}
            </div>

            <div className="flex justify-between items-start mb-2 relative z-10">
                <h3 className="text-sm font-bold text-rift-400 uppercase tracking-wider font-display">{title}</h3>
            </div>

            <div className="flex items-end gap-3 relative z-10">
                <span className="text-3xl font-bold text-rift-50 font-display tracking-tight">{value}</span>
                {trend && (
                    <span className={`text-xs font-bold mb-1.5 px-1.5 py-0.5 rounded ${trendUp ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                        {trend}
                    </span>
                )}
            </div>
        </div>
    );
}
