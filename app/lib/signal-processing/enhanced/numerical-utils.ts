/**
 * Enhanced numerical utilities for Z-transform calculations
 * These utilities provide improved numerical stability for root finding and other operations
 */

/**
 * Complex number interface for polynomial roots
 */
export interface Complex {
  re: number;  // Real part
  im: number;  // Imaginary part
}

/**
 * Creates a complex number
 * @param re Real part
 * @param im Imaginary part
 * @returns Complex number object
 */
export function complex(re: number, im: number): Complex {
  return { re, im };
}

/**
 * Adds two complex numbers
 * @param a First complex number
 * @param b Second complex number
 * @returns Sum of the complex numbers
 */
export function complexAdd(a: Complex, b: Complex): Complex {
  return {
    re: a.re + b.re,
    im: a.im + b.im
  };
}

/**
 * Subtracts two complex numbers
 * @param a First complex number
 * @param b Second complex number
 * @returns Difference of the complex numbers (a - b)
 */
export function complexSubtract(a: Complex, b: Complex): Complex {
  return {
    re: a.re - b.re,
    im: a.im - b.im
  };
}

/**
 * Multiplies two complex numbers
 * @param a First complex number
 * @param b Second complex number
 * @returns Product of the complex numbers
 */
export function complexMultiply(a: Complex, b: Complex): Complex {
  return {
    re: a.re * b.re - a.im * b.im,
    im: a.re * b.im + a.im * b.re
  };
}

/**
 * Divides two complex numbers
 * @param a First complex number (numerator)
 * @param b Second complex number (denominator)
 * @returns Quotient of the complex numbers (a / b)
 */
export function complexDivide(a: Complex, b: Complex): Complex {
  const denominator = b.re * b.re + b.im * b.im;
  
  if (Math.abs(denominator) < 1e-15) {
    throw new Error('Division by zero or near-zero complex number');
  }
  
  return {
    re: (a.re * b.re + a.im * b.im) / denominator,
    im: (a.im * b.re - a.re * b.im) / denominator
  };
}

/**
 * Scales a complex number by a real factor
 * @param z Complex number
 * @param factor Real scaling factor
 * @returns Scaled complex number
 */
export function complexScale(z: Complex, factor: number): Complex {
  return {
    re: z.re * factor,
    im: z.im * factor
  };
}

/**
 * Computes the reciprocal of a complex number
 * @param z Complex number
 * @returns Reciprocal (1/z)
 */
export function complexReciprocal(z: Complex): Complex {
  const denominator = z.re * z.re + z.im * z.im;
  
  if (Math.abs(denominator) < 1e-15) {
    throw new Error('Reciprocal of zero or near-zero complex number');
  }
  
  return {
    re: z.re / denominator,
    im: -z.im / denominator
  };
}

/**
 * Calculates the magnitude (absolute value) of a complex number
 * @param z Complex number
 * @returns Magnitude |z|
 */
export function complexMagnitude(z: Complex): number {
  // Use hypot for better numerical stability with very large or small numbers
  return Math.hypot(z.re, z.im);
}

/**
 * Calculates the squared magnitude of a complex number
 * Useful for comparisons to avoid square root calculations
 * @param z Complex number
 * @returns Squared magnitude |z|²
 */
export function complexMagnitudeSquared(z: Complex): number {
  return z.re * z.re + z.im * z.im;
}

/**
 * Calculates the phase (argument) of a complex number
 * @param z Complex number
 * @returns Phase in radians
 */
export function complexPhase(z: Complex): number {
  return Math.atan2(z.im, z.re);
}

/**
 * Scale polynomial coefficients to improve numerical stability
 * @param coeffs Polynomial coefficients
 * @returns Scaled coefficients
 */
