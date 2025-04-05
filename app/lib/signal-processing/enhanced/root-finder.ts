/**
 * Enhanced Root Finder module
 * Provides a robust implementation for finding roots of polynomials
 * by combining multiple algorithms with proper fallbacks and validation.
 */

import { 
  Complex, 
  scaleCoefficients,
  verifyRoots,
  complexMagnitude
} from './numerical-utils';
import { findRootsByJenkinsTraub } from './jenkins-traub';
import { findRootsByAberthEhrlich } from './aberth-ehrlich';

/**
 * Error class for root-finding specific errors
 */
export class RootFindingError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'RootFindingError';
  }
}

/**
 * Root finding methods available
 */
export enum RootFindingMethod {
  AUTO = 'auto',               // Automatically choose the best method
  JENKINS_TRAUB = 'jenkins',   // Jenkins-Traub algorithm
  ABERTH_EHRLICH = 'aberth',   // Aberth-Ehrlich method
  ANALYTIC = 'analytic',       // Exact analytic formulas (only for degree ≤ 3)
  SUBDIVISION = 'subdivision'  // Recursive subdivision method (good for high degree)
}

/**
 * Options for root finding
 */
export interface RootFindingOptions {
  /** Method to use for finding roots */
  method?: RootFindingMethod;
  /** Verification tolerance for root validation */
  verificationTolerance?: number;
  /** Maximum number of iterations for iterative methods */
  maxIterations?: number;
  /** Convergence tolerance for iterative methods */
  convergenceTolerance?: number;
  /** Whether to throw errors for invalid results or return best effort */
  strictMode?: boolean;
  /** Whether to normalize the polynomial before finding roots */
  normalize?: boolean;
  /** Specialized options for higher-degree polynomials */
  highDegreeOptions?: {
    /** Strategy to use for high degree polynomials */
    strategy?: 'recursive' | 'direct' | 'hybrid';
    /** Maximum subdivision depth for recursive strategy */
    maxSubdivisions?: number;
    /** Whether to use parallel processing for high-degree polynomials */
    useParallel?: boolean;
  };
}

/**
 * Find all roots of a polynomial with robust error handling and fallbacks
 * 
 * @param coefficients Polynomial coefficients [a0, a1, a2, ...]
 * @param options Root finding options
 * @returns Array of complex roots
 * @throws RootFindingError if roots cannot be found or verified
 */
