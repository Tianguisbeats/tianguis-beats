"use client";

import { ResponsiveContainer, AreaChart, XAxis, YAxis, CartesianGrid, Tooltip, Area } from 'recharts';

interface StatsAreaChartProps {
    data: any[];
    viewMode: 'both' | 'sales' | 'plays';
}

export default function StatsAreaChart({ data, viewMode }: StatsAreaChartProps) {
    return (
        <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorPlays" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" />
                <XAxis dataKey="date" fontSize={9} tickLine={false} axisLine={false} tick={{ fill: '#888888', fontWeight: 'bold' }} dy={10} />
                <YAxis fontSize={9} tickLine={false} axisLine={false} tick={{ fill: '#888888', fontWeight: 'bold' }} tickFormatter={(value) => `$${value}`} />
                <Tooltip
                    contentStyle={{ backgroundColor: '#050508', border: '1px solid #333', borderRadius: '1rem', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', color: '#fff' }}
                    itemStyle={{ color: '#ffffff' }}
                />
                {(viewMode === 'both' || viewMode === 'sales') && (
                    <Area type="monotone" dataKey="ventas" name="Ventas ($)" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
                )}
                {viewMode === 'both' && (
                    <Area type="monotone" dataKey="reproducciones" name="Actividad" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorPlays)" />
                )}
            </AreaChart>
        </ResponsiveContainer>
    );
}
