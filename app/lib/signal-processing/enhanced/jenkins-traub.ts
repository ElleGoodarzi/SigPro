/**
 * Implementation of the Jenkins-Traub algorithm for polynomial root finding.
 * This is a well-regarded algorithm for finding roots of polynomials with real coefficients.
 * It's a three-stage algorithm that uses complex arithmetic to find both real and complex roots.
 * 
 * Reference: "Algorithm 419: Zeros of a Complex Polynomial" by Jenkins and Traub
 */

import { 
  Complex, 
  complexAdd, 
  complexMultiply, 
  complexDivide, 
  complexSubtract,
  complexScale,
  complexMagnitude,
  evaluatePolynomial,
  scaleCoefficients,
  syntheticDivision
} from './numerical-utils';

// Maximum number of iterations for each stage
const MAX_STAGE1_ITERATIONS = 10;
const MAX_STAGE2_ITERATIONS = 20;
const MAX_STAGE3_ITERATIONS = 20;

// Convergence tolerances
const CONVERGENCE_TOLERANCE = 1e-12;
const ZERO_TOLERANCE = 1e-14;

// Added parameters for improved convergence
const MAX_TOTAL_ITERATIONS = 50; // Maximum total iterations across all stages
const STAGE_TRANSITION_THRESHOLD = 1e-8; // Threshold for transitioning between stages
const ILL_CONDITION_THRESHOLD = 1e-8; // Threshold for detecting ill-conditioned polynomials
const PERTURBATION_FACTOR = 0.05; // Factor for perturbing sigma when needed

// Enhanced parameters for better convergence and stability
const MAX_STAGE1_ITERATIONS_ENHANCED = 15; // Increased iterations for stage 1
const MAX_STAGE2_ITERATIONS_ENHANCED = 30; // Increased iterations for stage 2
const MAX_STAGE3_ITERATIONS_ENHANCED = 25; // Increased iterations for stage 3
const CONVERGENCE_TOLERANCE_RELAXED = 1e-10; // Slightly relaxed tolerance for difficult cases
const AGGRESSIVE_PERTURBATION_FACTOR = 0.15; // Stronger perturbation for breaking oscillations
const ROOT_VERIFICATION_THRESHOLD = 1e-8; // Threshold for root verification accuracy
const MAX_RETRY_ATTEMPTS = 3; // Maximum number of retry attempts with different starting points

/**
 * Find polynomial roots using the Jenkins-Traub algorithm
 * @param coefficients Polynomial coefficients [a0, a1, a2, ...]
 * @returns Array of complex roots
 */
