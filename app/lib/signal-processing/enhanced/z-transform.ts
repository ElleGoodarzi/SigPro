/**
 * Enhanced Z-Transform Implementation
 * 
 * This module provides improved Z-transform operations with better numerical
 * stability, more accurate root finding, and proper ROC calculations.
 */

import { 
  Complex, 
  complexMagnitude,
  evaluatePolynomial
} from './numerical-utils';

import { factorizeZTransform, FactorizationOptions } from './factorizer';
import { determineROC, SignalType, ROC, ROCOperation, combineROCs, analyzeSignal } from './roc-calculator';

/**
 * Error class for Z-Transform specific errors
 */
export class ZTransformError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'ZTransformError';
  }
}

/**
 * Z-Transform result interface
 */
export interface ZTransformResult {
  numerator: number[];    // Coefficients of the numerator polynomial
  denominator: number[];  // Coefficients of the denominator polynomial (Default: [1])
  roc: ROC;               // Region of convergence
  expression: string;     // String representation of the Z-transform
  zeros?: Complex[];      // Zeros of the Z-transform (if factorized)
  poles?: Complex[];      // Poles of the Z-transform (if factorized)
  gain?: number;          // Gain factor (if factorized)
}

/**
 * Z-Transform options interface
 */
export interface ZTransformOptions {
  limit?: number;         // Maximum number of terms to compute (for infinite sequences)
  causal?: boolean;       // Whether the sequence is causal (default: true)
  factorized?: boolean;   // Whether to return factorized form (zeros/poles)
  signalType?: SignalType; // Explicit signal type for ROC determination
  factorizationOptions?: FactorizationOptions; // Options for factorization
}

/**
 * Frequency response result interface
 */
export interface FrequencyResponse {
  frequencies: number[];  // Array of frequencies
  magnitude: number[];    // Magnitude response at each frequency
  phase: number[];        // Phase response at each frequency
  real: number[];         // Real part of response at each frequency
  imaginary: number[];    // Imaginary part of response at each frequency
}

/**
 * Validates that the input signal is a valid array of numbers
 * @param signal The signal to validate
 * @throws ZTransformError if the signal is invalid
 */
function validateSignal(signal: any): void {
  if (signal === null || signal === undefined) {
    throw new ZTransformError('Signal is null or undefined', 'INVALID_SIGNAL');
  }

  if (!Array.isArray(signal)) {
    throw new ZTransformError('Signal must be an array', 'INVALID_SIGNAL_TYPE');
  }

  if (signal.length === 0) {
    throw new ZTransformError('Signal cannot be empty', 'EMPTY_SIGNAL');
  }

  // Check if all elements are numbers
  for (let i = 0; i < signal.length; i++) {
    if (typeof signal[i] !== 'number') {
      throw new ZTransformError(
        `Signal element at index ${i} is not a number (type: ${typeof signal[i]})`, 
        'INVALID_SIGNAL_VALUE_TYPE'
      );
    }
    
    if (isNaN(signal[i])) {
      throw new ZTransformError(
        `Signal element at index ${i} is NaN`, 
        'INVALID_SIGNAL_VALUE_NAN'
      );
    }
    
    if (!isFinite(signal[i])) {
      throw new ZTransformError(
        `Signal element at index ${i} is not finite`, 
        'INVALID_SIGNAL_VALUE_INFINITE'
      );
    }
  }
}

/**
 * Validates that the Z-transform object has valid numerator and denominator
 * @param zTransform The Z-transform object to validate
 * @throws ZTransformError if the Z-transform is invalid
 */