export function scaleCoefficients(coeffs: number[]): number[] {
  // Find the largest coefficient magnitude
  let maxMagnitude = 0;
  for (const coeff of coeffs) {
    maxMagnitude = Math.max(maxMagnitude, Math.abs(coeff));
  }
  
  // If all coefficients are zero or very close to zero, return as is
  if (maxMagnitude < 1e-10) return [...coeffs];
  
  // Scale coefficients to prevent overflow/underflow
  const scaleFactor = 1.0 / maxMagnitude;
  return coeffs.map(c => c * scaleFactor);
}

/**
 * Evaluate a polynomial at a complex point using Horner's method
 * @param coeffs Polynomial coefficients [a0, a1, a2, ...]
 * @param z Complex value at which to evaluate
 * @returns Complex result of evaluation
 */
export function evaluatePolynomial(coeffs: number[], z: Complex): Complex {
  let result: Complex = { re: 0, im: 0 };
  
  // Use Horner's method for numerical stability
  for (let i = 0; i < coeffs.length; i++) {
    // result = result * z + coefficients[i]
    result = complexAdd(complexMultiply(result, z), { re: coeffs[i], im: 0 });
  }
  
  return result;
}

/**
 * Computes the derivative of a polynomial
 * @param coeffs Polynomial coefficients [a0, a1, a2, ...]
 * @returns Coefficients of the derivative polynomial
 */
export function derivePolynomial(coeffs: number[]): number[] {
  if (coeffs.length <= 1) {
    return [0]; // Derivative of constant is zero
  }
  
  const derivative: number[] = [];
  for (let i = 1; i < coeffs.length; i++) {
    derivative.push(i * coeffs[i]);
  }
  
  return derivative;
}

/**
 * Evaluates a polynomial and its derivative at a complex point
 * More efficient than separate evaluations
 * @param coeffs Polynomial coefficients
 * @param z Complex value at which to evaluate
 * @returns Object with polynomial value and derivative value
 */
export function evaluatePolynomialAndDerivative(
  coeffs: number[], 
  z: Complex
): { value: Complex, derivative: Complex } {
  let value: Complex = { re: 0, im: 0 };
  let derivative: Complex = { re: 0, im: 0 };
  
  // Use Horner's method for both evaluations simultaneously
  for (let i = 0; i < coeffs.length; i++) {
    // Derivative update: derivative = derivative * z + value
    derivative = complexAdd(complexMultiply(derivative, z), value);
    
    // Value update: value = value * z + coeffs[i]
    value = complexAdd(complexMultiply(value, z), { re: coeffs[i], im: 0 });
  }
  
  return { value, derivative };
}

/**
 * Performs synthetic division of a polynomial by (x - root)
 * @param coeffs Polynomial coefficients [a0, a1, a2, ...]
 * @param root Complex root to divide by
 * @returns Coefficients of the quotient polynomial
 */
export function syntheticDivision(coeffs: number[], root: Complex): number[] {
  if (coeffs.length <= 1) {
    return [0]; // Division of constant results in zero
  }
  
  const n = coeffs.length;
  const result = new Array(n - 1).fill(0);
  
  // Apply synthetic division with compensated summation for better accuracy
  result[0] = coeffs[0];
  for (let i = 1; i < n - 1; i++) {
    result[i] = coeffs[i] + result[i-1] * root.re;
    
    // If root has imaginary part, add the imaginary contribution
    if (Math.abs(root.im) > 1e-15) {
      result[i] += result[i-1] * root.im * Complex.I.re;
    }
  }
  
  // Rescale after deflation to prevent magnification of errors
  return scaleCoefficients(result);
}

/**
 * Creates a polynomial evaluator function for a given set of coefficients
 * @param coeffs Polynomial coefficients
 * @returns Function that evaluates the polynomial at a complex point
 */
export function createPolynomialEvaluator(coeffs: number[]) {
  return function(z: Complex): Complex {
    return evaluatePolynomial(coeffs, z);
  };
}

/**
 * Creates a derivative evaluator function for a given polynomial
 * @param coeffs Polynomial coefficients
 * @returns Function that evaluates the derivative at a complex point
 */
