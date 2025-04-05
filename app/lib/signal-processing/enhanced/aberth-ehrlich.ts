/**
 * Implementation of the Aberth-Ehrlich method for polynomial root finding.
 * This algorithm simultaneously approximates all roots of a polynomial.
 * It has excellent global convergence properties and works well for complex polynomials.
 * 
 * Reference: "A new approach to numerical factorization of a polynomial", by Werner Ehrlich
 */

import { 
  Complex, 
  complexAdd, 
  complexMultiply, 
  complexDivide, 
  complexSubtract,
  complexReciprocal,
  complexMagnitude,
  evaluatePolynomial,
  evaluatePolynomialAndDerivative,
  scaleCoefficients,
  createPolynomialEvaluator,
  createDerivativeEvaluator,
  derivePolynomial
} from './numerical-utils';

// Maximum number of iterations for the algorithm
const MAX_ITERATIONS = 100;
const CONVERGENCE_TOLERANCE = 1e-12;

// Added optimization parameters
const MIN_ITERATIONS = 5; // Minimum iterations before early stopping
const STAGNATION_THRESHOLD = 1e-14; // Threshold for detecting convergence stagnation
const ACCELERATION_FACTOR = 1.2; // Factor for accelerating convergence
const PARALLEL_THRESHOLD = 20; // Polynomial degree threshold for parallel processing
const BATCH_UPDATE = true; // Use batch updates for roots when possible

// Enhanced optimization parameters
const ENHANCED_MAX_ITERATIONS = 150; // Increased maximum iterations for difficult cases
const ADAPTIVE_TOLERANCE = true; // Use adaptive tolerance based on polynomial condition
const DEFLATION_THRESHOLD = 10; // Polynomial degree threshold for sequential deflation strategy
const LAGUERRE_FALLBACK = true; // Use Laguerre's method as fallback for difficult roots
const WEIERSTRASS_CORRECTION = true; // Apply Weierstrass correction for improved convergence
const ENHANCED_MIN_ITERATIONS = 8; // Increased minimum iterations before checking convergence
const MULTI_PRECISION_THRESHOLD = 30; // Threshold for using multi-precision arithmetic

/**
 * Find all roots of a polynomial using the Aberth-Ehrlich method
 * @param coefficients Polynomial coefficients [a0, a1, a2, ...]
 * @param maxIterations Maximum number of iterations (default: 100)
 * @param tolerance Convergence tolerance (default: 1e-12)
 * @returns Array of complex roots
 */