function validateZTransform(zTransform: any): void {
  if (!zTransform) {
    throw new ZTransformError('Z-transform is null or undefined', 'INVALID_ZTRANSFORM');
  }

  if (typeof zTransform !== 'object') {
    throw new ZTransformError('Z-transform must be an object', 'INVALID_ZTRANSFORM_TYPE');
  }

  if (!zTransform.numerator) {
    throw new ZTransformError('Z-transform numerator is missing', 'MISSING_NUMERATOR');
  }

  if (!Array.isArray(zTransform.numerator)) {
    throw new ZTransformError('Z-transform numerator must be an array', 'INVALID_NUMERATOR_TYPE');
  }

  if (zTransform.numerator.length === 0) {
    throw new ZTransformError('Z-transform numerator cannot be empty', 'EMPTY_NUMERATOR');
  }

  // If denominator is provided, validate it
  if (zTransform.denominator !== undefined) {
    if (!Array.isArray(zTransform.denominator)) {
      throw new ZTransformError('Z-transform denominator must be an array', 'INVALID_DENOMINATOR_TYPE');
    }

    if (zTransform.denominator.length === 0) {
      throw new ZTransformError('Z-transform denominator cannot be empty', 'EMPTY_DENOMINATOR');
    }
    
    // Check for zero leading coefficient in denominator
    if (Math.abs(zTransform.denominator[0]) < 1e-10) {
      throw new ZTransformError('Denominator leading coefficient cannot be zero', 'ZERO_LEADING_COEFFICIENT');
    }
  }

  // Check for NaN or Infinity in coefficients
  for (let i = 0; i < zTransform.numerator.length; i++) {
    if (typeof zTransform.numerator[i] !== 'number') {
      throw new ZTransformError(`Numerator coefficient at index ${i} is not a number`, 'INVALID_COEFFICIENT_TYPE');
    }
    
    if (!isFinite(zTransform.numerator[i])) {
      throw new ZTransformError(`Numerator coefficient at index ${i} is not a finite number`, 'INVALID_COEFFICIENT');
    }
  }

  if (zTransform.denominator) {
    for (let i = 0; i < zTransform.denominator.length; i++) {
      if (typeof zTransform.denominator[i] !== 'number') {
        throw new ZTransformError(`Denominator coefficient at index ${i} is not a number`, 'INVALID_COEFFICIENT_TYPE');
      }
      
      if (!isFinite(zTransform.denominator[i])) {
        throw new ZTransformError(`Denominator coefficient at index ${i} is not a finite number`, 'INVALID_COEFFICIENT');
      }
    }
  }
}

/**
 * Validates options for Z-transform computation
 * @param options The options to validate
 * @throws ZTransformError if options are invalid
 */
function validateZTransformOptions(options: any): void {
  // Check if options is null or undefined
  if (!options) {
    return; // Empty options is valid, defaults will be used
  }
  
  if (typeof options !== 'object') {
    throw new ZTransformError('Options must be an object', 'INVALID_OPTIONS_TYPE');
  }

  // Validate limit option
  if (options.limit !== undefined) {
    if (typeof options.limit !== 'number') {
      throw new ZTransformError('Limit must be a number', 'INVALID_LIMIT_TYPE');
    }
    
    if (options.limit <= 0 || !Number.isInteger(options.limit)) {
      throw new ZTransformError('Limit must be a positive integer', 'INVALID_LIMIT');
    }
  }

  // Validate causal flag
  if (options.causal !== undefined && typeof options.causal !== 'boolean') {
    throw new ZTransformError('Causal flag must be a boolean', 'INVALID_CAUSAL_FLAG');
  }

  // Validate factorized flag
  if (options.factorized !== undefined && typeof options.factorized !== 'boolean') {
    throw new ZTransformError('Factorized flag must be a boolean', 'INVALID_FACTORIZED_FLAG');
  }
  
  // Validate signal type
  if (options.signalType !== undefined) {
    if (typeof options.signalType !== 'string' && 
        (typeof options.signalType !== 'object' || !options.signalType.type)) {
      throw new ZTransformError('Signal type must be a string or an object with a type property', 'INVALID_SIGNAL_TYPE');
    }
  }
  
  // Validate factorization options if provided
  if (options.factorizationOptions !== undefined) {
    if (typeof options.factorizationOptions !== 'object') {
      throw new ZTransformError('Factorization options must be an object', 'INVALID_FACTORIZATION_OPTIONS');
    }
  }
}

/**
 * Formats a Z-transform expression from numerator and denominator coefficients
 * @param numerator Numerator coefficients
 * @param denominator Denominator coefficients
 * @param causal Whether the sequence is causal
 * @param offset Offset for non-causal sequences
 * @returns Formatted expression string
 */