export function createDerivativeEvaluator(coeffs: number[]) {
  const derivCoeffs = derivePolynomial(coeffs);
  return function(z: Complex): Complex {
    return evaluatePolynomial(derivCoeffs, z);
  };
}

/**
 * Constant definitions for frequently used complex values
 */
export namespace Complex {
  /** Complex number i (imaginary unit) */
  export const I: Complex = { re: 0, im: 1 };
  
  /** Complex zero */
  export const ZERO: Complex = { re: 0, im: 0 };
  
  /** Complex one */
  export const ONE: Complex = { re: 1, im: 0 };
}

/**
 * Verifies if the computed roots accurately solve the polynomial
 * @param coefficients Polynomial coefficients
 * @param roots The computed roots to verify
 * @param tolerance Error tolerance (default: 1e-8)
 * @returns true if all roots are accurate within tolerance
 */
export function verifyRoots(coefficients: number[], roots: Complex[], tolerance: number = 1e-8): boolean {
  if (coefficients.length <= 1) {
    // Constant polynomial has no roots to verify
    return true;
  }
  
  let allRootsAccurate = true;
  const errorDetails: { root: Complex, error: number, relativeError: number }[] = [];
  
  for (let i = 0; i < roots.length; i++) {
    const root = roots[i];
    
    // Evaluate the polynomial at the root
    let value = evaluatePolynomial(coefficients, root);
    const error = complexMagnitude(value);
    
    // Calculate a relative error based on the magnitude of the root and coefficients
    const rootMagnitude = complexMagnitude(root);
    const leadingCoeff = Math.abs(coefficients[0]);
    const relativeError = error / (rootMagnitude * leadingCoeff + 1e-15);
    
    // Check if the magnitude is within tolerance
    if (error > tolerance) {
      allRootsAccurate = false;
      errorDetails.push({ root, error, relativeError });
    }
  }
  
  // Provide detailed diagnostics for inaccurate roots
  if (!allRootsAccurate) {
    console.warn(`Root verification failed. ${errorDetails.length} roots exceed the error tolerance.`);
    
    // Sort errors from largest to smallest
    errorDetails.sort((a, b) => b.error - a.error);
    
    // Report the most inaccurate roots (up to 3)
    const reportLimit = Math.min(3, errorDetails.length);
    for (let i = 0; i < reportLimit; i++) {
      const { root, error, relativeError } = errorDetails[i];
      console.warn(
        `Root ${i+1}: z = ${root.re.toFixed(6)} + ${root.im.toFixed(6)}i, ` +
        `absolute error = ${error.toExponential(4)}, ` +
        `relative error = ${relativeError.toExponential(4)}`
      );
    }
    
    // Suggest possible causes of inaccuracy
    if (roots.length > 15) {
      console.warn("High-degree polynomials (degree > 15) can suffer from numerical instability.");
    }
    
    // Check for potentially clustered roots
    let minDistance = Infinity;
    let closestPair = [-1, -1];
    
    for (let i = 0; i < roots.length; i++) {
      for (let j = i + 1; j < roots.length; j++) {
        const distance = complexMagnitude(complexSubtract(roots[i], roots[j]));
        if (distance < minDistance) {
          minDistance = distance;
          closestPair = [i, j];
        }
      }
    }
    
    if (minDistance < 1e-3) {
      const [i, j] = closestPair;
      console.warn(
        `Closely spaced roots detected: distance = ${minDistance.toExponential(4)} between ` +
        `z₁ = ${roots[i].re.toFixed(6)} + ${roots[i].im.toFixed(6)}i and ` +
        `z₂ = ${roots[j].re.toFixed(6)} + ${roots[j].im.toFixed(6)}i`
      );
      console.warn("Closely spaced roots can cause difficulties in accurate root finding.");
    }
  }
  
  return allRootsAccurate;
} 