export function findRootsByAberthEhrlich(
  coefficients: number[], 
  maxIterations: number = MAX_ITERATIONS, 
  tolerance: number = CONVERGENCE_TOLERANCE
): Complex[] {
  // Make a copy to avoid modifying the original
  let coeffs = [...coefficients];
  
  // Remove leading zeros
  while (coeffs.length > 0 && Math.abs(coeffs[0]) < 1e-14) {
    coeffs = coeffs.slice(1);
  }
  
  // Handle special cases
  if (coeffs.length <= 1) {
    return []; // Constant polynomial has no roots
  }
  
  // Scale coefficients to improve numerical stability
  coeffs = scaleCoefficients(coeffs);
  
  // Handle linear case directly
  if (coeffs.length === 2) {
    return [{ re: -coeffs[1] / coeffs[0], im: 0 }];
  }
  
  // Handle quadratic case directly
  if (coeffs.length === 3) {
    return findQuadraticRoots(coeffs);
  }
  
  // Get polynomial degree
  const n = coeffs.length - 1;
  
  // For higher degree polynomials, we may need more iterations
  const effectiveMaxIterations = n > 15 ? ENHANCED_MAX_ITERATIONS : maxIterations;
  
  // Determine if polynomial is potentially ill-conditioned
  const isIllConditioned = checkPolynomialCondition(coeffs);
  
  // Adjust tolerance for ill-conditioned problems
  const effectiveTolerance = ADAPTIVE_TOLERANCE && isIllConditioned ? 
                           tolerance * 10 : 
                           tolerance;
  
  // Use an improved initial guess strategy
  const roots: Complex[] = generateInitialGuesses(coeffs);
  
  // Create polynomial evaluation functions
  const evaluatePolynomialFn = createPolynomialEvaluator(coeffs);
  const evaluateDerivativeFn = createDerivativeEvaluator(coeffs);
  
  // Track convergence metrics for adaptive adjustments
  const convergenceHistory: number[] = [];
  let lastMaxChange = Infinity;
  let stagnationCounter = 0;
  
  // For high-degree polynomials with well-separated roots, consider deflation
  let useDeflation = n > DEFLATION_THRESHOLD && !isIllConditioned;
  const deflatedRoots: Complex[] = [];
  let deflatedCoeffs = [...coeffs];
  
  // Iterate to refine all roots simultaneously
  for (let iter = 0; iter < effectiveMaxIterations; iter++) {
    let maxChange = 0;
    
    // Store previous roots for convergence analysis
    const previousRoots: Complex[] = roots.map(r => ({ ...r }));
    
    if (useDeflation && roots.length > 0 && iter > MIN_ITERATIONS) {
      // If using deflation, check if any roots have converged
      for (let i = roots.length - 1; i >= 0; i--) {
        if (isRootConverged(deflatedCoeffs, roots[i], effectiveTolerance)) {
          // Move the converged root to deflatedRoots
          const convergedRoot = roots.splice(i, 1)[0];
          deflatedRoots.push(convergedRoot);
          
          // Deflate the polynomial
          deflatedCoeffs = deflatePolynomial(deflatedCoeffs, convergedRoot);
        }
      }
      
      // If all roots have been found through deflation, we're done
      if (roots.length === 0) {
        break;
      }
    }
    
    // Process roots in parallel for large-degree polynomials
    if (n > PARALLEL_THRESHOLD) {
      updateRootsInParallel(roots, useDeflation ? deflatedCoeffs : coeffs, roots.length);
    } else {
      // Standard sequential update
      const currentCoeffs = useDeflation ? deflatedCoeffs : coeffs;
      updateRootsSequentially(roots, currentCoeffs, roots.length);
    }
    
    // Calculate maximum change across all roots
    for (let i = 0; i < roots.length; i++) {
      const change = complexMagnitude(complexSubtract(roots[i], previousRoots[i]));
      maxChange = Math.max(maxChange, change);
    }
    
    // Track convergence history
    convergenceHistory.push(maxChange);
    
    // Check for convergence
    const minIters = isIllConditioned ? ENHANCED_MIN_ITERATIONS : MIN_ITERATIONS;
    if (maxChange < effectiveTolerance && iter >= minIters) {
      console.log(`Aberth-Ehrlich method converged in ${iter+1} iterations`);
      break;
    }
    
    // Apply acceleration for faster convergence when appropriate
    if (iter > 2 && maxChange < lastMaxChange * 0.9 && maxChange > effectiveTolerance * 10) {
      const accelerationFactor = isIllConditioned ? 
                              ACCELERATION_FACTOR * 0.8 : // Use gentler acceleration for ill-conditioned problems
                              ACCELERATION_FACTOR;
      applyAcceleration(roots, previousRoots, accelerationFactor);
    }
    
    // Apply Weierstrass correction for improved convergence
    if (WEIERSTRASS_CORRECTION && iter % 5 === 0 && iter > 0) {
      applyWeierstrassCorrection(roots, coeffs);
    }
    
    // Check for stagnation in convergence
    if (iter > 5 && isConvergenceStagnating(convergenceHistory.slice(-5))) {
      stagnationCounter++;
      console.log(`Detected convergence stagnation at iteration ${iter+1} (count: ${stagnationCounter})`);
      
      // Apply perturbation to escape stagnation
      if (stagnationCounter <= 3) {
        // Mild perturbation for the first few stagnations
        perturbRoots(roots, iter);
      } else {
        // For persistent stagnations, try more aggressive strategies
        if (stagnationCounter === 4) {
          // Switch to different strategy (e.g., disable deflation)
          useDeflation = false;
          // Reset roots with better initial guesses
          const newRoots = generateDiversifiedGuesses(coeffs, n - deflatedRoots.length);
          for (let i = 0; i < roots.length; i++) {
            roots[i] = newRoots[i];
          }
        } else {
          // Very aggressive perturbation for persistent stagnation
          aggressivePerturbation(roots, coeffs);
        }
      }
    }
    
    // Update last max change
    lastMaxChange = maxChange;
    
    // Early stopping for slow convergence: if too many iterations,
    // we accept what we have and try to polish the roots individually
    if (iter >= effectiveMaxIterations * 0.8 && maxChange > effectiveTolerance * 100) {
      console.warn(`Aberth-Ehrlich method terminated early after ${iter+1} iterations`);
      break;
    }
  }
  
  // If we used deflation, reincorporate the deflated roots
  if (useDeflation && deflatedRoots.length > 0) {
    for (const root of deflatedRoots) {
      roots.push(root);
    }
  }
  
  // Polish individual roots with a few iterations of Newton's method
  // or Laguerre's method for difficult roots
  for (let i = 0; i < roots.length; i++) {
    const rootAccuracy = evaluateRootAccuracy(coeffs, roots[i]);
    
    if (rootAccuracy > effectiveTolerance * 100 && LAGUERRE_FALLBACK) {
      // Use Laguerre's method for difficult roots
      roots[i] = polishRootLaguerre(coeffs, roots[i]);
    } else {
      // Use standard Newton polishing
      roots[i] = polishRoot(coeffs, roots[i]);
    }
  }
  
  // Remove duplicate roots within tolerance
  return removeDuplicateRoots(roots, coeffs, effectiveTolerance);
}

