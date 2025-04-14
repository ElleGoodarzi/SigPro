import { FilterParams, FilterResponse, WindowType } from '../types/filterTypes';

// Sinc function (sin(x)/x)
export const sinc = (x: number): number => {
  if (Math.abs(x) < 1e-10) return 1.0;
  return Math.sin(Math.PI * x) / (Math.PI * x);
};

// Kronecker delta function
export const delta = (n: number): number => (n === 0 ? 1.0 : 0.0);

// Complex number operations
class Complex {
  constructor(public re: number, public im: number) {}

  static add(a: Complex, b: Complex): Complex {
    return new Complex(a.re + b.re, a.im + b.im);
  }

  static multiply(a: Complex, b: Complex): Complex {
    return new Complex(
      a.re * b.re - a.im * b.im,
      a.re * b.im + a.im * b.re
    );
  }

  static divide(a: Complex, b: Complex): Complex {
    const denominator = b.re * b.re + b.im * b.im;
    return new Complex(
      (a.re * b.re + a.im * b.im) / denominator,
      (a.im * b.re - a.re * b.im) / denominator
    );
  }

  static magnitude(a: Complex): number {
    return Math.sqrt(a.re * a.re + a.im * a.im);
  }

  static phase(a: Complex): number {
    return Math.atan2(a.im, a.re);
  }
}

// Window functions
export const getWindowFunction = (type: WindowType, param: number = 0) => {
  switch (type) {
    case 'rectangular':
      return (n: number, length: number) => 1.0;
    
    case 'hamming':
      return (n: number, length: number) => 
        0.54 - 0.46 * Math.cos(2 * Math.PI * n / (length - 1));
    
    case 'hanning':
      return (n: number, length: number) => 
        0.5 * (1 - Math.cos(2 * Math.PI * n / (length - 1)));
    
    case 'blackman':
      return (n: number, length: number) => {
        const a0 = 0.42;
        const a1 = 0.5;
        const a2 = 0.08;
        return a0 - a1 * Math.cos(2 * Math.PI * n / (length - 1)) + 
               a2 * Math.cos(4 * Math.PI * n / (length - 1));
      };
    
    case 'kaiser':
      return (n: number, length: number, beta = param) => {
        const bessel = (x: number): number => {
          // 0th order modified Bessel function of the first kind
          // Using the series approximation (sufficient for window function)
          let sum = 1.0;
          let term = 1.0;
          for (let i = 1; i <= 20; i++) {
            term *= (x * x) / (4 * i * i);
            sum += term;
            if (term < 1e-10) break;
          }
          return sum;
        };
        
        const alpha = (length - 1) / 2;
        const m = n - alpha;
        const denom = bessel(beta);
        const x = beta * Math.sqrt(1 - Math.pow(m / alpha, 2));
        
        return bessel(x) / denom;
      };
    
    default:
      return (n: number, length: number) => 1.0;
  }
};

// Generate ideal filter impulse response based on filter type and parameters
export const calculateIdealFilter = (params: FilterParams): FilterResponse => {
  const { type, cutoffFrequency, cutoffFrequency2, windowLength = 101 } = params;
  
  // Ensure window length is odd to have a symmetric impulse response
  const length = windowLength % 2 === 0 ? windowLength + 1 : windowLength;
  const halfLength = Math.floor(length / 2);
  
  // Calculate normalized cutoff frequencies (0 to 1, where 1 is π radians)
  const wc1 = cutoffFrequency; // Already normalized in UI
  const wc2 = cutoffFrequency2 || 0.5; // Default if not specified
  
  // Initialize arrays
  const impulseResponse: number[] = [];
  const timeIndices: number[] = [];
  
  // Calculate impulse response based on filter type
  for (let i = 0; i < length; i++) {
    const n = i - halfLength; // Center around zero
    timeIndices.push(n);
    
    let h = 0;
    
    switch (type) {
      case 'lowpass':
        h = wc1 * sinc(wc1 * n);
        break;
        
      case 'highpass':
        h = delta(n) - wc1 * sinc(wc1 * n);
        break;
        
      case 'bandpass':
        h = wc2 * sinc(wc2 * n) - wc1 * sinc(wc1 * n);
        break;
        
      case 'bandstop':
        h = delta(n) - wc2 * sinc(wc2 * n) + wc1 * sinc(wc1 * n);
        break;
    }
    
    // Apply a Hamming window to reduce Gibbs phenomenon
    const windowFactor = 0.54 - 0.46 * Math.cos(2 * Math.PI * i / (length - 1));
    impulseResponse.push(h * windowFactor);
  }
  
  return calculateFrequencyResponse(impulseResponse, timeIndices);
};

