"use client";

import React, { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { Data, Layout } from 'plotly.js';

// Dynamically import Plotly to avoid SSR issues
const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });

// Define types for signal examples
interface SignalExample {
  name: string;
  description: string;
  zTransform: string;
  poles: ComplexPoint[];
  zeros: ComplexPoint[];
  rocType: 'inside' | 'outside' | 'annular' | 'none';
  rocRadius: number;
  signal: number[];
}

interface ComplexPoint {
  re: number;
  im: number;
}

// Define standard signal examples
const SIGNAL_EXAMPLES: Record<string, SignalExample> = {
  'unit_step': {
    name: 'Unit Step u[n]',
    description: 'u[n] = 1 for n ≥ 0, 0 otherwise',
    zTransform: '1/(1-z^(-1)) for |z| > 1',
    poles: [{ re: 1, im: 0 }],
    zeros: [],
    rocType: 'outside',
    rocRadius: 1.0,
    signal: [0, 1, 1, 1, 1, 1, 1, 1, 1, 1]
  },
  'unit_impulse': {
    name: 'Unit Impulse δ[n]',
    description: 'δ[n] = 1 for n = 0, 0 otherwise',
    zTransform: '1 for all z',
    poles: [],
    zeros: [],
    rocType: 'none',
    rocRadius: 0,
    signal: [0, 1, 0, 0, 0, 0, 0, 0, 0, 0]
  },
  'exponential': {
    name: 'Exponential a^n u[n]',
    description: 'a^n u[n] for a = 0.8',
    zTransform: '1/(1-0.8z^(-1)) for |z| > 0.8',
    poles: [{ re: 0.8, im: 0 }],
    zeros: [],
    rocType: 'outside',
    rocRadius: 0.8,
    signal: [0, 1, 0.8, 0.64, 0.512, 0.41, 0.328, 0.262, 0.21, 0.168]
  },
  'damped_sinusoid': {
    name: 'Damped Sinusoid',
    description: '0.9^n cos(0.2πn) u[n]',
    zTransform: '(1-0.9cos(0.2π)z^(-1))/(1-1.8cos(0.2π)z^(-1)+0.81z^(-2)) for |z| > 0.9',
    poles: [
      { re: 0.9 * Math.cos(0.2 * Math.PI), im: 0.9 * Math.sin(0.2 * Math.PI) }, 
      { re: 0.9 * Math.cos(0.2 * Math.PI), im: -0.9 * Math.sin(0.2 * Math.PI) }
    ],
    zeros: [{ re: 1, im: 0 }],
    rocType: 'outside',
    rocRadius: 0.9,
    signal: [0, 1, 0.809, 0.5, 0.118, -0.191, -0.366, -0.387, -0.276, -0.083]
  },
  'first_order_iir': {
    name: 'First-Order IIR',
    description: 'y[n] = 0.5x[n] + 0.5y[n-1]',
    zTransform: '0.5/(1-0.5z^(-1)) for |z| > 0.5',
    poles: [{ re: 0.5, im: 0 }],
    zeros: [],
    rocType: 'outside',
    rocRadius: 0.5,
    signal: [0, 0.5, 0.75, 0.875, 0.9375, 0.9688, 0.9844, 0.9922, 0.9961, 0.9980]
  }
};

// Custom font CSS for equations
const mathJaxConfig = {
  tex: {
    inlineMath: [['$', '$'], ['\\(', '\\)']],
    displayMath: [['$$', '$$'], ['\\[', '\\]']],
    processEscapes: true,
  },
  svg: {
    fontCache: 'global'
  }
};

interface ZTransformSciFiVisualizerProps {
  initialSignal?: string;
  initialPoles?: ComplexPoint[];
  initialZeros?: ComplexPoint[];
  width?: number;
  height?: number;
  className?: string;
  isFullscreen?: boolean;
}