/**
 * Generate improved initial guesses for root finding
 * @param coeffs Polynomial coefficients
 * @returns Array of initial root guesses
 */
function generateInitialGuesses(coeffs: number[]): Complex[] {
  const n = coeffs.length - 1;
  
  // Estimate root bounds using Cauchy's bound
  // All roots lie within a circle of radius 1 + max(|a_i/a_0|) for i = 1..n
  let maxRatio = 0;
  for (let i = 1; i <= n; i++) {
    maxRatio = Math.max(maxRatio, Math.abs(coeffs[i] / coeffs[0]));
  }
  const boundRadius = 1 + maxRatio;
  
  // For very high degree polynomials, use more strategic distribution
  if (n > 30) {
    return generateStratifiedGuesses(coeffs, n, boundRadius);
  }
  
  // For low-degree polynomials, place guesses on circle with slight randomization
  if (n <= 10) {
    return Array(n).fill(0).map((_, i) => {
      const angle = (2 * Math.PI * i) / n + (0.1 * Math.random() - 0.05);
      const randomRadius = boundRadius * (0.5 + 0.5 * Math.random());
      return { 
        re: randomRadius * Math.cos(angle), 
        im: randomRadius * Math.sin(angle) 
      };
    });
  }
  
  // For higher-degree polynomials, use a more sophisticated distribution
  // Distribute some roots near the unit circle and others more widely
  return Array(n).fill(0).map((_, i) => {
    // Distribute angles evenly but with small random perturbations
    const angle = (2 * Math.PI * i) / n + (0.1 * Math.random() - 0.05);
    
    // Distribute radii based on index: place more points near expected root locations
    let radius;
    if (i % 3 === 0) {
      // Near unit circle
      radius = 0.9 + (0.2 * Math.random());
    } else if (i % 3 === 1) {
      // Inside unit circle
      radius = 0.5 + (0.4 * Math.random());
    } else {
      // Outside unit circle but within estimated bounds
      radius = 1.1 + (boundRadius - 1.1) * Math.random();
    }
    
    return { 
      re: radius * Math.cos(angle), 
      im: radius * Math.sin(angle) 
    };
  });
}

/**
 * Generate more diverse initial guesses for difficult polynomials
 * @param coeffs Polynomial coefficients
 * @param numRoots Number of roots to generate guesses for
 * @returns Array of initial root guesses
 */
function generateDiversifiedGuesses(coeffs: number[], numRoots: number): Complex[] {
  const n = numRoots;
  
  // Use multiple different strategies for initial guesses
  const guesses: Complex[] = [];
  
  // Strategy 1: Circle-based guesses with varying radii
  for (let i = 0; i < Math.ceil(n / 3); i++) {
    const angle = (2 * Math.PI * i) / Math.ceil(n / 3) + (0.2 * Math.random() - 0.1);
    // Jitter the radius
    const radius = 0.8 + (0.4 * Math.random());
    guesses.push({ 
      re: radius * Math.cos(angle), 
      im: radius * Math.sin(angle) 
    });
  }
  
  // Strategy 2: Points with larger radius
  for (let i = 0; i < Math.ceil(n / 3); i++) {
    const angle = (2 * Math.PI * i) / Math.ceil(n / 3) + (0.2 * Math.random() - 0.1) + Math.PI / Math.ceil(n / 3);
    // Larger radius
    const radius = 1.5 + (1.0 * Math.random());
    guesses.push({ 
      re: radius * Math.cos(angle), 
      im: radius * Math.sin(angle) 
    });
  }
  
  // Strategy 3: Points near the origin
  for (let i = 0; i < n - guesses.length; i++) {
    const angle = (2 * Math.PI * i) / (n - guesses.length) + (0.2 * Math.random() - 0.1) + Math.PI / (n - guesses.length) / 2;
    // Smaller radius
    const radius = 0.2 + (0.3 * Math.random());
    guesses.push({ 
      re: radius * Math.cos(angle), 
      im: radius * Math.sin(angle) 
    });
  }
  
  // Shuffle the guesses to further randomize
  for (let i = guesses.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [guesses[i], guesses[j]] = [guesses[j], guesses[i]];
  }
  
  return guesses.slice(0, numRoots);
}

