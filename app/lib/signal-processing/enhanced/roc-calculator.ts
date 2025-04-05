/**
 * Enhanced ROC (Region of Convergence) Calculator for Z-Transforms
 * 
 * This module provides improved methods for accurately determining the ROC of Z-transforms
 * based on pole positions, signal characteristics, and mathematical properties.
 */

import { Complex, complexMagnitude } from './numerical-utils';

/**
 * Signal type enumeration for ROC determination
 */
export enum SignalType {
  CAUSAL = 'causal',                 // x[n] = 0 for n < 0
  ANTICAUSAL = 'anticausal',         // x[n] = 0 for n > 0
  NONCAUSAL = 'noncausal',           // non-zero for both positive and negative n
  FINITE_DURATION = 'finite',        // non-zero for only a finite range of n
  BILATERAL_EXPONENTIAL = 'bilateral' // exponential growth/decay in both directions
}

/**
 * ROC representation interface
 */
export interface ROC {
  type: 'ENTIRE_PLANE' | 'OUTSIDE_CIRCLE' | 'INSIDE_CIRCLE' | 'ANNULAR' | 'NONE';
  innerRadius?: number;   // Inner radius for annular regions or inside circle
  outerRadius?: number;   // Outer radius for annular regions or outside circle
  includesZero: boolean;  // Whether ROC includes z = 0
  includesInfinity: boolean; // Whether ROC includes z = ∞
  description: string;    // Human-readable description
}

/**
 * ROC Operation types for combining ROCs
 */
export enum ROCOperation {
  MULTIPLY = 'multiply',  // ROC intersection (Z-transform multiplication)
  CONVOLVE = 'convolve',  // ROC union (time-domain multiplication)
  ADD = 'add'             // ROC intersection (Z-transform addition)
}

/**
 * Options for determining ROC
 */
export interface ROCOptions {
  // Signal characteristics
  signalType?: SignalType;
  
  // Pole-related options
  ignoreZeroPoles?: boolean;  // Whether to ignore poles at z = 0
  tolerance?: number;         // Numerical tolerance for pole magnitudes
  
  // Exponential behavior options
  growthRate?: number;        // Exponential growth rate if known
  decayRate?: number;         // Exponential decay rate if known
}

/**
 * Determine the ROC based on pole locations and signal properties
 * 
 * @param poles Array of poles (complex numbers)
 * @param options Options for ROC determination
 * @returns ROC description
 */
export function determineROC(
  poles: Complex[] = [],
  options: ROCOptions = {}
): ROC {
  const {
    signalType = SignalType.CAUSAL,
    ignoreZeroPoles = true,
    tolerance = 1e-10,
    growthRate,
    decayRate
  } = options;
  
  // Filter out poles at zero if requested
  const filteredPoles = ignoreZeroPoles 
    ? poles.filter(p => complexMagnitude(p) > tolerance)
    : poles;
  
  // No poles case - ROC is entire z-plane (except possibly z = 0 or z = ∞)
  if (filteredPoles.length === 0) {
    return createEntirePlaneROC(signalType);
  }
  
  // Calculate magnitudes of all poles
  const poleMagnitudes = filteredPoles.map(p => complexMagnitude(p));
  
  // Find minimum and maximum pole magnitudes
  const minMagnitude = Math.min(...poleMagnitudes);
  const maxMagnitude = Math.max(...poleMagnitudes);
  
  // Handle different signal types
  switch (signalType) {
    case SignalType.CAUSAL:
      // For causal signals, ROC is outside the largest-magnitude pole
      return createCausalROC(maxMagnitude);
      
    case SignalType.ANTICAUSAL:
      // For anticausal signals, ROC is inside the smallest-magnitude pole
      return createAnticausalROC(minMagnitude);
      
    case SignalType.FINITE_DURATION:
      // For finite duration signals, ROC is entire z-plane (except possibly 0 or ∞)
      return createFiniteDurationROC();
      
    case SignalType.BILATERAL_EXPONENTIAL:
      // For bilateral exponential signals, ROC is annular region between poles
      return createBilateralExponentialROC(minMagnitude, maxMagnitude, growthRate, decayRate);
      
    case SignalType.NONCAUSAL:
      // For general noncausal signals, analyze pole distribution to determine ROC
      return createNoncausalROC(poleMagnitudes);
      
    default:
      // Default to causal behavior if type is unknown
      return createCausalROC(maxMagnitude);
  }
}