const ZTransformSciFiVisualizer: React.FC<ZTransformSciFiVisualizerProps> = ({
  initialSignal = 'unit_step',
  initialPoles,
  initialZeros,
  width = 1800, // Increased default width
  height = 1000, // Increased default height
  className = '',
  isFullscreen = false
}) => {
  // State variables
  const [selectedSignal, setSelectedSignal] = useState(initialSignal);
  const [poles, setPoles] = useState<ComplexPoint[]>(initialPoles || SIGNAL_EXAMPLES[initialSignal].poles);
  const [zeros, setZeros] = useState<ComplexPoint[]>(initialZeros || SIGNAL_EXAMPLES[initialSignal].zeros);
  const [rocType, setRocType] = useState<'inside' | 'outside' | 'annular' | 'none'>(
    SIGNAL_EXAMPLES[initialSignal].rocType
  );
  const [rocRadius, setRocRadius] = useState(SIGNAL_EXAMPLES[initialSignal].rocRadius);
  const [cameraPosition, setCameraPosition] = useState({ x: 1.25, y: 1.25, z: 1.25 });
  const [rotationEnabled, setRotationEnabled] = useState(true);
  const [customSignal, setCustomSignal] = useState("");
  const [zTransformResult, setZTransformResult] = useState("");
  const [signalAmplitudes, setSignalAmplitudes] = useState<number[]>([]);
  const [axisScale, setAxisScale] = useState(1.5);
  const [showHelp, setShowHelp] = useState(false);
  const [visualizationMode, setVisualizationMode] = useState<'3d' | '2d'>('3d');
  
  // Add state for domain toggle
  const [domainView, setDomainView] = useState<'time' | 'z'>('time');
  
  const plotRef = useRef<any>(null);

  // Update state when selected signal changes
  useEffect(() => {
    if (selectedSignal && SIGNAL_EXAMPLES[selectedSignal]) {
      const signal = SIGNAL_EXAMPLES[selectedSignal];
      setPoles(signal.poles);
      setZeros(signal.zeros);
      setRocType(signal.rocType);
      setRocRadius(signal.rocRadius);
      setSignalAmplitudes(signal.signal);
      setZTransformResult(signal.zTransform);
    }
  }, [selectedSignal]);

  // Calculate plot data
  const getPlotData = (): Data[] => {
    const data: Data[] = [];
    
    // Theta values for circle drawing
    const theta = Array.from({ length: 100 }, (_, i) => (i * 2 * Math.PI) / 99);
    
    // Unit circle
    const unitCircleX = theta.map(t => Math.cos(t));
    const unitCircleY = theta.map(t => Math.sin(t));
    const unitCircleZ = theta.map(() => 0);
    
    data.push({
      x: unitCircleX,
      y: unitCircleY,
      z: unitCircleZ,
      mode: 'lines',
      type: visualizationMode === '3d' ? 'scatter3d' : 'scatter',
      line: {
        color: 'rgba(0, 220, 255, 0.8)',
        width: 3
      },
      name: 'Unit Circle',
      hoverinfo: 'name'
    });
    
    // Real and imaginary axes
    data.push({
      x: [-axisScale, axisScale],
      y: [0, 0],
      z: [0, 0],
      mode: 'lines',
      type: visualizationMode === '3d' ? 'scatter3d' : 'scatter',
      line: {
        color: 'rgba(255, 255, 255, 0.7)',
        width: 2
      },
      name: 'Real Axis',
      hoverinfo: 'name'
    });
    
    data.push({
      x: [0, 0],
      y: [-axisScale, axisScale],
      z: [0, 0],
      mode: 'lines',
      type: visualizationMode === '3d' ? 'scatter3d' : 'scatter',
      line: {
        color: 'rgba(255, 255, 255, 0.7)',
        width: 2
      },
      name: 'Imaginary Axis',
      hoverinfo: 'name'
    });
    
    // Z axis only in 3D mode
    if (visualizationMode === '3d') {
      data.push({
        x: [0, 0],
        y: [0, 0],
        z: [-axisScale, axisScale],
        mode: 'lines',
        type: 'scatter3d',
        line: {
          color: 'rgba(255, 255, 255, 0.7)',
          width: 2
        },
        name: 'Z Axis',
        hoverinfo: 'name'
      });
    }
    
    // Region of Convergence (ROC)
    if (rocType !== 'none' && rocRadius > 0) {
      const rocCircleX = theta.map(t => rocRadius * Math.cos(t));
      const rocCircleY = theta.map(t => rocRadius * Math.sin(t));
      const rocCircleZ = theta.map(() => 0);
      
      data.push({
        x: rocCircleX,
        y: rocCircleY,
        z: rocCircleZ,
        mode: 'lines',
        type: visualizationMode === '3d' ? 'scatter3d' : 'scatter',
        line: {
          color: 'rgba(255, 100, 100, 1)',
          width: 4,
          dash: 'dash',
        },
        name: 'ROC Boundary',
        hoverinfo: 'name'
      });
      
      // Add ROC fill for 2D mode
      if (visualizationMode === '2d' && (rocType === 'inside' || rocType === 'outside')) {
        if (rocType === 'inside') {
          data.push({
            x: rocCircleX,
            y: rocCircleY,
            type: 'scatter',
            fill: 'toself',
            fillcolor: 'rgba(100, 100, 255, 0.1)',
            line: { width: 0 },
            name: 'ROC (Inside)',
            hoverinfo: 'name' as any
          });
        } else if (rocType === 'outside') {
          // Need a large circle to fill outside
          const outerCircleX = theta.map(t => axisScale * Math.cos(t));
          const outerCircleY = theta.map(t => axisScale * Math.sin(t));
          
          // Combine points for the fill
          const combinedX = [...rocCircleX, ...outerCircleX.reverse(), rocCircleX[0]];
          const combinedY = [...rocCircleY, ...outerCircleY.reverse(), rocCircleY[0]];
          
          data.push({
            x: combinedX,
            y: combinedY,
            type: 'scatter',
            fill: 'toself',
            fillcolor: 'rgba(0, 255, 100, 0.1)',
            line: { width: 0 },
            name: 'ROC (Outside)',
            hoverinfo: 'name' as any
          });
        }
      }
    }
    
    // Add poles as X markers
    if (poles.length > 0) {
      data.push({
        x: poles.map(p => p.re),
        y: poles.map(p => p.im),
        z: poles.map(() => 0),
        mode: 'markers',
        type: visualizationMode === '3d' ? 'scatter3d' : 'scatter',
        marker: {
          symbol: 'x',
          size: visualizationMode === '3d' ? 8 : 12,
          color: 'rgba(255, 70, 70, 1)',
          line: {
            color: 'white',
            width: 1
          }
        },
        text: poles.map((p, i) => `Pole ${i+1}: (${p.re.toFixed(2)}, ${p.im.toFixed(2)}j)`),
        name: 'Poles',
        hoverinfo: 'text+name' as any
      });
    }
    
    // Add zeros as O markers
    if (zeros.length > 0) {
      data.push({
        x: zeros.map(z => z.re),
        y: zeros.map(z => z.im),
        z: zeros.map(() => 0),
        mode: 'markers',
        type: visualizationMode === '3d' ? 'scatter3d' : 'scatter',
        marker: {
          symbol: 'circle',
          size: visualizationMode === '3d' ? 8 : 12,
          color: 'rgba(70, 70, 255, 1)',
          line: {
            color: 'white',
            width: 1
          }
        },
        text: zeros.map((z, i) => `Zero ${i+1}: (${z.re.toFixed(2)}, ${z.im.toFixed(2)}j)`),
        name: 'Zeros',
        hoverinfo: 'text+name' as any
      });
    }

    return data;
  };

  // Enhanced layout configuration with sci-fi styling
  const getPlotLayout = (): Partial<Layout> => {
    // Common layout properties
    const commonLayout: Partial<Layout> = {
      margin: { l: 0, r: 0, t: 30, b: 20 },
      paper_bgcolor: 'rgba(10, 20, 30, 0.9)',
      plot_bgcolor: 'rgba(10, 20, 30, 0.8)',
      autosize: true,
      font: {
        family: '"Courier New", monospace',
        size: 14,
        color: '#00ffff'
      },
      title: {
        text: `Z-Transform: ${SIGNAL_EXAMPLES[selectedSignal]?.name || 'Custom Signal'}`,
        font: {
          family: '"Orbitron", "Space Mono", monospace',
          size: 18,
          color: '#00ffff'
        },
        y: 0.97
      },
      showlegend: true,
      legend: {
        x: 0.02,
        y: 0.98,
        bgcolor: 'rgba(10, 30, 50, 0.7)',
        bordercolor: '#00ffff',
        borderwidth: 1,
        font: {
          family: '"Courier New", monospace',
          size: 11,
          color: '#00ffff'
        }
      }
    };

    // Layout specific to 3D mode
    if (visualizationMode === '3d') {
      return {
        ...commonLayout,
        scene: {
        xaxis: {
            title: 'Re(z)',
          range: [-axisScale, axisScale],
            gridcolor: 'rgba(50, 150, 200, 0.2)',
            zerolinecolor: 'rgba(0, 200, 255, 0.5)',
            showbackground: true,
            backgroundcolor: 'rgba(0, 20, 40, 0.7)'
        },
        yaxis: {
            title: 'Im(z)',
          range: [-axisScale, axisScale],
            gridcolor: 'rgba(50, 150, 200, 0.2)',
            zerolinecolor: 'rgba(0, 200, 255, 0.5)',
            showbackground: true,
            backgroundcolor: 'rgba(0, 20, 40, 0.7)'
        },
        zaxis: {
            title: '|H(z)|',
          range: [-axisScale, axisScale],
            gridcolor: 'rgba(50, 150, 200, 0.2)',
            zerolinecolor: 'rgba(0, 200, 255, 0.5)',
            showbackground: true,
            backgroundcolor: 'rgba(0, 20, 40, 0.7)'
        },
        camera: {
            eye: cameraPosition
          },
          aspectratio: { x: 1, y: 1, z: 0.8 }
        }
      };
    }

    // Layout specific to 2D mode
    return {
      ...commonLayout,
      xaxis: {
        title: {
          text: 'Re(z)',
          font: {
            family: '"Courier New", monospace',
            size: 14,
            color: '#00ccff'
          },
          standoff: 5
        },
        range: [-axisScale, axisScale],
        gridcolor: 'rgba(50, 150, 200, 0.2)',
        zerolinecolor: 'rgba(0, 200, 255, 0.5)'
      },
      yaxis: {
        title: {
          text: 'Im(z)',
          font: {
            family: '"Courier New", monospace',
            size: 14,
            color: '#00ccff'
          },
          standoff: 5
        },
        range: [-axisScale, axisScale],
        gridcolor: 'rgba(50, 150, 200, 0.2)',
        zerolinecolor: 'rgba(0, 200, 255, 0.5)',
        scaleanchor: 'x',
        scaleratio: 1
      }
    };
  };

  // Handle signal selection change
  const handleSignalChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedSignal(e.target.value);
  };

  // Toggle rotation
  const toggleRotation = () => {
    setRotationEnabled(!rotationEnabled);
  };
  
  // Reset camera position
  const resetCamera = () => {
    setCameraPosition({ x: 1.25, y: 1.25, z: 1.25 });
  };
  
  // Adjust axis scale
  const handleAxisScaleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    setAxisScale(value);
  };
  
  // Parse custom signal input
  const handleCustomSignalSubmit = () => {
    try {
      const values = customSignal.split(',').map(val => parseFloat(val.trim()));
      
      if (values.every(v => !isNaN(v))) {
        setSignalAmplitudes(values);
        
        // Calculate z-transform (simplified for demonstration)
        const zTransform = `Custom signal Z-transform calculated`;
        setZTransformResult(zTransform);
      }
    } catch (error) {
      console.error("Error parsing custom signal:", error);
    }
  };

  // Toggle visualization mode between 2D and 3D
  const toggleVisualizationMode = () => {
    setVisualizationMode((currentMode) => currentMode === '3d' ? '2d' : '3d');
  };

  // Toggle domain view
  const toggleDomainView = () => {
    setDomainView(currentView => currentView === 'time' ? 'z' : 'time');
  };

  // Generate Z-domain magnitude and phase data
  const getZDomainData = () => {
    // Create z-values around the unit circle
    const numPoints = 100;
    const theta = Array.from({ length: numPoints }, (_, i) => (i * 2 * Math.PI) / (numPoints - 1));
    
    // For simplicity, we'll use a basic calculation
    // In a real application, we would use the actual Z-transform formula
    const zMagnitude = theta.map((t) => {
      // Basic calculation for demonstration
      // Use actual poles and zeros for a more accurate representation
      let mag = 1;
      
      // Apply pole effects
      poles.forEach(pole => {
        const distance = Math.sqrt(
          Math.pow(Math.cos(t) - pole.re, 2) + 
          Math.pow(Math.sin(t) - pole.im, 2)
        );
        mag /= Math.max(0.1, distance); // Avoid division by zero
      });
      
      // Apply zero effects
      zeros.forEach(zero => {
        const distance = Math.sqrt(
          Math.pow(Math.cos(t) - zero.re, 2) + 
          Math.pow(Math.sin(t) - zero.im, 2)
        );
        mag *= distance;
      });
      
      return Math.min(5, mag); // Cap the magnitude for better visualization
    });
    
    // Phase calculation - simplified for demonstration
    const zPhase = theta.map((t) => {
      // Basic phase calculation
      let phase = 0;
      
      // Add phase effects from poles and zeros
      poles.forEach(pole => {
        const angleToPole = Math.atan2(Math.sin(t) - pole.im, Math.cos(t) - pole.re);
        phase -= angleToPole;
      });
      
      zeros.forEach(zero => {
        const angleToZero = Math.atan2(Math.sin(t) - zero.im, Math.cos(t) - zero.re);
        phase += angleToZero;
      });
      
      return phase;
    });
    
    return {
      theta,
      magnitude: zMagnitude,
      phase: zPhase
    };
  };

  // Format Z-transform equations with proper mathematical notation
  const formatZTransform = (equation: string) => {
    if (!equation) return "";
    
    // Clean the equation first
    let formatted = equation.trim();
    
    // For simple equations without fractions
    if (!equation.includes('/')) {
      // Replace common patterns with formatted HTML
      formatted = formatted
        // Fix superscript notation
        .replace(/z\^\((-?\d+)\)/g, 'z<sup>$1</sup>')
        .replace(/z\^(-?\d+)/g, 'z<sup>$1</sup>')
        .replace(/z\^(\d+)/g, 'z<sup>$1</sup>')
        // Fix negative exponents that use hyphen instead of superscript
        .replace(/z-(\d+)/g, 'z<sup>-$1</sup>')
        // Handle trigonometric functions
        .replace(/cos\(([^)]+)\)/g, '<span class="text-green-400">cos</span>(<span class="text-pink-400">$1</span>)')
        .replace(/sin\(([^)]+)\)/g, '<span class="text-green-400">sin</span>(<span class="text-pink-400">$1</span>)')
        // Handle π symbol
        .replace(/π/g, '<span class="text-pink-400">π</span>')
        // Handle common symbols and conditions
        .replace(/\|z\|/g, '<span class="text-cyan-400">|z|</span>')
        .replace(/ for all z/g, ' for <span class="text-cyan-400">all z</span>')
        .replace(/ for \|z\| > ([0-9.]+)/g, ' for <span class="text-cyan-400">|z| > $1</span>');
      
      return formatted;
    }
    
    // Handle fractions
    const parts = equation.split(' for ');
    const fractionPart = parts[0];
    const conditionPart = parts.length > 1 ? parts[1] : '';
    
    // Unit Step: 1/(1-z^(-1)) for |z| > 1
    if (fractionPart.startsWith('1/') && fractionPart.includes('1-') && fractionPart.includes('z')) {
      const numerator = '1';
      
      // Extract the denominator, fixing any superscript issues
      let denominator = fractionPart.substring(2).replace(/^\(|\)$/g, '');
      denominator = denominator
        .replace(/z\^\((-?\d+)\)/g, 'z<sup>$1</sup>')
        .replace(/z\^(-?\d+)/g, 'z<sup>$1</sup>')
        .replace(/z-(\d+)/g, 'z<sup>-$1</sup>');
      
      // Format the condition part
      const formattedCondition = conditionPart
        .replace(/\|z\|/g, '<span class="text-cyan-400">|z|</span>')
        .replace(/> ([0-9.]+)/g, '> <span class="text-cyan-400">$1</span>');
      
      return `
        <div class="inline-flex flex-col items-center">
          <div class="px-4 py-1 border-b border-cyan-400 text-center">${numerator}</div>
          <div class="px-4 py-1 text-center">${denominator}</div>
        </div>
        ${conditionPart ? `<span class="ml-2">for ${formattedCondition}</span>` : ''}
      `;
    }
    
    // Complex fraction with numerator and denominator: (n)/(d)
    if (fractionPart.includes(')/(')) {
      // Split into numerator and denominator
      const [numeratorWithParens, denominatorWithParens] = fractionPart.split(')/(');
      
      // Clean up the parts
      const numerator = numeratorWithParens.replace(/^\(/, '');
      const denominator = denominatorWithParens.replace(/\)$/, '');
      
      // Format numerator and denominator individually
      const formattedNum = numerator
        .replace(/z\^\((-?\d+)\)/g, 'z<sup>$1</sup>')
        .replace(/z\^(-?\d+)/g, 'z<sup>$1</sup>')
        .replace(/z-(\d+)/g, 'z<sup>-$1</sup>')
        .replace(/cos\(([^)]+)\)/g, '<span class="text-green-400">cos</span>(<span class="text-pink-400">$1</span>)')
        .replace(/sin\(([^)]+)\)/g, '<span class="text-green-400">sin</span>(<span class="text-pink-400">$1</span>)')
        .replace(/π/g, '<span class="text-pink-400">π</span>');
      
      const formattedDenom = denominator
        .replace(/z\^\((-?\d+)\)/g, 'z<sup>$1</sup>')
        .replace(/z\^(-?\d+)/g, 'z<sup>$1</sup>')
        .replace(/z-(\d+)/g, 'z<sup>-$1</sup>')
        .replace(/cos\(([^)]+)\)/g, '<span class="text-green-400">cos</span>(<span class="text-pink-400">$1</span>)')
        .replace(/sin\(([^)]+)\)/g, '<span class="text-green-400">sin</span>(<span class="text-pink-400">$1</span>)')
        .replace(/π/g, '<span class="text-pink-400">π</span>');
      
      // Format the condition part
      const formattedCondition = conditionPart
        .replace(/\|z\|/g, '<span class="text-cyan-400">|z|</span>')
        .replace(/> ([0-9.]+)/g, '> <span class="text-cyan-400">$1</span>');
      
      return `
        <div class="inline-flex flex-col items-center">
          <div class="px-4 py-1 border-b border-cyan-400 text-center">${formattedNum}</div>
          <div class="px-4 py-1 text-center">${formattedDenom}</div>
      </div>
        ${conditionPart ? `<span class="ml-2">for ${formattedCondition}</span>` : ''}
      `;
    }
    
    // Simple fraction without complex parts: a/b
    const [numerator, denominator] = fractionPart.split('/');
    
    // Format the condition part
    const formattedCondition = conditionPart
      .replace(/\|z\|/g, '<span class="text-cyan-400">|z|</span>')
      .replace(/> ([0-9.]+)/g, '> <span class="text-cyan-400">$1</span>');
    
    return `
      <div class="inline-flex flex-col items-center">
        <div class="px-4 py-1 border-b border-cyan-400 text-center">${numerator}</div>
        <div class="px-4 py-1 text-center">${denominator}</div>
          </div>
      ${conditionPart ? `<span class="ml-2">for ${formattedCondition}</span>` : ''}
    `;
  };

  // Render the component
  return (
    <div className={`z-transform-visualizer relative ${className}`} style={{ width: '100%', maxWidth: `${width}px`, margin: '0 auto' }}>
      {/* Main sci-fi themed container */}
      <div className="sci-fi-container bg-gradient-to-br from-gray-950 to-gray-900 rounded-xl border border-cyan-800/30 overflow-hidden shadow-xl">
        {/* Visualization and control panel layout */}
        <div className="flex flex-col lg:flex-row">
          {/* Visualization area */}
          <div className="visualization-area lg:w-3/4 p-4">
            {visualizationMode === '3d' ? (
              // 3D Visualization
              <div className="relative bg-gray-950 rounded-lg overflow-hidden border border-cyan-900/40" style={{ height: isFullscreen ? '85vh' : '65vh', minHeight: '25rem' }}>
                <div 
                  className="animate-pulse absolute top-4 left-4 bg-blue-900/40 px-3 py-1 rounded-md text-cyan-300 text-sm border border-cyan-800/30 z-10 font-mono"
                >
                  Z-PLANE VISUALIZATION v2.1
          </div>
          
                {/* Plot container */}
                <div className="w-full h-full">
                  <Plot
                    ref={plotRef}
                    data={getPlotData()}
                    layout={{
                      ...getPlotLayout(),
                      width: undefined,  // Let it be responsive
                      height: undefined, // Let it be responsive
                      autosize: true
                    }}
                    config={{
                      displayModeBar: true,
                      responsive: true,
                      scrollZoom: true,
                      displaylogo: false,
                      modeBarButtonsToRemove: ['lasso2d', 'select2d', 'autoScale2d']
                    }}
                    style={{ width: '100%', height: '100%' }}
                    useResizeHandler={true}
                  />
                </div>
              </div>
            ) : (
              // 2D Visualization
              <div className="relative bg-gray-950 rounded-lg overflow-hidden border border-cyan-900/40" style={{ height: isFullscreen ? '85vh' : '65vh', minHeight: '25rem' }}>
                <div 
                  className="animate-pulse absolute top-4 left-4 bg-blue-900/40 px-3 py-1 rounded-md text-cyan-300 text-sm border border-cyan-800/30 z-10 font-mono"
                >
                  Z-PLANE 2D VIEW v1.5
                </div>
                
                {/* Plot container */}
                <div className="w-full h-full">
                  <Plot
                    ref={plotRef}
                    data={getPlotData()}
                    layout={{
                      ...getPlotLayout(),
                      width: undefined,  // Let it be responsive
                      height: undefined, // Let it be responsive
                      autosize: true
                    }}
                    config={{
                      displayModeBar: true,
                      responsive: true,
                      scrollZoom: true,
                      displaylogo: false
                    }}
                    style={{ width: '100%', height: '100%' }}
                    useResizeHandler={true}
                  />
                </div>
              </div>
            )}
            
            {/* Domain signal plots with toggle */}
            <div className="mt-5">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-xl text-cyan-400 font-orbitron">
                  {domainView === 'time' ? 'Time Domain Signal' : 'Z-Domain Representation'}
                </h3>
              <button
                  onClick={toggleDomainView}
                  className="bg-gray-800 hover:bg-gray-700 text-cyan-300 hover:text-cyan-200 py-1 px-3 rounded-lg text-sm font-bold border border-cyan-900/30 transition-all nerd-font flex items-center"
              >
                  <span>View {domainView === 'time' ? 'Z-Domain' : 'Time Domain'}</span>
                  <span className="ml-2">⇄</span>
              </button>
            </div>
              
              <div className="bg-gray-900 rounded-lg border border-cyan-900/30 p-4">
                {domainView === 'time' ? (
                  // Time Domain Plot
                  <div className="h-40 md:h-48 lg:h-52">
                    <Plot
                      data={[
                        {
                          x: Array.from({ length: signalAmplitudes.length }, (_, i) => i),
                          y: signalAmplitudes,
                          type: 'scatter',
                          mode: 'lines+markers',
                          marker: { color: '#00ffff', size: 8 },
                          line: { color: '#00cfff', width: 3 }
                        }
                      ]}
                      layout={{
                        title: '',
                        margin: { l: 50, r: 30, t: 10, b: 50 },
                        xaxis: { title: 'n', gridcolor: '#333', zerolinecolor: '#555' },
                        yaxis: { title: 'x[n]', gridcolor: '#333', zerolinecolor: '#555' },
                        plot_bgcolor: '#111827',
                        paper_bgcolor: '#111827',
                        font: { color: '#ecf0f1' },
                        showlegend: false,
                        autosize: true
                      }}
                      config={{
                        displayModeBar: false,
                        responsive: true
                      }}
                      style={{ width: '100%', height: '100%' }}
                      useResizeHandler={true}
                    />
                  </div>
                ) : (
                  // Z-Domain Plot
                  <div className="h-40 md:h-48 lg:h-52">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
                      {/* Magnitude Response */}
                      <div className="h-full">
                        <Plot
                          data={[
                            {
                              x: getZDomainData().theta.map(t => t / Math.PI),
                              y: getZDomainData().magnitude,
                              type: 'scatter',
                              mode: 'lines',
                              line: { color: '#00ffaa', width: 3 },
                              name: 'Magnitude'
                            }
                          ]}
                          layout={{
                            title: 'Magnitude Response',
                            titlefont: { size: 14, color: '#00ffaa' },
                            margin: { l: 40, r: 10, t: 30, b: 40 },
                            xaxis: { 
                              title: 'ω/π', 
                              gridcolor: '#333', 
                              zerolinecolor: '#555',
                              tickvals: [0, 1, 2],
                              ticktext: ['0', 'π', '2π']
                            },
                            yaxis: { 
                              title: '|H(e^jω)|', 
                              gridcolor: '#333', 
                              zerolinecolor: '#555' 
                            },
                            plot_bgcolor: '#111827',
                            paper_bgcolor: '#111827',
                            font: { color: '#ecf0f1', size: 10 },
                            showlegend: false,
                            autosize: true
                          }}
                          config={{
                            displayModeBar: false,
                            responsive: true
                          }}
                          style={{ width: '100%', height: '100%' }}
                          useResizeHandler={true}
                        />
          </div>
          
                      {/* Phase Response */}
                      <div className="h-full">
                        <Plot
                          data={[
                            {
                              x: getZDomainData().theta.map(t => t / Math.PI),
                              y: getZDomainData().phase,
                              type: 'scatter',
                              mode: 'lines',
                              line: { color: '#ff66aa', width: 3 },
                              name: 'Phase'
                            }
                          ]}
                          layout={{
                            title: 'Phase Response',
                            titlefont: { size: 14, color: '#ff66aa' },
                            margin: { l: 40, r: 10, t: 30, b: 40 },
                            xaxis: { 
                              title: 'ω/π', 
                              gridcolor: '#333', 
                              zerolinecolor: '#555',
                              tickvals: [0, 1, 2],
                              ticktext: ['0', 'π', '2π']
                            },
                            yaxis: { 
                              title: '∠H(e^jω)', 
                              gridcolor: '#333', 
                              zerolinecolor: '#555' 
                            },
                            plot_bgcolor: '#111827',
                            paper_bgcolor: '#111827',
                            font: { color: '#ecf0f1', size: 10 },
                            showlegend: false,
                            autosize: true
                          }}
                          config={{
                            displayModeBar: false,
                            responsive: true
                          }}
                          style={{ width: '100%', height: '100%' }}
                          useResizeHandler={true}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Control panel */}
          <div className="control-panel lg:w-1/4 p-5 bg-gray-900/80 border-l-2 border-t-2 lg:border-t-0 border-cyan-900/30">
            <div className="sticky top-4">
              <div className="mb-6 text-center">
                <h2 className="text-2xl font-orbitron text-cyan-400 mb-2">Control Panel</h2>
                <div className="h-1 w-full bg-gradient-to-r from-transparent via-cyan-700 to-transparent rounded-full"></div>
              </div>
              
              {/* Signal Selection */}
              <div className="control-group mb-6">
                <label className="block text-lg font-bold text-cyan-300 mb-2 nerd-font">Signal Type</label>
                <select 
                  value={selectedSignal} 
                  onChange={handleSignalChange}
                  className="w-full p-3 bg-gray-800 text-cyan-100 border-2 border-cyan-800/50 rounded-lg focus:border-cyan-600 focus:outline-none focus:ring-2 focus:ring-cyan-600/50 appearance-none cursor-pointer nerd-font text-base"
                  style={{ 
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%2300b4d8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 0.75rem center',
                    paddingRight: '2.5rem'
                  }}
                >
                  <option value="unit_step">Unit Step u[n]</option>
                  <option value="unit_impulse">Unit Impulse δ[n]</option>
                  <option value="exponential">Exponential 0.8^n</option>
                  <option value="damped_sinusoid">Damped Sinusoid</option>
                  <option value="first_order_iir">First-Order IIR</option>
                </select>
              </div>
              
              {/* Visualization Mode Toggle */}
              <div className="control-group mb-6">
                <label className="block text-lg font-bold text-cyan-300 mb-2 nerd-font">Visualization Mode</label>
                <div className="flex">
                <button
                  onClick={toggleVisualizationMode}
                    className={`w-full py-3 px-4 rounded-lg text-lg font-bold transition-all border-2 ${
                    visualizationMode === '3d' 
                        ? 'bg-blue-700 text-white border-blue-500 shadow-inner shadow-blue-500/50'
                        : 'bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-700 hover:border-gray-600'
                    }`}
                  >
                    {visualizationMode === '3d' ? '3D View' : '2D View'}
                </button>
              </div>
                </div>
              
              {/* Axis Scale Slider */}
              <div className="control-group mb-6">
                <label className="block text-lg font-bold text-cyan-300 mb-2 nerd-font">Axis Scale: {axisScale.toFixed(1)}</label>
                <input
                  type="range"
                  min="1"
                  max="5"
                  step="0.1"
                  value={axisScale}
                  onChange={handleAxisScaleChange}
                  className="w-full h-4 bg-gray-800 rounded-lg appearance-none cursor-pointer slider-thumb"
                />
              </div>
              
              {/* Z-Transform Information */}
              <div className="control-group mb-6 p-4 rounded-lg border-2 border-cyan-800/50 bg-gradient-to-br from-gray-950 to-gray-900 shadow-lg shadow-cyan-900/10">
                <h3 className="text-xl font-bold text-cyan-300 mb-3 font-orbitron text-center">Z-Transform</h3>
                <div 
                  className="p-5 rounded-lg bg-gray-900/80 border-2 border-cyan-800/40 text-cyan-100 font-mono break-words text-base md:text-lg flex items-center justify-center min-h-16 z-transform-equation"
                  dangerouslySetInnerHTML={{ __html: formatZTransform(zTransformResult) || "X(z) = ∑ x[n]·z<sup>-n</sup>" }}
                />
              </div>
              
              {/* Camera Controls (only in 3D mode) */}
              {visualizationMode === '3d' && (
                <div className="control-group mb-6">
                  <h3 className="text-lg font-bold text-cyan-300 mb-2 nerd-font">Camera Controls</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={toggleRotation}
                      className={`py-2 px-3 rounded-lg font-bold transition-all border-2 ${
                        rotationEnabled
                          ? 'bg-indigo-700 text-white border-indigo-500 shadow-indigo-500/30'
                          : 'bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-700'
                      }`}
                    >
                      {rotationEnabled ? 'Rotation: ON' : 'Rotation: OFF'}
                    </button>
                    
                <button
                  onClick={resetCamera}
                      className="bg-gray-800 hover:bg-gray-700 text-gray-300 py-2 px-3 rounded-lg font-bold border-2 border-gray-700 hover:border-gray-600"
                >
                      Reset View
                </button>
                  </div>
                </div>
              )}
              
              {/* Add domain view toggle to control panel */}
              <div className="control-group mb-6">
                <label className="block text-lg font-bold text-cyan-300 mb-2 nerd-font">Domain View</label>
                <div className="flex">
                  <button
                    onClick={toggleDomainView}
                    className={`w-full py-3 px-4 rounded-lg text-lg font-bold transition-all border-2 ${
                      domainView === 'z'
                        ? 'bg-green-700 text-white border-green-500 shadow-inner shadow-green-500/50'
                        : 'bg-purple-700 text-white border-purple-500 shadow-inner shadow-purple-500/50'
                    }`}
                  >
                    {domainView === 'time' ? 'Time Domain' : 'Z Domain'}
                  </button>
                </div>
              </div>
              
              {/* Help Button */}
              <div className="mt-6 text-center">
              <button
                onClick={() => setShowHelp(!showHelp)}
                  className="inline-flex items-center justify-center bg-gray-800 hover:bg-gray-700 text-cyan-300 hover:text-cyan-200 py-3 px-4 rounded-lg font-bold border-2 border-cyan-900/30 hover:border-cyan-800/50 transition-all nerd-font"
              >
                  <span className="mr-2">{showHelp ? 'Hide Help' : 'Show Help'}</span>
                  <span>{showHelp ? '👁️' : '❓'}</span>
              </button>
              </div>
            </div>
          </div>
            </div>
          </div>
          
      {/* Help Modal */}
          {showHelp && (
        <div className="help-modal fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="max-w-2xl w-full bg-gray-900 border-2 border-cyan-800 rounded-xl shadow-2xl shadow-cyan-900/20 p-6 relative">
            <button 
              onClick={() => setShowHelp(false)}
              className="absolute top-3 right-3 text-gray-400 hover:text-white text-2xl"
            >
              ×
            </button>
            
            <h2 className="text-2xl font-orbitron text-cyan-400 mb-4">Z-Transform Visualizer Help</h2>
            
            <div className="space-y-4 text-cyan-100 nerd-font">
              <p>
                This tool visualizes the Z-transform in both 2D and 3D space, showing poles, zeros, and the region of convergence.
              </p>
              
              <div className="bg-gray-950 rounded-lg p-4 border border-cyan-900/30">
                <h3 className="text-lg font-bold text-cyan-300 mb-2">Controls:</h3>
                <ul className="list-disc pl-5 space-y-2">
                  <li><span className="text-cyan-400 font-bold">Signal Type:</span> Choose from predefined signals to see their Z-transform representation</li>
                  <li><span className="text-cyan-400 font-bold">Visualization Mode:</span> Toggle between 2D and 3D views</li>
                  <li><span className="text-cyan-400 font-bold">Axis Scale:</span> Adjust the size of the coordinate axes</li>
                  <li><span className="text-cyan-400 font-bold">Rotation:</span> Enable/disable automatic rotation (3D mode only)</li>
                  <li><span className="text-cyan-400 font-bold">Reset View:</span> Return to default camera position (3D mode only)</li>
              </ul>
            </div>
              
              <div className="bg-gray-950 rounded-lg p-4 border border-cyan-900/30">
                <h3 className="text-lg font-bold text-cyan-300 mb-2">Legend:</h3>
                <ul className="list-none space-y-2">
                  <li><span className="inline-block w-3 h-3 bg-red-500 rounded-full mr-2"></span> <span className="text-cyan-400 font-bold">Poles:</span> Critical points where the Z-transform has singularities</li>
                  <li><span className="inline-block w-3 h-3 border-2 border-blue-500 rounded-full mr-2"></span> <span className="text-cyan-400 font-bold">Zeros:</span> Points where the Z-transform equals zero</li>
                  <li><span className="inline-block w-8 h-0.5 bg-cyan-400 mr-2"></span> <span className="text-cyan-400 font-bold">Unit Circle:</span> Circle with radius = 1</li>
                  <li><span className="inline-block w-8 h-0.5 bg-red-400 border-b border-dashed mr-2"></span> <span className="text-cyan-400 font-bold">ROC Boundary:</span> Region of Convergence boundary</li>
                </ul>
              </div>
              
              <p>
                <span className="text-cyan-400 font-bold">Interactive Features:</span> You can zoom, pan, and rotate the visualization using mouse controls. Click and drag to rotate, scroll to zoom, and right-click drag to pan.
              </p>
              </div>
            
            <div className="mt-6 text-center">
              <button 
                onClick={() => setShowHelp(false)}
                className="bg-cyan-700 hover:bg-cyan-600 text-white font-bold py-3 px-8 rounded-lg border border-cyan-600 shadow-lg shadow-cyan-900/20 transition-all nerd-font"
              >
                Got it!
              </button>
              </div>
            </div>
          </div>
      )}
      
      <style jsx>{`
        .sci-fi-container {
          box-shadow: 0 0 2rem rgba(0, 180, 255, 0.15);
        }
        .nerd-font {
          font-family: 'Comic Neue', 'Courier New', monospace;
          font-weight: 700;
        }
        /* Custom slider thumb */
        .slider-thumb::-webkit-slider-thumb {
          appearance: none;
          width: 1.5rem;
          height: 1.5rem;
          border-radius: 50%;
          background: #00b4d8;
          border: 2px solid #0077b6;
          box-shadow: 0 0 0.6rem rgba(0, 180, 255, 0.5);
          cursor: pointer;
        }
        .slider-thumb::-moz-range-thumb {
          width: 1.5rem;
          height: 1.5rem;
          border-radius: 50%;
          background: #00b4d8;
          border: 2px solid #0077b6;
          box-shadow: 0 0 0.6rem rgba(0, 180, 255, 0.5);
          cursor: pointer;
        }
        .z-transform-equation {
          text-shadow: 0 0 5px rgba(0, 200, 255, 0.3);
          letter-spacing: 0.05rem;
          font-family: 'Fira Code', 'Space Mono', monospace;
        }
        .z-transform-equation sup {
          font-size: 0.75em;
          position: relative;
          top: -0.5em;
          color: #4ade80;
        }
        .z-transform-equation span.text-cyan-400 {
          color: #22d3ee;
          font-weight: bold;
        }
        .z-transform-equation span.text-pink-400 {
          color: #f472b6;
        }
        .z-transform-equation span.text-green-400 {
          color: #4ade80;
          font-weight: bold;
        }
      `}</style>
    </div>
  );
};

export default ZTransformSciFiVisualizer; 
