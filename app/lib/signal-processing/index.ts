/**
 * Signal Processing Library
 * Provides utilities for signal generation, filtering, and analysis
 */

// Import modules using CommonJS format
const enhanced = require('./enhanced/index');
const fft = require('./fft');
const filters = require('./filters');
const generators = require('./generators');

// Function to perform a deep merge of objects to re-export all properties
function deepMerge(...objects: Record<string, any>[]): Record<string, any> {
  const result: Record<string, any> = {};
  
  for (const obj of objects) {
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        result[key] = obj[key];
      }
    }
  }
  
  return result;
}

// Create a single exports object with all functions
const signalProcessingExports = deepMerge(
  enhanced,
  fft,
  filters,
  generators
);

// Add integrated functions that use multiple modules

/**
 * Analyze a sinusoidal signal with given parameters
 */
signalProcessingExports.analyzeSignal = function(
  frequency: number,
  duration: number,
  fs: number,
  options?: Record<string, any>,
  fftOptions?: Record<string, any>
) {
  // Generate the signal
  const signal = generators.sineWave(frequency, duration, fs, options);
  
  // Compute FFT
  const fftResult = fft.computeFFT(signal, fs, fftOptions);
  
  return {
    signal,
    fftResult
  };
};

/**
 * Analyze a multi-tone signal with given frequencies
 */
signalProcessingExports.analyzeMultiTone = function(
  frequencies: number[],
  amplitudes: number[],
  duration: number,
  fs: number,
  phases: number[] = [],
  fftOptions?: Record<string, any>
) {
  // Generate the multi-tone signal
  const signal = generators.multiTone(frequencies, amplitudes, duration, fs, phases);
  
  // Compute FFT
  const fftResult = fft.computeFFT(signal, fs, fftOptions);
  
  // Compute spectrogram for time-frequency analysis
  const spectrogramResult = fft.computeSpectrogram(signal, fs);
  
  return {
    signal,
    fftResult,
    spectrogramResult
  };
};

/**
 * Analyze a signal with both time, frequency, and Z-transform domains
 */
signalProcessingExports.analyzeSignalWithZTransform = function(
  signal: number[],
  fs: number,
  zOptions?: Record<string, any>,
  fftOptions?: Record<string, any>
) {
  // Compute FFT for frequency domain analysis
  const fftResult = fft.computeFFT(signal, fs, fftOptions);
  
  // Compute Z-transform for z-domain analysis
  const zTransformResult = enhanced.computeZTransform(signal, zOptions);
  
  return {
    signal,
    fftResult,
    zTransformResult
  };
};

// Export all functions
module.exports = signalProcessingExports; 