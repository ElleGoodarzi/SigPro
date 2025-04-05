"use client";

import React, { useState, useRef, useEffect } from 'react';

interface ComplexPoint {
  re: number;
  im: number;
  id?: string;
}

interface PoleZeroPlotProps {
  poles: ComplexPoint[];
  zeros: ComplexPoint[];
  onPoleMove?: (id: string, newPosition: {re: number, im: number}) => void;
  onZeroMove?: (id: string, newPosition: {re: number, im: number}) => void;
  isStable?: boolean;
  isCausal?: boolean;
}

export default function PoleZeroPlot({ 
  poles, 
  zeros, 
  onPoleMove, 
  onZeroMove,
  isStable = true,
  isCausal = true
}: PoleZeroPlotProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [dragging, setDragging] = useState<{id: string, type: 'pole' | 'zero'} | null>(null);
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
  const toComplexCoord = (x: number, y: number) => ({
    re: (x - svgSize.width / 2) / (svgSize.width * 0.4),
    im: (svgSize.height / 2 - y) / (svgSize.height * 0.4)
  });
  
  // Handle mouse down on pole or zero
  const handleMouseDown = (e: React.MouseEvent, id: string, type: 'pole' | 'zero') => {
    e.preventDefault();
    setDragging({ id, type });
  };
  
  // Handle mouse move to drag poles/zeros
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragging || !svgRef.current) return;
    
    const svgRect = svgRef.current.getBoundingClientRect();
    const x = e.clientX - svgRect.left;
    const y = e.clientY - svgRect.top;
    
    const { re, im } = toComplexCoord(x, y);
    
    if (dragging.type === 'pole' && onPoleMove) {
      onPoleMove(dragging.id, { re, im });
    } else if (dragging.type === 'zero' && onZeroMove) {
      onZeroMove(dragging.id, { re, im });
    }
  };
  
  // Handle mouse up to stop dragging
  const handleMouseUp = () => {
    setDragging(null);
  };
  
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
  
  // Generate ROC circle points
  const rocCirclePoints = () => {
    // Find max pole radius for causal systems
    const maxPoleRadius = Math.max(
      ...poles.map(p => Math.sqrt(p.re * p.re + p.im * p.im)),
      0.01 // Minimum radius
    );
    
    // For anti-causal systems, ROC is inside the smallest pole
    const minPoleRadius = Math.min(
      ...poles.map(p => Math.sqrt(p.re * p.re + p.im * p.im)),
      0.99 // Maximum radius if no poles
    );
    
    const radius = isCausal ? maxPoleRadius + 0.05 : minPoleRadius - 0.05;
    
    const points = [];
    for (let i = 0; i <= 100; i++) {
      const angle = (i / 100) * 2 * Math.PI;
      const x = toSvgX(radius * Math.cos(angle));
      const y = toSvgY(radius * Math.sin(angle));
      points.push(`${x},${y}`);
    }
    return points.join(' ');
  };
  
  return (
    <div className="w-full h-full min-h-[400px] relative">
      <svg 
        ref={svgRef} 
        className="w-full h-full border bg-white"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* ROC region */}
        {isCausal ? (
          // Outside ROC (for causal systems)
          <mask id="outside-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            <polyline
              points={rocCirclePoints()}
              fill="black"
            />
          </mask>
        ) : (
          // Inside ROC (for anti-causal systems)
          <mask id="inside-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="black" />
            <polyline
              points={rocCirclePoints()}
              fill="white"
            />
          </mask>
        )}
        
        {/* ROC area */}
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill={isStable ? "rgba(0, 200, 100, 0.1)" : "rgba(255, 100, 100, 0.1)"}
          mask={isCausal ? "url(#outside-mask)" : "url(#inside-mask)"}
        />
        
        {/* Grid and axes */}
        <line 
          x1="0" 
          y1={svgSize.height / 2} 
          x2={svgSize.width} 
          y2={svgSize.height / 2} 
          stroke="rgba(100, 100, 100, 0.5)" 
          strokeWidth="1" 
        />
        <line 
          x1={svgSize.width / 2} 
          y1="0" 
          x2={svgSize.width / 2} 
          y2={svgSize.height} 
          stroke="rgba(100, 100, 100, 0.5)" 
          strokeWidth="1" 
        />
        
        {/* Unit circle */}
        <polyline
          points={unitCirclePoints()}
          fill="none"
          stroke="rgba(100, 100, 100, 0.8)"
          strokeWidth="1.5"
        />
        
        {/* ROC boundary */}
        <polyline
          points={rocCirclePoints()}
          fill="none"
          stroke={isStable ? "rgba(0, 180, 100, 0.7)" : "rgba(230, 100, 100, 0.7)"}
          strokeWidth="1.5"
          strokeDasharray="5,5"
        />
        
        {/* Zeros */}
        {zeros.map(zero => (
          <circle
            key={zero.id}
            cx={toSvgX(zero.re)}
            cy={toSvgY(zero.im)}
            r="10"
            fill="white"
            stroke="blue"
            strokeWidth="2"
            onMouseDown={(e) => handleMouseDown(e, zero.id!, 'zero')}
            style={{ cursor: 'move' }}
          />
        ))}
        
        {/* Poles */}
        {poles.map(pole => {
          const x = toSvgX(pole.re);
          const y = toSvgY(pole.im);
          const size = 10;
          
          return (
            <g
              key={pole.id}
              onMouseDown={(e) => handleMouseDown(e, pole.id!, 'pole')}
              style={{ cursor: 'move' }}
            >
              <line
                x1={x - size}
                y1={y - size}
                x2={x + size}
                y2={y + size}
                stroke="red"
                strokeWidth="2"
              />
              <line
                x1={x - size}
                y1={y + size}
                x2={x + size}
                y2={y - size}
                stroke="red"
                strokeWidth="2"
              />
            </g>
          );
        })}
        
        {/* Labels */}
        <text x={toSvgX(1.05)} y={toSvgY(0) + 5} fill="rgba(0, 0, 0, 0.7)" fontSize="12">
          Re
        </text>
        <text x={toSvgX(0) + 5} y={toSvgY(1.05)} fill="rgba(0, 0, 0, 0.7)" fontSize="12">
          Im
        </text>
        
        {/* Stability indicator */}
        <text 
          x={svgSize.width - 100} 
          y="20" 
          fill={isStable ? "rgba(0, 150, 0, 1)" : "rgba(200, 0, 0, 1)"} 
          fontSize="14"
          fontWeight="bold"
        >
          {isStable ? "Stable" : "Unstable"}
        </text>
      </svg>
    </div>
  );
} 