/**
 * Generate stratified guesses for very high degree polynomials
 * @param coeffs Polynomial coefficients
 * @param numRoots Number of roots to generate
 * @param boundRadius Radius bound for the roots
 * @returns Array of strategically distributed initial guesses
 */
function generateStratifiedGuesses(coeffs: number[], numRoots: number, boundRadius: number): Complex[] {
  const guesses: Complex[] = [];
  const n = numRoots;
  
  // Use stratified sampling for better coverage
  // Create "shells" of different radii
  const numShells = Math.min(5, Math.floor(Math.sqrt(n)));
  const pointsPerShell = Math.ceil(n / numShells);
  
  // Distribute points across shells
  for (let shell = 0; shell < numShells; shell++) {
    // Calculate radius for this shell
    const shellRadius = 0.2 + (boundRadius - 0.2) * (shell / (numShells - 1));
    
    // Points to add to this shell
    const pointsToAdd = Math.min(pointsPerShell, n - guesses.length);
    
    for (let i = 0; i < pointsToAdd; i++) {
      // Distribute angles within shell
      const baseAngle = (2 * Math.PI * i) / pointsToAdd;
      const jitter = (0.5 / pointsToAdd) * (Math.random() - 0.5); // Small jitter
      const angle = baseAngle + jitter;
      
      // Add some radial variation
      const radialJitter = shellRadius * 0.1 * (Math.random() - 0.5);
      const radius = shellRadius + radialJitter;
      
      guesses.push({
        re: radius * Math.cos(angle),
        im: radius * Math.sin(angle)
      });
    }
  }
  
  // If we still need more points, add them with random distribution
  while (guesses.length < n) {
    const angle = 2 * Math.PI * Math.random();
    const radius = boundRadius * Math.random();
    
    guesses.push({
      re: radius * Math.cos(angle),
      im: radius * Math.sin(angle)
    });
  }
  
  return guesses;
}

/**
 * Check if a polynomial is ill-conditioned
 * @param coeffs Polynomial coefficients
 * @returns Boolean indicating if the polynomial is likely ill-conditioned
 */
function checkPolynomialCondition(coeffs: number[]): boolean {
  // Check coefficient variation
  let maxCoeff = 0;
  let minNonZeroCoeff = Infinity;
  
  for (const coeff of coeffs) {
    const magnitude = Math.abs(coeff);
    if (magnitude > 1e-14) {
      maxCoeff = Math.max(maxCoeff, magnitude);
      minNonZeroCoeff = Math.min(minNonZeroCoeff, magnitude);
    }
  }
  
  const coeffRatio = maxCoeff / minNonZeroCoeff;
  
  // Check for alternating large coefficients (potential for cancellation issues)
  let alternatingCount = 0;
  let previousSign = Math.sign(coeffs[0]);
  
  for (let i = 1; i < coeffs.length; i++) {
    const currentSign = Math.sign(coeffs[i]);
    if (currentSign !== 0 && currentSign !== previousSign) {
      alternatingCount++;
    }
    if (currentSign !== 0) {
      previousSign = currentSign;
    }
  }
  
  const alternatingRatio = alternatingCount / (coeffs.length - 1);
  
  // A polynomial is likely ill-conditioned if it has extreme coefficient variations
  // or many sign changes with large magnitudes
  return coeffRatio > 1e8 || (alternatingRatio > 0.7 && coeffRatio > 1e4);
}

/**
 * Check if a root has converged to sufficient accuracy
 * @param coeffs Polynomial coefficients
 * @param root Root to check
 * @param tolerance Convergence tolerance
 * @returns Boolean indicating if the root has converged
 */
function isRootConverged(coeffs: number[], root: Complex, tolerance: number): boolean {
  const pValue = evaluatePolynomial(coeffs, root);
  return complexMagnitude(pValue) < tolerance;
}

/**
 * Deflate a polynomial by dividing by (x - root)
 * @param coeffs Polynomial coefficients
 * @param root Root to deflate by
 * @returns Coefficients of the deflated polynomial
 */
