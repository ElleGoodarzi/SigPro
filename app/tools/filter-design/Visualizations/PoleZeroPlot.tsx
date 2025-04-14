"use client";

import React, { useEffect, useRef } from 'react';

interface PoleZeroPlotProps {
  poles: { re: number; im: number }[];
  zeros: { re: number; im: number }[];
}

const PoleZeroPlot: React.FC<PoleZeroPlotProps> = ({
  poles,
  zeros
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size to match its display size
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Determine plot dimensions
    const margin = 30;
    const plotSize = Math.min(canvas.width, canvas.height) - 2 * margin;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = plotSize / 2;
    
    // Draw z-plane background
    ctx.fillStyle = '#111';
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.fill();
    
    // Draw unit circle
    ctx.strokeStyle = '#444';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.stroke();
    
    // Draw axes
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 1;
    
    // Real axis
    ctx.beginPath();
    ctx.moveTo(centerX - radius, centerY);
    ctx.lineTo(centerX + radius, centerY);
    ctx.stroke();
    
    // Imaginary axis
    ctx.beginPath();
    ctx.moveTo(centerX, centerY - radius);
    ctx.lineTo(centerX, centerY + radius);
    ctx.stroke();
    
    // Draw grid lines
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 0.5;
    
    // Draw grid circles
    for (let r = 0.25; r <= 1; r += 0.25) {
      if (r === 1) continue;  // Skip unit circle as it's already drawn
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius * r, 0, 2 * Math.PI);
      ctx.stroke();
    }
    
    // Draw grid labels
    ctx.fillStyle = '#999';
    ctx.font = '10px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Real axis labels
    ctx.fillText('0', centerX, centerY + 15);
    ctx.fillText('1', centerX + radius, centerY + 15);
    ctx.fillText('-1', centerX - radius, centerY + 15);
    
    // Imaginary axis labels
    ctx.fillText('j', centerX + 15, centerY - radius);
    ctx.fillText('-j', centerX + 15, centerY + radius);
    
    // Function to map z-plane coordinates to canvas coordinates
    const mapToCanvas = (re: number, im: number) => {
      return {
        x: centerX + re * radius,
        y: centerY - im * radius  // Negate im because canvas y is down
      };
    };
    
    // Draw poles (X)
    ctx.strokeStyle = '#FF4444';
    ctx.lineWidth = 2;
    
    poles.forEach(pole => {
      const { x, y } = mapToCanvas(pole.re, pole.im);
      const size = 5;
      
      // Draw X
      ctx.beginPath();
      ctx.moveTo(x - size, y - size);
      ctx.lineTo(x + size, y + size);
      ctx.moveTo(x + size, y - size);
      ctx.lineTo(x - size, y + size);
      ctx.stroke();
    });
    
    // Draw zeros (O)
    ctx.strokeStyle = '#44CCFF';
    ctx.lineWidth = 2;
    
    zeros.forEach(zero => {
      const { x, y } = mapToCanvas(zero.re, zero.im);
      const size = 5;
      
      // Draw circle
      ctx.beginPath();
      ctx.arc(x, y, size, 0, 2 * Math.PI);
      ctx.stroke();
    });
    
    // Draw legend
    const legendX = margin;
    const legendY = margin;
    const legendSpacing = 20;
    
    // Pole legend
    ctx.strokeStyle = '#FF4444';
    ctx.beginPath();
    ctx.moveTo(legendX - 5, legendY - 5);
    ctx.lineTo(legendX + 5, legendY + 5);
    ctx.moveTo(legendX + 5, legendY - 5);
    ctx.lineTo(legendX - 5, legendY + 5);
    ctx.stroke();
    
    ctx.fillStyle = '#FF4444';
    ctx.font = '12px Arial';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('Poles', legendX + 15, legendY);
    
    // Zero legend
    ctx.strokeStyle = '#44CCFF';
    ctx.beginPath();
    ctx.arc(legendX, legendY + legendSpacing, 5, 0, 2 * Math.PI);
    ctx.stroke();
    
    ctx.fillStyle = '#44CCFF';
    ctx.fillText('Zeros', legendX + 15, legendY + legendSpacing);
    
    // Title
    ctx.fillStyle = '#CCC';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('Z-Plane (Pole-Zero Plot)', centerX, margin / 2);

    // Draw labels for pole and zero counts
    ctx.fillStyle = '#CCC';
    ctx.font = '12px Arial';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'bottom';
    ctx.fillText(`Poles: ${poles.length}`, legendX, canvas.height - margin / 2);
    ctx.fillText(`Zeros: ${zeros.length}`, legendX + 100, canvas.height - margin / 2);
    
  }, [poles, zeros]);

  return (
    <div className="w-full h-full relative">
      <canvas 
        ref={canvasRef}
        className="w-full h-full bg-gray-950 rounded-lg"
      />
      <div className="absolute top-2 right-2 text-xs font-mono text-gray-500">
        Unit Circle = |z| = 1
      </div>
      <div className="absolute bottom-2 right-2 text-xs font-mono text-gray-500">
        Stability requires poles inside unit circle
      </div>
    </div>
  );
};

export default PoleZeroPlot; 