/**
 * Determine if a signal is likely causal, anticausal, or two-sided based on poles
 * 
 * @param poles Array of pole locations
 * @returns Likely signal type
 */
export function inferSignalType(poles: Complex[]): SignalType {
  if (poles.length === 0) {
    // Without pole information, default to finite duration
    return SignalType.FINITE_DURATION;
  }
  
  // Count poles inside and outside the unit circle
  const poleMagnitudes = poles.map(p => complexMagnitude(p));
  const insideUnitCircle = poleMagnitudes.filter(m => m < 1 - 1e-10).length;
  const outsideUnitCircle = poleMagnitudes.filter(m => m > 1 + 1e-10).length;
  const onUnitCircle = poleMagnitudes.filter(m => Math.abs(m - 1) <= 1e-10).length;
  
  // Heuristics for signal type:
  // - If all poles are outside unit circle, likely causal
  // - If all poles are inside unit circle, likely anticausal
  // - If mixed, likely two-sided
  // - If all on unit circle, could be finite duration with oscillations
  
  if (onUnitCircle === poles.length) {
    return SignalType.FINITE_DURATION;
  } else if (outsideUnitCircle > 0 && insideUnitCircle === 0) {
    return SignalType.CAUSAL;
  } else if (insideUnitCircle > 0 && outsideUnitCircle === 0) {
    return SignalType.ANTICAUSAL;
  } else if (insideUnitCircle > 0 && outsideUnitCircle > 0) {
    return SignalType.BILATERAL_EXPONENTIAL;
  }
  
  // Default case
  return SignalType.NONCAUSAL;
}

/**
 * Analyze a signal array to determine its likely type and characteristics
 * 
 * @param signal The signal array to analyze
 * @returns Signal type and characteristics
 */
export function analyzeSignal(signal: number[]): {
  type: SignalType;
  isExponential: boolean;
  growthRate?: number;
  decayRate?: number;
  isFiniteDuration: boolean;
} {
  // Skip leading and trailing zeros to focus on the actual signal content
  const THRESHOLD = 1e-8;
  
  // Find first non-zero sample
  let firstNonZero = 0;
  while (firstNonZero < signal.length && Math.abs(signal[firstNonZero]) <= THRESHOLD) {
    firstNonZero++;
  }
  
  // Find last non-zero sample
  let lastNonZero = signal.length - 1;
  while (lastNonZero >= 0 && Math.abs(signal[lastNonZero]) <= THRESHOLD) {
    lastNonZero--;
  }
  
  // Check if signal is all zeros
  if (firstNonZero > lastNonZero) {
    return {
      type: SignalType.FINITE_DURATION,
      isExponential: false,
      isFiniteDuration: true
    };
  }
  
  // Determine if finite duration
  const nonZeroLength = lastNonZero - firstNonZero + 1;
  const isFiniteDuration = nonZeroLength < 0.75 * signal.length;
  
  // Compute ratios between consecutive samples for exponential analysis
  const ratios: number[] = [];
  for (let i = firstNonZero + 1; i <= lastNonZero; i++) {
    if (Math.abs(signal[i - 1]) > THRESHOLD && Math.abs(signal[i]) > THRESHOLD) {
      ratios.push(signal[i] / signal[i - 1]);
    }
  }
  
  // Need enough ratios to determine if exponential
  if (ratios.length < 3) {
    return {
      type: isFiniteDuration ? SignalType.FINITE_DURATION : SignalType.NONCAUSAL,
      isExponential: false,
      isFiniteDuration
    };
  }
  
  // Check if ratios are approximately constant (exponential behavior)
  const avgRatio = ratios.reduce((sum, ratio) => sum + ratio, 0) / ratios.length;
  const ratioVariance = ratios.reduce((sum, ratio) => sum + Math.pow(ratio - avgRatio, 2), 0) / ratios.length;
  const isExponential = ratioVariance < 0.1; // Threshold for considering consistent ratios
  
  // Analyze first half and second half of the signal separately to detect bilateral signals
  const midpoint = Math.floor(signal.length / 2);
  const firstHalf = signal.slice(0, midpoint);
  const secondHalf = signal.slice(midpoint);
  
  const firstHalfEnergy = firstHalf.reduce((sum, val) => sum + val * val, 0);
  const secondHalfEnergy = secondHalf.reduce((sum, val) => sum + val * val, 0);
  
  // If both halves have significant energy, it's likely bilateral
  const isBilateral = firstHalfEnergy > 0.2 * secondHalfEnergy && 
                     secondHalfEnergy > 0.2 * firstHalfEnergy;
  
  // Infer signal type based on characteristics
  let type: SignalType;
  
  // Check if signal appears to be centered or one-sided
  const normalizedCenter = Math.floor(signal.length / 2);
  const effectiveCenter = (firstNonZero + lastNonZero) / 2;
  
  if (isFiniteDuration) {
    type = SignalType.FINITE_DURATION;
  } else if (isBilateral && isExponential) {
    // Two-sided with exponential behavior
    type = SignalType.BILATERAL_EXPONENTIAL;
  } else if (firstNonZero >= normalizedCenter - 0.1 * signal.length) {
    // Signal starts at or after the center, likely causal
    type = SignalType.CAUSAL;
  } else if (lastNonZero <= normalizedCenter + 0.1 * signal.length) {
    // Signal ends at or before the center, likely anticausal
    type = SignalType.ANTICAUSAL;
  } else {
    // General two-sided signal
    type = SignalType.NONCAUSAL;
  }
  
  return {
    type,
    isExponential,
    growthRate: isExponential && avgRatio > 1 ? avgRatio : undefined,
    decayRate: isExponential && avgRatio < 1 ? avgRatio : undefined,
    isFiniteDuration
  };
}