function deflatePolynomial(coeffs: number[], root: Complex): number[] {
  // Synthetic division for a complex root
  // If root = a + bi, we're dividing by (x - (a + bi))
  const n = coeffs.length;
  const result: number[] = new Array(n - 1).fill(0);
  
  // If the root is purely real, use a simpler algorithm
  if (Math.abs(root.im) < 1e-14) {
    // Real synthetic division
    result[0] = coeffs[0];
    for (let i = 1; i < n - 1; i++) {
      result[i] = coeffs[i] + result[i - 1] * root.re;
    }
    return result;
  }
  
  // For complex roots, use complex synthetic division
  // This gets more complicated
  let prev: Complex = { re: coeffs[0], im: 0 };
  result[0] = coeffs[0];
  
  for (let i = 1; i < n - 1; i++) {
    // Multiply previous result by root
    const product = complexMultiply(prev, root);
    
    // Add current coefficient
    const newValue: Complex = {
      re: coeffs[i] + product.re,
      im: product.im
    };
    
    // Store real part in result (complex part should be negligible)
    result[i] = newValue.re;
    
    // Update prev for next iteration
    prev = newValue;
  }
  
  return result;
}

/**
 * Apply Weierstrass correction to improve convergence
 * @param roots Current root estimates
 * @param coeffs Polynomial coefficients
 */
function applyWeierstrassCorrection(roots: Complex[], coeffs: number[]): void {
  const n = roots.length;
  
  // Apply Weierstrass iteration to all roots
  for (let i = 0; i < n; i++) {
    const { value, derivative } = evaluatePolynomialAndDerivative(coeffs, roots[i]);
    
    if (complexMagnitude(derivative) < 1e-14) {
      // Skip if derivative is too small
      continue;
    }
    
    // Weierstrass correction factor
    let correctionSum: Complex = { re: 0, im: 0 };
    
    for (let j = 0; j < n; j++) {
      if (j !== i) {
        // Calculate 1/(z_i - z_j)
        const diff = complexSubtract(roots[i], roots[j]);
        if (complexMagnitude(diff) < 1e-14) {
          // Avoid division by near-zero
          continue;
        }
        const reciprocal = complexReciprocal(diff);
        correctionSum = complexAdd(correctionSum, reciprocal);
      }
    }
    
    // Newton term: p(z_i)/p'(z_i)
    const newtonTerm = complexDivide(value, derivative);
    
    // Full Weierstrass correction
    const correction = complexDivide(newtonTerm, 
                                  { re: 1 - complexMultiply(newtonTerm, correctionSum).re, 
                                    im: -complexMultiply(newtonTerm, correctionSum).im });
    
    // Apply correction with damping
    const dampingFactor = 0.5; // Adjust for stability
    const scaledCorrection = {
      re: correction.re * dampingFactor,
      im: correction.im * dampingFactor
    };
    
    // Update root
    roots[i] = complexSubtract(roots[i], scaledCorrection);
  }
}

/**
 * Apply a more aggressive perturbation for persistent stagnation
 * @param roots Current root estimates
 * @param coeffs Polynomial coefficients 
 */
function aggressivePerturbation(roots: Complex[], coeffs: number[]): void {
  const n = roots.length;
  
  // Compute the average magnitude of roots
  let avgMagnitude = 0;
  for (const root of roots) {
    avgMagnitude += complexMagnitude(root);
  }
  avgMagnitude /= n;
  
  // Apply a stronger, more diverse perturbation
  for (let i = 0; i < n; i++) {
    // Different perturbation strategies based on index
    if (i % 3 === 0) {
      // Rotate the root significantly
      const magnitude = complexMagnitude(roots[i]);
      const angle = Math.atan2(roots[i].im, roots[i].re) + (Math.PI / 2) * (Math.random() - 0.5);
      roots[i] = {
        re: magnitude * Math.cos(angle),
        im: magnitude * Math.sin(angle)
      };
    } else if (i % 3 === 1) {
      // Scale the root magnitude significantly
      const magnitude = complexMagnitude(roots[i]);
      const angle = Math.atan2(roots[i].im, roots[i].re);
      const newMagnitude = magnitude * (0.5 + Math.random());
      roots[i] = {
        re: newMagnitude * Math.cos(angle),
        im: newMagnitude * Math.sin(angle)
      };
    } else {
      // Apply a large random perturbation
      roots[i] = {
        re: roots[i].re + avgMagnitude * 0.3 * (Math.random() - 0.5),
        im: roots[i].im + avgMagnitude * 0.3 * (Math.random() - 0.5)
      };
    }
  }
}