function formatZTransformExpression(
  numerator: number[],
  denominator: number[] = [1],
  causal: boolean = true,
  offset: number = 0
): string {
  // Helper function to format polynomial
  const formatPolynomial = (coeffs: number[], isNumerator: boolean) => {
    if (coeffs.length === 1) {
      return coeffs[0].toString();
    }

    let terms: string[] = [];
    for (let i = 0; i < coeffs.length; i++) {
      const coeff = coeffs[i];
      if (Math.abs(coeff) < 1e-10) continue;

      let power: number;
      if (causal) {
        power = -i;
      } else {
        power = -(i - offset);
      }

      // Format the coefficient and power
      if (i === 0) {
        terms.push(coeff.toString());
      } else if (power === 0) {
        terms.push(`${coeff > 0 ? '+' : '-'} ${Math.abs(coeff)}`);
      } else if (power === 1) {
        terms.push(`${coeff > 0 ? '+' : '-'} ${Math.abs(coeff)}z^{-1}`);
      } else {
        terms.push(`${coeff > 0 ? '+' : '-'} ${Math.abs(coeff)}z^{${power}}`);
      }
    }

    return terms.join(' ');
  };

  // Format numerator and denominator
  const numStr = formatPolynomial(numerator, true);
  const denomStr = formatPolynomial(denominator, false);

  // Combine into final expression
  if (denominator.length === 1 && Math.abs(denominator[0] - 1) < 1e-10) {
    return numStr;
  } else {
    return `(${numStr}) / (${denomStr})`;
  }
}

/**
 * Computes the Z-transform of a discrete-time signal
 * 
 * @param signal The discrete-time signal as an array of samples
 * @param options Z-transform computation options
 * @returns Z-transform result with numerator and denominator coefficients
 * @throws ZTransformError if input validation fails
 */
export function computeZTransform(
  signal: number[],
  options: ZTransformOptions = {}
): ZTransformResult {
  // Validate input signal
  validateSignal(signal);
  
  // Validate options
  validateZTransformOptions(options);
  
  const { 
    limit = signal.length, 
    causal = true, 
    factorized = false,
    signalType: explicitSignalType,
    factorizationOptions = {}
  } = options;
  
  // For causal signals, adjust the indexing
  // For standard signals where x[0], x[1], ... are provided, the z-transform is:
  // X(z) = x[0] + x[1]z^(-1) + x[2]z^(-2) + ...
  const offset = causal ? 0 : Math.floor(signal.length / 2);
  
  // Compute the terms of the Z-transform for the provided signal
  const numerator: number[] = [];
  
  // For finite signals, we only need to process up to the limit or signal length, whichever is smaller
  // This allows for truncation of very long or theoretically infinite sequences
  const termsToProcess = Math.min(limit, signal.length);
  
  for (let i = 0; i < termsToProcess; i++) {
    // For causal signals, the index directly corresponds to the power of z^(-i)
    // For non-causal signals, we center around 0 so negative indices exist
    const idx = causal ? i : i - offset;
    const signalIdx = causal ? i : Math.floor(signal.length / 2) + idx;
    
    // Only process if the index is valid for the signal array
    if (signalIdx >= 0 && signalIdx < signal.length) {
      // Ensure we have enough slots in the numerator array
      while (numerator.length <= i) {
        numerator.push(0);
      }
      numerator[i] = signal[signalIdx];
    }
  }
  
  // Check if numerator contains any non-zero coefficients
  if (numerator.every(coeff => Math.abs(coeff) < 1e-10)) {
    // Handle zero signal case
    return {
      numerator: [0],
      denominator: [1],
      expression: '0',
      roc: {
        type: 'ENTIRE_PLANE',
        includesZero: true,
        includesInfinity: true,
        description: 'All z (entire z-plane)'
      }
    };
  }
  
  // For basic Z-transform, the denominator is just [1] (representing 1 in the denominator)
  const denominator = [1];
  
  // Determine the region of convergence based on signal characteristics
  // If explicit signalType is provided, use it for ROC determination
  const signalType = explicitSignalType || analyzeSignal(signal);
  
  // Get the ROC based on the signal type and poles
  let roc: ROC;
  
  if (factorized) {
    // Get poles from factorization if requested
    const factorizationResult = factorizeZTransform(numerator, denominator, factorizationOptions);
    const poles = factorizationResult.poles;
    
    // Determine ROC based on poles and signal type
    roc = determineROC(poles, { signalType: typeof signalType === 'string' ? signalType : signalType.type });
    
    // Format expression and return the full factorized result
    const expression = formatZTransformExpression(numerator, denominator, causal, offset);
    
    return {
      numerator,
      denominator,
      roc,
      expression,
      zeros: factorizationResult.zeros,
      poles: factorizationResult.poles,
      gain: factorizationResult.gain
    };
  } else {
    // For non-factorized case, determine ROC based on signal characteristics
    try {
      // Try to factorize the denominator to find poles for ROC
      const factorizationResult = factorizeZTransform(numerator, denominator, factorizationOptions);
      
      // Use the poles to determine ROC
      roc = determineROC(factorizationResult.poles, { 
        signalType: typeof signalType === 'string' ? signalType : signalType.type 
      });
    } catch (error) {
      // If factorization fails, use signal properties to determine a reasonable ROC
      roc = {
        type: causal ? 'OUTSIDE_CIRCLE' : 'ANNULAR',
        outerRadius: Infinity,
        innerRadius: 1,
        includesZero: false,
        includesInfinity: causal,
        description: causal ? '|z| > 1' : '|z| = 1'
      };
    }
  }
  
  // Format the expression and return the result
  const expression = formatZTransformExpression(numerator, denominator, causal, offset);
  
  return {
    numerator,
    denominator,
    roc,
    expression
  };
}