/**
 * Combine two ROCs based on the specified operation
 * 
 * @param roc1 First ROC
 * @param roc2 Second ROC
 * @param operation Operation to perform (multiply, convolve, add)
 * @returns Combined ROC
 */
export function combineROCs(
  roc1: ROC,
  roc2: ROC,
  operation: ROCOperation
): ROC {
  // For multiplication and addition, we take the intersection of ROCs
  // For convolution, we take the union of ROCs
  
  if (operation === ROCOperation.CONVOLVE) {
    return unionROCs(roc1, roc2);
  } else {
    // Multiplication and addition both use intersection
    return intersectROCs(roc1, roc2);
  }
}

/**
 * Create ROC for the entire z-plane
 */
function createEntirePlaneROC(signalType: SignalType): ROC {
  // For finite duration signals, ROC is entire z-plane except possibly z = 0 or z = ∞
  const includesZero = signalType !== SignalType.ANTICAUSAL;
  const includesInfinity = signalType !== SignalType.CAUSAL;
  
  return {
    type: 'ENTIRE_PLANE',
    includesZero,
    includesInfinity,
    description: `All z ${!includesZero ? 'except z = 0' : ''} ${!includesInfinity ? 'except z = ∞' : ''}`
  };
}

/**
 * Create ROC for causal signals
 */
function createCausalROC(maxPoleMagnitude: number): ROC {
  // For causal signals, ROC is |z| > max(|poles|)
  return {
    type: 'OUTSIDE_CIRCLE',
    outerRadius: maxPoleMagnitude,
    includesZero: false,
    includesInfinity: true,
    description: `Region |z| > ${maxPoleMagnitude.toFixed(4)} (outside circle)`
  };
}

/**
 * Create ROC for anticausal signals
 */
function createAnticausalROC(minPoleMagnitude: number): ROC {
  // For anticausal signals, ROC is |z| < min(|poles|)
  return {
    type: 'INSIDE_CIRCLE',
    innerRadius: minPoleMagnitude,
    includesZero: true,
    includesInfinity: false,
    description: `Region |z| < ${minPoleMagnitude.toFixed(4)} (inside circle)`
  };
}

