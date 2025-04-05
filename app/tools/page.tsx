"use client";

import React from 'react';
import Link from 'next/link';

// Tool card component for better visual organization
const ToolCard: React.FC<{
  title: string;
  description: string;
  href: string;
  icon: React.ReactNode;
}> = ({ title, description, href, icon }) => {
  return (
    <Link 
      href={href}
      className="bg-gray-800 rounded-lg overflow-hidden hover:bg-gray-700 transition-colors border border-gray-700 hover:border-cyan-700 group"
    >
      <div className="p-5">
        <div className="flex items-center mb-4">
          <div className="w-10 h-10 flex items-center justify-center bg-gray-700 rounded-full text-cyan-400 group-hover:bg-cyan-900 transition-colors">
            {icon}
          </div>
          <h3 className="text-xl font-semibold ml-3 text-white group-hover:text-cyan-400 transition-colors">{title}</h3>
        </div>
        
        <p className="text-gray-300 text-sm">{description}</p>
        
        <div className="mt-4 flex justify-end">
          <span className="text-cyan-400 inline-flex items-center text-sm">
            Open Tool
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </span>
        </div>
      </div>
    </Link>
  );
};

export default function ToolsPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="bg-gradient-to-r from-blue-900 to-purple-900 p-6">
        <div className="container mx-auto">
          <h1 className="text-3xl font-bold font-['Orbitron'] mb-2">Signal Processing Tools</h1>
          <p className="text-gray-300">Interactive tools for signal processing education and exploration</p>
        </div>
      </header>

      <main className="container mx-auto py-12 px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Z-Transform Tool Card */}
          <Link href="/tools/z-transform" className="block group">
            <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden shadow-lg transition-transform transform-gpu group-hover:scale-105">
              <div className="h-48 bg-gradient-to-br from-blue-600 to-purple-700 p-6 flex items-center justify-center">
                <span className="text-6xl font-['Orbitron'] font-bold text-white">Z</span>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-cyan-400 mb-2">Z-Transform Visualizer</h3>
                <p className="text-gray-400 mb-4">
                  Interactive tool for exploring the Z-Transform, pole-zero plots, and regions of convergence
                </p>
                <div className="flex items-center text-cyan-500 font-medium">
                  <span>Explore Tool</span>
                  <svg className="w-5 h-5 ml-1 transform transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </div>
              </div>
            </div>
          </Link>

          {/* Placeholder for future tools */}
          <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden shadow-lg opacity-50">
            <div className="h-48 bg-gradient-to-br from-gray-700 to-gray-800 p-6 flex items-center justify-center">
              <span className="text-6xl font-['Orbitron'] font-bold text-gray-600">F</span>
            </div>
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-500 mb-2">Fourier Transform Tool</h3>
              <p className="text-gray-500 mb-4">
                Coming soon: Explore frequency domain analysis with interactive visualizations
              </p>
              <div className="flex items-center text-gray-500 font-medium">
                <span>Coming Soon</span>
              </div>
            </div>
          </div>

          {/* Placeholder for future tools */}
          <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden shadow-lg opacity-50">
            <div className="h-48 bg-gradient-to-br from-gray-700 to-gray-800 p-6 flex items-center justify-center">
              <span className="text-6xl font-['Orbitron'] font-bold text-gray-600">S</span>
            </div>
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-500 mb-2">Signal Generator</h3>
              <p className="text-gray-500 mb-4">
                Coming soon: Create and manipulate various signals with interactive controls
              </p>
              <div className="flex items-center text-gray-500 font-medium">
                <span>Coming Soon</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-gray-800 p-6 mt-12">
        <div className="container mx-auto flex flex-col md:flex-row justify-between items-center">
          <p className="mb-4 md:mb-0 text-gray-400">
            &copy; {new Date().getFullYear()} Signal Processing Interactive Learning Platform
          </p>
          <div className="flex space-x-4">
            <Link href="/" className="text-gray-400 hover:text-white">Home</Link>
            <Link href="/tutorials" className="text-gray-400 hover:text-white">Tutorials</Link>
            <Link href="/labs" className="text-gray-400 hover:text-white">Labs</Link>
          </div>
        </div>
      </footer>
    </div>
  );
} 