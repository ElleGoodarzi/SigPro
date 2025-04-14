import { FilterType, IIRMethod } from '../types/filterTypes';

/**
 * Normalized frequency transition width
 */
export const calculateTransitionWidth = (
  passbandEdge: number,
  stopbandEdge: number
): number => {
  return Math.abs(stopbandEdge - passbandEdge);
};

/**
 * Calculate the minimum filter order required for a Butterworth filter
 * based on passband and stopband specifications
 */
export const calculateButterworthOrder = (
  passbandRipple: number,  // dB
  stopbandAttenuation: number,  // dB
  passbandEdge: number,  // normalized frequency
  stopbandEdge: number,  // normalized frequency
): number => {
  // Convert from dB to linear scale
  const epsilon = Math.sqrt(Math.pow(10, passbandRipple / 10) - 1);
  const A = Math.pow(10, stopbandAttenuation / 20);
  
  // Calculate minimum order
  const transitionWidth = Math.abs(stopbandEdge - passbandEdge);
  const minOrder = Math.ceil(
    Math.log10(A/epsilon) / (2 * Math.log10(1/transitionWidth))
  );
  
  return Math.max(2, minOrder); // Minimum order of 2
};

/**
 * Calculate the minimum filter order required for a Chebyshev Type I filter
 * based on passband and stopband specifications
 */
export const calculateChebyshev1Order = (
  passbandRipple: number,  // dB
  stopbandAttenuation: number,  // dB
  passbandEdge: number,  // normalized frequency
  stopbandEdge: number,  // normalized frequency
): number => {
  // For Chebyshev Type I, we need the filter ripple and stopband attenuation
  const epsilon = Math.sqrt(Math.pow(10, passbandRipple / 10) - 1);
  const A = Math.pow(10, stopbandAttenuation / 20);
  
  // Calculate intermediate values for Chebyshev
  const transitionWidth = Math.abs(stopbandEdge - passbandEdge);
  
  // Frequency ratio needed for Chebyshev calculation
  const omegaRatio = stopbandEdge / passbandEdge;
  
  // Chebyshev calculation
  const minOrder = Math.ceil(
    Math.acosh(Math.sqrt((A*A - 1) / epsilon / epsilon)) / 
    Math.acosh(omegaRatio)
  );
  
  return Math.max(2, minOrder); // Minimum order of 2
};

/**
 * Calculate the minimum filter order required for a Chebyshev Type II filter
 * based on passband and stopband specifications
 */
export const calculateChebyshev2Order = (
  passbandRipple: number,  // dB
  stopbandAttenuation: number,  // dB
  passbandEdge: number,  // normalized frequency
  stopbandEdge: number,  // normalized frequency
): number => {
  // Chebyshev Type II has stopband ripple, so we use the stopband attenuation
  const epsilon = 1 / Math.sqrt(Math.pow(10, stopbandAttenuation / 10) - 1);
  const A = Math.pow(10, passbandRipple / 20);
  
  // Frequency ratio for Chebyshev II - note the reciprocal compared to Type I
  const omegaRatio = passbandEdge / stopbandEdge;
  
  // Chebyshev calculation
  const minOrder = Math.ceil(
    Math.acosh(Math.sqrt((A*A - 1) / epsilon / epsilon)) / 
    Math.acosh(1 / omegaRatio)
  );
  
  return Math.max(2, minOrder); // Minimum order of 2
};

/**
 * Calculate the minimum filter order required for an Elliptic filter
 * based on passband and stopband specifications
 */
export const calculateEllipticOrder = (
  passbandRipple: number,  // dB
  stopbandAttenuation: number,  // dB
  passbandEdge: number,  // normalized frequency 
  stopbandEdge: number,  // normalized frequency
): number => {
  // Elliptic filters are more complex, but we can use an approximation
  // based on the selectivity factor
  const epsilon_p = Math.sqrt(Math.pow(10, passbandRipple / 10) - 1);
  const epsilon_s = 1 / Math.sqrt(Math.pow(10, stopbandAttenuation / 10) - 1);
  
  // Selectivity factor k
  const k = passbandEdge / stopbandEdge;
  
  // Approximation for elliptic filter order
  const minOrder = Math.ceil(
    (Math.log10(16 * epsilon_p / epsilon_s)) / 
    (Math.log10(1/k))
  );
  
  return Math.max(2, minOrder); // Minimum order of 2
};