/**
 * Create ROC for finite duration signals
 */
function createFiniteDurationROC(): ROC {
  return {
    type: 'ENTIRE_PLANE',
    includesZero: true,
    includesInfinity: true,
    description: 'All z (entire z-plane)'
  };
}

/**
 * Create an annular ROC for a bilateral exponential signal
 */
function createBilateralExponentialROC(
  minMagnitude: number, 
  maxMagnitude: number,
  growthRate?: number,
  decayRate?: number
): ROC {
  // Handle edge cases
  if (Math.abs(minMagnitude - maxMagnitude) < 1e-6) {
    // If all poles have the same magnitude (or very close), create an annular region with small width
    // This ensures we still have a valid ROC
    const radius = minMagnitude;
    // Ensure the annular region is meaningful by making it at least 2% width
    const innerRadius = radius * 0.98;
    const outerRadius = radius * 1.02;
    
    return {
      type: 'ANNULAR',
      innerRadius: innerRadius,
      outerRadius: outerRadius,
      includesZero: false,
      includesInfinity: false,
      description: `Region ${innerRadius.toFixed(4)} < |z| < ${outerRadius.toFixed(4)} (annular)`
    };
  }
  
  // For bilateral exponential, ROC is annular region min(|poles|) < |z| < max(|poles|)
  // If growth/decay rates are provided, they can refine the boundaries
  
  // Determine inner and outer boundaries
  let innerRadius = minMagnitude;
  let outerRadius = maxMagnitude;
  
  // If we have growth/decay rate information, use it to refine the ROC
  if (growthRate !== undefined && decayRate !== undefined) {
    // For two-sided signals with known growth and decay rates,
    // we can compute a more precise ROC
    const growthAbs = Math.abs(growthRate);
    const decayAbs = Math.abs(decayRate);
    
    // If we have a valid growth/decay rate that's not conflicting with poles
    if (growthAbs > 0 && decayAbs > 0) {
      if (growthAbs > 1) {
        // For growing part (typically anticausal), inner boundary is 1/growthRate
        innerRadius = Math.max(minMagnitude, 1 / growthAbs);
      }
      
      if (decayAbs < 1) {
        // For decaying part (typically causal), outer boundary is 1/decayRate
        outerRadius = Math.min(maxMagnitude, 1 / decayAbs);
      }
    }
  }
  
  // Create the annular ROC description
  return {
    type: 'ANNULAR',
    innerRadius,
    outerRadius,
    includesZero: false,
    includesInfinity: false,
    description: `Region ${innerRadius.toFixed(4)} < |z| < ${outerRadius.toFixed(4)} (annular)`
  };
}

/**
 * Create ROC for general noncausal signals
 */
function createNoncausalROC(poleMagnitudes: number[]): ROC {
  // For noncausal signals, the ROC can be complex
  // We'll try to find a reasonable annular region based on pole distribution
  
  // Sort pole magnitudes
  const sortedMagnitudes = Array.from(new Set(poleMagnitudes)).sort((a, b) => a - b);
  
  // If only one magnitude, create a default annular region
  if (sortedMagnitudes.length === 1) {
    const radius = sortedMagnitudes[0];
    return {
      type: 'ANNULAR',
      innerRadius: radius * 0.5,
      outerRadius: radius * 2.0,
      includesZero: false,
      includesInfinity: false,
      description: `${(radius * 0.5).toFixed(4)} < |z| < ${(radius * 2.0).toFixed(4)}`
    };
  }
  
  // Find the largest gap between consecutive magnitudes
  let largestGapIdx = 0;
  let largestGap = 0;
  
  for (let i = 0; i < sortedMagnitudes.length - 1; i++) {
    const gap = sortedMagnitudes[i + 1] - sortedMagnitudes[i];
    if (gap > largestGap) {
      largestGap = gap;
      largestGapIdx = i;
    }
  }
  
  // Use the largest gap to define the annular region
  const innerRadius = sortedMagnitudes[largestGapIdx];
  const outerRadius = sortedMagnitudes[largestGapIdx + 1];
  
  return {
    type: 'ANNULAR',
    innerRadius,
    outerRadius,
    includesZero: false,
    includesInfinity: false,
    description: `${innerRadius.toFixed(4)} < |z| < ${outerRadius.toFixed(4)}`
  };
}