/**
 * Computes the inverse Z-transform to recover a discrete-time signal
 * 
 * @param zTransform The Z-transform representation (numerator and denominator)
 * @param length The length of the output signal to generate
 * @param options Additional options for inverse computation
 * @returns The reconstructed discrete-time signal
 * @throws ZTransformError if input validation fails
 */
export function computeInverseZTransform(
  zTransform: ZTransformResult | { numerator: number[], denominator?: number[] },
  length: number,
  options: { causal?: boolean, offset?: number } = {}
): number[] {
  // Validate Z-transform input
  validateZTransform(zTransform);

  // Validate length parameter
  if (!Number.isInteger(length) || length <= 0) {
    throw new ZTransformError('Length must be a positive integer', 'INVALID_LENGTH');
  }

  const { causal = true, offset = 0 } = options;
  
  // Extract numerator and denominator
  const numerator = zTransform.numerator;
  const denominator = zTransform.denominator || [1];

  // For simple case where denominator is [1], the inverse is just the numerator coefficients
  if (denominator.length === 1 && Math.abs(denominator[0] - 1) < 1e-10) {
    // Pad or truncate to the requested length
    const result = new Array(length).fill(0);
    for (let i = 0; i < Math.min(numerator.length, length); i++) {
      result[i] = numerator[i];
    }
    return result;
  }

  // For more complex cases, use long division or partial fraction expansion
  // Here we'll implement long division which is more numerically stable for this purpose
  const result = new Array(length).fill(0);
  
  // Normalize the denominator
  const normalizedDenominator = [...denominator];
  const leadingCoeff = normalizedDenominator[0];
  for (let i = 0; i < normalizedDenominator.length; i++) {
    normalizedDenominator[i] /= leadingCoeff;
  }
  
  // Adjust numerator as well
  const normalizedNumerator = numerator.map(c => c / leadingCoeff);
  
  // Perform long division to get the time-domain samples
  for (let n = 0; n < length; n++) {
    // Start with the current numerator term
    let sample = n < normalizedNumerator.length ? normalizedNumerator[n] : 0;
    
    // Subtract the contribution from previous samples
    for (let k = 1; k < normalizedDenominator.length && k <= n; k++) {
      sample -= normalizedDenominator[k] * result[n - k];
    }
    
    result[n] = sample;
  }
  
  // Adjust for non-causal signals if needed
  if (!causal && offset !== 0) {
    // Shift the signal by the offset
    const shiftedResult = new Array(length).fill(0);
    for (let i = 0; i < length; i++) {
      const sourceIdx = i - offset;
      if (sourceIdx >= 0 && sourceIdx < length) {
        shiftedResult[i] = result[sourceIdx];
      }
    }
    return shiftedResult;
  }
  
  return result;
}

/**
 * Multiplies two Z-transforms together
 * 
 * @param zt1 First Z-transform
 * @param zt2 Second Z-transform
 * @returns The product Z-transform
 */
export function multiplyZTransforms(
  zt1: ZTransformResult,
  zt2: ZTransformResult
): ZTransformResult {
  // Validate inputs
  validateZTransform(zt1);
  validateZTransform(zt2);
  
  // Multiply numerators using convolution
  const newNumerator = convolve(zt1.numerator, zt2.numerator);
  
  // Multiply denominators using convolution
  const newDenominator = convolve(zt1.denominator || [1], zt2.denominator || [1]);
  
  // Generate a new expression
  const expression = formatZTransformExpression(newNumerator, newDenominator);
  
  // Default ROC for the entire plane if ROC is missing
  const defaultROC: ROC = {
    type: 'ENTIRE_PLANE',
    includesZero: true, 
    includesInfinity: true,
    description: 'All z (entire z-plane)'
  };
  
  // Determine the combined ROC using the enhanced calculator
  const roc = combineROCs(
    zt1.roc || defaultROC,
    zt2.roc || defaultROC,
    ROCOperation.MULTIPLY
  );
  
  return {
    numerator: newNumerator,
    denominator: newDenominator,
    expression,
    roc
  };
}

