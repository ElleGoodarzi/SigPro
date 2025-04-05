"use client";

import React, { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import PoleZeroPlot from './Visualizations/PoleZeroPlot';
import FrequencyResponse from './Visualizations/FrequencyResponse';
import ImpulseResponse from './Visualizations/ImpulseResponse';

// Dynamically import ZPlane3D component to avoid SSR issues
const ZPlane3D = dynamic(() => import('./Visualizations/ZPlane3D'), { 
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-full bg-gray-100">Loading 3D Visualization...</div>
});

// Define types
interface ComplexPoint {
  re: number;
  im: number;
  id?: string;
}

type PresetKey = 'stable' | 'unstable' | 'causal' | 'anti-causal';

interface Props {
  preset: PresetKey;
  show3D: boolean;
  className?: string;
}

// Preset systems with different pole-zero configurations
const presetSystems = {
  stable: {
    poles: [
      { re: 0.5, im: 0.5, id: 'p1' },
      { re: 0.5, im: -0.5, id: 'p2' }
    ],
    zeros: [
      { re: 0.7, im: 0, id: 'z1' }
    ],
    isCausal: true
  },
  unstable: {
    poles: [
      { re: 1.2, im: 0.3, id: 'p1' },
      { re: 0.6, im: -0.4, id: 'p2' }
    ],
    zeros: [
      { re: 0.7, im: 0.7, id: 'z1' },
      { re: 0.7, im: -0.7, id: 'z2' }
    ],
    isCausal: true
  },
  causal: {
    poles: [
      { re: 0.8, im: 0, id: 'p1' }
    ],
    zeros: [
      { re: 0, im: 0, id: 'z1' }
    ],
    isCausal: true
  },
  'anti-causal': {
    poles: [
      { re: 0.3, im: 0.7, id: 'p1' }
    ],
    zeros: [
      { re: 0.8, im: 0, id: 'z1' },
      { re: -0.5, im: 0, id: 'z2' }
    ],
    isCausal: false
  }
};

export default function ZPlaneWorkspace({ preset, show3D, className }: Props) {
  // State for draggable poles and zeros
  const [poles, setPoles] = useState<ComplexPoint[]>(presetSystems[preset].poles);
  const [zeros, setZeros] = useState<ComplexPoint[]>(presetSystems[preset].zeros);
  const [isCausal, setIsCausal] = useState<boolean>(presetSystems[preset].isCausal);
  
  // When preset changes, update poles and zeros
  React.useEffect(() => {
    setPoles(presetSystems[preset].poles);
    setZeros(presetSystems[preset].zeros);
    setIsCausal(presetSystems[preset].isCausal);
  }, [preset]);
  
  // Check if system is stable (all poles inside unit circle)
  const isStable = useMemo(() => {
    return poles.every(pole => Math.sqrt(pole.re * pole.re + pole.im * pole.im) < 1);
  }, [poles]);

  // Handle pole/zero movement
  const handlePoleMove = (id: string, newPos: {re: number, im: number}) => {
    setPoles(prev => prev.map(pole => 
      pole.id === id ? {...pole, re: newPos.re, im: newPos.im} : pole
    ));
  };
  
  const handleZeroMove = (id: string, newPos: {re: number, im: number}) => {
    setZeros(prev => prev.map(zero => 
      zero.id === id ? {...zero, re: newPos.re, im: newPos.im} : zero
    ));
  };
  
  // Toggle causal/anti-causal
  const toggleCausality = () => {
    setIsCausal(prev => !prev);
  };

  return (
    <div className={`grid grid-cols-3 ${className}`}>
      <div className="col-span-2 border-r border-cyan-800 p-4">
        {show3D ? (
          <ZPlane3D poles={poles} zeros={zeros} />
        ) : (
          <div>
            <div className="flex justify-between mb-2">
              <h2 className="text-lg font-bold text-cyan-400 font-mono">[Z-PLANE]</h2>
              <button 
                onClick={toggleCausality}
                className={`px-3 py-1 text-sm rounded-md border ${isCausal ? 'bg-blue-900 border-blue-500 text-blue-300' : 'bg-orange-900 border-orange-500 text-orange-300'} hover:scale-105 transition-transform duration-200 font-mono`}
              >
                ROC: {isCausal ? 'CAUSAL' : 'ANTI-CAUSAL'}
              </button>
            </div>
            <PoleZeroPlot 
              poles={poles} 
              zeros={zeros} 
              onPoleMove={handlePoleMove}
              onZeroMove={handleZeroMove}
              isStable={isStable}
              isCausal={isCausal}
            />
          </div>
        )}
      </div>
      
      <div className="col-span-1 flex flex-col gap-4 p-4 bg-slate-900/40 rounded-lg">
        <div>
          <h2 className="text-lg font-bold text-purple-400 font-mono">[SYSTEM_STATUS]</h2>
          <div className="p-3 border-2 border-slate-700 rounded-md mb-4 backdrop-blur-sm bg-slate-800/30">
            <div className={`font-mono text-md ${isStable ? 'text-green-400' : 'text-red-400'}`}>
              {isStable ? '>> STABLE_SYS <<' : '>> UNSTABLE_SYS <<'}
            </div>
            <div className="text-sm text-cyan-300 mt-2 font-mono">
              P: {poles.length} | Z: {zeros.length}
            </div>
          </div>
        </div>
      
        <FrequencyResponse poles={poles} zeros={zeros} />
        <ImpulseResponse poles={poles} zeros={zeros} isCausal={isCausal} />
      </div>
    </div>
  );
} 