/**
 * Signal generation utilities for MATLAB-like functionality
 */

export interface SignalOptions {
  phase?: number;       // Phase offset in radians
  amplitude?: number;   // Signal amplitude
  dcOffset?: number;    // DC offset to add to signal
}

/**
 * Generate a sine wave signal
 */
export function sineWave(
  frequency: number, 
  duration: number, 
  fs: number, 
  options: SignalOptions = {}
): number[] {
  const { phase = 0, amplitude = 1, dcOffset = 0 } = options;
  const numSamples = Math.floor(duration * fs);
  const signal = new Array(numSamples);
  
  for (let i = 0; i < numSamples; i++) {
    const t = i / fs;
    signal[i] = amplitude * Math.sin(2 * Math.PI * frequency * t + phase) + dcOffset;
  }
  
  return signal;
}

/**
 * Generate a cosine wave signal
 */
export function cosineWave(
  frequency: number, 
  duration: number, 
  fs: number, 
  options: SignalOptions = {}
): number[] {
  const { phase = 0, amplitude = 1, dcOffset = 0 } = options;
  const numSamples = Math.floor(duration * fs);
  const signal = new Array(numSamples);
  
  for (let i = 0; i < numSamples; i++) {
    const t = i / fs;
    signal[i] = amplitude * Math.cos(2 * Math.PI * frequency * t + phase) + dcOffset;
  }
  
  return signal;
}

/**
 * Generate a square wave signal
 */
export function squareWave(
  frequency: number, 
  duration: number, 
  fs: number, 
  options: SignalOptions = {}
): number[] {
  const { phase = 0, amplitude = 1, dcOffset = 0 } = options;
  const numSamples = Math.floor(duration * fs);
  const signal = new Array(numSamples);
  
  for (let i = 0; i < numSamples; i++) {
    const t = i / fs;
    const value = Math.sin(2 * Math.PI * frequency * t + phase) >= 0 ? 1 : -1;
    signal[i] = amplitude * value + dcOffset;
  }
  
  return signal;
}

/**
 * Generate a sawtooth wave signal
 */
export function sawtoothWave(
  frequency: number, 
  duration: number, 
  fs: number, 
  options: SignalOptions = {}
): number[] {
  const { phase = 0, amplitude = 1, dcOffset = 0 } = options;
  const numSamples = Math.floor(duration * fs);
  const signal = new Array(numSamples);
  
  for (let i = 0; i < numSamples; i++) {
    const t = i / fs;
    // Normalized to [-1, 1]
    const periodPos = ((frequency * t + phase / (2 * Math.PI)) % 1);
    const value = 2 * periodPos - 1;
    signal[i] = amplitude * value + dcOffset;
  }
  
  return signal;
}

/**
 * Generate a triangle wave signal
 */
export function triangleWave(
  frequency: number, 
  duration: number, 
  fs: number, 
  options: SignalOptions = {}
): number[] {
  const { phase = 0, amplitude = 1, dcOffset = 0 } = options;
  const numSamples = Math.floor(duration * fs);
  const signal = new Array(numSamples);
  
  for (let i = 0; i < numSamples; i++) {
    const t = i / fs;
    // Normalized to [0, 1]
    const periodPos = ((frequency * t + phase / (2 * Math.PI)) % 1);
    // Convert to [-1, 1] triangle
    const value = periodPos < 0.5 
      ? 4 * periodPos - 1 
      : 3 - 4 * periodPos;
    
    signal[i] = amplitude * value + dcOffset;
  }
  
  return signal;
}

/**
 * Generate Gaussian white noise
 */
export function gaussianNoise(
  duration: number, 
  fs: number, 
  amplitude: number = 1
): number[] {
  const numSamples = Math.floor(duration * fs);
  const signal = new Array(numSamples);
  
  for (let i = 0; i < numSamples; i++) {
    // Box-Muller transform for Gaussian distribution
    const u1 = Math.random();
    const u2 = Math.random();
    const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    signal[i] = amplitude * z0;
  }
  
  return signal;
}

/**
 * Generate a chirp signal (frequency sweep)
 */
