"use client";

import React, { useEffect, useRef } from 'react';
import { FilterType } from '../types/filterTypes';

interface FilterSpecificationPlotProps {
  type: FilterType;
  cutoffFrequency: number;
  cutoffFrequency2?: number;
  passbandRipple?: number;
  stopbandAttenuation?: number;
}

const FilterSpecificationPlot: React.FC<FilterSpecificationPlotProps> = ({
  type,
  cutoffFrequency,
  cutoffFrequency2,
  passbandRipple = 1.0,
  stopbandAttenuation = 40.0
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
    
    // Padding for axes
    const padding = { left: 60, right: 20, top: 30, bottom: 50 };
    const plotWidth = canvas.width - padding.left - padding.right;
    const plotHeight = canvas.height - padding.top - padding.bottom;

    // Calculate dB values for ripple visualization
    const passbandRippleLinear = 1 - (1 - 10 ** (-passbandRipple / 20));
    const stopbandAttenuationLinear = 10 ** (-stopbandAttenuation / 20);
    
    // Draw axes
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 1;
    
    // X-axis (frequency)
    ctx.beginPath();
    ctx.moveTo(padding.left, padding.top + plotHeight);
    ctx.lineTo(padding.left + plotWidth, padding.top + plotHeight);
    ctx.stroke();
    
    // Y-axis (magnitude)
    ctx.beginPath();
    ctx.moveTo(padding.left, padding.top);
    ctx.lineTo(padding.left, padding.top + plotHeight);
    ctx.stroke();
    
    // Draw grid
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 0.5;
    
    // Magnitude grid lines at 0dB, -3dB, -passbandRipple dB, and -stopbandAttenuation dB
    const magnitudePoints = [
      { value: 1, label: '0 dB' },
      { value: 1 - passbandRippleLinear, label: `-${passbandRipple.toFixed(1)} dB` },
      { value: 0.707, label: '-3 dB' },
      { value: stopbandAttenuationLinear, label: `-${stopbandAttenuation.toFixed(0)} dB` },
      { value: 0, label: '-∞ dB' }
    ];
    
    magnitudePoints.forEach(point => {
      const y = padding.top + plotHeight * (1 - point.value);
      
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(padding.left + plotWidth, y);
      ctx.stroke();
      
      // Label
      ctx.fillStyle = '#999';
      ctx.font = '10px Arial';
      ctx.textAlign = 'right';
      ctx.fillText(point.label, padding.left - 5, y + 3);
    });
    
    // Add frequency ticks and labels on x-axis
    const xPoints = [0, 0.25, 0.5, 0.75, 1];
    xPoints.forEach(point => {
      const x = padding.left + point * plotWidth;
      
      ctx.beginPath();
      ctx.moveTo(x, padding.top + plotHeight - 5);
      ctx.lineTo(x, padding.top + plotHeight + 5);
      ctx.stroke();
      
      ctx.fillStyle = '#999';
      ctx.font = '10px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`${point.toFixed(2)}π`, x, padding.top + plotHeight + 15);
    });
    
    // Draw filter-specific specifications
    if (type === 'lowpass') {
      // Get cutoff frequency position
      const xCutoff = padding.left + cutoffFrequency * plotWidth;
      
      // Draw cutoff frequency line
      ctx.beginPath();
      ctx.strokeStyle = '#66CCFF';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 3]);
      ctx.moveTo(xCutoff, padding.top);
      ctx.lineTo(xCutoff, padding.top + plotHeight);
      ctx.stroke();
      ctx.setLineDash([]);
      
      // Label cutoff frequency
      ctx.fillStyle = '#66CCFF';
      ctx.font = '11px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`ωc = ${(cutoffFrequency).toFixed(2)}π`, xCutoff, padding.top + plotHeight + 30);
      
      // Draw forbidden zones (passband ripple)
      const passbandRippleTop = padding.top;
      const passbandRippleBottom = padding.top + plotHeight * passbandRippleLinear;
      
      ctx.fillStyle = 'rgba(255, 50, 50, 0.2)';
      ctx.fillRect(padding.left, passbandRippleTop, xCutoff - padding.left, passbandRippleBottom - passbandRippleTop);
      
      // Draw forbidden zones (stopband attenuation)
      const stopbandAttenuationTop = padding.top + plotHeight * (1 - stopbandAttenuationLinear);
      const stopbandAttenuationBottom = padding.top + plotHeight;
      
      ctx.fillStyle = 'rgba(255, 50, 50, 0.2)';
      ctx.fillRect(xCutoff, stopbandAttenuationTop, plotWidth - (xCutoff - padding.left), stopbandAttenuationBottom - stopbandAttenuationTop);
      
      // Draw ideal filter shape
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(0, 204, 255, 0.8)';
      ctx.lineWidth = 2;
      
      // Passband
      ctx.moveTo(padding.left, padding.top);
      ctx.lineTo(xCutoff, padding.top);
      
      // Transition
      ctx.lineTo(xCutoff, padding.top + plotHeight);
      
      // Stopband
      ctx.lineTo(padding.left + plotWidth, padding.top + plotHeight);
      
      ctx.stroke();
      
      // Draw passband ripple illustration (if passbandRipple > 0)
      if (passbandRipple > 0) {
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(0, 204, 255, 0.5)';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 2]);
        
        ctx.moveTo(padding.left, padding.top + plotHeight * passbandRippleLinear);
        ctx.lineTo(xCutoff, padding.top + plotHeight * passbandRippleLinear);
        
        ctx.stroke();
        ctx.setLineDash([]);
      }
      
      // Draw stopband attenuation illustration
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(0, 204, 255, 0.5)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 2]);
      
      ctx.moveTo(xCutoff, padding.top + plotHeight * (1 - stopbandAttenuationLinear));
      ctx.lineTo(padding.left + plotWidth, padding.top + plotHeight * (1 - stopbandAttenuationLinear));
      
      ctx.stroke();
      ctx.setLineDash([]);
      
      // Draw labels for the spec regions
      ctx.fillStyle = '#00CCFF';
      ctx.font = 'bold 12px Arial';
      
      // Passband label
      ctx.textAlign = 'center';
      const passbandMidX = padding.left + (xCutoff - padding.left) / 2;
      ctx.fillText('Passband', passbandMidX, padding.top + 15);
      ctx.font = '10px Arial';
      ctx.fillText(`Ripple ≤ ${passbandRipple.toFixed(2)} dB`, passbandMidX, padding.top + 30);
      
      // Stopband label
      const stopbandMidX = xCutoff + (padding.left + plotWidth - xCutoff) / 2;
      ctx.font = 'bold 12px Arial';
      ctx.fillText('Stopband', stopbandMidX, padding.top + 15);
      ctx.font = '10px Arial';
      ctx.fillText(`Attenuation ≥ ${stopbandAttenuation.toFixed(0)} dB`, stopbandMidX, padding.top + 30);
    }
    else if (type === 'highpass') {
      // Get cutoff frequency position
      const xCutoff = padding.left + cutoffFrequency * plotWidth;
      
      // Draw cutoff frequency line
      ctx.beginPath();
      ctx.strokeStyle = '#66CCFF';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 3]);
      ctx.moveTo(xCutoff, padding.top);
      ctx.lineTo(xCutoff, padding.top + plotHeight);
      ctx.stroke();
      ctx.setLineDash([]);
      
      // Label cutoff frequency
      ctx.fillStyle = '#66CCFF';
      ctx.font = '11px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`ωc = ${(cutoffFrequency).toFixed(2)}π`, xCutoff, padding.top + plotHeight + 30);
      
      // Draw forbidden zones (passband ripple)
      const passbandRippleTop = padding.top;
      const passbandRippleBottom = padding.top + plotHeight * passbandRippleLinear;
      
      ctx.fillStyle = 'rgba(255, 50, 50, 0.2)';
      ctx.fillRect(xCutoff, passbandRippleTop, padding.left + plotWidth - xCutoff, passbandRippleBottom - passbandRippleTop);
      
      // Draw forbidden zones (stopband attenuation)
      const stopbandAttenuationTop = padding.top + plotHeight * (1 - stopbandAttenuationLinear);
      const stopbandAttenuationBottom = padding.top + plotHeight;
      
      ctx.fillStyle = 'rgba(255, 50, 50, 0.2)';
      ctx.fillRect(padding.left, stopbandAttenuationTop, xCutoff - padding.left, stopbandAttenuationBottom - stopbandAttenuationTop);
      
      // Draw ideal filter shape
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(0, 204, 255, 0.8)';
      ctx.lineWidth = 2;
      
      // Stopband
      ctx.moveTo(padding.left, padding.top + plotHeight);
      ctx.lineTo(xCutoff, padding.top + plotHeight);
      
      // Transition
      ctx.lineTo(xCutoff, padding.top);
      
      // Passband
      ctx.lineTo(padding.left + plotWidth, padding.top);
      
      ctx.stroke();
      
      // Draw passband ripple illustration (if passbandRipple > 0)
      if (passbandRipple > 0) {
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(0, 204, 255, 0.5)';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 2]);
        
        ctx.moveTo(xCutoff, padding.top + plotHeight * passbandRippleLinear);
        ctx.lineTo(padding.left + plotWidth, padding.top + plotHeight * passbandRippleLinear);
        
        ctx.stroke();
        ctx.setLineDash([]);
      }
      
      // Draw stopband attenuation illustration
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(0, 204, 255, 0.5)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 2]);
      
      ctx.moveTo(padding.left, padding.top + plotHeight * (1 - stopbandAttenuationLinear));
      ctx.lineTo(xCutoff, padding.top + plotHeight * (1 - stopbandAttenuationLinear));
      
      ctx.stroke();
      ctx.setLineDash([]);
      
      // Draw labels for the spec regions
      ctx.fillStyle = '#00CCFF';
      ctx.font = 'bold 12px Arial';
      
      // Stopband label
      ctx.textAlign = 'center';
      const stopbandMidX = padding.left + (xCutoff - padding.left) / 2;
      ctx.fillText('Stopband', stopbandMidX, padding.top + 15);
      ctx.font = '10px Arial';
      ctx.fillText(`Attenuation ≥ ${stopbandAttenuation.toFixed(0)} dB`, stopbandMidX, padding.top + 30);
      
      // Passband label
      const passbandMidX = xCutoff + (padding.left + plotWidth - xCutoff) / 2;
      ctx.font = 'bold 12px Arial';
      ctx.fillText('Passband', passbandMidX, padding.top + 15);
      ctx.font = '10px Arial';
      ctx.fillText(`Ripple ≤ ${passbandRipple.toFixed(2)} dB`, passbandMidX, padding.top + 30);
    }
    else if (type === 'bandpass' && cutoffFrequency2) {
      // Get cutoff frequency positions
      const xCutoff1 = padding.left + cutoffFrequency * plotWidth;
      const xCutoff2 = padding.left + cutoffFrequency2 * plotWidth;
      
      // Draw cutoff frequency lines
      ctx.beginPath();
      ctx.strokeStyle = '#66CCFF';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 3]);
      
      ctx.moveTo(xCutoff1, padding.top);
      ctx.lineTo(xCutoff1, padding.top + plotHeight);
      
      ctx.moveTo(xCutoff2, padding.top);
      ctx.lineTo(xCutoff2, padding.top + plotHeight);
      
      ctx.stroke();
      ctx.setLineDash([]);
      
      // Label cutoff frequencies
      ctx.fillStyle = '#66CCFF';
      ctx.font = '11px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`ωc1 = ${(cutoffFrequency).toFixed(2)}π`, xCutoff1, padding.top + plotHeight + 30);
      ctx.fillText(`ωc2 = ${(cutoffFrequency2).toFixed(2)}π`, xCutoff2, padding.top + plotHeight + 30);
      
      // Draw forbidden zones (passband ripple)
      const passbandRippleTop = padding.top;
      const passbandRippleBottom = padding.top + plotHeight * passbandRippleLinear;
      
      ctx.fillStyle = 'rgba(255, 50, 50, 0.2)';
      ctx.fillRect(xCutoff1, passbandRippleTop, xCutoff2 - xCutoff1, passbandRippleBottom - passbandRippleTop);
      
      // Draw forbidden zones (stopband attenuation)
      const stopbandAttenuationTop = padding.top + plotHeight * (1 - stopbandAttenuationLinear);
      const stopbandAttenuationBottom = padding.top + plotHeight;
      
      ctx.fillStyle = 'rgba(255, 50, 50, 0.2)';
      ctx.fillRect(padding.left, stopbandAttenuationTop, xCutoff1 - padding.left, stopbandAttenuationBottom - stopbandAttenuationTop);
      ctx.fillRect(xCutoff2, stopbandAttenuationTop, padding.left + plotWidth - xCutoff2, stopbandAttenuationBottom - stopbandAttenuationTop);
      
      // Draw ideal filter shape
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(0, 204, 255, 0.8)';
      ctx.lineWidth = 2;
      
      // Left stopband
      ctx.moveTo(padding.left, padding.top + plotHeight);
      ctx.lineTo(xCutoff1, padding.top + plotHeight);
      
      // Left transition
      ctx.lineTo(xCutoff1, padding.top);
      
      // Passband
      ctx.lineTo(xCutoff2, padding.top);
      
      // Right transition
      ctx.lineTo(xCutoff2, padding.top + plotHeight);
      
      // Right stopband
      ctx.lineTo(padding.left + plotWidth, padding.top + plotHeight);
      
      ctx.stroke();
      
      // Draw passband ripple illustration (if passbandRipple > 0)
      if (passbandRipple > 0) {
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(0, 204, 255, 0.5)';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 2]);
        
        ctx.moveTo(xCutoff1, padding.top + plotHeight * passbandRippleLinear);
        ctx.lineTo(xCutoff2, padding.top + plotHeight * passbandRippleLinear);
        
        ctx.stroke();
        ctx.setLineDash([]);
      }
      
      // Draw stopband attenuation illustration
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(0, 204, 255, 0.5)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 2]);
      
      ctx.moveTo(padding.left, padding.top + plotHeight * (1 - stopbandAttenuationLinear));
      ctx.lineTo(xCutoff1, padding.top + plotHeight * (1 - stopbandAttenuationLinear));
      
      ctx.moveTo(xCutoff2, padding.top + plotHeight * (1 - stopbandAttenuationLinear));
      ctx.lineTo(padding.left + plotWidth, padding.top + plotHeight * (1 - stopbandAttenuationLinear));
      
      ctx.stroke();
      ctx.setLineDash([]);
      
      // Draw labels for the spec regions
      ctx.fillStyle = '#00CCFF';
      ctx.font = 'bold 12px Arial';
      
      // Left stopband label
      ctx.textAlign = 'center';
      const leftStopbandMidX = padding.left + (xCutoff1 - padding.left) / 2;
      ctx.fillText('Stopband', leftStopbandMidX, padding.top + 15);
      ctx.font = '10px Arial';
      ctx.fillText(`Att ≥ ${stopbandAttenuation.toFixed(0)} dB`, leftStopbandMidX, padding.top + 30);
      
      // Passband label
      const passbandMidX = xCutoff1 + (xCutoff2 - xCutoff1) / 2;
      ctx.font = 'bold 12px Arial';
      ctx.fillText('Passband', passbandMidX, padding.top + 15);
      ctx.font = '10px Arial';
      ctx.fillText(`Ripple ≤ ${passbandRipple.toFixed(2)} dB`, passbandMidX, padding.top + 30);
      
      // Right stopband label
      const rightStopbandMidX = xCutoff2 + (padding.left + plotWidth - xCutoff2) / 2;
      ctx.font = 'bold 12px Arial';
      ctx.fillText('Stopband', rightStopbandMidX, padding.top + 15);
      ctx.font = '10px Arial';
      ctx.fillText(`Att ≥ ${stopbandAttenuation.toFixed(0)} dB`, rightStopbandMidX, padding.top + 30);
    }
    else if (type === 'bandstop' && cutoffFrequency2) {
      // Get cutoff frequency positions
      const xCutoff1 = padding.left + cutoffFrequency * plotWidth;
      const xCutoff2 = padding.left + cutoffFrequency2 * plotWidth;
      
      // Draw cutoff frequency lines
      ctx.beginPath();
      ctx.strokeStyle = '#66CCFF';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 3]);
      
      ctx.moveTo(xCutoff1, padding.top);
      ctx.lineTo(xCutoff1, padding.top + plotHeight);
      
      ctx.moveTo(xCutoff2, padding.top);
      ctx.lineTo(xCutoff2, padding.top + plotHeight);
      
      ctx.stroke();
      ctx.setLineDash([]);
      
      // Label cutoff frequencies
      ctx.fillStyle = '#66CCFF';
      ctx.font = '11px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`ωc1 = ${(cutoffFrequency).toFixed(2)}π`, xCutoff1, padding.top + plotHeight + 30);
      ctx.fillText(`ωc2 = ${(cutoffFrequency2).toFixed(2)}π`, xCutoff2, padding.top + plotHeight + 30);
      
      // Draw forbidden zones (passband ripple)
      const passbandRippleTop = padding.top;
      const passbandRippleBottom = padding.top + plotHeight * passbandRippleLinear;
      
      ctx.fillStyle = 'rgba(255, 50, 50, 0.2)';
      ctx.fillRect(padding.left, passbandRippleTop, xCutoff1 - padding.left, passbandRippleBottom - passbandRippleTop);
      ctx.fillRect(xCutoff2, passbandRippleTop, padding.left + plotWidth - xCutoff2, passbandRippleBottom - passbandRippleTop);
      
      // Draw forbidden zones (stopband attenuation)
      const stopbandAttenuationTop = padding.top + plotHeight * (1 - stopbandAttenuationLinear);
      const stopbandAttenuationBottom = padding.top + plotHeight;
      
      ctx.fillStyle = 'rgba(255, 50, 50, 0.2)';
      ctx.fillRect(xCutoff1, stopbandAttenuationTop, xCutoff2 - xCutoff1, stopbandAttenuationBottom - stopbandAttenuationTop);
      
      // Draw ideal filter shape
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(0, 204, 255, 0.8)';
      ctx.lineWidth = 2;
      
      // Left passband
      ctx.moveTo(padding.left, padding.top);
      ctx.lineTo(xCutoff1, padding.top);
      
      // Left transition
      ctx.lineTo(xCutoff1, padding.top + plotHeight);
      
      // Stopband
      ctx.lineTo(xCutoff2, padding.top + plotHeight);
      
      // Right transition
      ctx.lineTo(xCutoff2, padding.top);
      
      // Right passband
      ctx.lineTo(padding.left + plotWidth, padding.top);
      
      ctx.stroke();
      
      // Draw passband ripple illustration (if passbandRipple > 0)
      if (passbandRipple > 0) {
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(0, 204, 255, 0.5)';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 2]);
        
        ctx.moveTo(padding.left, padding.top + plotHeight * passbandRippleLinear);
        ctx.lineTo(xCutoff1, padding.top + plotHeight * passbandRippleLinear);
        
        ctx.moveTo(xCutoff2, padding.top + plotHeight * passbandRippleLinear);
        ctx.lineTo(padding.left + plotWidth, padding.top + plotHeight * passbandRippleLinear);
        
        ctx.stroke();
        ctx.setLineDash([]);
      }
      
      // Draw stopband attenuation illustration
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(0, 204, 255, 0.5)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 2]);
      
      ctx.moveTo(xCutoff1, padding.top + plotHeight * (1 - stopbandAttenuationLinear));
      ctx.lineTo(xCutoff2, padding.top + plotHeight * (1 - stopbandAttenuationLinear));
      
      ctx.stroke();
      ctx.setLineDash([]);
      
      // Draw labels for the spec regions
      ctx.fillStyle = '#00CCFF';
      ctx.font = 'bold 12px Arial';
      
      // Left passband label
      ctx.textAlign = 'center';
      const leftPassbandMidX = padding.left + (xCutoff1 - padding.left) / 2;
      ctx.fillText('Passband', leftPassbandMidX, padding.top + 15);
      ctx.font = '10px Arial';
      ctx.fillText(`Ripple ≤ ${passbandRipple.toFixed(2)} dB`, leftPassbandMidX, padding.top + 30);
      
      // Stopband label
      const stopbandMidX = xCutoff1 + (xCutoff2 - xCutoff1) / 2;
      ctx.font = 'bold 12px Arial';
      ctx.fillText('Stopband', stopbandMidX, padding.top + 15);
      ctx.font = '10px Arial';
      ctx.fillText(`Att ≥ ${stopbandAttenuation.toFixed(0)} dB`, stopbandMidX, padding.top + 30);
      
      // Right passband label
      const rightPassbandMidX = xCutoff2 + (padding.left + plotWidth - xCutoff2) / 2;
      ctx.font = 'bold 12px Arial';
      ctx.fillText('Passband', rightPassbandMidX, padding.top + 15);
      ctx.font = '10px Arial';
      ctx.fillText(`Ripple ≤ ${passbandRipple.toFixed(2)} dB`, rightPassbandMidX, padding.top + 30);
    }
    
    // Draw X axis label
    ctx.fillStyle = '#CCC';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Normalized Frequency (ω/π)', padding.left + plotWidth / 2, canvas.height - 10);
    
    // Draw Y axis label
    ctx.save();
    ctx.translate(15, padding.top + plotHeight / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.fillText('Magnitude', 0, 0);
    ctx.restore();
    
  }, [type, cutoffFrequency, cutoffFrequency2, passbandRipple, stopbandAttenuation]);

  return (
    <div className="w-full h-full">
      <canvas 
        ref={canvasRef}
        className="w-full h-full bg-gray-950 rounded-lg"
      />
    </div>
  );
};

export default FilterSpecificationPlot; 