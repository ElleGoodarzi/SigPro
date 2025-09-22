'use client';

import React, { useState } from 'react';
import PlotlyChart from '../../../components/PlotlyChart';
import { FourierTransformResult } from '../types/fourierTypes';

interface SpectrumAnalyzerProps {
  fftResult: FourierTransformResult | null;
  title?: string;
  height?: number;
}

export default function SpectrumAnalyzer({ 
  fftResult, 
  title = "Spectrum Analyzer",
  height = 400 
}: SpectrumAnalyzerProps) {
  const [displayMode, setDisplayMode] = useState<'linear' | 'log'>('linear');
  const [showNegative, setShowNegative] = useState(true);

  // Simple peak detection algorithm
  function findPeaks(data: number[], threshold: number): number[] {
    if (data.length === 0) return [];
    
    const maxVal = Math.max(...data);
    const peaks: number[] = [];
    
    for (let i = 1; i < data.length - 1; i++) {
      if (data[i] > data[i - 1] && data[i] > data[i + 1] && data[i] > maxVal * threshold) {
        peaks.push(i);
      }
    }
    
    return peaks;
  }

  if (!fftResult) {
    return (
      <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
        <div className="h-80 flex items-center justify-center text-gray-400">
          No spectrum data available
        </div>
      </div>
    );
  }

  // Prepare data based on display mode
  let frequencies = fftResult.frequencies;
  let magnitude = fftResult.magnitude;

  // Filter negative frequencies if needed
  if (!showNegative) {
    const nyquistIndex = Math.floor(frequencies.length / 2);
    frequencies = frequencies.slice(0, nyquistIndex);
    magnitude = magnitude.slice(0, nyquistIndex);
  }

  // Apply log scale if needed
  if (displayMode === 'log') {
    magnitude = magnitude.map(val => 20 * Math.log10(Math.max(val, 1e-10))); // dB scale
  }

  // Create traces for different components
  const traces = [
    {
      x: frequencies,
      y: magnitude,
      type: 'scatter' as const,
      mode: 'lines' as const,
      name: displayMode === 'log' ? 'Magnitude (dB)' : 'Magnitude',
      line: { color: '#06b6d4', width: 2 },
      hovertemplate: `<b>Frequency:</b> %{x:.2f} Hz<br><b>Magnitude:</b> %{y:.3f}${displayMode === 'log' ? ' dB' : ''}<extra></extra>`
    }
  ];

  // Add markers for peaks
  const peakIndices = findPeaks(magnitude, 0.1); // Find peaks above 10% of max
  if (peakIndices.length > 0) {
    const peakFreqs = peakIndices.map(i => frequencies[i]);
    const peakMags = peakIndices.map(i => magnitude[i]);
    
    traces.push({
      x: peakFreqs,
      y: peakMags,
      type: 'scatter' as const,
      mode: 'markers' as const,
      name: 'Peaks',
      marker: { color: '#ef4444', size: 8, symbol: 'diamond' as const },
      hovertemplate: `<b>Peak at:</b> %{x:.2f} Hz<br><b>Magnitude:</b> %{y:.3f}${displayMode === 'log' ? ' dB' : ''}<extra></extra>`
    });
  }

  const layout = {
    title: {
      text: title,
      font: { color: '#ffffff', size: 16 }
    },
    xaxis: {
      title: 'Frequency (Hz)',
      titlefont: { color: '#9ca3af' },
      tickfont: { color: '#9ca3af' },
      gridcolor: '#374151',
      linecolor: '#6b7280',
      showgrid: true
    },
    yaxis: {
      title: displayMode === 'log' ? 'Magnitude (dB)' : 'Magnitude',
      titlefont: { color: '#9ca3af' },
      tickfont: { color: '#9ca3af' },
      gridcolor: '#374151',
      linecolor: '#6b7280',
      showgrid: true,
      type: displayMode === 'log' ? 'linear' : 'linear'
    },
    plot_bgcolor: 'rgba(0,0,0,0)',
    paper_bgcolor: 'rgba(0,0,0,0)',
    font: { color: '#ffffff' },
    margin: { l: 50, r: 30, t: 50, b: 50 },
    showlegend: true,
    legend: {
      x: 0.02,
      y: 0.98,
      bgcolor: 'rgba(0,0,0,0.5)',
      bordercolor: 'rgba(255,255,255,0.2)',
      borderwidth: 1
    }
  };

  const config = {
    displayModeBar: true,
    displaylogo: false,
    modeBarButtonsToRemove: ['pan2d', 'lasso2d', 'select2d'],
    responsive: true
  };

  return (
    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
      {/* Display Controls */}
      <div className="mb-4 flex flex-wrap gap-4 items-center">
        <div className="flex items-center space-x-2">
          <label className="text-cyan-300 font-mono text-sm">Scale:</label>
          <select
            value={displayMode}
            onChange={(e) => setDisplayMode(e.target.value as 'linear' | 'log')}
            className="px-2 py-1 bg-gray-700 border border-gray-600 rounded text-cyan-300 font-mono text-sm"
          >
            <option value="linear">Linear</option>
            <option value="log">Log (dB)</option>
          </select>
        </div>

        <div className="flex items-center space-x-2">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showNegative}
              onChange={(e) => setShowNegative(e.target.checked)}
              className="text-cyan-500"
            />
            <span className="text-cyan-300 font-mono text-sm">Show Negative Frequencies</span>
          </label>
        </div>
      </div>

      <PlotlyChart
        data={traces}
        layout={layout}
        config={config}
        style={{ width: '100%', height: `${height}px` }}
        title={title}
        description="Advanced spectrum analysis with peak detection"
      />
      
      {/* Spectrum Analysis */}
      <div className="mt-4 space-y-2">
        <h4 className="text-sm font-bold text-cyan-300">Spectral Analysis</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
          <div className="bg-gray-900 p-2 rounded border border-gray-600">
            <div className="text-gray-400">Peak Frequency</div>
            <div className="text-cyan-300 font-mono">
              {(() => {
                const maxIndex = fftResult.magnitude.indexOf(Math.max(...fftResult.magnitude));
                return fftResult.frequencies[maxIndex].toFixed(1) + ' Hz';
              })()}
            </div>
          </div>
          <div className="bg-gray-900 p-2 rounded border border-gray-600">
            <div className="text-gray-400">Peak Magnitude</div>
            <div className="text-cyan-300 font-mono">
              {Math.max(...fftResult.magnitude).toFixed(3)}
            </div>
          </div>
          <div className="bg-gray-900 p-2 rounded border border-gray-600">
            <div className="text-gray-400">Total Energy</div>
            <div className="text-cyan-300 font-mono">
              {fftResult.magnitude.reduce((sum, mag) => sum + mag * mag, 0).toFixed(3)}
            </div>
          </div>
          <div className="bg-gray-900 p-2 rounded border border-gray-600">
            <div className="text-gray-400">Frequency Range</div>
            <div className="text-cyan-300 font-mono">
              {Math.min(...fftResult.frequencies).toFixed(1)} - {Math.max(...fftResult.frequencies).toFixed(1)} Hz
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
