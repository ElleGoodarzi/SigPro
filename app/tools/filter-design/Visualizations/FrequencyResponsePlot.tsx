"use client";

import React, { useEffect, useRef, useState } from 'react';

interface FrequencyResponsePlotProps {
  frequencyResponse: {
    magnitude: number[];
    phase: number[];
    frequencies: number[];
  };
  showMagnitudeOnly?: boolean;
  showPhaseOnly?: boolean;
}

const FrequencyResponsePlot: React.FC<FrequencyResponsePlotProps> = ({
  frequencyResponse,
  showMagnitudeOnly,
  showPhaseOnly
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // If showPhaseOnly is true, show phase. If showMagnitudeOnly is true, show magnitude.
  // If neither is specified, allow toggling between them.
  const [showPhase, setShowPhase] = useState<boolean>(showPhaseOnly || false);
  
  // If showMagnitudeOnly or showPhaseOnly props change, update showPhase state
  useEffect(() => {
    if (showPhaseOnly) {
      setShowPhase(true);
    } else if (showMagnitudeOnly) {
      setShowPhase(false);
    }
  }, [showMagnitudeOnly, showPhaseOnly]);

  useEffect(() => {
    if (!canvasRef.current || !frequencyResponse) return;
    const { magnitude, phase, frequencies } = frequencyResponse;
    if (!magnitude || !phase || !frequencies) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size to match its display size
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Find max magnitude value for scaling
    const maxMag = Math.max(...magnitude, 0.01);
    
    // Padding for axes
    const padding = { left: 50, right: 20, top: 20, bottom: 40 };
    const plotWidth = canvas.width - padding.left - padding.right;
    const plotHeight = canvas.height - padding.top - padding.bottom;
    
    // Draw axes
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 1;
    
    // X-axis
    ctx.beginPath();
    const xAxisY = showPhase ? (padding.top + plotHeight) : (padding.top + plotHeight);
    ctx.moveTo(padding.left, xAxisY);
    ctx.lineTo(padding.left + plotWidth, xAxisY);
    ctx.stroke();
    
    // Y-axis
    ctx.beginPath();
    ctx.moveTo(padding.left, padding.top);
    ctx.lineTo(padding.left, padding.top + plotHeight);
    ctx.stroke();
    
    // Draw grid
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 0.5;
    
    // Horizontal grid lines (magnitude)
    if (!showPhase) {
      for (let i = 0; i <= 1; i += 0.25) {
        if (i === 0) continue; // Skip the x-axis
        const y = padding.top + plotHeight * (1 - i);
        
        ctx.beginPath();
        ctx.moveTo(padding.left, y);
        ctx.lineTo(padding.left + plotWidth, y);
        ctx.stroke();
        
        // Label
        ctx.fillStyle = '#999';
        ctx.font = '10px Arial';
        ctx.textAlign = 'right';
        ctx.fillText((i).toFixed(2), padding.left - 5, y + 3);
      }
    } 
    // Horizontal grid lines (phase)
    else {
      for (let i = -Math.PI; i <= Math.PI; i += Math.PI/2) {
        const y = padding.top + plotHeight * (0.5 - i / (2 * Math.PI));
        
        ctx.beginPath();
        ctx.moveTo(padding.left, y);
        ctx.lineTo(padding.left + plotWidth, y);
        ctx.stroke();
        
        // Label
        ctx.fillStyle = '#999';
        ctx.font = '10px Arial';
        ctx.textAlign = 'right';
        const label = i === 0 ? '0' : i === Math.PI ? 'π' : i === -Math.PI ? '-π' : 
                     i === Math.PI/2 ? 'π/2' : '-π/2';
        ctx.fillText(label, padding.left - 5, y + 3);
      }
    }
    
    // Vertical grid lines (frequency)
    for (let i = 0; i <= 1; i += 0.25) {
      const x = padding.left + plotWidth * i;
      
      ctx.beginPath();
      ctx.moveTo(x, padding.top);
      ctx.lineTo(x, padding.top + plotHeight);
      ctx.stroke();
      
      // Label
      ctx.fillStyle = '#999';
      ctx.font = '10px Arial';
      ctx.textAlign = 'center';
      ctx.fillText((i).toFixed(2) + 'π', x, padding.top + plotHeight + 15);
    }
    
    // Draw magnitude or phase response
    const dataToPlot = showPhase ? phase : magnitude;
    const normalizeFactor = showPhase ? (2 * Math.PI) : maxMag;
    
    ctx.beginPath();
    ctx.strokeStyle = showPhase ? '#FFD700' : '#00CCFF';
    ctx.lineWidth = 2;
    
    for (let i = 0; i < frequencies.length; i++) {
      const x = padding.left + frequencies[i] * plotWidth;
      const normalizedValue = dataToPlot[i] / normalizeFactor;
      
      // For magnitude, scale from 0 to 1 (bottom to top)
      // For phase, scale from -π to π (bottom to top, centered at middle)
      const y = showPhase ? 
        (padding.top + plotHeight * (0.5 - normalizedValue)) : 
        (padding.top + plotHeight * (1 - normalizedValue));
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.stroke();
    
    // Draw title and labels
    ctx.fillStyle = '#CCC';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Normalized Frequency (ω/π)', padding.left + plotWidth / 2, canvas.height - 10);
    
    // Y-axis label
    ctx.save();
    ctx.translate(15, padding.top + plotHeight / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.fillText(showPhase ? 'Phase (radians)' : 'Magnitude', 0, 0);
    ctx.restore();
    
  }, [frequencyResponse, showPhase]);

  return (
    <div className="w-full h-full relative">
      <canvas 
        ref={canvasRef}
        className="w-full h-full bg-gray-950 rounded-lg"
      />
      {/* Only show toggle button if neither showMagnitudeOnly nor showPhaseOnly is true */}
      {!showMagnitudeOnly && !showPhaseOnly && (
        <div className="absolute top-2 left-2 flex items-center space-x-2">
          <span className="text-xs font-mono text-cyan-500">
            {showPhase ? 'Phase Response' : 'Magnitude Response'}
          </span>
          <button
            onClick={() => setShowPhase(!showPhase)}
            className="px-2 py-1 bg-gray-800 text-xs rounded border border-gray-700 hover:bg-gray-700 transition-colors text-gray-300"
          >
            Show {showPhase ? 'Magnitude' : 'Phase'}
          </button>
        </div>
      )}
    </div>
  );
};

export default FrequencyResponsePlot; 