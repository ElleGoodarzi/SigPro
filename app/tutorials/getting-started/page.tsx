'use client';

import Link from 'next/link';
import ErrorBoundary from '../../components/ErrorBoundary';

export default function GettingStartedTutorial() {
  return (
    <ErrorBoundary>
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row justify-between items-start mb-6">
          <div>
            <div className="text-sm breadcrumbs mb-2">
              <ul>
                <li><Link href="/">Home</Link></li>
                <li><Link href="/tutorials">Tutorials</Link></li>
                <li>Getting Started</li>
              </ul>
            </div>
            <h1 className="text-4xl font-bold mb-2">Getting Started with Signal Processing</h1>
            <div className="flex flex-wrap gap-2 mb-4">
              <div className="badge badge-outline">Beginner</div>
              <div className="badge badge-outline">20 minutes</div>
              <div className="badge badge-primary badge-outline">Basics</div>
              <div className="badge badge-primary badge-outline">Introduction</div>
            </div>
          </div>
        </div>

        <div className="card bg-base-200 p-6">
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <h2 className="text-2xl font-bold mb-4">Coming Soon</h2>
            <p className="mb-6">
              This tutorial is currently under development. Please check back later!
            </p>
            <Link href="/tutorials" className="btn btn-primary">
              Back to Tutorials
            </Link>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
} 