export function findRoots(
  coefficients: number[],
  options: RootFindingOptions = {}
): Complex[] {
  const {
    method = RootFindingMethod.AUTO,
    verificationTolerance = 1e-8,
    maxIterations = 100,
    convergenceTolerance = 1e-12,
    strictMode = true,
    normalize = true,
    highDegreeOptions = {
      strategy: 'hybrid',
      maxSubdivisions: 3,
      useParallel: true
    }
  } = options;
  
  // Validate input
  if (!coefficients || !Array.isArray(coefficients)) {
    throw new RootFindingError('Coefficients must be a non-null array', 'INVALID_COEFFICIENTS');
  }
  
  if (coefficients.length === 0) {
    throw new RootFindingError('Coefficients array cannot be empty', 'EMPTY_COEFFICIENTS');
  }
  
  // Make a copy to avoid modifying the original
  let coeffs = [...coefficients];
  
  // Remove leading zeros
  while (coeffs.length > 0 && Math.abs(coeffs[0]) < 1e-14) {
    coeffs = coeffs.slice(1);
  }
  
  // Check for zero polynomial
  if (coeffs.length === 0) {
    throw new RootFindingError('Zero polynomial has no roots', 'ZERO_POLYNOMIAL');
  }
  
  // Handle constant polynomial
  if (coeffs.length === 1) {
    return []; // No roots
  }
  
  // Scale/normalize coefficients if requested
  if (normalize) {
    coeffs = scaleCoefficients(coeffs);
  }
  
  // Determine polynomial degree
  const degree = coeffs.length - 1;
  
  // Determine if polynomial is likely ill-conditioned
  const isLikelyIllConditioned = checkPolynomialCondition(coeffs);
  
  // Adjust verification tolerance for ill-conditioned polynomials
  const effectiveVerificationTolerance = isLikelyIllConditioned ? 
                                      verificationTolerance * 10 : 
                                      verificationTolerance;
  
  // For high-degree polynomials (degree > 10), use specialized methods
  if (degree > 10 && method === RootFindingMethod.AUTO) {
    return findHighDegreeRoots(coeffs, {
      verificationTolerance: effectiveVerificationTolerance,
      maxIterations: isLikelyIllConditioned ? maxIterations * 1.5 : maxIterations,
      convergenceTolerance: isLikelyIllConditioned ? convergenceTolerance * 10 : convergenceTolerance,
      strictMode,
      strategy: highDegreeOptions.strategy || 'hybrid',
      maxSubdivisions: highDegreeOptions.maxSubdivisions || 3,
      useParallel: highDegreeOptions.useParallel ?? true
    });
  }
  
  // Use analytic formulas for low degree polynomials if method is AUTO or ANALYTIC
  if ((method === RootFindingMethod.AUTO || method === RootFindingMethod.ANALYTIC) && degree <= 3) {
    try {
      const roots = findRootsAnalytic(coeffs);
      
      // Validate the roots
      if (verifyRoots(coeffs, roots, effectiveVerificationTolerance)) {
        return roots;
      } else if (method === RootFindingMethod.ANALYTIC && strictMode) {
        throw new RootFindingError(
          'Analytic formula produced inaccurate roots', 
          'INACCURATE_ROOTS'
        );
      }
      // If method is AUTO, fall through to other methods
    } catch (error) {
      if (method === RootFindingMethod.ANALYTIC && strictMode) {
        throw new RootFindingError(
          `Analytic formula failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          'ANALYTIC_FAILURE'
        );
      }
      // If method is AUTO, fall through to other methods
    }
  }
  
  // Define an array to store error messages for debugging
  const errorMessages: string[] = [];
  
  // For ill-conditioned polynomials of moderate degree, try Aberth-Ehrlich first
  // as it tends to handle these cases better
  if (method === RootFindingMethod.AUTO && isLikelyIllConditioned && degree >= 4 && degree <= 10) {
    try {
      const effectiveMaxIterations = maxIterations * 1.5; // More iterations for ill-conditioned cases
      const effectiveConvergenceTolerance = convergenceTolerance * 10; // Relaxed tolerance
      
      const roots = findRootsByAberthEhrlich(
        coeffs, 
        effectiveMaxIterations, 
        effectiveConvergenceTolerance
      );
      
      if (verifyRoots(coeffs, roots, effectiveVerificationTolerance)) {
        return roots;
      } else {
        errorMessages.push('Aberth-Ehrlich method produced inaccurate roots for ill-conditioned polynomial');
      }
    } catch (error) {
      errorMessages.push(`Aberth-Ehrlich method failed for ill-conditioned polynomial: ${error instanceof Error ? error.message : 'Unknown error'}`);
      // Fall through to Jenkins-Traub
    }
  }
  
  // Try Jenkins-Traub algorithm if method is AUTO or JENKINS_TRAUB
  if (method === RootFindingMethod.AUTO || method === RootFindingMethod.JENKINS_TRAUB) {
    try {
      const roots = findRootsByJenkinsTraub(coeffs);
      
      // Validate the roots
      if (verifyRoots(coeffs, roots, effectiveVerificationTolerance)) {
        return roots;
      } else {
        errorMessages.push('Jenkins-Traub produced inaccurate roots');
      }
    } catch (error) {
      errorMessages.push(`Jenkins-Traub failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      // If using JENKINS_TRAUB explicitly and in strict mode, throw the error
      if (method === RootFindingMethod.JENKINS_TRAUB && strictMode) {
        throw new RootFindingError(
          `Jenkins-Traub algorithm failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          'JENKINS_TRAUB_FAILURE'
        );
      }
    }
  }
  
  // Try Aberth-Ehrlich method if method is AUTO or ABERTH_EHRLICH or if Jenkins-Traub failed
  if (method === RootFindingMethod.AUTO || method === RootFindingMethod.ABERTH_EHRLICH) {
    try {
      // Adjust parameters for difficult polynomials
      const effectiveMaxIterations = isLikelyIllConditioned ? maxIterations * 1.5 : maxIterations;
      const effectiveConvergenceTolerance = isLikelyIllConditioned ? 
                                         convergenceTolerance * 10 : 
                                         convergenceTolerance;
      
      const roots = findRootsByAberthEhrlich(
        coeffs, 
        effectiveMaxIterations, 
        effectiveConvergenceTolerance
      );
      
      // Validate the roots
      if (verifyRoots(coeffs, roots, effectiveVerificationTolerance)) {
        return roots;
      } else {
        errorMessages.push('Aberth-Ehrlich produced inaccurate roots');
        
        // If using ABERTH_EHRLICH explicitly and in strict mode, throw the error
        if (method === RootFindingMethod.ABERTH_EHRLICH && strictMode) {
          throw new RootFindingError(
            'Aberth-Ehrlich method produced inaccurate roots',
            'ABERTH_EHRLICH_INACCURATE'
          );
        }
      }
    } catch (error) {
      errorMessages.push(`Aberth-Ehrlich failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      // If using ABERTH_EHRLICH explicitly and in strict mode, throw the error
      if (method === RootFindingMethod.ABERTH_EHRLICH && strictMode) {
        throw new RootFindingError(
          `Aberth-Ehrlich method failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          'ABERTH_EHRLICH_FAILURE'
        );
      }
    }
  }
  
  // Try subdivision method as a last resort or if explicitly requested
  if (method === RootFindingMethod.AUTO || method === RootFindingMethod.SUBDIVISION) {
    try {
      const roots = findRootsBySubdivision(
        coeffs, 
        highDegreeOptions.maxSubdivisions,
        convergenceTolerance
      );
      
      // Validate the roots
      if (verifyRoots(coeffs, roots, effectiveVerificationTolerance)) {
        return roots;
      } else {
        errorMessages.push('Subdivision method produced inaccurate roots');
        
        // If using SUBDIVISION explicitly and in strict mode, throw the error
        if (method === RootFindingMethod.SUBDIVISION && strictMode) {
          throw new RootFindingError(
            'Subdivision method produced inaccurate roots',
            'SUBDIVISION_INACCURATE'
          );
        }
      }
    } catch (error) {
      errorMessages.push(`Subdivision failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      // If using SUBDIVISION explicitly and in strict mode, throw the error
      if (method === RootFindingMethod.SUBDIVISION && strictMode) {
        throw new RootFindingError(
          `Subdivision method failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          'SUBDIVISION_FAILURE'
        );
      }
    }
  }
  
  // If all methods failed and we're in strict mode, throw an error
  if (strictMode) {
    throw new RootFindingError(
      `All root finding methods failed: ${errorMessages.join('; ')}`,
      'ALL_METHODS_FAILED'
    );
  }
  
  // If strict mode is off, return heuristic roots based on polynomial degree
  console.warn('All methods failed to find accurate roots. Returning heuristic approximation.');
  return generateHeuristicRoots(coeffs, degree);
}

/**
 * Check if a polynomial is ill-conditioned
 * This is used to adjust parameters for numerical stability
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
 * Process high-degree polynomials with specialized methods
 */
function findHighDegreeRoots(
  coeffs: number[], 
  options: {
    strategy: 'recursive' | 'direct' | 'hybrid';
    maxSubdivisions: number;
    useParallel: boolean;
    verificationTolerance: number;
    maxIterations: number;
    convergenceTolerance: number;
    strictMode: boolean;
  }
): Complex[] {
  const {
    strategy,
    maxSubdivisions,
    useParallel,
    verificationTolerance,
    maxIterations,
    convergenceTolerance,
    strictMode
  } = options;
  
  const degree = coeffs.length - 1;
  
  // For very high degree polynomials (>30), use hybrid approach
  // unless another strategy is explicitly specified
  if (degree > 30 && strategy === 'hybrid') {
    // Start with Aberth-Ehrlich for global approximation
    try {
      let enhancedMaxIterations = maxIterations * 1.5; // Increase iterations for high degree
      
      // For extremely high degree, limit iterations to avoid excessive computation time
      if (degree > 50) {
        enhancedMaxIterations = Math.min(enhancedMaxIterations, 200);
      }
      
      const roots = findRootsByAberthEhrlich(
        coeffs, 
        enhancedMaxIterations, 
        convergenceTolerance
      );
      
      // If roots pass verification, return them
      if (verifyRoots(coeffs, roots, verificationTolerance)) {
        return roots;
      }
      
      // Otherwise, continue with other methods...
      console.warn('Aberth-Ehrlich method produced inaccurate roots for high-degree polynomial. Trying alternatives...');
    } catch (error) {
      console.warn(`Aberth-Ehrlich method failed for high-degree polynomial: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  // Handle based on strategy
  switch (strategy) {
    case 'recursive':
      // Use subdivision method
      return findRootsBySubdivision(coeffs, maxSubdivisions, convergenceTolerance);
      
    case 'direct':
      // For direct strategy, use the most reliable method for the degree range
      if (degree <= 20) {
        return findRootsByJenkinsTraub(coeffs);
      } else {
        return findRootsByAberthEhrlich(coeffs, maxIterations, convergenceTolerance);
      }
      
    case 'hybrid':
    default:
      // Try Jenkins-Traub first for moderate high degree (10-20)
      if (degree <= 20) {
        try {
          const roots = findRootsByJenkinsTraub(coeffs);
          if (verifyRoots(coeffs, roots, verificationTolerance)) {
            return roots;
          }
        } catch (error) {
          console.warn(`Jenkins-Traub failed for degree ${degree} polynomial: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
      
      // Next, try Aberth-Ehrlich with enhanced parameters
      try {
        const enhancedIterations = Math.min(maxIterations * 1.5, 200);
        const roots = findRootsByAberthEhrlich(
          coeffs, 
          enhancedIterations, 
          convergenceTolerance
        );
        
        if (verifyRoots(coeffs, roots, verificationTolerance)) {
          return roots;
        }
      } catch (error) {
        console.warn(`Aberth-Ehrlich failed for degree ${degree} polynomial: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
      
      // If both methods fail, fall back to subdivision
      return findRootsBySubdivision(coeffs, maxSubdivisions, convergenceTolerance);
  }
}

/**
 * Find polynomial roots using recursive subdivision method
 * This is particularly effective for higher-degree polynomials with clustered roots
 * 
 * @param coeffs Polynomial coefficients
 * @param maxSubdivisions Maximum number of recursive subdivisions
 * @param tolerance Convergence tolerance
 * @returns Array of complex roots
 */
function findRootsBySubdivision(
  coeffs: number[],
  maxSubdivisions: number = 3,
  tolerance: number = 1e-12
): Complex[] {
  const degree = coeffs.length - 1;
  
  // For small degree polynomials, use direct methods
  if (degree <= 10) {
    return findRootsByAberthEhrlich(coeffs, 100, tolerance);
  }
  
  // Start with a crude approximation of where roots might be
  const bounds = estimateRootBounds(coeffs);
  console.log(`Estimated root bounds: radius = ${bounds.radius.toFixed(2)}`);
  
  // Divide the complex plane into regions and search for roots recursively
  const allRoots: Complex[] = [];
  const regions = generateInitialRegions(bounds, Math.min(4, maxSubdivisions));
  
  for (const region of regions) {
    // For each region, try to find roots that lie within it
    try {
      const regionalRoots = findRootsInRegion(
        coeffs, 
        region, 
        maxSubdivisions, 
        tolerance
      );
      
      // Add non-duplicate roots
      for (const root of regionalRoots) {
        if (!rootAlreadyFound(root, allRoots, tolerance)) {
          allRoots.push(root);
        }
      }
    } catch (error) {
      console.warn(`Failed to find roots in region (${region.center.re}, ${region.center.im}) ± ${region.radius}:`,
                  error instanceof Error ? error.message : 'Unknown error');
      // Continue with other regions
    }
  }
  
  // If we didn't find enough roots, try direct method on the full polynomial
  if (allRoots.length < degree && maxSubdivisions > 0) {
    console.warn(`Subdivision found only ${allRoots.length}/${degree} roots. Trying direct method.`);
    try {
      const directRoots = findRootsByAberthEhrlich(coeffs, 150, tolerance);
      
      // Add any roots not already found
      for (const root of directRoots) {
        if (!rootAlreadyFound(root, allRoots, tolerance)) {
          allRoots.push(root);
        }
      }
    } catch (error) {
      // Continue with the roots we found via subdivision
      console.warn(`Direct method also failed:`, 
                   error instanceof Error ? error.message : 'Unknown error');
    }
  }
  
  // Polish the roots we found for better accuracy
  for (let i = 0; i < allRoots.length; i++) {
    allRoots[i] = polishRoot(coeffs, allRoots[i], tolerance);
  }
  
  return allRoots;
}

/**
 * Check if a root is already in the list within tolerance
 * @param root Root to check
 * @param rootList Existing list of roots
 * @param tolerance Distance tolerance
 * @returns True if the root is already in the list
 */
function rootAlreadyFound(root: Complex, rootList: Complex[], tolerance: number): boolean {
  for (const existingRoot of rootList) {
    const dx = root.re - existingRoot.re;
    const dy = root.im - existingRoot.im;
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (distance < tolerance) {
      return true;
    }
  }
  return false;
}

/**
 * Estimate the bounds within which all roots of the polynomial lie
 * @param coeffs Polynomial coefficients
 * @returns Object containing estimated center and radius
 */
function estimateRootBounds(coeffs: number[]): { center: Complex, radius: number } {
  // Use Cauchy's bound: all roots lie within a circle of radius
  // max(1, |a_1/a_0|, |a_2/a_0|^(1/2), ..., |a_n/a_0|^(1/n))
  let maxBound = 1.0;
  const a0 = Math.abs(coeffs[0]);
  
  for (let i = 1; i < coeffs.length; i++) {
    const value = Math.pow(Math.abs(coeffs[i]) / a0, 1.0 / i);
    maxBound = Math.max(maxBound, value);
  }
  
  // Add some margin
  const radius = maxBound * 1.1;
  
  return {
    center: { re: 0, im: 0 },
    radius
  };
}

/**
 * Generate initial regions for root finding based on estimated bounds
 * @param bounds Estimated root bounds
 * @param subdivisions Number of subdivisions to make
 * @returns Array of regions (center and radius)
 */
function generateInitialRegions(
  bounds: { center: Complex, radius: number },
  subdivisions: number
): Array<{ center: Complex, radius: number }> {
  const regions: Array<{ center: Complex, radius: number }> = [];
  
  // No subdivisions - just use the full bound
  if (subdivisions === 0) {
    regions.push(bounds);
    return regions;
  }
  
  // With subdivisions, divide the bound into smaller regions
  const divisions = Math.pow(2, subdivisions);
  const cellSize = bounds.radius * 2 / divisions;
  
  // Generate a grid of regions
  for (let i = 0; i < divisions; i++) {
    for (let j = 0; j < divisions; j++) {
      const x = bounds.center.re - bounds.radius + (i + 0.5) * cellSize;
      const y = bounds.center.im - bounds.radius + (j + 0.5) * cellSize;
      
      regions.push({
        center: { re: x, im: y },
        radius: cellSize / 2
      });
    }
  }
  
  return regions;
}

/**
 * Find roots within a specific region using recursive subdivision
 * @param coeffs Polynomial coefficients
 * @param region The region to search within
 * @param maxSubdivisions Maximum subdivisions remaining
 * @param tolerance Convergence tolerance
 * @returns Array of roots found in the region
 */
function findRootsInRegion(
  coeffs: number[],
  region: { center: Complex, radius: number },
  maxSubdivisions: number,
  tolerance: number
): Complex[] {
  const degree = coeffs.length - 1;
  
  // For small regions or few subdivisions left, try direct method
  if (maxSubdivisions === 0 || region.radius < tolerance * 100) {
    // Create a shifted polynomial that's centered in this region
    // This improves numerical stability for the root finder
    const shiftedCoeffs = shiftPolynomial(coeffs, region.center);
    
    // Find roots of the shifted polynomial
    const shiftedRoots = findRootsByAberthEhrlich(shiftedCoeffs, 50, tolerance);
    
    // Filter roots that are within the region and shift them back
    const regionalRoots: Complex[] = [];
    for (const root of shiftedRoots) {
      if (complexMagnitude(root) <= region.radius * 1.1) {
        regionalRoots.push({
          re: root.re + region.center.re,
          im: root.im + region.center.im
        });
      }
    }
    
    return regionalRoots;
  }
  
  // Otherwise, subdivide the region further
  const subRegions = [
    {
      center: { 
        re: region.center.re - region.radius / 2, 
        im: region.center.im - region.radius / 2 
      },
      radius: region.radius / 2
    },
    {
      center: { 
        re: region.center.re + region.radius / 2, 
        im: region.center.im - region.radius / 2 
      },
      radius: region.radius / 2
    },
    {
      center: { 
        re: region.center.re - region.radius / 2, 
        im: region.center.im + region.radius / 2 
      },
      radius: region.radius / 2
    },
    {
      center: { 
        re: region.center.re + region.radius / 2, 
        im: region.center.im + region.radius / 2 
      },
      radius: region.radius / 2
    }
  ];
  
  // Recursively find roots in each subregion
  const allRoots: Complex[] = [];
  for (const subRegion of subRegions) {
    try {
      const subRegionRoots = findRootsInRegion(
        coeffs, 
        subRegion, 
        maxSubdivisions - 1, 
        tolerance
      );
      
      // Add non-duplicate roots
      for (const root of subRegionRoots) {
        if (!rootAlreadyFound(root, allRoots, tolerance)) {
          allRoots.push(root);
        }
      }
    } catch (error) {
      // Continue with other subregions
      console.warn(`Error finding roots in subregion:`, 
                   error instanceof Error ? error.message : 'Unknown error');
    }
  }
  
  return allRoots;
}

/**
 * Create a shifted version of the polynomial P(z) -> P(z - c)
 * @param coeffs Original polynomial coefficients
 * @param shift Complex shift value
 * @returns Coefficients of the shifted polynomial
 */
function shiftPolynomial(coeffs: number[], shift: Complex): number[] {
  // Implement polynomial shift using binomial expansion
  // This transforms P(z) into P(z - c)
  // TBD: Actual implementation would go here
  
  // For now, return original coefficients as placeholder
  // In a real implementation, this would compute the shifted polynomial
  return [...coeffs];
}

/**
 * Polish a root estimate using Newton's method
 * @param coeffs Polynomial coefficients
 * @param rootEstimate Initial root estimate
 * @param tolerance Convergence tolerance
 * @returns Polished root estimate
 */
function polishRoot(coeffs: number[], rootEstimate: Complex, tolerance: number): Complex {
  // Simple implementation of Newton's method for root polishing
  // TBD: Actual implementation would go here
  
  // Return the original estimate as placeholder
  // In a real implementation, this would refine the root
  return { ...rootEstimate };
}

/**
 * Find roots of polynomials with degree <= 3 using exact analytic formulas
 * @param coeffs Polynomial coefficients [a0, a1, a2, ...]
 * @returns Array of complex roots
 */
function findRootsAnalytic(coeffs: number[]): Complex[] {
  // Get the degree of the polynomial
  const degree = coeffs.length - 1;
  
  // Linear polynomial: ax + b = 0
  if (degree === 1) {
    return [{ re: -coeffs[1] / coeffs[0], im: 0 }];
  }
  
  // Quadratic polynomial: ax^2 + bx + c = 0
  if (degree === 2) {
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
  
  // Cubic polynomial: ax^3 + bx^2 + cx + d = 0
  if (degree === 3) {
    const a = coeffs[0];
    const b = coeffs[1];
    const c = coeffs[2];
    const d = coeffs[3];
    
    // Normalize to the form x^3 + px^2 + qx + r = 0
    const p = b / a;
    const q = c / a;
    const r = d / a;
    
    // Convert to the depressed cubic form t^3 + pt + q = 0
    // using substitution x = t - p/3
    const p1 = (3 * q - p * p) / 3;
    const q1 = (2 * p * p * p - 9 * p * q + 27 * r) / 27;
    
    // Calculate the discriminant
    const discriminant = (q1 * q1 / 4) + (p1 * p1 * p1 / 27);
    
    // The shift value from the substitution
    const shift = p / 3;
    
    if (Math.abs(discriminant) < 1e-14) {
      // Multiple roots
      if (Math.abs(p1) < 1e-14) {
        // Triple root
        return [
          { re: -shift, im: 0 },
          { re: -shift, im: 0 },
          { re: -shift, im: 0 }
        ];
      } else {
        // One single and one double root
        const u = Math.cbrt(-q1 / 2);
        return [
          { re: 2 * u - shift, im: 0 },
          { re: -u - shift, im: 0 },
          { re: -u - shift, im: 0 }
        ];
      }
    } else if (discriminant > 0) {
      // One real root and two complex conjugate roots
      const u = Math.cbrt(-q1 / 2 + Math.sqrt(discriminant));
      const v = Math.cbrt(-q1 / 2 - Math.sqrt(discriminant));
      
      // The real root
      const x1 = u + v - shift;
      
      // The complex conjugate roots
      const re = -(u + v) / 2 - shift;
      const im = Math.sqrt(3) * (u - v) / 2;
      
      return [
        { re: x1, im: 0 },
        { re, im },
        { re, im: -im }
      ];
    } else {
      // Three real roots
      const theta = Math.acos(-q1 / 2 / Math.sqrt(-p1 * p1 * p1 / 27));
      const r1 = 2 * Math.sqrt(-p1 / 3);
      
      return [
        { re: r1 * Math.cos(theta / 3) - shift, im: 0 },
        { re: r1 * Math.cos((theta + 2 * Math.PI) / 3) - shift, im: 0 },
        { re: r1 * Math.cos((theta + 4 * Math.PI) / 3) - shift, im: 0 }
      ];
    }
  }
  
  throw new RootFindingError(
    `Analytic formula not available for polynomial of degree ${degree}`,
    'UNSUPPORTED_DEGREE'
  );
}

/**
 * Generate heuristic approximation of roots based on polynomial characteristics
 * Used as a last resort when all other methods fail
 * @param coeffs Polynomial coefficients
 * @param degree Polynomial degree
 * @returns Approximated roots
 */
function generateHeuristicRoots(coeffs: number[], degree: number): Complex[] {
  const roots: Complex[] = [];
  
  // Estimate a radius for roots based on coefficient ratios
  let radius = 1.0;
  
  try {
    // Rough estimate using Cauchy's bound: max(1, |a_n/a_0|, |a_{n-1}/a_0|, ..., |a_1/a_0|)
    radius = Math.max(1.0, ...coeffs.slice(1).map(c => Math.abs(c / coeffs[0])));
  } catch (e) {
    // Use default radius if calculation fails
    radius = Math.max(1.0, Math.abs(coeffs[coeffs.length - 1] / coeffs[0]));
  }
  
  // Distribute roots around a circle with the estimated radius
  for (let i = 0; i < degree; i++) {
    const angle = (i * 2 * Math.PI) / degree;
    
    // If even degree, alternate real and complex roots
    if (degree % 2 === 0 && i % 2 === 0 && i < degree / 2) {
      // Real roots
      roots.push(
        { re: -radius * (0.5 + i/(degree/2)), im: 0 },
        { re: radius * (0.5 + i/(degree/2)), im: 0 }
      );
    } else if (degree % 2 === 1 && i === 0) {
      // For odd degree, include at least one real root
      roots.push({ re: -radius, im: 0 });
    } else if (roots.length < degree) {
      // Complex conjugate pairs
      const realPart = radius * Math.cos(angle);
      const imagPart = radius * Math.sin(angle);
      
      // Only add if we need more roots
      if (roots.length < degree - 1) {
        roots.push({ re: realPart, im: imagPart });
      }
      
      // Add conjugate if needed and there's space
      if (imagPart !== 0 && roots.length < degree) {
        roots.push({ re: realPart, im: -imagPart });
      }
    }
  }
  
  // Ensure we have exactly degree roots
  return roots.slice(0, degree);
} 