/**
 * Time-shifts a Z-transform
 * 
 * @param zt Z-transform to shift
 * @param delay Delay in samples (positive = right shift, negative = left shift)
 * @returns The shifted Z-transform
 */
export function timeShiftZTransform(
  zt: ZTransformResult,
  delay: number
): ZTransformResult {
  // Validate input
  validateZTransform(zt);
  
  if (!Number.isInteger(delay)) {
    throw new ZTransformError('Delay must be an integer', 'INVALID_DELAY');
  }
  
  // Extract numerator and denominator
  const numerator = [...zt.numerator];
  const denominator = zt.denominator ? [...zt.denominator] : [1];
  
  let shiftedNumerator: number[];
  
  if (delay > 0) {
    // Right shift (delay) - multiply by z^(-delay)
    // We prepend delay zeros to the numerator
    shiftedNumerator = Array(delay).fill(0).concat(numerator);
  } else if (delay < 0) {
    // Left shift (advance) - multiply by z^(|delay|)
    // We remove the first |delay| elements from the numerator
    if (Math.abs(delay) >= numerator.length) {
      throw new ZTransformError(
        'Cannot advance Z-transform by more than the number of numerator coefficients',
        'INVALID_ADVANCE'
      );
    }
    shiftedNumerator = numerator.slice(Math.abs(delay));
  } else {
    // No shift
    shiftedNumerator = numerator;
  }
  
  // Generate expression for the shifted transform
  const expression = formatZTransformExpression(shiftedNumerator, denominator);
  
  // ROC generally remains the same for time shifts, but for precision,
  // we could refine this based on specific shift patterns if needed
  return {
    numerator: shiftedNumerator,
    denominator,
    expression,
    roc: zt.roc
  };
}

/**
 * Calculates the frequency response of a Z-transform
 * 
 * @param zt Z-transform to analyze
 * @param points Number of frequency points to calculate (default: 1000)
 * @returns Frequency response data
 */
export function calculateFrequencyResponse(
  zt: ZTransformResult,
  points: number = 1000
): FrequencyResponse {
  // Validate input
  validateZTransform(zt);
  
  if (!Number.isInteger(points) || points <= 0) {
    throw new ZTransformError('Number of points must be a positive integer', 'INVALID_POINTS');
  }
  
  // Extract numerator and denominator
  const numerator = zt.numerator;
  const denominator = zt.denominator || [1];
  
  // Create frequency array (normalized from 0 to π)
  const frequencies = Array(points).fill(0).map((_, i) => (i * Math.PI) / (points - 1));
  
  // Calculate response at each frequency
  const magnitude: number[] = [];
  const phase: number[] = [];
  const real: number[] = [];
  const imaginary: number[] = [];
  
  for (const omega of frequencies) {
    // z = e^(jω) for the unit circle
    const z: Complex = {
      re: Math.cos(omega),
      im: Math.sin(omega)
    };
    
    // Evaluate numerator and denominator at z
    const numResponse = evaluatePolynomial(numerator, z);
    const denomResponse = evaluatePolynomial(denominator, z);
    
    // Calculate H(e^jω) = numerator(e^jω) / denominator(e^jω)
    let responseRe: number, responseIm: number;
    
    // Protect against division by very small numbers
    const denomMagnitude = complexMagnitude(denomResponse);
    if (denomMagnitude < 1e-10) {
      responseRe = NaN;
      responseIm = NaN;
    } else {
      // Complex division: (a+bi)/(c+di) = (ac+bd)/(c²+d²) + (bc-ad)/(c²+d²)i
      const denom = denomResponse.re * denomResponse.re + denomResponse.im * denomResponse.im;
      responseRe = (numResponse.re * denomResponse.re + numResponse.im * denomResponse.im) / denom;
      responseIm = (numResponse.im * denomResponse.re - numResponse.re * denomResponse.im) / denom;
    }
    
    // Calculate magnitude and phase
    const mag = Math.sqrt(responseRe * responseRe + responseIm * responseIm);
    let phi = Math.atan2(responseIm, responseRe);
    
    // Unwrap phase to avoid discontinuities
    if (phase.length > 0) {
      const lastPhi = phase[phase.length - 1];
      while (phi - lastPhi > Math.PI) phi -= 2 * Math.PI;
      while (phi - lastPhi < -Math.PI) phi += 2 * Math.PI;
    }
    
    magnitude.push(mag);
    phase.push(phi);
    real.push(responseRe);
    imaginary.push(responseIm);
  }
  
  return {
    frequencies,
    magnitude,
    phase,
    real,
    imaginary
  };
}

