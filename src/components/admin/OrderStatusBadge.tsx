'use client';

import React from 'react';
import { Clock, CheckCircle, Truck, PackageCheck, XCircle, Ban, CreditCard } from 'lucide-react';

type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'payment_rejected' | 'cancelled' | string;

const statusConfig: Record<string, {
  label: string;
  icon: React.ElementType;
  className: string;
  dotColor: string;
  pulse?: boolean;
}> = {
  pending: {
    label: 'รอดำเนินการ',
    icon: Clock,
    className: 'badge-pending',
    dotColor: '#f59e0b',
    pulse: true,
  },
  confirmed: {
    label: 'ยืนยันแล้ว',
    icon: CheckCircle,
    className: 'badge-confirmed',
    dotColor: '#3b82f6',
    pulse: false,
  },
  shipped: {
    label: 'จัดส่งแล้ว',
    icon: Truck,
    className: 'badge-shipped',
    dotColor: '#a855f7',
    pulse: false,
  },
  delivered: {
    label: 'สำเร็จ',
    icon: PackageCheck,
    className: 'badge-delivered',
    dotColor: '#10b981',
    pulse: false,
  },
  payment_rejected: {
    label: 'ปฏิเสธการชำระ',
    icon: XCircle,
    className: 'badge-rejected',
    dotColor: '#ef4444',
    pulse: false,
  },
  payment_pending: {
    label: 'รอยืนยันสลิป',
    icon: CreditCard,
    className: 'badge-pending',
    dotColor: '#f59e0b',
    pulse: true,
  },
  cancelled: {
    label: 'ยกเลิก',
    icon: Ban,
    className: 'badge-cancelled',
    dotColor: '#71717a',
    pulse: false,
  },
};

const fallback = {
  label: 'ไม่ทราบสถานะ',
  icon: Clock,
  className: 'badge-cancelled',
  dotColor: '#71717a',
  pulse: false,
};

interface OrderStatusBadgeProps {
  status: OrderStatus;
  size?: 'sm' | 'md';
}

export default function OrderStatusBadge({ status, size = 'md' }: OrderStatusBadgeProps) {
  const cfg = statusConfig[status] ?? fallback;
  const Icon = cfg.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-bold rounded-full whitespace-nowrap ${cfg.className} ${
        size === 'sm' ? 'text-[9px] px-2 py-0.5' : 'text-[10px] px-2.5 py-1'
      }`}
    >
      <span className="relative flex items-center justify-center shrink-0" style={{ width: size === 'sm' ? 6 : 7, height: size === 'sm' ? 6 : 7 }}>
        {cfg.pulse && (
          <span
            className="absolute inset-0 rounded-full animate-ping"
            style={{ background: cfg.dotColor, opacity: 0.5 }}
          />
        )}
        <span
          className="relative rounded-full block"
          style={{ width: size === 'sm' ? 5 : 6, height: size === 'sm' ? 5 : 6, background: cfg.dotColor }}
        />
      </span>

      <Icon className={size === 'sm' ? 'w-2.5 h-2.5' : 'w-3 h-3'} />
      {cfg.label}
    </span>
  );
}
