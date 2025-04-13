"use client";

import React, { useState, useEffect, useRef, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { Data, Layout } from 'plotly.js';
import { ComplexPoint } from '../types/complex';
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';

// Improved dynamic import for Plotly
const Plot = dynamic(
  () => {
    // Force client-side only import with explicit namespace for webpack
    return import(/* webpackChunkName: "plotly" */ 'react-plotly.js')
      .then(mod => {
        console.log('Successfully loaded Plotly.js');
        // Add hover event protection to prevent _hoversubplot null error
        if (typeof window !== 'undefined') {
          window.addEventListener('error', (e) => {
            // Catch and suppress the specific Plotly error
            if (e.message && (
              e.message.includes('_hoversubplot = null') || 
              e.message.includes('undefined is not an object') ||
              e.message.includes('gd._fullLayout')
            )) {
              console.warn('Suppressed Plotly hover error:', e.message);
              e.preventDefault();
              e.stopPropagation();
              return true; // Prevent default error handling
            }
          }, true);
        }
        return mod.default;
      })
      .catch(err => {
        console.error('Failed to load Plotly.js:', err);
        // Return a placeholder component when loading fails
        return () => (
          <div className="flex items-center justify-center w-full h-full bg-gray-900 text-cyan-400 p-4">
            <div className="text-center">
              <p className="mb-2">Visualization library failed to load.</p>
              <button 
                onClick={() => window.location.reload()} 
                className="px-3 py-1 bg-cyan-800 hover:bg-cyan-700 text-white rounded"
              >
                Reload Page
              </button>
            </div>
          </div>
        );
      });
  },
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center w-full h-full bg-gray-900 text-cyan-400">
        <div className="animate-pulse">Loading Z-Transform Visualizer...</div>
      </div>
    )
  }
);

// Define types for signal examples
interface SignalExample {
  name: string;
  description: string;
  poles: ComplexPoint[];
  zeros: ComplexPoint[];
  rocType: 'inside' | 'outside' | 'annular' | 'none';
  rocRadius: number;
  timeEquation?: string;  // LaTeX equation for time domain
  zEquation?: string;     // LaTeX equation for Z-domain
  isCausal?: boolean;     // System causality
  isStable?: boolean;     // System stability
  notes?: string;         // Additional notes
}

