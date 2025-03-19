/**
 * Digital filter utilities for signal processing
 */

export type FilterType = 'lowpass' | 'highpass' | 'bandpass' | 'bandstop';

export interface FilterOptions {
  order?: number;         // Filter order
  ripple?: number;        // Passband ripple in dB (for Chebyshev filters)
  oversample?: number;    // Oversampling factor for better filter response
}

/**
 * Creates FIR filter coefficients using the windowed-sinc method
 */
export function designFIRFilter(
  type: FilterType, 
  cutoffFreq: number | [number, number], 
  fs: number,
  options: FilterOptions = {}
): number[] {
  const { order = 64, oversample = 1 } = options;
  
  // Ensure filter order is even
  const M = order % 2 === 0 ? order : order + 1;
  
  // Normalized cutoff frequency(ies)
  let fc1: number, fc2: number;
  
  if (typeof cutoffFreq === 'number') {
    fc1 = cutoffFreq / fs;
    fc2 = fc1;
  } else {
    [fc1, fc2] = [cutoffFreq[0] / fs, cutoffFreq[1] / fs];
  }
  
  // Apply oversampling
  fc1 *= oversample;
  fc2 *= oversample;
  
  // Allocate filter coefficients array
  const h = new Array(M + 1).fill(0);
  
  // Design filter based on type
  switch (type) {
    case 'lowpass':
      // Lowpass filter
      for (let i = 0; i <= M; i++) {
        if (i === M / 2) {
          h[i] = 2 * fc1;
        } else {
          const x = i - M / 2;
          h[i] = Math.sin(2 * Math.PI * fc1 * x) / (Math.PI * x);
        }
      }
      break;
      
    case 'highpass':
      // Highpass filter (spectral inversion of lowpass)
      for (let i = 0; i <= M; i++) {
        if (i === M / 2) {
          h[i] = 1 - 2 * fc1;
        } else {
          const x = i - M / 2;
          h[i] = -Math.sin(2 * Math.PI * fc1 * x) / (Math.PI * x);
        }
      }
      break;
      
    case 'bandpass':
      // Bandpass filter
      for (let i = 0; i <= M; i++) {
        if (i === M / 2) {
          h[i] = 2 * (fc2 - fc1);
        } else {
          const x = i - M / 2;
          h[i] = Math.sin(2 * Math.PI * fc2 * x) / (Math.PI * x) -
                 Math.sin(2 * Math.PI * fc1 * x) / (Math.PI * x);
        }
      }
      break;
      
    case 'bandstop':
      // Bandstop filter
      for (let i = 0; i <= M; i++) {
        if (i === M / 2) {
          h[i] = 1 - 2 * (fc2 - fc1);
        } else {
          const x = i - M / 2;
          h[i] = Math.sin(2 * Math.PI * fc1 * x) / (Math.PI * x) -
                 Math.sin(2 * Math.PI * fc2 * x) / (Math.PI * x);
        }
      }
      break;
  }
  
  // Apply Hamming window
  for (let i = 0; i <= M; i++) {
    h[i] *= 0.54 - 0.46 * Math.cos(2 * Math.PI * i / M);
  }
  
  // Normalize to ensure unity gain at DC for lowpass
  // or unity gain at Nyquist for highpass
  let sum = 0;
  for (let i = 0; i <= M; i++) {
    sum += h[i];
  }
  
  if (type === 'lowpass' || type === 'highpass') {
    for (let i = 0; i <= M; i++) {
      h[i] /= sum;
    }
  }
  
  return h;
}

/**
 * Applies a FIR filter to a signal
 */
export function applyFIRFilter(signal: number[], coefficients: number[]): number[] {
  const output = new Array(signal.length).fill(0);
  const M = coefficients.length - 1;
  
  // Apply filter
  for (let n = 0; n < signal.length; n++) {
    for (let k = 0; k <= M; k++) {
      if (n - k >= 0) {
        output[n] += coefficients[k] * signal[n - k];
      }
    }
  }
  
  return output;
}

/**
 * Creates Butterworth IIR filter coefficients
 * Simplified implementation for 2nd order filters
 */