// Design FIR filter using window method
export const calculateFIRFilter = (params: FilterParams): FilterResponse => {
  const { 
    type, 
    cutoffFrequency, 
    cutoffFrequency2, 
    windowLength = 101,
    windowType = 'hamming',
    kaiserBeta = 4.0
  } = params;
  
  // Ensure window length is odd to have a symmetric impulse response
  const length = windowLength % 2 === 0 ? windowLength + 1 : windowLength;
  const halfLength = Math.floor(length / 2);
  
  // Calculate normalized cutoff frequencies (0 to 1, where 1 is π radians)
  const wc1 = cutoffFrequency; // Already normalized in UI
  const wc2 = cutoffFrequency2 || 0.5; // Default if not specified
  
  // Initialize arrays
  const impulseResponse: number[] = [];
  const timeIndices: number[] = [];
  
  // Get window function
  const windowFunc = getWindowFunction(windowType as WindowType, kaiserBeta);
  
  // Calculate impulse response based on filter type
  for (let i = 0; i < length; i++) {
    const n = i - halfLength; // Center around zero
    timeIndices.push(n);
    
    let h = 0;
    
    switch (type) {
      case 'lowpass':
        h = wc1 * sinc(wc1 * n);
        break;
        
      case 'highpass':
        h = delta(n) - wc1 * sinc(wc1 * n);
        break;
        
      case 'bandpass':
        h = wc2 * sinc(wc2 * n) - wc1 * sinc(wc1 * n);
        break;
        
      case 'bandstop':
        h = delta(n) - wc2 * sinc(wc2 * n) + wc1 * sinc(wc1 * n);
        break;
    }
    
    // Apply window function
    const windowFactor = windowFunc(i, length, kaiserBeta);
    impulseResponse.push(h * windowFactor);
  }
  
  return calculateFrequencyResponse(impulseResponse, timeIndices);
};

// Calculate IIR filter coefficients - Butterworth
const butterworthCoefficients = (order: number, cutoff: number, type: 'lowpass' | 'highpass'): [number[], number[]] => {
  // Butterworth poles are equally spaced around the unit circle in the s-plane
  // For a lowpass filter with cutoff wc, the poles are at s_k = wc * exp(j*pi*(2*k+n-1)/(2*n))
  // where n is the filter order and k = 1,2,...,n
  
  const poles: Complex[] = [];
  const wc = Math.tan(Math.PI * cutoff / 2); // Pre-warping for bilinear transform
  
  // Calculate analog prototype poles
  for (let k = 0; k < order; k++) {
    const angle = Math.PI * (2 * k + order - 1) / (2 * order);
    const re = -wc * Math.cos(angle);
    const im = wc * Math.sin(angle);
    poles.push(new Complex(re, im));
  }
  
  // Apply bilinear transform to get digital filter
  return bilinearTransform(poles, [], wc, type);
};

// Calculate IIR filter coefficients - Chebyshev Type I
const chebyshev1Coefficients = (
  order: number, 
  cutoff: number, 
  ripple: number, 
  type: 'lowpass' | 'highpass'
): [number[], number[]] => {
  // Chebyshev Type I has ripple in the passband
  // Poles calculated using: s_k = sinh(v)*sin(theta_k) + j*cosh(v)*cos(theta_k)
  // where v = asinh(1/epsilon)/order, epsilon = sqrt(10^(ripple/10) - 1)
  
  const poles: Complex[] = [];
  const epsilon = Math.sqrt(Math.pow(10, ripple / 10) - 1);
  const v = Math.asinh(1 / epsilon) / order;
  const wc = Math.tan(Math.PI * cutoff / 2); // Pre-warping
  
  for (let k = 0; k < order; k++) {
    const theta = Math.PI * (2 * k + 1) / (2 * order);
    const re = -wc * Math.sinh(v) * Math.sin(theta);
    const im = wc * Math.cosh(v) * Math.cos(theta);
    poles.push(new Complex(re, im));
  }
  
  // Apply bilinear transform to get digital filter
  return bilinearTransform(poles, [], wc, type);
};