// Define standard signal examples
const SIGNAL_EXAMPLES: Record<string, SignalExample> = {
  'unit_step': {
    name: 'Unit Step',
    description: 'u[n] = 1 for n ≥ 0, 0 otherwise',
    poles: [{ re: 1, im: 0 }],
    zeros: [],
    rocType: 'outside',
    rocRadius: 1.0,
    timeEquation: 'u[n]',
    zEquation: '\\frac{z}{z-1}',
    isCausal: true,
    isStable: false,
    notes: 'Fundamental causal sequence, marginally stable due to pole on unit circle'
  },
  'unit_impulse': {
    name: 'Unit Impulse',
    description: 'δ[n] = 1 for n = 0, 0 otherwise',
    poles: [],
    zeros: [],
    rocType: 'none',
    rocRadius: 0,
    timeEquation: '\\delta[n]',
    zEquation: '1',
    isCausal: true,
    isStable: true,
    notes: 'Fundamental sequence, convergent for all z'
  },
  'exponential': {
    name: 'Exponential',
    description: 'a^n u[n] for a = 0.8',
    poles: [{ re: 0.8, im: 0 }],
    zeros: [],
    rocType: 'outside',
    rocRadius: 0.8,
    timeEquation: '0.8^n u[n]',
    zEquation: '\\frac{z}{z-0.8}',
    isCausal: true,
    isStable: true,
    notes: 'Decaying exponential, causal and stable since |a| < 1'
  },
  'damped_sinusoid': {
    name: 'Damped Sinusoid',
    description: '0.9^n cos(0.2πn) u[n]',
    poles: [
      { re: 0.9 * Math.cos(0.2 * Math.PI), im: 0.9 * Math.sin(0.2 * Math.PI) }, 
      { re: 0.9 * Math.cos(0.2 * Math.PI), im: -0.9 * Math.sin(0.2 * Math.PI) }
    ],
    zeros: [{ re: 1, im: 0 }],
    rocType: 'outside',
    rocRadius: 0.9,
    timeEquation: '0.9^n \\cos(0.2\\pi n) u[n]',
    zEquation: '\\frac{z(z-\\cos(0.2\\pi))}{z^2-2(0.9)z\\cos(0.2\\pi)+(0.9)^2}',
    isCausal: true,
    isStable: true,
    notes: 'Complex conjugate poles create oscillation, damping factor ensures stability'
  },
  'first_order_iir': {
    name: 'First-Order IIR',
    description: 'y[n] = 0.5x[n] + 0.5y[n-1]',
    poles: [{ re: 0.5, im: 0 }],
    zeros: [],
    rocType: 'outside',
    rocRadius: 0.5,
    timeEquation: 'h[n] = 0.5^n u[n]',
    zEquation: '\\frac{0.5}{1-0.5z^{-1}}',
    isCausal: true,
    isStable: true,
    notes: 'Simple low-pass filter, causal and stable since pole at 0.5 is inside unit circle'
  },
  'sine': {
    name: 'Sine Wave',
    description: 'sin(ωn) u[n] for ω = π/4',
    poles: [
      { re: Math.cos(Math.PI/4), im: Math.sin(Math.PI/4) }, // e^{jω}
      { re: Math.cos(Math.PI/4), im: -Math.sin(Math.PI/4) }  // e^{-jω}
    ],
    zeros: [{ re: 0, im: 0 }], // Origin zero for sine
    rocType: 'outside',
    rocRadius: 1.0,
    timeEquation: '\\sin(\\pi n/4) u[n]',
    zEquation: '\\frac{z\\sin(\\pi/4)}{z^2-2z\\cos(\\pi/4)+1}',
    isCausal: true,
    isStable: false,
    notes: 'Poles on unit circle at e^{±jπ/4}, marginally stable'
  },
  'cosine': {
    name: 'Cosine Wave',
    description: 'cos(ωn) u[n] for ω = π/4',
    poles: [
      { re: Math.cos(Math.PI/4), im: Math.sin(Math.PI/4) }, // e^{jω}
      { re: Math.cos(Math.PI/4), im: -Math.sin(Math.PI/4) }  // e^{-jω}
    ],
    zeros: [{ re: 1, im: 0 }], // Zero at z=1 for cosine
    rocType: 'outside',
    rocRadius: 1.0,
    timeEquation: '\\cos(\\pi n/4) u[n]',
    zEquation: '\\frac{z(z-\\cos(\\pi/4))}{z^2-2z\\cos(\\pi/4)+1}',
    isCausal: true,
    isStable: false,
    notes: 'Poles on unit circle at e^{±jπ/4}, marginally stable'
  },
  'low_pass_filter': {
    name: 'Low-Pass Filter',
    description: 'Second-order Butterworth',
    poles: [
      { re: 0.7071 * Math.cos(3*Math.PI/4), im: 0.7071 * Math.sin(3*Math.PI/4) },
      { re: 0.7071 * Math.cos(5*Math.PI/4), im: 0.7071 * Math.sin(5*Math.PI/4) }
    ],
    zeros: [
      { re: -1, im: 0 }, // Zero at Nyquist frequency
      { re: -1, im: 0 }  // Second zero at Nyquist
    ],
    rocType: 'outside',
    rocRadius: 0.7071,
    timeEquation: 'See Butterworth filter response',
    zEquation: '\\frac{0.2929(1+z^{-1})^2}{1-1.1429z^{-1}+0.4124z^{-2}}',
    isCausal: true,
    isStable: true,
    notes: 'Second-order Butterworth low-pass filter with cutoff at π/4'
  },
  'high_pass_filter': {
    name: 'High-Pass Filter',
    description: 'First-order HPF',
    poles: [{ re: 0.8, im: 0 }],
    zeros: [{ re: 1, im: 0 }], // Zero at DC (z=1)
    rocType: 'outside',
    rocRadius: 0.8,
    timeEquation: 'h[n] = (-0.8)^n + \\delta[n]',
    zEquation: '\\frac{z-1}{z-0.8}',
    isCausal: true,
    isStable: true,
    notes: 'Simple high-pass filter, attenuates low frequencies'
  },
  'band_pass_filter': {
    name: 'Band-Pass Filter',
    description: 'Resonator at ω = π/3',
    poles: [
      { re: 0.9 * Math.cos(Math.PI/3), im: 0.9 * Math.sin(Math.PI/3) },
      { re: 0.9 * Math.cos(Math.PI/3), im: -0.9 * Math.sin(Math.PI/3) }
    ],
    zeros: [
      { re: 1, im: 0 }, // Zero at DC
      { re: -1, im: 0 } // Zero at Nyquist
    ],
    rocType: 'outside',
    rocRadius: 0.9,
    timeEquation: 'h[n] = 0.9^n \\sin(\\pi n/3) u[n]',
    zEquation: '\\frac{z^2-1}{z^2-1.8z\\cos(\\pi/3)+0.81}',
    isCausal: true,
    isStable: true,
    notes: 'Passes frequencies near π/3, rejects DC and Nyquist'
  },
  'notch_filter': {
    name: 'Notch Filter',
    description: 'Rejects ω = π/4',
    poles: [
      { re: 0.9 * Math.cos(Math.PI/4), im: 0.9 * Math.sin(Math.PI/4) },
      { re: 0.9 * Math.cos(Math.PI/4), im: -0.9 * Math.sin(Math.PI/4) }
    ],
    zeros: [
      { re: Math.cos(Math.PI/4), im: Math.sin(Math.PI/4) },
      { re: Math.cos(Math.PI/4), im: -Math.sin(Math.PI/4) }
    ],
    rocType: 'outside',
    rocRadius: 0.9,
    timeEquation: 'Complex',
    zEquation: '\\frac{z^2-2z\\cos(\\pi/4)+1}{z^2-1.8z\\cos(\\pi/4)+0.81}',
    isCausal: true,
    isStable: true,
    notes: 'Notch filter with notch at ω = π/4, zeros on unit circle at notch frequency'
  },
  'square': {
    name: 'Square Wave',
    description: 'Square wave with fundamental frequency ω = π/4',
    poles: [
      { re: Math.cos(Math.PI/4), im: Math.sin(Math.PI/4) }, // e^{jω}
      { re: Math.cos(Math.PI/4), im: -Math.sin(Math.PI/4) }  // e^{-jω}
    ],
    zeros: [
      { re: 0, im: 0 }, // Origin zero
      { re: Math.cos(Math.PI/2), im: Math.sin(Math.PI/2) }, // e^{jπ/2}
      { re: Math.cos(Math.PI/2), im: -Math.sin(Math.PI/2) }  // e^{-jπ/2}
    ],
    rocType: 'outside',
    rocRadius: 1.0,
    isCausal: true,
    isStable: false,
    notes: 'Marginally stable due to poles on unit circle'
  },
  'sawtooth': {
    name: 'Sawtooth Wave',
    description: 'Sawtooth wave with fundamental frequency ω = π/4',
    poles: [
      { re: Math.cos(Math.PI/4), im: Math.sin(Math.PI/4) }, // e^{jω}
      { re: Math.cos(Math.PI/4), im: -Math.sin(Math.PI/4) }  // e^{-jω}
    ],
    zeros: [
      { re: 0, im: 0 }, // Origin zero
      { re: Math.cos(Math.PI/2), im: Math.sin(Math.PI/2) }, // e^{jπ/2}
      { re: Math.cos(Math.PI/2), im: -Math.sin(Math.PI/2) }  // e^{-jπ/2}
    ],
    rocType: 'outside',
    rocRadius: 1.0,
    isCausal: true,
    isStable: false,
    notes: 'Marginally stable due to poles on unit circle'
  },
  'triangle': {
    name: 'Triangle Wave',
    description: 'Triangle wave with fundamental frequency ω = π/4',
    poles: [
      { re: Math.cos(Math.PI/4), im: Math.sin(Math.PI/4) }, // e^{jω}
      { re: Math.cos(Math.PI/4), im: -Math.sin(Math.PI/4) }  // e^{-jω}
    ],
    zeros: [
      { re: 0, im: 0 }, // Origin zero
      { re: Math.cos(Math.PI/2), im: Math.sin(Math.PI/2) }, // e^{jπ/2}
      { re: Math.cos(Math.PI/2), im: -Math.sin(Math.PI/2) }  // e^{-jπ/2}
    ],
    rocType: 'outside',
    rocRadius: 1.0,
    isCausal: true,
    isStable: false,
    notes: 'Marginally stable due to poles on unit circle'
  },
  'all_pass': {
    name: 'All-Pass Filter',
    description: 'First-order all-pass filter',
    poles: [{ re: 0.5, im: 0 }],
    zeros: [{ re: 2, im: 0 }], // Zero at 1/a = 1/0.5 = 2
    rocType: 'outside',
    rocRadius: 0.5,
    timeEquation: 'h[n] = a^n u[n] - (1-a^2)\\delta[n]',
    zEquation: '\\frac{z^{-1}-0.5}{1-0.5z^{-1}}',
    isCausal: true,
    isStable: true,
    notes: 'Alters phase response while maintaining unity gain at all frequencies'
  },
  'custom': {
    name: 'Custom Signal',
    description: 'User-defined signal',
    poles: [],
    zeros: [],
    rocType: 'outside',
    rocRadius: 1.0,
    isCausal: true,
    isStable: true
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

type SignalType = 'unit_step' | 'unit_impulse' | 'exponential' | 'damped_sinusoid' | 'first_order_iir' | 'sine' | 'cosine' | 'square' | 'sawtooth' | 'triangle' | 'custom';

interface ZTransformSciFiVisualizerProps {
  width: number;
  height: number;
  className?: string;
  isFullscreen?: boolean;
  initialSignal?: SignalType;
  initialPoles?: ComplexPoint[];
  initialZeros?: ComplexPoint[];
  hideSignalSelector?: boolean;
  onPolesChange?: (poles: ComplexPoint[]) => void;
  onZerosChange?: (zeros: ComplexPoint[]) => void;
}

// Define the ControlDropdown component
const ControlDropdown: React.FC<{
  title: string;
  icon: string;
  color: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}> = ({ title, icon, color, isOpen, onToggle, children }) => {
  return (
    <div className={`p-3 bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg border border-${color}-800/30 shadow-inner terminal-panel mb-3`}>
      <div 
        className="flex items-center justify-between cursor-pointer" 
        onClick={onToggle}
      >
        <div className="flex items-center">
          <div className={`w-2 h-2 rounded-full bg-${color}-500 mr-2 pulse-slow`}></div>
          <h3 className={`text-lg text-${color}-300 font-mono tracking-wide`}>{title}</h3>
        </div>
        <div className={`text-${color}-300 transition-transform duration-300 ${isOpen ? 'transform rotate-180' : ''}`}>
          {icon === 'triangle' ? '▼' : '▼'}
        </div>
      </div>
      
      {isOpen && (
        <div className="mt-3 transition-all duration-300 ease-in-out">
          {children}
        </div>
      )}
    </div>
  );
};

const ZTransformSciFiVisualizer: React.FC<ZTransformSciFiVisualizerProps> = ({
  width,
  height,
  className = '',
  isFullscreen = false,
  initialSignal = 'unit_step',
  initialPoles = [],
  initialZeros = [],
  hideSignalSelector = false,
  onPolesChange,
  onZerosChange
}) => {
  // Ensure initialSignal is a valid key before using it
  const safeInitialSignal = Object.keys(SIGNAL_EXAMPLES).includes(initialSignal) 
    ? initialSignal 
    : 'unit_step';
    
  const [selectedSignal, setSelectedSignal] = useState<SignalType>(safeInitialSignal as SignalType);
  const [poles, setPoles] = useState<ComplexPoint[]>(initialPoles);
  const [zeros, setZeros] = useState<ComplexPoint[]>(initialZeros);
  const [rocType, setRocType] = useState<'inside' | 'outside' | 'annular' | 'none'>(
    SIGNAL_EXAMPLES[safeInitialSignal]?.rocType || 'outside'
  );
  const [rocRadius, setRocRadius] = useState(SIGNAL_EXAMPLES[safeInitialSignal]?.rocRadius || 1.0);
  const [cameraPosition, setCameraPosition] = useState({ x: 1.25, y: 1.25, z: 1.25 });
  const [rotationEnabled, setRotationEnabled] = useState(true);
  const [customSignal, setCustomSignal] = useState("");
  const [zTransformResult, setZTransformResult] = useState("");
  const [axisScale, setAxisScale] = useState(1.5);
  const [showHelp, setShowHelp] = useState(false);
  const [visualizationMode, setVisualizationMode] = useState<'3d' | '2d'>('3d');
  
  // Remove domain toggle state
  const [editorMode, setEditorMode] = useState<'add_pole' | 'add_zero' | 'move' | 'delete'>('move');
  
  // Add these new state variables
  const [surfaceQuality, setSurfaceQuality] = useState<'low' | 'medium' | 'high'>('medium');
  const [showContours, setShowContours] = useState(true);
  const [surfaceView, setSurfaceView] = useState<'magnitude' | 'phase'>('magnitude');
  const [viewPreset, setViewPreset] = useState<'top' | 'side' | 'perspective'>('perspective');
  const [showFrequencyResponse, setShowFrequencyResponse] = useState(false);
  
  // Add this new state variable
  const [showEducation, setShowEducation] = useState(false);
  const [educationTab, setEducationTab] = useState<'basics' | 'properties' | 'applications' | 'examples'>('basics');
  const [showTimeResponse, setShowTimeResponse] = useState(false);
  const [showImpulseResponse, setShowImpulseResponse] = useState(false);
  const [showBodePlot, setShowBodePlot] = useState(false);
  const [systemProperties, setSystemProperties] = useState({
    isCausal: true,
    isStable: false,
    isMinimumPhase: false,
    hasLinearPhase: false
  });
  
  // Dropdown open states
  const [visualizationDropdownOpen, setVisualizationDropdownOpen] = useState(true);
  const [systemPropertiesDropdownOpen, setSystemPropertiesDropdownOpen] = useState(true);
  const [timeResponseDropdownOpen, setTimeResponseDropdownOpen] = useState(true);
  const [advancedVisualizationDropdownOpen, setAdvancedVisualizationDropdownOpen] = useState(false);
  const [bodePlotDropdownOpen, setBodePlotDropdownOpen] = useState(false);
  const [signalPresetsDropdownOpen, setSignalPresetsDropdownOpen] = useState(false);
  // Z-transform type state
  const [transformType, setTransformType] = useState<'unilateral' | 'bilateral'>('unilateral');
  
  const plotRef = useRef<any>(null);

  // Add state for selected poles and zeros
  const [selectedPoleIndex, setSelectedPoleIndex] = useState<number | null>(null);
  const [selectedZeroIndex, setSelectedZeroIndex] = useState<number | null>(null);

  // Add a debounce flag to prevent multiple rapid clicks
  const [isAddingPoint, setIsAddingPoint] = useState(false);

  // Consolidated useEffect hook for initialization and prop changes
  useEffect(() => {
    // Determine which signal to use (from props or default)
    const signal = Object.keys(SIGNAL_EXAMPLES).includes(initialSignal) 
      ? initialSignal 
      : 'unit_step';
    
    // Set the selected signal
    setSelectedSignal(signal as SignalType);
    
    // Determine which poles/zeros to use (from props or from signal example)
    const currentSignal = SIGNAL_EXAMPLES[signal as SignalType];
    const polesToUse = initialPoles.length > 0 ? initialPoles : currentSignal.poles;
    const zerosToUse = initialZeros.length > 0 ? initialZeros : currentSignal.zeros;
    
    // Update state
    setPoles(polesToUse);
    setZeros(zerosToUse);
    setRocType(currentSignal.rocType);
    setRocRadius(currentSignal.rocRadius);
    
    // Update Z-transform expression
    updateZTransformExpression();
    // React to changes in initial props
  }, [initialSignal, initialPoles, initialZeros]);

  // Add an effect to notify parent of pole/zero changes
  useEffect(() => {
    if (onPolesChange) {
      onPolesChange(poles);
    }
  }, [poles, onPolesChange]);

  useEffect(() => {
    if (onZerosChange) {
      onZerosChange(zeros);
    }
  }, [zeros, onZerosChange]);

  // Add this useEffect hook after the other useEffect hooks
  
  // Effect to analyze system properties when poles/zeros change
  useEffect(() => {
    // Check stability - all poles must be inside the unit circle
    const isStable = poles.every(p => Math.sqrt(p.re * p.re + p.im * p.im) < 1);
    
    // Check for minimum phase - all zeros inside unit circle
    const isMinimumPhase = zeros.every(z => Math.sqrt(z.re * z.re + z.im * z.im) < 1);
    
    // Check for linear phase - zeros are symmetric around real or imaginary axis
    const hasLinearPhase = zeros.length > 0 && zeros.every(z => 
      zeros.some(z2 => 
        (Math.abs(z.re - z2.re) < 0.001 && Math.abs(z.im + z2.im) < 0.001) || // Symmetric around real axis
        (Math.abs(z.re + z2.re) < 0.001 && Math.abs(z.im - z2.im) < 0.001)    // Symmetric around imaginary axis
      )
    );
    
    // Update system properties
    setSystemProperties(prev => ({
      ...prev,
      isStable,
      isMinimumPhase,
      hasLinearPhase
    }));
    
    // If the system is causal, set ROC type to 'outside'
    if (systemProperties.isCausal) {
      setRocType('outside');
      
      // Find the outermost pole
      if (poles.length > 0) {
        const poleRadii = poles.map(p => Math.sqrt(p.re * p.re + p.im * p.im));
        const maxRadius = Math.max(...poleRadii);
        setRocRadius(maxRadius);
      }
    }
    
    // Update Z-transform expression
    updateZTransformExpression();
  }, [poles, zeros, systemProperties.isCausal, transformType]);

  // Add this useEffect hook after the other useEffect hooks
  useEffect(() => {
    // Add auto-rotation for 3D mode
    if (visualizationMode === '3d' && rotationEnabled && plotRef.current) {
      let frameId: number;
      let angle = 0;
      
      const rotateCamera = () => {
        if (!plotRef.current || visualizationMode !== '3d' || !rotationEnabled) {
          return;
        }
        
        // Calculate new camera position
        angle += 0.005; // Speed of rotation
        const radius = 1.5; // Distance from center
        const newX = radius * Math.cos(angle);
        const newY = radius * Math.sin(angle);
        const newZ = 1.2; // Fixed height
        
        // Update camera position state
        setCameraPosition({ x: newX, y: newY, z: newZ });
        
        // Request next frame
        frameId = requestAnimationFrame(rotateCamera);
      };
      
      // Start animation
      frameId = requestAnimationFrame(rotateCamera);
      
      // Clean up on unmount or when dependencies change
      return () => {
        if (frameId) {
          cancelAnimationFrame(frameId);
        }
      };
    }
  }, [visualizationMode, rotationEnabled]);

  // Helper function to format complex numbers in LaTeX
  const formatComplexNumber = (point: ComplexPoint): string => {
    if (!point) return '0';
    
    const realPart = point.re.toFixed(2).replace(/\.00$/, '');
    const imagPart = Math.abs(point.im).toFixed(2).replace(/\.00$/, '');
    
    // Handle special cases
    if (point.im === 0) return realPart;
    if (point.re === 0) return point.im === 1 ? 'j' : point.im === -1 ? '-j' : `${point.im > 0 ? '' : '-'}${imagPart}j`;
    
    const sign = point.im >= 0 ? '+' : '-';
    return `${realPart}${sign}${imagPart}j`;
  };

  // Helper function to get Z-transform definition formula based on transform type
  const getZTransformDefinition = (): string => {
    if (transformType === 'bilateral') {
      return "X(z) = \\sum_{n=-\\infty}^{\\infty} x[n]z^{-n}";
    } else {
      return "X(z) = \\sum_{n=0}^{\\infty} x[n]z^{-n}";
    }
  };

  // Helper function to generate Z-Transform equation with improved formatting
  const generateZTransformEquation = (poles: ComplexPoint[], zeros: ComplexPoint[]): string => {
    // Format factor function
    const formatFactor = (point: ComplexPoint, isZero: boolean): string => {
      // For origin (0,0) factors
      if (point.re === 0 && point.im === 0) return isZero ? 'z' : '';
      
      // For real factor on unit circle
      if (point.im === 0 && Math.abs(point.re) === 1) {
        return point.re === 1 ? '(z-1)' : '(z+1)';
      }
      
      return `(z-(${formatComplexNumber(point)}))`;
    };
    
    // Handle zeros (numerator)
    let numerator = zeros.length === 0 ? '1' : 
                   zeros.map(zero => formatFactor(zero, true)).join(' \\cdot ');

    // Handle poles (denominator)
    let denominator = poles.length === 0 ? '1' : 
                     poles.map(pole => formatFactor(pole, false)).join(' \\cdot ');

    // Combine into final equation
    return `\\frac{${numerator}}{${denominator}}`;
  };

  // Helper function to generate ROC condition
  const generateROCCondition = (poles: ComplexPoint[], rocType: string): string => {
    if (poles.length === 0) return '\\text{ for all } z';
    
    // For bilateral Z-transform, ROC is typically an annular region
    if (transformType === 'bilateral') {
      // Find the magnitudes of all poles
      const poleMagnitudes = poles.map(p => Math.sqrt(p.re * p.re + p.im * p.im))
                                  .sort((a, b) => a - b);
      
      if (poleMagnitudes.length === 0) return '\\text{ for all } z';
      
      if (rocType === 'outside') {
        const maxPoleMagnitude = Math.max(...poleMagnitudes);
        return `\\text{ for } |z| > ${maxPoleMagnitude.toFixed(2).replace(/\.00$/, '')}`;
      } else if (rocType === 'inside') {
        const minPoleMagnitude = Math.min(...poleMagnitudes);
        return `\\text{ for } |z| < ${minPoleMagnitude.toFixed(2).replace(/\.00$/, '')}`;
      } else if (rocType === 'annular') {
        // Find two consecutive pole magnitudes for the annular region
        if (poleMagnitudes.length >= 2) {
          // Sort the pole magnitudes
          const sortedMagnitudes = [...poleMagnitudes].sort((a, b) => a - b);
          
          // Find where the ROC radius fits between pole magnitudes
          for (let i = 0; i < sortedMagnitudes.length - 1; i++) {
            if (sortedMagnitudes[i] < rocRadius && rocRadius < sortedMagnitudes[i+1]) {
              return `\\text{ for } ${sortedMagnitudes[i].toFixed(2).replace(/\.00$/, '')} < |z| < ${sortedMagnitudes[i+1].toFixed(2).replace(/\.00$/, '')}`;
            }
          }
        }
        
        // Default annular ROC message
        return '\\text{ for annular region containing } |z| = ' + rocRadius.toFixed(2).replace(/\.00$/, '');
      }
      
      return '\\text{ for annular region containing unit circle}';
    } 
    // For unilateral Z-transform, ROC depends on causality and is typically outside the largest pole
    else {
      // Find the maximum magnitude of poles for outside ROC (causal signals)
    if (rocType === 'outside') {
      const maxPoleMagnitude = Math.max(...poles.map(p => 
        Math.sqrt(p.re * p.re + p.im * p.im)
      ));
        return `\\text{ for } |z| > ${maxPoleMagnitude.toFixed(2).replace(/\.00$/, '')} \\text{ (causal)}`;
    }
    
      // Find the minimum magnitude of poles for inside ROC (anti-causal signals)
    if (rocType === 'inside') {
      const minPoleMagnitude = Math.min(...poles.map(p => 
        Math.sqrt(p.re * p.re + p.im * p.im)
      ));
        return `\\text{ for } |z| < ${minPoleMagnitude.toFixed(2).replace(/\.00$/, '')} \\text{ (anti-causal)}`;
    }
    
      // For annular ROC (between pole radiuses) - rarely used for unilateral
    return '\\text{ for annular region containing unit circle}';
    }
  };

  // Update the updateZTransformExpression function
  const updateZTransformExpression = () => {
    const equation = generateZTransformEquation(poles, zeros);
    const condition = generateROCCondition(poles, rocType);
    // Include the transform type in the expression
    const transformTypeLabel = transformType === 'bilateral' ? '\\text{ (Bilateral Z-Transform)}' : '\\text{ (Unilateral Z-Transform)}';
    setZTransformResult(`${equation}${condition}${transformTypeLabel}`);
    
    // Force a re-render on the next tick to ensure the visualization updates
    setTimeout(() => {
      const plotElement = document.querySelector('.js-plotly-plot') as HTMLElement;
      if (plotElement && plotElement.children[0]) {
        const plotDiv = plotElement.children[0] as HTMLElement;
        // Use type assertion to avoid TypeScript error
        if ((plotDiv as any)._onReplot) {
          (plotDiv as any)._onReplot();
        }
      }
    }, 10);
  };

  const handlePoleAdd = (point: ComplexPoint) => {
    // Use a callback to ensure we're working with the latest state
    setPoles(currentPoles => {
      const newPoles = [...currentPoles, point];
      console.log("Adding pole. Current poles:", currentPoles.length, "New poles:", newPoles.length);
      
      // Use a callback to ensure we're working with the latest state
      const updatedPoles = [...currentPoles, point];
      
      // Always update ROC based on the current rocType and pole positions
      setTimeout(() => {
        console.log("Updating ROC for type:", rocType);
        if (rocType === 'outside') {
          // For causal signals, ROC is outside the largest pole
          const poleRadii = updatedPoles.map(p => Math.sqrt(p.re * p.re + p.im * p.im));
          const maxRadius = Math.max(...poleRadii);
          console.log("Setting ROC radius to:", Math.max(maxRadius, 0.1), "from max pole radius:", maxRadius);
          setRocRadius(Math.max(maxRadius, 0.1));
        } else if (rocType === 'inside') {
          // For anti-causal signals, ROC is inside the smallest pole
          const poleRadii = updatedPoles.map(p => Math.sqrt(p.re * p.re + p.im * p.im));
          const minRadius = Math.min(...poleRadii);
          console.log("Setting ROC radius to:", Math.min(minRadius, 1.9), "from min pole radius:", minRadius);
          setRocRadius(Math.min(minRadius, 1.9));
        } else if (rocType === 'annular') {
          // For mixed causality signals, ROC is an annular region
          // Find two consecutive radii to place ROC between
          const sortedRadii = updatedPoles
            .map(p => Math.sqrt(p.re * p.re + p.im * p.im))
            .sort((a, b) => a - b);
          
          if (sortedRadii.length >= 2) {
            // Find a suitable annular region
            const middleRadius = (sortedRadii[0] + sortedRadii[sortedRadii.length-1]) / 2;
            console.log("Setting annular ROC radius to:", middleRadius);
            setRocRadius(middleRadius);
          }
        }
        
        // Force a re-render of the visualization
        updateZTransformExpression();
      }, 10);
      
      return updatedPoles;
    });
    
    // Force update expression in next tick
    setTimeout(() => updateZTransformExpression(), 0);
  };

  const handleZeroAdd = (point: ComplexPoint) => {
    // Use a callback to ensure we're working with the latest state
    setZeros(currentZeros => {
      const newZeros = [...currentZeros, point];
      console.log("Adding zero. Current zeros:", currentZeros.length, "New zeros:", newZeros.length);
      
      // Check minimum phase property
      const isOutsideUnitCircle = Math.sqrt(point.re * point.re + point.im * point.im) > 1;
      if (isOutsideUnitCircle && systemProperties.isMinimumPhase) {
        setTimeout(() => {
          setSystemProperties(prev => ({
            ...prev,
            isMinimumPhase: false
          }));
        }, 0);
      }
      
      return newZeros;
    });
    
    // Force update expression in next tick
    setTimeout(() => updateZTransformExpression(), 0);
  };

  const handlePoleMove = (index: number, point: ComplexPoint) => {
    // Use a callback to ensure we're working with the latest state
    setPoles(currentPoles => {
      const newPoles = [...currentPoles];
      if (index >= 0 && index < newPoles.length) {
    newPoles[index] = point;
        
        // Schedule ROC update
        if (systemProperties.isCausal && rocType === 'outside') {
          const poleRadii = newPoles.map(p => Math.sqrt(p.re * p.re + p.im * p.im));
          const maxRadius = Math.max(...poleRadii);
          setTimeout(() => setRocRadius(Math.max(maxRadius, 0.1)), 0);
        } else if (!systemProperties.isCausal && rocType === 'inside') {
          const poleRadii = newPoles.map(p => Math.sqrt(p.re * p.re + p.im * p.im));
          const minRadius = Math.min(...poleRadii);
          setTimeout(() => setRocRadius(Math.min(minRadius, 1.9)), 0);
        }
      }
      return newPoles;
    });
    
    // Force update expression in next tick
    setTimeout(() => updateZTransformExpression(), 0);
  };

  const handleZeroMove = (index: number, point: ComplexPoint) => {
    // Use a callback to ensure we're working with the latest state
    setZeros(currentZeros => {
      const newZeros = [...currentZeros];
      if (index >= 0 && index < newZeros.length) {
        const oldZero = newZeros[index];
    newZeros[index] = point;
        
        // Check if minimum phase property changed
        const wasOutsideUnitCircle = Math.sqrt(oldZero.re * oldZero.re + oldZero.im * oldZero.im) > 1;
        const isOutsideUnitCircle = Math.sqrt(point.re * point.re + point.im * point.im) > 1;
        
        if (wasOutsideUnitCircle !== isOutsideUnitCircle) {
          setTimeout(() => {
            const allZerosInsideCircle = newZeros.every(z => 
              Math.sqrt(z.re * z.re + z.im * z.im) <= 1
            );
            
            setSystemProperties(prev => ({
              ...prev,
              isMinimumPhase: allZerosInsideCircle
            }));
          }, 0);
        }
      }
      return newZeros;
    });
    
    // Force update expression in next tick
    setTimeout(() => updateZTransformExpression(), 0);
  };

  // Now improve the generateTransferFunction method to handle different quality levels and phase calculation
  const generateTransferFunction = (poles: ComplexPoint[], zeros: ComplexPoint[]): { x: number[], y: number[], z: number[], phase?: number[] } => {
    // Create a grid of points in the complex plane with variable density
    let gridSize: number;
    switch (surfaceQuality) {
      case 'low': gridSize = 20; break;
      case 'medium': gridSize = 35; break;
      case 'high': gridSize = 50; break;
      default: gridSize = 35;
    }
    
    const x: number[] = [];
    const y: number[] = [];
    const z: number[] = [];
    const phase: number[] = []; // For phase visualization
    
    // Calculate transfer function magnitude at each point
    for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j < gridSize; j++) {
        // Generate points in complex plane
        const re = ((i / (gridSize - 1)) * 2 - 1) * axisScale;
        const im = ((j / (gridSize - 1)) * 2 - 1) * axisScale;
        
        // Skip points very close to poles to avoid infinite values
        if (poles.some(pole => 
          Math.sqrt(Math.pow(re - pole.re, 2) + Math.pow(im - pole.im, 2)) < 0.1)) {
          continue;
        }
        
        // Calculate transfer function using complex numbers
        let numerator = { re: 1, im: 0 };
        let denominator = { re: 1, im: 0 };
        
        // Numerator: product of (z - zero)
        zeros.forEach(zero => {
          // Complex subtraction: (re + im*i) - (zero.re + zero.im*i)
          const diffRe = re - zero.re;
          const diffIm = im - zero.im;
          
          // Complex multiplication: numerator * (diffRe + diffIm*i)
          const newRe = numerator.re * diffRe - numerator.im * diffIm;
          const newIm = numerator.re * diffIm + numerator.im * diffRe;
          
          numerator.re = newRe;
          numerator.im = newIm;
        });
        
        // Denominator: product of (z - pole)
        poles.forEach(pole => {
          // Complex subtraction: (re + im*i) - (pole.re + pole.im*i)
          const diffRe = re - pole.re;
          const diffIm = im - pole.im;
          
          // Avoid division by zero (points very close to poles)
          const mag = diffRe * diffRe + diffIm * diffIm;
          if (mag < 0.001) {
            return;
          }
          
          // Complex multiplication: denominator * (diffRe + diffIm*i)
          const newRe = denominator.re * diffRe - denominator.im * diffIm;
          const newIm = denominator.re * diffIm + denominator.im * diffRe;
          
          denominator.re = newRe;
          denominator.im = newIm;
        });
        
        // Complex division: numerator / denominator
        const denomMag = denominator.re * denominator.re + denominator.im * denominator.im;
        const resultRe = (numerator.re * denominator.re + numerator.im * denominator.im) / denomMag;
        const resultIm = (numerator.im * denominator.re - numerator.re * denominator.im) / denomMag;
        
        // Calculate magnitude and phase
        const magnitude = Math.sqrt(resultRe * resultRe + resultIm * resultIm);
        const phaseValue = Math.atan2(resultIm, resultRe);
        
        // Limit the magnitude for visualization purposes
        const limitedMagnitude = Math.min(magnitude, axisScale * 1.5);
        
        // Add the point to our arrays
        x.push(re);
        y.push(im);
        z.push(limitedMagnitude);
        phase.push(phaseValue);
      }
    }
    
    return { x, y, z, phase };
  };

  // Add a function to generate frequency response along the unit circle
  const generateFrequencyResponse = (): { omega: number[], magnitude: number[], phase: number[] } => {
    const points = 200;
    const omega: number[] = [];
    const magnitude: number[] = [];
    const phase: number[] = [];
    
    // Calculate response at evenly spaced points along unit circle
    for (let i = 0; i < points; i++) {
      const angle = (i / points) * 2 * Math.PI;
      const re = Math.cos(angle);  // Real part (cosine)
      const im = Math.sin(angle);  // Imaginary part (sine)
      
      // Calculate H(z) using complex math
      let numerator = { re: 1, im: 0 };
      let denominator = { re: 1, im: 0 };
      
      // Numerator: product of (z - zero)
      zeros.forEach(zero => {
        const diffRe = re - zero.re;
        const diffIm = im - zero.im;
        
        const newRe = numerator.re * diffRe - numerator.im * diffIm;
        const newIm = numerator.re * diffIm + numerator.im * diffRe;
        
        numerator.re = newRe;
        numerator.im = newIm;
      });
      
      // Denominator: product of (z - pole)
      poles.forEach(pole => {
        const diffRe = re - pole.re;
        const diffIm = im - pole.im;
        
        // Skip points too close to poles
        const mag = diffRe * diffRe + diffIm * diffIm;
        if (mag < 0.001) {
          return { omega: [], magnitude: [], phase: [] };
        }
        
        const newRe = denominator.re * diffRe - denominator.im * diffIm;
        const newIm = denominator.re * diffIm + denominator.im * diffRe;
        
        denominator.re = newRe;
        denominator.im = newIm;
      });
      
      // Complex division: numerator / denominator
      const denomMag = denominator.re * denominator.re + denominator.im * denominator.im;
      const resultRe = (numerator.re * denominator.re + numerator.im * denominator.im) / denomMag;
      const resultIm = (numerator.im * denominator.re - numerator.re * denominator.im) / denomMag;
      
      // Calculate magnitude and phase
      const mag = Math.sqrt(resultRe * resultRe + resultIm * resultIm);
      const phs = Math.atan2(resultIm, resultRe);
      
      // Convert angle from radians to normalized frequency (0 to π)
      const normalizedFreq = angle;
      
      omega.push(normalizedFreq);
      magnitude.push(mag);
      phase.push(phs);
    }
    
    return { omega, magnitude, phase };
  };

  // Function to calculate time domain response (impulse or step)
  const generateTimeResponse = (
    poles: ComplexPoint[], 
    zeros: ComplexPoint[], 
    isImpulse: boolean
  ): { time: number[], amplitude: number[] } => {
    // Number of samples to generate
    const numSamples = 100;
    const time: number[] = Array.from({ length: numSamples }, (_, i) => i);
    const amplitude: number[] = Array(numSamples).fill(0);
    
    // Handle special cases first
    // If no poles and no zeros, impulse response is delta[n] and step response is u[n]
    if (poles.length === 0 && zeros.length === 0) {
      if (isImpulse) {
        // Impulse response: delta[n]
        amplitude[0] = 1;
      } else {
        // Step response: u[n]
        amplitude.fill(1);
      }
      return { time, amplitude };
    }
    
    // For systems with only zeros (FIR), directly calculate h[n]
    if (poles.length === 0 && zeros.length > 0) {
      // For FIR system, the impulse response is the coefficients
      // If there are M zeros, the order is M and we have M+1 coefficients
      const M = zeros.length;
      const coefficients = Array(M + 1).fill(1);
      
      // If multiple zeros at the same location, this would be more complex
      // but for a simple implementation:
      
      if (isImpulse) {
        // Fill the impulse response (first M+1 samples)
        for (let i = 0; i <= M && i < numSamples; i++) {
          amplitude[i] = coefficients[i];
        }
      } else {
        // Step response is cumulative sum of impulse response
        let sum = 0;
        for (let i = 0; i < numSamples; i++) {
          if (i <= M) {
            sum += coefficients[i];
          }
          amplitude[i] = sum;
        }
      }
      
      return { time, amplitude };
    }
    
    // For IIR systems (with poles), use partial fraction expansion
    // This is a simplified approach and doesn't handle all cases accurately
    
    // Check if the system has poles inside unit circle (stable)
    const isStable = poles.every(p => Math.sqrt(p.re * p.re + p.im * p.im) < 1);
    
    if (!isStable) {
      // For unstable systems, response grows exponentially
      // This is a simplified approximation
      const maxPoleRadius = Math.max(...poles.map(p => Math.sqrt(p.re * p.re + p.im * p.im)));
      
      for (let n = 0; n < numSamples; n++) {
        // Exponential growth based on the largest pole's magnitude
        amplitude[n] = Math.pow(maxPoleRadius, n) * (isImpulse ? (n === 0 ? 1 : 0) : 1);
        
        // Limit the maximum value for display purposes
        if (amplitude[n] > 100) amplitude[n] = 100;
      }
      
      return { time, amplitude };
    }
    
    // For stable systems, compute response based on pole/zero pattern
    
    // First-order real pole case (simplified)
    if (poles.length === 1 && poles[0].im === 0 && poles[0].re !== 0) {
      const a = poles[0].re;
      
      if (isImpulse) {
        // Impulse response: h[n] = a^n * u[n]
        for (let n = 0; n < numSamples; n++) {
          amplitude[n] = Math.pow(a, n);
        }
      } else {
        // Step response: y[n] = (1 - a^(n+1))/(1-a) * u[n]
        if (Math.abs(a) < 1) {
          for (let n = 0; n < numSamples; n++) {
            amplitude[n] = (1 - Math.pow(a, n+1)) / (1 - a);
          }
        } else {
          // For a=1, step response is a ramp
          for (let n = 0; n < numSamples; n++) {
            amplitude[n] = n + 1;
          }
        }
      }
      
      return { time, amplitude };
    }
    
    // Complex poles case - approximation for second-order systems
    if (poles.length === 2 && 
        poles[0].im !== 0 && poles[1].im !== 0 && 
        poles[0].im === -poles[1].im && poles[0].re === poles[1].re) {
      // Complex conjugate poles
      const r = Math.sqrt(poles[0].re * poles[0].re + poles[0].im * poles[0].im);
      const theta = Math.atan2(poles[0].im, poles[0].re);
      
      if (isImpulse) {
        // Impulse response: h[n] = r^n * sin(theta*n + phi) * u[n]
        for (let n = 0; n < numSamples; n++) {
          amplitude[n] = Math.pow(r, n) * Math.sin(theta * n);
          
          // Normalize
          if (n === 0) {
            const factor = 1 / amplitude[0];
            amplitude[0] = 1;
          }
        }
      } else {
        // Step response approximation
        for (let n = 0; n < numSamples; n++) {
          // Simplified approximation of the step response for 2nd order system
          amplitude[n] = 1 - Math.pow(r, n) * Math.cos(theta * n);
        }
      }
      
      return { time, amplitude };
    }
    
    // General approach for other cases: Use difference equation (approximate)
    
    // For impulse response, set x[0]=1, x[n]=0 for n>0
    // For step response, set x[n]=1 for all n
    
    // Calculate coefficients from poles and zeros (simplified)
    // This is an approximation, not the exact implementation for all cases
    
    // Initialize input and output arrays
    let x = Array(numSamples).fill(isImpulse ? 0 : 1);
    if (isImpulse) x[0] = 1;
    
    // Simplified implementation of difference equation for demo purposes
    // y[n] = b0*x[n] + b1*x[n-1] + ... - a1*y[n-1] - a2*y[n-2] - ...
    
    // Assuming first-order IIR as approximation: y[n] = x[n] - a1*y[n-1]
    let a1 = poles.length > 0 ? poles[0].re : 0;
    
    // Limit coefficient for stability
    if (Math.abs(a1) >= 1) a1 = 0.9 * (a1 >= 0 ? 1 : -1);
    
    // Compute the system response
    for (let n = 0; n < numSamples; n++) {
      if (n === 0) {
        amplitude[n] = x[n];
      } else {
        amplitude[n] = x[n] - a1 * amplitude[n-1];
      }
    }
    
    return { time, amplitude };
  };

  // Add this function after generateTimeResponse
  
  // Function to generate time domain plots for step/impulse responses
  const getTimeResponsePlotData = (): Data[] => {
    const plotData: Data[] = [];
    
    if (showTimeResponse) {
      const { time, amplitude } = generateTimeResponse(poles, zeros, false); // false for step response
      
      // Add background line for stability reference - don't show in legend
      plotData.push({
        x: time,
        y: Array(time.length).fill(1),
        type: 'scatter',
        mode: 'lines',
        name: 'Final Value',
        line: {
          color: 'rgba(255, 255, 255, 0.2)',
          width: 1,
          dash: 'dash'
        },
        hoverinfo: 'none' as 'none',
        showlegend: false
      });
      
      // Main step response with improved styling - show in legend
      plotData.push({
        x: time,
        y: amplitude,
        type: 'scatter',
        mode: 'lines',
        name: 'Step Response h[n] * u[n]',
        line: {
          color: 'rgba(255, 180, 0, 1)',
          width: 3,
          shape: 'spline' as 'spline'
        },
        hovertemplate: 'n: %{x}<br>Amplitude: %{y:.4f}',
        showlegend: true
      });
      
      // Add envelope for oscillating systems
      if (poles.some(p => Math.abs(p.im) > 0.01)) {
        // Calculate envelope based on pole magnitudes
        const maxPoleRadius = Math.max(...poles.map(p => Math.sqrt(p.re * p.re + p.im * p.im)));
        if (maxPoleRadius < 1) { // Only for stable systems
          const envelope = time.map(t => Math.pow(maxPoleRadius, t));
          
          // Add upper envelope - don't show in legend
          plotData.push({
            x: time,
            y: envelope.map(e => 1 + e),
            type: 'scatter',
            mode: 'lines',
            name: 'Upper Envelope', // Changed name to avoid duplication
            line: {
              color: 'rgba(255, 100, 100, 0.3)',
              width: 1,
              dash: 'dot'
            },
            showlegend: false,
            hoverinfo: 'none' as 'none'
          });
          
          // Add lower envelope - show in legend
          plotData.push({
            x: time,
            y: envelope.map(e => 1 - e),
            type: 'scatter',
            mode: 'lines',
            name: `Envelope (r = ${maxPoleRadius.toFixed(2)})`,
            line: {
              color: 'rgba(255, 100, 100, 0.3)',
              width: 1,
              dash: 'dot'
            },
            showlegend: true,
            hoverinfo: 'name' as 'name',
            fill: 'tonexty' as 'tonexty',
            fillcolor: 'rgba(255, 100, 100, 0.05)'
          });
        }
      }
    }
    
    if (showImpulseResponse) {
      const { time, amplitude } = generateTimeResponse(poles, zeros, true); // true for impulse response
      
      // Add zero reference line - don't show in legend
      plotData.push({
        x: time,
        y: Array(time.length).fill(0),
        type: 'scatter',
        mode: 'lines',
        name: 'Zero Reference',  // Changed name to be more descriptive
        line: {
          color: 'rgba(255, 255, 255, 0.2)',
          width: 1,
          dash: 'dash'
        },
        showlegend: false,
        hoverinfo: 'none' as 'none'
      });
      
      // Main impulse response with improved styling - show in legend
      plotData.push({
        x: time,
        y: amplitude,
        type: 'scatter',
        mode: 'lines+markers',
        name: 'Impulse Response h[n]',
        marker: {
          size: 6,
          color: 'rgba(255, 100, 255, 1)'
        },
        line: {
          color: 'rgba(255, 100, 255, 1)',
          width: 2,
          shape: 'spline' as 'spline'
        },
        hovertemplate: 'n: %{x}<br>Amplitude: %{y:.4f}',
        showlegend: true
      });
      
      // Add stems for discrete-time emphasis - don't show in legend
      for (let i = 0; i < time.length; i++) {
        if (amplitude[i] !== 0) {
          plotData.push({
            x: [time[i], time[i]],
            y: [0, amplitude[i]],
            type: 'scatter',
            mode: 'lines',
            line: {
              color: 'rgba(255, 100, 255, 0.5)',
              width: 1
            },
            name: `Stem ${i}`, // Add unique name for each stem
            showlegend: false,
            hoverinfo: 'none' as 'none'
          });
        }
      }
    }
    
    return plotData;
  };

  // Modify getPlotData to add frequency response visualization
  const getPlotData = (): Data[] => {
    const data: Data[] = [];
    
    // 3D visualization mode - surface mesh removed as requested
    if (visualizationMode === '3d') {
      // We still need the transfer function data for frequency response
      const { x, y, z, phase } = generateTransferFunction(poles, zeros);
      
      // No mesh3d surface rendering - removed as requested
      
      // Add frequency response visualization if enabled
      if (showFrequencyResponse) {
        const { omega, magnitude, phase } = generateFrequencyResponse();
        
        // Skip if we got empty arrays (meaning there was a pole exactly on unit circle)
        if (omega.length > 0) {
          // Create 3D curve along the unit circle at z=0
          const unitCircleX = omega.map(angle => Math.cos(angle));
          const unitCircleY = omega.map(angle => Math.sin(angle));
          const unitCircleZ = Array(omega.length).fill(0);
          
          // Add the unit circle reference
          data.push({
            type: 'scatter3d',
            x: unitCircleX,
            y: unitCircleY,
            z: unitCircleZ,
            mode: 'lines',
            line: {
              color: 'rgba(255, 255, 255, 0.5)',
              width: 3
            },
            name: 'Unit Circle (|z| = 1)',
            hoverinfo: 'name',
            showlegend: true
          });
          
          // Create 3D line for magnitude response
          const responseX = unitCircleX.map((x, i) => x);
          const responseY = unitCircleY.map((y, i) => y);
          const responseZ = magnitude.map(mag => Math.min(mag, axisScale));
          
          // Add the frequency response curve
          data.push({
            type: 'scatter3d',
            x: responseX,
            y: responseY,
            z: responseZ,
            mode: 'lines',
            line: {
              color: 'rgba(255, 255, 0, 0.8)',
              width: 5
            },
            name: 'Frequency Response |H(e^jω)|',
            hoverinfo: 'name',
            showlegend: true
          });
          
          // Add frequency markers at key points (ω = 0, π/4, π/2, 3π/4, π)
          const keyFrequencies = [0, Math.PI/4, Math.PI/2, 3*Math.PI/4, Math.PI];
          const markerX = keyFrequencies.map(angle => Math.cos(angle));
          const markerY = keyFrequencies.map(angle => Math.sin(angle));
          const markerZ = keyFrequencies.map(angle => {
            // Find the closest omega value to this angle
            const idx = omega.findIndex(w => Math.abs(w - angle) < 0.1);
            return idx >= 0 ? responseZ[idx] : 0;
          });
          
          // Labels for frequency markers
          const labels = ['DC (0)', 'π/4', 'π/2', '3π/4', 'π'];
          
          // Add markers at key frequency points
          data.push({
            type: 'scatter3d',
            x: markerX,
            y: markerY,
            z: markerZ,
            mode: 'text+markers',
            marker: {
              size: 8,
              color: 'rgba(255, 220, 0, 1)',
              symbol: 'circle',
              line: {
                color: 'black',
                width: 1
              }
            },
            text: labels,
            textposition: 'top center',
            textfont: {
              color: 'rgba(255, 220, 0, 1)',
              size: 10
            },
            name: 'Key Frequencies',
            hoverinfo: 'text',
            hovertext: labels.map((label, i) => 
              `ω = ${label}, |H(e^jω)| = ${markerZ[i].toFixed(2)}`
            )
          });
          
          // Add vertical lines from unit circle to response surface for better visual
          for (let i = 0; i < keyFrequencies.length; i++) {
            const vertX = [markerX[i], markerX[i]];
            const vertY = [markerY[i], markerY[i]];
            const vertZ = [0, markerZ[i]];
            
            data.push({
              type: 'scatter3d',
              x: vertX,
              y: vertY,
              z: vertZ,
              mode: 'lines',
              line: {
                color: 'rgba(255, 200, 0, 0.5)',
                width: 2,
                dash: 'dash'
              },
              showlegend: false,
            hoverinfo: 'none'
          });
          }
        }
      }
    }
    
    // Theta values for circle drawing
    const theta = Array.from({ length: 100 }, (_, i) => (i * 2 * Math.PI) / 99);
    
    // Unit circle with enhanced styling
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
      name: 'Unit Circle (|z| = 1)',
      hoverinfo: 'name',
      showlegend: true
    });
    
    // Add Enhanced frequency response data for 2D view
    if (showFrequencyResponse && visualizationMode === '2d') {
      const { omega, magnitude, phase } = generateFrequencyResponse();
      
      if (omega.length > 0) {
        // For 2D view, add a secondary plot that shows the frequency response along the unit circle
        // We'll use a different approach - plot magnitude using color intensity on the unit circle
        
        // Normalize magnitudes for coloring (0-1 range)
        const maxMag = Math.max(...magnitude);
        const normalizedMag = magnitude.map(mag => Math.min(mag / (maxMag || 1), 1));
        
        // Create points with color variation along unit circle
        for (let i = 0; i < omega.length - 1; i += 3) {  // Skip some points for efficiency
          const angle1 = omega[i];
          const angle2 = omega[i + 1];
          
          // Skip if we don't have the next point
          if (angle2 === undefined) continue;
          
          const x1 = Math.cos(angle1);
          const y1 = Math.sin(angle1);
          const x2 = Math.cos(angle2);
          const y2 = Math.sin(angle2);
          
          // Use color intensity to represent magnitude
          const magColor = `rgba(255, ${Math.round(220 * (1-normalizedMag[i]))}, 0, ${0.7 * normalizedMag[i] + 0.3})`;
          
          data.push({
            x: [x1, x2],
            y: [y1, y2],
            mode: 'lines',
            type: 'scatter',
            line: {
              color: magColor,
              width: 4
            },
            showlegend: false,
            hoverinfo: 'text' as any,
            hovertext: `ω ≈ ${(angle1 * 180 / Math.PI).toFixed(0)}°, |H(e^jω)| = ${magnitude[i].toFixed(2)}`
          });
        }
        
        // Add markers at key frequency points for 2D view
        const keyFrequencies = [0, Math.PI/4, Math.PI/2, 3*Math.PI/4, Math.PI];
        const labels = ['0', 'π/4', 'π/2', '3π/4', 'π'];
        const markerX = keyFrequencies.map(angle => 1.1 * Math.cos(angle));
        const markerY = keyFrequencies.map(angle => 1.1 * Math.sin(angle));
        
        data.push({
          x: markerX,
          y: markerY,
          mode: 'text',
          type: 'scatter',
          text: labels,
          textfont: {
            color: 'rgba(255, 220, 0, 0.8)',
            size: 10
          },
          showlegend: false,
          hoverinfo: 'none' as any
        });
      }
    }
    
    // Real and imaginary axes with enhanced styling
    data.push({
      x: [-axisScale, axisScale],
      y: [0, 0],
      z: [0, 0],
      mode: 'lines',
      type: visualizationMode === '3d' ? 'scatter3d' : 'scatter',
      line: {
        color: 'rgba(100, 255, 255, 0.7)',
        width: 2
      },
      name: 'Real Axis',
      hoverinfo: 'name',
      showlegend: true
    });
    
    data.push({
      x: [0, 0],
      y: [-axisScale, axisScale],
      z: [0, 0],
      mode: 'lines',
      type: visualizationMode === '3d' ? 'scatter3d' : 'scatter',
      line: {
        color: 'rgba(100, 255, 255, 0.7)',
        width: 2
      },
      name: 'Imaginary Axis',
      hoverinfo: 'name',
      showlegend: false
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
          color: 'rgba(100, 255, 255, 0.7)',
          width: 2
        },
        name: 'Z Axis',
        hoverinfo: 'name'
      });
    }
    
    // Grid lines for enhanced sci-fi look
    if (visualizationMode === '2d') {
      // Add more grid lines for x-axis
      const gridStep = 0.5;
      for (let i = -Math.floor(axisScale/gridStep); i <= Math.floor(axisScale/gridStep); i++) {
        if (i === 0) continue; // Skip the main axis
        
        data.push({
          x: [i*gridStep, i*gridStep],
          y: [-axisScale, axisScale],
          mode: 'lines',
          type: 'scatter',
          line: {
            color: 'rgba(0, 150, 200, 0.15)',
            width: 1
          },
          showlegend: false,
          hoverinfo: 'none' as any
        });
      }
      
      // Add more grid lines for y-axis
      for (let i = -Math.floor(axisScale/gridStep); i <= Math.floor(axisScale/gridStep); i++) {
        if (i === 0) continue; // Skip the main axis
        
        data.push({
          x: [-axisScale, axisScale],
          y: [i*gridStep, i*gridStep],
          mode: 'lines',
          type: 'scatter',
          line: {
            color: 'rgba(0, 150, 200, 0.15)',
            width: 1
          },
          showlegend: false,
          hoverinfo: 'none' as any
        });
      }
      
      // Add circular grid lines
      for (let r = 0.5; r <= axisScale; r += 0.5) {
        if (r === 1) continue; // Skip the unit circle
        
        const circleX = theta.map(t => r * Math.cos(t));
        const circleY = theta.map(t => r * Math.sin(t));
        
        data.push({
          x: circleX,
          y: circleY,
          mode: 'lines',
          type: 'scatter',
          line: {
            color: 'rgba(0, 150, 200, 0.15)',
            width: 1
          },
          showlegend: false,
          hoverinfo: 'none' as any
        });
      }
    }
    
    // Region of Convergence (ROC) with pulsing effect
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
          width: 3,
          dash: 'dash',
        },
        name: `ROC Boundary (|z| = ${rocRadius.toFixed(2)})`,
        hoverinfo: 'name',
        showlegend: true
      });
      
      // Add ROC fill for 2D mode with enhanced styling
      if (visualizationMode === '2d' && (rocType === 'inside' || rocType === 'outside')) {
        if (rocType === 'inside') {
          data.push({
            x: rocCircleX,
            y: rocCircleY,
            type: 'scatter',
            fill: 'toself',
            fillcolor: 'rgba(100, 180, 255, 0.12)',
            line: { width: 0 },
            name: `ROC: Inside |z| = ${rocRadius.toFixed(2)}`,
            hoverinfo: 'name' as any,
            showlegend: true
          });
        } else if (rocType === 'outside') {
          // Need a large circle to fill outside
          const outerCircleX = theta.map(t => axisScale * 1.2 * Math.cos(t));
          const outerCircleY = theta.map(t => axisScale * 1.2 * Math.sin(t));
          
          
          // Combine points for the fill
          const combinedX = [...rocCircleX, ...outerCircleX.reverse(), rocCircleX[0]];
          const combinedY = [...rocCircleY, ...outerCircleY.reverse(), rocCircleY[0]];
          
          data.push({
            x: combinedX,
            y: combinedY,
            type: 'scatter',
            fill: 'toself',
            fillcolor: 'rgba(0, 255, 180, 0.12)',
            line: { width: 0 },
            name: `ROC: Outside |z| = ${rocRadius.toFixed(2)}`,
            hoverinfo: 'name' as any,
            showlegend: true
          });
        }
      }
    }
    
    // Add poles as X markers with enhanced styling
    if (poles.length > 0) {
      // Filter out any poles with invalid coordinates
      const validPoles = poles.filter(p => 
        p && typeof p.re === 'number' && typeof p.im === 'number' && 
        !isNaN(p.re) && !isNaN(p.im)
      );
      
      if (validPoles.length > 0) {
        data.push({
          x: validPoles.map(p => p.re),
          y: validPoles.map(p => p.im),
          z: validPoles.map(() => 0),
          mode: 'markers',
          type: visualizationMode === '3d' ? 'scatter3d' : 'scatter',
          marker: {
            symbol: 'x',
            size: visualizationMode === '3d' ? 8 : 14,
            color: validPoles.map((_, i) => i === selectedPoleIndex ? 'rgba(255, 255, 0, 1)' : 'rgba(255, 70, 70, 1)'),
            line: {
              color: 'white',
              width: 2
            }
          },
          text: validPoles.map((p, i) => `Pole ${i+1}: (${p.re.toFixed(2)}, ${p.im.toFixed(2)}j)`),
          name: `Poles (${validPoles.length})`,
          hoverinfo: 'text+name' as any,
          showlegend: true
        });
        
        // Add glow effect for poles in 2D mode
        if (visualizationMode === '2d') {
          data.push({
            x: validPoles.map(p => p.re),
            y: validPoles.map(p => p.im),
            mode: 'markers',
            type: 'scatter',
            marker: {
              symbol: 'circle',
              size: 20,
              color: validPoles.map((_, i) => i === selectedPoleIndex ? 'rgba(255, 255, 0, 0.5)' : 'rgba(255, 70, 70, 0.3)'),
              line: { width: 0 }
            },
            showlegend: false,
            hoverinfo: 'none' as any
          });
        }
      }
    }
    
    // Add zeros as O markers with enhanced styling
    if (zeros.length > 0) {
      // Filter out any zeros with invalid coordinates
      const validZeros = zeros.filter(z => 
        z && typeof z.re === 'number' && typeof z.im === 'number' && 
        !isNaN(z.re) && !isNaN(z.im)
      );
      
      if (validZeros.length > 0) {
        data.push({
          x: validZeros.map(z => z.re),
          y: validZeros.map(z => z.im),
          z: validZeros.map(() => 0),
          mode: 'markers',
          type: visualizationMode === '3d' ? 'scatter3d' : 'scatter',
          marker: {
            symbol: 'circle',
            size: visualizationMode === '3d' ? 8 : 14,
            color: validZeros.map((_, i) => i === selectedZeroIndex ? 'rgba(255, 255, 0, 1)' : 'rgba(70, 130, 255, 1)'),
            line: {
              color: 'white',
              width: 2
            }
          },
          text: validZeros.map((z, i) => `Zero ${i+1}: (${z.re.toFixed(2)}, ${z.im.toFixed(2)}j)`),
          name: `Zeros (${validZeros.length})`,
          hoverinfo: 'text+name' as any,
          showlegend: true
        });
        
        // Add glow effect for zeros in 2D mode
        if (visualizationMode === '2d') {
          data.push({
            x: validZeros.map(z => z.re),
            y: validZeros.map(z => z.im),
            mode: 'markers',
            type: 'scatter',
            marker: {
              symbol: 'circle',
              size: 20,
              color: validZeros.map((_, i) => i === selectedZeroIndex ? 'rgba(255, 255, 0, 0.5)' : 'rgba(70, 130, 255, 0.3)'),
              line: { width: 0 }
            },
            showlegend: false,
            hoverinfo: 'none' as any
          });
        }
      }
    }

    // Add this to the getPlotData function after the unit circle definition
    // Add frequency response visualization with markers
    if (showFrequencyResponse && visualizationMode === '3d') {
      const { omega, magnitude, phase } = generateFrequencyResponse();
      
      // Skip if we got empty arrays (meaning there was a pole exactly on unit circle)
      if (omega.length > 0) {
        // Create 3D curve along the unit circle at z=0
        const unitCircleX = omega.map(angle => Math.cos(angle));
        const unitCircleY = omega.map(angle => Math.sin(angle));
        const unitCircleZ = Array(omega.length).fill(0);
        
        // Add the unit circle reference
        data.push({
          type: 'scatter3d',
          x: unitCircleX,
          y: unitCircleY,
          z: unitCircleZ,
          mode: 'lines',
          line: {
            color: 'rgba(255, 255, 255, 0.5)',
            width: 3
          },
          name: 'Unit Circle (|z| = 1)',
          hoverinfo: 'name',
          showlegend: true
        });
        
        // Create 3D line for magnitude response
        const responseX = unitCircleX.map((x, i) => x);
        const responseY = unitCircleY.map((y, i) => y);
        const responseZ = magnitude.map(mag => Math.min(mag, axisScale));
        
        // Add the frequency response curve
        data.push({
          type: 'scatter3d',
          x: responseX,
          y: responseY,
          z: responseZ,
          mode: 'lines',
          line: {
            color: 'rgba(255, 255, 0, 0.8)',
            width: 5
          },
          name: 'Frequency Response |H(e^jω)|',
          hoverinfo: 'name',
          showlegend: true
        });
        
        // Add frequency markers at key points (ω = 0, π/4, π/2, 3π/4, π)
        const keyFrequencies = [0, Math.PI/4, Math.PI/2, 3*Math.PI/4, Math.PI];
        const markerX = keyFrequencies.map(angle => Math.cos(angle));
        const markerY = keyFrequencies.map(angle => Math.sin(angle));
        const markerZ = keyFrequencies.map(angle => {
          // Find the closest omega value to this angle
          const idx = omega.findIndex(w => Math.abs(w - angle) < 0.1);
          return idx >= 0 ? responseZ[idx] : 0;
        });
        
        // Labels for frequency markers
        const labels = ['DC (0)', 'π/4', 'π/2', '3π/4', 'π'];
        
        // Add markers at key frequency points
        data.push({
          type: 'scatter3d',
          x: markerX,
          y: markerY,
          z: markerZ,
          mode: 'text+markers',
          marker: {
            size: 8,
            color: 'rgba(255, 220, 0, 1)',
            symbol: 'circle',
            line: {
              color: 'black',
              width: 1
            }
          },
          text: labels,
          textposition: 'top center',
          textfont: {
            color: 'rgba(255, 220, 0, 1)',
            size: 10
          },
          name: 'Key Frequencies',
          hoverinfo: 'text',
          hovertext: labels.map((label, i) => 
            `ω = ${label}, |H(e^jω)| = ${markerZ[i].toFixed(2)}`
          )
        });
        
        // Add vertical lines from unit circle to response surface for better visual
        for (let i = 0; i < keyFrequencies.length; i++) {
          const vertX = [markerX[i], markerX[i]];
          const vertY = [markerY[i], markerY[i]];
          const vertZ = [0, markerZ[i]];
          
          data.push({
            type: 'scatter3d',
            x: vertX,
            y: vertY,
            z: vertZ,
            mode: 'lines',
            line: {
              color: 'rgba(255, 200, 0, 0.5)',
              width: 2,
              dash: 'dash'
            },
            showlegend: false,
            hoverinfo: 'none'
          });
        }
      }
    }

    // Add Enhanced frequency response data for 2D view
    if (showFrequencyResponse && visualizationMode === '2d') {
      const { omega, magnitude, phase } = generateFrequencyResponse();
      
      if (omega.length > 0) {
        // For 2D view, add a secondary plot that shows the frequency response along the unit circle
        // We'll use a different approach - plot magnitude using color intensity on the unit circle
        
        // Normalize magnitudes for coloring (0-1 range)
        const maxMag = Math.max(...magnitude);
        const normalizedMag = magnitude.map(mag => Math.min(mag / (maxMag || 1), 1));
        
        // Create points with color variation along unit circle
        for (let i = 0; i < omega.length - 1; i += 3) {  // Skip some points for efficiency
          const angle1 = omega[i];
          const angle2 = omega[i + 1];
          
          // Skip if we don't have the next point
          if (angle2 === undefined) continue;
          
          const x1 = Math.cos(angle1);
          const y1 = Math.sin(angle1);
          const x2 = Math.cos(angle2);
          const y2 = Math.sin(angle2);
          
          // Use color intensity to represent magnitude
          const magColor = `rgba(255, ${Math.round(220 * (1-normalizedMag[i]))}, 0, ${0.7 * normalizedMag[i] + 0.3})`;
          
          data.push({
            x: [x1, x2],
            y: [y1, y2],
            mode: 'lines',
            type: 'scatter',
            line: {
              color: magColor,
              width: 4
            },
            showlegend: false,
            hoverinfo: 'text' as any,
            hovertext: `ω ≈ ${(angle1 * 180 / Math.PI).toFixed(0)}°, |H(e^jω)| = ${magnitude[i].toFixed(2)}`
          });
        }
        
        // Add markers at key frequency points for 2D view
        const keyFrequencies = [0, Math.PI/4, Math.PI/2, 3*Math.PI/4, Math.PI];
        const labels = ['0', 'π/4', 'π/2', '3π/4', 'π'];
        const markerX = keyFrequencies.map(angle => 1.1 * Math.cos(angle));
        const markerY = keyFrequencies.map(angle => 1.1 * Math.sin(angle));
        
        data.push({
          x: markerX,
          y: markerY,
          mode: 'text',
          type: 'scatter',
          text: labels,
          textfont: {
            color: 'rgba(255, 220, 0, 0.8)',
            size: 10
          },
          showlegend: false,
          hoverinfo: 'none' as any
        });
      }
    }

    return data;
  };

  // Enhanced layout configuration with sci-fi styling
  const getPlotLayout = (): Partial<Layout> => {
    // Common layout properties with enhanced styling
    const commonLayout: Partial<Layout> = {
      title: {
        text: 'Z-TRANSFORM PLANE',
        font: {
          family: '"Space Mono", "Courier New", monospace',
          size: 18,
          color: '#00ccff'
        },
        y: 0.98
      },
      showlegend: true, // Enable legend
      legend: {
        title: {
          text: 'Z-PLANE ELEMENTS',
          font: {
            family: '"Space Mono", "Courier New", monospace',
            color: '#00ccff',
            size: 12
          }
        },
        font: {
          family: '"Space Mono", "Courier New", monospace',
          color: '#e0e0e0',
          size: 10
        },
        bgcolor: 'rgba(0, 20, 40, 0.8)',
        bordercolor: 'rgba(0, 210, 255, 0.3)',
        borderwidth: 1,
        x: 0.99,
        y: 0.99,
        xanchor: 'right',
        yanchor: 'top',
        orientation: 'v'
      },
      margin: { l: 50, r: 50, t: 60, b: 50 },
      paper_bgcolor: 'rgba(0,0,0,0)',
      plot_bgcolor: 'rgba(0,10,25,0.95)',
      hovermode: 'closest'
    };
    
    // 3D specific layout with enhanced styling
    if (visualizationMode === '3d') {
      // Determine camera position based on selected viewPreset
      let cameraEye = cameraPosition;
      
      if (!rotationEnabled) {
        switch (viewPreset) {
          case 'top':
            cameraEye = { x: 0, y: 0, z: 2.5 };
            break;
          case 'side':
            cameraEye = { x: 2.5, y: 0, z: 0.1 };
            break;
          case 'perspective':
            cameraEye = { x: 1.5, y: 1.5, z: 1.2 };
            break;
        }
      }
      
      return {
        ...commonLayout,
        scene: {
          xaxis: {
            title: {
              text: 'Re(z)',
              font: {
                family: '"Space Mono", "Courier New", monospace',
                color: '#00ccff'
              }
            },
            range: [-axisScale, axisScale],
            gridcolor: 'rgba(0, 210, 255, 0.15)',
            zerolinecolor: 'rgba(0, 255, 255, 0.8)',
            showbackground: true,
            backgroundcolor: 'rgba(0, 20, 40, 0.95)'
          },
          yaxis: {
            title: {
              text: 'Im(z)',
              font: {
                family: '"Space Mono", "Courier New", monospace',
                color: '#00ccff'
              }
            },
            range: [-axisScale, axisScale],
            gridcolor: 'rgba(0, 210, 255, 0.15)',
            zerolinecolor: 'rgba(0, 255, 255, 0.8)',
            showbackground: true,
            backgroundcolor: 'rgba(0, 20, 40, 0.95)'
          },
          zaxis: {
            title: {
              text: surfaceView === 'magnitude' ? '|H(z)|' : '∠H(z)',
              font: {
                family: '"Space Mono", "Courier New", monospace',
                color: '#00ccff'
              }
            },
            range: surfaceView === 'magnitude' ? 
                   [0, axisScale * 1.5] : 
                   [-Math.PI, Math.PI],
            gridcolor: 'rgba(0, 210, 255, 0.15)',
            zerolinecolor: 'rgba(0, 255, 255, 0.8)',
            showbackground: true,
            backgroundcolor: 'rgba(0, 20, 40, 0.95)'
          },
          camera: {
            eye: cameraEye,
            up: {x: 0, y: 0, z: 1}
          },
          aspectratio: { x: 1, y: 1, z: 0.8 },
          dragmode: 'orbit'
        }
      };
    }

    // Layout specific to 2D mode with enhanced styling
    return {
      ...commonLayout,
      xaxis: {
        title: {
          text: 'Re(z)',
          font: {
            family: '"Space Mono", "Courier New", monospace',
            size: 14,
            color: '#00ccff'
          },
          standoff: 5
        },
        range: [-axisScale, axisScale],
        gridcolor: 'rgba(0, 210, 255, 0.15)',
        zerolinecolor: 'rgba(0, 255, 255, 0.8)',
        zeroline: true,
        zerolinewidth: 2
      },
      yaxis: {
        title: {
          text: 'Im(z)',
          font: {
            family: '"Space Mono", "Courier New", monospace',
            size: 14,
            color: '#00ccff'
          },
          standoff: 5
        },
        range: [-axisScale, axisScale],
        gridcolor: 'rgba(0, 210, 255, 0.15)',
        zerolinecolor: 'rgba(0, 255, 255, 0.8)',
        zeroline: true,
        zerolinewidth: 2,
        scaleanchor: 'x',
        scaleratio: 1
      },
      shapes: [
        // Add a dim circle around origin for reference
        {
          type: 'circle',
          xref: 'x',
          yref: 'y',
          x0: -axisScale,
          y0: -axisScale,
          x1: axisScale,
          y1: axisScale,
          line: {
            color: 'rgba(0, 150, 200, 0.1)',
            width: 1
          },
          fillcolor: 'rgba(0, 0, 0, 0)'
        }
      ]
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
        .replace(/z\^\((-?\d+)\)/g, 'z^{$1}')
        .replace(/z\^(-?\d+)/g, 'z^{-$1}')
        .replace(/z\^(\d+)/g, 'z^{$1}')
        // Fix negative exponents that use hyphen instead of superscript
        .replace(/z-(\d+)/g, 'z^{-$1}')
        // Handle trigonometric functions
        .replace(/cos\(([^)]+)\)/g, '\\cos($1)')
        .replace(/sin\(([^)]+)\)/g, '\\sin($1)')
        // Handle π symbol
        .replace(/π/g, '\\pi')
        // Handle common symbols and conditions
        .replace(/\|z\|/g, '|z|')
        .replace(/ for all z/g, ' \\text{ for all } z')
        .replace(/ for \|z\| > ([0-9.]+)/g, ' \\text{ for } |z| > $1');
      
      return (
        <div className="equation-container">
          <BlockMath math={formatted} />
        </div>
      );
    }
    
    // Handle fractions
    const parts = equation.split(' for ');
    const fractionPart = parts[0];
    const conditionPart = parts.length > 1 ? parts[1] : '';
      
      // Format the condition part
      const formattedCondition = conditionPart
      .replace(/\|z\|/g, '|z|')
      .replace(/> ([0-9.]+)/g, '> $1');
    
    // Handle complex fractions with numerator and denominator: (n)/(d)
    if (fractionPart.includes(')/(')) {
      // Split into numerator and denominator
      const [numeratorWithParens, denominatorWithParens] = fractionPart.split(')/(');
      
      // Clean up the parts
      const numerator = numeratorWithParens.replace(/^\(/, '');
      const denominator = denominatorWithParens.replace(/\)$/, '');
      
      // Format numerator and denominator individually
      const formattedNum = formatExpression(numerator);
      const formattedDenom = formatExpression(denominator);
      
      return (
        <div className="equation-container">
          <BlockMath math={`\\frac{${formattedNum}}{${formattedDenom}}`} />
          {conditionPart && (
            <span className="condition ml-2">
              <BlockMath math={`\\text{ for } ${formattedCondition}`} />
            </span>
          )}
        </div>
      );
    }
    
    // Handle simple fractions: a/b
    const [numerator, denominator] = fractionPart.split('/');
    
    // Format numerator and denominator
    const formattedNum = formatExpression(numerator);
    const formattedDenom = formatExpression(denominator);
    
    return (
      <div className="equation-container">
        <BlockMath math={`\\frac{${formattedNum}}{${formattedDenom}}`} />
        {conditionPart && (
          <span className="condition ml-2">
            <BlockMath math={`\\text{ for } ${formattedCondition}`} />
          </span>
        )}
      </div>
    );
  };
  
  // Helper function to format expressions with proper mathematical notation
  const formatExpression = (expression: string): string => {
    if (!expression) return "";
    
    // Handle parentheses first to ensure proper grouping
    let formatted = expression
      .replace(/\(([^()]+)\)/g, '($1)');
    
    // Apply formatting to the expression
    return formatted
      // Fix superscript notation
      .replace(/z\^\((-?\d+)\)/g, 'z^{$1}')
      .replace(/z\^(-?\d+)/g, 'z^{-$1}')
      .replace(/z\^(\d+)/g, 'z^{$1}')
      // Fix negative exponents that use hyphen instead of superscript
      .replace(/z-(\d+)/g, 'z^{-$1}')
      // Handle trigonometric functions
      .replace(/cos\(([^)]+)\)/g, '\\cos($1)')
      .replace(/sin\(([^)]+)\)/g, '\\sin($1)')
      // Handle π symbol
      .replace(/π/g, '\\pi')
      // Handle multiplication with dot
      .replace(/\*/g, '\\cdot')
      // Handle addition and subtraction
      .replace(/\+/g, '+')
      .replace(/(?<!\\)\-(?![\d])/g, '-')
      // Handle division with proper fraction
      .replace(/(\d+)\/(\d+)/g, '\\frac{$1}{$2}')
      // Handle complex numbers
      .replace(/(\d+\.?\d*)\s*\+\s*(\d+\.?\d*)j/g, '$1 + $2j')
      .replace(/(\d+\.?\d*)\s*-\s*(\d+\.?\d*)j/g, '$1 - $2j');
  };

  // Toggle between 2D and 3D visualization modes
  const toggleVisualizationMode = () => {
    setVisualizationMode(visualizationMode === '3d' ? '2d' : '3d');
  };

  // Handle click on plot to add poles or zeros
  const handlePlotClick = (data: any) => {
    // Prevent multiple rapid clicks
    if (isAddingPoint) return;
    
    // Set the debounce flag to prevent multiple rapid clicks
    setIsAddingPoint(true);
    
    // Safety check for malformed data from Plotly
    if (!data || typeof data !== 'object') {
      console.warn("Invalid plot click data:", data);
      setIsAddingPoint(false);
      return;
    }
    
    // Get the clicked point coordinates
    if (!data.points || !Array.isArray(data.points) || data.points.length === 0) {
      console.log("No valid points in click data");
      setIsAddingPoint(false);
      return;
    }
    
    const point = data.points[0];
    if (!point) {
      console.warn("First point in click data is undefined");
      setIsAddingPoint(false);
      return;
    }
    
    // Reset selections first
    setSelectedPoleIndex(null);
    setSelectedZeroIndex(null);
    
    // Check if we clicked on a pole or zero for selection/deletion
    if (editorMode === 'move' || editorMode === 'delete') {
      // For points in 2D mode, check for clicks on poles or zeros
      if (point.data && (point.data.name?.includes('Poles') || point.data.name?.includes('Zeros'))) {
        const clickedIndex = point.pointIndex;
        
        if (point.data.name?.includes('Poles') && clickedIndex !== undefined) {
          console.log("Selected pole at index:", clickedIndex);
          setSelectedPoleIndex(clickedIndex);
          
          // If in delete mode, remove the pole
          if (editorMode === 'delete') {
            removePole(clickedIndex);
          }
          setIsAddingPoint(false);  // Reset flag before returning
          return;
        }
        
        if (point.data.name?.includes('Zeros') && clickedIndex !== undefined) {
          console.log("Selected zero at index:", clickedIndex);
          setSelectedZeroIndex(clickedIndex);
          
          // If in delete mode, remove the zero
          if (editorMode === 'delete') {
            removeZero(clickedIndex);
          }
          setIsAddingPoint(false);  // Reset flag before returning
          return;
        }
      }
      
      // If not clicking on a pole/zero in move/delete mode, exit early
      if (editorMode !== 'delete') {
        setIsAddingPoint(false);  // Reset flag before returning
        return;
      }
    }
    
    // If not in 'add' modes, we're done
    if (editorMode !== 'add_pole' && editorMode !== 'add_zero') {
      setIsAddingPoint(false);  // Reset flag before returning
      return;
    }
    
    // Different coordinates depending on 2D or 3D mode
    let x, y;
    
    if (visualizationMode === '3d') {
      // For 3D mode, we need a more robust approach to place points on z=0 plane
      
      // Ignore clicks on axes and check for clicks on the 3D surface
      if (point.data && ['X Axis', 'Y Axis', 'Z Axis'].includes(point.data.name)) {
        return;
      }
      
      // If we have direct 3D coordinates from the click (on a 3D element), use them
      if (point.x !== undefined && point.y !== undefined) {
        // Only if the point is on the z=0 plane (or close)
        if (point.z !== undefined && Math.abs(point.z) < 0.1) {
          x = point.x;
          y = point.y;
          console.log("Using direct 3D coordinates:", x, y);
        }
      }
      
      // If we don't have valid coordinates yet, use the screen position method
      if (x === undefined || y === undefined) {
      // Make sure we have event data for the click
      if (!data.event) {
        console.log("No event data for click");
        return;
      }
      
      // Get the plot element and its dimensions/position
      const plotElement = document.querySelector('.js-plotly-plot') as HTMLElement;
      if (!plotElement) {
        console.log("Cannot find plot element");
        return;
      }
      
      const rect = plotElement.getBoundingClientRect();
      
      // Calculate relative position within the plot (0-1)
      const relX = (data.event.clientX - rect.left) / rect.width;
      const relY = (data.event.clientY - rect.top) / rect.height;
      
      // Simple approach: Map the 2D screen position to the 3D plane proportionally
      // This is a reasonable approximation for our use case
      
      // Convert to z-plane coordinates
      // Notice we invert the y-axis (as screen coords go down, but math coords go up)
      x = (relX * 2 - 1) * axisScale;
      y = (1 - relY * 2) * axisScale;
      
      // Apply extra correction based on current camera angle
      // This helps account for perspective distortion
      if (plotRef.current) {
        const camera = plotRef.current.el._fullLayout.scene.camera;
        if (camera && camera.eye) {
          // Adjust coordinates based on camera angle
          // The farther from directly overhead, the more we need to correct
          const directlyOverhead = Math.abs(camera.eye.x) < 0.1 && Math.abs(camera.eye.y) < 0.1;
          
          if (!directlyOverhead) {
            // Apply a subtle correction based on camera position
            // This is a heuristic that works reasonably well
            const camAngle = Math.atan2(camera.eye.y, camera.eye.x);
            const camDist = Math.sqrt(camera.eye.x**2 + camera.eye.y**2);
            
            // Adjust for camera angle
            const correction = 0.05 * camDist;
            x += correction * Math.cos(camAngle);
            y += correction * Math.sin(camAngle);
            }
          }
        }
      }
    } else {
      // 2D mode is simpler
      if (typeof point.x !== 'number' || typeof point.y !== 'number') {
        console.log("Invalid 2D coordinates");
        return;
      }
      x = point.x;
      y = point.y;
    }
    
    // Ensure the coordinates are valid numbers before creating the point
    if (typeof x !== 'number' || typeof y !== 'number' || 
        isNaN(x) || isNaN(y)) {
      console.log("Invalid coordinates:", x, y);
      setIsAddingPoint(false);
      return;
    }
    
    // Limit coordinates to the visible plot area
    const limitedX = Math.max(-axisScale, Math.min(axisScale, x));
    const limitedY = Math.max(-axisScale, Math.min(axisScale, y));
    
    const clickedPoint = { re: limitedX, im: limitedY };
    console.log("Adding point:", clickedPoint, "Mode:", editorMode, "Visualization mode:", visualizationMode);
    
    // Find the container to add feedback to
    const container = document.querySelector('.z-transform-visualizer');
    
    // Add pole or zero based on current editor mode
    if (editorMode === 'add_pole') {
      // Create a new array to ensure React detects the change
      const newPoles = [...poles, clickedPoint];
      console.log("Adding pole. Current poles:", poles.length, "New poles:", newPoles.length);
      
      // Use a callback to ensure we're working with the latest state
      setPoles(currentPoles => {
        const updatedPoles = [...currentPoles, clickedPoint];
        
        // Always update ROC based on the current rocType and pole positions
        setTimeout(() => {
          console.log("Updating ROC for type:", rocType);
          if (rocType === 'outside') {
            // For causal signals, ROC is outside the largest pole
            const poleRadii = updatedPoles.map(p => Math.sqrt(p.re * p.re + p.im * p.im));
            const maxRadius = Math.max(...poleRadii);
            console.log("Setting ROC radius to:", Math.max(maxRadius, 0.1), "from max pole radius:", maxRadius);
            setRocRadius(Math.max(maxRadius, 0.1));
          } else if (rocType === 'inside') {
            // For anti-causal signals, ROC is inside the smallest pole
            const poleRadii = updatedPoles.map(p => Math.sqrt(p.re * p.re + p.im * p.im));
            const minRadius = Math.min(...poleRadii);
            console.log("Setting ROC radius to:", Math.min(minRadius, 1.9), "from min pole radius:", minRadius);
            setRocRadius(Math.min(minRadius, 1.9));
          } else if (rocType === 'annular') {
            // For mixed causality signals, ROC is an annular region
            // Find two consecutive radii to place ROC between
            const sortedRadii = updatedPoles
              .map(p => Math.sqrt(p.re * p.re + p.im * p.im))
              .sort((a, b) => a - b);
            
            if (sortedRadii.length >= 2) {
              // Find a suitable annular region
              const middleRadius = (sortedRadii[0] + sortedRadii[sortedRadii.length-1]) / 2;
              console.log("Setting annular ROC radius to:", middleRadius);
              setRocRadius(middleRadius);
            }
          }
          
          // Force a re-render of the visualization
          updateZTransformExpression();
        }, 10);
        
        return updatedPoles;
      });
      
      // Show feedback
      const feedbackDiv = document.createElement('div');
      feedbackDiv.innerHTML = `Added pole at (${limitedX.toFixed(2)}, ${limitedY.toFixed(2)})`;
      feedbackDiv.className = 'absolute top-4 right-4 bg-red-600/80 text-white px-3 py-1 rounded-md text-sm z-50';
      if (container) {
        container.appendChild(feedbackDiv);
      } else {
        document.body.appendChild(feedbackDiv);
      }
      
      // Force update after a brief delay
      setTimeout(() => {
      updateZTransformExpression();
        setIsAddingPoint(false);
        setTimeout(() => feedbackDiv.remove(), 1000);
      }, 50);  // Reduce the timeout from 100 to 50ms
      
    } else if (editorMode === 'add_zero') {
      // Create a new array to ensure React detects the change
      console.log("Adding zero. Current zeros:", zeros.length, "New zeros:", zeros.length + 1);
      
      // Use a callback to ensure we're working with the latest state
      setZeros(currentZeros => {
        const updatedZeros = [...currentZeros, clickedPoint];
        
        // Check if zero is outside the unit circle
        const isOutsideUnitCircle = Math.sqrt(clickedPoint.re * clickedPoint.re + clickedPoint.im * clickedPoint.im) > 1;
        if (isOutsideUnitCircle && systemProperties.isMinimumPhase) {
          setTimeout(() => {
            setSystemProperties(prev => ({
              ...prev,
              isMinimumPhase: false
            }));
          }, 0);
        }
        
        return updatedZeros;
      });
      
      // Show feedback
      const feedbackDiv = document.createElement('div');
      feedbackDiv.innerHTML = `Added zero at (${limitedX.toFixed(2)}, ${limitedY.toFixed(2)})`;
      feedbackDiv.className = 'absolute top-4 right-4 bg-blue-600/80 text-white px-3 py-1 rounded-md text-sm z-50';
      if (container) {
        container.appendChild(feedbackDiv);
      } else {
        document.body.appendChild(feedbackDiv);
      }
      
      // Force update after a brief delay
      setTimeout(() => {
        updateZTransformExpression();
        setIsAddingPoint(false);
        setTimeout(() => feedbackDiv.remove(), 1000);
      }, 50);  // Reduce the timeout from 100 to 50ms
    } else {
      setIsAddingPoint(false);
    }
  };

  // Function to handle signal selection
  const selectSignal = (signalKey: SignalType) => {
    if (signalKey === selectedSignal) return; // Avoid redundant updates
    
    const example = SIGNAL_EXAMPLES[signalKey];
    
    setSelectedSignal(signalKey);
    setPoles(example.poles);
    setZeros(example.zeros);
    setRocType(example.rocType);
    setRocRadius(example.rocRadius);
    
    updateZTransformExpression();
  };

  // Add these functions before return statement
  const exportSystemConfig = () => {
    // Create the configuration object
    const systemConfig = {
      poles,
      zeros,
      rocType,
      rocRadius,
      visualizationMode,
      axisScale,
      systemProperties,
      surfaceQuality,
      viewPreset,
      selectedSignal,
      timestamp: new Date().toISOString()
    };
    
    // Convert to JSON string
    const jsonString = JSON.stringify(systemConfig, null, 2);
    
    // Create a blob and download link
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    // Create and trigger download
    const a = document.createElement('a');
    a.href = url;
    a.download = `z-transform-config-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  const importSystemConfig = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const jsonConfig = JSON.parse(e.target?.result as string);
        
        // Validate the config has required fields
        if (jsonConfig.poles && jsonConfig.zeros) {
          // Update the component state with the imported configuration
          setPoles(jsonConfig.poles);
          setZeros(jsonConfig.zeros);
          setRocType(jsonConfig.rocType || 'outside');
          setRocRadius(jsonConfig.rocRadius || 1.0);
          
          // Set optional configurations if available
          if (jsonConfig.visualizationMode) {
            setVisualizationMode(jsonConfig.visualizationMode);
          }
          if (jsonConfig.axisScale) {
            setAxisScale(jsonConfig.axisScale);
          }
          if (jsonConfig.systemProperties) {
            setSystemProperties(jsonConfig.systemProperties);
          }
          if (jsonConfig.surfaceQuality) {
            setSurfaceQuality(jsonConfig.surfaceQuality);
          }
          if (jsonConfig.viewPreset) {
            setViewPreset(jsonConfig.viewPreset);
          }
          
          // Update Z-transform expression
          updateZTransformExpression();
        }
      } catch (error) {
        console.error('Error importing configuration:', error);
        // Show an error message
        alert('Error importing configuration. Please check the file format.');
      }
    };
    reader.readAsText(file);
    
    // Clear the input value to allow re-selecting the same file
    event.target.value = '';
  };

  // Add a function to capture and save a snapshot of the Z-plane
  const captureSnapshot = () => {
    // Use Plotly's toImage function if it's available
    if (plotRef.current && plotRef.current.el && plotRef.current.el.toImage) {
      plotRef.current.el.toImage({
        format: 'png',
        width: 800,
        height: 600,
        filename: `z-transform-snapshot-${new Date().toISOString().slice(0, 10)}`
      }).then(function(dataUrl: string) {
        // Create a link element to download the image
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = `z-transform-snapshot-${new Date().toISOString().slice(0, 10)}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      });
    } else {
      // Fallback method - capture using html-to-image or similar library
      // For simplicity, we'll just alert the user that the function requires Plotly
      alert('Snapshot feature requires the Plotly library. Please try again with a different browser or update your Plotly version.');
    }
  };

  // Add keyboard shortcut handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only process if not typing in an input field
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      
      // Handle various keyboard shortcuts
      switch (e.key.toLowerCase()) {
        case '3':
          // Toggle 3D/2D mode
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            toggleVisualizationMode();
          }
          break;
        case 'p':
          // Add pole mode
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            setEditorMode(editorMode === 'add_pole' ? 'move' : 'add_pole');
          }
          break;
        case 'z':
          // Add zero mode
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            setEditorMode(editorMode === 'add_zero' ? 'move' : 'add_zero');
          }
          break;
        case 'r':
          // Toggle rotation
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            setRotationEnabled(!rotationEnabled);
          }
          break;
        case 's':
          // Capture snapshot
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            captureSnapshot();
          }
          break;
        case 'e':
          // Export configuration
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            exportSystemConfig();
          }
          break;
        case 'h':
          // Toggle help
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            setShowHelp(!showHelp);
          }
          break;
        case 'f':
          // Toggle frequency response
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            setShowFrequencyResponse(!showFrequencyResponse);
          }
          break;
        case 't':
          // Toggle time response
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            setShowTimeResponse(!showTimeResponse);
          }
          break;
        case 'i':
          // Toggle impulse response
          if ((e.ctrlKey || e.metaKey) && e.shiftKey) {
            e.preventDefault();
            setShowImpulseResponse(!showImpulseResponse);
          }
          break;
        case 'b':
          // Toggle Bode plot
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            setShowBodePlot(!showBodePlot);
          }
          break;
        case 'escape':
          // Return to move mode
          setEditorMode('move');
          break;
      }
    };
    
    // Add event listener
    window.addEventListener('keydown', handleKeyDown);
    
    // Cleanup
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [
    editorMode, 
    rotationEnabled, 
    showHelp, 
    showFrequencyResponse,
    showTimeResponse,
    showImpulseResponse,
    showBodePlot,
    toggleVisualizationMode,
    captureSnapshot,
    exportSystemConfig
  ]);

  // Effect to synchronize ROC type with causality
  useEffect(() => {
    // For causal systems, ROC is typically outside the outermost pole
    if (systemProperties.isCausal) {
      setRocType('outside');
      
      // Find the outermost pole
      if (poles.length > 0) {
        const poleRadii = poles.map(p => Math.sqrt(p.re * p.re + p.im * p.im));
        const maxRadius = Math.max(...poleRadii);
        setRocRadius(Math.max(maxRadius, 0.1));
      }
    } 
    // For anti-causal systems, ROC is typically inside the innermost pole
    else {
      setRocType('inside');
      
      // Find the innermost pole
      if (poles.length > 0) {
        const poleRadii = poles.map(p => Math.sqrt(p.re * p.re + p.im * p.im));
        const minRadius = Math.min(...poleRadii);
        setRocRadius(Math.min(minRadius, 1.9));
      }
    }
    
    // Update the Z-transform expression
    updateZTransformExpression();
  }, [systemProperties.isCausal, poles, updateZTransformExpression]);

  // Add functions to remove poles and zeros
  const removePole = (index: number) => {
    // Use a callback to ensure we're working with the latest state
    setPoles(currentPoles => {
      const newPoles = [...currentPoles];
      if (index >= 0 && index < newPoles.length) {
        newPoles.splice(index, 1);
        
        // Update ROC based on system properties and causality
        if (systemProperties.isCausal && rocType === 'outside' && newPoles.length > 0) {
          const poleRadii = newPoles.map(p => Math.sqrt(p.re * p.re + p.im * p.im));
          const maxRadius = Math.max(...poleRadii);
          setTimeout(() => setRocRadius(Math.max(maxRadius, 0.1)), 0);
        }
      }
      return newPoles;
    });
    
    // Force update expression in next tick
    setTimeout(() => updateZTransformExpression(), 0);
  };
  
  const removeZero = (index: number) => {
    // Use a callback to ensure we're working with the latest state
    setZeros(currentZeros => {
      const newZeros = [...currentZeros];
      if (index >= 0 && index < newZeros.length) {
        const removedZero = newZeros[index];
        newZeros.splice(index, 1);
        
        // Recalculate if system is minimum phase
        const wasOutsideUnitCircle = Math.sqrt(removedZero.re * removedZero.re + removedZero.im * removedZero.im) > 1;
        if (wasOutsideUnitCircle) {
          // Need to check if all remaining zeros are inside unit circle
          const isMinimumPhase = newZeros.every(z => Math.sqrt(z.re * z.re + z.im * z.im) < 1);
          if (isMinimumPhase !== systemProperties.isMinimumPhase) {
            setTimeout(() => {
              setSystemProperties(prev => ({
                ...prev,
                isMinimumPhase
              }));
            }, 0);
          }
        }
      }
      return newZeros;
    });
    
    // Force update expression in next tick
    setTimeout(() => updateZTransformExpression(), 0);
  };

  // Handle key events for delete functionality
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Delete' || e.key === 'Backspace') {
      if (selectedPoleIndex !== null) {
        removePole(selectedPoleIndex);
        setSelectedPoleIndex(null);
      }
      if (selectedZeroIndex !== null) {
        removeZero(selectedZeroIndex);
        setSelectedZeroIndex(null);
      }
    }
  };
  
  // Add event listener for key events
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedPoleIndex, selectedZeroIndex]);

  // Render the component
  return (
    <div className={`z-transform-visualizer relative ${className}`} style={{ width: '100%', maxWidth: `${width}px`, margin: '0 auto' }}>
      {/* Enhanced sci-fi themed container with subtle animation */}
      <div className="sci-fi-container bg-gradient-to-br from-gray-950 via-blue-950/10 to-gray-900 rounded-xl border border-cyan-700/30 overflow-hidden shadow-2xl relative">
        <div className="absolute inset-0 bg-grid-pattern opacity-20 pointer-events-none"></div>
        <div className="absolute inset-0 bg-noise-pattern opacity-10 pointer-events-none"></div>
        
        {/* Enhanced header with terminal styling */}
        <div className="flex justify-between items-center p-4 border-b border-cyan-700/50 relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500/0 via-cyan-500/70 to-cyan-500/0"></div>
          <h2 className="text-2xl text-cyan-400 font-mono tracking-wider glow-text">Z-TRANSFORM EXPLORER <span className="text-xs text-cyan-600 ml-2 tracking-widest">v2.0</span></h2>
          <div className="flex space-x-2">
            <button 
              onClick={() => setShowEducation(!showEducation)}
              className="cyber-button p-2 bg-gray-800 hover:bg-gray-700 rounded text-cyan-300 border border-cyan-700/50 transition-all duration-200"
              title="Learn about Z-Transforms"
            >
              <span className="text-xs">{showEducation ? 'CLOSE LEARNING' : 'LEARN Z-TRANSFORM'}</span>
            </button>
            <button 
              onClick={() => setRotationEnabled(!rotationEnabled)}
              className="cyber-button p-2 bg-gray-800 hover:bg-gray-700 rounded text-cyan-300 border border-cyan-700/50 transition-all duration-200"
              title="Toggle auto-rotation in 3D mode"
            >
              <span className="text-xs">{rotationEnabled ? 'DISABLE ROTATION' : 'ENABLE ROTATION'}</span>
            </button>
          <button 
            onClick={() => setShowHelp(!showHelp)}
              className="cyber-button p-2 bg-gray-800 hover:bg-gray-700 rounded text-cyan-300 border border-cyan-700/50 transition-all duration-200"
            title="Show help information"
          >
              <span className="text-xs">{showHelp ? 'CLOSE MANUAL' : 'OPEN MANUAL'}</span>
          </button>
          </div>
        </div>
        
        {/* Add Export/Import UI */}
        <div className="flex justify-end px-4 py-2 border-b border-cyan-700/30">
          <div className="flex space-x-2">
            <button 
              onClick={captureSnapshot}
              className="cyber-button p-2 bg-gray-800 hover:bg-gray-700 rounded text-purple-300 border border-purple-700/50 transition-all duration-200"
              title="Save snapshot of current Z-plane"
            >
              <span className="text-xs">CAPTURE SNAPSHOT</span>
            </button>
            
            <button 
              onClick={exportSystemConfig}
              className="cyber-button p-2 bg-gray-800 hover:bg-gray-700 rounded text-emerald-300 border border-emerald-700/50 transition-all duration-200"
              title="Export current configuration"
            >
              <span className="text-xs">EXPORT CONFIG</span>
            </button>
            
            <label className="cyber-button p-2 bg-gray-800 hover:bg-gray-700 rounded text-amber-300 border border-amber-700/50 transition-all duration-200 cursor-pointer">
              <span className="text-xs">IMPORT CONFIG</span>
              <input 
                type="file" 
                accept=".json"
                className="hidden"
                onChange={importSystemConfig} 
              />
            </label>
            </div>
            </div>
        
        {/* Enhanced visualization section - Moved to top */}
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg p-4 mx-4 mb-4 border border-cyan-800/30 shadow-inner" style={{ height: '500px' }}>
          <div className="w-full h-full bg-gray-950 rounded-lg overflow-hidden border border-cyan-800/30 relative shadow-inner">
            {/* Overlay grid for sci-fi effect */}
            <div className="absolute inset-0 bg-grid-pattern opacity-10 pointer-events-none z-10"></div>
            
            {/* Plot with enhanced styling */}
              <Plot
                ref={plotRef}
                data={getPlotData()}
                layout={{
                  ...getPlotLayout(),
                  width: undefined,
                  height: undefined,
                  autosize: true,
                  clickmode: 'event',
                  uirevision: JSON.stringify({poles, zeros, visualizationMode, rocRadius, rocType}),
                  hovermode: 'closest',
                  hoverdistance: 20
                }}
                config={{
                  displayModeBar: true,
                  responsive: true,
                  scrollZoom: true,
                  displaylogo: false,
                  doubleClick: false, // Disable double click to prevent accidental zooming
                  modeBarButtonsToRemove: visualizationMode === '3d' 
                    ? ['lasso2d', 'select2d', 'autoScale2d'] 
                    : []
                }}
                style={{ width: '100%', height: '100%' }}
                useResizeHandler={true}
                onInitialized={(figure) => {
                  // Ensure hover subplot is initialized to prevent errors
                  if (figure && figure.layout) {
                    // Use type assertion to access internal Plotly properties
                    const fullFigure = figure as any;
                    if (fullFigure._fullLayout) {
                      fullFigure._fullLayout._hoversubplot = null;
                    }
                  }
                }}
                onHover={(data) => {
                  // Prevent errors from undefined hover data
                  if (!data || !data.points || !data.points.length) return;
                }}
                onClick={handlePlotClick}
                key={`plot-${poles.length}-${zeros.length}-${visualizationMode}-${editorMode}-${selectedPoleIndex}-${selectedZeroIndex}`}
                className="pole-zero-plot"
              />
            
            {/* HUD-like overlay */}
            <div className="absolute top-2 left-2 text-xs text-cyan-300 bg-gray-900/70 p-2 rounded border border-cyan-700/30 font-mono tracking-wide z-20">
              <div className="flex items-center">
                <div className={`w-2 h-2 rounded-full ${
                  editorMode === 'add_pole' 
                    ? 'bg-red-500 animate-ping'
                    : editorMode === 'add_zero'
                    ? 'bg-blue-500 animate-ping'
                    : editorMode === 'delete'
                    ? 'bg-red-500 animate-pulse'
                    : 'bg-cyan-500'
                } mr-2`}></div>
                {editorMode === 'add_pole' 
                  ? `MODE: ADD POLES${visualizationMode === '3d' ? ' [Z=0 PLANE]' : ''}` 
                  : editorMode === 'add_zero' 
                  ? `MODE: ADD ZEROS${visualizationMode === '3d' ? ' [Z=0 PLANE]' : ''}`
                  : editorMode === 'delete'
                  ? 'MODE: DELETE'
                  : editorMode === 'move'
                  ? 'MODE: MOVE/SELECT'
                  : 'MODE: VIEW ONLY'}
              </div>
            </div>
            
            {/* Contextual cursor indicator */}
            {(editorMode === 'add_pole' || editorMode === 'add_zero') && (
              <div 
                className="absolute pointer-events-none z-30"
                style={{ 
                  left: '50%', 
                  top: '50%',
                  transform: 'translate(-50%, -50%)',
                  display: isAddingPoint ? 'none' : 'block'
                }}
              >
                {editorMode === 'add_pole' ? (
                  <div className="text-red-500 font-bold text-2xl animate-pulse">✕</div>
                ) : (
                  <div className="text-blue-500 font-bold text-2xl animate-pulse">○</div>
                )}
              </div>
            )}
            
            {/* Coordinates display */}
            <div className="absolute bottom-2 right-2 text-xs text-cyan-300 bg-gray-900/70 p-2 rounded border border-cyan-700/30 font-mono tracking-wide z-20">
              <div className="grid grid-cols-2 gap-x-4">
                <span className="text-cyan-500/80">GRID:</span>
                <span>{axisScale.toFixed(1)} UNITS</span>
                <span className="text-cyan-500/80">POLES:</span>
                <span>{poles.length}</span>
                <span className="text-cyan-500/80">ZEROS:</span>
                <span>{zeros.length}</span>
              </div>
              </div>
            </div>
        </div>
        
        {/* Educational Z-Transform Panel */}
        {showEducation && (
          <div className="p-4 bg-gray-900/90 border-b border-cyan-800/50 terminal-text max-h-[500px] overflow-y-auto">
            <div className="terminal-header flex items-center mb-4">
              <div className="w-3 h-3 rounded-full bg-green-500 mr-2 pulse-slow"></div>
              <h3 className="text-lg text-green-300 font-mono tracking-wider">Z-TRANSFORM ACADEMY</h3>
            </div>
            
            {/* Tab Navigation */}
            <div className="flex space-x-2 mb-4">
              {[
                {id: 'basics', label: 'BASICS'}, 
                {id: 'properties', label: 'PROPERTIES'}, 
                {id: 'applications', label: 'APPLICATIONS'},
                {id: 'examples', label: 'EXAMPLES'}
              ].map(tab => (
                <button 
                  key={tab.id}
                  onClick={() => setEducationTab(tab.id as any)}
                  className={`p-2 text-xs font-mono rounded border ${
                    educationTab === tab.id 
                      ? 'bg-green-900/40 border-green-600/60 text-green-300' 
                      : 'bg-gray-800 border-green-600/20 text-green-400/80 hover:bg-gray-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            
            {/* Tab Content */}
            <div className="text-sm text-green-100/90 space-y-3 font-mono leading-relaxed">
              {/* Basics Tab */}
              {educationTab === 'basics' && (
                <>
                  <div className="mb-3">
                    <h4 className="text-green-400 mb-2 font-bold">DEFINITION</h4>
                    <p>The Z-transform converts a discrete-time signal into a complex frequency domain representation.</p>
                    <div className="mt-2 p-2 bg-gray-800/50 rounded border border-green-800/30">
                      <BlockMath math="X(z) = \sum_{n=-\infty}^{\infty} x[n]z^{-n}" />
                    </div>
                    <p className="mt-2">where x[n] is the discrete-time signal and z is a complex variable.</p>
                  </div>
                  
                  <div className="mb-3">
                    <h4 className="text-green-400 mb-2 font-bold">KEY CONCEPTS</h4>
                    <ul className="list-disc pl-5 space-y-2">
                      <li><span className="text-green-400">Poles:</span> Values of z where X(z) becomes infinite</li>
                      <li><span className="text-green-400">Zeros:</span> Values of z where X(z) becomes zero</li>
                      <li><span className="text-green-400">ROC:</span> Region of Convergence where the Z-transform sum converges</li>
                      <li><span className="text-green-400">Unit Circle:</span> |z| = 1, corresponds to the DTFT</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="text-green-400 mb-2 font-bold">TRANSFER FUNCTION</h4>
                    <p>The system transfer function H(z) is the Z-transform of the impulse response h[n]:</p>
                    <div className="mt-2 p-2 bg-gray-800/50 rounded border border-green-800/30">
                      <BlockMath math="H(z) = \frac{Y(z)}{X(z)} = \frac{\sum_{k=0}^{M} b_k z^{-k}}{\sum_{k=0}^{N} a_k z^{-k}}" />
                    </div>
                    <p className="mt-2">The poles and zeros of H(z) determine the system's behavior.</p>
                  </div>
                </>
              )}
              
              {/* Properties Tab */}
              {educationTab === 'properties' && (
                <>
                  <div className="mb-3">
                    <h4 className="text-green-400 mb-2 font-bold">SYSTEM PROPERTIES</h4>
                    <div className="space-y-3">
                      <div className="p-2 bg-gray-800/50 rounded border border-green-800/30">
                        <h5 className="text-green-400">CAUSALITY</h5>
                        <p>A system is causal if h[n] = 0 for n {'<'} 0</p>
                        <p className="mt-1">For a causal system, the ROC is outside the outermost pole.</p>
                      </div>
                      
                      <div className="p-2 bg-gray-800/50 rounded border border-green-800/30">
                        <h5 className="text-green-400">STABILITY</h5>
                        <p>A system is stable if and only if all poles are inside the unit circle (|z| {'<'} 1)</p>
                        <p className="mt-1">For a stable system, the ROC includes the unit circle.</p>
                      </div>
                      
                      <div className="p-2 bg-gray-800/50 rounded border border-green-800/30">
                        <h5 className="text-green-400">POLE-ZERO PATTERNS</h5>
                        <ul className="list-disc pl-5 mt-1">
                          <li>Poles determine natural response (homogeneous solution)</li>
                          <li>Zeros modify the natural response (particular solution)</li>
                          <li>Pole magnitude determines decay/growth rate</li>
                          <li>Pole angle determines oscillation frequency</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-green-400 mb-2 font-bold">FREQUENCY RESPONSE</h4>
                    <p>Evaluating H(z) on the unit circle (z = e{'{j\\omega}'}) gives the frequency response:</p>
                    <div className="mt-2 p-2 bg-gray-800/50 rounded border border-green-800/30">
                      <BlockMath math="H(e^{j\\omega}) = |H(e^{j\\omega})|e^{j\\angle H(e^{j\\omega})}" />
                    </div>
                    <ul className="list-disc pl-5 mt-2">
                      <li><span className="text-green-400">Magnitude Response:</span> |H(e{'{j\\omega}'})| shows how the system amplifies/attenuates frequencies</li>
                      <li><span className="text-green-400">Phase Response:</span> ∠H(e{'{j\\omega}'}) shows how the system shifts phase at different frequencies</li>
                    </ul>
                  </div>
                </>
              )}
              
              {/* Applications Tab */}
              {educationTab === 'applications' && (
                <>
                  <div className="mb-3">
                    <h4 className="text-green-400 mb-2 font-bold">FILTER DESIGN</h4>
                    <p>Z-transform analysis is crucial for designing digital filters:</p>
                    <ul className="list-disc pl-5 mt-1 space-y-1">
                      <li><span className="text-green-400">Low-pass filters:</span> Pass low frequencies, typically poles near z=1</li>
                      <li><span className="text-green-400">High-pass filters:</span> Pass high frequencies, typically zeros near z=1</li>
                      <li><span className="text-green-400">Band-pass filters:</span> Pass a specific frequency band, complex poles with angles corresponding to pass frequencies</li>
                      <li><span className="text-green-400">Notch filters:</span> Reject specific frequencies, zeros on unit circle at notch frequency</li>
                    </ul>
                  </div>
                  
                  <div className="mb-3">
                    <h4 className="text-green-400 mb-2 font-bold">SYSTEM ANALYSIS</h4>
                    <ul className="list-disc pl-5 space-y-1">
                      <li><span className="text-green-400">Difference equations:</span> Convert between time domain and Z-domain</li>
                      <li><span className="text-green-400">Stability analysis:</span> Determine if a system is stable by examining pole locations</li>
                      <li><span className="text-green-400">Steady-state response:</span> Analyze how systems respond to sinusoidal inputs</li>
                      <li><span className="text-green-400">Control systems:</span> Analyze feedback systems and design controllers</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="text-green-400 mb-2 font-bold">PRACTICAL APPLICATIONS</h4>
                    <ul className="list-disc pl-5 space-y-1">
                      <li><span className="text-green-400">Audio processing:</span> Equalizers, reverb, compression</li>
                      <li><span className="text-green-400">Image processing:</span> Blur, sharpen, edge detection</li>
                      <li><span className="text-green-400">Communications:</span> Modulation, demodulation, equalization</li>
                      <li><span className="text-green-400">Biomedical:</span> ECG/EEG signal analysis</li>
                      <li><span className="text-green-400">Finance:</span> Time series analysis, forecasting</li>
                    </ul>
                  </div>
                </>
              )}
              
              {/* Examples Tab */}
              {educationTab === 'examples' && (
                <>
                  <div className="mb-3">
                    <h4 className="text-green-400 mb-2 font-bold">COMMON Z-TRANSFORM PAIRS</h4>
                    <div className="grid grid-cols-1 gap-2">
                      <div className="p-2 bg-gray-800/50 rounded border border-green-800/30">
                        <p><span className="text-green-400">Unit impulse:</span> δ[n] ↔ 1</p>
                        <p>ROC: All z</p>
                      </div>
                      <div className="p-2 bg-gray-800/50 rounded border border-green-800/30">
                        <p><span className="text-green-400">Unit step:</span> u[n] ↔ z/(z-1)</p>
                        <p>ROC: |z| {'>'} 1</p>
                      </div>
                      <div className="p-2 bg-gray-800/50 rounded border border-green-800/30">
                        <p><span className="text-green-400">Exponential:</span> a^n u[n] ↔ z/(z-a)</p>
                        <p>ROC: |z| {'>'} |a|</p>
                      </div>
                      <div className="p-2 bg-gray-800/50 rounded border border-green-800/30">
                        <p><span className="text-green-400">Sinusoid:</span> sin(ω₀n)u[n] ↔ (z sin ω₀)/(z² - 2z cos ω₀ + 1)</p>
                        <p>ROC: |z| {'>'} 1</p>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-green-400 mb-2 font-bold">SYSTEM EXAMPLES</h4>
                    <div className="grid grid-cols-1 gap-2">
                      <div className="p-2 bg-gray-800/50 rounded border border-green-800/30">
                        <p><span className="text-green-400">Moving average (N points):</span></p>
                        <BlockMath math="H(z) = \frac{1}{N}(1 + z^{-1} + z^{-2} + ... + z^{-(N-1)})" />
                        <p>All zeros except at z = 0, one pole at origin</p>
                      </div>
                      <div className="p-2 bg-gray-800/50 rounded border border-green-800/30">
                        <p><span className="text-green-400">First-order IIR filter:</span></p>
                        <BlockMath math="H(z) = \frac{b_0}{1 - a_1 z^{-1}}" />
                        <p>One pole at z = a₁, causal and stable if |a₁| {'<'} 1</p>
                      </div>
                      <div className="p-2 bg-gray-800/50 rounded border border-green-800/30">
                        <p><span className="text-green-400">Second-order resonator:</span></p>
                        <BlockMath math="H(z) = \frac{b_0}{1 - 2r\cos(\omega_0)z^{-1} + r^2z^{-2}}" />
                        <p>Complex conjugate poles at re^±jω₀, controls resonance at ω₀</p>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
        
        {/* Control section with enhanced sci-fi styling */}
        <div className="mb-4 px-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Mode controls with cyber styling */}
            <div className="p-3 bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg border border-cyan-800/30 shadow-inner terminal-panel">
              <div className="mb-2 flex items-center">
                <div className="w-2 h-2 rounded-full bg-cyan-500 mr-2 pulse-slow"></div>
                <h3 className="text-lg text-cyan-300 font-mono tracking-wide">EDIT MODE</h3>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col space-y-2">
                  <button
                    onClick={() => setEditorMode(editorMode === 'add_pole' ? 'move' : 'add_pole')}
                    className={`p-2 rounded-md border ${editorMode === 'add_pole'
                      ? 'bg-red-900/60 border-red-600/80 text-red-300 cyber-button-active shadow-inner shadow-red-900/50' 
                      : 'bg-gray-800 border-red-600/30 text-red-400/80 hover:bg-gray-700 cyber-button hover:shadow-red-900/30'
                    }`}
                  >
                    <div className="flex items-center justify-center">
                      <span className="mr-2">{editorMode === 'add_pole' ? '■' : '+'}</span>
                      <span className="text-xs tracking-wider font-mono">
                        {editorMode === 'add_pole' ? 'STOP POLES' : 'ADD POLES'}
                      </span>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => setEditorMode(editorMode === 'add_zero' ? 'move' : 'add_zero')}
                    className={`p-2 rounded-md border ${editorMode === 'add_zero'
                      ? 'bg-blue-900/60 border-blue-600/80 text-blue-300 cyber-button-active shadow-inner shadow-blue-900/50' 
                      : 'bg-gray-800 border-blue-600/30 text-blue-400/80 hover:bg-gray-700 cyber-button hover:shadow-blue-900/30'
                    }`}
                  >
                    <div className="flex items-center justify-center">
                      <span className="mr-2">{editorMode === 'add_zero' ? '■' : '○'}</span>
                      <span className="text-xs tracking-wider font-mono">
                        {editorMode === 'add_zero' ? 'STOP ZEROS' : 'ADD ZEROS'}
                      </span>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => setEditorMode(editorMode === 'delete' ? 'move' : 'delete')}
                    className={`p-2 rounded-md border ${editorMode === 'delete'
                      ? 'bg-red-900/60 border-red-600/80 text-red-300 cyber-button-active shadow-inner shadow-red-900/50' 
                      : 'bg-gray-800 border-red-600/30 text-red-400/80 hover:bg-gray-700 cyber-button hover:shadow-red-900/30'
                    }`}
                  >
                    <div className="flex items-center justify-center">
                      <span className="mr-2">{editorMode === 'delete' ? '■' : '✕'}</span>
                      <span className="text-xs tracking-wider font-mono">
                        {editorMode === 'delete' ? 'STOP DELETE' : 'DELETE MODE'}
                      </span>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => {
                      // Clear all poles and zeros
                      setPoles([]);
                      setZeros([]);
                      setTimeout(() => updateZTransformExpression(), 0);
                    }}
                    className="p-2 rounded-md border bg-gray-800 border-gray-600/30 text-gray-400/80 hover:bg-gray-700 hover:border-gray-500/50 hover:text-gray-300 cyber-button"
                  >
                    <div className="flex items-center justify-center">
                      <span className="text-xs tracking-wider font-mono">CLEAR ALL</span>
                    </div>
                  </button>
                </div>
              </div>
              <div className="text-xs text-cyan-500/60 mt-2 terminal-hint">
                <span className="blink">{'>'}</span> CLICK ON Z-PLANE TO ADD ELEMENTS • MODE: {editorMode.toUpperCase()}
              </div>
            </div>
            
            {/* View mode with cyber styling */}
            <div className="p-3 bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg border border-cyan-800/30 shadow-inner terminal-panel">
              <div className="mb-2 flex items-center">
                <div className="w-2 h-2 rounded-full bg-cyan-500 mr-2 pulse-slow"></div>
                <h3 className="text-lg text-cyan-300 font-mono tracking-wide">VIEW MODE</h3>
              </div>
              <button
                onClick={toggleVisualizationMode}
                className="w-full p-2 rounded border cyber-button bg-gray-800 border-cyan-600/30 text-cyan-400/80 hover:bg-gray-700"
                title="Switch between 2D and 3D visualization of the Z-plane."
              >
                <div className="flex items-center justify-center">
                  <span className="text-xs tracking-wider font-mono">
                    {visualizationMode === '3d' ? '2D PROJECTION' : '3D HOLOGRAM'}
                  </span>
                </div>
              </button>
              
              {/* Conditional 3D specific controls */}
              {visualizationMode === '3d' && (
                <div className="mt-2 border-t border-cyan-800/20 pt-2">
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <div className="flex items-center">
                      <span className="text-xs text-cyan-500/80 font-mono">FREQ RESP:</span>
              </div>
                    <div className="flex items-center justify-end">
                      <button 
                        onClick={() => setShowFrequencyResponse(!showFrequencyResponse)}
                        className={`text-xs p-1 rounded border font-mono ${
                          showFrequencyResponse
                            ? 'bg-yellow-900/30 border-yellow-600/50 text-yellow-300' 
                            : 'bg-gray-800 border-gray-600/50 text-gray-300'
                        }`}
                      >
                        {showFrequencyResponse ? 'VISIBLE' : 'HIDDEN'}
                      </button>
            </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <div className="flex items-center">
                      <span className="text-xs text-cyan-500/80 font-mono">QUALITY:</span>
                    </div>
                    <div className="flex items-center justify-end space-x-1">
                      {['low', 'medium', 'high'].map((quality) => (
                        <button 
                          key={quality}
                          onClick={() => setSurfaceQuality(quality as 'low' | 'medium' | 'high')}
                          className={`text-xs p-1 rounded border font-mono ${
                            surfaceQuality === quality
                              ? 'bg-cyan-900/30 border-cyan-600/50 text-cyan-300' 
                              : 'bg-gray-800 border-gray-600/50 text-gray-300'
                          }`}
                        >
                          {quality.toUpperCase().charAt(0)}
                        </button>
                      ))}
          </div>
        </div>
        
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <div className="flex items-center">
                      <span className="text-xs text-cyan-500/80 font-mono">VIEW:</span>
                    </div>
                    <div className="flex items-center justify-end space-x-1">
                      {['top', 'side', 'perspective'].map((preset) => (
                        <button 
                          key={preset}
                          onClick={() => {
                            setViewPreset(preset as 'top' | 'side' | 'perspective');
                            setRotationEnabled(false);
                          }}
                          className={`text-xs p-1 rounded border font-mono ${
                            viewPreset === preset && !rotationEnabled
                              ? 'bg-cyan-900/30 border-cyan-600/50 text-cyan-300' 
                              : 'bg-gray-800 border-gray-600/50 text-gray-300'
                          }`}
                        >
                          {preset.toUpperCase().charAt(0)}
                        </button>
                      ))}
                      <button
                        onClick={() => setRotationEnabled(!rotationEnabled)}
                        className={`text-xs p-1 rounded border font-mono ${
                          rotationEnabled
                            ? 'bg-cyan-900/30 border-cyan-600/50 text-cyan-300' 
                            : 'bg-gray-800 border-gray-600/50 text-gray-300'
                        }`}
                      >
                        R
                      </button>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-2 mt-2">
                <div className="flex items-center justify-center">
                  <label className="text-xs text-cyan-500/80 font-mono">GRID SCALE</label>
                </div>
                <div className="flex items-center justify-center">
                  <input 
                    type="range" 
                    min="1" 
                    max="3" 
                    step="0.1" 
                    value={axisScale}
                    onChange={(e) => setAxisScale(parseFloat(e.target.value))}
                    className="cyber-slider w-full"
                  />
                </div>
              </div>
              <div className="text-xs text-cyan-500/60 mt-2 terminal-hint">
                <span className="blink">{'>'}</span> CURRENT MODE: {visualizationMode === '3d' ? '3D VISUALIZATION' : '2D COMPLEX PLANE'}
              </div>
            </div>
          </div>
          
          {/* System Properties Panel */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            
            {/* Advanced Visualization Options */}
            <ControlDropdown
              title="ADVANCED VISUALIZATION"
              icon="triangle"
              color="emerald"
              isOpen={advancedVisualizationDropdownOpen}
              onToggle={() => setAdvancedVisualizationDropdownOpen(!advancedVisualizationDropdownOpen)}
            >
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
                {/* Phase Response Toggle */}
                <div className="flex flex-col space-y-1">
                  <span className="text-xs text-emerald-300/80 font-mono">SHOW PHASE:</span>
                  <button
                    onClick={() => setSurfaceView(surfaceView === 'phase' ? 'magnitude' : 'phase')}
                    className={`text-xs p-1 px-2 rounded border font-mono ${
                      surfaceView === 'phase'
                        ? 'bg-emerald-900/40 border-emerald-600/60 text-emerald-300' 
                        : 'bg-gray-800 border-gray-600/50 text-gray-300'
                    }`}
                  >
                    {surfaceView === 'phase' ? 'ENABLED' : 'DISABLED'}
                  </button>
        </div>
        
                {/* Unit Circle Highlight */}
                <div className="flex flex-col space-y-1">
                  <span className="text-xs text-emerald-300/80 font-mono">UNIT CIRCLE:</span>
                  <button 
                    onClick={() => setShowFrequencyResponse(!showFrequencyResponse)}
                    className={`text-xs p-1 px-2 rounded border font-mono ${
                      showFrequencyResponse
                        ? 'bg-emerald-900/40 border-emerald-600/60 text-emerald-300' 
                        : 'bg-gray-800 border-gray-600/50 text-gray-300'
                    }`}
                  >
                    {showFrequencyResponse ? 'HIGHLIGHT' : 'NORMAL'}
                  </button>
            </div>
                
                {/* Trace Poles/Zeros Movement */}
                <div className="flex flex-col space-y-1">
                  <span className="text-xs text-emerald-300/80 font-mono">TRACE MOVEMENT:</span>
                  <button 
                    onClick={() => setShowContours(!showContours)}
                    className={`text-xs p-1 px-2 rounded border font-mono ${
                      showContours
                        ? 'bg-emerald-900/40 border-emerald-600/60 text-emerald-300' 
                        : 'bg-gray-800 border-gray-600/50 text-gray-300'
                    }`}
                  >
                    {showContours ? 'ENABLED' : 'DISABLED'}
                  </button>
                </div>
                
                {/* Display Guidelines */}
                <div className="flex flex-col space-y-1">
                  <span className="text-xs text-emerald-300/80 font-mono">GUIDELINES:</span>
                  <button
                    onClick={() => {
                      // Toggle guidelines for π/4, π/2, 3π/4 angles
                      // This is just a UI indication; actual implementation would add lines to plot
                      const btn = document.getElementById('guidelinesBtn');
                      if (btn) {
                        btn.classList.toggle('bg-emerald-900/40');
                        btn.classList.toggle('border-emerald-600/60');
                        btn.classList.toggle('text-emerald-300');
                        btn.classList.toggle('bg-gray-800');
                        btn.classList.toggle('border-gray-600/50');
                        btn.classList.toggle('text-gray-300');
                      }
                    }}
                    id="guidelinesBtn"
                    className="text-xs p-1 px-2 rounded border font-mono bg-gray-800 border-gray-600/50 text-gray-300"
                  >
                    ANGLES
                  </button>
                </div>
                
                {/* Pole-Zero Labeling */}
                <div className="flex flex-col space-y-1">
                  <span className="text-xs text-emerald-300/80 font-mono">LABELING:</span>
                  <button
                    onClick={() => {
                      // Toggle pole-zero labeling
                      // This is just a UI indication; actual implementation would add labels to plot
                      const btn = document.getElementById('labelingBtn');
                      if (btn) {
                        btn.classList.toggle('bg-emerald-900/40');
                        btn.classList.toggle('border-emerald-600/60');
                        btn.classList.toggle('text-emerald-300');
                        btn.classList.toggle('bg-gray-800');
                        btn.classList.toggle('border-gray-600/50');
                        btn.classList.toggle('text-gray-300');
                      }
                    }}
                    id="labelingBtn"
                    className="text-xs p-1 px-2 rounded border font-mono bg-gray-800 border-gray-600/50 text-gray-300"
                  >
                    COORDINATES
                  </button>
                </div>
                
                {/* Quality Selector */}
                <div className="flex flex-col space-y-1">
                  <span className="text-xs text-emerald-300/80 font-mono">QUALITY:</span>
                  <div className="flex items-center space-x-1">
                    {['low', 'medium', 'high'].map((quality) => (
                      <button 
                        key={quality}
                        onClick={() => setSurfaceQuality(quality as 'low' | 'medium' | 'high')}
                        className={`text-xs p-1 rounded border font-mono ${
                          surfaceQuality === quality
                            ? 'bg-emerald-900/40 border-emerald-600/60 text-emerald-300' 
                            : 'bg-gray-800 border-gray-600/50 text-gray-300'
                        }`}
                      >
                        {quality.charAt(0).toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </ControlDropdown>
            
            {/* System Properties */}
            <ControlDropdown
              title="SYSTEM PROPERTIES"
              icon="triangle"
              color="purple"
              isOpen={systemPropertiesDropdownOpen}
              onToggle={() => setSystemPropertiesDropdownOpen(!systemPropertiesDropdownOpen)}
            >
              <div className="grid grid-cols-1 gap-2">
                {/* Causality */}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-purple-300/80 font-mono">CAUSALITY:</span>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        // For a causal system, ROC is outside the outermost pole
                        const newSystemProps = {...systemProperties, isCausal: true};
                        setSystemProperties(newSystemProps);
                        // Update ROC
                        setRocType('outside');
                        // Find the outermost pole
                        const poleRadii = poles.map(p => Math.sqrt(p.re * p.re + p.im * p.im));
                        if (poleRadii.length > 0) {
                          const maxRadius = Math.max(...poleRadii);
                          setRocRadius(maxRadius);
                        }
                      }}
                      className={`text-xs p-1 px-2 rounded border font-mono ${
                        systemProperties.isCausal
                          ? 'bg-purple-900/40 border-purple-600/60 text-purple-300' 
                          : 'bg-gray-800 border-gray-600/50 text-gray-300'
                      }`}
                    >
                      CAUSAL
                    </button>
                    <button
                      onClick={() => {
                        const newSystemProps = {...systemProperties, isCausal: false};
                        setSystemProperties(newSystemProps);
                      }}
                      className={`text-xs p-1 px-2 rounded border font-mono ${
                        !systemProperties.isCausal
                          ? 'bg-purple-900/40 border-purple-600/60 text-purple-300' 
                          : 'bg-gray-800 border-gray-600/50 text-gray-300'
                      }`}
                    >
                      NON-CAUSAL
                    </button>
                  </div>
                </div>
                
                {/* Stability with detailed indicators */}
                <div className="flex flex-col space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-purple-300/80 font-mono">STABILITY:</span>
                    <div className="flex items-center">
                      <div className={`h-4 w-4 rounded-full mr-2 ${
                        // System is stable if all poles are inside unit circle
                        systemProperties.isStable
                          ? 'bg-green-500'  // Stable
                          : poles.some(p => Math.abs(Math.sqrt(p.re * p.re + p.im * p.im) - 1) < 0.001)
                            ? 'bg-yellow-500' // Marginally stable
                            : 'bg-red-500'    // Unstable
                      }`}></div>
                      <span className="text-xs font-mono">
                        {systemProperties.isStable
                          ? 'STABLE'
                          : poles.some(p => Math.abs(Math.sqrt(p.re * p.re + p.im * p.im) - 1) < 0.001)
                            ? 'MARGINALLY STABLE'
                            : 'UNSTABLE'}
                      </span>
                    </div>
                  </div>
                  <div className="text-xs text-purple-300/60 pl-2">
                    {systemProperties.isStable
                      ? 'All poles inside unit circle'
                      : poles.some(p => Math.abs(Math.sqrt(p.re * p.re + p.im * p.im) - 1) < 0.001)
                        ? 'Has pole(s) on unit circle'
                        : 'Pole(s) outside unit circle'}
                  </div>
                </div>
                
                {/* System Analysis */}
                <div className="mt-1 p-2 bg-purple-900/20 rounded border border-purple-600/30">
                  <span className="text-xs text-purple-300/80 font-mono">SYSTEM ANALYSIS:</span>
                  <div className="text-xs text-purple-200 mt-1 space-y-1 terminal-hint">
                    <div className="flex justify-between">
                      <span>Impulse Response:</span>
                      <span>{systemProperties.isStable ? 'Absolutely Summable' : 'Not Summable'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Phase Type:</span>
                      <span>
                        {systemProperties.isMinimumPhase ? 'Minimum Phase' : 
                         systemProperties.hasLinearPhase ? 'Linear Phase' : 
                         'Mixed Phase'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>System Type:</span>
                      <span>
                        {poles.some(p => Math.abs(p.re - 1) < 0.001 && Math.abs(p.im) < 0.001) ? 'Integrator' : 
                         zeros.some(z => Math.abs(z.re - 1) < 0.001 && Math.abs(z.im) < 0.001) ? 'Differentiator' : 
                         poles.some(p => Math.abs(Math.sqrt(p.re * p.re + p.im * p.im) - 1) < 0.001) ? 'Oscillator' : 
                         poles.length === 0 && zeros.length === 0 ? 'Identity' :
                         poles.length > 0 ? 'General IIR' : 'FIR'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mt-2 pt-2 border-t border-purple-800/30">
                      <span>Z-Transform:</span>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            setTransformType('unilateral');
                            updateZTransformExpression();
                          }}
                          className={`text-xs px-1 rounded ${
                            transformType === 'unilateral'
                              ? 'bg-purple-900/40 text-purple-300' 
                              : 'text-gray-400 hover:text-gray-200'
                          }`}
                        >
                          Unilateral
                        </button>
                        <button
                          onClick={() => {
                            setTransformType('bilateral');
                            updateZTransformExpression();
                          }}
                          className={`text-xs px-1 rounded ${
                            transformType === 'bilateral'
                              ? 'bg-purple-900/40 text-purple-300' 
                              : 'text-gray-400 hover:text-gray-200'
                          }`}
                        >
                          Bilateral
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* ROC Type Selection */}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-purple-300/80 font-mono">ROC TYPE:</span>
                  <div className="flex items-center space-x-1">
                    {['inside', 'outside', 'annular'].map((type) => (
                      <button 
                        key={type}
                        onClick={() => setRocType(type as 'inside' | 'outside' | 'annular')}
                        className={`text-xs p-1 rounded border font-mono ${
                          rocType === type
                            ? 'bg-purple-900/40 border-purple-600/60 text-purple-300' 
                            : 'bg-gray-800 border-gray-600/50 text-gray-300'
                        }`}
                      >
                        {type.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* ROC Radius Control */}
                <div className="grid grid-cols-3 gap-2 items-center">
                  <span className="text-xs text-purple-300/80 font-mono">ROC RADIUS:</span>
                  <input 
                    type="range" 
                    min="0.1" 
                    max="2" 
                    step="0.1" 
                    value={rocRadius}
                    onChange={(e) => setRocRadius(parseFloat(e.target.value))}
                    className="cyber-slider col-span-1"
                  />
                  <div className="text-right">
                    <span className="text-xs font-mono text-purple-300">{rocRadius.toFixed(1)}</span>
                  </div>
                </div>
              </div>
            </ControlDropdown>
            
            {/* Time Domain Response */}
            <ControlDropdown
              title="TIME RESPONSES"
              icon="triangle"
              color="amber"
              isOpen={timeResponseDropdownOpen}
              onToggle={() => setTimeResponseDropdownOpen(!timeResponseDropdownOpen)}
            >
              <div className="grid grid-cols-1 gap-3">
                <button
                  onClick={() => setShowTimeResponse(!showTimeResponse)}
                  className={`p-2 rounded border ${
                    showTimeResponse
                      ? 'bg-amber-900/40 border-amber-600/60 text-amber-300 cyber-button-active' 
                      : 'bg-gray-800 border-amber-600/30 text-amber-400/80 hover:bg-gray-700 cyber-button'
                  }`}
                >
                  <div className="flex items-center justify-center">
                    <span className="text-xs tracking-wider font-mono">
                      {showTimeResponse ? 'HIDE STEP RESPONSE' : 'SHOW STEP RESPONSE'}
                    </span>
                  </div>
                </button>
                
                <button
                  onClick={() => setShowImpulseResponse(!showImpulseResponse)}
                  className={`p-2 rounded border ${
                    showImpulseResponse
                      ? 'bg-amber-900/40 border-amber-600/60 text-amber-300 cyber-button-active' 
                      : 'bg-gray-800 border-amber-600/30 text-amber-400/80 hover:bg-gray-700 cyber-button'
                  }`}
                >
                  <div className="flex items-center justify-center">
                    <span className="text-xs tracking-wider font-mono">
                      {showImpulseResponse ? 'HIDE IMPULSE RESPONSE' : 'SHOW IMPULSE RESPONSE'}
                    </span>
                  </div>
                </button>
              </div>
            </ControlDropdown>
          </div>
        </div>
        
        {/* Add new Bode Plot visualization section */}
        <ControlDropdown
          title="BODE PLOT"
          icon="triangle"
          color="amber"
          isOpen={bodePlotDropdownOpen}
          onToggle={() => setBodePlotDropdownOpen(!bodePlotDropdownOpen)}
        >
          <div className="grid grid-cols-1 gap-3">
            <button
              onClick={() => setShowBodePlot(!showBodePlot)}
              className={`p-2 rounded border ${
                showBodePlot
                  ? 'bg-amber-900/40 border-amber-600/60 text-amber-300 cyber-button-active' 
                  : 'bg-gray-800 border-amber-600/30 text-amber-400/80 hover:bg-gray-700 cyber-button'
              }`}
            >
              <div className="flex items-center justify-center">
                <span className="text-xs tracking-wider font-mono">
                  {showBodePlot ? 'HIDE BODE PLOT' : 'SHOW BODE PLOT'}
                </span>
              </div>
            </button>
            
            {/* Bode Plot Container */}
            {showBodePlot && (
              <div className="grid grid-cols-1 gap-4">
                {/* Magnitude Response Plot */}
                <div className="relative h-48 border border-amber-600/30 rounded">
                  <Plot
                    data={[
                      {
                        x: generateFrequencyResponse().omega.map(w => w / Math.PI),
                        y: generateFrequencyResponse().magnitude.map(m => 20 * Math.log10(m)),
                        type: 'scatter',
                        mode: 'lines',
                        name: 'Magnitude Response',
                        line: {
                          color: 'rgba(255, 180, 0, 1)',
                          width: 3
                        },
                        hovertemplate: 'ω/π: %{x:.2f}<br>|H(e^jω)|: %{y:.2f} dB'
                      }
                    ]}
                    layout={{
                      title: {
                        text: 'MAGNITUDE RESPONSE',
                        font: {
                          family: '"Space Mono", "Courier New", monospace',
                          size: 12,
                          color: '#00ccff'
                        }
                      },
                      xaxis: {
                        title: {
                          text: 'Normalized Frequency (×π rad/sample)',
                          font: {
                            family: '"Space Mono", "Courier New", monospace',
                            size: 10,
                            color: '#00ccff'
                          }
                        },
                        gridcolor: 'rgba(0, 210, 255, 0.15)',
                        zerolinecolor: 'rgba(0, 255, 255, 0.8)'
                      },
                      yaxis: {
                        title: {
                          text: 'Magnitude (dB)',
                          font: {
                            family: '"Space Mono", "Courier New", monospace',
                            size: 10,
                            color: '#00ccff'
                          }
                        },
                        gridcolor: 'rgba(0, 210, 255, 0.15)',
                        zerolinecolor: 'rgba(0, 255, 255, 0.8)'
                      },
                      paper_bgcolor: 'rgba(0,0,0,0)',
                      plot_bgcolor: 'rgba(0,10,25,0.95)',
                      margin: { l: 50, r: 20, t: 30, b: 40 },
                      legend: {
                        font: {
                          family: '"Space Mono", "Courier New", monospace',
                          color: '#e0e0e0',
                          size: 10
                        },
                        bgcolor: 'rgba(0, 20, 40, 0.8)',
                        bordercolor: 'rgba(0, 210, 255, 0.3)',
                        borderwidth: 1
                      }
                    }}
                    style={{ width: '100%', height: '100%' }}
                  />
                </div>
                
                {/* Phase Response Plot */}
                <div className="relative h-48 border border-amber-600/30 rounded">
                  <Plot
                    data={[
                      {
                        x: generateFrequencyResponse().omega.map(w => w / Math.PI),
                        y: generateFrequencyResponse().phase.map(p => p * 180 / Math.PI),
                        type: 'scatter',
                        mode: 'lines',
                        name: 'Phase Response',
                        line: {
                          color: 'rgba(0, 180, 255, 1)',
                          width: 3
                        },
                        hovertemplate: 'ω/π: %{x:.2f}<br>∠H(e^jω): %{y:.2f}°'
                      }
                    ]}
                    layout={{
                      title: {
                        text: 'PHASE RESPONSE',
                        font: {
                          family: '"Space Mono", "Courier New", monospace',
                          size: 12,
                          color: '#00ccff'
                        }
                      },
                      xaxis: {
                        title: {
                          text: 'Normalized Frequency (×π rad/sample)',
                          font: {
                            family: '"Space Mono", "Courier New", monospace',
                            size: 10,
                            color: '#00ccff'
                          }
                        },
                        gridcolor: 'rgba(0, 210, 255, 0.15)',
                        zerolinecolor: 'rgba(0, 255, 255, 0.8)'
                      },
                      yaxis: {
                        title: {
                          text: 'Phase (degrees)',
                          font: {
                            family: '"Space Mono", "Courier New", monospace',
                            size: 10,
                            color: '#00ccff'
                          }
                        },
                        gridcolor: 'rgba(0, 210, 255, 0.15)',
                        zerolinecolor: 'rgba(0, 255, 255, 0.8)'
                      },
                      paper_bgcolor: 'rgba(0,0,0,0)',
                      plot_bgcolor: 'rgba(0,10,25,0.95)',
                      margin: { l: 50, r: 20, t: 30, b: 40 },
                      legend: {
                        font: {
                          family: '"Space Mono", "Courier New", monospace',
                          color: '#e0e0e0',
                          size: 10
                        },
                        bgcolor: 'rgba(0, 20, 40, 0.8)',
                        bordercolor: 'rgba(0, 210, 255, 0.3)',
                        borderwidth: 1
                      }
                    }}
                    style={{ width: '100%', height: '100%' }}
                  />
                </div>
              </div>
            )}
          </div>
        </ControlDropdown>
        
        {/* Signal Presets dropdown - Add to right side menu */}
        {!hideSignalSelector && (
          <ControlDropdown
            title="SIGNAL PRESETS"
            icon="triangle"
            color="cyan"
            isOpen={signalPresetsDropdownOpen}
            onToggle={() => setSignalPresetsDropdownOpen(!signalPresetsDropdownOpen)}
          >
            <div className="grid grid-cols-1 gap-2">
              {Object.entries(SIGNAL_EXAMPLES).map(([key, example]) => (
                <button
                  key={key}
                  onClick={() => selectSignal(key as SignalType)}
                  className={`p-2 rounded border ${
                    selectedSignal === key
                      ? 'bg-cyan-900/40 border-cyan-600/60 text-cyan-300 cyber-button-active'
                      : 'bg-gray-800 border-cyan-600/30 text-cyan-400/80 hover:bg-gray-700 cyber-button'
                  }`}
                >
                  <div className="text-xs font-bold font-mono tracking-wide">{example.name.toUpperCase()}</div>
                  <div className="text-xs text-cyan-400/60 mt-1">{example.description}</div>
                </button>
              ))}
            </div>
            <div className="text-xs text-cyan-500/60 mt-2 terminal-hint">
              <span className="blink">{'>'}</span> SELECTED: {SIGNAL_EXAMPLES[selectedSignal]?.name.toUpperCase() || 'CUSTOM SIGNAL'}
            </div>
          </ControlDropdown>
        )}
        
        {/* Z-Transform equation display with terminal styling */}
        <div className="z-transform-equation mb-4 mx-4 p-3 bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg border border-cyan-800/30 shadow-inner terminal-panel">
          <div className="mb-2 flex items-center">
            <div className="w-2 h-2 rounded-full bg-cyan-500 mr-2 pulse-slow"></div>
            <h3 className="text-lg text-cyan-300 font-mono tracking-wide">TRANSFER FUNCTION</h3>
          </div>
          <div className="equation-display p-3 bg-gray-950 rounded border border-cyan-800/20 overflow-x-auto shadow-inner">
            {/* Show the Z-transform definition based on transform type */}
            <div className="mb-3 text-center text-cyan-500/80 text-sm font-mono">
              {transformType === 'bilateral' 
                ? <BlockMath math="X(z) = \sum_{n=-\infty}^{\infty} x[n]z^{-n}" />
                : <BlockMath math="X(z) = \sum_{n=0}^{\infty} x[n]z^{-n}" />
              }
            </div>
            {zTransformResult ? (
              formatZTransform(zTransformResult)
            ) : (
              <div className="text-cyan-400/60 text-center font-mono">NO TRANSFER FUNCTION AVAILABLE</div>
            )}
          </div>
          <div className="text-xs text-cyan-500/60 mt-2 terminal-hint">
            <span className="blink">{'>'}</span> POLES: {poles.length} • ZEROS: {zeros.length} • ROC TYPE: {rocType.toUpperCase()}
          </div>
        </div>
        
        {/* Time Domain Response Plots */}
        {(showTimeResponse || showImpulseResponse) && (
          <div className="time-response mb-4 mx-4 p-3 bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg border border-cyan-800/30 shadow-inner terminal-panel">
            <div className="mb-2 flex items-center">
              <div className="w-2 h-2 rounded-full bg-amber-500 mr-2 pulse-slow"></div>
              <h3 className="text-lg text-amber-300 font-mono tracking-wide">TIME DOMAIN RESPONSE</h3>
            </div>
            <div className="bg-gray-950 rounded border border-amber-800/20 overflow-hidden shadow-inner" style={{ height: '200px' }}>
              <Plot
                data={getTimeResponsePlotData()}
                layout={{
                  title: {
                    text: 'Discrete-Time Response',
                    font: {
                      family: '"Space Mono", "Courier New", monospace',
                      size: 16,
                      color: '#f59e0b'
                    }
                  },
                  xaxis: {
                    title: {
                      text: 'n (samples)',
                      font: {
                        family: '"Space Mono", "Courier New", monospace',
                        color: '#f59e0b'
                      }
                    },
                    gridcolor: 'rgba(255, 180, 0, 0.15)',
                    zerolinecolor: 'rgba(255, 180, 0, 0.4)',
                    showgrid: true,
                    zeroline: true
                  },
                  yaxis: {
                    title: {
                      text: 'Amplitude',
                      font: {
                        family: '"Space Mono", "Courier New", monospace',
                        color: '#f59e0b'
                      }
                    },
                    gridcolor: 'rgba(255, 180, 0, 0.15)',
                    zerolinecolor: 'rgba(255, 180, 0, 0.4)',
                    showgrid: true,
                    zeroline: true
                  },
                  margin: { l: 60, r: 30, t: 50, b: 50 },
                  paper_bgcolor: 'rgba(0,0,0,0)',
                  plot_bgcolor: 'rgba(0,10,25,0.95)',
                  showlegend: true,
                  legend: {
                    x: 0,
                    y: 1,
                    font: {
                      family: '"Space Mono", "Courier New", monospace',
                      color: '#f59e0b'
                    }
                  },
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
        )}
      </div>
      
      <style jsx>{`
        /* Enhanced sci-fi styling */
        .z-transform-visualizer {
          text-shadow: 0 0 5px rgba(0, 200, 255, 0.3);
          letter-spacing: 0.05rem;
          font-family: 'Space Mono', 'Fira Code', monospace;
        }
        
        /* Glowing text effect */
        .glow-text {
          text-shadow: 0 0 5px rgba(20, 200, 255, 0.5), 0 0 10px rgba(20, 200, 255, 0.3);
          animation: textPulse 4s infinite alternate;
        }
        
        @keyframes textPulse {
          0% { text-shadow: 0 0 5px rgba(20, 200, 255, 0.5), 0 0 10px rgba(20, 200, 255, 0.3); }
          100% { text-shadow: 0 0 7px rgba(20, 200, 255, 0.7), 0 0 14px rgba(20, 200, 255, 0.5); }
        }
        
        /* Terminal text effect */
        .terminal-text {
          font-family: 'Space Mono', 'Fira Code', monospace;
          letter-spacing: 0.05em;
          color: #22d3ee;
        }
        
        .terminal-scan {
          background: linear-gradient(to bottom, 
                      rgba(20, 220, 255, 0.08) 0%, 
                      rgba(20, 220, 255, 0.01) 50%, 
                      rgba(20, 220, 255, 0.08) 100%);
          background-size: 100% 20px;
          background-repeat: repeat-y;
          animation: scanline 8s linear infinite;
        }
        
        @keyframes scanline {
          0% { background-position: 0 0; }
          100% { background-position: 0 100%; }
        }
        
        /* Pulsing effect */
        .pulse-slow {
          animation: pulse 3s infinite;
        }
        
        @keyframes pulse {
          0% { opacity: 0.3; }
          50% { opacity: 1; }
          100% { opacity: 0.3; }
        }
        
        /* Cyber button styling */
        .cyber-button {
          position: relative;
          overflow: hidden;
          transition: all 0.2s ease;
        }
        
        .cyber-button:hover {
          box-shadow: 0 0 5px rgba(20, 200, 255, 0.5);
          transform: translateY(-1px);
        }
        
        .cyber-button:active {
          transform: translateY(1px);
        }
        
        .cyber-button-active {
          box-shadow: 0 0 8px rgba(20, 200, 255, 0.7) inset;
        }
        
        /* Cyber slider styling */
        .cyber-slider {
          -webkit-appearance: none;
          height: 4px;
          background: linear-gradient(to right, #0d5c7a, #22d3ee);
          border-radius: 2px;
          outline: none;
        }
        
        .cyber-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 12px;
          height: 12px;
          background: #22d3ee;
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 0 5px rgba(20, 200, 255, 0.7);
        }
        
        /* Terminal panel styling */
        .terminal-panel {
          position: relative;
          overflow: hidden;
        }
        
        .terminal-panel::before {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 1px;
          background: linear-gradient(to right, transparent, rgba(20, 200, 255, 0.3), transparent);
        }
        
        /* Terminal hint styling */
        .terminal-hint {
          border-top: 1px solid rgba(20, 200, 255, 0.1);
          padding-top: 0.5rem;
        }
        
        /* Blinking cursor */
        .blink {
          animation: blink 1s infinite;
          margin-right: 5px;
        }
        
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        
        /* Grid pattern */
        .bg-grid-pattern {
          background-image: 
            linear-gradient(rgba(20, 200, 255, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(20, 200, 255, 0.1) 1px, transparent 1px);
          background-size: 20px 20px;
        }
        
        /* Noise pattern */
        .bg-noise-pattern {
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
        }
        
        /* KaTeX customization for futuristic equation display */
        :global(.katex) {
          font-size: 1.1em;
          color: #38bdf8;
        }
        
        :global(.katex-display) {
          margin: 0;
          padding: 0;
        }
        
        :global(.katex-html) {
          color: #38bdf8;
          text-shadow: 0 0 3px rgba(20, 200, 255, 0.3);
        }
      `}</style>
      
      {/* Help Panel - Add this after the header */}
      {showHelp && (
        <div className="p-4 bg-gray-900/90 border-b border-cyan-800/50 terminal-text max-h-[500px] overflow-y-auto">
          <div className="terminal-header flex items-center mb-4">
            <div className="w-3 h-3 rounded-full bg-cyan-500 mr-2 pulse-slow"></div>
            <h3 className="text-lg text-cyan-300 font-mono tracking-wider">Z-TRANSFORM EXPLORER - COMMAND MANUAL</h3>
            <button 
              onClick={() => setShowHelp(false)}
              className="ml-auto text-xs bg-gray-800 hover:bg-gray-700 text-cyan-300 px-2 py-1 rounded border border-cyan-700/50"
            >
              CLOSE MANUAL
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="terminal-section p-3 bg-gray-900/60 rounded-lg border border-cyan-800/30">
              <h4 className="text-cyan-400 mb-2 font-bold text-sm">BASIC CONTROLS</h4>
              <ul className="list-disc pl-5 space-y-2 text-xs">
                <li><span className="text-cyan-400">Add/Move Poles & Zeros:</span> Select mode from EDIT MODE panel, then click on the Z-plane to add/move elements</li>
                <li><span className="text-cyan-400">View Modes:</span> Toggle between 2D and 3D visualization using the VIEW MODE panel</li>
                <li><span className="text-cyan-400">Signal Presets:</span> Select from predefined signal examples in the SIGNAL PRESETS panel</li>
                <li><span className="text-cyan-400">Rotation:</span> In 3D mode, toggle auto-rotation or select fixed viewpoints</li>
              </ul>
            </div>
            
            <div className="terminal-section p-3 bg-gray-900/60 rounded-lg border border-cyan-800/30">
              <h4 className="text-cyan-400 mb-2 font-bold text-sm">SYSTEM PROPERTIES</h4>
              <ul className="list-disc pl-5 space-y-2 text-xs">
                <li><span className="text-cyan-400">Causality:</span> Toggle between causal and non-causal system</li>
                <li><span className="text-cyan-400">Stability:</span> System is stable when all poles are inside unit circle, marginally stable with poles on unit circle</li>
                <li><span className="text-cyan-400">ROC Type:</span> Select between inside, outside, or annular region of convergence</li>
                <li><span className="text-cyan-400">System Analysis:</span> View automatically calculated system characteristics</li>
              </ul>
            </div>
            
            <div className="terminal-section p-3 bg-gray-900/60 rounded-lg border border-cyan-800/30">
              <h4 className="text-cyan-400 mb-2 font-bold text-sm">ADVANCED VISUALIZATION</h4>
              <ul className="list-disc pl-5 space-y-2 text-xs">
                <li><span className="text-cyan-400">Phase Display:</span> Toggle between magnitude and phase visualization in 3D mode</li>
                <li><span className="text-cyan-400">Unit Circle Highlighting:</span> Emphasize the frequency response around the unit circle</li>
                <li><span className="text-cyan-400">Trace Movement:</span> Show historical positions when moving poles/zeros</li>
                <li><span className="text-cyan-400">Guidelines:</span> Display radial guidelines for key angles (π/4, π/2, etc.)</li>
                <li><span className="text-cyan-400">Quality Settings:</span> Adjust rendering quality for better performance or visual detail</li>
              </ul>
            </div>
            
            <div className="terminal-section p-3 bg-gray-900/60 rounded-lg border border-cyan-800/30">
              <h4 className="text-cyan-400 mb-2 font-bold text-sm">TIME RESPONSES</h4>
              <ul className="list-disc pl-5 space-y-2 text-xs">
                <li><span className="text-cyan-400">Step Response:</span> Visualize system response to unit step input</li>
                <li><span className="text-cyan-400">Impulse Response:</span> Visualize system response to unit impulse input</li>
                <li><span className="text-cyan-400">Stability Indicators:</span> System responses show convergence for stable systems, divergence for unstable</li>
              </ul>
            </div>
            
            <div className="terminal-section p-3 bg-gray-900/60 rounded-lg border border-cyan-800/30 col-span-2">
              <h4 className="text-cyan-400 mb-2 font-bold text-sm">KEYBOARD SHORTCUTS</h4>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <ul className="list-disc pl-5 space-y-1">
                    <li><span className="text-cyan-400">P:</span> Switch to Add Pole mode</li>
                    <li><span className="text-cyan-400">Z:</span> Switch to Add Zero mode</li>
                    <li><span className="text-cyan-400">M:</span> Switch to Move mode</li>
                    <li><span className="text-cyan-400">D:</span> Switch to Delete mode</li>
                  </ul>
                </div>
                <div>
                  <ul className="list-disc pl-5 space-y-1">
                    <li><span className="text-cyan-400">V:</span> Toggle between 2D/3D visualization</li>
                    <li><span className="text-cyan-400">R:</span> Toggle auto-rotation in 3D mode</li>
                    <li><span className="text-cyan-400">H:</span> Toggle this help screen</li>
                    <li><span className="text-cyan-400">Esc:</span> Cancel current operation</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-blue-900/20 rounded-lg border border-blue-700/30 text-xs">
            <p className="text-blue-300 mb-2"><span className="text-blue-400 font-bold">TIP:</span> For best results, add poles and zeros in conjugate pairs to create realistic systems.</p>
            <p className="text-blue-300"><span className="text-blue-400 font-bold">NOTE:</span> Poles on the unit circle create marginally stable systems, while poles outside the unit circle create unstable systems.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ZTransformSciFiVisualizer; 
