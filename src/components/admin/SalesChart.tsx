'use client';

import React, { useEffect, useState, useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface SalesChartProps {
  data: {
    date: string;
    amount: number;
  }[];
}

const TABS = [
  { label: '7 วัน', days: 7 },
  { label: '30 วัน', days: 30 },
  { label: '90 วัน', days: 90 },
];

const formatYAxis = (value: number) => {
  if (value >= 1000000) return `฿${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `฿${(value / 1000).toFixed(0)}k`;
  return `฿${value}`;
};

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const val: number = payload[0].value;
    return (
      <div
        className="shadow-2xl"
        style={{
          background: 'rgba(19, 25, 41, 0.97)',
          border: '1px solid rgba(196,30,58,0.3)',
          borderRadius: '12px',
          padding: '10px 14px',
          backdropFilter: 'blur(16px)',
          minWidth: '140px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 0 16px rgba(196,30,58,0.1)',
        }}
      >
        <p className="text-[9px] font-extrabold uppercase tracking-widest mb-1.5" style={{ color: '#475569' }}>
          {payload[0].payload.date}
        </p>
        <p className="text-lg font-black leading-none" style={{ color: '#f1f5f9' }}>
          ฿{val.toLocaleString('th-TH', { minimumFractionDigits: 0 })}
        </p>
        <div className="mt-1.5 flex items-center gap-1">
          <TrendingUp className="w-3 h-3" style={{ color: '#10b981' }} />
          <span className="text-[10px] font-semibold" style={{ color: '#34d399' }}>ยอดขายวันนี้</span>
        </div>
      </div>
    );
  }
  return null;
};

export default function SalesChart({ data }: SalesChartProps) {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState(1);

  useEffect(() => { setMounted(true); }, []);

  const filteredData = useMemo(() => {
    const days = TABS[activeTab].days;
    return data.slice(-days);
  }, [data, activeTab]);

  const average = useMemo(() => {
    if (filteredData.length === 0) return 0;
    return filteredData.reduce((sum, d) => sum + d.amount, 0) / filteredData.length;
  }, [filteredData]);

  const total = useMemo(() => filteredData.reduce((s, d) => s + d.amount, 0), [filteredData]);
  const maxDay = useMemo(() => filteredData.reduce((a, b) => a.amount > b.amount ? a : b, filteredData[0] ?? { amount: 0, date: '' }), [filteredData]);

  const mid = Math.floor(filteredData.length / 2);
  const firstHalf = filteredData.slice(0, mid).reduce((s, d) => s + d.amount, 0);
  const secondHalf = filteredData.slice(mid).reduce((s, d) => s + d.amount, 0);
  const isTrendUp = secondHalf >= firstHalf;

  if (!mounted) {
    return (
      <div
        className="rounded-2xl p-6 flex items-center justify-center"
        style={{
          height: '340px',
          background: 'rgba(19, 25, 41, 0.92)',
          border: '1px solid rgba(255,255,255,0.07)',
        }}
      >
        <div className="text-sm font-semibold animate-pulse" style={{ color: '#475569' }}>กำลังโหลดกราฟ...</div>
      </div>
    );
  }

  return (
    <div
      className="rounded-2xl p-6 relative overflow-hidden group"
      style={{
        minHeight: '340px',
        background: 'rgba(19, 25, 41, 0.92)',
        border: '1px solid rgba(255,255,255,0.07)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
      }}
    >
      <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: 'linear-gradient(to right, transparent, rgba(196,30,58,0.6) 40%, rgba(245,158,11,0.4) 60%, transparent)' }} />

      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-5">
        <div>
          <h3 className="text-sm font-black font-serif" style={{ color: '#f1f5f9' }}>สถิติยอดขาย</h3>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-lg font-black" style={{ color: '#f1f5f9' }}>
              ฿{total.toLocaleString('th-TH')}
            </p>
            <span
              className="inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-md"
              style={{
                background: isTrendUp ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
                border: `1px solid ${isTrendUp ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
                color: isTrendUp ? '#34d399' : '#f87171',
              }}
            >
              {isTrendUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {isTrendUp ? '+' : '-'}{Math.abs(((secondHalf - firstHalf) / (firstHalf || 1)) * 100).toFixed(1)}%
            </span>
          </div>
          <p className="text-[10px] font-semibold mt-0.5 uppercase tracking-wider" style={{ color: '#475569' }}>
            รวม {TABS[activeTab].label}ที่ผ่านมา
          </p>
        </div>

        <div className="admin-tab-group shrink-0">
          {TABS.map((tab, idx) => (
            <button
              key={tab.days}
              onClick={() => setActiveTab(idx)}
              className={`admin-tab ${activeTab === idx ? 'admin-tab-active' : ''}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="rounded-xl px-3 py-2.5" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <p className="text-[9px] font-bold uppercase tracking-wider" style={{ color: '#475569' }}>ค่าเฉลี่ย/วัน</p>
          <p className="text-sm font-black mt-0.5" style={{ color: '#e2e8f0' }}>฿{average.toLocaleString('th-TH', { maximumFractionDigits: 0 })}</p>
        </div>
        <div className="rounded-xl px-3 py-2.5" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <p className="text-[9px] font-bold uppercase tracking-wider" style={{ color: '#475569' }}>วันยอดสูงสุด</p>
          <p className="text-sm font-black mt-0.5" style={{ color: '#e2e8f0' }}>{maxDay?.date || '-'}</p>
        </div>
      </div>

      <div style={{ height: '180px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={filteredData} margin={{ top: 5, right: 4, left: -22, bottom: 0 }}>
            <defs>
              <linearGradient id="salesGradDark" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#c41e3a" stopOpacity={0.4} />
                <stop offset="75%" stopColor="#c41e3a" stopOpacity={0.05} />
                <stop offset="100%" stopColor="#c41e3a" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="salesLineDark" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#f87171" />
                <stop offset="50%" stopColor="#c41e3a" />
                <stop offset="100%" stopColor="#9b1c1c" />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="2 4" stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis
              dataKey="date"
              stroke="transparent"
              tick={{ fill: '#334155', fontSize: 9, fontWeight: 600 }}
              tickLine={false}
              axisLine={false}
              dy={8}
              interval={filteredData.length > 20 ? Math.floor(filteredData.length / 7) : 'preserveStartEnd'}
            />
            <YAxis
              stroke="transparent"
              tick={{ fill: '#334155', fontSize: 9, fontWeight: 600 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={formatYAxis}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(196,30,58,0.3)', strokeWidth: 1, strokeDasharray: '4 2' }} />
            {average > 0 && (
              <ReferenceLine
                y={average}
                stroke="rgba(245,158,11,0.2)"
                strokeDasharray="4 4"
                label={{ value: 'avg', fill: '#475569', fontSize: 8, position: 'right' }}
              />
            )}
            <Area
              type="monotone"
              dataKey="amount"
              stroke="url(#salesLineDark)"
              strokeWidth={2}
              fill="url(#salesGradDark)"
              dot={false}
              activeDot={{ r: 4, fill: '#c41e3a', stroke: 'rgba(196,30,58,0.5)', strokeWidth: 4 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