// Calculate IIR filter coefficients - Chebyshev Type II
const chebyshev2Coefficients = (
  order: number, 
  cutoff: number, 
  attenuation: number, 
  type: 'lowpass' | 'highpass'
): [number[], number[]] => {
  // Chebyshev Type II has ripple in the stopband
  // Zeros and poles calculated based on attenuation
  
  const poles: Complex[] = [];
  const zeros: Complex[] = [];
  
  const epsilon = 1 / Math.sqrt(Math.pow(10, attenuation / 10) - 1);
  const v = Math.asinh(1 / epsilon) / order;
  const wc = Math.tan(Math.PI * cutoff / 2); // Pre-warping
  
  // Calculate zeros
  for (let k = 0; k < order; k++) {
    const theta = Math.PI * (2 * k + 1) / (2 * order);
    const zero = new Complex(0, wc / Math.cos(theta));
    if (Math.abs(zero.im) < 1e10) { // Filter out zeros at infinity
      zeros.push(zero);
    }
  }
  
  // Calculate poles
  for (let k = 0; k < order; k++) {
    const theta = Math.PI * (2 * k + 1) / (2 * order);
    const re = -wc * Math.sinh(v) * Math.sin(theta) / (Math.pow(Math.sin(theta), 2) + Math.pow(Math.sinh(v), 2) * Math.pow(Math.cos(theta), 2));
    const im = wc * Math.cosh(v) * Math.cos(theta) / (Math.pow(Math.sin(theta), 2) + Math.pow(Math.sinh(v), 2) * Math.pow(Math.cos(theta), 2));
    poles.push(new Complex(re, im));
  }
  
  // Apply bilinear transform to get digital filter
  return bilinearTransform(poles, zeros, wc, type);
};

// Calculate IIR filter coefficients - Elliptic
const ellipticCoefficients = (
  order: number, 
  cutoff: number, 
  ripple: number, 
  attenuation: number, 
  type: 'lowpass' | 'highpass'
): [number[], number[]] => {
  // Simple approximation of elliptic filter using poles and zeros
  // A full implementation would require complete elliptic integrals
  
  const poles: Complex[] = [];
  const zeros: Complex[] = [];
  
  const wc = Math.tan(Math.PI * cutoff / 2); // Pre-warping
  
  // Calculate approximate poles and zeros
  const epsilon = Math.sqrt(Math.pow(10, ripple / 10) - 1);
  const v = Math.asinh(1 / epsilon) / order;
  
  // Zeros approximation (based on Chebyshev II)
  for (let k = 0; k < order; k++) {
    const theta = Math.PI * (2 * k + 1) / (2 * order);
    const zero = new Complex(0, wc / Math.cos(theta));
    if (Math.abs(zero.im) < 1e10) {
      zeros.push(zero);
    }
  }
  
  // Poles approximation (combination of Chebyshev I and II)
  for (let k = 0; k < order; k++) {
    const theta = Math.PI * (2 * k + 1) / (2 * order);
    // Modified factor to account for both passband and stopband ripple
    const factor = 0.5 * (1 + Math.sqrt(1 + Math.pow(epsilon, 2)));
    const re = -wc * Math.sinh(v) * Math.sin(theta) * factor;
    const im = wc * Math.cosh(v) * Math.cos(theta) * factor;
    poles.push(new Complex(re, im));
  }
  
  // Apply bilinear transform to get digital filter
  return bilinearTransform(poles, zeros, wc, type);
};

// Apply bilinear transform to convert analog filter to digital
const bilinearTransform = (
  poles: Complex[], 
  zeros: Complex[], 
  wc: number, 
  type: 'lowpass' | 'highpass'
): [number[], number[]] => {
  const digitalPoles: Complex[] = [];
  const digitalZeros: Complex[] = [];
  
  // Transform poles
  for (const pole of poles) {
    const numerator = new Complex(1, 0);
    let denominator = new Complex(1, 0);
    
    if (type === 'lowpass') {
      denominator = Complex.add(numerator, pole);
    } else {
      denominator = Complex.add(numerator, Complex.multiply(pole, new Complex(-1, 0)));
    }
    
    const digitalPole = Complex.divide(
      Complex.add(numerator, Complex.multiply(pole, new Complex(-1, 0))),
      denominator
    );
    
    digitalPoles.push(digitalPole);
  }
  
  // Transform zeros or add zeros at z = -1 for highpass
  if (zeros.length > 0) {
    for (const zero of zeros) {
      const numerator = new Complex(1, 0);
      let denominator = new Complex(1, 0);
      
      if (type === 'lowpass') {
        denominator = Complex.add(numerator, zero);
      } else {
        denominator = Complex.add(numerator, Complex.multiply(zero, new Complex(-1, 0)));
      }
      
      const digitalZero = Complex.divide(
        Complex.add(numerator, Complex.multiply(zero, new Complex(-1, 0))),
        denominator
      );
      
      digitalZeros.push(digitalZero);
    }
  } else {
    // Add zeros at z = -1 for highpass or z = 1 for lowpass
    for (let i = 0; i < poles.length; i++) {
      if (type === 'highpass') {
        digitalZeros.push(new Complex(-1, 0));
      } else {
        digitalZeros.push(new Complex(1, 0));
      }
    }
  }
  
  // Convert poles and zeros to filter coefficients
  const b = convertZerosToCoefficients(digitalZeros);
  const a = convertPolesToCoefficients(digitalPoles);
  
  // Normalize to make a[0] = 1
  const a0 = a[0];
  for (let i = 0; i < a.length; i++) {
    a[i] /= a0;
  }
  for (let i = 0; i < b.length; i++) {
    b[i] /= a0;
  }
  
  return [b, a];
};

