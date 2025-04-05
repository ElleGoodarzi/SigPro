"use client";

import React, { useState, useEffect } from 'react';
import ZTransformSciFiVisualizer from '../../components/ZTransformSciFiVisualizer';
import Link from 'next/link';
import Head from 'next/head';

export default function ZTransformToolPage() {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1920,
    height: typeof window !== 'undefined' ? window.innerHeight : 1080
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };
  
  return (
    <div className={`z-transform-tool min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 text-gray-100 transition-all duration-300 ${isFullscreen ? 'overflow-hidden' : ''}`}>
      {/* Header with navigation */}
      {!isFullscreen && (
        <header className="bg-gradient-to-r from-blue-950 via-indigo-950 to-purple-950 text-white py-4 px-6 shadow-lg border-b border-cyan-900/50">
          <div className="container mx-auto flex flex-wrap justify-between items-center">
            <div className="flex items-center mb-2 md:mb-0">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-700 to-cyan-500 flex items-center justify-center mr-4 border-2 border-cyan-300/30 shadow-lg shadow-cyan-500/20">
                <span className="text-3xl font-orbitron text-white">Z</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold font-orbitron text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-300 text-glow-cyan">Z-Transform Explorer</h1>
            </div>
            <div className="flex flex-wrap gap-3 items-center">
              <button 
                onClick={toggleFullscreen}
                className="px-5 py-3 bg-indigo-800 hover:bg-indigo-700 rounded-md text-gray-100 transition-colors border border-indigo-600 shadow-md hover:shadow-indigo-500/30 font-mono text-base"
              >
                {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Mode'}
              </button>
              <Link 
                href="/tools"
                className="px-5 py-3 bg-gray-800 hover:bg-gray-700 rounded-md text-gray-100 transition-colors border border-gray-700 shadow-md hover:shadow-gray-700/20 font-mono text-base"
              >
                Tools Hub
              </Link>
              <Link 
                href="/"
                className="px-5 py-3 bg-gray-800 hover:bg-gray-700 rounded-md text-gray-100 transition-colors border border-gray-700 shadow-md hover:shadow-gray-700/20 font-mono text-base"
              >
                Home
              </Link>
            </div>
          </div>
        </header>
      )}

      {/* Main content */}
      <main className={`container mx-auto transition-all duration-300 ${isFullscreen ? 'p-0 max-w-none' : 'py-8 px-6'}`}>
        <div className={`flex flex-col items-center justify-center ${isFullscreen ? 'w-full h-screen' : ''}`}>
          {/* Main visualizer - increased size */}
          <div className={`w-full ${isFullscreen ? 'h-full' : ''}`}>
            <ZTransformSciFiVisualizer 
              width={isFullscreen ? windowSize.width : Math.min(windowSize.width * 0.98, 2000)} 
              height={isFullscreen ? windowSize.height - 20 : Math.min(windowSize.height * 0.7, 1000)}
              className="sci-fi-glow mb-10 rounded-xl overflow-hidden border border-cyan-900/30"
              isFullscreen={isFullscreen}
            />
          </div>
          
          {!isFullscreen && (
            <div className="w-full max-w-7xl z-transform-sci-fi-panel p-6 md:p-8 rounded-xl mb-10 bg-gradient-to-br from-gray-900/90 to-gray-950/90 border-2 border-cyan-800/30 shadow-xl shadow-cyan-900/10">
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4 md:mb-6 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-300 to-cyan-400 font-orbitron tracking-wider">About The Z-Transform</h2>
              
              <div className="space-y-4 md:space-y-6 nerd-font">
                <p className="text-lg md:text-xl leading-relaxed text-cyan-100">
                  The Z-transform is a powerful mathematical tool that converts discrete-time signals into a complex frequency-domain representation.
                  It's the discrete-time equivalent of the Laplace transform, essential for analyzing digital systems.
                </p>
                
                <div className="grid md:grid-cols-2 gap-4 md:gap-6 lg:gap-8">
                  <div className="bg-gray-900/80 rounded-lg p-4 md:p-6 border-2 border-cyan-800/40 hover:border-cyan-700/60 transition-all shadow-md hover:shadow-cyan-900/20">
                    <h3 className="text-xl md:text-2xl text-cyan-400 mb-3 md:mb-4 font-orbitron">Key Features</h3>
                    <ul className="list-disc pl-6 space-y-2 md:space-y-3 text-cyan-100 nerd-font text-base md:text-lg">
                      <li>Transform between time and frequency domains</li>
                      <li>Analyze stability through poles and zeros</li>
                      <li>Determine system response characteristics</li>
                      <li>Explore regions of convergence (ROC)</li>
                      <li>Design digital filters efficiently</li>
                    </ul>
                  </div>
                  
                  <div className="bg-gray-900/80 rounded-lg p-4 md:p-6 border-2 border-cyan-800/40 hover:border-cyan-700/60 transition-all shadow-md hover:shadow-cyan-900/20">
                    <h3 className="text-xl md:text-2xl text-cyan-400 mb-3 md:mb-4 font-orbitron">Using This Tool</h3>
                    <ul className="list-disc pl-6 space-y-2 md:space-y-3 text-cyan-100 nerd-font text-base md:text-lg">
                      <li>Choose predefined signals or enter your own</li>
                      <li>Visualize in 2D (complex plane) or 3D (magnitude)</li>
                      <li>Explore how different signals transform</li>
                      <li>Use fullscreen mode for presentations</li>
                      <li>Interact with the visualization using mouse controls</li>
                    </ul>
                  </div>
                </div>
                
                <div className="z-transform-equation mt-4 md:mt-6 bg-gray-900/80 rounded-lg p-4 md:p-6 border-2 border-cyan-800/40">
                  <h3 className="text-xl md:text-2xl text-indigo-300 mb-3 md:mb-4 font-orbitron">Mathematical Definition</h3>
                  <p className="text-base md:text-lg text-indigo-100 mb-3 md:mb-4">
                    The Z-transform of a discrete-time signal x[n] is defined as:
                  </p>
                  <div className="flex justify-center py-4 md:py-6 rounded-lg overflow-x-auto bg-gray-950/50 border border-cyan-900/30">
                    <div className="math-formula text-xl md:text-2xl lg:text-3xl text-cyan-300 font-bold whitespace-nowrap px-4 md:px-6">
                      X(z) = ∑<sub>n=-∞</sub><sup>∞</sup> x[n]·z<sup>-n</sup>
                    </div>
                  </div>
                  <p className="text-base md:text-lg text-indigo-100 mt-3 md:mt-4">
                    Where z is a complex variable, and the sum converges for values of z within the Region of Convergence (ROC).
                  </p>
                </div>

                <div className="comic-speech-bubble mt-6 md:mt-8 bg-blue-100 p-4 md:p-6 rounded-2xl relative border-4 border-blue-300 shadow-xl">
                  <div className="absolute -top-5 -left-5 bg-yellow-400 text-blue-900 p-1 rotate-12 font-bold text-lg md:text-xl border-2 border-yellow-600 transform skew-x-12">FUN FACT!</div>
                  <h3 className="text-xl md:text-2xl text-blue-800 mb-2 md:mb-3 font-bold nerd-font">Did You Know?</h3>
                  <p className="text-base md:text-lg leading-relaxed text-blue-900 nerd-font">The Z-transform got its name from the variable "z" used to represent the complex frequency domain. It was developed in the 1950s as a tool for discrete-time signal analysis and has become fundamental in digital signal processing!</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer - only visible when not in fullscreen */}
      {!isFullscreen && (
        <footer className="bg-gradient-to-r from-gray-950 via-gray-900 to-gray-950 text-gray-400 p-6 mt-8 border-t border-gray-800/50">
          <div className="container mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="mb-4 md:mb-0 font-mono">
                <p className="text-sm tracking-wider">
                  &copy; {new Date().getFullYear()} Signal Processing Interactive Learning Platform
                </p>
                <p className="text-xs text-gray-500 mt-1">v2.1.0 | Optimized for modern browsers</p>
              </div>
              <div className="flex flex-wrap gap-4 md:gap-6 text-sm font-mono">
                <Link href="/tools" className="text-gray-400 hover:text-cyan-400 transition-colors">Tools</Link>
                <Link href="/tutorials" className="text-gray-400 hover:text-cyan-400 transition-colors">Tutorials</Link>
                <Link href="/labs" className="text-gray-400 hover:text-cyan-400 transition-colors">Labs</Link>
                <Link href="/about" className="text-gray-400 hover:text-cyan-400 transition-colors">About</Link>
              </div>
            </div>
          </div>
        </footer>
      )}

      <style jsx>{`
        .sci-fi-glow {
          box-shadow: 0 0 2.5rem rgba(0, 180, 255, 0.2);
        }
        .math-formula {
          font-family: 'Fira Code', 'Space Mono', monospace;
          letter-spacing: 0.125rem;
          text-shadow: 0 0 0.9rem rgba(0, 200, 255, 0.6);
        }
        .text-glow-cyan {
          text-shadow: 0 0 0.625rem rgba(0, 200, 255, 0.5);
        }
        .nerd-font {
          font-family: 'Comic Neue', 'Courier New', monospace;
          font-weight: 700;
          font-size: 1.1rem;
          line-height: 1.7;
        }
        .comic-speech-bubble:after {
          content: '';
          position: absolute;
          bottom: -1.25rem;
          left: 3.125rem;
          border-width: 1.25rem 0 0 1.25rem;
          border-style: solid;
          border-color: #93c5fd transparent;
          display: block;
          width: 0;
        }
        @media (max-width: 768px) {
          .math-formula {
            font-size: 1.25rem;
          }
          .nerd-font {
            font-size: 1rem;
            line-height: 1.6;
          }
        }
      `}</style>
    </div>
  );
}