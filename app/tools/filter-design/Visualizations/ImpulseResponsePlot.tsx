"use client";

import React, { useEffect, useRef } from 'react';

interface ImpulseResponsePlotProps {
  impulseResponse: number[];
  timeIndices: number[];
}

const ImpulseResponsePlot: React.FC<ImpulseResponsePlotProps> = ({
  impulseResponse,
  timeIndices
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !impulseResponse || !timeIndices) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size to match its display size
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Find max absolute value for scaling
    const maxAbsValue = Math.max(
      ...impulseResponse.map(val => Math.abs(val)),
      0.01 // Minimum to prevent division by zero
    );
    
    // Padding for axes
    const padding = { left: 50, right: 20, top: 20, bottom: 40 };
    const plotWidth = canvas.width - padding.left - padding.right;
    const plotHeight = canvas.height - padding.top - padding.bottom;
    
    // Draw axes
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 1;
    
    // X-axis
    ctx.beginPath();
    const xAxisY = padding.top + (plotHeight / 2);
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
    
    // Horizontal grid lines
    for (let i = -1; i <= 1; i += 0.5) {
      if (i === 0) continue; // Skip the x-axis
      const y = padding.top + (plotHeight / 2) * (1 - i);
      
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(padding.left + plotWidth, y);
      ctx.stroke();
      
      // Label
      ctx.fillStyle = '#999';
      ctx.font = '10px Arial';
      ctx.textAlign = 'right';
      ctx.fillText((i * maxAbsValue).toFixed(2), padding.left - 5, y + 3);
    }
    
    // Draw impulse response as stem plot
    const xScale = plotWidth / impulseResponse.length;
    const yScale = (plotHeight / 2) / maxAbsValue;
    
    ctx.strokeStyle = '#00CCFF';
    ctx.lineWidth = 2;
    
    for (let i = 0; i < impulseResponse.length; i++) {
      const x = padding.left + i * xScale;
      const yZero = padding.top + (plotHeight / 2);
      const yVal = yZero - impulseResponse[i] * yScale;
      
      // Draw stem
      ctx.beginPath();
      ctx.moveTo(x, yZero);
      ctx.lineTo(x, yVal);
      ctx.stroke();
      
      // Draw circle at top of stem
      ctx.beginPath();
      ctx.arc(x, yVal, 3, 0, 2 * Math.PI);
      ctx.fillStyle = '#00CCFF';
      ctx.fill();
      
      // Draw x labels for every nth point
      if (i % Math.max(1, Math.floor(impulseResponse.length / 10)) === 0) {
        ctx.fillStyle = '#999';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(timeIndices[i].toString(), x, yZero + 15);
      }
    }
    
    // Draw title and labels
    ctx.fillStyle = '#CCC';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Sample (n)', padding.left + plotWidth / 2, canvas.height - 10);
    
    // Y-axis label
    ctx.save();
    ctx.translate(15, padding.top + plotHeight / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.fillText('Amplitude h[n]', 0, 0);
    ctx.restore();
    
  }, [impulseResponse, timeIndices]);

  return (
    <div className="w-full h-full relative">
      <canvas 
        ref={canvasRef}
        className="w-full h-full bg-gray-950 rounded-lg"
      />
      <div className="absolute top-2 left-2 text-xs font-mono text-cyan-500">
        Impulse Response (Time Domain)
      </div>
    </div>
  );
};

export default ImpulseResponsePlot; 