/**
 * Evaluate the accuracy of a root
 * @param coeffs Polynomial coefficients
 * @param root Root to evaluate
 * @returns Magnitude of polynomial evaluated at the root (smaller is better)
 */
function evaluateRootAccuracy(coeffs: number[], root: Complex): number {
  return complexMagnitude(evaluatePolynomial(coeffs, root));
}

/**
 * Polish a root using Laguerre's method
 * This method is more robust for multiple roots
 * @param coeffs Polynomial coefficients
 * @param rootEstimate Initial root estimate
 * @returns Polished root
 */
function polishRootLaguerre(coeffs: number[], rootEstimate: Complex): Complex {
  const MAX_ITERATIONS = 20;
  const TOLERANCE = 1e-14;
  const n = coeffs.length - 1;
  
  let z = { ...rootEstimate };
  
  for (let iter = 0; iter < MAX_ITERATIONS; iter++) {
    // Evaluate polynomial and its derivatives
    const p = evaluatePolynomial(coeffs, z);
    
    // Check for convergence
    if (complexMagnitude(p) < TOLERANCE) {
      return z;
    }
    
    const p1 = evaluatePolynomial(derivePolynomial(coeffs), z);
    const p2 = evaluatePolynomial(derivePolynomial(derivePolynomial(coeffs)), z);
    
    // Calculate G and H for Laguerre's method
    const G = complexDivide(p1, p);
    const G2 = complexMultiply(G, G);
    const H = complexSubtract(G2, complexDivide(p2, p));
    
    // Calculate discriminant
    const discriminant1 = complexMultiply({ re: n - 1, im: 0 }, complexMultiply({ re: n, im: 0 }, H));
    const discriminant2 = complexMultiply({ re: n - 1, im: 0 }, G2);
    const discriminant = complexSubtract(discriminant1, discriminant2);
    
    // Calculate square root of discriminant
    const sqrtDisc = {
      re: Math.sqrt(complexMagnitude(discriminant)),
      im: 0
    };
    
    if (discriminant.re < 0) {
      sqrtDisc.im = sqrtDisc.re;
      sqrtDisc.re = 0;
    }
    
    // Choose the larger denominator for better numerical stability
    const denom1 = complexAdd(G, sqrtDisc);
    const denom2 = complexSubtract(G, sqrtDisc);
    const useDenom1 = complexMagnitude(denom1) >= complexMagnitude(denom2);
    
    // Calculate a
    const a = complexDivide({ re: n, im: 0 }, useDenom1 ? denom1 : denom2);
    
    // Update z
    z = complexSubtract(z, a);
    
    // Check for small step size
    if (complexMagnitude(a) < TOLERANCE) {
      return z;
    }
  }
  
  return z;
}

/**
 * Update roots sequentially using the Aberth-Ehrlich iteration
 * @param roots Current root estimates
 * @param coeffs Polynomial coefficients
 * @param n Polynomial degree
 */
function updateRootsSequentially(roots: Complex[], coeffs: number[], n: number): void {
  for (let i = 0; i < n; i++) {
    try {
      // Calculate Newton correction term: p(z) / p'(z)
      const { value: p, derivative: dp } = evaluatePolynomialAndDerivative(coeffs, roots[i]);
      
      // Protect against division by zero or very small derivative
      if (complexMagnitude(dp) < 1e-14) {
        // Slightly perturb the root estimate
        roots[i] = { 
          re: roots[i].re + 0.01 * (Math.random() - 0.5), 
          im: roots[i].im + 0.01 * (Math.random() - 0.5) 
        };
        continue;
      }
      
      // Calculate standard Newton term
      const newtonTerm = complexDivide(p, dp);
      
      // Calculate sum of inverse distances to other roots
      let sum: Complex = { re: 0, im: 0 };
      for (let j = 0; j < n; j++) {
        if (i !== j) {
          try {
            // Calculate z_i - z_j
            const diff = complexSubtract(roots[i], roots[j]);
            
            // Avoid division by very small values
            if (complexMagnitude(diff) < 1e-14) {
              continue;
            }
            
            // Add 1 / (z_i - z_j) to sum
            sum = complexAdd(sum, complexReciprocal(diff));
          } catch (error) {
            // Skip this term if there's a numerical issue
            continue;
          }
        }
      }
      
      // Calculate Aberth correction: w_i = N_i / (1 - N_i * sum)
      const numerator = newtonTerm;
      const denominator = complexSubtract(
        { re: 1, im: 0 },
        complexMultiply(newtonTerm, sum)
      );
      
      // Check if denominator is too small
      if (complexMagnitude(denominator) < 1e-14) {
        // Fall back to just Newton's method with damping
        const dampingFactor = Math.min(1.0, 1.0 / complexMagnitude(newtonTerm));
        const dampedNewton = { 
          re: newtonTerm.re * dampingFactor, 
          im: newtonTerm.im * dampingFactor 
        };
        roots[i] = complexSubtract(roots[i], dampedNewton);
      } else {
        // Apply Aberth correction with relaxation for better convergence
        const aberthTerm = complexDivide(numerator, denominator);
        const relaxation = 1.0; // Can be adjusted for faster convergence
        const relaxedTerm = {
          re: aberthTerm.re * relaxation,
          im: aberthTerm.im * relaxation
        };
        const newRoot = complexSubtract(roots[i], relaxedTerm);
        
        // Update the root
        roots[i] = newRoot;
      }
    } catch (error) {
      // Handle any numerical issues gracefully
      console.warn(`Numerical issue at root ${i}: ${error}`);
      continue;
    }
  }
}

