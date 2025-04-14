"use client";

import React, { useEffect, useRef } from 'react';

interface GroupDelayPlotProps {
  groupDelay: number[];
  frequencies: number[];
}

const GroupDelayPlot: React.FC<GroupDelayPlotProps> = ({
  groupDelay,
  frequencies
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !groupDelay || !frequencies) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size to match its display size
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Find max group delay for scaling
    const maxDelay = Math.max(...groupDelay.map(d => Math.abs(d)), 0.01);
    
    // Padding for axes
    const padding = { left: 50, right: 20, top: 20, bottom: 40 };
    const plotWidth = canvas.width - padding.left - padding.right;
    const plotHeight = canvas.height - padding.top - padding.bottom;
    
    // Draw axes
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 1;
    
    // X-axis (frequency)
    ctx.beginPath();
    const xAxisY = padding.top + plotHeight;
    ctx.moveTo(padding.left, xAxisY);
    ctx.lineTo(padding.left + plotWidth, xAxisY);
    ctx.stroke();
    
    // Y-axis (group delay)
    ctx.beginPath();
    ctx.moveTo(padding.left, padding.top);
    ctx.lineTo(padding.left, padding.top + plotHeight);
    ctx.stroke();
    
    // Draw grid
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 0.5;
    
    // Horizontal grid lines (group delay)
    const numHLines = 5;
    for (let i = 0; i < numHLines; i++) {
      const y = padding.top + (i / (numHLines - 1)) * plotHeight;
      
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(padding.left + plotWidth, y);
      ctx.stroke();
      
      // Label
      const delayValue = maxDelay * (1 - i / (numHLines - 1));
      ctx.fillStyle = '#999';
      ctx.font = '10px Arial';
      ctx.textAlign = 'right';
      ctx.fillText(delayValue.toFixed(2), padding.left - 5, y + 3);
    }
    
    // Vertical grid lines (frequency)
    for (let i = 0; i <= 1; i += 0.25) {
      const x = padding.left + i * plotWidth;
      
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
    
    // Draw group delay
    ctx.strokeStyle = '#FFAA00';
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    for (let i = 0; i < frequencies.length; i++) {
      const x = padding.left + frequencies[i] * plotWidth;
      const y = padding.top + (1 - groupDelay[i] / maxDelay) * plotHeight;
      
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
    ctx.fillText('Group Delay (samples)', 0, 0);
    ctx.restore();
    
    // Draw info text
    ctx.fillStyle = '#CCC';
    ctx.font = '12px Arial';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    
    const avgDelay = groupDelay.reduce((sum, d) => sum + d, 0) / groupDelay.length;
    const minDelay = Math.min(...groupDelay);
    const maxDelayValue = Math.max(...groupDelay);
    
    ctx.fillText(`Avg: ${avgDelay.toFixed(2)} samples`, padding.left, padding.top + 5);
    ctx.fillText(`Min: ${minDelay.toFixed(2)} samples`, padding.left, padding.top + 25);
    ctx.fillText(`Max: ${maxDelayValue.toFixed(2)} samples`, padding.left, padding.top + 45);
    
  }, [groupDelay, frequencies]);

  return (
    <div className="w-full h-full relative">
      <canvas 
        ref={canvasRef}
        className="w-full h-full bg-gray-950 rounded-lg"
      />
      <div className="absolute top-2 right-2 text-xs font-mono text-cyan-500">
        Group Delay = -d(phase)/d(ω)
      </div>
      <div className="absolute bottom-2 right-2 text-xs font-mono text-gray-500">
        Constant group delay = linear phase
      </div>
    </div>
  );
};

export default GroupDelayPlot; 