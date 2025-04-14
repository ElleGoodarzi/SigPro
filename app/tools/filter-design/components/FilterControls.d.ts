import { FilterType, FilterImplementation, IIRMethod } from '../types/filterTypes';
import React from 'react';

export interface FilterParamsType {
  type: FilterType;
  implementation: FilterImplementation;
  cutoffFrequency: number;
  cutoffFrequency2?: number;
  order: number;
  iirMethod: IIRMethod;
  passbandRipple: number;
  stopbandAttenuation: number;
}

export interface FilterControlsProps {
  filterParams: FilterParamsType;
  setFilterParams: (params: FilterParamsType) => void;
}

declare const FilterControls: React.FC<FilterControlsProps>;

export default FilterControls; 