// Convert poles to denominator coefficients
const convertPolesToCoefficients = (poles: Complex[]): number[] => {
  let coeffs = [1];
  
  for (const pole of poles) {
    const term = [1, -2 * pole.re, pole.re * pole.re + pole.im * pole.im];
    coeffs = convolve(coeffs, term);
  }
  
  return coeffs;
};

// Convert zeros to numerator coefficients
const convertZerosToCoefficients = (zeros: Complex[]): number[] => {
  let coeffs = [1];
  
  for (const zero of zeros) {
    const term = [1, -2 * zero.re, zero.re * zero.re + zero.im * zero.im];
    coeffs = convolve(coeffs, term);
  }
  
  return coeffs;
};

// Convolution operation for polynomial multiplication
const convolve = (a: number[], b: number[]): number[] => {
  const result = new Array(a.length + b.length - 1).fill(0);
  
  for (let i = 0; i < a.length; i++) {
    for (let j = 0; j < b.length; j++) {
      result[i + j] += a[i] * b[j];
    }
  }
  
  return result;
};

// Calculate IIR filter response
export const calculateIIRFilter = (params: FilterParams): FilterResponse => {
  const { 
    type, 
    cutoffFrequency, 
    cutoffFrequency2,
    filterOrder = 4,
    iirMethod = 'butterworth',
    passbandRipple = 1,
    stopbandAttenuation = 40
  } = params;
  
  let b: number[] = [];
  let a: number[] = [];
  
  // Single band filters (lowpass, highpass)
  if (type === 'lowpass' || type === 'highpass') {
    switch (iirMethod) {
      case 'butterworth':
        [b, a] = butterworthCoefficients(filterOrder, cutoffFrequency, type as 'lowpass' | 'highpass');
        break;
      case 'chebyshev1':
        [b, a] = chebyshev1Coefficients(filterOrder, cutoffFrequency, passbandRipple, type as 'lowpass' | 'highpass');
        break;
      case 'chebyshev2':
        [b, a] = chebyshev2Coefficients(filterOrder, cutoffFrequency, stopbandAttenuation, type as 'lowpass' | 'highpass');
        break;
      case 'elliptic':
        [b, a] = ellipticCoefficients(filterOrder, cutoffFrequency, passbandRipple, stopbandAttenuation, type as 'lowpass' | 'highpass');
        break;
    }
  } 
  // Multi-band filters (bandpass, bandstop)
  else if (type === 'bandpass' || type === 'bandstop') {
    // Create bandpass/bandstop by transforming lowpass prototype
    const wc1 = cutoffFrequency;
    const wc2 = cutoffFrequency2 || 0.5;
    
    // For bandpass/bandstop, create an appropriate lowpass prototype
    let lpPrototype: [number[], number[]];
    
    switch (iirMethod) {
      case 'butterworth':
        lpPrototype = butterworthCoefficients(filterOrder, 0.5, 'lowpass');
        break;
      case 'chebyshev1':
        lpPrototype = chebyshev1Coefficients(filterOrder, 0.5, passbandRipple, 'lowpass');
        break;
      case 'chebyshev2':
        lpPrototype = chebyshev2Coefficients(filterOrder, 0.5, stopbandAttenuation, 'lowpass');
        break;
      case 'elliptic':
        lpPrototype = ellipticCoefficients(filterOrder, 0.5, passbandRipple, stopbandAttenuation, 'lowpass');
        break;
      default:
        lpPrototype = butterworthCoefficients(filterOrder, 0.5, 'lowpass');
    }
    
    // Transform lowpass to bandpass/bandstop (simplified approach)
    // Note: A full implementation would use a more complex frequency transformation
    if (type === 'bandpass') {
      // Bandpass transformation - simplified by cascading lowpass and highpass
      const lpFilter = butterworthCoefficients(filterOrder, wc2, 'lowpass');
      const hpFilter = butterworthCoefficients(filterOrder, wc1, 'highpass');
      
      // Convolve the numerator and denominator coefficients
      b = convolve(lpFilter[0], hpFilter[0]);
      a = convolve(lpFilter[1], hpFilter[1]);
    } else {
      // Bandstop transformation - simplified by paralleling lowpass and highpass
      const lpFilter = butterworthCoefficients(filterOrder, wc1, 'lowpass');
      const hpFilter = butterworthCoefficients(filterOrder, wc2, 'highpass');
      
      // For parallel combination, we need to add the transfer functions
      // This is a simplified approach
      b = addPolynomials(
        multiplyPolynomials(lpFilter[0], hpFilter[1]),
        multiplyPolynomials(hpFilter[0], lpFilter[1])
      );
      a = multiplyPolynomials(lpFilter[1], hpFilter[1]);
    }
  }
  
  // Calculate impulse response from difference equation
  const impulseLength = 101; // Length for impulse response calculation
  const impulseResponse: number[] = [];
  const timeIndices: number[] = [];
  
  // Initialize with an impulse
  const x = new Array(impulseLength).fill(0);
  x[0] = 1;
  
  // Apply difference equation to calculate impulse response
  for (let n = 0; n < impulseLength; n++) {
    timeIndices.push(n);
    
    let y = 0;
    // Calculate y[n] = b[0]*x[n] + b[1]*x[n-1] + ... - a[1]*y[n-1] - a[2]*y[n-2] - ...
    for (let i = 0; i < b.length; i++) {
      if (n - i >= 0) {
        y += b[i] * x[n - i];
      }
    }
    
    for (let i = 1; i < a.length; i++) {
      if (n - i >= 0) {
        y -= a[i] * impulseResponse[n - i];
      }
    }
    
    impulseResponse.push(y);
  }
  
  // Get frequency response and add poles/zeros
  const response = calculateFrequencyResponse(impulseResponse, timeIndices);
  
  // Extract poles and zeros from coefficients
  const poles: { re: number; im: number }[] = [];
  const zeros: { re: number; im: number }[] = [];
  
  // Find roots of denominator (poles)
  const denomRoots = findRoots(a);
  for (const root of denomRoots) {
    poles.push({ re: root.re, im: root.im });
  }
  
  // Find roots of numerator (zeros)
  const numRoots = findRoots(b);
  for (const root of numRoots) {
    zeros.push({ re: root.re, im: root.im });
  }
  
  response.poles = poles;
  response.zeros = zeros;
  
  // Calculate group delay
  const groupDelay = calculateGroupDelay(b, a, response.frequencyResponse.frequencies);
  response.groupDelay = groupDelay;
  
  return response;
};

