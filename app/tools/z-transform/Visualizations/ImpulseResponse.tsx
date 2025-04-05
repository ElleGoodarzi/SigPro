"use client";

import React, { useEffect, useRef } from 'react';

interface ComplexPoint {
  re: number;
  im: number;
  id?: string;
}

interface ImpulseResponseProps {
  poles: ComplexPoint[];
  zeros: ComplexPoint[];
  isCausal: boolean;
}

export default function ImpulseResponse({ poles, zeros, isCausal }: ImpulseResponseProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Calculate impulse response using pole-zero locations
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw grid
    ctx.strokeStyle = 'rgba(200, 200, 200, 0.3)';
    ctx.lineWidth = 1;
    
    // Horizontal grid lines
    for (let i = 0; i <= 5; i++) {
      const y = i === 2 ? canvas.height / 2 : canvas.height / 2 - (i - 2) * 20;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      if (i === 2) {
        ctx.strokeStyle = 'rgba(100, 100, 100, 0.5)'; // Darker for zero line
      } else {
        ctx.strokeStyle = 'rgba(200, 200, 200, 0.3)';
      }
      ctx.stroke();
    }
    
    // Draw zero line label
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.font = '10px Arial';
    ctx.textAlign = 'left';
    ctx.fillText("0", 5, canvas.height / 2 + 10);
    
    // Calculate impulse response
    const numPoints = 30; // Number of time samples to show
    const midpoint = isCausal ? 0 : Math.floor(numPoints / 2);
    
    // Generate impulse response using partial fraction expansion approximation
    // This is a simplified calculation - a real implementation would use inverse Z transform
    const impulseResponse: number[] = Array(numPoints).fill(0);
    
    // Impulse at n=0
    impulseResponse[midpoint] = 1.0;
    
    // Apply pole effects (exponential decay/growth)
    poles.forEach(pole => {
      const poleMagnitude = Math.sqrt(pole.re * pole.re + pole.im * pole.im);
      const poleAngle = Math.atan2(pole.im, pole.re);
      
      // Skip if pole is at origin (would cause division by zero)
      if (poleMagnitude < 0.01) return;
      
      // For each time step
      for (let n = 1; n < numPoints; n++) {
        const timeIdx = isCausal ? midpoint + n : midpoint + (n * (n % 2 === 0 ? 1 : -1));
        if (timeIdx >= 0 && timeIdx < numPoints) {
          // Simplified response: Exponential decay based on pole magnitude
          // Real part contribution
          impulseResponse[timeIdx] += 0.2 * Math.pow(poleMagnitude, n) * Math.cos(n * poleAngle);
          
          // For complex conjugate pairs, this is an approximation
          if (Math.abs(pole.im) > 0.01) {
            impulseResponse[timeIdx] *= Math.cos(n * poleAngle * 0.5);
          }
        }
      }
    });
    
    // Apply zero effects (can reduce magnitude)
    zeros.forEach(zero => {
      const zeroMagnitude = Math.sqrt(zero.re * zero.re + zero.im * zero.im);
      
      // Zeros near the origin have more impact
      if (zeroMagnitude < 0.5) {
        for (let i = 0; i < numPoints; i++) {
          impulseResponse[i] *= 0.7; // Reduce overall magnitude
        }
      }
    });
    
    // Find max magnitude for scaling
    const maxVal = Math.max(...impulseResponse.map(v => Math.abs(v)), 1);
    
    // Draw time axis (at zero amplitude)
    ctx.strokeStyle = 'rgba(100, 100, 100, 0.5)';
    ctx.beginPath();
    ctx.moveTo(0, canvas.height / 2);
    ctx.lineTo(canvas.width, canvas.height / 2);
    ctx.stroke();
    
    // Draw impulse response as stems
    const barWidth = canvas.width / numPoints;
    
    impulseResponse.forEach((value, idx) => {
      const x = (idx + 0.5) * barWidth;
      const scaledHeight = (value / maxVal) * (canvas.height * 0.4);
      const y = canvas.height / 2 - scaledHeight;
      
      // Stem line
      ctx.strokeStyle = 'rgba(30, 150, 30, 0.8)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, canvas.height / 2);
      ctx.lineTo(x, y);
      ctx.stroke();
      
      // Circle at top
      ctx.fillStyle = 'rgba(30, 150, 30, 0.8)';
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fill();
    });
    
    // Draw n=0 marker
    ctx.fillStyle = 'rgba(200, 30, 30, 0.8)';
    ctx.beginPath();
    ctx.arc((midpoint + 0.5) * barWidth, canvas.height / 2, 5, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw n labels
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.font = '10px Arial';
    ctx.textAlign = 'center';
    
    if (isCausal) {
      // For causal systems, show n=0,1,2,...
      for (let i = 0; i < numPoints; i += 5) {
        ctx.fillText(`${i}`, (i + 0.5) * barWidth, canvas.height - 5);
      }
    } else {
      // For anti-causal systems, show ...-2,-1,0,1,2...
      for (let i = 0; i < numPoints; i += 5) {
        const nValue = i - midpoint;
        ctx.fillText(`${nValue}`, (i + 0.5) * barWidth, canvas.height - 5);
      }
    }
    
  }, [poles, zeros, isCausal]);
  
  return (
    <div>
      <h2 className="text-lg font-semibold mb-2">Impulse Response</h2>
      <div className="border rounded p-2 bg-white">
        <canvas 
          ref={canvasRef} 
          width={300} 
          height={150} 
          className="w-full"
        />
        <div className="text-xs text-center mt-1 text-gray-500">
          Time (n) {isCausal ? '(Causal)' : '(Anti-causal)'}
        </div>
      </div>
    </div>
  );
} 