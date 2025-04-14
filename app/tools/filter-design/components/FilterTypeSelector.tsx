import React from 'react';
import { FilterType } from '../types/filterTypes';

interface FilterTypeSelectorProps {
  selectedType: FilterType;
  onTypeChange: (type: FilterType) => void;
}

const FilterTypeSelector: React.FC<FilterTypeSelectorProps> = ({ 
  selectedType, 
  onTypeChange 
}) => {
  const filterTypes: { type: FilterType; label: string; description: string }[] = [
    { 
      type: 'lowpass', 
      label: 'Lowpass', 
      description: 'Passes signals with frequencies lower than cutoff frequency'
    },
    { 
      type: 'highpass', 
      label: 'Highpass', 
      description: 'Passes signals with frequencies higher than cutoff frequency'
    },
    { 
      type: 'bandpass', 
      label: 'Bandpass', 
      description: 'Passes signals within a certain frequency band'
    },
    { 
      type: 'bandstop', 
      label: 'Bandstop', 
      description: 'Rejects signals within a certain frequency band'
    },
  ];

  return (
    <div className="space-y-2">
      <label className="text-cyan-300 font-mono text-sm">Filter Type</label>
      <div className="relative">
        <select
          value={selectedType}
          onChange={(e) => onTypeChange(e.target.value as FilterType)}
          className="w-full px-4 py-2 bg-gray-800 rounded-lg border border-cyan-700 text-white appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-cyan-600"
        >
          {filterTypes.map((filter) => (
            <option key={filter.type} value={filter.type} className="bg-gray-800">
              {filter.label}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-cyan-300">
          <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
            <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
          </svg>
        </div>
      </div>
      <div className="text-xs mt-1 text-gray-400">
        {filterTypes.find(filter => filter.type === selectedType)?.description}
      </div>
    </div>
  );
};

export default FilterTypeSelector; 