// Add two polynomials
const addPolynomials = (a: number[], b: number[]): number[] => {
  const result = new Array(Math.max(a.length, b.length)).fill(0);
  
  for (let i = 0; i < a.length; i++) {
    result[i] += a[i];
  }
  
  for (let i = 0; i < b.length; i++) {
    result[i] += b[i];
  }
  
  return result;
};

// Multiply two polynomials
const multiplyPolynomials = (a: number[], b: number[]): number[] => {
  return convolve(a, b);
};

// Find roots of a polynomial (simplified)
// Note: This is a very simplified root-finding method for demonstration
// A real implementation would use more robust methods like Bairstow's method
const findRoots = (coeffs: number[]): Complex[] => {
  const roots: Complex[] = [];
  
  // Handle simple cases directly
  if (coeffs.length <= 1) {
    return roots;
  }
  
  if (coeffs.length === 2) {
    // Linear polynomial: a*x + b = 0
    const a = coeffs[0];
    const b = coeffs[1];
    roots.push(new Complex(-b / a, 0));
    return roots;
  }
  
  if (coeffs.length === 3) {
    // Quadratic polynomial: a*x^2 + b*x + c = 0
    const a = coeffs[0];
    const b = coeffs[1];
    const c = coeffs[2];
    
    const discriminant = b * b - 4 * a * c;
    
    if (discriminant >= 0) {
      const sqrtDisc = Math.sqrt(discriminant);
      roots.push(new Complex((-b + sqrtDisc) / (2 * a), 0));
      roots.push(new Complex((-b - sqrtDisc) / (2 * a), 0));
    } else {
      const realPart = -b / (2 * a);
      const imagPart = Math.sqrt(-discriminant) / (2 * a);
      roots.push(new Complex(realPart, imagPart));
      roots.push(new Complex(realPart, -imagPart));
    }
    
    return roots;
  }
  
  // For higher order polynomials, we would need a proper algorithm
  // Here we just create some placeholder roots for visualization
  for (let i = 0; i < coeffs.length - 1; i++) {
    const angle = 2 * Math.PI * i / (coeffs.length - 1);
    const radius = 0.8;
    roots.push(new Complex(radius * Math.cos(angle), radius * Math.sin(angle)));
  }
  
  return roots;
};