export function designButterworthFilter(
  type: FilterType,
  cutoffFreq: number | [number, number],
  fs: number,
  options: FilterOptions = {}
): { a: number[], b: number[] } {
  const { order = 2 } = options;
  
  // Normalized cutoff frequency(ies)
  let fc1: number, fc2: number;
  
  if (typeof cutoffFreq === 'number') {
    fc1 = cutoffFreq / (fs / 2); // Normalize to Nyquist frequency
    fc2 = fc1;
  } else {
    [fc1, fc2] = [cutoffFreq[0] / (fs / 2), cutoffFreq[1] / (fs / 2)];
  }
  
  // Constrast to [0,1]
  fc1 = Math.max(0.001, Math.min(0.999, fc1));
  fc2 = Math.max(0.001, Math.min(0.999, fc2));
  
  // Filter coefficients (for a simple 2nd order filter)
  let a: number[], b: number[];
  
  switch (type) {
    case 'lowpass':
      // Second-order lowpass Butterworth filter
      {
        const c = 1 / Math.tan(Math.PI * fc1 / 2);
        const c2 = c * c;
        const sqrt2c = Math.SQRT2 * c;
        
        b = [1 / (1 + sqrt2c + c2), 2 / (1 + sqrt2c + c2), 1 / (1 + sqrt2c + c2)];
        a = [1, 2 * (1 - c2) / (1 + sqrt2c + c2), (1 - sqrt2c + c2) / (1 + sqrt2c + c2)];
      }
      break;
      
    case 'highpass':
      // Second-order highpass Butterworth filter
      {
        const c = Math.tan(Math.PI * fc1 / 2);
        const c2 = c * c;
        const sqrt2c = Math.SQRT2 * c;
        
        b = [1 / (1 + sqrt2c + c2), -2 / (1 + sqrt2c + c2), 1 / (1 + sqrt2c + c2)];
        a = [1, 2 * (c2 - 1) / (1 + sqrt2c + c2), (1 - sqrt2c + c2) / (1 + sqrt2c + c2)];
      }
      break;
      
    case 'bandpass':
      // Basic bandpass filter (not a true Butterworth implementation)
      {
        const bw = fc2 - fc1;
        const c = 1 / Math.tan(Math.PI * bw / 2);
        const d = 2 * Math.cos(Math.PI * (fc1 + fc2) / 2);
        
        b = [1 / (1 + c), 0, -1 / (1 + c)];
        a = [1, -d / (1 + c), (1 - c) / (1 + c)];
      }
      break;
      
    case 'bandstop':
      // Basic bandstop filter (not a true Butterworth implementation)
      {
        const bw = fc2 - fc1;
        const c = Math.tan(Math.PI * bw / 2);
        const d = 2 * Math.cos(Math.PI * (fc1 + fc2) / 2);
        
        b = [(1 + c) / (1 + c), -d / (1 + c), (1 + c) / (1 + c)];
        a = [1, -d / (1 + c), (1 - c) / (1 + c)];
      }
      break;
      
    default:
      a = [1];
      b = [1];
  }
  
  return { a, b };
}

/**
 * Applies an IIR filter to a signal
 */
export function applyIIRFilter(
  signal: number[], 
  coefficients: { a: number[], b: number[] }
): number[] {
  const { a, b } = coefficients;
  const output = new Array(signal.length).fill(0);
  
  // Apply filter
  for (let n = 0; n < signal.length; n++) {
    // Apply feedforward coefficients (b)
    for (let j = 0; j < b.length; j++) {
      if (n - j >= 0) {
        output[n] += b[j] * signal[n - j];
      }
    }
    
    // Apply feedback coefficients (a), skipping a[0] which is assumed to be 1
    for (let j = 1; j < a.length; j++) {
      if (n - j >= 0) {
        output[n] -= a[j] * output[n - j];
      }
    }
  }
  
  return output;
}

/**
 * Applies a moving average filter to a signal (simple FIR lowpass)
 */
export function movingAverage(signal: number[], windowSize: number): number[] {
  const output = new Array(signal.length).fill(0);
  
  // Create moving average coefficients (all equal)
  const coef = new Array(windowSize).fill(1 / windowSize);
  
  // Apply filter
  for (let n = 0; n < signal.length; n++) {
    for (let k = 0; k < windowSize; k++) {
      if (n - k >= 0) {
        output[n] += coef[k] * signal[n - k];
      }
    }
  }
  
  return output;
} 