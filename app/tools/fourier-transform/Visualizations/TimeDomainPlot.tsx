'use client';

import React from 'react';
import PlotlyChart from '../../../components/PlotlyChart';
import { SignalData } from '../types/fourierTypes';

interface TimeDomainPlotProps {
  signalData: SignalData;
  title?: string;
  height?: number;
}

export default function TimeDomainPlot({ 
  signalData, 
  title = "Time Domain Signal",
  height = 300 
}: TimeDomainPlotProps) {
  if (!signalData) {
    return (
      <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
        <div className="h-80 flex items-center justify-center text-gray-400">
          No signal data available
        </div>
      </div>
    );
  }

  const trace = {
    x: signalData.time,
    y: signalData.values,
    type: 'scatter' as const,
    mode: 'lines' as const,
    name: 'Signal',
    line: {
      color: '#06b6d4', // cyan-500
      width: 2
    },
    hovertemplate: '<b>Time:</b> %{x:.3f} s<br><b>Amplitude:</b> %{y:.3f}<extra></extra>'
  };

  const layout = {
    title: {
      text: title,
      font: { color: '#ffffff', size: 16 }
    },
    xaxis: {
      title: 'Time (s)',
      titlefont: { color: '#9ca3af' },
      tickfont: { color: '#9ca3af' },
      gridcolor: '#374151',
      linecolor: '#6b7280',
      showgrid: true
    },
    yaxis: {
      title: 'Amplitude',
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
      <PlotlyChart
        data={[trace]}
        layout={layout}
        config={config}
        style={{ width: '100%', height: `${height}px` }}
        title={title}
        description="Time domain signal visualization"
      />
      
      {/* Signal Statistics */}
      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
        <div className="bg-gray-900 p-2 rounded border border-gray-600">
          <div className="text-gray-400">Max</div>
          <div className="text-cyan-300 font-mono">
            {signalData ? Math.max(...signalData.values).toFixed(3) : '0.000'}
          </div>
        </div>
        <div className="bg-gray-900 p-2 rounded border border-gray-600">
          <div className="text-gray-400">Min</div>
          <div className="text-cyan-300 font-mono">
            {signalData ? Math.min(...signalData.values).toFixed(3) : '0.000'}
          </div>
        </div>
        <div className="bg-gray-900 p-2 rounded border border-gray-600">
          <div className="text-gray-400">RMS</div>
          <div className="text-cyan-300 font-mono">
            {signalData ? Math.sqrt(signalData.values.reduce((sum, val) => sum + val * val, 0) / signalData.values.length).toFixed(3) : '0.000'}
          </div>
        </div>
        <div className="bg-gray-900 p-2 rounded border border-gray-600">
          <div className="text-gray-400">Mean</div>
          <div className="text-cyan-300 font-mono">
            {signalData ? (signalData.values.reduce((sum, val) => sum + val, 0) / signalData.values.length).toFixed(3) : '0.000'}
          </div>
        </div>
      </div>
    </div>
  );
}
