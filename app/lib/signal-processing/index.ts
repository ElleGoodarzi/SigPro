/**
 * Signal Processing Library
 * Provides utilities for signal generation, filtering, and analysis
 */

// Re-export utilities from the signal processing modules
export * from './fft';
export * from './filters';
export * from './generators';

// Add integrated functions that use multiple modules

/**
 * Generate and analyze a signal in one step
 */
import { 
  sineWave, 
  multiTone, 
  SignalOptions 
} from './generators';

import { 
  computeFFT, 
  computeSpectrogram, 
  FFTOptions 
} from './fft';

/**
 * Analyze a sinusoidal signal with given parameters
 */
export function analyzeSignal(
  frequency: number,
  duration: number,
  fs: number,
  options?: SignalOptions,
  fftOptions?: FFTOptions
) {
  // Generate the signal
  const signal = sineWave(frequency, duration, fs, options);
  
  // Compute FFT
  const fftResult = computeFFT(signal, fs, fftOptions);
  
  return {
    signal,
    fftResult
  };
}

/**
 * Analyze a multi-tone signal with given frequencies
 */
export function analyzeMultiTone(
  frequencies: number[],
  amplitudes: number[],
  duration: number,
  fs: number,
  phases: number[] = [],
  fftOptions?: FFTOptions
) {
  // Generate the multi-tone signal
  const signal = multiTone(frequencies, amplitudes, duration, fs, phases);
  
  // Compute FFT
  const fftResult = computeFFT(signal, fs, fftOptions);
  
  // Compute spectrogram for time-frequency analysis
  const spectrogramResult = computeSpectrogram(signal, fs);
  
  return {
    signal,
    fftResult,
    spectrogramResult
  };
} 