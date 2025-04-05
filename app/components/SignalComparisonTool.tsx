"use client";

import React, { useState, useEffect } from 'react';
import { MathJax } from 'better-react-mathjax';
import ZTransformSciFiVisualizer from './ZTransformSciFiVisualizer';

type Point = {
  x: number;
  y: number;
  id: string;
};

// Convert Point type to ComplexPoint type needed by the new visualizer
type ComplexPoint = {
  re: number;
  im: number;
};

type SignalComparisonToolProps = {
  className?: string;
};

const SignalComparisonTool: React.FC<SignalComparisonToolProps> = ({ className = '' }) => {
  // Parameter for both signals
  const [paramA, setParamA] = useState<number>(0.7);
  const [kRange, setKRange] = useState<number>(10);
  
  // Generate signal data for plotting
  const generateSignalData = () => {
    // Generate data for x1[k] = a^k u[k] (right-sided)
    const x1Data: {k: number, value: number}[] = [];
    for (let k = -kRange; k <= kRange; k++) {
      const value = k >= 0 ? Math.pow(paramA, k) : 0;
      x1Data.push({ k, value });
    }
    
    // Generate data for x2[k] = -a^k u[-k-1] (left-sided)
    const x2Data: {k: number, value: number}[] = [];
    for (let k = -kRange; k <= kRange; k++) {
      const value = k <= -1 ? -Math.pow(paramA, k) : 0;
      x2Data.push({ k, value });
    }
    
    return { x1Data, x2Data };
  };
  
  const { x1Data, x2Data } = generateSignalData();
  
  // Prepare pole and zero data for the visualizer
  const rightSidedPoles: ComplexPoint[] = [{ re: paramA, im: 0 }];
  const rightSidedZeros: ComplexPoint[] = [{ re: 0, im: 0 }];
  
  const leftSidedPoles: ComplexPoint[] = [{ re: paramA, im: 0 }];
  const leftSidedZeros: ComplexPoint[] = [{ re: 0, im: 0 }];
  
  // Calculate max value for y-axis scaling
  const maxValue = Math.max(
    ...x1Data.map(point => point.value),
    ...x2Data.map(point => Math.abs(point.value))
  );
  
  return (
    <div className={`signal-comparison-tool ${className}`}>
      <h2 className="text-2xl font-bold mb-4 text-cyan-400">Compare Signals with Identical Z-Transforms</h2>
      
      <div className="parameter-controls mb-6 p-4 bg-gray-800 rounded-lg">
        <h3 className="text-lg text-purple-400 mb-3">Adjust Parameters</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block mb-2">
              Parameter a: {paramA.toFixed(2)}
            </label>
            <input
              type="range"
              min={0.1}
              max={0.9}
              step={0.05}
              value={paramA}
              onChange={(e) => setParamA(parseFloat(e.target.value))}
              className="w-full"
            />
            <p className="text-sm text-gray-400 mt-1">
              Controls the decay rate of both signals and position of pole at z = a
            </p>
          </div>
          
          <div>
            <label className="block mb-2">
              k Range: {kRange}
            </label>
            <input
              type="range"
              min={5}
              max={20}
              step={1}
              value={kRange}
              onChange={(e) => setKRange(parseInt(e.target.value))}
              className="w-full"
            />
            <p className="text-sm text-gray-400 mt-1">
              Adjusts the visible range of the signal plots
            </p>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Right-sided signal (Example 1) */}
        <div className="bg-gray-800 p-4 rounded-lg">
          <h3 className="text-lg text-purple-400 mb-3">Example 1: Right-sided Signal</h3>
          
          <div className="mb-4">
            <h4 className="text-md font-semibold mb-2">Signal Definition</h4>
            <MathJax>
              {`\\[x_1[k] = ${paramA}^k u[k]\\]`}
            </MathJax>
            <p className="text-sm mt-2">
              This is a causal (right-sided) exponential sequence that starts at k = 0 and extends to +∞.
            </p>
          </div>
          
          <div className="signal-plot h-48 bg-gray-900 rounded border border-gray-700 relative mb-4">
            {/* X and Y axes */}
            <div className="absolute top-1/2 left-0 right-0 h-px bg-gray-600"></div>
            <div className="absolute bottom-0 top-0 left-1/2 w-px bg-gray-600"></div>
            
            {/* Origin label */}
            <div className="absolute top-[calc(50%+4px)] left-[calc(50%-10px)] text-xs text-gray-400">0</div>
            
            {/* Signal points */}
            {x1Data.map((point, index) => {
              // Skip points that are 0 (for cleaner visualization)
              if (point.value === 0) return null;
              
              // Calculate position
              const x = `calc(50% + ${(point.k / kRange) * 45}%)`;
              const y = `calc(50% - ${(point.value / maxValue) * 45}%)`;
              
              return (
                <React.Fragment key={`x1-${index}`}>
                  {/* Stem line */}
                  <div 
                    className="absolute w-px bg-purple-500"
                    style={{
                      left: x,
                      top: y,
                      height: `calc(50% - ${y} + 50%)`,
                      bottom: '50%'
                    }}
                  ></div>
                  
                  {/* Point marker */}
                  <div 
                    className="absolute h-2 w-2 bg-purple-500 rounded-full transform -translate-x-1 -translate-y-1"
                    style={{ left: x, top: y }}
                  ></div>
                  
                  {/* K value label (show only for some points) */}
                  {point.k % 2 === 0 && (
                    <div 
                      className="absolute text-xs text-gray-400 transform -translate-x-1/2"
                      style={{ left: x, top: 'calc(50% + 16px)' }}
                    >
                      {point.k}
                    </div>
                  )}
                </React.Fragment>
              );
            })}
            
            {/* Axis labels */}
            <div className="absolute top-2 left-1/2 transform -translate-x-1/2 text-xs text-gray-400">
              x₁[k]
            </div>
            <div className="absolute bottom-2 right-2 text-xs text-gray-400">
              k
            </div>
          </div>
          
          <div className="mb-4">
            <h4 className="text-md font-semibold mb-2">Z-Transform</h4>
            <MathJax>
              {`\\[X_1(z) = \\sum_{k=0}^{\\infty} ${paramA}^k z^{-k} = \\frac{1}{1 - ${paramA}z^{-1}} = \\frac{z}{z-${paramA}}\\]`}
            </MathJax>
          </div>
          
          <div className="mb-2">
            <h4 className="text-md font-semibold mb-2">ROC</h4>
            <div className="bg-purple-900 bg-opacity-30 p-2 rounded border border-purple-600">
              <MathJax>
                {`\\[|z| > ${paramA}\\]`}
              </MathJax>
              <p className="text-sm mt-1">
                Region extends outward from the pole at z = {paramA}
              </p>
            </div>
          </div>
          
          <div className="mt-4">
            <h4 className="text-md font-semibold mb-2">Z-Plane</h4>
            <ZTransformSciFiVisualizer 
              initialSignal="custom"
              initialPoles={rightSidedPoles}
              initialZeros={rightSidedZeros}
              width={300}
              height={300}
              className="border border-gray-700 rounded-lg"
            />
          </div>
        </div>
        
        {/* Left-sided signal (Example 2) */}
        <div className="bg-gray-800 p-4 rounded-lg">
          <h3 className="text-lg text-red-400 mb-3">Example 2: Left-sided Signal</h3>
          
          <div className="mb-4">
            <h4 className="text-md font-semibold mb-2">Signal Definition</h4>
            <MathJax>
              {`\\[x_2[k] = -${paramA}^k u[-k-1]\\]`}
            </MathJax>
            <p className="text-sm mt-2">
              This is an anti-causal (left-sided) exponential sequence that starts at k = -1 and extends to -∞.
            </p>
          </div>
          
          <div className="signal-plot h-48 bg-gray-900 rounded border border-gray-700 relative mb-4">
            {/* X and Y axes */}
            <div className="absolute top-1/2 left-0 right-0 h-px bg-gray-600"></div>
            <div className="absolute bottom-0 top-0 left-1/2 w-px bg-gray-600"></div>
            
            {/* Origin label */}
            <div className="absolute top-[calc(50%+4px)] left-[calc(50%-10px)] text-xs text-gray-400">0</div>
            
            {/* Signal points */}
            {x2Data.map((point, index) => {
              // Skip points that are 0 (for cleaner visualization)
              if (point.value === 0) return null;
              
              // Calculate position
              const x = `calc(50% + ${(point.k / kRange) * 45}%)`;
              const y = `calc(50% - ${(point.value / maxValue) * 45}%)`;
              
              return (
                <React.Fragment key={`x2-${index}`}>
                  {/* Stem line */}
                  <div 
                    className="absolute w-px bg-red-500"
                    style={{
                      left: x,
                      top: y,
                      height: `calc(50% - ${y} + 50%)`,
                      bottom: '50%'
                    }}
                  ></div>
                  
                  {/* Point marker */}
                  <div 
                    className="absolute h-2 w-2 bg-red-500 rounded-full transform -translate-x-1 -translate-y-1"
                    style={{ left: x, top: y }}
                  ></div>
                  
                  {/* K value label (show only for some points) */}
                  {point.k % 2 === 0 && (
                    <div 
                      className="absolute text-xs text-gray-400 transform -translate-x-1/2"
                      style={{ left: x, top: 'calc(50% + 16px)' }}
                    >
                      {point.k}
                    </div>
                  )}
                </React.Fragment>
              );
            })}
            
            {/* Axis labels */}
            <div className="absolute top-2 left-1/2 transform -translate-x-1/2 text-xs text-gray-400">
              x₂[k]
            </div>
            <div className="absolute bottom-2 right-2 text-xs text-gray-400">
              k
            </div>
          </div>
          
          <div className="mb-4">
            <h4 className="text-md font-semibold mb-2">Z-Transform</h4>
            <MathJax>
              {`\\[X_2(z) = \\sum_{k=-\\infty}^{-1} -${paramA}^k z^{-k} = \\frac{z}{z-${paramA}}\\]`}
            </MathJax>
            <p className="text-sm text-gray-400 mt-1">
              After substitution m = -k and algebraic simplification
            </p>
          </div>
          
          <div className="mb-2">
            <h4 className="text-md font-semibold mb-2">ROC</h4>
            <div className="bg-red-900 bg-opacity-30 p-2 rounded border border-red-600">
              <MathJax>
                {`\\[|z| < ${paramA}\\]`}
              </MathJax>
              <p className="text-sm mt-1">
                Region extends inward from the pole at z = {paramA}
              </p>
            </div>
          </div>
          
          <div className="mt-4">
            <h4 className="text-md font-semibold mb-2">Z-Plane</h4>
            <ZTransformSciFiVisualizer 
              initialSignal="custom"
              initialPoles={leftSidedPoles}
              initialZeros={leftSidedZeros}
              width={300}
              height={300}
              className="border border-gray-700 rounded-lg"
            />
          </div>
        </div>
      </div>
      
      <div className="mt-8 bg-purple-900 bg-opacity-30 p-5 rounded-lg border border-purple-500">
        <h3 className="text-xl text-cyan-400 mb-3">Key Insight: Z-Transform + ROC = Unique Signal</h3>
        
        <div className="bg-gray-800 p-4 rounded-lg mb-4">
          <p className="mb-3">
            Notice that both signals have <strong>exactly the same Z-transform expression</strong>:
          </p>
          <div className="text-center text-xl mb-3">
            <MathJax>
              {`\\[X_1(z) = X_2(z) = \\frac{z}{z-${paramA}}\\]`}
            </MathJax>
          </div>
          <p>
            Yet they represent completely different time-domain signals! This demonstrates why 
            the ROC must be specified along with the Z-transform expression to uniquely determine
            the time-domain signal.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gray-800 p-3 rounded-lg">
            <h4 className="text-md text-purple-400 mb-2">Right-sided Signal ROC</h4>
            <p>
              For x₁[k] = {paramA}ᵏu[k]:
            </p>
            <ul className="list-disc pl-6 space-y-1 text-sm">
              <li>ROC: |z| &gt; {paramA}</li>
              <li>Causal signal (non-zero for k ≥ 0)</li>
              <li>ROC extends outward from outermost pole</li>
              <li>
                {paramA < 1 ? (
                  <>Stable system (ROC includes unit circle |z| = 1)</>
                ) : (
                  <>Unstable system (ROC excludes unit circle |z| = 1)</>
                )}
              </li>
            </ul>
          </div>
          
          <div className="bg-gray-800 p-3 rounded-lg">
            <h4 className="text-md text-red-400 mb-2">Left-sided Signal ROC</h4>
            <p>
              For x₂[k] = -{paramA}ᵏu[-k-1]:
            </p>
            <ul className="list-disc pl-6 space-y-1 text-sm">
              <li>ROC: |z| &lt; {paramA}</li>
              <li>Anti-causal signal (non-zero for k ≤ -1)</li>
              <li>ROC extends inward from innermost pole</li>
              <li>
                {paramA > 1 ? (
                  <>Stable system (ROC includes unit circle |z| = 1)</>
                ) : (
                  <>Unstable system (ROC excludes unit circle |z| = 1)</>
                )}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignalComparisonTool; 