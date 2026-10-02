'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';

interface AdminPageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  iconColor?: string;
  action?: React.ReactNode;
}

export default function AdminPageHeader({
  title,
  subtitle,
  icon: Icon,
  iconColor = '#22e5ff',
  action,
}: AdminPageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="min-w-0">
        <div className="flex items-center gap-2.5 mb-0.5">
          <div
            className="w-1 h-5 rounded-full shrink-0 hidden sm:block"
            style={{ background: 'linear-gradient(to bottom, #22e5ff, #00c4b4)', boxShadow: '0 0 10px rgba(0,212,255,0.55)' }}
          />
          <h2 className="admin-page-title flex items-center gap-2">
            {Icon && <Icon className="w-5 h-5 shrink-0" style={{ color: iconColor }} />}
            {title}
          </h2>
        </div>
        {subtitle && <p className="admin-page-subtitle sm:pl-3.5">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
