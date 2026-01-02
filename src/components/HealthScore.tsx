import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Mock data to match the visual requirement
const data = [
  { date: '16 Aug', wellness_score: 30, adherence_score: 40, sleep_score: 20 },
  { date: '17 Aug', wellness_score: 25, adherence_score: 35, sleep_score: 25 },
  { date: '18 Aug', wellness_score: 35, adherence_score: 35, sleep_score: 25 },
  { date: '19 Aug', wellness_score: 45, adherence_score: 45, sleep_score: 20 },
  { date: '20 Aug', wellness_score: 20, adherence_score: 20, sleep_score: 25 },
  { date: '21 Aug', wellness_score: 35, adherence_score: 30, sleep_score: 15 },
  { date: '22 Aug', wellness_score: 25, adherence_score: 15, sleep_score: 20 },
];

export const HealthScore = () => {
  return (
    <div className="h-full bg-white/40 backdrop-blur-xl rounded-3xl p-6 border border-white/50 shadow-sm flex flex-col">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-lg font-bold text-slate-800">Emotional State</h3>
          <p className="text-xs text-slate-500 mt-1">Based on data collected during sessions</p>
        </div>
        <div className="flex space-x-2">
            <button className="px-3 py-1 rounded-full bg-white border border-slate-200 text-xs font-medium text-slate-600 shadow-sm">Week</button>
            <button className="px-3 py-1 rounded-full hover:bg-white/50 text-xs font-medium text-slate-400 cursor-pointer transition-colors">Month</button>
            <button className="px-3 py-1 rounded-full hover:bg-white/50 text-xs font-medium text-slate-400 cursor-pointer transition-colors">Year</button>
        </div>
      </div>

      <div className="flex-1 w-full min-h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{
              top: 10,
              right: 10,
              left: -30,
              bottom: 0,
            }}
            barSize={24}
          >
            <defs>
              {/* Top Segment: Diagonal Hashed Lines (Stripes) */}
              <pattern id="stripes" patternUnits="userSpaceOnUse" width="8" height="8" patternTransform="rotate(45)">
                <rect width="100%" height="100%" fill="transparent" />
                <line x1="0" y1="0" x2="0" y2="8" stroke="#60A5FA" strokeWidth="2" strokeOpacity={0.5} />
              </pattern>

              {/* Bottom Segment: Polka Dot / Grid pattern */}
              <pattern id="dots" patternUnits="userSpaceOnUse" width="6" height="6">
                <rect width="100%" height="100%" fill="transparent" />
                <circle cx="3" cy="3" r="1.5" fill="#3B82F6" fillOpacity={0.4} />
              </pattern>
              
              {/* Middle Segment: Gradient */}
              <linearGradient id="blueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#38bdf8" />
                <stop offset="100%" stopColor="#3b82f6" />
              </linearGradient>
            </defs>

            <CartesianGrid vertical={false} stroke="#e2e8f0" strokeDasharray="0" />
            
            <XAxis 
                dataKey="date" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 500 }} 
                dy={10}
            />
            <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#94a3b8', fontSize: 11 }} 
            />
            <Tooltip 
                cursor={{ fill: 'transparent' }}
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', backgroundColor: 'rgba(255, 255, 255, 0.9)' }}
            />
            
            {/* Bottom Segment: Dots */}
            <Bar 
                dataKey="sleep_score" 
                stackId="a" 
                fill="url(#dots)" 
                radius={[0, 0, 10, 10]} 
            />

            {/* Middle Segment: Gradient */}
            <Bar 
                dataKey="adherence_score" 
                stackId="a" 
                fill="url(#blueGradient)" 
                radius={[4, 4, 4, 4]} 
            />

            {/* Top Segment: Stripes */}
            <Bar 
                dataKey="wellness_score" 
                stackId="a" 
                fill="url(#stripes)" 
                radius={[10, 10, 0, 0]} 
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
