'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { LucideIcon, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

export type KPIColorScheme = 'cyan' | 'purple' | 'amber' | 'teal' | 'pink' | 'green' | 'blue';

interface KPICardProps {
  title: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'neutral';
  icon: LucideIcon;
  sparkline?: number[];
  colorScheme?: KPIColorScheme;
}

function useCountUp(target: number, duration = 900) {
  const [current, setCurrent] = useState(0);
  const rafRef = useRef<number | null>(null);
  useEffect(() => {
    if (isNaN(target)) { setCurrent(target); return; }
    const start = performance.now();
    const animate = (now: number) => {
      const elapsed  = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased    = 1 - Math.pow(1 - progress, 3);
      setCurrent(Math.round(eased * target));
      if (progress < 1) rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [target, duration]);
  return current;
}

const colorMap: Record<KPIColorScheme, {
  primary: string; glow: string; bg: string; border: string; borderTop: string; borderHover: string;
  text: string; textMuted: string; iconBg: string; sparkColor: string;
  topGrad: string; badgeBg: string; badgeBorder: string;
}> = {
  cyan: {
    primary: '#22e5ff', glow: 'rgba(0,212,255,0.24)', bg: 'rgba(0,212,255,0.08)',
    border: 'rgba(0,212,255,0.22)', borderTop: 'rgba(0,212,255,0.35)', borderHover: 'rgba(0,212,255,0.48)',
    text: '#22e5ff', textMuted: 'rgba(0,212,255,0.55)',
    iconBg: 'rgba(0,212,255,0.12)', sparkColor: '#22e5ff',
    topGrad: 'linear-gradient(to right, transparent, #22e5ff90, transparent)',
    badgeBg: 'rgba(0,212,255,0.12)', badgeBorder: 'rgba(0,212,255,0.32)',
  },
  purple: {
    primary: '#c084fc', glow: 'rgba(168,85,247,0.24)', bg: 'rgba(168,85,247,0.08)',
    border: 'rgba(168,85,247,0.22)', borderTop: 'rgba(168,85,247,0.35)', borderHover: 'rgba(168,85,247,0.48)',
    text: '#c084fc', textMuted: 'rgba(168,85,247,0.55)',
    iconBg: 'rgba(168,85,247,0.12)', sparkColor: '#c084fc',
    topGrad: 'linear-gradient(to right, transparent, #c084fc90, transparent)',
    badgeBg: 'rgba(168,85,247,0.12)', badgeBorder: 'rgba(168,85,247,0.32)',
  },
  amber: {
    primary: '#fbbf24', glow: 'rgba(245,158,11,0.24)', bg: 'rgba(245,158,11,0.08)',
    border: 'rgba(245,158,11,0.22)', borderTop: 'rgba(245,158,11,0.35)', borderHover: 'rgba(245,158,11,0.48)',
    text: '#fbbf24', textMuted: 'rgba(245,158,11,0.55)',
    iconBg: 'rgba(245,158,11,0.12)', sparkColor: '#fbbf24',
    topGrad: 'linear-gradient(to right, transparent, #fbbf2490, transparent)',
    badgeBg: 'rgba(245,158,11,0.12)', badgeBorder: 'rgba(245,158,11,0.32)',
  },
  teal: {
    primary: '#2dd4bf', glow: 'rgba(0,196,180,0.24)', bg: 'rgba(0,196,180,0.08)',
    border: 'rgba(0,196,180,0.22)', borderTop: 'rgba(0,196,180,0.35)', borderHover: 'rgba(0,196,180,0.48)',
    text: '#2dd4bf', textMuted: 'rgba(0,196,180,0.55)',
    iconBg: 'rgba(0,196,180,0.12)', sparkColor: '#2dd4bf',
    topGrad: 'linear-gradient(to right, transparent, #2dd4bf90, transparent)',
    badgeBg: 'rgba(0,196,180,0.12)', badgeBorder: 'rgba(0,196,180,0.32)',
  },
  pink: {
    primary: '#e879f9', glow: 'rgba(217,70,239,0.24)', bg: 'rgba(217,70,239,0.08)',
    border: 'rgba(217,70,239,0.22)', borderTop: 'rgba(217,70,239,0.35)', borderHover: 'rgba(217,70,239,0.48)',
    text: '#e879f9', textMuted: 'rgba(217,70,239,0.55)',
    iconBg: 'rgba(217,70,239,0.12)', sparkColor: '#e879f9',
    topGrad: 'linear-gradient(to right, transparent, #e879f990, transparent)',
    badgeBg: 'rgba(217,70,239,0.12)', badgeBorder: 'rgba(217,70,239,0.32)',
  },
  green: {
    primary: '#34d399', glow: 'rgba(16,185,129,0.22)', bg: 'rgba(16,185,129,0.08)',
    border: 'rgba(16,185,129,0.22)', borderTop: 'rgba(16,185,129,0.35)', borderHover: 'rgba(16,185,129,0.48)',
    text: '#34d399', textMuted: 'rgba(16,185,129,0.55)',
    iconBg: 'rgba(16,185,129,0.12)', sparkColor: '#34d399',
    topGrad: 'linear-gradient(to right, transparent, #34d39990, transparent)',
    badgeBg: 'rgba(16,185,129,0.12)', badgeBorder: 'rgba(16,185,129,0.32)',
  },
  blue: {
    primary: '#7aacff', glow: 'rgba(59,130,246,0.24)', bg: 'rgba(59,130,246,0.08)',
    border: 'rgba(59,130,246,0.22)', borderTop: 'rgba(59,130,246,0.35)', borderHover: 'rgba(59,130,246,0.48)',
    text: '#7aacff', textMuted: 'rgba(59,130,246,0.55)',
    iconBg: 'rgba(59,130,246,0.12)', sparkColor: '#7aacff',
    topGrad: 'linear-gradient(to right, transparent, #7aacff90, transparent)',
    badgeBg: 'rgba(59,130,246,0.12)', badgeBorder: 'rgba(59,130,246,0.32)',
  },
};

const trendConfig = {
  up:      { icon: ArrowUpRight,   label: '+' },
  down:    { icon: ArrowDownRight, label: '-' },
  neutral: { icon: Minus,          label: '' },
};

function Sparkline({ data, color }: { data: number[]; color: string }) {
  if (!data || data.length < 2) return null;
  const max   = Math.max(...data);
  const min   = Math.min(...data);
  const range = max - min || 1;
  const W = 80, H = 32, pad = 2;
  const pts = data.map((v, i) => {
    const x = pad + (i / (data.length - 1)) * (W - pad * 2);
    const y = H - pad - ((v - min) / range) * (H - pad * 2);
    return `${x},${y}`;
  }).join(' ');
  const lastPt  = pts.split(' ')[pts.split(' ').length - 1];
  const lastY   = parseFloat(lastPt.split(',')[1]);
  const lastX   = parseFloat(lastPt.split(',')[0]);
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      <defs>
        <linearGradient id={`spark-fill-${color.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.50} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
        <filter id={`glow-${color.replace('#','')}`}>
          <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      <polygon
        points={`${pad},${H} ${pts} ${W - pad},${H}`}
        fill={`url(#spark-fill-${color.replace('#','')})`}
      />
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter={`url(#glow-${color.replace('#','')})`}
      />
      <circle cx={lastX} cy={lastY} r="3.5" fill={color} opacity={0.95} />
      <circle cx={lastX} cy={lastY} r="7" fill={color} opacity={0.18} />
    </svg>
  );
}

export default function KPICard({
  title, value, change, trend, icon: Icon, sparkline, colorScheme = 'cyan'
}: KPICardProps) {
  const c         = colorMap[colorScheme];
  const TrendIcon = trendConfig[trend].icon;

  const strVal   = String(value ?? '');
  const rawNum   = parseFloat(strVal.replace(/[^0-9.]/g, ''));
  const prefix   = strVal.match(/^[^\d]*/)?.[0] ?? '';
  const suffix   = strVal.match(/[^\d.]*$/)?.[0] ?? '';
  const isNumeric = !isNaN(rawNum);

  const animatedNum = useCountUp(isNumeric ? rawNum : 0);
  const displayValue = isNumeric
    ? `${prefix}${animatedNum.toLocaleString('th-TH')}${suffix}`
    : value;

  return (
    <motion.div
      className="admin-kpi-touch rounded-2xl p-4 sm:p-5 relative overflow-hidden group cursor-default"
      style={{
        background: `linear-gradient(145deg, ${c.bg} 0%, rgba(10,14,26,0.92) 100%)`,
        border: `1px solid ${c.border}`,
        borderTop: `1px solid ${c.borderTop}`,
        boxShadow: `0 0 40px ${c.glow}, 0 8px 28px rgba(0,0,0,0.50), 0 1px 0 ${c.borderTop} inset`,
      }}
      whileHover={{
        borderColor: c.borderHover,
        boxShadow: `0 0 60px ${c.glow}, 0 12px 40px rgba(0,0,0,0.60)`,
        y: -3,
        transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] }
      }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
    >
      {/* Top gradient bar */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px] rounded-t-2xl"
        style={{ background: c.topGrad }}
      />
      {/* Background glow orb */}
      <div
        className="absolute top-0 right-0 w-40 h-40 rounded-full pointer-events-none"
        style={{ background: c.glow, filter: 'blur(56px)', transform: 'translate(40%,-40%)' }}
      />

      {/* Header: title + icon */}
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <p className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-[0.15em]" style={{ color: '#1e2d48' }}>
          {title}
        </p>
        <motion.div
          className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: c.iconBg, border: `1px solid ${c.border}`, boxShadow: `0 0 14px ${c.glow}` }}
          whileHover={{ scale: 1.12 }}
          transition={{ type: 'spring', stiffness: 400, damping: 17 }}
        >
          <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" style={{ color: c.primary }} />
        </motion.div>
      </div>

      {/* Value + sparkline */}
      <div className="flex items-end justify-between gap-2">
        <div>
          <p className="animate-count-up" style={{
            fontFamily: "'Outfit', sans-serif",
            fontSize: 'clamp(1.5rem, 3vw, 2.2rem)',
            fontWeight: 900,
            letterSpacing: '-0.04em',
            lineHeight: 1,
            color: c.primary,
            textShadow: `0 0 24px ${c.glow}`,
          }}>
            {displayValue}
          </p>
          <div className="flex items-center gap-1.5 mt-2 sm:mt-2.5">
            <span
              className="inline-flex items-center gap-0.5 text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded-md"
              style={{ background: c.badgeBg, border: `1px solid ${c.badgeBorder}`, color: c.text }}
            >
              <TrendIcon className="w-3 h-3" />{change}
            </span>
            <span className="text-[8px] sm:text-[9px] font-semibold uppercase tracking-wide hidden sm:inline" style={{ color: '#1a2840' }}>
              vs เดือนก่อน
            </span>
          </div>
        </div>
        {sparkline && (
          <div className="shrink-0 opacity-70 group-hover:opacity-100 transition-opacity duration-300">
            <Sparkline data={sparkline} color={c.sparkColor} />
          </div>
        )}
      </div>

      {/* Bottom progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-[2px] overflow-hidden rounded-b-2xl">
        <motion.div
          className="h-full"
          initial={{ width: 0 }}
          animate={{ width: trend === 'up' ? '75%' : trend === 'down' ? '35%' : '55%' }}
          transition={{ duration: 1, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          style={{ background: `linear-gradient(to right, ${c.sparkColor}30, ${c.sparkColor})` }}
        />
      </div>
    </motion.div>
  );
}