/**
 * Update roots using parallel computation for better performance
 * This is a simplified simulation of parallel processing
 * @param roots Current root estimates
 * @param coeffs Polynomial coefficients
 * @param n Polynomial degree
 */
function updateRootsInParallel(roots: Complex[], coeffs: number[], n: number): void {
  // In a real parallel implementation, this would distribute work across threads/workers
  // Here we simulate it by computing corrections first, then applying them all at once
  
  // Prepare arrays to store corrections
  const corrections: (Complex | null)[] = Array(n).fill(null);
  
  // Phase 1: Compute all corrections
  for (let i = 0; i < n; i++) {
    try {
      // Calculate Newton correction and Aberth terms
      const { value: p, derivative: dp } = evaluatePolynomialAndDerivative(coeffs, roots[i]);
      
      if (complexMagnitude(dp) < 1e-14) {
        // Invalid derivative - mark for random perturbation
        corrections[i] = null;
        continue;
      }
      
      // Calculate standard Newton term
      const newtonTerm = complexDivide(p, dp);
      
      // Calculate sum of inverse distances to other roots
      let sum: Complex = { re: 0, im: 0 };
      for (let j = 0; j < n; j++) {
        if (i !== j) {
          const diff = complexSubtract(roots[i], roots[j]);
          if (complexMagnitude(diff) >= 1e-14) {
            sum = complexAdd(sum, complexReciprocal(diff));
          }
        }
      }
      
      // Calculate Aberth correction
      const denominator = complexSubtract(
        { re: 1, im: 0 },
        complexMultiply(newtonTerm, sum)
      );
      
      if (complexMagnitude(denominator) < 1e-14) {
        // Fall back to damped Newton method
        const dampingFactor = Math.min(1.0, 1.0 / complexMagnitude(newtonTerm));
        corrections[i] = {
          re: newtonTerm.re * dampingFactor,
          im: newtonTerm.im * dampingFactor
        };
      } else {
        // Full Aberth-Ehrlich correction
        corrections[i] = complexDivide(newtonTerm, denominator);
      }
    } catch (error) {
      // Mark as invalid correction
      corrections[i] = null;
    }
  }
  
  // Phase 2: Apply all corrections simultaneously
  for (let i = 0; i < n; i++) {
    if (corrections[i] === null) {
      // Apply random perturbation for failed calculations
      roots[i] = { 
        re: roots[i].re + 0.01 * (Math.random() - 0.5), 
        im: roots[i].im + 0.01 * (Math.random() - 0.5) 
      };
    } else {
      // Apply the correction
      const correction = corrections[i] as Complex; // Type assertion since we checked it's not null
      roots[i] = complexSubtract(roots[i], correction);
    }
  }
}

/**
 * Apply acceleration to root updates for faster convergence
 * @param roots Current root estimates
 * @param previousRoots Previous root estimates
 * @param factor Acceleration factor
 */
function applyAcceleration(roots: Complex[], previousRoots: Complex[], factor: number): void {
  for (let i = 0; i < roots.length; i++) {
    // Calculate current update
    const update = complexSubtract(roots[i], previousRoots[i]);
    
    // Apply acceleration by extrapolating in the direction of update
    const scaledUpdate = {
      re: update.re * (factor - 1.0),
      im: update.im * (factor - 1.0)
    };
    const accelerated = complexAdd(roots[i], scaledUpdate);
    
    // Update the root with the accelerated value
    roots[i] = accelerated;
  }
}

