'use client';

import React, { useState } from 'react';
import { SignalType, SignalParameters, WindowFunction } from '../types/fourierTypes';

interface SignalControlsProps {
  signalType: SignalType;
  parameters: SignalParameters;
  window: WindowFunction;
  onSignalTypeChange: (type: SignalType) => void;
  onParametersChange: (params: SignalParameters) => void;
  onWindowChange: (window: WindowFunction) => void;
}

export default function SignalControls({
  signalType,
  parameters,
  window,
  onSignalTypeChange,
  onParametersChange,
  onWindowChange
}: SignalControlsProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const signalTypes: { value: SignalType; label: string; description: string }[] = [
    { value: 'sine', label: 'Sine Wave', description: 'Pure sinusoidal signal' },
    { value: 'cosine', label: 'Cosine Wave', description: 'Cosine signal with phase offset' },
    { value: 'square', label: 'Square Wave', description: 'Binary signal with sharp transitions' },
    { value: 'sawtooth', label: 'Sawtooth Wave', description: 'Linear ramp signal' },
    { value: 'triangle', label: 'Triangle Wave', description: 'Triangular waveform' },
    { value: 'chirp', label: 'Chirp Signal', description: 'Frequency-swept signal' },
    { value: 'noise', label: 'White Noise', description: 'Random signal' }
  ];

  const windowTypes: { value: WindowFunction['type']; label: string; description: string }[] = [
    { value: 'none', label: 'None', description: 'No windowing applied' },
    { value: 'hann', label: 'Hann', description: 'Smooth window, good for general use' },
    { value: 'hamming', label: 'Hamming', description: 'Good sidelobe suppression' },
    { value: 'blackman', label: 'Blackman', description: 'Excellent sidelobe suppression' },
    { value: 'flattop', label: 'Flattop', description: 'Best for amplitude measurements' }
  ];

  const handleParameterChange = (key: keyof SignalParameters, value: number) => {
    onParametersChange({
      ...parameters,
      [key]: value
    });
  };

  const handleWindowChange = (type: WindowFunction['type']) => {
    onWindowChange({
      type,
      apply: type !== 'none'
    });
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <h2 className="text-xl font-bold text-cyan-400 mb-4">Signal Generation</h2>
      
      {/* Signal Type Selection */}
      <div className="mb-6">
        <label className="block text-cyan-300 font-mono text-sm mb-2">Signal Type</label>
        <div className="grid grid-cols-2 gap-2">
          {signalTypes.map(({ value, label, description }) => (
            <button
              key={value}
              onClick={() => onSignalTypeChange(value)}
              className={`p-3 rounded-lg border text-left transition-all ${
                signalType === value
                  ? 'bg-cyan-900 border-cyan-500 text-cyan-100'
                  : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
              }`}
            >
              <div className="font-medium">{label}</div>
              <div className="text-xs opacity-75">{description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Basic Parameters */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-cyan-300 font-mono text-sm mb-1">Amplitude</label>
          <input
            type="range"
            min="0"
            max="5"
            step="0.1"
            value={parameters.amplitude}
            onChange={(e) => handleParameterChange('amplitude', parseFloat(e.target.value))}
            className="w-full accent-cyan-500"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>0</span>
            <span className="text-cyan-300 font-mono">{parameters.amplitude.toFixed(1)}</span>
            <span>5</span>
          </div>
        </div>

        <div>
          <label className="block text-cyan-300 font-mono text-sm mb-1">Frequency (Hz)</label>
          <input
            type="range"
            min="1"
            max="1000"
            step="1"
            value={parameters.frequency}
            onChange={(e) => handleParameterChange('frequency', parseFloat(e.target.value))}
            className="w-full accent-cyan-500"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>1</span>
            <span className="text-cyan-300 font-mono">{parameters.frequency} Hz</span>
            <span>1000</span>
          </div>
        </div>
      </div>

      {/* Advanced Parameters Toggle */}
      <button
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="w-full py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-cyan-300 font-mono text-sm transition-colors mb-4"
      >
        {showAdvanced ? '▼' : '▶'} Advanced Parameters
      </button>

      {/* Advanced Parameters */}
      {showAdvanced && (
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-cyan-300 font-mono text-sm mb-1">Phase (rad)</label>
            <input
              type="range"
              min="-Math.PI"
              max="Math.PI"
              step="0.1"
              value={parameters.phase}
              onChange={(e) => handleParameterChange('phase', parseFloat(e.target.value))}
              className="w-full accent-cyan-500"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>-π</span>
              <span className="text-cyan-300 font-mono">{(parameters.phase / Math.PI).toFixed(2)}π</span>
              <span>π</span>
            </div>
          </div>

          <div>
            <label className="block text-cyan-300 font-mono text-sm mb-1">DC Offset</label>
            <input
              type="range"
              min="-2"
              max="2"
              step="0.1"
              value={parameters.offset}
              onChange={(e) => handleParameterChange('offset', parseFloat(e.target.value))}
              className="w-full accent-cyan-500"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>-2</span>
              <span className="text-cyan-300 font-mono">{parameters.offset.toFixed(1)}</span>
              <span>2</span>
            </div>
          </div>
        </div>
      )}

      {/* Window Function */}
      <div>
        <label className="block text-cyan-300 font-mono text-sm mb-2">Window Function</label>
        <div className="space-y-2">
          {windowTypes.map(({ value, label, description }) => (
            <label key={value} className="flex items-center space-x-3 cursor-pointer">
              <input
                type="radio"
                name="window"
                value={value}
                checked={window.type === value}
                onChange={() => handleWindowChange(value)}
                className="text-cyan-500"
              />
              <div>
                <span className="text-white font-medium">{label}</span>
                <div className="text-xs text-gray-400">{description}</div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Signal Info */}
      <div className="mt-6 p-3 bg-gray-900 rounded-lg border border-gray-600">
        <h3 className="text-sm font-bold text-cyan-300 mb-2">Current Signal</h3>
        <div className="text-xs space-y-1 text-gray-300">
          <div>Type: <span className="text-cyan-300">{signalTypes.find(t => t.value === signalType)?.label}</span></div>
          <div>Amplitude: <span className="text-cyan-300">{parameters.amplitude.toFixed(2)}</span></div>
          <div>Frequency: <span className="text-cyan-300">{parameters.frequency} Hz</span></div>
          <div>Phase: <span className="text-cyan-300">{(parameters.phase / Math.PI).toFixed(2)}π rad</span></div>
          <div>Offset: <span className="text-cyan-300">{parameters.offset.toFixed(2)}</span></div>
          <div>Window: <span className="text-cyan-300">{windowTypes.find(w => w.value === window.type)?.label}</span></div>
        </div>
      </div>
    </div>
  );
}
