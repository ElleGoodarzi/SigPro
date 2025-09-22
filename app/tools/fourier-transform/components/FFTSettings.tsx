'use client';

import React from 'react';
import { FourierTransformSettings } from '../types/fourierTypes';

interface FFTSettingsProps {
  settings: FourierTransformSettings;
  onSettingsChange: (settings: FourierTransformSettings) => void;
}

export default function FFTSettings({ settings, onSettingsChange }: FFTSettingsProps) {
  const handleSettingChange = (key: keyof FourierTransformSettings, value: any) => {
    onSettingsChange({
      ...settings,
      [key]: value
    });
  };

  const handleWindowChange = (type: string) => {
    onSettingsChange({
      ...settings,
      window: {
        ...settings.window,
        type: type as any
      }
    });
  };

  const handleWindowApplyChange = (apply: boolean) => {
    onSettingsChange({
      ...settings,
      window: {
        ...settings.window,
        apply
      }
    });
  };

  const windowTypes = [
    { value: 'none', label: 'None' },
    { value: 'hann', label: 'Hann' },
    { value: 'hamming', label: 'Hamming' },
    { value: 'blackman', label: 'Blackman' },
    { value: 'flattop', label: 'Flattop' }
  ];

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <h2 className="text-xl font-bold text-cyan-400 mb-4">FFT Settings</h2>
      
      {/* Sample Rate */}
      <div className="mb-4">
        <label className="block text-cyan-300 font-mono text-sm mb-2">Sample Rate (Hz)</label>
        <div className="flex items-center space-x-4">
          <input
            type="range"
            min="100"
            max="10000"
            step="100"
            value={settings.sampleRate}
            onChange={(e) => handleSettingChange('sampleRate', parseInt(e.target.value))}
            className="flex-1 accent-cyan-500"
          />
          <input
            type="number"
            min="100"
            max="10000"
            step="100"
            value={settings.sampleRate}
            onChange={(e) => handleSettingChange('sampleRate', parseInt(e.target.value))}
            className="w-20 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-cyan-300 font-mono text-sm"
          />
        </div>
        <div className="text-xs text-gray-400 mt-1">
          Nyquist frequency: {settings.sampleRate / 2} Hz
        </div>
      </div>

      {/* Duration */}
      <div className="mb-4">
        <label className="block text-cyan-300 font-mono text-sm mb-2">Duration (seconds)</label>
        <div className="flex items-center space-x-4">
          <input
            type="range"
            min="0.1"
            max="10"
            step="0.1"
            value={settings.duration}
            onChange={(e) => handleSettingChange('duration', parseFloat(e.target.value))}
            className="flex-1 accent-cyan-500"
          />
          <input
            type="number"
            min="0.1"
            max="10"
            step="0.1"
            value={settings.duration}
            onChange={(e) => handleSettingChange('duration', parseFloat(e.target.value))}
            className="w-20 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-cyan-300 font-mono text-sm"
          />
        </div>
        <div className="text-xs text-gray-400 mt-1">
          Samples: {Math.floor(settings.sampleRate * settings.duration)}
        </div>
      </div>

      {/* Window Function */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <label className="text-cyan-300 font-mono text-sm">Window Function</label>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={settings.window.apply}
              onChange={(e) => handleWindowApplyChange(e.target.checked)}
              className="text-cyan-500"
            />
            <span className="text-xs text-gray-400">Apply</span>
          </label>
        </div>
        
        <div className="space-y-2">
          {windowTypes.map(({ value, label }) => (
            <label key={value} className="flex items-center space-x-3 cursor-pointer">
              <input
                type="radio"
                name="fftWindow"
                value={value}
                checked={settings.window.type === value}
                onChange={() => handleWindowChange(value)}
                className="text-cyan-500"
                disabled={!settings.window.apply}
              />
              <span className={`text-sm ${!settings.window.apply ? 'text-gray-500' : 'text-white'}`}>
                {label}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Processing Options */}
      <div className="space-y-3">
        <label className="flex items-center space-x-3 cursor-pointer">
          <input
            type="checkbox"
            checked={settings.normalize}
            onChange={(e) => handleSettingChange('normalize', e.target.checked)}
            className="text-cyan-500"
          />
          <span className="text-cyan-300 font-mono text-sm">Normalize FFT</span>
        </label>

        <label className="flex items-center space-x-3 cursor-pointer">
          <input
            type="checkbox"
            checked={settings.zeroPadding}
            onChange={(e) => handleSettingChange('zeroPadding', e.target.checked)}
            className="text-cyan-500"
          />
          <span className="text-cyan-300 font-mono text-sm">Zero Padding</span>
        </label>
      </div>

      {/* FFT Info */}
      <div className="mt-6 p-3 bg-gray-900 rounded-lg border border-gray-600">
        <h3 className="text-sm font-bold text-cyan-300 mb-2">FFT Parameters</h3>
        <div className="text-xs space-y-1 text-gray-300">
          <div>Sample Rate: <span className="text-cyan-300">{settings.sampleRate} Hz</span></div>
          <div>Duration: <span className="text-cyan-300">{settings.duration} s</span></div>
          <div>FFT Size: <span className="text-cyan-300">{Math.floor(settings.sampleRate * settings.duration)}</span></div>
          <div>Frequency Resolution: <span className="text-cyan-300">{(settings.sampleRate / Math.floor(settings.sampleRate * settings.duration)).toFixed(2)} Hz</span></div>
          <div>Window: <span className="text-cyan-300">{settings.window.apply ? settings.window.type : 'None'}</span></div>
          <div>Normalize: <span className="text-cyan-300">{settings.normalize ? 'Yes' : 'No'}</span></div>
          <div>Zero Pad: <span className="text-cyan-300">{settings.zeroPadding ? 'Yes' : 'No'}</span></div>
        </div>
      </div>
    </div>
  );
}