/**
 * Check if convergence is stagnating
 * @param recentChanges Recent maximum changes in roots
 * @returns Whether convergence appears to be stagnating
 */
function isConvergenceStagnating(recentChanges: number[]): boolean {
  if (recentChanges.length < 3) return false;
  
  // Calculate rates of improvement
  const improvements: number[] = [];
  for (let i = 1; i < recentChanges.length; i++) {
    improvements.push(recentChanges[i-1] / Math.max(recentChanges[i], STAGNATION_THRESHOLD));
  }
  
  // If improvement rates are getting close to 1, convergence is slowing
  const averageImprovement = improvements.reduce((a, b) => a + b, 0) / improvements.length;
  return averageImprovement < 1.1; // Less than 10% improvement per iteration
}

/**
 * Apply targeted perturbation to roots to escape stagnation
 * @param roots Current root estimates
 * @param iteration Current iteration number
 */
function perturbRoots(roots: Complex[], iteration: number): void {
  // Apply different perturbation strategies based on iteration count
  const perturbFactor = 0.01 * Math.pow(0.9, Math.floor(iteration / 10)); // Decreasing perturbation
  
  for (let i = 0; i < roots.length; i++) {
    // Only perturb a subset of roots to maintain some stability
    if (i % 3 === iteration % 3) {
      roots[i] = {
        re: roots[i].re * (1 + perturbFactor * (Math.random() - 0.5)),
        im: roots[i].im * (1 + perturbFactor * (Math.random() - 0.5))
      };
    }
  }
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
  
  if (Math.abs(discriminant) < 1e-14) {
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
 * Polish a root estimate using a few iterations of Newton's method
 * @param coeffs Polynomial coefficients
 * @param rootEstimate Initial root estimate
 * @returns Polished root
 */
function polishRoot(coeffs: number[], rootEstimate: Complex): Complex {
  let root = { ...rootEstimate };
  const maxIterations = 5;
  const tolerance = 1e-14;
  
  for (let i = 0; i < maxIterations; i++) {
    const { value, derivative } = evaluatePolynomialAndDerivative(coeffs, root);
    
    // Check if already converged
    if (complexMagnitude(value) < tolerance) {
      return root;
    }
    
    // Protect against division by zero or very small derivative
    if (complexMagnitude(derivative) < 1e-14) {
      return root;
    }
    
    // Newton step
    const correction = complexDivide(value, derivative);
    const newRoot = complexSubtract(root, correction);
    
    // Check for convergence
    const change = complexMagnitude(complexSubtract(newRoot, root));
    if (change < tolerance) {
      return newRoot;
    }
    
    root = newRoot;
  }
  
  return root;
}

/**
 * Remove duplicate roots within a specified tolerance
 * @param roots Array of root estimates
 * @param coeffs Original polynomial coefficients
 * @param tolerance Tolerance for considering roots as duplicates
 * @returns Array of unique roots
 */
function removeDuplicateRoots(roots: Complex[], coeffs: number[], tolerance: number): Complex[] {
  const uniqueRoots: Complex[] = [];
  const degree = coeffs.length - 1;
  
  // Evaluate polynomial at each root to rank by accuracy
  const rootErrors: { root: Complex, error: number }[] = roots.map(root => ({
    root,
    error: complexMagnitude(evaluatePolynomial(coeffs, root))
  }));
  
  // Sort by error (ascending)
  rootErrors.sort((a, b) => a.error - b.error);
  
  // Take the most accurate roots that aren't duplicates
  for (const { root } of rootErrors) {
    // Check if this root is a duplicate of an already accepted root
    const isDuplicate = uniqueRoots.some(existingRoot => 
      complexMagnitude(complexSubtract(existingRoot, root)) < tolerance
    );
    
    if (!isDuplicate) {
      uniqueRoots.push(root);
      
      // Stop when we have enough roots
      if (uniqueRoots.length >= degree) {
        break;
      }
    }
  }
  
  // If we found fewer roots than the degree, add the remaining best approximations
  if (uniqueRoots.length < degree) {
    for (const { root } of rootErrors) {
      const isDuplicate = uniqueRoots.some(existingRoot => 
        complexMagnitude(complexSubtract(existingRoot, root)) < tolerance
      );
      
      if (!isDuplicate) {
        uniqueRoots.push(root);
        
        if (uniqueRoots.length >= degree) {
          break;
        }
      }
    }
  }
  
  return uniqueRoots;
} 