/**
 * Compute the intersection of two ROCs
 */
function intersectROCs(roc1: ROC, roc2: ROC): ROC {
  // If either ROC is NONE, the intersection is NONE
  if (roc1.type === 'NONE' || roc2.type === 'NONE') {
    return {
      type: 'NONE',
      includesZero: false,
      includesInfinity: false,
      description: 'Empty set (no convergence)'
    };
  }
  
  // If both are ENTIRE_PLANE, the intersection is ENTIRE_PLANE
  if (roc1.type === 'ENTIRE_PLANE' && roc2.type === 'ENTIRE_PLANE') {
    return {
      type: 'ENTIRE_PLANE',
      includesZero: roc1.includesZero && roc2.includesZero,
      includesInfinity: roc1.includesInfinity && roc2.includesInfinity,
      description: `All z ${!roc1.includesZero || !roc2.includesZero ? 'except z = 0' : ''} ${!roc1.includesInfinity || !roc2.includesInfinity ? 'except z = ∞' : ''}`
    };
  }
  
  // If one is ENTIRE_PLANE, the result is the other one
  if (roc1.type === 'ENTIRE_PLANE') {
    return {
      ...roc2,
      includesZero: roc2.includesZero && roc1.includesZero,
      includesInfinity: roc2.includesInfinity && roc1.includesInfinity,
    };
  }
  
  if (roc2.type === 'ENTIRE_PLANE') {
    return {
      ...roc1,
      includesZero: roc1.includesZero && roc2.includesZero,
      includesInfinity: roc1.includesInfinity && roc2.includesInfinity,
    };
  }
  
  // Handle intersections between different ROC types
  if (roc1.type === 'OUTSIDE_CIRCLE' && roc2.type === 'OUTSIDE_CIRCLE') {
    // Intersection of two "outside circle" ROCs is the larger outer radius
    const outerRadius = Math.max(roc1.outerRadius || 0, roc2.outerRadius || 0);
    return {
      type: 'OUTSIDE_CIRCLE',
      outerRadius,
      includesZero: false,
      includesInfinity: true,
      description: `|z| > ${outerRadius.toFixed(4)}`
    };
  }
  
  if (roc1.type === 'INSIDE_CIRCLE' && roc2.type === 'INSIDE_CIRCLE') {
    // Intersection of two "inside circle" ROCs is the smaller inner radius
    const innerRadius = Math.min(roc1.innerRadius || Infinity, roc2.innerRadius || Infinity);
    return {
      type: 'INSIDE_CIRCLE',
      innerRadius,
      includesZero: true,
      includesInfinity: false,
      description: `|z| < ${innerRadius.toFixed(4)}`
    };
  }
  
  if (roc1.type === 'OUTSIDE_CIRCLE' && roc2.type === 'INSIDE_CIRCLE') {
    // Check if the ROCs are disjoint
    if ((roc1.outerRadius || 0) >= (roc2.innerRadius || Infinity)) {
      return {
        type: 'NONE',
        includesZero: false,
        includesInfinity: false,
        description: 'Empty set (no convergence)'
      };
    }
    
    // Intersection is an annular region
    return {
      type: 'ANNULAR',
      innerRadius: roc1.outerRadius,
      outerRadius: roc2.innerRadius,
      includesZero: false,
      includesInfinity: false,
      description: `${roc1.outerRadius?.toFixed(4)} < |z| < ${roc2.innerRadius?.toFixed(4)}`
    };
  }
  
  if (roc1.type === 'INSIDE_CIRCLE' && roc2.type === 'OUTSIDE_CIRCLE') {
    return intersectROCs(roc2, roc1); // Swap and reuse logic
  }
  
  // More complex cases like annular regions
  if (roc1.type === 'ANNULAR' || roc2.type === 'ANNULAR') {
    // Convert all ROCs to their min/max radii representation
    const range1 = rocToRadiusRange(roc1);
    const range2 = rocToRadiusRange(roc2);
    
    // Check if the ranges overlap
    if (range1.max <= range2.min || range2.max <= range1.min) {
      return {
        type: 'NONE',
        includesZero: false,
        includesInfinity: false,
        description: 'Empty set (no convergence)'
      };
    }
    
    // Calculate the intersection range
    const min = Math.max(range1.min, range2.min);
    const max = Math.min(range1.max, range2.max);
    
    // Convert back to appropriate ROC type
    if (min === 0) {
      return {
        type: 'INSIDE_CIRCLE',
        innerRadius: max,
        includesZero: true,
        includesInfinity: false,
        description: `|z| < ${max.toFixed(4)}`
      };
    } else if (max === Infinity) {
      return {
        type: 'OUTSIDE_CIRCLE',
        outerRadius: min,
        includesZero: false,
        includesInfinity: true,
        description: `|z| > ${min.toFixed(4)}`
      };
    } else {
      return {
        type: 'ANNULAR',
        innerRadius: min,
        outerRadius: max,
        includesZero: false,
        includesInfinity: false,
        description: `${min.toFixed(4)} < |z| < ${max.toFixed(4)}`
      };
    }
  }
  
  // Fallback for any unhandled cases
  return {
    type: 'NONE',
    includesZero: false,
    includesInfinity: false,
    description: 'Empty set (no convergence)'
  };
}