/**
 * Convolve two arrays (polynomial multiplication)
 * 
 * @param a First array
 * @param b Second array
 * @returns Convolution result
 */
function convolve(a: number[], b: number[]): number[] {
  const result = new Array(a.length + b.length - 1).fill(0);
  
  for (let i = 0; i < a.length; i++) {
    for (let j = 0; j < b.length; j++) {
      result[i + j] += a[i] * b[j];
    }
  }
  
  return result;
}

/**
 * Apply Z-transform to common sequences
 * Returns the Z-transform of common discrete-time sequences
 * @param type The type of sequence to transform
 * @param params Parameters for the sequence
 */
export function getCommonZTransform(
  type: 'unit_impulse' | 'unit_step' | 'exponential' | 'sine' | 'cosine',
  params: { a?: number, omega?: number, phi?: number, delay?: number } = {}
): ZTransformResult {
  const { a = 0.5, omega = Math.PI/4, phi = 0, delay = 0 } = params;
  
  // Create basic response, then apply delay if needed
  let result: ZTransformResult;
  
  switch (type) {
    case 'unit_impulse': {
      // δ[n] = 1 for n=0, 0 otherwise
      // Z-transform: 1
      result = {
        numerator: [1],
        denominator: [1],
        expression: '1',
        roc: {
          type: 'ENTIRE_PLANE',
          includesZero: true,
          includesInfinity: true,
          description: 'All z (entire z-plane)'
        }
      };
      break;
    }
    
    case 'unit_step': {
      // u[n] = 1 for n>=0, 0 otherwise
      // Z-transform: 1/(1-z^(-1)) for |z| > 1
      result = {
        numerator: [1],
        denominator: [1, -1],
        expression: '\\frac{1}{1 - z^{-1}}',
        roc: {
          type: 'OUTSIDE_CIRCLE',
          outerRadius: Infinity,
          innerRadius: 1,
          includesZero: false,
          includesInfinity: true,
          description: '|z| > 1'
        }
      };
      break;
    }
    
    case 'exponential': {
      // a^n * u[n]
      // Z-transform: 1/(1-a*z^(-1)) for |z| > |a|
      result = {
        numerator: [1],
        denominator: [1, -a],
        expression: `\\frac{1}{1 - ${a}z^{-1}}`,
        roc: {
          type: 'OUTSIDE_CIRCLE',
          outerRadius: Infinity,
          innerRadius: Math.abs(a),
          includesZero: false,
          includesInfinity: true,
          description: `|z| > ${Math.abs(a)}`
        }
      };
      break;
    }
    
    case 'sine': {
      // sin(omega*n + phi) * u[n]
      result = {
        numerator: [0, Math.sin(phi)],
        denominator: [1, -2 * Math.cos(omega), 1],
        expression: `\\frac{${Math.sin(phi)}z^{-1}}{1 - 2\\cos(${omega})z^{-1} + z^{-2}}`,
        roc: {
          type: 'OUTSIDE_CIRCLE',
          outerRadius: Infinity,
          innerRadius: 1,
          includesZero: false,
          includesInfinity: true,
          description: '|z| > 1'
        }
      };
      break;
    }
    
    case 'cosine': {
      // cos(omega*n + phi) * u[n]
      result = {
        numerator: [Math.cos(phi), -Math.cos(phi + omega)],
        denominator: [1, -2 * Math.cos(omega), 1],
        expression: `\\frac{${Math.cos(phi)} - ${Math.cos(phi + omega)}z^{-1}}{1 - 2\\cos(${omega})z^{-1} + z^{-2}}`,
        roc: {
          type: 'OUTSIDE_CIRCLE',
          outerRadius: Infinity,
          innerRadius: 1,
          includesZero: false,
          includesInfinity: true,
          description: '|z| > 1'
        }
      };
      break;
    }
    
    default:
      throw new ZTransformError(`Unknown sequence type: ${type}`, 'INVALID_SEQUENCE_TYPE');
  }
  
  // Apply delay if needed
  if (delay !== 0) {
    result = timeShiftZTransform(result, delay);
  }
  
  return result;
} 