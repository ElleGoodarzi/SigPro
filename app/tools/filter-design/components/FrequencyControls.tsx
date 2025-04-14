import React from 'react';
import { FilterType } from '../types/filterTypes';

interface FrequencyControlsProps {
  filterType: FilterType;
  cutoffFrequency: number;
  setCutoffFrequency: (freq: number) => void;
  cutoffFrequency2: number;
  setCutoffFrequency2: (freq: number) => void;
}

const FrequencyControls: React.FC<FrequencyControlsProps> = ({
  filterType,
  cutoffFrequency,
  setCutoffFrequency,
  cutoffFrequency2,
  setCutoffFrequency2
}) => {
  const handleCutoff1Change = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(e.target.value);
    // For bandpass and bandstop, ensure cutoff1 < cutoff2
    if (filterType === 'bandpass' || filterType === 'bandstop') {
      if (newValue >= cutoffFrequency2) {
        setCutoffFrequency(Math.max(0.01, cutoffFrequency2 - 0.01));
        return;
      }
    }
    setCutoffFrequency(newValue);
  };

  const handleCutoff2Change = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(e.target.value);
    // Ensure cutoff2 > cutoff1
    if (newValue <= cutoffFrequency) {
      setCutoffFrequency2(Math.min(0.99, cutoffFrequency + 0.01));
      return;
    }
    setCutoffFrequency2(newValue);
  };

  return (
    <div className="space-y-4">
      {/* Cutoff frequency 1 */}
      <div className="space-y-2">
        <label className="text-cyan-300 font-mono text-sm">
          {filterType === 'lowpass' ? 'Cutoff Frequency' : 
           filterType === 'highpass' ? 'Cutoff Frequency' : 
           'Lower Cutoff Frequency'}
        </label>
        <div className="flex items-center space-x-4">
          <input
            type="range"
            min="0.01"
            max="0.99"
            step="0.01"
            value={cutoffFrequency}
            onChange={handleCutoff1Change}
            className="w-full accent-cyan-500"
          />
          <span className="text-cyan-300 font-mono w-12 text-right">{cutoffFrequency.toFixed(2)}</span>
        </div>
        <div className="text-xs text-gray-500">
          {(cutoffFrequency * Math.PI).toFixed(2)} rad/sample
        </div>
      </div>

      {/* Cutoff frequency 2 (for bandpass/bandstop) */}
      {(filterType === 'bandpass' || filterType === 'bandstop') && (
        <div className="space-y-2">
          <label className="text-cyan-300 font-mono text-sm">Upper Cutoff Frequency</label>
          <div className="flex items-center space-x-4">
            <input
              type="range"
              min="0.01"
              max="0.99"
              step="0.01"
              value={cutoffFrequency2}
              onChange={handleCutoff2Change}
              className="w-full accent-cyan-500"
            />
            <span className="text-cyan-300 font-mono w-12 text-right">{cutoffFrequency2.toFixed(2)}</span>
          </div>
          <div className="text-xs text-gray-500">
            {(cutoffFrequency2 * Math.PI).toFixed(2)} rad/sample
          </div>
        </div>
      )}

      {/* Visual frequency indicator */}
      <div className="mt-2 h-8 bg-gray-900 rounded-md border border-gray-800 relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-between px-2">
          <span className="text-xs text-gray-500">0</span>
          <span className="text-xs text-gray-500">π</span>
        </div>
        
        {filterType === 'lowpass' && (
          <div 
            className="absolute h-full bg-gradient-to-r from-cyan-500/60 to-transparent"
            style={{ width: `${cutoffFrequency * 100}%` }}
          ></div>
        )}
        
        {filterType === 'highpass' && (
          <div 
            className="absolute h-full right-0 bg-gradient-to-l from-cyan-500/60 to-transparent"
            style={{ width: `${(1 - cutoffFrequency) * 100}%` }}
          ></div>
        )}
        
        {filterType === 'bandpass' && (
          <div 
            className="absolute h-full bg-cyan-500/60"
            style={{ 
              left: `${cutoffFrequency * 100}%`,
              width: `${(cutoffFrequency2 - cutoffFrequency) * 100}%`
            }}
          ></div>
        )}
        
        {filterType === 'bandstop' && (
          <>
            <div 
              className="absolute h-full left-0 bg-cyan-500/60"
              style={{ width: `${cutoffFrequency * 100}%` }}
            ></div>
            <div 
              className="absolute h-full right-0 bg-cyan-500/60"
              style={{ width: `${(1 - cutoffFrequency2) * 100}%` }}
            ></div>
          </>
        )}
      </div>
    </div>
  );
};

export default FrequencyControls; 