'use client';

/**
 * Client-side authentication utilities
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://possimon.onrender.com';

/**
 * Redirects the user to OAuth login providers
 */
export const loginWithProvider = (provider: 'google' | 'line') => {
  if (provider === 'google') {
    window.location.href = `${API_BASE_URL}/api/auth/google?source=web`;
  } else if (provider === 'line') {
    window.location.href = `${API_BASE_URL}/api/auth/line?source=web`;
  }
};
