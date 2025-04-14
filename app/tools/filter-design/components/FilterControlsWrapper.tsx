"use client";

import React from 'react';
import { FilterType, FilterImplementation, IIRMethod } from '../types/filterTypes';
const FilterControls = require('./FilterControls').default; // Use require to bypass TypeScript import issues

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

interface FilterControlsWrapperProps {
  filterParams: FilterParamsType;
  setFilterParams: (params: FilterParamsType) => void;
}

const FilterControlsWrapper: React.FC<FilterControlsWrapperProps> = (props) => {
  return <FilterControls {...props} />;
};

export default FilterControlsWrapper; 