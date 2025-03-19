'use client';

import React from 'react';
import { AppStateProvider } from '../context/AppStateContext';
import ErrorBoundary from './ErrorBoundary';
import Navbar from './Navbar';
import Footer from './Footer';

export default function ClientWrapper({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <AppStateProvider>
        <Navbar />
        <main className="flex-grow">{children}</main>
        <Footer />
      </AppStateProvider>
    </ErrorBoundary>
  );
} 