/**
 * Compute the union of two ROCs
 */
function unionROCs(roc1: ROC, roc2: ROC): ROC {
  // If either ROC is ENTIRE_PLANE, the union is ENTIRE_PLANE
  if (roc1.type === 'ENTIRE_PLANE' || roc2.type === 'ENTIRE_PLANE') {
    return {
      type: 'ENTIRE_PLANE',
      includesZero: roc1.includesZero || roc2.includesZero,
      includesInfinity: roc1.includesInfinity || roc2.includesInfinity,
      description: `All z ${!roc1.includesZero && !roc2.includesZero ? 'except z = 0' : ''} ${!roc1.includesInfinity && !roc2.includesInfinity ? 'except z = ∞' : ''}`
    };
  }
  
  // If one ROC is NONE, the result is the other one
  if (roc1.type === 'NONE') {
    return roc2;
  }
  
  if (roc2.type === 'NONE') {
    return roc1;
  }
  
  // Handle unions between different ROC types
  if (roc1.type === 'OUTSIDE_CIRCLE' && roc2.type === 'OUTSIDE_CIRCLE') {
    // Union of two "outside circle" ROCs is the smaller outer radius
    const outerRadius = Math.min(roc1.outerRadius || 0, roc2.outerRadius || 0);
    return {
      type: 'OUTSIDE_CIRCLE',
      outerRadius,
      includesZero: false,
      includesInfinity: true,
      description: `|z| > ${outerRadius.toFixed(4)}`
    };
  }
  
  if (roc1.type === 'INSIDE_CIRCLE' && roc2.type === 'INSIDE_CIRCLE') {
    // Union of two "inside circle" ROCs is the larger inner radius
    const innerRadius = Math.max(roc1.innerRadius || 0, roc2.innerRadius || 0);
    return {
      type: 'INSIDE_CIRCLE',
      innerRadius,
      includesZero: true,
      includesInfinity: false,
      description: `|z| < ${innerRadius.toFixed(4)}`
    };
  }
  
  // More complex cases like annular regions or mixed types
  // Convert all ROCs to their min/max radii representation
  const range1 = rocToRadiusRange(roc1);
  const range2 = rocToRadiusRange(roc2);
  
  // Calculate the union range
  const min = Math.min(range1.min, range2.min);
  const max = Math.max(range1.max, range2.max);
  
  // Check if the result covers the entire plane
  if (min === 0 && max === Infinity) {
    return {
      type: 'ENTIRE_PLANE',
      includesZero: true,
      includesInfinity: true,
      description: 'All z (entire z-plane)'
    };
  }
  
  // Convert back to appropriate ROC type
  if (min === 0) {
    return {
      type: 'INSIDE_CIRCLE',
      innerRadius: max,
      includesZero: true,
      includesInfinity: false,
      description: `|z| < ${max.toFixed(4)}`
    };
  } else if (max === Infinity) {
    return {
      type: 'OUTSIDE_CIRCLE',
      outerRadius: min,
      includesZero: false,
      includesInfinity: true,
      description: `|z| > ${min.toFixed(4)}`
    };
  } else {
    // If the ranges are not contiguous, we might need a more complex description
    if (range1.max < range2.min || range2.max < range1.min) {
      return {
        type: 'ANNULAR', // This is an approximation for visualization
        innerRadius: min,
        outerRadius: max,
        includesZero: false,
        includesInfinity: false,
        description: `${min.toFixed(4)} < |z| < ${max.toFixed(4)} (non-contiguous regions)`
      };
    }
    
    return {
      type: 'ANNULAR',
      innerRadius: min,
      outerRadius: max,
      includesZero: false,
      includesInfinity: false,
      description: `${min.toFixed(4)} < |z| < ${max.toFixed(4)}`
    };
  }
}

