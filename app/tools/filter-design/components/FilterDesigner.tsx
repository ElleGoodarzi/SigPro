"use client";

import React, { useState, useEffect } from 'react';
import { FilterType, FilterImplementation, WindowType, FIRMethod, IIRMethod } from '../types/filterTypes';
import FilterTypeSelector from './FilterTypeSelector';
import FrequencyControls from './FrequencyControls';
import ImplementationSelector from './ImplementationSelector';
import FIRControls from './FIRControls';
import IIRControls from './IIRControls';
import ImpulseResponsePlot from '../Visualizations/ImpulseResponsePlot';
import FrequencyResponsePlot from '../Visualizations/FrequencyResponsePlot';
import PoleZeroPlot from '../Visualizations/PoleZeroPlot';
import GroupDelayPlot from '../Visualizations/GroupDelayPlot';
import FilterSpecificationPlot from '../Visualizations/FilterSpecificationPlot';
import { calculateFilter } from '../utils/filterUtils';
// @ts-ignore - Import FilterControls with ts-ignore to suppress the error
import FilterControlsWrapper from './FilterControlsWrapper';
import { calculateOptimalFilterOrder, bandEdgesToCutoffFrequencies } from '../utils/filterDesignUtils';
import FilterSpecificationControls from './FilterSpecificationControls';

interface FilterDesignerProps {
  isFullscreen: boolean;
  windowSize: {
    width: number;
    height: number;
  };
  selectedFilterType: FilterType;
  setSelectedFilterType: (type: FilterType) => void;
  selectedImplementation: FilterImplementation;
  setSelectedImplementation: (implementation: FilterImplementation) => void;
  cutoffFrequency: number;
  setCutoffFrequency: (freq: number) => void;
  cutoffFrequency2: number;
  setCutoffFrequency2: (freq: number) => void;
}

