import React from 'react';

interface CartoonBottleIconProps {
  size?: number | string;
  className?: string;
  style?: React.CSSProperties;
}

export default function CartoonBottleIcon({
  size = 24,
  className = '',
  style = {},
}: CartoonBottleIconProps) {
  const numSize = typeof size === 'number' ? `${size}px` : size;
  return (
    <img
      src="/bottle-ai.jpg"
      alt="Bottle AI"
      className={`object-contain inline-block shrink-0 ${className}`}
      style={{ width: numSize, height: numSize, objectFit: 'contain', ...style }}
    />
  );
}