/**
 * Convert an ROC to a min/max radius range representation
 */
function rocToRadiusRange(roc: ROC): { min: number, max: number } {
  switch (roc.type) {
    case 'ENTIRE_PLANE':
      return { min: 0, max: Infinity };
      
    case 'OUTSIDE_CIRCLE':
      return { min: roc.outerRadius || 0, max: Infinity };
      
    case 'INSIDE_CIRCLE':
      return { min: 0, max: roc.innerRadius || Infinity };
      
    case 'ANNULAR':
      return { min: roc.innerRadius || 0, max: roc.outerRadius || Infinity };
      
    case 'NONE':
      // Return an invalid range to indicate no convergence
      return { min: Infinity, max: 0 };
      
    default:
      return { min: 0, max: Infinity };
  }
}

/**
 * Performs extended ROC analysis and provides detailed documentation
 * for educational and debugging purposes
 * 
 * @param poles Array of poles (complex numbers)
 * @param options ROC calculation options
 * @returns Detailed ROC analysis with explanation
 */
export function analyzeROCWithExplanation(
  poles: Complex[] = [],
  options: ROCOptions = {}
): {
  roc: ROC;
  analysis: {
    signalCharacteristics: string;
    poleDistribution: string;
    rocDetermination: string;
    stabilityAnalysis: string;
    causalityAnalysis: string;
  }
} {
  const {
    signalType = SignalType.CAUSAL,
    ignoreZeroPoles = true,
    tolerance = 1e-10
  } = options;
  
  // Get the basic ROC
  const roc = determineROC(poles, options);
  
  // Filter out poles at zero if requested
  const filteredPoles = ignoreZeroPoles 
    ? poles.filter(p => complexMagnitude(p) > tolerance)
    : poles;
  
  // Calculate magnitudes of all poles
  const poleMagnitudes = filteredPoles.map(p => complexMagnitude(p));
  
  // Count poles inside, on, and outside the unit circle
  const insideCount = poleMagnitudes.filter(m => m < 1 - tolerance).length;
  const onCount = poleMagnitudes.filter(m => Math.abs(m - 1) <= tolerance).length;
  const outsideCount = poleMagnitudes.filter(m => m > 1 + tolerance).length;
  
  // Generate the analysis
  const signalCharacteristics = generateSignalCharacteristics(signalType);
  const poleDistribution = generatePoleDistribution(insideCount, onCount, outsideCount);
  const rocDetermination = generateROCDetermination(roc, signalType);
  const stabilityAnalysis = generateStabilityAnalysis(roc);
  const causalityAnalysis = generateCausalityAnalysis(roc, signalType);
  
  return {
    roc,
    analysis: {
      signalCharacteristics,
      poleDistribution,
      rocDetermination,
      stabilityAnalysis,
      causalityAnalysis
    }
  };
}

/**
 * Generate description of signal characteristics based on signal type
 */
