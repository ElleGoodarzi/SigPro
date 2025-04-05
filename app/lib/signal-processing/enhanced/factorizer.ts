/**
 * Enhanced polynomial factorization module for Z-transforms
 * Uses the improved root finding algorithms for better accuracy and numerical stability
 */

import { Complex } from './numerical-utils';
import { findRoots, RootFindingOptions } from './root-finder';
import { determineROC, SignalType, ROC, analyzeSignal, inferSignalType } from './roc-calculator';

/**
 * Result of Z-transform factorization
 */
export interface FactorizationResult {
  zeros: Complex[];          // Zeros of the Z-transform
  poles: Complex[];          // Poles of the Z-transform
  gain: number;              // Gain factor
  expression: string;        // Human-readable factorized expression
  roc: ROC;                  // Region of convergence
}

/**
 * Options for Z-transform factorization
 */
export interface FactorizationOptions {
  /** Root finding options for zeros and poles */
  rootFindingOptions?: RootFindingOptions;
  
  /** Signal type for ROC determination */
  signalType?: SignalType;
  
  /** Original signal for automatic signal type inference */
  originalSignal?: number[];
  
  /** Whether to generate a formatted expression */
  generateExpression?: boolean;
}

/**
 * Factorize a Z-transform into zeros, poles, and gain
 * 
 * @param numerator Numerator coefficients
 * @param denominator Denominator coefficients (default: [1])
 * @param options Factorization options
 * @returns Factorization result
 */
export function factorizeZTransform(
  numerator: number[],
  denominator: number[] = [1],
  options: FactorizationOptions = {}
): FactorizationResult {
  const {
    rootFindingOptions = {},
    signalType: explicitSignalType,
    originalSignal,
    generateExpression = true
  } = options;
  
  // Validate inputs
  if (!numerator || !Array.isArray(numerator) || numerator.length === 0) {
    throw new Error('Invalid numerator: must be a non-empty array');
  }
  
  if (!denominator || !Array.isArray(denominator) || denominator.length === 0) {
    throw new Error('Invalid denominator: must be a non-empty array');
  }
  
  try {
    // Find roots of numerator (zeros)
    const zeros = findRoots(numerator, rootFindingOptions);
    
    // Find roots of denominator (poles)
    const poles = findRoots(denominator, rootFindingOptions);
    
    // Calculate gain factor (ratio of leading coefficients)
    const gain = numerator[0] / denominator[0];
    
    // Determine signal type for ROC calculation
    let signalType: SignalType;
    
    if (explicitSignalType) {
      // Use explicitly provided signal type
      signalType = explicitSignalType;
    } else if (originalSignal && originalSignal.length > 0) {
      // Analyze the original signal to determine its type
      const analysis = analyzeSignal(originalSignal);
      signalType = analysis.type;
    } else {
      // Infer from pole locations
      signalType = inferSignalType(poles);
    }
    
    // Calculate ROC
    const roc = determineROC(poles, { signalType });
    
    // Generate factorized expression if requested
    const expression = generateExpression 
      ? formatFactorizedExpression(zeros, poles, gain) 
      : "";
    
    return {
      zeros,
      poles,
      gain,
      expression,
      roc
    };
  } catch (error) {
    // Make sure errors are properly propagated
    if (error instanceof Error) {
      throw new Error(`Factorization failed: ${error.message}`);
    } else {
      throw new Error('Factorization failed with unknown error');
    }
  }
}

/**
 * Format a factorized Z-transform into a human-readable expression
 * 
 * @param zeros Array of zeros
 * @param poles Array of poles
 * @param gain Gain factor
 * @returns Formatted expression string
 */
export function formatFactorizedExpression(
  zeros: Complex[],
  poles: Complex[],
  gain: number
): string {
  // Helper function to format a complex number
  const formatComplex = (c: Complex): string => {
    const hasReal = Math.abs(c.re) > 1e-10;
    const hasImag = Math.abs(c.im) > 1e-10;
    
    if (hasReal && hasImag) {
      return `(${c.re.toFixed(4)} ${c.im >= 0 ? '+' : ''}${c.im.toFixed(4)}j)`;
    } else if (hasReal) {
      return c.re.toFixed(4);
    } else if (hasImag) {
      return `(${c.im.toFixed(4)}j)`;
    } else {
      return '0';
    }
  };
  
  // Helper function to format a factor (z - root)
  const formatFactor = (root: Complex, inverse: boolean = false): string => {
    // For z-domain convention, we typically use z⁻¹ for factors in the denominator
    const variable = inverse ? 'z⁻¹' : 'z';
    
    // Check if root is close to zero
    if (Math.abs(root.re) < 1e-10 && Math.abs(root.im) < 1e-10) {
      return variable; // Just 'z' or 'z⁻¹' for root at origin
    }
    
    // For real roots
    if (Math.abs(root.im) < 1e-10) {
      return `(${variable} ${root.re >= 0 ? '-' : '+'} ${Math.abs(root.re).toFixed(4)})`;
    }
    
    // For complex roots
    return `(${variable}² ${root.re >= 0 ? '-' : '+'} ${Math.abs(2 * root.re).toFixed(4)}${variable} + ${(root.re * root.re + root.im * root.im).toFixed(4)})`;
  };
  
  // Group complex conjugate pairs for more compact representation
  const groupComplexPairs = (roots: Complex[]): (Complex | Complex[])[] => {
    const result: (Complex | Complex[])[] = [];
    const used = new Array(roots.length).fill(false);
    
    for (let i = 0; i < roots.length; i++) {
      if (used[i]) continue;
      
      const root = roots[i];
      used[i] = true;
      
      // Look for complex conjugate pair
      if (Math.abs(root.im) > 1e-10) {
        let foundConjugate = false;
        
        for (let j = i + 1; j < roots.length; j++) {
          if (!used[j] && 
              Math.abs(roots[j].re - root.re) < 1e-10 && 
              Math.abs(roots[j].im + root.im) < 1e-10) {
            // Found conjugate pair
            used[j] = true;
            foundConjugate = true;
            result.push([root, roots[j]]);
            break;
          }
        }
        
        if (!foundConjugate) {
          result.push(root);
        }
      } else {
        result.push(root);
      }
    }
    
    return result;
  };
  
  // Build the expression
  let expression = "";
  
  // Add gain factor if not 1
  if (Math.abs(gain - 1) > 1e-10) {
    expression += gain.toFixed(4) + " ";
  }
  
  // Group complex zeros and poles
  const groupedZeros = groupComplexPairs(zeros);
  const groupedPoles = groupComplexPairs(poles);
  
  // Add numerator factors
  if (groupedZeros.length > 0) {
    expression += "· ";
    
    for (const item of groupedZeros) {
      if (Array.isArray(item)) {
        // Complex conjugate pair
        const root = item[0];
        expression += formatFactor(root, false) + " ";
      } else {
        // Single root
        expression += formatFactor(item, false) + " ";
      }
    }
  }
  
  // Add denominator factors
  if (groupedPoles.length > 0) {
    expression += "/ ";
    
    for (const item of groupedPoles) {
      if (Array.isArray(item)) {
        // Complex conjugate pair
        const root = item[0];
        expression += formatFactor(root, true) + " ";
      } else {
        // Single root
        expression += formatFactor(item, true) + " ";
      }
    }
  }
  
  return expression.trim();
}