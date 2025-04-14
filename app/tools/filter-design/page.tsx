"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import FilterDesigner from './components/FilterDesigner';
import { FilterType, FilterImplementation } from './types/filterTypes';

export default function FilterDesignToolPage() {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1920,
    height: typeof window !== 'undefined' ? window.innerHeight : 1080
  });
  const [selectedFilterType, setSelectedFilterType] = useState<FilterType>('lowpass');
  const [selectedImplementation, setSelectedImplementation] = useState<FilterImplementation>('ideal');
  const [cutoffFrequency, setCutoffFrequency] = useState<number>(0.25);
  const [cutoffFrequency2, setCutoffFrequency2] = useState<number>(0.75);
  
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
    <div className={`filter-design-tool min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 text-gray-100 transition-all duration-300 ${isFullscreen ? 'overflow-hidden' : ''}`}>
      {/* Header with navigation */}
      {!isFullscreen && (
        <header className="bg-gradient-to-r from-blue-950 via-indigo-950 to-purple-950 text-white py-4 px-6 shadow-lg border-b border-cyan-900/50">
          <div className="container mx-auto flex flex-wrap justify-between items-center">
            <div className="flex items-center mb-2 md:mb-0">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-green-700 to-cyan-500 flex items-center justify-center mr-4 border-2 border-cyan-300/30 shadow-lg shadow-cyan-500/20">
                <span className="text-3xl font-orbitron text-white">F</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold font-orbitron text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-green-300 text-glow-cyan">Digital Filter Designer</h1>
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
          {/* Main filter designer component */}
          <FilterDesigner 
            isFullscreen={isFullscreen}
            windowSize={windowSize}
            selectedFilterType={selectedFilterType}
            setSelectedFilterType={setSelectedFilterType}
            selectedImplementation={selectedImplementation}
            setSelectedImplementation={setSelectedImplementation}
            cutoffFrequency={cutoffFrequency}
            setCutoffFrequency={setCutoffFrequency}
            cutoffFrequency2={cutoffFrequency2}
            setCutoffFrequency2={setCutoffFrequency2}
          />
          
          {!isFullscreen && (
            <div className="w-full max-w-7xl filter-design-sci-fi-panel p-6 md:p-8 rounded-xl mb-10 bg-gradient-to-br from-gray-900/90 to-gray-950/90 border-2 border-green-800/30 shadow-xl shadow-green-900/10">
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4 md:mb-6 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-green-300 to-cyan-400 font-orbitron tracking-wider">About Digital Filters</h2>
              
              <div className="space-y-4 md:space-y-6 nerd-font">
                <p className="text-lg md:text-xl leading-relaxed text-cyan-100">
                  Digital filters are mathematical algorithms that perform signal processing tasks on discrete-time signals. 
                  They are fundamental components in digital signal processing (DSP) systems, used to remove unwanted signal components,
                  enhance desired features, or extract specific information from signals.
                </p>
                
                <div className="grid md:grid-cols-2 gap-4 md:gap-6 lg:gap-8">
                  <div className="bg-gray-900/80 rounded-lg p-4 md:p-6 border-2 border-cyan-800/40 hover:border-cyan-700/60 transition-all shadow-md hover:shadow-cyan-900/20">
                    <h3 className="text-xl md:text-2xl text-cyan-400 mb-3 md:mb-4 font-orbitron">Filter Types & Implementations</h3>
                    <ul className="list-disc pl-6 space-y-2 md:space-y-3 text-cyan-100 nerd-font text-base md:text-lg">
                      <li><span className="text-green-300 font-bold">Ideal Filters:</span> Perfect frequency selection but not realizable</li>
                      <li><span className="text-green-300 font-bold">FIR Filters:</span> Finite impulse response, stable with linear phase</li>
                      <li><span className="text-green-300 font-bold">IIR Filters:</span> Infinite impulse response, efficient but with potential stability issues</li>
                      <li><span className="text-green-300 font-bold">Butterworth:</span> Maximally flat frequency response</li>
                      <li><span className="text-green-300 font-bold">Chebyshev:</span> Steeper rolloff with ripple in either passband or stopband</li>
                      <li><span className="text-green-300 font-bold">Elliptic:</span> Steepest rolloff with ripple in both bands</li>
                    </ul>
                  </div>
                  
                  <div className="bg-gray-900/80 rounded-lg p-4 md:p-6 border-2 border-cyan-800/40 hover:border-cyan-700/60 transition-all shadow-md hover:shadow-cyan-900/20">
                    <h3 className="text-xl md:text-2xl text-cyan-400 mb-3 md:mb-4 font-orbitron">Using This Tool</h3>
                    <ul className="list-disc pl-6 space-y-2 md:space-y-3 text-cyan-100 nerd-font text-base md:text-lg">
                      <li>Select a filter type (Lowpass, Highpass, etc.)</li>
                      <li>Choose implementation method (Ideal, FIR, IIR)</li>
                      <li>Adjust cutoff frequency parameters</li>
                      <li>Configure advanced options for each implementation</li>
                      <li>Visualize impulse and frequency responses</li>
                      <li>Examine pole-zero plots for IIR filters</li>
                    </ul>
                  </div>
                </div>
                
                <div className="filter-equations mt-4 md:mt-6 bg-gray-900/80 rounded-lg p-4 md:p-6 border-2 border-cyan-800/40">
                  <h3 className="text-xl md:text-2xl text-indigo-300 mb-3 md:mb-4 font-orbitron">Ideal Filter Impulse Responses</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-950/50 rounded-lg p-4 border border-cyan-900/30">
                      <h4 className="text-lg font-bold text-green-300 mb-2">Lowpass Filter</h4>
                      <div className="text-cyan-300 font-mono text-center py-2">
                        h[k] = Ωc sinc(k·Ωc)
                      </div>
                      <p className="text-sm text-gray-400 mt-2">Where Ωc is the normalized cutoff frequency</p>
                    </div>
                    
                    <div className="bg-gray-950/50 rounded-lg p-4 border border-cyan-900/30">
                      <h4 className="text-lg font-bold text-green-300 mb-2">Highpass Filter</h4>
                      <div className="text-cyan-300 font-mono text-center py-2">
                        h[k] = δ[k] - Ωc sinc(k·Ωc)
                      </div>
                      <p className="text-sm text-gray-400 mt-2">Where δ[k] is the Kronecker delta function</p>
                    </div>
                    
                    <div className="bg-gray-950/50 rounded-lg p-4 border border-cyan-900/30">
                      <h4 className="text-lg font-bold text-green-300 mb-2">Bandpass Filter</h4>
                      <div className="text-cyan-300 font-mono text-center py-2">
                        h[k] = Ωc2 sinc(k·Ωc2) - Ωc1 sinc(k·Ωc1)
                      </div>
                      <p className="text-sm text-gray-400 mt-2">Where Ωc1 and Ωc2 are the lower and upper cutoff frequencies</p>
                    </div>
                    
                    <div className="bg-gray-950/50 rounded-lg p-4 border border-cyan-900/30">
                      <h4 className="text-lg font-bold text-green-300 mb-2">Bandstop Filter</h4>
                      <div className="text-cyan-300 font-mono text-center py-2">
                        h[k] = δ[k] - Ωc2 sinc(k·Ωc2) + Ωc1 sinc(k·Ωc1)
                      </div>
                      <p className="text-sm text-gray-400 mt-2">Where Ωc1 and Ωc2 are the lower and upper cutoff frequencies</p>
                    </div>
                  </div>
                </div>

                <div className="comic-speech-bubble mt-6 md:mt-8 bg-blue-100 p-4 md:p-6 rounded-2xl relative border-4 border-blue-300 shadow-xl">
                  <div className="absolute -top-5 -left-5 bg-yellow-400 text-blue-900 p-1 rotate-12 font-bold text-lg md:text-xl border-2 border-yellow-600 transform skew-x-12">TIP!</div>
                  <h3 className="text-xl md:text-2xl text-blue-800 mb-2 md:mb-3 font-bold nerd-font">Which Filter to Choose?</h3>
                  <p className="text-base md:text-lg leading-relaxed text-blue-900 nerd-font">
                    <strong>FIR filters</strong> offer stability and linear phase but require higher orders. 
                    <strong>IIR filters</strong> are more efficient for sharp transitions but can have non-linear phase.
                    <strong>Butterworth</strong> filters provide smooth response, while <strong>Chebyshev</strong> and <strong>Elliptic</strong> 
                    filters offer steeper transitions with some ripple tradeoff.
                  </p>
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
      `}</style>
    </div>
  );
} 