"use client";

import React, { useEffect, useRef } from 'react';

interface ComplexPoint {
  re: number;
  im: number;
  id?: string;
}

interface FrequencyResponseProps {
  poles: ComplexPoint[];
  zeros: ComplexPoint[];
}

export default function FrequencyResponse({ poles, zeros }: FrequencyResponseProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Calculate frequency response using pole-zero locations
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
      const y = canvas.height - (i / 5) * canvas.height;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }
    
    // Vertical grid lines
    for (let i = 0; i <= 4; i++) {
      const x = (i / 4) * canvas.width;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    
    // Calculate frequency response at each point
    const numPoints = 200;
    const magnitudes: number[] = [];
    const phases: number[] = [];
    
    for (let i = 0; i < numPoints; i++) {
      const omega = (i / numPoints) * Math.PI; // 0 to π
      const z = {
        re: Math.cos(omega),
        im: Math.sin(omega)
      };
      
      // Calculate magnitude and phase response
      let numerator = { re: 1, im: 0 };
      let denominator = { re: 1, im: 0 };
      
      // Multiply by zeros: (z - zero)
      zeros.forEach(zero => {
        const zMinusZero = {
          re: z.re - zero.re,
          im: z.im - zero.im
        };
        
        // Complex multiplication
        numerator = {
          re: numerator.re * zMinusZero.re - numerator.im * zMinusZero.im,
          im: numerator.re * zMinusZero.im + numerator.im * zMinusZero.re
        };
      });
      
      // Multiply by poles: (z - pole)
      poles.forEach(pole => {
        const zMinusPole = {
          re: z.re - pole.re,
          im: z.im - pole.im
        };
        
        // Complex multiplication
        denominator = {
          re: denominator.re * zMinusPole.re - denominator.im * zMinusPole.im,
          im: denominator.re * zMinusPole.im + denominator.im * zMinusPole.re
        };
      });
      
      // H(z) = numerator / denominator (complex division)
      const denom_mag_squared = denominator.re * denominator.re + denominator.im * denominator.im;
      const h = {
        re: (numerator.re * denominator.re + numerator.im * denominator.im) / denom_mag_squared,
        im: (numerator.im * denominator.re - numerator.re * denominator.im) / denom_mag_squared
      };
      
      // Calculate magnitude and phase
      const magnitude = Math.sqrt(h.re * h.re + h.im * h.im);
      const phase = Math.atan2(h.im, h.re);
      
      magnitudes.push(magnitude);
      phases.push(phase);
    }
    
    // Find max magnitude for scaling
    const maxMag = Math.max(...magnitudes, 1);
    
    // Draw magnitude response
    ctx.strokeStyle = 'rgba(0, 120, 255, 0.8)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    magnitudes.forEach((mag, i) => {
      const x = (i / numPoints) * canvas.width;
      const y = canvas.height - (mag / maxMag) * canvas.height * 0.9;
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    
    ctx.stroke();
    
    // Draw x-axis labels
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.font = '10px Arial';
    ctx.textAlign = 'center';
    
    ctx.fillText('0', 0, canvas.height - 2);
    ctx.fillText('π/4', canvas.width/4, canvas.height - 2);
    ctx.fillText('π/2', canvas.width/2, canvas.height - 2);
    ctx.fillText('3π/4', 3*canvas.width/4, canvas.height - 2);
    ctx.fillText('π', canvas.width - 10, canvas.height - 2);
    
    // Draw "Max" label near the top
    ctx.textAlign = 'left';
    ctx.fillText(`Max: ${maxMag.toFixed(1)}`, 5, 15);
    
  }, [poles, zeros]);
  
  return (
    <div className="mb-4">
      <h2 className="text-lg font-bold text-cyan-400 font-mono">[FREQ_RESPONSE]</h2>
      <div className="border-2 border-slate-700 rounded-md p-3 bg-slate-900/40 backdrop-blur-sm">
        <canvas 
          ref={canvasRef} 
          width={300} 
          height={150} 
          className="w-full"
        />
        <div className="text-xs text-center mt-1 text-cyan-400 font-mono tracking-wider">FREQUENCY (ω)</div>
      </div>
    </div>
  );
} 