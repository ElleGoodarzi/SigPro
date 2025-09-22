'use client';

import React, { useState } from 'react';
import PlotlyChart from '../../../components/PlotlyChart';
import { FourierTransformResult } from '../types/fourierTypes';

interface FrequencyDomainPlotProps {
  fftResult: FourierTransformResult | null;
  title?: string;
  height?: number;
  showPhase?: boolean;
  showRealImag?: boolean;
}

export default function FrequencyDomainPlot({ 
  fftResult, 
  title = "Frequency Domain",
  height = 300,
  showPhase = true,
  showRealImag = false
}: FrequencyDomainPlotProps) {
  const [plotType, setPlotType] = useState<'magnitude' | 'phase' | 'real' | 'imaginary'>('magnitude');

  if (!fftResult) {
    return (
      <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
        <div className="h-80 flex items-center justify-center text-gray-400">
          No FFT data available
        </div>
      </div>
    );
  }

  let trace: any;
  let yLabel: string;

  switch (plotType) {
    case 'magnitude':
      trace = {
        x: fftResult.frequencies,
        y: fftResult.magnitude,
        type: 'scatter' as const,
        mode: 'lines' as const,
        name: 'Magnitude',
        line: { color: '#06b6d4', width: 2 }
      };
      yLabel = 'Magnitude';
      break;
    
    case 'phase':
      trace = {
        x: fftResult.frequencies,
        y: fftResult.phase,
        type: 'scatter' as const,
        mode: 'lines' as const,
        name: 'Phase',
        line: { color: '#10b981', width: 2 }
      };
      yLabel = 'Phase (radians)';
      break;
    
    case 'real':
      trace = {
        x: fftResult.frequencies,
        y: fftResult.real,
        type: 'scatter' as const,
        mode: 'lines' as const,
        name: 'Real',
        line: { color: '#f59e0b', width: 2 }
      };
      yLabel = 'Real Part';
      break;
    
    case 'imaginary':
      trace = {
        x: fftResult.frequencies,
        y: fftResult.imaginary,
        type: 'scatter' as const,
        mode: 'lines' as const,
        name: 'Imaginary',
        line: { color: '#ef4444', width: 2 }
      };
      yLabel = 'Imaginary Part';
      break;
  }

  const layout = {
    title: {
      text: `${title} - ${plotType.charAt(0).toUpperCase() + plotType.slice(1)}`,
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
      title: yLabel,
      titlefont: { color: '#9ca3af' },
      tickfont: { color: '#9ca3af' },
      gridcolor: '#374151',
      linecolor: '#6b7280',
      showgrid: true
    },
    plot_bgcolor: 'rgba(0,0,0,0)',
    paper_bgcolor: 'rgba(0,0,0,0)',
    font: { color: '#ffffff' },
    margin: { l: 50, r: 30, t: 50, b: 50 }
  };

  const config = {
    displayModeBar: true,
    displaylogo: false,
    modeBarButtonsToRemove: ['pan2d', 'lasso2d', 'select2d'],
    responsive: true
  };

  return (
    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
      {/* Plot Type Selector */}
      <div className="mb-4 flex flex-wrap gap-2">
        <button
          onClick={() => setPlotType('magnitude')}
          className={`px-3 py-1 rounded text-sm font-mono transition-colors ${
            plotType === 'magnitude'
              ? 'bg-cyan-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          Magnitude
        </button>
        {showPhase && (
          <button
            onClick={() => setPlotType('phase')}
            className={`px-3 py-1 rounded text-sm font-mono transition-colors ${
              plotType === 'phase'
                ? 'bg-green-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Phase
          </button>
        )}
        {showRealImag && (
          <>
            <button
              onClick={() => setPlotType('real')}
              className={`px-3 py-1 rounded text-sm font-mono transition-colors ${
                plotType === 'real'
                  ? 'bg-yellow-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              Real
            </button>
            <button
              onClick={() => setPlotType('imaginary')}
              className={`px-3 py-1 rounded text-sm font-mono transition-colors ${
                plotType === 'imaginary'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              Imaginary
            </button>
          </>
        )}
      </div>

      <PlotlyChart
        data={[trace]}
        layout={layout}
        config={config}
        style={{ width: '100%', height: `${height}px` }}
        title={`${title} - ${plotType.charAt(0).toUpperCase() + plotType.slice(1)}`}
        description={`Frequency domain ${plotType} visualization`}
      />
      
      {/* Frequency Statistics */}
      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
        <div className="bg-gray-900 p-2 rounded border border-gray-600">
          <div className="text-gray-400">Max Freq</div>
          <div className="text-cyan-300 font-mono">
            {Math.max(...fftResult.frequencies).toFixed(1)} Hz
          </div>
        </div>
        <div className="bg-gray-900 p-2 rounded border border-gray-600">
          <div className="text-gray-400">Peak Mag</div>
          <div className="text-cyan-300 font-mono">
            {Math.max(...fftResult.magnitude).toFixed(3)}
          </div>
        </div>
        <div className="bg-gray-900 p-2 rounded border border-gray-600">
          <div className="text-gray-400">Resolution</div>
          <div className="text-cyan-300 font-mono">
            {(fftResult.frequencies[1] - fftResult.frequencies[0]).toFixed(2)} Hz
          </div>
        </div>
        <div className="bg-gray-900 p-2 rounded border border-gray-600">
          <div className="text-gray-400">Bins</div>
          <div className="text-cyan-300 font-mono">
            {fftResult.frequencies.length}
          </div>
        </div>
      </div>
    </div>
  );
}
