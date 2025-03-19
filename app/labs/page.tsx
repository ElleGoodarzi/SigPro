'use client';

import { useState } from 'react';
import Link from 'next/link';
import ErrorBoundary from '../components/ErrorBoundary';

// Lab data
const labs = [
  {
    id: 'matlab-functions-sampling',
    title: 'MATLAB Functions & Sampling Theorem',
    description: 'Learn to create MATLAB functions and understand the Sampling Theorem in digital signal processing.',
    difficulty: 'Intermediate',
    duration: '2-3 hours',
    topics: ['MATLAB', 'Functions', 'Sampling', 'Aliasing'],
    image: '/images/sampling-theorem.png'
  }
];

// Difficulty badge color mapping
const difficultyColors = {
  'Beginner': 'badge-success',
  'Intermediate': 'badge-warning',
  'Advanced': 'badge-error'
};

export default function LabsPage() {
  const [filterDifficulty, setFilterDifficulty] = useState<string | null>(null);
  
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
            <div 
              key={lab.id} 
              className="card overflow-hidden transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg"
            >
              {/* Comic-style lab number */}
              <div className="absolute -right-10 -top-10 bg-primary-500 text-white w-24 h-24 rounded-full flex items-end justify-start p-3 font-bold transform rotate-12 neon-border z-10">
                <span className="text-2xl space-mono">#3</span>
              </div>
              
              {/* Difficulty indicator at the top */}
              <div 
                className={`absolute top-0 left-0 right-0 h-2 ${
                  lab.difficulty === 'Beginner' ? 'bg-success' : 
                  lab.difficulty === 'Intermediate' ? 'bg-warning' : 
                  'bg-error'
                }`}
              ></div>
            
              <div className="relative p-6 pt-4 pb-3 bg-neutral-900 crt-overlay">
                <h3 className="text-xs uppercase tracking-wide font-mono opacity-60 mb-1">{lab.difficulty} • {lab.duration}</h3>
                <h2 className="text-xl space-mono font-bold mb-1">{lab.title}</h2>
                <div className="h-1 w-16 bg-primary-500 mb-3"></div>
                <div className="flex flex-wrap gap-1 my-1">
                  {lab.topics.map(topic => (
                    <span key={topic} className="inline-block text-xs bg-base-300 bg-opacity-30 px-2 py-0.5 rounded font-mono">
                      {topic}
                    </span>
                  ))}
                </div>
                <p className="text-sm font-mono mt-3 mb-4 min-h-[60px]">{lab.description}</p>
                
                <div className="card-actions mt-3 flex justify-between items-center">
                  <div className={`text-xs font-mono ${
                    lab.difficulty === 'Beginner' ? 'text-success' : 
                    lab.difficulty === 'Intermediate' ? 'text-warning' : 
                    'text-error'
                  }`}>
                    <div className="flex items-center">
                      <span className="inline-block w-2 h-2 rounded-full bg-primary-500 mr-1 animate-pulse"></span>
                      READY
                    </div>
                  </div>
                  <Link href={`/labs/${lab.id}`} className="btn btn-nerd btn-sm">
                    <span className="font-mono tracking-wide">Access Lab</span> <span className="ml-1">→</span>
                  </Link>
                </div>
              </div>
            </div>
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