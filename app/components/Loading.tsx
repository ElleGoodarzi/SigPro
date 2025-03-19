'use client';

import React from 'react';

interface LoadingProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  fullHeight?: boolean;
  overlay?: boolean;
}

export default function Loading({
  message = 'Loading...',
  size = 'lg',
  fullHeight = true,
  overlay = false
}: LoadingProps) {
  const containerClasses = `flex items-center justify-center ${fullHeight ? 'h-full' : 'h-24'} ${overlay ? 'absolute inset-0 bg-opacity-75 bg-base-300 z-10' : 'bg-base-300'}`;
  
  const spinnerSizeClass = {
    sm: 'loading-sm',
    md: 'loading-md',
    lg: 'loading-lg'
  }[size];

  return (
    <div className={containerClasses} role="status" aria-live="polite">
      <div className="flex flex-col items-center">
        <div className={`loading loading-spinner ${spinnerSizeClass} text-primary`}></div>
        {message && <p className="mt-2" aria-live="polite">{message}</p>}
      </div>
    </div>
  );
} 