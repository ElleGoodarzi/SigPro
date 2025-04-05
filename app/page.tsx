'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import ErrorBoundary from './components/ErrorBoundary';
import ZTransformSciFiVisualizer from './components/ZTransformSciFiVisualizer';

export default function Home() {
  const [glitchIndex, setGlitchIndex] = useState(0);
  const glitchTexts = [
    'L4bs',
    'T0ut0ri4ls',
    'S1mul4t0r'
  ];

  // Cycle through glitch texts
  useEffect(() => {
    const interval = setInterval(() => {
      setGlitchIndex((prev) => (prev + 1) % glitchTexts.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <ErrorBoundary>
      <main className="min-h-screen grid-blueprint">
        <div className="hero min-h-screen bg-base-200 bg-opacity-80">
          <div className="hero-content text-center">
            <div className="max-w-5xl">
              <h1 className="text-4xl font-bold space-mono">
                ELEC 342 <br/> Signal Processing Lab & Tutorials
              </h1>
              <p className="py-6 font-mono text-lg">
                An interactive platform for simulating and visualizing signal processing concepts.
                <span className="block mt-2 text-glitch">{glitchTexts[glitchIndex]}</span>
              </p>
              
              <div className="flex flex-wrap justify-center gap-4 mt-8">
                <Link href="/simulator" className="btn btn-nerd btn-lg">
                  Launch Simulator
                </Link>
                <Link href="/labs" className="btn btn-nerd btn-lg">
                  Interactive Labs
                </Link>
                <Link href="/tutorials" className="btn btn-nerd btn-lg">
                  Tutorials
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-16">
          <h2 className="text-3xl font-bold mb-8 text-center retro-text neon-text">Platform Features</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="card panel-sci-fi hologram">
              <div className="card-body">
                <h3 className="card-title retro-text">Signal Generator</h3>
                <p className="text-base font-mono">Create and manipulate various signal types using MATLAB-like syntax</p>
              </div>
            </div>
            
            <div className="card panel-sci-fi hologram">
              <div className="card-body">
                <h3 className="card-title retro-text">Visual Analysis</h3>
                <p className="text-base font-mono">Interactive visualizations for time and frequency domains</p>
              </div>
            </div>
            
            <div className="card panel-sci-fi hologram">
              <div className="card-body">
                <h3 className="card-title retro-text">Lab Exercises</h3>
                <p className="text-base font-mono">Guided labs with step-by-step instructions and instant feedback</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="container mx-auto px-4 py-16 crt-overlay">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="md:w-1/2">
              <h2 className="text-3xl font-bold mb-4 retro-text neon-text">Dive into Signal Analysis</h2>
              <p className="mb-4 font-mono">
                Explore Fourier transforms, digital filters, sampling theory, and more through interactive simulations.
              </p>
              <p className="mb-6 font-mono">
                Our MATLAB-compatible syntax makes it easy to transition between classroom theory and practical application.
              </p>
              <Link href="/simulator" className="btn btn-nerd">
                Try it Now
              </Link>
            </div>
            
            <div className="md:w-1/2 terminal-like p-6 neon-border">
              <pre className="font-mono text-sm whitespace-pre-wrap">
                <code>
{`% Generate a simple signal
fs = 1000;           % Sampling frequency (Hz)
t = 0:1/fs:1-1/fs;   % Time vector (1 second)
f = 5;               % Frequency of sine wave (Hz)
x = sin(2*pi*f*t);   % Generate sine wave

% Compute the FFT
X = fft(x);
N = length(X);
f = (0:N-1)*(fs/N); % Frequency vector
X_mag = abs(X)/N;   % Normalized magnitude`}
                </code>
              </pre>
            </div>
          </div>
        </div>

        {/* Enhanced Z-Transform Feature Section */}
        <div className="container mx-auto px-4 py-16 crt-overlay">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="md:w-1/2 order-2 md:order-1">
              <div className="terminal-like p-6 neon-border">
                <pre className="font-mono text-sm whitespace-pre-wrap">
                  <code>
{`% Interactive Z-Transform Explorer
// Add poles and zeros directly on the Z-plane
addPole(0.8, 0);     // Add pole at z = 0.8
addZero(-0.5, 0);    // Add zero at z = -0.5

// Visualize custom signals
signal = [1, 0.5, 0.25, 0.125, 0.0625];
plotSignal(signal);

// Export your visualization
exportVisualization('png', 'my-z-transform.png');

// Keyboard shortcuts for quick navigation
// P - Add poles
// Z - Add zeros
// R - Reset view
// H - Show help
`}
                  </code>
                </pre>
              </div>
            </div>
            
            <div className="md:w-1/2 order-1 md:order-2">
              <h2 className="text-3xl font-bold mb-4 retro-text neon-text">Enhanced Z-Transform</h2>
              <p className="mb-4 font-mono">
                Our newly improved Z-transform tool now features interactive pole-zero placement,
                customizable visualizations, and direct manipulation of the complex Z-plane.
              </p>
              <p className="mb-6 font-mono">
                Perfect for learning signal processing concepts through hands-on experimentation
                with real-time feedback and intuitive controls.
              </p>
              <Link href="/tools/z-transform" className="btn btn-nerd">
                Try New Features
              </Link>
            </div>
          </div>
        </div>

        {/* Z-Transform Interactive Visualizer */}
        <div className="container mx-auto px-4 py-16 my-8 bg-gray-900/80 backdrop-blur-sm rounded-xl shadow-lg">
          <h2 className="text-3xl font-bold mb-8 text-center retro-text neon-text">Z-Transform Interactive Visualizer</h2>
          <div className="max-w-7xl mx-auto">
            <ZTransformSciFiVisualizer 
              width={1300}
              height={700}
              className="mb-8 shadow-2xl"
            />
            <div className="flex justify-center">
              <Link href="/tools/z-transform" className="btn btn-nerd btn-lg">
                Open Full Tool
              </Link>
            </div>
          </div>
        </div>
      </main>
    </ErrorBoundary>
  );
} 