function generateSignalCharacteristics(signalType: SignalType): string {
  switch (signalType) {
    case SignalType.CAUSAL:
      return "Causal signal: x[n] = 0 for n < 0. Signal starts at n = 0 and extends to positive infinity.";
      
    case SignalType.ANTICAUSAL:
      return "Anticausal signal: x[n] = 0 for n > 0. Signal extends from negative infinity up to n = 0.";
      
    case SignalType.FINITE_DURATION:
      return "Finite duration signal: x[n] = 0 outside a finite range of n values.";
      
    case SignalType.BILATERAL_EXPONENTIAL:
      return "Bilateral exponential signal: Signal extends in both positive and negative directions with exponential growth/decay.";
      
    case SignalType.NONCAUSAL:
      return "Noncausal signal: Signal has nonzero values for both positive and negative n values.";
      
    default:
      return "Unknown signal type";
  }
}

/**
 * Generate description of pole distribution
 */
function generatePoleDistribution(insideCount: number, onCount: number, outsideCount: number): string {
  if (insideCount + onCount + outsideCount === 0) {
    return "No poles present: The Z-transform is a constant or has only zeros.";
  }
  
  let distribution = `Pole distribution: ${insideCount} poles inside the unit circle, `;
  distribution += `${onCount} poles on the unit circle, and ${outsideCount} poles outside the unit circle.`;
  
  return distribution;
}

/**
 * Generate explanation of ROC determination based on ROC type and signal type
 */
function generateROCDetermination(roc: ROC, signalType: SignalType): string {
  switch (roc.type) {
    case 'ENTIRE_PLANE':
      return "ROC is the entire z-plane: This occurs for finite duration signals or signals with no poles except possibly at z = 0 or z = ∞.";
      
    case 'OUTSIDE_CIRCLE':
      return `ROC is |z| > ${roc.outerRadius?.toFixed(4)}: This typically occurs for causal signals where the ROC extends outward from the largest magnitude pole to infinity.`;
      
    case 'INSIDE_CIRCLE':
      return `ROC is |z| < ${roc.innerRadius?.toFixed(4)}: This typically occurs for anticausal signals where the ROC extends from the origin to the smallest magnitude pole.`;
      
    case 'ANNULAR':
      return `ROC is ${roc.innerRadius?.toFixed(4)} < |z| < ${roc.outerRadius?.toFixed(4)}: This annular region typically occurs for two-sided signals with poles both inside and outside the unit circle.`;
      
    case 'NONE':
      return "No valid ROC: This can occur for certain pathological signals or numerical issues.";
      
    default:
      return "Unknown ROC type";
  }
}

/**
 * Generate stability analysis based on ROC
 */
function generateStabilityAnalysis(roc: ROC): string {
  const containsUnitCircle = (
    (roc.type === 'ENTIRE_PLANE') ||
    (roc.type === 'OUTSIDE_CIRCLE' && (roc.outerRadius || 0) <= 1) ||
    (roc.type === 'INSIDE_CIRCLE' && (roc.innerRadius || 0) >= 1) ||
    (roc.type === 'ANNULAR' && (roc.innerRadius || 0) <= 1 && (roc.outerRadius || 0) >= 1)
  );
  
  if (containsUnitCircle) {
    return "The system is STABLE: The ROC includes the unit circle |z| = 1, which is necessary and sufficient for BIBO stability.";
  } else {
    return "The system is UNSTABLE: The ROC does not include the unit circle |z| = 1. For BIBO stability, the unit circle must be in the ROC.";
  }
}

/**
 * Generate causality analysis based on ROC and signal type
 */
function generateCausalityAnalysis(roc: ROC, signalType: SignalType): string {
  if (roc.type === 'OUTSIDE_CIRCLE' && roc.includesInfinity) {
    return "The system is causal: The ROC extends outward to infinity, which is characteristic of causal systems.";
  } else if (roc.type === 'INSIDE_CIRCLE' && roc.includesZero) {
    return "The system is anticausal: The ROC extends inward to the origin, which is characteristic of anticausal systems.";
  } else if (roc.type === 'ENTIRE_PLANE') {
    return "The system is finite duration: The ROC is the entire z-plane (except possibly z = 0 or z = ∞), which indicates a finite duration impulse response.";
  } else {
    return "The system is noncausal: The ROC is an annular region or has other constraints that indicate the system is neither purely causal nor anticausal.";
  }
} 