/**
 * Calculate the optimal filter order based on specifications and filter type
 */
export const calculateOptimalFilterOrder = (
  filterType: FilterType,
  iirMethod: IIRMethod,
  passbandStart: number,
  passbandEnd: number,
  stopbandStart: number,
  stopbandEnd: number,
  passbandRipple: number,
  stopbandAttenuation: number
): number => {
  let passbandEdge: number;
  let stopbandEdge: number;
  
  // Determine the critical frequencies based on filter type
  switch (filterType) {
    case 'lowpass':
      passbandEdge = passbandEnd;
      stopbandEdge = stopbandStart;
      break;
    case 'highpass':
      passbandEdge = passbandStart;
      stopbandEdge = stopbandEnd;
      break;
    case 'bandpass':
      // For bandpass, we use the minimum transition width
      const transitionWidth1 = Math.abs(passbandStart - stopbandEnd);
      const transitionWidth2 = Math.abs(stopbandStart - passbandEnd);
      if (transitionWidth1 < transitionWidth2) {
        passbandEdge = passbandStart;
        stopbandEdge = stopbandEnd;
      } else {
        passbandEdge = passbandEnd;
        stopbandEdge = stopbandStart;
      }
      break;
    case 'bandstop':
      // For bandstop, similar to bandpass
      const transitionWidthBs1 = Math.abs(stopbandStart - passbandStart);
      const transitionWidthBs2 = Math.abs(passbandEnd - stopbandEnd);
      if (transitionWidthBs1 < transitionWidthBs2) {
        passbandEdge = passbandStart;
        stopbandEdge = stopbandStart;
      } else {
        passbandEdge = passbandEnd;
        stopbandEdge = stopbandEnd;
      }
      break;
    default:
      return 4; // Default order
  }
  
  // Calculate order based on the filter method
  switch (iirMethod) {
    case 'butterworth':
      return calculateButterworthOrder(
        passbandRipple, 
        stopbandAttenuation, 
        passbandEdge, 
        stopbandEdge
      );
    case 'chebyshev1':
      return calculateChebyshev1Order(
        passbandRipple, 
        stopbandAttenuation, 
        passbandEdge, 
        stopbandEdge
      );
    case 'chebyshev2':
      return calculateChebyshev2Order(
        passbandRipple, 
        stopbandAttenuation, 
        passbandEdge, 
        stopbandEdge
      );
    case 'elliptic':
      return calculateEllipticOrder(
        passbandRipple,
        stopbandAttenuation,
        passbandEdge,
        stopbandEdge
      );
    default:
      return 4; // Default order
  }
};

/**
 * Convert between band edges and cutoff frequencies
 * Returns normalized cutoff frequencies for filter functions
 */
export const bandEdgesToCutoffFrequencies = (
  filterType: FilterType,
  passbandStart: number,
  passbandEnd: number,
  stopbandStart: number,
  stopbandEnd: number
): { cutoffFrequency: number, cutoffFrequency2?: number } => {
  switch (filterType) {
    case 'lowpass':
      // For lowpass, cutoff is at the passband edge
      return { cutoffFrequency: passbandEnd };
    
    case 'highpass':
      // For highpass, cutoff is at the passband edge
      return { cutoffFrequency: passbandStart };
    
    case 'bandpass':
      // For bandpass, we need both passband edges
      return { 
        cutoffFrequency: passbandStart,
        cutoffFrequency2: passbandEnd
      };
    
    case 'bandstop':
      // For bandstop, we need both passband edges
      return { 
        cutoffFrequency: stopbandStart,
        cutoffFrequency2: stopbandEnd
      };
      
    default:
      return { cutoffFrequency: 0.5 };
  }
}; 