export function chirp(
  startFreq: number,
  endFreq: number,
  duration: number,
  fs: number,
  method: 'linear' | 'logarithmic' = 'linear',
  options: SignalOptions = {}
): number[] {
  const { amplitude = 1, dcOffset = 0 } = options;
  const numSamples = Math.floor(duration * fs);
  const signal = new Array(numSamples);
  
  if (method === 'linear') {
    // Linear frequency sweep
    const slope = (endFreq - startFreq) / duration;
    
    for (let i = 0; i < numSamples; i++) {
      const t = i / fs;
      // Instantaneous frequency: f(t) = f0 + k*t
      // Phase: φ(t) = 2π∫f(t)dt = 2π(f0*t + k*t²/2)
      const phase = 2 * Math.PI * (startFreq * t + 0.5 * slope * t * t);
      signal[i] = amplitude * Math.sin(phase) + dcOffset;
    }
  } else {
    // Logarithmic frequency sweep
    if (startFreq <= 0 || endFreq <= 0) {
      throw new Error('Logarithmic chirp requires positive frequencies');
    }
    
    const logRatio = Math.log(endFreq / startFreq);
    
    for (let i = 0; i < numSamples; i++) {
      const t = i / fs;
      // For logarithmic chirp: f(t) = f0 * (f1/f0)^(t/T)
      // Phase: φ(t) = 2π∫f(t)dt = 2π*f0*T*((f1/f0)^(t/T) - 1)/ln(f1/f0)
      const phase = 2 * Math.PI * startFreq * duration * 
                   (Math.pow(endFreq / startFreq, t / duration) - 1) / logRatio;
      signal[i] = amplitude * Math.sin(phase) + dcOffset;
    }
  }
  
  return signal;
}

/**
 * Generate a sinc pulse (sin(x)/x)
 */
export function sincPulse(
  cutoffFreq: number,
  duration: number,
  fs: number,
  options: SignalOptions = {}
): number[] {
  const { amplitude = 1, dcOffset = 0 } = options;
  const numSamples = Math.floor(duration * fs);
  const signal = new Array(numSamples);
  
  const normalizedCutoff = cutoffFreq / fs; // Normalized cutoff frequency
  const center = numSamples / 2;
  
  for (let i = 0; i < numSamples; i++) {
    const x = 2 * Math.PI * normalizedCutoff * (i - center);
    if (Math.abs(x) < 1e-6) {
      signal[i] = amplitude + dcOffset; // Limit as x approaches 0
    } else {
      signal[i] = amplitude * Math.sin(x) / x + dcOffset;
    }
  }
  
  return signal;
}

/**
 * Generate a sum of sinusoids with specified frequencies
 */
export function multiTone(
  frequencies: number[],
  amplitudes: number[],
  duration: number,
  fs: number,
  phases: number[] = []
): number[] {
  const numSamples = Math.floor(duration * fs);
  const signal = new Array(numSamples).fill(0);
  
  // Ensure amplitudes array is the same length as frequencies
  const amps = amplitudes.length < frequencies.length
    ? [...amplitudes, ...Array(frequencies.length - amplitudes.length).fill(1)]
    : amplitudes;
  
  // Ensure phases array is the same length as frequencies
  const phs = phases.length < frequencies.length
    ? [...phases, ...Array(frequencies.length - phases.length).fill(0)]
    : phases;
  
  // Sum individual sinusoids
  for (let i = 0; i < numSamples; i++) {
    const t = i / fs;
    for (let j = 0; j < frequencies.length; j++) {
      signal[i] += amps[j] * Math.sin(2 * Math.PI * frequencies[j] * t + phs[j]);
    }
  }
  
  return signal;
}

/**
 * Generate a time domain impulse
 */
export function impulse(length: number, position: number = 0): number[] {
  const signal = new Array(length).fill(0);
  if (position >= 0 && position < length) {
    signal[position] = 1;
  }
  return signal;
}

/**
 * Generate a step function
 */
export function step(length: number, stepPosition: number = 0, amplitude: number = 1): number[] {
  const signal = new Array(length);
  
  for (let i = 0; i < length; i++) {
    signal[i] = i >= stepPosition ? amplitude : 0;
  }
  
  return signal;
} 