// Calculate group delay
const calculateGroupDelay = (b: number[], a: number[], frequencies: number[]): number[] => {
  const groupDelay: number[] = [];
  
  for (const normalizedFreq of frequencies) {
    const omega = normalizedFreq * Math.PI;
    
    // Calculate the derivative of phase with respect to frequency
    // Group delay = -d(phase)/d(omega)
    // Using a numerical approximation of the derivative
    const delta = 0.001;
    const phase1 = calculatePhaseAtFrequency(b, a, omega - delta);
    const phase2 = calculatePhaseAtFrequency(b, a, omega + delta);
    
    // Note: We need to handle phase unwrapping
    let phaseDiff = phase2 - phase1;
    while (phaseDiff > Math.PI) phaseDiff -= 2 * Math.PI;
    while (phaseDiff < -Math.PI) phaseDiff += 2 * Math.PI;
    
    const delay = -phaseDiff / (2 * delta);
    groupDelay.push(delay);
  }
  
  return groupDelay;
};

// Calculate phase at a specific frequency
const calculatePhaseAtFrequency = (b: number[], a: number[], omega: number): number => {
  let numReal = 0;
  let numImag = 0;
  let denReal = 0;
  let denImag = 0;
  
  // Numerator
  for (let i = 0; i < b.length; i++) {
    numReal += b[i] * Math.cos(-i * omega);
    numImag += b[i] * Math.sin(-i * omega);
  }
  
  // Denominator
  for (let i = 0; i < a.length; i++) {
    denReal += a[i] * Math.cos(-i * omega);
    denImag += a[i] * Math.sin(-i * omega);
  }
  
  // Calculate H(ejω) = numerator / denominator
  const hReal = (numReal * denReal + numImag * denImag) / (denReal * denReal + denImag * denImag);
  const hImag = (numImag * denReal - numReal * denImag) / (denReal * denReal + denImag * denImag);
  
  return Math.atan2(hImag, hReal);
};

// Calculate filter frequency response
export const calculateFrequencyResponse = (
  impulseResponse: number[], 
  timeIndices: number[]
): FilterResponse => {
  // Calculate frequency response using DFT
  const frequencies: number[] = [];
  const magnitude: number[] = [];
  const phase: number[] = [];
  
  const numFreqPoints = 512;
  
  for (let k = 0; k < numFreqPoints; k++) {
    const omega = k * Math.PI / (numFreqPoints - 1); // 0 to π
    frequencies.push(omega / Math.PI); // Normalize to 0-1 for display
    
    let realPart = 0;
    let imagPart = 0;
    
    for (let n = 0; n < impulseResponse.length; n++) {
      const angle = omega * timeIndices[n];
      realPart += impulseResponse[n] * Math.cos(-angle);
      imagPart += impulseResponse[n] * Math.sin(-angle);
    }
    
    const mag = Math.sqrt(realPart * realPart + imagPart * imagPart);
    const pha = Math.atan2(imagPart, realPart);
    
    magnitude.push(mag);
    phase.push(pha);
  }
  
  return {
    impulseResponse,
    timeIndices,
    frequencyResponse: {
      magnitude,
      phase,
      frequencies
    }
  };
};

// Main filter calculation function
export const calculateFilter = (params: FilterParams): FilterResponse => {
  const { implementation } = params;
  
  switch (implementation) {
    case 'ideal':
      return calculateIdealFilter(params);
    case 'fir':
      return calculateFIRFilter(params);
    case 'iir':
      return calculateIIRFilter(params);
    default:
      return calculateIdealFilter(params);
  }
}; 