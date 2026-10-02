import React from 'react';
import { ApiStatusBanner } from '@/components/admin/ApiStatusBanner';

export default function ProjectbottleClub1Layout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <div style={{ padding: '20px 20px 0 20px', maxWidth: 1500 }}>
        <ApiStatusBanner />
      </div>
      {children}
    </div>
  );
}
