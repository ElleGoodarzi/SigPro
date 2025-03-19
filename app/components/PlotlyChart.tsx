'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { PlotData } from '@/app/types/api';
import Loading from './Loading';
import ErrorBoundary from './ErrorBoundary';

// Dynamically import Plotly
const Plot = dynamic(
  () => import('react-plotly.js')
    .then(mod => mod.default)
    .catch(err => {
      console.error('Failed to load Plotly:', err);
      return () => (
        <div className="flex items-center justify-center h-full bg-base-300 text-center p-4" role="alert" aria-live="assertive">
          <div>
            <p className="text-error mb-2">Visualization failed to load</p>
            <p>Please refresh the page to try again.</p>
          </div>
        </div>
      );
    }),
  { 
    ssr: false,
    loading: () => <Loading message="Loading visualization..." /> 
  }
);

export interface PlotlyChartProps {
  data: PlotData[];
  layout?: Record<string, any>;
  config?: Record<string, any>;
  style?: React.CSSProperties;
  className?: string;
  title?: string;
  description?: string;
}

export default function PlotlyChart({
  data,
  layout = {},
  config = { responsive: true },
  style = { width: '100%', height: '400px' },
  className = '',
  title,
  description
}: PlotlyChartProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Default layout options with accessibility improvements
  const defaultLayout = {
    autosize: true,
    margin: { l: 50, r: 20, b: 40, t: 40, pad: 0 },
    ...layout,
    title: title || layout.title
  };

  // Enhanced config with better accessibility
  const enhancedConfig = {
    responsive: true,
    displayModeBar: true,
    toImageButtonOptions: {
      format: 'png' as 'png' | 'svg' | 'jpeg' | 'webp',
      filename: 'chart_download',
      scale: 2
    },
    ...config
  };

  // Generate a text summary of the data for screen readers
  const generateDataSummary = () => {
    if (!data || data.length === 0) return 'No data available for this chart.';
    
    const summaries = data.map((series, index) => {
      const name = series.name || `Series ${index + 1}`;
      
      // Calculate some basic statistics
      let min = Number.MAX_VALUE;
      let max = Number.MIN_VALUE;
      let sum = 0;
      
      if (Array.isArray(series.y)) {
        series.y.forEach(val => {
          if (val < min) min = val;
          if (val > max) max = val;
          sum += val;
        });
      }
      
      const avg = sum / (series.y?.length || 1);
      
      return `${name}: ${series.y?.length || 0} data points, ranging from ${min.toFixed(2)} to ${max.toFixed(2)}, with average ${avg.toFixed(2)}.`;
    }).join(' ');
    
    const chartType = data[0]?.type || 'chart';
    return `${description || title || 'Chart'} showing ${chartType} data. ${summaries}`;
  };

  // Only render Plot on client and after mounted
  if (!mounted) return <Loading message="Loading visualization..." />;

  return (
    <ErrorBoundary fallback={
      <div className="bg-error/10 p-4 rounded" role="alert">
        <h3 className="font-bold text-error">Visualization Error</h3>
        <p>There was a problem rendering the chart.</p>
      </div>
    }>
      <div className={`visualizer-container ${className}`} role="figure" aria-label={title || 'Data visualization'}>
        <div className="sr-only">{generateDataSummary()}</div>
        <Plot
          data={data}
          layout={defaultLayout}
          config={enhancedConfig}
          useResizeHandler={true}
          style={style}
          aria-hidden="false"
        />
      </div>
    </ErrorBoundary>
  );
} 