"use client";

import React, { useState, useEffect } from 'react';
import { FilterType } from '../types/filterTypes';

interface FilterSpecificationControlsProps {
  filterType: FilterType;
  passbandStart: number;
  setPassbandStart: (value: number) => void;
  passbandEnd: number;
  setPassbandEnd: (value: number) => void;
  stopbandStart: number;
  setStopbandStart: (value: number) => void;
  stopbandEnd: number;
  setStopbandEnd: (value: number) => void;
  passbandRipple: number;
  setPassbandRipple: (value: number) => void;
  stopbandAttenuation: number;
  setStopbandAttenuation: (value: number) => void;
}

const FilterSpecificationControls: React.FC<FilterSpecificationControlsProps> = ({
  filterType,
  passbandStart,
  setPassbandStart,
  passbandEnd,
  setPassbandEnd,
  stopbandStart,
  setStopbandStart,
  stopbandEnd,
  setStopbandEnd,
  passbandRipple,
  setPassbandRipple,
  stopbandAttenuation,
  setStopbandAttenuation
}) => {
  // State for controlling unit display
  const [passbandRippleUnit, setPassbandRippleUnit] = useState<'dB' | 'linear'>('dB');
  const [stopbandAttenuationUnit, setStopbandAttenuationUnit] = useState<'dB' | 'linear'>('dB');
  
  // Local state for ripple and attenuation values in different units
  const [passbandRippleLinear, setPassbandRippleLinear] = useState(dbToLinear(passbandRipple));
  const [stopbandAttenuationLinear, setStopbandAttenuationLinear] = useState(dbToLinear(stopbandAttenuation));
  
  // Update local linear values when dB values change from parent
  useEffect(() => {
    setPassbandRippleLinear(dbToLinear(passbandRipple));
  }, [passbandRipple]);
  
  useEffect(() => {
    setStopbandAttenuationLinear(dbToLinear(stopbandAttenuation));
  }, [stopbandAttenuation]);
  
  // Conversion functions
  function dbToLinear(dbValue: number): number {
    return Math.pow(10, dbValue / 20);
  }
  
  function linearToDb(linearValue: number): number {
    return 20 * Math.log10(linearValue);
  }
  
  // Normalize input values to ensure they follow filter type constraints
  useEffect(() => {
    // Ensure constraints based on filter type
    if (filterType === 'lowpass') {
      // For lowpass: passbandStart is fixed at 0, stopbandStart > passbandEnd
      setPassbandStart(0);
      if (stopbandStart <= passbandEnd) {
        setStopbandStart(Math.min(passbandEnd + 0.05, 0.95));
      }
      // stopbandEnd is fixed at 1
      setStopbandEnd(1);
    } else if (filterType === 'highpass') {
      // For highpass: passbandEnd is fixed at 1, stopbandEnd < passbandStart
      setPassbandEnd(1);
      if (stopbandEnd >= passbandStart) {
        setStopbandEnd(Math.max(passbandStart - 0.05, 0.05));
      }
      // stopbandStart is fixed at 0
      setStopbandStart(0);
    } else if (filterType === 'bandpass') {
      // For bandpass: stopbandEnd < passbandStart < passbandEnd < stopbandStart
      if (stopbandEnd >= passbandStart) {
        setStopbandEnd(Math.max(passbandStart - 0.05, 0.05));
      }
      if (passbandEnd >= stopbandStart) {
        setStopbandStart(Math.min(passbandEnd + 0.05, 0.95));
      }
      // Ensure order: stopbandEnd < passbandStart < passbandEnd < stopbandStart
      if (passbandStart >= passbandEnd) {
        setPassbandStart(Math.max(passbandEnd - 0.1, 0.1));
      }
    } else if (filterType === 'bandstop') {
      // For bandstop: passbandStart < stopbandStart < stopbandEnd < passbandEnd
      if (passbandStart >= stopbandStart) {
        setPassbandStart(Math.max(stopbandStart - 0.05, 0.05));
      }
      if (stopbandEnd >= passbandEnd) {
        setPassbandEnd(Math.min(stopbandEnd + 0.05, 0.95));
      }
      // Ensure order: passbandStart < stopbandStart < stopbandEnd < passbandEnd
      if (stopbandStart >= stopbandEnd) {
        setStopbandStart(Math.max(stopbandEnd - 0.1, 0.1));
      }
    }
  }, [
    filterType, 
    passbandStart, passbandEnd, 
    stopbandStart, stopbandEnd,
    setPassbandStart, setPassbandEnd,
    setStopbandStart, setStopbandEnd
  ]);

  // Helper function to create frequency input controls
  interface FrequencyInputProps {
    label: string;
    value: number;
    onChange: (value: number) => void;
    min?: number;
    max?: number;
    step?: number;
    disabled?: boolean;
  }

  const FrequencyInput: React.FC<FrequencyInputProps> = ({ 
    label, 
    value, 
    onChange, 
    min = 0, 
    max = 1, 
    step = 0.01,
    disabled = false
  }) => {
    // Use local state to handle immediate input updates
    const [localValue, setLocalValue] = useState(value);
    
    // Keep local value in sync with parent value
    useEffect(() => {
      setLocalValue(value);
    }, [value]);
    
    const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newVal = parseFloat(e.target.value);
      setLocalValue(newVal);
      onChange(newVal);
    };
    
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      if (val === '') {
        setLocalValue(0);
      } else {
        const newVal = parseFloat(val);
        if (!isNaN(newVal)) {
          setLocalValue(newVal);
        }
      }
    };
    
    const handleInputBlur = () => {
      // Validate the value is within bounds
      const validValue = Math.max(min, Math.min(max, localValue));
      setLocalValue(validValue);
      onChange(validValue);
    };
    
    return (
      <div className="space-y-1">
        <label className="text-cyan-300 font-mono text-sm">
          {label} {label.includes("Ripple") || label.includes("Attenuation") ? "" : "(π rad/sample)"}
        </label>
        <div className="flex items-center space-x-3">
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={localValue}
            onChange={handleSliderChange}
            disabled={disabled}
            className={`w-full ${disabled ? 'opacity-50' : 'accent-cyan-500'}`}
          />
          <input
            type="number"
            min={min}
            max={max}
            step={step}
            value={localValue}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            disabled={disabled}
            className="text-cyan-300 font-mono w-16 bg-gray-800 rounded border border-gray-700 text-right px-2 py-1 text-sm"
          />
        </div>
      </div>
    );
  };

  // Toggle between dB and linear units for passband ripple
  const togglePassbandRippleUnit = () => {
    if (passbandRippleUnit === 'dB') {
      setPassbandRippleUnit('linear');
    } else {
      setPassbandRippleUnit('dB');
    }
  };

  // Toggle between dB and linear units for stopband attenuation
  const toggleStopbandAttenuationUnit = () => {
    if (stopbandAttenuationUnit === 'dB') {
      setStopbandAttenuationUnit('linear');
    } else {
      setStopbandAttenuationUnit('dB');
    }
  };

  // Handle passband ripple change based on current unit
  const handlePassbandRippleChange = (value: number) => {
    if (passbandRippleUnit === 'dB') {
      // Value is already in dB, set it directly
      setPassbandRipple(value);
      // Update linear value
      setPassbandRippleLinear(dbToLinear(value));
    } else {
      // Value is in linear, convert to dB
      setPassbandRippleLinear(value);
      setPassbandRipple(linearToDb(value));
    }
  };

  // Handle stopband attenuation change based on current unit
  const handleStopbandAttenuationChange = (value: number) => {
    if (stopbandAttenuationUnit === 'dB') {
      // Value is already in dB, set it directly
      setStopbandAttenuation(value);
      // Update linear value
      setStopbandAttenuationLinear(dbToLinear(value));
    } else {
      // Value is in linear, convert to dB
      setStopbandAttenuationLinear(value);
      setStopbandAttenuation(linearToDb(value));
    }
  };

  return (
    <div className="space-y-3 bg-gray-900/60 rounded-lg border border-cyan-900/30 p-3">
      {/* Passband Specifications */}
      <div className="space-y-3">
        <h4 className="text-md text-cyan-300 font-mono">Passband Region</h4>
        
        {(filterType === 'lowpass' || filterType === 'bandpass' || filterType === 'bandstop') && (
          <FrequencyInput 
            label="Passband Start" 
            value={passbandStart} 
            onChange={setPassbandStart}
            disabled={filterType === 'lowpass'} // Fixed at 0 for lowpass
          />
        )}
        
        {(filterType === 'highpass' || filterType === 'bandpass' || filterType === 'bandstop') && (
          <FrequencyInput 
            label="Passband End" 
            value={passbandEnd} 
            onChange={setPassbandEnd}
            disabled={filterType === 'highpass'} // Fixed at 1 for highpass
          />
        )}

        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-cyan-300 font-mono text-sm">
              Passband Ripple ({passbandRippleUnit})
            </label>
            <button 
              onClick={togglePassbandRippleUnit}
              className="text-xs bg-cyan-900/30 text-cyan-300 px-2 py-1 rounded hover:bg-cyan-900/50"
            >
              Switch to {passbandRippleUnit === 'dB' ? 'Linear' : 'dB'}
            </button>
          </div>
          
          <div className="flex items-center space-x-3">
            <input
              type="range"
              min={passbandRippleUnit === 'dB' ? 0.01 : 1.0}
              max={passbandRippleUnit === 'dB' ? 3 : 1.5}
              step={passbandRippleUnit === 'dB' ? 0.01 : 0.01}
              value={passbandRippleUnit === 'dB' ? passbandRipple : passbandRippleLinear}
              onChange={(e) => handlePassbandRippleChange(parseFloat(e.target.value))}
              className="w-full accent-cyan-500"
            />
            <input
              type="number"
              min={passbandRippleUnit === 'dB' ? 0.01 : 1.0}
              max={passbandRippleUnit === 'dB' ? 3 : 1.5}
              step={passbandRippleUnit === 'dB' ? 0.01 : 0.01}
              value={passbandRippleUnit === 'dB' ? passbandRipple : passbandRippleLinear.toFixed(3)}
              onChange={(e) => {
                const val = e.target.value === '' ? '0' : e.target.value;
                handlePassbandRippleChange(parseFloat(val));
              }}
              className="text-cyan-300 font-mono w-16 bg-gray-800 rounded border border-gray-700 text-right px-2 py-1 text-sm"
            />
          </div>
        </div>
      </div>
      
      {/* Stopband Specifications */}
      <div className="space-y-3">
        <h4 className="text-md text-cyan-300 font-mono">Stopband Region</h4>
        
        {(filterType === 'highpass' || filterType === 'bandpass' || filterType === 'bandstop') && (
          <FrequencyInput 
            label="Stopband Start" 
            value={stopbandStart} 
            onChange={setStopbandStart}
            disabled={filterType === 'highpass'} // Fixed at 0 for highpass
          />
        )}
        
        {(filterType === 'lowpass' || filterType === 'bandpass' || filterType === 'bandstop') && (
          <FrequencyInput 
            label="Stopband End" 
            value={stopbandEnd} 
            onChange={setStopbandEnd}
            disabled={filterType === 'lowpass'} // Fixed at 1 for lowpass
          />
        )}

        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-cyan-300 font-mono text-sm">
              Stopband Attenuation ({stopbandAttenuationUnit})
            </label>
            <button 
              onClick={toggleStopbandAttenuationUnit}
              className="text-xs bg-cyan-900/30 text-cyan-300 px-2 py-1 rounded hover:bg-cyan-900/50"
            >
              Switch to {stopbandAttenuationUnit === 'dB' ? 'Linear' : 'dB'}
            </button>
          </div>
          
          <div className="flex items-center space-x-3">
            <input
              type="range"
              min={stopbandAttenuationUnit === 'dB' ? 20 : 0.01}
              max={stopbandAttenuationUnit === 'dB' ? 120 : 0.1}
              step={stopbandAttenuationUnit === 'dB' ? 1 : 0.001}
              value={stopbandAttenuationUnit === 'dB' ? stopbandAttenuation : stopbandAttenuationLinear}
              onChange={(e) => handleStopbandAttenuationChange(parseFloat(e.target.value))}
              className="w-full accent-cyan-500"
            />
            <input
              type="number"
              min={stopbandAttenuationUnit === 'dB' ? 20 : 0.01}
              max={stopbandAttenuationUnit === 'dB' ? 120 : 0.1}
              step={stopbandAttenuationUnit === 'dB' ? 1 : 0.001}
              value={stopbandAttenuationUnit === 'dB' ? stopbandAttenuation : stopbandAttenuationLinear.toFixed(4)}
              onChange={(e) => {
                const val = e.target.value === '' ? '0' : e.target.value;
                handleStopbandAttenuationChange(parseFloat(val));
              }}
              className="text-cyan-300 font-mono w-16 bg-gray-800 rounded border border-gray-700 text-right px-2 py-1 text-sm"
            />
          </div>
        </div>
      </div>
      
      {/* Diagram indication */}
      <div className="text-xs text-gray-400 mt-3 space-y-1">
        <p>View the Filter Specification visualization to see these constraints graphically.</p>
        <p className="text-cyan-300">Try adjusting values with the sliders or by typing directly in the number fields.</p>
        <p>Some values are automatically constrained based on the filter type selected.</p>
        <p>Toggle between dB and linear units for ripple and attenuation values.</p>
      </div>
    </div>
  );
};

export default FilterSpecificationControls; 