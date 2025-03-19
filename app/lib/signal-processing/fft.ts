/**
 * FFT (Fast Fourier Transform) utilities for signal processing
 * Uses the ml-fft library for efficient computation
 */

import { FFT } from 'ml-fft';

export interface FFTResult {
  magnitude: number[];    // Magnitude spectrum
  phase: number[];        // Phase spectrum
  frequencies: number[];  // Frequency bins
  dc: number;             // DC component
  nyquist: number;        // Nyquist frequency
}

export interface FFTOptions {
  normalize?: boolean;    // Whether to normalize by N
  padding?: number;       // Zero padding amount (power of 2)
  window?: WindowFunction; // Window function to use
}

export type WindowFunction = 'rectangular' | 'hanning' | 'hamming' | 'blackman' | 'flattop';

/**
 * Computes the FFT of a real-valued signal
 * 
 * @param signal The time-domain signal to transform
 * @param fs The sampling frequency in Hz
 * @param options FFT computation options
 * @returns FFT result object with magnitude, phase, and frequency data
 */
export function computeFFT(
  signal: number[], 
  fs: number, 
  options: FFTOptions = {}
): FFTResult {
  // Apply options
  const { normalize = true, padding = 0, window = 'rectangular' } = options;
  
  // Apply window function if specified
  const windowed = applyWindow(signal, window);
  
  // Determine FFT size (power of 2)
  const paddedLength = padding > 0 
    ? nextPowerOf2(signal.length) * Math.pow(2, padding) 
    : signal.length;
  
  // Pad signal if necessary
  const paddedSignal = padSignal(windowed, paddedLength);
  
  // Compute FFT
  const fftResult = FFT.fft(paddedSignal);
  
  // Extract real and imaginary parts
  const real = fftResult.re;
  const imag = fftResult.im;
  
  // Compute magnitude and phase
  const N = paddedLength;
  const normFactor = normalize ? N : 1;
  
  const magnitude = new Array(Math.floor(N/2) + 1);
  const phase = new Array(Math.floor(N/2) + 1);
  
  // DC component (index 0)
  magnitude[0] = Math.abs(real[0]) / normFactor;
  phase[0] = Math.atan2(imag[0], real[0]);
  
  // Other frequency components
  for (let i = 1; i < Math.floor(N/2); i++) {
    magnitude[i] = Math.sqrt(real[i]*real[i] + imag[i]*imag[i]) * 2 / normFactor;
    phase[i] = Math.atan2(imag[i], real[i]);
  }
  
  // Nyquist frequency (if N is even)
  if (N % 2 === 0) {
    magnitude[N/2] = Math.abs(real[N/2]) / normFactor;
    phase[N/2] = Math.atan2(imag[N/2], real[N/2]);
  }
  
  // Generate frequency bins
  const frequencies = new Array(Math.floor(N/2) + 1);
  for (let i = 0; i <= Math.floor(N/2); i++) {
    frequencies[i] = i * fs / N;
  }
  
  return {
    magnitude,
    phase,
    frequencies,
    dc: magnitude[0],
    nyquist: frequencies[frequencies.length - 1]
  };
}

/**
 * Applies a window function to a signal
 */
function applyWindow(signal: number[], windowType: WindowFunction): number[] {
  const N = signal.length;
  const windowed = new Array(N);
  
  switch (windowType) {
    case 'rectangular':
      return [...signal]; // No change
      
    case 'hanning':
      for (let i = 0; i < N; i++) {
        const w = 0.5 * (1 - Math.cos(2 * Math.PI * i / (N - 1)));
        windowed[i] = signal[i] * w;
      }
      return windowed;
      
    case 'hamming':
      for (let i = 0; i < N; i++) {
        const w = 0.54 - 0.46 * Math.cos(2 * Math.PI * i / (N - 1));
        windowed[i] = signal[i] * w;
      }
      return windowed;
      
    case 'blackman':
      for (let i = 0; i < N; i++) {
        const w = 0.42 - 0.5 * Math.cos(2 * Math.PI * i / (N - 1)) + 
                  0.08 * Math.cos(4 * Math.PI * i / (N - 1));
        windowed[i] = signal[i] * w;
      }
      return windowed;
      
    case 'flattop':
      for (let i = 0; i < N; i++) {
        const w = 0.21557895 - 
                  0.41663158 * Math.cos(2 * Math.PI * i / (N - 1)) + 
                  0.277263158 * Math.cos(4 * Math.PI * i / (N - 1)) - 
                  0.083578947 * Math.cos(6 * Math.PI * i / (N - 1)) +
                  0.006947368 * Math.cos(8 * Math.PI * i / (N - 1));
        windowed[i] = signal[i] * w;
      }
      return windowed;
      
    default:
      return [...signal];
  }
}

/**
 * Zero-pads a signal to reach the target length
 */
function padSignal(signal: number[], targetLength: number): number[] {
  if (signal.length >= targetLength) {
    return signal;
  }
  
  const padded = new Array(targetLength).fill(0);
  for (let i = 0; i < signal.length; i++) {
    padded[i] = signal[i];
  }
  
  return padded;
}

/**
 * Returns the next power of 2 that is greater than or equal to the input
 */
function nextPowerOf2(n: number): number {
  return Math.pow(2, Math.ceil(Math.log2(n)));
}

/**
 * Computes the Power Spectral Density (PSD) from FFT results
 */
export function computePSD(fftResult: FFTResult): number[] {
  const { magnitude } = fftResult;
  return magnitude.map(m => m * m);
}

/**
 * Computes the spectrogram of a signal using the Short-Time Fourier Transform (STFT)
 */
export function computeSpectrogram(
  signal: number[],
  fs: number,
  windowSize: number = 256,
  hopSize: number = 128,
  windowType: WindowFunction = 'hanning'
): { 
  spectrogram: number[][], 
  timeAxis: number[], 
  freqAxis: number[] 
} {
  // Calculate number of frames
  const numFrames = Math.floor((signal.length - windowSize) / hopSize) + 1;
  
  // Create spectrogram array
  const spectrogram: number[][] = new Array(numFrames);
  
  // Process each frame
  for (let frame = 0; frame < numFrames; frame++) {
    // Extract frame
    const frameSignal = signal.slice(frame * hopSize, frame * hopSize + windowSize);
    
    // Compute FFT for frame
    const fftResult = computeFFT(frameSignal, fs, { window: windowType });
    
    // Store magnitude
    spectrogram[frame] = fftResult.magnitude;
  }
  
  // Create time and frequency axes
  const timeAxis = Array.from({ length: numFrames }, (_, i) => i * hopSize / fs);
  const freqAxis = Array.from(
    { length: Math.floor(windowSize / 2) + 1 },
    (_, i) => i * fs / windowSize
  );
  
  return {
    spectrogram,
    timeAxis,
    freqAxis
  };
} 