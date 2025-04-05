'use client';

import React from 'react';
import Link from 'next/link';
import ErrorBoundary from '../components/ErrorBoundary';

// Lab data
const labs = [
  {
    id: 'matlab-functions-sampling',
    title: 'MATLAB Functions & Sampling Theorem',
    description: 'Learn about MATLAB functions and the Nyquist-Shannon sampling theorem.',
    image: '/images/lab-matlab.png', 
    difficulty: 'Intermediate'
  }
  // Z-transform lab removed to avoid redundancy with the main Z-transform tool
];

// Difficulty badge color mapping
const difficultyColors = {
  'Beginner': 'badge-success',
  'Intermediate': 'badge-warning',
  'Advanced': 'badge-error'
};

export default function LabsPage() {
  const [filterDifficulty, setFilterDifficulty] = React.useState<string | null>(null);
  
  // Filter labs based on selected difficulty
  const filteredLabs = filterDifficulty 
    ? labs.filter(lab => lab.difficulty === filterDifficulty)
    : labs;

  return (
    <ErrorBoundary>
      <div className="container mx-auto px-4 py-8 grid-blueprint">
        <div className="text-center mb-12 relative">
          <div className="absolute inset-0 matrix-bg opacity-10 -z-10"></div>
          <div className="space-mono text-sm mb-1">ELEC 342 PRESENTS</div>
          <h1 className="text-4xl font-bold mb-4 space-mono neon-text">Interactive L4bs</h1>
          <div className="w-32 h-1 bg-primary-500 mx-auto mb-6 neon-border"></div>
          <p className="text-lg max-w-3xl mx-auto font-mono">
            Hands-on experiments to reinforce signal processing concepts through interactive visualizations and guided exercises.
          </p>
        </div>
        
        <div className="flex justify-between items-center mb-8 p-3 bg-base-300 bg-opacity-50 rounded-lg border-l-4 border-primary-500">
          <div className="flex gap-2 flex-wrap">
            <div className="font-mono text-xs opacity-70 self-center mr-1">FILTER: </div>
            <button 
              className={`btn btn-sm ${!filterDifficulty ? 'btn-primary' : 'btn-outline'} btn-nerd`}
              onClick={() => setFilterDifficulty(null)}
            >
              All Labs
            </button>
            {['Beginner', 'Intermediate', 'Advanced'].map(difficulty => (
              <button
                key={difficulty}
                className={`btn btn-sm ${filterDifficulty === difficulty ? 'btn-primary' : 'btn-outline'} btn-nerd`}
                onClick={() => setFilterDifficulty(difficulty)}
              >
                {difficulty}
              </button>
            ))}
          </div>
          
          <div className="font-mono text-sm neon-text bg-base-200 px-3 py-1 rounded-lg">
            <span className="inline-block w-3 h-3 rounded-full bg-primary animate-pulse mr-2"></span>
            {filteredLabs.length} {filteredLabs.length === 1 ? 'Lab' : 'Labs'} Found
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLabs.map((lab, index) => (
            <Link key={lab.id} href={`/labs/${lab.id}`}>
              <div className="bg-gray-800 rounded-lg overflow-hidden hover:shadow-lg hover:shadow-cyan-900/30 transition-all duration-300 h-full flex flex-col border border-gray-700 hover:border-cyan-700">
                <div className="bg-gray-900 h-40 flex items-center justify-center">
                  {/* Use a default gradient if no image is available */}
                  <div className="text-4xl font-bold text-cyan-400">#{index + 1}</div>
                </div>
                <div className="p-4 flex-grow">
                  <div className="flex justify-between items-start mb-2">
                    <h2 className="text-xl font-bold text-white">{lab.title}</h2>
                    <span className="text-xs bg-cyan-900 text-cyan-100 px-2 py-1 rounded">{lab.difficulty}</span>
                  </div>
                  <p className="text-gray-400">{lab.description}</p>
                </div>
                <div className="bg-gray-900 p-3 text-right">
                  <span className="text-cyan-400 text-sm">Start Lab →</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
        
        <div className="text-center mt-16 mb-8">
          <h2 className="text-2xl font-bold mb-4 font-mono retro-text">Need to test your own code?</h2>
          <p className="mb-6 font-mono">
            Try our open-ended signal processing simulator for experimenting with custom algorithms.
          </p>
          <Link href="/simulator" className="btn btn-nerd btn-lg">
            Launch Simulator
          </Link>
        </div>
        
        <div className="terminal-like p-6 mt-16 mb-8 max-w-3xl mx-auto text-center">
          <div className="terminal-header mb-4 flex items-center justify-center">
            <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></div>
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
          </div>
          <h2 className="text-2xl font-bold mb-4 space-mono">Need to experiment with your own c0de?</h2>
          <div className="w-16 h-1 bg-primary-500 mx-auto mb-4"></div>
          <p className="mb-6 font-mono text-base opacity-80">
            Try our open-ended signal processing simulator for testing custom algorithms <br />
            and visualizing results in real-time.
          </p>
          <div className="flex justify-center">
            <Link href="/simulator" className="btn btn-nerd btn-lg relative overflow-hidden">
              <span className="relative z-10 font-mono tracking-wide">Launch Simulator</span>
              <span className="absolute inset-0 bg-primary-700 opacity-0 hover:opacity-20 transition-opacity"></span>
            </Link>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
} 