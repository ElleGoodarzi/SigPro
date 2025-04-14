"use client";

import React from 'react';
import { FilterType, FilterImplementation, IIRMethod } from '../types/filterTypes';
import FilterTypeSelector from './FilterTypeSelector';
import FrequencyControls from './FrequencyControls';
import ImplementationSelector from './ImplementationSelector';
import IIRControls from './IIRControls';
import FIRControls from './FIRControls';

interface FilterParamsType {
  type: FilterType;
  implementation: FilterImplementation;
  cutoffFrequency: number;
  cutoffFrequency2?: number;
  order: number;
  iirMethod: IIRMethod;
  passbandRipple: number;
  stopbandAttenuation: number;
}

interface FilterControlsProps {
  filterParams: FilterParamsType;
  setFilterParams: (params: FilterParamsType) => void;
}

const FilterControls: React.FC<FilterControlsProps> = ({
  filterParams,
  setFilterParams
}) => {
  const { 
    type, 
    implementation, 
    cutoffFrequency, 
    cutoffFrequency2, 
    order, 
    iirMethod, 
    passbandRipple, 
    stopbandAttenuation
  } = filterParams;

  // Helper function to update a specific parameter
  const updateParam = <K extends keyof FilterParamsType>(key: K, value: FilterParamsType[K]) => {
    setFilterParams({ ...filterParams, [key]: value });
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold mb-2">Filter Design Controls</h2>
      
      <div className="space-y-2">
        <h3 className="text-sm font-medium">Filter Type</h3>
        <FilterTypeSelector 
          selectedType={type}
          onTypeChange={(newType: FilterType) => updateParam('type', newType)}
        />
      </div>
      
      <div className="space-y-2">
        <h3 className="text-sm font-medium">Implementation</h3>
        <ImplementationSelector 
          selectedImplementation={implementation}
          onImplementationChange={(newImpl: FilterImplementation) => updateParam('implementation', newImpl)}
        />
      </div>
      
      <div className="space-y-2">
        <h3 className="text-sm font-medium">Frequency Parameters</h3>
        <FrequencyControls 
          filterType={type}
          cutoffFrequency={cutoffFrequency}
          setCutoffFrequency={(freq) => updateParam('cutoffFrequency', freq)}
          cutoffFrequency2={cutoffFrequency2 || 0.75}
          setCutoffFrequency2={(freq) => updateParam('cutoffFrequency2', freq)}
        />
      </div>
      
      {/* Implementation-specific controls */}
      {implementation === 'fir' ? (
        <FIRControls 
          windowLength={101} // Use default or get from parent
          setWindowLength={() => {}} // Handle via parent if needed
          firMethod={'window'} // Default
          setFirMethod={() => {}} // Handle via parent
          windowType={'hamming'} // Default
          setWindowType={() => {}} // Handle via parent
          kaiserBeta={4.0} // Default
          setKaiserBeta={() => {}} // Handle via parent
        />
      ) : implementation === 'iir' ? (
        <IIRControls 
          iirMethod={iirMethod}
          setIirMethod={(method) => updateParam('iirMethod', method)}
          filterOrder={order}
          setFilterOrder={(newOrder) => updateParam('order', newOrder)}
          passbandRipple={passbandRipple}
          setPassbandRipple={(ripple) => updateParam('passbandRipple', ripple)}
          stopbandAttenuation={stopbandAttenuation}
          setStopbandAttenuation={(atten) => updateParam('stopbandAttenuation', atten)}
        />
      ) : null}
    </div>
  );
};

export default FilterControls; 