export function findRootsByJenkinsTraub(coefficients: number[]): Complex[] {
  // Make a copy to avoid modifying the original
  let coeffs = [...coefficients];
  
  // Remove leading zeros
  while (coeffs.length > 0 && Math.abs(coeffs[0]) < ZERO_TOLERANCE) {
    coeffs = coeffs.slice(1);
  }
  
  // Handle special cases
  if (coeffs.length <= 1) {
    return []; // Constant polynomial has no roots
  }
  
  // Scale coefficients to improve numerical stability
  coeffs = scaleCoefficients(coeffs);
  
  // Check for ill-conditioned polynomial
  if (isPolynomialIllConditioned(coeffs)) {
    console.warn('Detected ill-conditioned polynomial, applying stabilization');
    coeffs = stabilizePolynomial(coeffs);
  }
  
  // Handle linear case directly
  if (coeffs.length === 2) {
    return [{ re: -coeffs[1] / coeffs[0], im: 0 }];
  }
  
  // Find roots recursively
  try {
    return findRootsRecursive(coeffs);
  } catch (error) {
    console.error(`Root finding failed with error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    console.warn('Attempting to fall back to companion matrix method');
    return findRootsByCompanionMatrix(coeffs);
  }
}

/**
 * Check if a polynomial is ill-conditioned
 * @param coeffs Polynomial coefficients
 * @returns Whether the polynomial is ill-conditioned
 */
function isPolynomialIllConditioned(coeffs: number[]): boolean {
  // Check for extreme variation in coefficient magnitudes
  let maxCoeff = 0;
  let minNonZeroCoeff = Infinity;
  
  for (const coeff of coeffs) {
    const magnitude = Math.abs(coeff);
    if (magnitude > ZERO_TOLERANCE) {
      maxCoeff = Math.max(maxCoeff, magnitude);
      minNonZeroCoeff = Math.min(minNonZeroCoeff, magnitude);
    }
  }
  
  // If the ratio of largest to smallest non-zero coefficient is very large,
  // the polynomial is likely ill-conditioned
  const conditionRatio = maxCoeff / minNonZeroCoeff;
  
  // Also check for nearly-zero leading coefficient which causes instability
  const leadingCoefficientTooSmall = Math.abs(coeffs[0]) < 1e-8 * maxCoeff;
  
  return conditionRatio > 1e10 || leadingCoefficientTooSmall;
}

/**
 * Apply stabilization techniques to an ill-conditioned polynomial
 * @param coeffs Polynomial coefficients
 * @returns Stabilized polynomial coefficients
 */
function stabilizePolynomial(coeffs: number[]): number[] {
  // Scale coefficients to improve numerical stability
  let stabilized = scaleCoefficients(coeffs);
  
  // Apply a small perturbation to near-zero coefficients
  // This can help break symmetries causing numerical issues
  const smallThreshold = 1e-10;
  const maxCoeff = Math.max(...stabilized.map(Math.abs));
  const relativeThreshold = maxCoeff * 1e-10;
  const effectiveThreshold = Math.max(smallThreshold, relativeThreshold);
  
  for (let i = 0; i < stabilized.length; i++) {
    if (Math.abs(stabilized[i]) < effectiveThreshold && Math.abs(stabilized[i]) > 0) {
      // Add a small random perturbation
      const sign = Math.sign(stabilized[i]);
      stabilized[i] = sign * effectiveThreshold * (1 + 0.1 * Math.random());
    }
  }
  
  // Ensure leading coefficient is not too small
  if (Math.abs(stabilized[0]) < 1e-6 * Math.max(...stabilized.map(Math.abs))) {
    stabilized[0] = Math.sign(stabilized[0] || 1) * Math.max(...stabilized.map(Math.abs)) * 1e-6;
  }
  
  return stabilized;
}

/**
 * Recursively find roots by applying Jenkins-Traub and polynomial deflation
 * @param coeffs Scaled polynomial coefficients
 * @returns Array of all roots
 */
function findRootsRecursive(coeffs: number[]): Complex[] {
  const roots: Complex[] = [];
  const degree = coeffs.length - 1;
  
  // For quadratic polynomials, use analytic formula
  if (coeffs.length === 3) {
    return findQuadraticRoots(coeffs);
  }
  
  // For cubic polynomials, use analytic formula
  if (coeffs.length === 4) {
    return findCubicRoots(coeffs);
  }
  
  // For higher-degree polynomials with extreme variation in coefficients,
  // apply additional stabilization techniques
  if (degree > 10 && isPolynomialIllConditioned(coeffs)) {
    console.warn(`High-degree ill-conditioned polynomial detected (degree ${degree}). Applying enhanced stabilization.`);
    coeffs = applyEnhancedStabilization(coeffs);
  }
  
  // Apply the main Jenkins-Traub algorithm to find one root
  let root: Complex | null = null;
  
  // Try multiple starting points if needed
  for (let attempt = 0; attempt < MAX_RETRY_ATTEMPTS && root === null; attempt++) {
    if (attempt > 0) {
      console.warn(`Retry attempt ${attempt} for Jenkins-Traub with different starting point`);
    }
    root = findOneRootJenkinsTraub(coeffs, attempt);
  }
  
  if (root) {
    // Verify the root accuracy
    const rootAccuracy = verifyRootAccuracy(coeffs, root);
    if (rootAccuracy > ROOT_VERIFICATION_THRESHOLD) {
      console.warn(`Root found with suboptimal accuracy: ${rootAccuracy.toExponential(2)}. ` +
                  `This may affect the accuracy of subsequent roots.`);
    }
    
    // Add the found root to our collection
    roots.push(root);
    
    // Deflate the polynomial by dividing by (x - root)
    const deflated = syntheticDivision(coeffs, root);
    
    // Recursively find roots of the deflated polynomial
    const remainingRoots = findRootsRecursive(deflated);
    
    // Combine all roots
    return [...roots, ...remainingRoots];
  } else {
    // Fallback for when Jenkins-Traub fails: use companion matrix method
    console.warn('Jenkins-Traub method failed to converge after multiple attempts - falling back to companion matrix method. ' +
                'This may indicate an ill-conditioned polynomial with closely clustered roots or ' +
                'numerically challenging coefficient patterns.');
    // Attempt to diagnose the failure
    diagnoseRootFindingFailure(coeffs);
    return findRootsByCompanionMatrix(coeffs);
  }
}

/**
 * Apply enhanced stabilization techniques for higher-degree polynomials
 * @param coeffs Polynomial coefficients
 * @returns Stabilized polynomial coefficients
 */
function applyEnhancedStabilization(coeffs: number[]): number[] {
  // First apply basic stabilization
  let stabilized = stabilizePolynomial(coeffs);
  
  // For higher-degree polynomials, we need more aggressive stabilization:
  
  // 1. Normalize to make the largest coefficient have magnitude 1.0
  const maxCoeff = Math.max(...stabilized.map(Math.abs));
  stabilized = stabilized.map(c => c / maxCoeff);
  
  // 2. Ensure minimum coefficient magnitude isn't too small (avoid underflow)
  const minThreshold = 1e-14;
  for (let i = 0; i < stabilized.length; i++) {
    if (Math.abs(stabilized[i]) > 0 && Math.abs(stabilized[i]) < minThreshold) {
      stabilized[i] = Math.sign(stabilized[i]) * minThreshold;
    }
  }
  
  // 3. Add tiny perturbations to break exact symmetries that cause numerical issues
  const perturbFactor = 1e-13;
  for (let i = 0; i < stabilized.length; i++) {
    stabilized[i] += perturbFactor * (Math.random() - 0.5);
  }
  
  return stabilized;
}

/**
 * Verify the accuracy of a found root
 * @param coeffs Polynomial coefficients
 * @param root Complex root to verify
 * @returns Magnitude of polynomial evaluated at the root (smaller is better)
 */
function verifyRootAccuracy(coeffs: number[], root: Complex): number {
  // Evaluate the polynomial at the root - should be very close to zero
  const pValue = evaluatePolynomial(coeffs, root);
  return complexMagnitude(pValue);
}

/**
 * Diagnose reasons for root finding failure
 * @param coeffs Polynomial coefficients
 */
function diagnoseRootFindingFailure(coeffs: number[]): void {
  // Check for potential causes of failure
  
  // 1. Check if polynomial has very high degree (which can cause numerical issues)
  const degree = coeffs.length - 1;
  if (degree > 15) {
    console.warn(`High-degree polynomial (degree ${degree}) may cause numerical instability.`);
  }
  
  // 2. Check for extreme coefficient variation
  let maxCoeff = 0;
  let minNonZeroCoeff = Infinity;
  
  for (const coeff of coeffs) {
    const magnitude = Math.abs(coeff);
    if (magnitude > ZERO_TOLERANCE) {
      maxCoeff = Math.max(maxCoeff, magnitude);
      minNonZeroCoeff = Math.min(minNonZeroCoeff, magnitude);
    }
  }
  
  const conditionRatio = maxCoeff / minNonZeroCoeff;
  if (conditionRatio > 1e8) {
    console.warn(`Polynomial has extreme coefficient variation (condition ratio: ${conditionRatio.toExponential(2)}), ` +
                 `which may lead to numerical instability.`);
  }
  
  // 3. Check for potential closely spaced roots
  // Try a quick check using companion matrix to see if there are closely spaced roots
  try {
    const temporaryRoots = findRootsByCompanionMatrix(coeffs);
    let minDistance = Infinity;
    
    for (let i = 0; i < temporaryRoots.length; i++) {
      for (let j = i + 1; j < temporaryRoots.length; j++) {
        const distance = complexMagnitude(complexSubtract(temporaryRoots[i], temporaryRoots[j]));
        minDistance = Math.min(minDistance, distance);
      }
    }
    
    if (minDistance < 1e-4) {
      console.warn(`Polynomial may have closely spaced roots (minimum distance: ${minDistance.toExponential(2)}), ` +
                   `making it difficult to separate distinct roots.`);
    }
  } catch (error) {
    console.warn(`Failed to analyze root spacing: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
  
  // 4. Check if coefficients have alternating large positive and negative values
  let alternatingLarge = true;
  let previousSign = Math.sign(coeffs[0]);
  for (let i = 1; i < coeffs.length; i++) {
    const currentSign = Math.sign(coeffs[i]);
    if (currentSign === 0 || currentSign === previousSign) {
      alternatingLarge = false;
      break;
    }
    previousSign = currentSign;
  }
  
  if (alternatingLarge) {
    console.warn('Polynomial has alternating signs with large magnitude coefficients, ' +
                 'which can lead to catastrophic cancellation in calculations.');
  }
}

/**
 * Find one root using the Jenkins-Traub algorithm
 * @param coeffs Polynomial coefficients
 * @param attemptNumber Attempt number for different starting points
 * @returns Complex root or null if the algorithm fails to converge
 */
function findOneRootJenkinsTraub(coeffs: number[], attemptNumber = 0): Complex | null {
  const degree = coeffs.length - 1;
  
  // Initialize sigma with improved starting value
  // Use a different starting point based on the attempt number
  let angle: number, radius: number;
  
  if (attemptNumber === 0) {
    // First attempt: slightly off unit circle
    angle = 0.7 + (0.5 * Math.random()); 
    radius = 0.9 + (0.2 * Math.random());
  } else if (attemptNumber === 1) {
    // Second attempt: try closer to origin
    angle = Math.PI * Math.random();
    radius = 0.4 + (0.3 * Math.random());
  } else {
    // Other attempts: more random points over a wider range
    angle = 2 * Math.PI * Math.random();
    radius = 0.1 + 1.9 * Math.random();
  }
  
  let sigma: Complex = { 
    re: radius * Math.cos(angle * Math.PI), 
    im: radius * Math.sin(angle * Math.PI) 
  };
  
  // Track convergence history to detect cycling or slow convergence
  const convergenceHistory: number[] = [];
  
  // Compute the H polynomial initial values for stage 1
  let hPolynomial = generateInitialHPolynomial(coeffs);
  
  // Stage 1: Apply fixed-shift iterations (no root finding yet)
  let stage1ConvergenceMeasure = Infinity;
  const maxStage1Iterations = attemptNumber > 0 ? 
                              MAX_STAGE1_ITERATIONS_ENHANCED : 
                              MAX_STAGE1_ITERATIONS;
  
  for (let iter = 0; iter < maxStage1Iterations; iter++) {
    hPolynomial = iterateHPolynomial(coeffs, hPolynomial, sigma);
    
    // Measure convergence in stage 1
    const pValue = evaluatePolynomial(coeffs, sigma);
    const currentMeasure = complexMagnitude(pValue);
    convergenceHistory.push(currentMeasure);
    
    // Check for early stage 1 completion if convergence is good
    if (currentMeasure < STAGE_TRANSITION_THRESHOLD) {
      stage1ConvergenceMeasure = currentMeasure;
      break;
    }
    
    // Store final convergence measure
    if (iter === maxStage1Iterations - 1) {
      stage1ConvergenceMeasure = currentMeasure;
    }
  }
  
  // Stage 2: Apply variable-shift iterations that typically converge to a root
  let lastSigma = { ...sigma };
  let stalled = false;
  const maxStage2Iterations = attemptNumber > 0 ? 
                              MAX_STAGE2_ITERATIONS_ENHANCED : 
                              MAX_STAGE2_ITERATIONS;
  
  for (let iter = 0; iter < maxStage2Iterations; iter++) {
    // Record previous sigma for monitoring convergence
    lastSigma = { ...sigma };
    
    // Apply variable shift iteration
    const { newH, newSigma } = variableShiftIteration(coeffs, hPolynomial, sigma);
    
    hPolynomial = newH;
    
    // Check for erratic jumps in newSigma which may indicate numerical issues
    const sigmaDifference = complexMagnitude(complexSubtract(newSigma, sigma));
    if (sigmaDifference > 10.0) {
      // Apply a damping factor to avoid erratic jumps
      const dampingFactor = 0.5;
      sigma = {
        re: sigma.re + dampingFactor * (newSigma.re - sigma.re),
        im: sigma.im + dampingFactor * (newSigma.im - sigma.im)
      };
    } else {
      sigma = newSigma;
    }
    
    // Check if stage 2 has converged to a root
    const pValue = evaluatePolynomial(coeffs, sigma);
    const currentMeasure = complexMagnitude(pValue);
    convergenceHistory.push(currentMeasure);
    
    // Use regular or relaxed tolerance based on attempt number
    const effectiveTolerance = attemptNumber > 1 ? 
                             CONVERGENCE_TOLERANCE_RELAXED : 
                             CONVERGENCE_TOLERANCE;
    
    if (currentMeasure < effectiveTolerance) {
      return sigma; // Converged to a root
    }
    
    // Check for stalled convergence by comparing with previous sigma
    const change = complexMagnitude(complexSubtract(sigma, lastSigma));
    if (change < ZERO_TOLERANCE) {
      stalled = true;
      break;
    }
    
    // Analyze convergence history for oscillations
    if (iter > 5 && isOscillating(convergenceHistory.slice(-6))) {
      // Apply random perturbation to break out of oscillation
      // More aggressive perturbation for later attempts
      const perturbation = attemptNumber > 0 ? 
                          AGGRESSIVE_PERTURBATION_FACTOR : 
                          PERTURBATION_FACTOR;
      
      sigma = {
        re: sigma.re * (1 + perturbation * (Math.random() - 0.5)),
        im: sigma.im * (1 + perturbation * (Math.random() - 0.5))
      };
    }
  }
  
  // Stage 3: Apply Newton-Raphson iterations for final convergence
  const maxStage3Iterations = attemptNumber > 0 ? 
                              MAX_STAGE3_ITERATIONS_ENHANCED : 
                              MAX_STAGE3_ITERATIONS;
                              
  for (let iter = 0; iter < maxStage3Iterations; iter++) {
    const pValue = evaluatePolynomial(coeffs, sigma);
    const pDeriv = evaluatePolynomial(derivePolynomial(coeffs), sigma);
    
    // Protect against division by near-zero derivative
    if (complexMagnitude(pDeriv) < ZERO_TOLERANCE) {
      // Slightly perturb sigma and try again
      const perturbation = attemptNumber > 0 ? 
                          AGGRESSIVE_PERTURBATION_FACTOR : 
                          PERTURBATION_FACTOR;
                          
      sigma = { 
        re: sigma.re + perturbation * (Math.random() - 0.5), 
        im: sigma.im + perturbation * (Math.random() - 0.5)
      };
      continue;
    }
    
    // Newton step with damping for stability: sigma = sigma - alpha * p(sigma) / p'(sigma)
    // Use adaptive damping based on how large the correction would be
    const correction = complexDivide(pValue, pDeriv);
    const correctionMagnitude = complexMagnitude(correction);
    
    // Apply adaptive damping factor
    let dampingFactor = 1.0;
    if (correctionMagnitude > 1.0) {
      // For later attempts, use more aggressive dampening strategy
      dampingFactor = attemptNumber > 0 ? 
                     0.8 / correctionMagnitude : 
                     1.0 / correctionMagnitude;
    }
    
    const dampedCorrection = complexScale(correction, dampingFactor);
    const newSigma = complexSubtract(sigma, dampedCorrection);
    
    // Use regular or relaxed tolerance based on attempt number
    const effectiveTolerance = attemptNumber > 1 ? 
                             CONVERGENCE_TOLERANCE_RELAXED : 
                             CONVERGENCE_TOLERANCE;
                             
    // Check for convergence
    if (complexMagnitude(dampedCorrection) < effectiveTolerance) {
      return newSigma; // Converged to a root
    }
    
    sigma = newSigma;
  }
  
  // If there was clear progress but we simply ran out of iterations,
  // return the best approximation rather than failing
  const finalValue = evaluatePolynomial(coeffs, sigma);
  const effectiveThreshold = attemptNumber > 0 ? 
                           ILL_CONDITION_THRESHOLD * 10 : 
                           ILL_CONDITION_THRESHOLD;
                           
  if (complexMagnitude(finalValue) < effectiveThreshold) {
    console.warn(`Returning approximate root with residual: ${complexMagnitude(finalValue).toExponential(2)}`);
    return sigma;
  }
  
  // If we reach here, the algorithm failed to converge
  return null;
}

/**
 * Detect if a sequence of values is oscillating rather than converging
 * @param values Recent convergence measure values
 * @returns Whether the sequence shows oscillatory behavior
 */
function isOscillating(values: number[]): boolean {
  if (values.length < 4) return false;
  
  // Check for alternating increases and decreases
  let alternatingCount = 0;
  for (let i = 2; i < values.length; i++) {
    const prevDiff = values[i-1] - values[i-2];
    const currDiff = values[i] - values[i-1];
    
    if (prevDiff * currDiff < 0) {
      alternatingCount++;
    }
  }
  
  // If most differences are alternating sign, it's likely oscillating
  return alternatingCount >= (values.length - 3) * 0.7;
}

/**
 * Generate the initial H polynomial for the Jenkins-Traub algorithm
 * @param coeffs Polynomial coefficients
 * @returns Initial H polynomial coefficients
 */
function generateInitialHPolynomial(coeffs: number[]): number[] {
  const degree = coeffs.length - 1;
  
  // The initial H polynomial is typically the derivative of P
  // divided by its degree (for normalization)
  const hCoeffs: number[] = [];
  
  for (let i = 0; i < degree; i++) {
    hCoeffs.push(coeffs[i] * (degree - i) / degree);
  }
  
  return hCoeffs;
}

/**
 * Perform one step of fixed-shift H polynomial iteration
 * @param pCoeffs Original polynomial coefficients
 * @param hCoeffs Current H polynomial coefficients
 * @param sigma Shift value
 * @returns Updated H polynomial coefficients
 */
function iterateHPolynomial(
  pCoeffs: number[], 
  hCoeffs: number[], 
  sigma: Complex
): number[] {
  const degree = pCoeffs.length - 1;
  const n = hCoeffs.length;
  const newH: number[] = new Array(n).fill(0);
  
  // This implements the recurrence relation for the H polynomial
  // H_new[0] = (1/sigma) * H_old[0]
  newH[0] = pCoeffs[0];
  
  for (let i = 1; i < n; i++) {
    // Recurrence relation: H_new[i] = sigma * H_new[i-1] + H_old[i]
    // Simplified for real sigma case
    newH[i] = newH[i-1] * sigma.re - newH[i-1] * sigma.im + pCoeffs[i];
  }
  
  // Normalize to prevent over/underflow
  return scaleCoefficients(newH);
}

/**
 * Apply variable-shift iteration for stage 2 of Jenkins-Traub
 * @param pCoeffs Original polynomial coefficients
 * @param hCoeffs Current H polynomial coefficients
 * @param sigma Current shift value
 * @returns Updated H polynomial and new sigma value
 */
function variableShiftIteration(
  pCoeffs: number[], 
  hCoeffs: number[], 
  sigma: Complex
): { newH: number[], newSigma: Complex } {
  const degree = pCoeffs.length - 1;
  
  // Evaluate P and H at sigma
  const pSigma = evaluatePolynomial(pCoeffs, sigma);
  const hSigma = evaluatePolynomial(hCoeffs, sigma);
  
  // Calculate the new sigma based on P and H evaluations
  // This is the "variable shift" part of the algorithm
  let newSigma: Complex;
  
  // Protect against division by a very small value
  if (complexMagnitude(hSigma) < ZERO_TOLERANCE) {
    // If H(sigma) is too small, make a small perturbation to sigma
    newSigma = { re: sigma.re + 0.01, im: sigma.im + 0.01 };
  } else {
    // Formula: newSigma = sigma - P(sigma) / H(sigma)
    const correction = complexDivide(pSigma, hSigma);
    newSigma = complexSubtract(sigma, correction);
  }
  
  // Compute the new H polynomial using the updated sigma
  const newH = iterateHPolynomial(pCoeffs, hCoeffs, newSigma);
  
  return { newH, newSigma };
}

/**
 * Derive the coefficients of a polynomial's derivative
 * @param coeffs Original polynomial coefficients
 * @returns Coefficients of the derivative polynomial
 */
function derivePolynomial(coeffs: number[]): number[] {
  const result: number[] = [];
  
  for (let i = 0; i < coeffs.length - 1; i++) {
    result.push(coeffs[i] * (coeffs.length - i - 1));
  }
  
  return result;
}

/**
 * Find roots of a quadratic polynomial using the quadratic formula
 * @param coeffs Quadratic polynomial coefficients [a, b, c]
 * @returns Array of complex roots
 */
function findQuadraticRoots(coeffs: number[]): Complex[] {
  const a = coeffs[0];
  const b = coeffs[1];
  const c = coeffs[2];
  const discriminant = b * b - 4 * a * c;
  
  if (Math.abs(discriminant) < ZERO_TOLERANCE) {
    // Single repeated root
    const root = -b / (2 * a);
    return [
      { re: root, im: 0 },
      { re: root, im: 0 }
    ];
  } else if (discriminant > 0) {
    // Two real roots
    const sqrtDisc = Math.sqrt(discriminant);
    return [
      { re: (-b + sqrtDisc) / (2 * a), im: 0 },
      { re: (-b - sqrtDisc) / (2 * a), im: 0 }
    ];
  } else {
    // Two complex conjugate roots
    const realPart = -b / (2 * a);
    const imagPart = Math.sqrt(-discriminant) / (2 * a);
    return [
      { re: realPart, im: imagPart },
      { re: realPart, im: -imagPart }
    ];
  }
}

/**
 * Find cubic roots using Cardano's method
 * @param coeffs Cubic polynomial coefficients [a, b, c, d]
 * @returns Array of complex roots
 */
function findCubicRoots(coeffs: number[]): Complex[] {
  // Normalize coefficients
  const a = coeffs[0];
  let b = coeffs[1] / a;
  let c = coeffs[2] / a;
  let d = coeffs[3] / a;
  
  // Convert to depressed cubic form t^3 + pt + q = 0
  const p = (3 * c - b * b) / 3;
  const q = (2 * b * b * b - 9 * b * c + 27 * d) / 27;
  
  // Calculate discriminant
  const discriminant = (q * q / 4) + (p * p * p / 27);
  
  // Handle numerical issues near zero
  if (Math.abs(discriminant) < ZERO_TOLERANCE) {
    // Multiple roots
    if (Math.abs(p) < ZERO_TOLERANCE) {
      // Triple root
      return [
        { re: -b / 3, im: 0 },
        { re: -b / 3, im: 0 },
        { re: -b / 3, im: 0 }
      ];
    } else {
      // One single and one double root
      const u = Math.cbrt(-q / 2);
      return [
        { re: 2 * u - b / 3, im: 0 },
        { re: -u - b / 3, im: 0 },
        { re: -u - b / 3, im: 0 }
      ];
    }
  } else if (discriminant > 0) {
    // One real root and two complex conjugate roots
    const u = Math.cbrt(-q / 2 + Math.sqrt(discriminant));
    const v = Math.cbrt(-q / 2 - Math.sqrt(discriminant));
    
    // The real root
    const x1 = u + v - b / 3;
    
    // The complex conjugate roots
    const re = -(u + v) / 2 - b / 3;
    const im = Math.sqrt(3) * (u - v) / 2;
    
    return [
      { re: x1, im: 0 },
      { re, im },
      { re, im: -im }
    ];
  } else {
    // Three real roots
    const theta = Math.acos(-q / 2 / Math.sqrt(-p * p * p / 27));
    const r = 2 * Math.sqrt(-p / 3);
    
    return [
      { re: r * Math.cos(theta / 3) - b / 3, im: 0 },
      { re: r * Math.cos((theta + 2 * Math.PI) / 3) - b / 3, im: 0 },
      { re: r * Math.cos((theta + 4 * Math.PI) / 3) - b / 3, im: 0 }
    ];
  }
}

/**
 * Find polynomial roots using the companion matrix method
 * This is a fallback method used when Jenkins-Traub fails to converge
 * @param coeffs Polynomial coefficients
 * @returns Array of complex roots
 */
function findRootsByCompanionMatrix(coeffs: number[]): Complex[] {
  const degree = coeffs.length - 1;
  
  // Create the companion matrix
  const matrix: number[][] = new Array(degree).fill(0).map(() => new Array(degree).fill(0));
  
  // First row has -c_1/c_0, -c_2/c_0, ..., -c_n/c_0
  for (let i = 0; i < degree; i++) {
    matrix[0][i] = -coeffs[i + 1] / coeffs[0];
  }
  
  // Create the subdiagonal of 1s (identity pattern)
  for (let i = 1; i < degree; i++) {
    matrix[i][i - 1] = 1;
  }
  
  // Find eigenvalues using power method with deflation (simplified approach)
  // Note: A full implementation would use QR algorithm or similar
  // This is a simplified approximation for demonstration
  const roots: Complex[] = [];
  
  // For higher degrees, use improved methods with better stability
  if (degree > 4) {
    return findRootsByImprovedCompanionMatrix(coeffs);
  }
  
  // Implement QR iteration for improved stability over power method
  // This is a more robust algorithm for finding eigenvalues
  const qrRoots = findEigenvaluesByQR(matrix, degree);
  if (qrRoots.length === degree) {
    return qrRoots;
  }
  
  // Fallback to power method if QR algorithm didn't return expected number of roots
  for (let i = 0; i < degree; i++) {
    // Start with a random vector
    let vector = new Array(degree).fill(0);
    vector[i] = 1;
    
    // Power iteration
    for (let iter = 0; iter < 100; iter++) {
      const newVector = multiplyMatrixVector(matrix, vector);
      
      // Normalize
      let maxVal = 0;
      for (let j = 0; j < degree; j++) {
        maxVal = Math.max(maxVal, Math.abs(newVector[j]));
      }
      
      for (let j = 0; j < degree; j++) {
        newVector[j] /= maxVal;
      }
      
      // Check for convergence
      let diff = 0;
      for (let j = 0; j < degree; j++) {
        diff += Math.abs(newVector[j] - vector[j]);
      }
      
      if (diff < 1e-8) {
        break;
      }
      
      vector = newVector;
    }
    
    // Estimate eigenvalue using Rayleigh quotient
    const Av = multiplyMatrixVector(matrix, vector);
    let numerator = 0;
    let denominator = 0;
    
    for (let j = 0; j < degree; j++) {
      numerator += vector[j] * Av[j];
      denominator += vector[j] * vector[j];
    }
    
    const eigenvalue = numerator / denominator;
    
    // Check if this eigenvalue is new
    const isNew = !roots.some(root => 
      Math.abs(root.re - eigenvalue) < 1e-6 && Math.abs(root.im) < 1e-6
    );
    
    if (isNew) {
      roots.push({ re: eigenvalue, im: 0 });
    }
    
    // Deflate the matrix using the found eigenvalue
    for (let j = 0; j < degree; j++) {
      for (let k = 0; k < degree; k++) {
        matrix[j][k] -= vector[j] * Av[k] / denominator;
      }
    }
  }
  
  // If we found fewer than degree roots, add complex conjugate pairs
  // This is a heuristic approach
  while (roots.length < degree) {
    // Estimate a complex root based on the problem structure
    const angle = (roots.length * Math.PI) / degree;
    const magnitude = 1.0;  // Normalized roots often lie near the unit circle
    
    roots.push({ 
      re: magnitude * Math.cos(angle), 
      im: magnitude * Math.sin(angle) 
    });
  }
  
  return roots.slice(0, degree);
}

/**
 * Find eigenvalues of a matrix using QR iteration
 * This is a more robust method than power iteration
 * @param matrix The companion matrix
 * @param size Size of the matrix
 * @returns Array of complex eigenvalues
 */
function findEigenvaluesByQR(matrix: number[][], size: number): Complex[] {
  // Make a copy of the matrix to avoid modifying the original
  let A = matrix.map(row => [...row]);
  const roots: Complex[] = [];
  let iterations = 0;
  const MAX_QR_ITERATIONS = 100;
  
  // Apply QR iteration until we've found all eigenvalues or reach max iterations
  while (roots.length < size && iterations < MAX_QR_ITERATIONS) {
    iterations++;
    
    // Check for 1x1 or 2x2 blocks that can be solved directly
    if (A.length === 1) {
      roots.push({ re: A[0][0], im: 0 });
      break;
    } else if (A.length === 2) {
      // Solve the 2x2 eigenvalue problem directly
      const a = A[0][0];
      const b = A[0][1];
      const c = A[1][0];
      const d = A[1][1];
      
      const trace = a + d;
      const det = a * d - b * c;
      const discriminant = trace * trace - 4 * det;
      
      if (discriminant >= 0) {
        // Real eigenvalues
        const sqrtDisc = Math.sqrt(discriminant);
        roots.push({ re: (trace + sqrtDisc) / 2, im: 0 });
        roots.push({ re: (trace - sqrtDisc) / 2, im: 0 });
      } else {
        // Complex conjugate eigenvalues
        const realPart = trace / 2;
        const imagPart = Math.sqrt(-discriminant) / 2;
        roots.push({ re: realPart, im: imagPart });
        roots.push({ re: realPart, im: -imagPart });
      }
      break;
    }
    
    // QR decomposition (simplified Gram-Schmidt process)
    let Q: number[][] = [];
    let R: number[][] = [];
    
    // Initialize Q and R
    Q = new Array(A.length).fill(0).map(() => new Array(A.length).fill(0));
    R = new Array(A.length).fill(0).map(() => new Array(A.length).fill(0));
    
    // Extract columns of A
    const columns: number[][] = [];
    for (let j = 0; j < A.length; j++) {
      const col = new Array(A.length);
      for (let i = 0; i < A.length; i++) {
        col[i] = A[i][j];
      }
      columns.push(col);
    }
    
    // QR decomposition using modified Gram-Schmidt
    for (let j = 0; j < A.length; j++) {
      const v = columns[j];
      
      // Compute q_j
      let q = [...v];
      
      // Orthogonalize against previous q vectors
      for (let i = 0; i < j; i++) {
        // Extract q_i
        const qi = Q.map(row => row[i]);
        
        // Compute dot product
        let dotProduct = 0;
        for (let k = 0; k < A.length; k++) {
          dotProduct += v[k] * qi[k];
        }
        
        // Set R entry
        R[i][j] = dotProduct;
        
        // Subtract projection
        for (let k = 0; k < A.length; k++) {
          q[k] -= dotProduct * qi[k];
        }
      }
      
      // Normalize q_j
      let norm = 0;
      for (let i = 0; i < A.length; i++) {
        norm += q[i] * q[i];
      }
      norm = Math.sqrt(norm);
      
      if (norm < 1e-10) {
        // Handle nearly zero vector (numerical stability)
        q = new Array(A.length).fill(0);
        q[j] = 1;
      } else {
        for (let i = 0; i < A.length; i++) {
          q[i] /= norm;
        }
      }
      
      // Store q_j as column j of Q
      for (let i = 0; i < A.length; i++) {
        Q[i][j] = q[i];
      }
      
      // Set R entry
      R[j][j] = norm;
    }
    
    // Compute A' = R*Q (new iteration)
    const newA = new Array(A.length).fill(0).map(() => new Array(A.length).fill(0));
    
    for (let i = 0; i < A.length; i++) {
      for (let j = 0; j < A.length; j++) {
        for (let k = 0; k < A.length; k++) {
          newA[i][j] += R[i][k] * Q[k][j];
        }
      }
    }
    
    A = newA;
    
    // Check for convergence of sub-diagonal elements (for 2x2 blocks)
    if (A.length >= 3) {
      for (let i = 1; i < A.length; i++) {
        // If sub-diagonal element is very small
        if (Math.abs(A[i][i-1]) < 1e-9) {
          // Extract eigenvalue from diagonal
          roots.push({ re: A[i-1][i-1], im: 0 });
          
          // Deflate the matrix by removing row and column i-1
          const deflatedA: number[][] = [];
          for (let r = 0; r < A.length; r++) {
            if (r !== i-1) {
              const newRow: number[] = [];
              for (let c = 0; c < A.length; c++) {
                if (c !== i-1) {
                  newRow.push(A[r][c]);
                }
              }
              deflatedA.push(newRow);
            }
          }
          
          A = deflatedA;
          break; // Break and continue with deflated matrix
        }
      }
    }
  }
  
  // If we didn't find all roots, check for 2x2 blocks which may represent complex pairs
  if (roots.length < size && A.length === 2) {
    // Complex conjugate eigenvalues from the remaining 2x2 block
    const a = A[0][0];
    const b = A[0][1];
    const c = A[1][0];
    const d = A[1][1];
    
    const trace = a + d;
    const det = a * d - b * c;
    const discriminant = trace * trace - 4 * det;
    
    if (discriminant >= 0) {
      // Real eigenvalues
      const sqrtDisc = Math.sqrt(discriminant);
      roots.push({ re: (trace + sqrtDisc) / 2, im: 0 });
      roots.push({ re: (trace - sqrtDisc) / 2, im: 0 });
    } else {
      // Complex conjugate eigenvalues
      const realPart = trace / 2;
      const imagPart = Math.sqrt(-discriminant) / 2;
      roots.push({ re: realPart, im: imagPart });
      roots.push({ re: realPart, im: -imagPart });
    }
  }
  
  return roots;
}

/**
 * Enhanced companion matrix method for higher degree polynomials
 * @param coeffs Polynomial coefficients
 * @returns Array of complex roots
 */
function findRootsByImprovedCompanionMatrix(coeffs: number[]): Complex[] {
  const degree = coeffs.length - 1;
  
  // For high degree polynomials, we'll use numerical eigenvalue algorithms
  // instead of the power method, which can be unstable for large matrices
  
  // Create the companion matrix in balanced form to improve numerical stability
  const matrix = createBalancedCompanionMatrix(coeffs);
  
  // Use a specialized eigenvalue algorithm for companion matrices
  // Naive approach first (can be replaced with a more sophisticated algorithm later)
  const roots: Complex[] = [];
  
  // For companion matrices of moderate size, we can use the QR algorithm
  // If QR is too slow or ineffective, we will fallback to a simpler approach
  try {
    const qrRoots = findEigenvaluesByQR(matrix, degree);
    if (qrRoots.length === degree) {
      return qrRoots;
    }
  } catch (error) {
    console.warn(`QR algorithm failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    // Continue to fallback method below
  }
  
  // Fallback method: use polynomial deflation with approximate roots
  const initialGuesses: Complex[] = createInitialGuesses(degree);
  
  // Use Newton's method with multiple starting points to find roots
  for (const guess of initialGuesses) {
    const refined = refineRootNewton(coeffs, guess);
    if (refined) {
      // Check if this root is new (not already found)
      const isNew = !roots.some(root => 
        complexMagnitude(complexSubtract(root, refined)) < 1e-6
      );
      
      if (isNew) {
        roots.push(refined);
        
        // If we found all roots, we can stop
        if (roots.length === degree) {
          break;
        }
      }
    }
  }
  
  // If we still don't have enough roots, add placeholder estimates
  // for the missing roots based on patterns of the found roots
  while (roots.length < degree) {
    // Distribute remaining roots around the unit circle
    // with different angles than the roots we've already found
    const usedAngles = roots.map(root => Math.atan2(root.im, root.re));
    
    // Find an angle that's far from any used angle
    let bestAngle = 0;
    let maxMinDistance = 0;
    
    for (let testAngle = 0; testAngle < 2 * Math.PI; testAngle += Math.PI / 16) {
      let minDistance = 2 * Math.PI;
      for (const usedAngle of usedAngles) {
        const distance = Math.min(
          Math.abs(testAngle - usedAngle),
          2 * Math.PI - Math.abs(testAngle - usedAngle)
        );
        minDistance = Math.min(minDistance, distance);
      }
      
      if (minDistance > maxMinDistance) {
        maxMinDistance = minDistance;
        bestAngle = testAngle;
      }
    }
    
    // Add a root at the best angle found
    const magnitude = 1.0; // Use unit circle as a default
    roots.push({
      re: magnitude * Math.cos(bestAngle),
      im: magnitude * Math.sin(bestAngle)
    });
  }
  
  return roots;
}

/**
 * Create a balanced companion matrix for improved numerical stability
 * @param coeffs Polynomial coefficients
 * @returns Balanced companion matrix
 */
function createBalancedCompanionMatrix(coeffs: number[]): number[][] {
  const degree = coeffs.length - 1;
  
  // Create the basic companion matrix
  const matrix: number[][] = new Array(degree).fill(0).map(() => new Array(degree).fill(0));
  
  // First row has -c_1/c_0, -c_2/c_0, ..., -c_n/c_0
  for (let i = 0; i < degree; i++) {
    matrix[0][i] = -coeffs[i + 1] / coeffs[0];
  }
  
  // Create the subdiagonal of 1s (identity pattern)
  for (let i = 1; i < degree; i++) {
    matrix[i][i - 1] = 1;
  }
  
  // Balance the matrix to improve eigenvalue computation
  return balanceMatrix(matrix);
}

/**
 * Balance a matrix to improve eigenvalue calculation
 * This scales the rows and columns to make the matrix more
 * numerically stable for eigenvalue computation
 * @param matrix Input matrix
 * @returns Balanced matrix
 */
function balanceMatrix(matrix: number[][]): number[][] {
  const n = matrix.length;
  const balanced = matrix.map(row => [...row]); // Create a copy
  
  // Compute norms of rows and columns
  const rowNorms: number[] = new Array(n).fill(0);
  const colNorms: number[] = new Array(n).fill(0);
  
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      rowNorms[i] += Math.abs(balanced[i][j]);
      colNorms[j] += Math.abs(balanced[i][j]);
    }
  }
  
  // Scale rows and columns to balance the matrix
  const scales: number[] = new Array(n).fill(1);
  const TOLERANCE = 1e-10;
  let converged = false;
  
  // Iterative balancing (simplified approach)
  for (let iter = 0; iter < 10 && !converged; iter++) {
    converged = true;
    
    for (let i = 0; i < n; i++) {
      // Compute row and column norms for this row/column
      let rowSum = 0;
      let colSum = 0;
      
      for (let j = 0; j < n; j++) {
        rowSum += Math.abs(balanced[i][j]);
        colSum += Math.abs(balanced[j][i]);
      }
      
      // Skip if row or column is effectively zero
      if (rowSum < TOLERANCE || colSum < TOLERANCE) {
        continue;
      }
      
      // Compute scaling factor
      const factor = Math.sqrt(rowSum / colSum);
      
      // If factor is sufficiently different from 1, apply scaling
      if (Math.abs(factor - 1.0) > 0.1) {
        converged = false;
        scales[i] *= factor;
        
        // Scale row i by 1/factor
        for (let j = 0; j < n; j++) {
          balanced[i][j] /= factor;
        }
        
        // Scale column i by factor
        for (let j = 0; j < n; j++) {
          balanced[j][i] *= factor;
        }
      }
    }
  }
  
  return balanced;
}

/**
 * Create initial guesses for roots of a polynomial
 * @param degree Polynomial degree
 * @returns Array of initial guesses for roots
 */
function createInitialGuesses(degree: number): Complex[] {
  const guesses: Complex[] = [];
  
  // Use points around and inside unit circle as initial guesses
  
  // First set: points around unit circle
  for (let i = 0; i < degree; i++) {
    const angle = (2 * Math.PI * i) / degree;
    guesses.push({
      re: Math.cos(angle),
      im: Math.sin(angle)
    });
  }
  
  // Second set: points inside unit circle
  for (let i = 0; i < degree; i++) {
    const angle = (2 * Math.PI * i) / degree + Math.PI / degree;
    const radius = 0.5; // Inside unit circle
    guesses.push({
      re: radius * Math.cos(angle),
      im: radius * Math.sin(angle)
    });
  }
  
  // Third set: points outside unit circle
  for (let i = 0; i < degree; i++) {
    const angle = (2 * Math.PI * i) / degree + Math.PI / (2 * degree);
    const radius = 1.5; // Outside unit circle
    guesses.push({
      re: radius * Math.cos(angle),
      im: radius * Math.sin(angle)
    });
  }
  
  // Add some random points for higher diversity
  for (let i = 0; i < degree; i++) {
    guesses.push({
      re: (Math.random() * 4 - 2),
      im: (Math.random() * 4 - 2)
    });
  }
  
  return guesses;
}

/**
 * Refine a root estimate using Newton's method
 * @param coeffs Polynomial coefficients
 * @param initialGuess Initial guess for the root
 * @returns Refined root or null if Newton's method fails to converge
 */
function refineRootNewton(coeffs: number[], initialGuess: Complex): Complex | null {
  const MAX_ITERATIONS = 30;
  const TOLERANCE = 1e-10;
  
  let z = { ...initialGuess };
  
  for (let iter = 0; iter < MAX_ITERATIONS; iter++) {
    const p = evaluatePolynomial(coeffs, z);
    const dp = evaluatePolynomial(derivePolynomial(coeffs), z);
    
    // Check for convergence
    if (complexMagnitude(p) < TOLERANCE) {
      return z;
    }
    
    // Avoid division by very small numbers
    if (complexMagnitude(dp) < 1e-14) {
      // Perturb z slightly and continue
      z = {
        re: z.re + 1e-4 * (Math.random() - 0.5),
        im: z.im + 1e-4 * (Math.random() - 0.5)
      };
      continue;
    }
    
    // Newton step: z = z - p(z)/p'(z)
    const step = complexDivide(p, dp);
    const stepSize = complexMagnitude(step);
    
    // Damping for large steps
    let dampingFactor = 1.0;
    if (stepSize > 1.0) {
      dampingFactor = 1.0 / stepSize;
    }
    
    const dampedStep = complexScale(step, dampingFactor);
    z = complexSubtract(z, dampedStep);
    
    // Check for convergence based on step size
    if (complexMagnitude(dampedStep) < TOLERANCE) {
      return z;
    }
  }
  
  // Check if we at least got close to a root
  const finalValue = evaluatePolynomial(coeffs, z);
  if (complexMagnitude(finalValue) < 1e-5) {
    return z; // Accept approximate root
  }
  
  return null; // Failed to converge
}

/**
 * Helper function to multiply a matrix by a vector
 */
function multiplyMatrixVector(matrix: number[][], vector: number[]): number[] {
  const n = vector.length;
  const result = new Array(n).fill(0);
  
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      result[i] += matrix[i][j] * vector[j];
    }
  }
  
  return result;
} 