"use client";

import React, { useRef, useEffect, useState } from 'react';

interface ComplexPoint {
  re: number;
  im: number;
  id?: string;
}

interface ZPlane2DProps {
  poles: ComplexPoint[];
  zeros: ComplexPoint[];
  signalPoints?: {time: number, value: number}[];
}

export default function ZPlane2D({ poles, zeros, signalPoints = [] }: ZPlane2DProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [svgSize, setSvgSize] = useState({ width: 400, height: 400 });
  
  // Handle resize
  useEffect(() => {
    const updateSize = () => {
      if (svgRef.current) {
        const { width, height } = svgRef.current.getBoundingClientRect();
        setSvgSize({ width, height });
      }
    };
    
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);
  
  // SVG coordinate conversion helpers
  const toSvgX = (re: number) => svgSize.width / 2 + re * (svgSize.width * 0.4);
  const toSvgY = (im: number) => svgSize.height / 2 - im * (svgSize.height * 0.4);
  
  // Generate points for unit circle
  const unitCirclePoints = () => {
    const points = [];
    for (let i = 0; i <= 100; i++) {
      const angle = (i / 100) * 2 * Math.PI;
      const x = toSvgX(Math.cos(angle));
      const y = toSvgY(Math.sin(angle));
      points.push(`${x},${y}`);
    }
    return points.join(' ');
  };

  return (
    <div className="w-full h-full min-h-[400px] relative rounded-lg overflow-hidden border-2 border-cyan-500 bg-gradient-to-br from-slate-950 to-slate-900">
      <div className="absolute top-0 left-0 bg-gradient-to-r from-cyan-500 to-purple-500 text-xs text-white px-3 py-1 rounded-br-md font-mono">Z-PLANE</div>
      
      <svg 
        ref={svgRef} 
        className="w-full h-full"
        viewBox="0 0 400 400"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Sci-fi Grid Background */}
        <defs>
          <pattern id="grid-pattern" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(0, 255, 255, 0.1)" strokeWidth="0.5" />
          </pattern>
          <radialGradient id="glow-gradient" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
            <stop offset="0%" stopColor="rgba(0, 200, 255, 0.1)" />
            <stop offset="100%" stopColor="rgba(0, 0, 50, 0)" />
          </radialGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>
        
        {/* Background elements */}
        <rect x="0" y="0" width="100%" height="100%" fill="url(#grid-pattern)" />
        <circle cx={svgSize.width / 2} cy={svgSize.height / 2} r={svgSize.width * 0.45} fill="url(#glow-gradient)" />
        
        {/* Grid and axes */}
        <line 
          x1="0" 
          y1={svgSize.height / 2} 
          x2={svgSize.width} 
          y2={svgSize.height / 2} 
          stroke="rgba(0, 255, 255, 0.4)" 
          strokeWidth="1" 
        />
        <line 
          x1={svgSize.width / 2} 
          y1="0" 
          x2={svgSize.width / 2} 
          y2={svgSize.height} 
          stroke="rgba(0, 255, 255, 0.4)" 
          strokeWidth="1" 
        />
        
        {/* Unit circle */}
        <polyline
          points={unitCirclePoints()}
          fill="none"
          stroke="rgba(0, 255, 255, 0.6)"
          strokeWidth="1.5"
          filter="url(#glow)"
        />
        
        {/* Zeros */}
        {zeros.map(zero => (
          <g key={zero.id}>
            <circle
              cx={toSvgX(zero.re)}
              cy={toSvgY(zero.im)}
              r="10"
              fill="rgba(0, 0, 0, 0.5)"
              stroke="#00ffff"
              strokeWidth="2"
              filter="url(#glow)"
            />
            <circle
              cx={toSvgX(zero.re)}
              cy={toSvgY(zero.im)}
              r="3"
              fill="#00ffff"
            />
            <text 
              x={toSvgX(zero.re) + 15} 
              y={toSvgY(zero.im)} 
              fill="#00ffff" 
              fontSize="12"
              className="font-mono"
            >
              z={zero.re.toFixed(2)}{zero.im >= 0 ? '+' : ''}{zero.im.toFixed(2)}j
            </text>
          </g>
        ))}
        
        {/* Poles */}
        {poles.map(pole => (
          <g key={pole.id}>
            <circle
              cx={toSvgX(pole.re)}
              cy={toSvgY(pole.im)}
              r="10"
              fill="rgba(0, 0, 0, 0.5)"
              stroke="#ff00ff"
              strokeWidth="2"
              filter="url(#glow)"
            />
            <line
              x1={toSvgX(pole.re) - 6}
              y1={toSvgY(pole.im) - 6}
              x2={toSvgX(pole.re) + 6}
              y2={toSvgY(pole.im) + 6}
              stroke="#ff00ff"
              strokeWidth="2"
            />
            <line
              x1={toSvgX(pole.re) - 6}
              y1={toSvgY(pole.im) + 6}
              x2={toSvgX(pole.re) + 6}
              y2={toSvgY(pole.im) - 6}
              stroke="#ff00ff"
              strokeWidth="2"
            />
            <text 
              x={toSvgX(pole.re) + 15} 
              y={toSvgY(pole.im)} 
              fill="#ff00ff" 
              fontSize="12"
              className="font-mono"
            >
              p={pole.re.toFixed(2)}{pole.im >= 0 ? '+' : ''}{pole.im.toFixed(2)}j
            </text>
          </g>
        ))}
        
        {/* y[n] Signal Points */}
        {signalPoints.length > 0 && (
          <g className="signal-points">
            {signalPoints.map((point, index) => {
              const x = 50 + point.time * 25;
              const y = 350 - point.value * 50;
              return (
                <circle
                  key={index}
                  cx={x}
                  cy={y}
                  r="5"
                  fill="#00ff00"
                  className="glow-green"
                />
              );
            })}
          </g>
        )}
        
        {/* Labels */}
        <text 
          x={toSvgX(1.1)} 
          y={toSvgY(0) + 5} 
          fill="#00ffff" 
          fontSize="14"
          className="font-mono"
        >
          Re[z]
        </text>
        <text 
          x={toSvgX(0) + 5} 
          y={toSvgY(1.1)} 
          fill="#00ffff" 
          fontSize="14"
          className="font-mono"
        >
          Im[z]
        </text>
      </svg>
      
      {/* Sci-fi decorative elements */}
      <div className="absolute bottom-0 right-0 h-5 w-1/4 bg-gradient-to-l from-cyan-500 to-transparent"></div>
      <div className="absolute top-0 right-0 h-1/4 w-5 bg-gradient-to-b from-purple-500 to-transparent"></div>
    </div>
  );
} 