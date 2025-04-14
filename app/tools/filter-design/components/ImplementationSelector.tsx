import React from 'react';
import { FilterImplementation } from '../types/filterTypes';

interface ImplementationSelectorProps {
  selectedImplementation: FilterImplementation;
  onImplementationChange: (implementation: FilterImplementation) => void;
}

const ImplementationSelector: React.FC<ImplementationSelectorProps> = ({ 
  selectedImplementation, 
  onImplementationChange 
}) => {
  const implementations: { type: FilterImplementation; label: string; description: string }[] = [
    { 
      type: 'ideal', 
      label: 'Ideal Filter', 
      description: 'Perfect frequency response but not realizable in practice'
    },
    { 
      type: 'fir', 
      label: 'FIR Filter', 
      description: 'Finite impulse response, always stable with linear phase'
    },
    { 
      type: 'iir', 
      label: 'IIR Filter', 
      description: 'Infinite impulse response, efficient but potential stability issues'
    }
  ];

  return (
    <div className="space-y-2">
      <label className="text-cyan-300 font-mono text-sm">Implementation</label>
      <div className="relative">
        <select
          value={selectedImplementation}
          onChange={(e) => onImplementationChange(e.target.value as FilterImplementation)}
          className="w-full px-4 py-2 bg-gray-800 rounded-lg border border-green-700 text-white appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-green-600"
        >
          {implementations.map((implementation) => (
            <option key={implementation.type} value={implementation.type} className="bg-gray-800">
              {implementation.label}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-green-300">
          <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
            <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
          </svg>
        </div>
      </div>
      <div className="text-xs mt-1 text-gray-400">
        {implementations.find(impl => impl.type === selectedImplementation)?.description}
      </div>
    </div>
  );
};

export default ImplementationSelector; 