const FilterDesigner: React.FC<FilterDesignerProps> = ({
  isFullscreen,
  windowSize,
  selectedFilterType,
  setSelectedFilterType,
  selectedImplementation,
  setSelectedImplementation,
  cutoffFrequency,
  setCutoffFrequency,
  cutoffFrequency2,
  setCutoffFrequency2
}) => {
  // Common parameters
  const [windowLength, setWindowLength] = useState<number>(101);
  
  // FIR specific parameters
  const [firMethod, setFirMethod] = useState<FIRMethod>('window');
  const [windowType, setWindowType] = useState<WindowType>('hamming');
  const [kaiserBeta, setKaiserBeta] = useState<number>(4.0);
  
  // IIR specific parameters
  const [iirMethod, setIirMethod] = useState<IIRMethod>('butterworth');
  const [filterOrder, setFilterOrder] = useState<number>(4);
  const [passbandRipple, setPassbandRipple] = useState<number>(1.0);
  const [stopbandAttenuation, setStopbandAttenuation] = useState<number>(40.0);
  
  // Custom poles and zeros parameters
  const [useCustomPoleZero, setUseCustomPoleZero] = useState<boolean>(false);
  const [customPoles, setCustomPoles] = useState<{re: number, im: number}[]>([]);
  const [customZeros, setCustomZeros] = useState<{re: number, im: number}[]>([]);
  const [editingPoleZero, setEditingPoleZero] = useState<'pole' | 'zero' | null>(null);
  const [newPoleZeroRe, setNewPoleZeroRe] = useState<number>(0);
  const [newPoleZeroIm, setNewPoleZeroIm] = useState<number>(0);
  
  // Visualization state
  const [filterResponse, setFilterResponse] = useState<any>(null);
  const [selectedView, setSelectedView] = useState<'impulse' | 'frequency' | 'phase' | 'pole-zero' | 'group-delay' | 'magnitude' | 'specification' | 'response'>('specification');
  
  // Add new state variables for filter specifications
  const [passbandStart, setPassbandStart] = useState(0);
  const [passbandEnd, setPassbandEnd] = useState(0.45);
  const [stopbandStart, setStopbandStart] = useState(0.55);
  const [stopbandEnd, setStopbandEnd] = useState(1.0);
  
  // Calculate filter response when parameters change
  useEffect(() => {
    if (useCustomPoleZero && (customPoles.length > 0 || customZeros.length > 0)) {
      // For custom pole-zero mode, generate filter response directly from poles and zeros
      const response = {
        poles: customPoles,
        zeros: customZeros,
        ...calculateFilterFromPoleZero(customPoles, customZeros)
      };
      setFilterResponse(response);
    } else {
      const response = calculateFilter({
        type: selectedFilterType,
        implementation: selectedImplementation,
        cutoffFrequency,
        cutoffFrequency2: selectedFilterType === 'bandpass' || selectedFilterType === 'bandstop' ? cutoffFrequency2 : undefined,
        windowLength,
        // FIR parameters
        firMethod,
        windowType,
        kaiserBeta,
        // IIR parameters
        iirMethod,
        filterOrder,
        passbandRipple,
        stopbandAttenuation
      });
      
      setFilterResponse(response);
    }
  }, [
    selectedFilterType, 
    selectedImplementation, 
    cutoffFrequency, 
    cutoffFrequency2, 
    windowLength,
    firMethod,
    windowType,
    kaiserBeta,
    iirMethod,
    filterOrder,
    passbandRipple,
    stopbandAttenuation,
    useCustomPoleZero,
    customPoles,
    customZeros
  ]);
  
  // Function to calculate filter response from poles and zeros
  const calculateFilterFromPoleZero = (poles: {re: number, im: number}[], zeros: {re: number, im: number}[]) => {
    // Generate frequency points
    const numFreqPoints = 512;
    const frequencies: number[] = [];
    const magnitude: number[] = [];
    const phase: number[] = [];
    
    // Calculate impulse response via inverse Z-transform (approximate)
    const impulseLength = 101;
    const impulseResponse: number[] = new Array(impulseLength).fill(0);
    const timeIndices: number[] = new Array(impulseLength).fill(0).map((_, i) => i);
    
    // Simple residue method for impulse response (simplified implementation)
    for (let n = 0; n < impulseLength; n++) {
      let response = 0;
      
      // For each pole, calculate contribution
      for (const pole of poles) {
        const r = Math.sqrt(pole.re * pole.re + pole.im * pole.im);
        const theta = Math.atan2(pole.im, pole.re);
        
        if (r < 0.999) { // Ensure stability
          response += Math.pow(r, n) * Math.cos(n * theta);
        }
      }
      
      // Simple approximation - this is not a complete implementation
      // A full implementation would require partial fraction expansion
      impulseResponse[n] = response / Math.max(1, poles.length);
    }
    
    // Normalize impulse response
    const maxAmp = Math.max(...impulseResponse.map(Math.abs), 0.001);
    for (let i = 0; i < impulseLength; i++) {
      impulseResponse[i] /= maxAmp;
    }
    
    // Calculate frequency response
    for (let k = 0; k < numFreqPoints; k++) {
      const omega = k * Math.PI / (numFreqPoints - 1); // 0 to π
      frequencies.push(omega / Math.PI); // Normalize to 0-1 for display
      
      let numerator = { re: 1, im: 0 };
      let denominator = { re: 1, im: 0 };
      
      // Calculate based on poles and zeros at each frequency point (z = e^jω)
      const z = { re: Math.cos(omega), im: -Math.sin(omega) };
      
      // Numerator: product of (z - zero)
      for (const zero of zeros) {
        const diffRe = z.re - zero.re;
        const diffIm = z.im - zero.im;
        
        const newRe = numerator.re * diffRe - numerator.im * diffIm;
        const newIm = numerator.re * diffIm + numerator.im * diffRe;
        
        numerator.re = newRe;
        numerator.im = newIm;
      }
      
      // Denominator: product of (z - pole)
      for (const pole of poles) {
        const diffRe = z.re - pole.re;
        const diffIm = z.im - pole.im;
        
        // Skip points too close to poles
        const mag = diffRe * diffRe + diffIm * diffIm;
        if (mag < 0.001) {
          denominator = { re: 1, im: 0 }; // Avoid division by near-zero
          continue;
        }
        
        const newRe = denominator.re * diffRe - denominator.im * diffIm;
        const newIm = denominator.re * diffIm + denominator.im * diffRe;
        
        denominator.re = newRe;
        denominator.im = newIm;
      }
      
      // Frequency response H(z) = numerator / denominator
      const denomMag = denominator.re * denominator.re + denominator.im * denominator.im;
      const resultRe = (numerator.re * denominator.re + numerator.im * denominator.im) / denomMag;
      const resultIm = (numerator.im * denominator.re - numerator.re * denominator.im) / denomMag;
      
      // Calculate magnitude and phase
      const mag = Math.sqrt(resultRe * resultRe + resultIm * resultIm);
      const pha = Math.atan2(resultIm, resultRe);
      
      magnitude.push(mag);
      phase.push(pha);
    }
    
    // Calculate group delay (approximate by derivative of phase)
    const groupDelay: number[] = [];
    for (let i = 1; i < phase.length - 1; i++) {
      // Unwrap phase for proper derivative
      let prevPhase = phase[i-1];
      let currPhase = phase[i];
      let nextPhase = phase[i+1];
      
      // Handle phase wrapping
      while (currPhase - prevPhase > Math.PI) currPhase -= 2 * Math.PI;
      while (currPhase - prevPhase < -Math.PI) currPhase += 2 * Math.PI;
      while (nextPhase - currPhase > Math.PI) nextPhase -= 2 * Math.PI;
      while (nextPhase - currPhase < -Math.PI) nextPhase += 2 * Math.PI;
      
      // Central difference for derivative
      const derivative = (nextPhase - prevPhase) / (2 * Math.PI / numFreqPoints);
      groupDelay.push(-derivative); // Negative derivative of phase
    }
    
    // Add first and last points for same array length
    groupDelay.unshift(groupDelay[0]);
    groupDelay.push(groupDelay[groupDelay.length - 1]);
    
    return {
      impulseResponse,
      timeIndices,
      frequencyResponse: {
        frequencies,
        magnitude,
        phase
      },
      groupDelay
    };
  };
  
  // Function to add a new pole or zero
  const addPoleZero = () => {
    if (editingPoleZero === 'pole') {
      setCustomPoles([...customPoles, { re: newPoleZeroRe, im: newPoleZeroIm }]);
    } else if (editingPoleZero === 'zero') {
      setCustomZeros([...customZeros, { re: newPoleZeroRe, im: newPoleZeroIm }]);
    }
    setNewPoleZeroRe(0);
    setNewPoleZeroIm(0);
  };
  
  // Function to remove a pole or zero
  const removePoleZero = (type: 'pole' | 'zero', index: number) => {
    if (type === 'pole') {
      setCustomPoles(customPoles.filter((_, i) => i !== index));
    } else {
      setCustomZeros(customZeros.filter((_, i) => i !== index));
    }
  };
  
  // Function to add conjugate pair of poles or zeros
  const addConjugatePair = () => {
    if (editingPoleZero === 'pole') {
      setCustomPoles([
        ...customPoles, 
        { re: newPoleZeroRe, im: newPoleZeroIm },
        { re: newPoleZeroRe, im: -newPoleZeroIm }
      ]);
    } else if (editingPoleZero === 'zero') {
      setCustomZeros([
        ...customZeros,
        { re: newPoleZeroRe, im: newPoleZeroIm },
        { re: newPoleZeroRe, im: -newPoleZeroIm }
      ]);
    }
    setNewPoleZeroRe(0);
    setNewPoleZeroIm(0);
  };
  
  // Auto-calculate optimal filter order when specifications change
  useEffect(() => {
    if (iirMethod && selectedFilterType) {
      const optimalOrder = calculateOptimalFilterOrder(
        selectedFilterType,
        iirMethod,
        passbandStart,
        passbandEnd,
        stopbandStart,
        stopbandEnd,
        passbandRipple,
        stopbandAttenuation
      );
      
      // Update cutoff frequencies based on passband/stopband edges
      const cutoffs = bandEdgesToCutoffFrequencies(
        selectedFilterType,
        passbandStart,
        passbandEnd,
        stopbandStart,
        stopbandEnd
      );
      
      setFilterOrder(optimalOrder);
      setCutoffFrequency(cutoffs.cutoffFrequency);
      if (cutoffs.cutoffFrequency2 !== undefined) {
        setCutoffFrequency2(cutoffs.cutoffFrequency2);
      }
    }
  }, [
    iirMethod, 
    selectedFilterType, 
    passbandStart, 
    passbandEnd, 
    stopbandStart, 
    stopbandEnd,
    passbandRipple,
    stopbandAttenuation
  ]);
  
  const containerHeight = isFullscreen ? windowSize.height - 20 : Math.min(windowSize.height * 0.7, 1000);
  
  return (
    <div className="flex flex-col w-full h-full">
      <div className="p-4 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center">
        <h1 className="text-xl font-bold">Filter Designer</h1>
        <div className="flex space-x-2">
          <button
            className={`px-3 py-1 rounded-md ${
              selectedView === 'response'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 dark:bg-gray-700'
            }`}
            onClick={() => setSelectedView('response')}
          >
            Response
          </button>
          <button
            className={`px-3 py-1 rounded-md ${
              selectedView === 'specification'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 dark:bg-gray-700'
            }`}
            onClick={() => setSelectedView('specification')}
          >
            Specification
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left column - Controls - make it narrower */}
          <div className="lg:col-span-3 bg-white dark:bg-gray-800 rounded-md p-4 shadow">
            {/* @ts-ignore */}
            <FilterControlsWrapper
              filterParams={{
                type: selectedFilterType,
                implementation: selectedImplementation,
                cutoffFrequency,
                cutoffFrequency2,
                order: filterOrder,
                iirMethod,
                passbandRipple,
                stopbandAttenuation
              }}
              setFilterParams={(params: {
                type: FilterType;
                implementation: FilterImplementation;
                cutoffFrequency: number;
                cutoffFrequency2?: number;
                order: number;
                iirMethod: IIRMethod;
                passbandRipple: number;
                stopbandAttenuation: number;
              }) => {
                setSelectedFilterType(params.type);
                setSelectedImplementation(params.implementation);
                setCutoffFrequency(params.cutoffFrequency);
                setCutoffFrequency2(params.cutoffFrequency2 || cutoffFrequency2);
                setFilterOrder(params.order);
                setIirMethod(params.iirMethod);
                setPassbandRipple(params.passbandRipple);
                setStopbandAttenuation(params.stopbandAttenuation);
              }}
            />
            
            <div className="mt-6 mb-2">
              <h2 className="text-lg font-semibold">Filter Specifications</h2>
            </div>
            
            <FilterSpecificationControls 
              filterType={selectedFilterType}
              passbandStart={passbandStart}
              passbandEnd={passbandEnd}
              stopbandStart={stopbandStart} 
              stopbandEnd={stopbandEnd}
              passbandRipple={passbandRipple}
              stopbandAttenuation={stopbandAttenuation}
              setPassbandStart={setPassbandStart}
              setPassbandEnd={setPassbandEnd}
              setStopbandStart={setStopbandStart}
              setStopbandEnd={setStopbandEnd}
              setPassbandRipple={setPassbandRipple}
              setStopbandAttenuation={setStopbandAttenuation}
            />
          </div>

          {/* Middle column - Visualization - make it wider */}
          <div className="lg:col-span-6 bg-white dark:bg-gray-800 rounded-md p-4 shadow">
            {/* Visualization controls */}
            <div className="mb-3 flex justify-between">
              <h2 className="text-lg font-semibold">Filter Visualization</h2>
              <div className="space-x-2 flex">
                <button
                  className={`px-2 py-1 text-sm rounded ${
                    selectedView === 'response'
                      ? 'bg-cyan-700 text-white'
                      : 'bg-gray-700 hover:bg-gray-600'
                  }`}
                  onClick={() => setSelectedView('response')}
                >
                  Frequency Response
                </button>
                <button
                  className={`px-2 py-1 text-sm rounded ${
                    selectedView === 'specification'
                      ? 'bg-cyan-700 text-white'
                      : 'bg-gray-700 hover:bg-gray-600'
                  }`}
                  onClick={() => setSelectedView('specification')}
                >
                  Specifications
                </button>
              </div>
            </div>
            
            {/* Add a fixed height container with proper aspect ratio */}
            <div className="h-[450px] w-full flex items-center justify-center bg-gray-900 rounded-lg p-2">
              {selectedView === 'response' ? (
                <div className="w-full h-full">
                  <FrequencyResponsePlot 
                    frequencyResponse={filterResponse?.frequencyResponse || {
                      frequencies: [], 
                      magnitude: [], 
                      phase: []
                    }}
                  />
                </div>
              ) : (
                <div className="w-full h-full">
                  <FilterSpecificationPlot 
                    type={selectedFilterType}
                    cutoffFrequency={cutoffFrequency}
                    cutoffFrequency2={cutoffFrequency2}
                    passbandRipple={passbandRipple}
                    stopbandAttenuation={stopbandAttenuation}
                  />
                </div>
              )}
            </div>
            
            <div className="mt-2 text-xs text-gray-500">
              <p>Click and drag on the plot to zoom in. Double-click to reset view.</p>
            </div>
          </div>

          {/* Right column - Mathematical formulation - make it narrower */}
          <div className="lg:col-span-3 bg-white dark:bg-gray-800 rounded-md p-4 shadow">
            <h2 className="text-lg font-semibold mb-4">Filter Details</h2>
            
            {/* Filter Mathematical Description */}
            <div className="mb-4">
              <h3 className="font-medium mb-2">Transfer Function</h3>
              <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-md">
                <pre className="text-sm whitespace-pre-wrap">
                  {filterResponse && filterResponse.getTransferFunction?.()}
                </pre>
              </div>
            </div>
            
            {/* Filter Coefficients */}
            <div className="mb-4">
              <h3 className="font-medium mb-2">Filter Coefficients</h3>
              <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-md overflow-auto max-h-[200px]">
                <pre className="text-sm">
                  {formatCoefficients(filterResponse && filterResponse.getCoefficients?.())}
                </pre>
              </div>
            </div>
            
            {/* Calculated Filter Specifications */}
            <div>
              <h3 className="font-medium mb-2">Calculated Specifications</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="font-medium">Filter Type:</div>
                <div>{selectedFilterType}</div>
                
                <div className="font-medium">Method:</div>
                <div>{selectedImplementation === 'iir' ? iirMethod : 'FIR'}</div>
                
                <div className="font-medium">Order:</div>
                <div>{filterOrder}</div>
                
                <div className="font-medium">Cutoff Frequency:</div>
                <div>{cutoffFrequency.toFixed(4)} π rad/sample</div>
                
                {selectedFilterType === 'bandpass' || selectedFilterType === 'bandstop' ? (
                  <>
                    <div className="font-medium">Cutoff Frequency 2:</div>
                    <div>{cutoffFrequency2.toFixed(4)} π rad/sample</div>
                  </>
                ) : null}
                
                <div className="font-medium">Passband Ripple:</div>
                <div>{passbandRipple} dB</div>
                
                <div className="font-medium">Stopband Atten.:</div>
                <div>{stopbandAttenuation} dB</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper function to format filter coefficients for display
function formatCoefficients(coeffs: any) {
  if (!coeffs) return '';
  
  let result = '';
  
  if (coeffs.b) {
    result += 'Numerator (b):\n';
    result += coeffs.b.map((val: number, i: number) => `b[${i}] = ${val.toFixed(6)}`).join('\n');
  }
  
  if (coeffs.a) {
    result += '\n\nDenominator (a):\n';
    result += coeffs.a.map((val: number, i: number) => `a[${i}] = ${val.toFixed(6)}`).join('\n');
  }
  
  return result;
}

export default FilterDesigner; 