/**
 * FFT (Fast Fourier Transform) utilities for signal processing
 * Uses the ml-fft library for efficient computation
 */

// Simple FFT implementation that actually works
function simpleFFT(x: number[]): { re: number[], im: number[] } {
  const N = x.length;
  const re = new Array(N);
  const im = new Array(N);

  for (let k = 0; k < N; k++) {
    re[k] = 0;
    im[k] = 0;

    for (let n = 0; n < N; n++) {
      const angle = -2 * Math.PI * k * n / N;
      re[k] += x[n] * Math.cos(angle);
      im[k] += x[n] * Math.sin(angle);
    }
  }

  return { re, im };
}

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

// Enhanced types for educational Fourier tool
export type Complex = { re: number; im: number };

export interface FullFFT {
  re: number[];    // Real part of spectrum
  im: number[];    // Imaginary part of spectrum
  mag: number[];   // Magnitude spectrum
  phase: number[]; // Phase spectrum
  freq: number[];  // Frequency bins (wrapped to negative: i < N/2 → i*fs/N else (i-N)*fs/N)
  N: number;       // Signal length
  fs: number;      // Sampling frequency
  window: 'rect' | 'hann' | 'hamming' | 'blackman' | 'flattop';
  normalized: boolean;
}

export interface PairInfo {
  k: number;              // Positive frequency bin
  kConj: number;          // Conjugate bin (N-k)
  Xk: Complex;            // X[k]
  XkConj: Complex;        // X[N-k]
  hermitianDiff: number;  // |X[k] - conj(X[N-k])|
  isSpecial: boolean;     // DC or Nyquist
}

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
  
  // Compute FFT using our working implementation
  const fftResult = simpleFFT(paddedSignal);

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
 * Computes the full FFT spectrum including negative frequencies
 * This is a non-breaking addition to the existing API
 *
 * @param x The time-domain signal to transform
 * @param fs The sampling frequency in Hz
 * @param opts FFT computation options
 * @returns FullFFT result object with complete spectrum including negative frequencies
 */
export function computeFullFFT(
  x: number[],
  fs: number,
  opts?: {
    window?: 'hann' | 'hamming' | 'blackman' | 'flattop' | 'rect';
    normalize?: boolean;
  }
): FullFFT {
  const windowType = opts?.window || 'rect';
  const normalize = opts?.normalize || false;

  // Apply window function
  const windowed = applyWindow(x, windowType as WindowFunction);

  // Use simpleFFT directly for working computation
  const fftResult = simpleFFT(windowed);
  const N = x.length;

  // Create full frequency arrays
  const freq = new Array(N);
  const re = fftResult.re;
  const im = fftResult.im;
  const mag = new Array(N);
  const phase = new Array(N);

  // Apply normalization if requested
  const normFactor = normalize ? N : 1;

  // Calculate magnitude and phase for all bins
  for (let i = 0; i < N; i++) {
    re[i] /= normFactor;
    im[i] /= normFactor;
    mag[i] = Math.sqrt(re[i] * re[i] + im[i] * im[i]);
    phase[i] = Math.atan2(im[i], re[i]);

    // Frequency mapping: k < N/2 → k*fs/N, else (k-N)*fs/N
    freq[i] = i < N/2 ? i * fs / N : (i - N) * fs / N;
  }

  return {
    re,
    im,
    mag,
    phase,
    freq,
    N,
    fs,
    window: windowType as 'rect' | 'hann' | 'hamming' | 'blackman' | 'flattop',
    normalized: normalize
  };
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

// ===== ENHANCED EDUCATIONAL UTILITIES =====

/**
 * Converts bin index to frequency with negative wrapping
 */
export function binToFreq(k: number, N: number, fs: number): number {
  if (k < N / 2) {
    return k * fs / N;
  } else {
    return (k - N) * fs / N;
  }
}

/**
 * Checks Hermitian symmetry for real signals
 */
export function hermitianCheck(X: FullFFT): PairInfo[] {
  const { re, im, N } = X;
  const pairs: PairInfo[] = [];

  for (let k = 0; k <= Math.floor(N / 2); k++) {
    const kConj = k === 0 ? 0 : N - k;
    const isSpecial = (k === 0) || (k === N / 2 && N % 2 === 0);

    const Xk: Complex = { re: re[k], im: im[k] };
    const XkConj: Complex = { re: re[kConj], im: im[kConj] };

    // Hermitian check: X[k] should equal conj(X[N-k])
    // conj(X[N-k]) = re[N-k] - j*im[N-k]
    const hermitianDiff = isSpecial ? 0 :
      Math.sqrt(
        Math.pow(Xk.re - XkConj.re, 2) +
        Math.pow(Xk.im + XkConj.im, 2) // Note: +im because conj flips sign
      );

    pairs.push({
      k,
      kConj,
      Xk,
      XkConj,
      hermitianDiff,
      isSpecial
    });
  }

  return pairs;
}

/**
 * Measures coefficient X[k] via discrete averaging (1/N)Σ x[n] e^{-j2πkn/N}
 */
export function measureXk(x: number[], k: number): Complex {
  const N = x.length;
  let re = 0;
  let im = 0;

  for (let n = 0; n < N; n++) {
    const angle = -2 * Math.PI * k * n / N;
    re += x[n] * Math.cos(angle);
    im += x[n] * Math.sin(angle);
  }

  return { re: re / N, im: im / N };
}

/**
 * Convert complex coefficient to trigonometric form (for n≥1)
 * a = 2*Re(X_n), b = -2*Im(X_n)
 */
export function complexToTrig(Xn: Complex): { a: number; b: number } {
  return {
    a: 2 * Xn.re,
    b: -2 * Xn.im
  };
}

/**
 * Convert trigonometric coefficients to complex form
 * X_n = (a - jb)/2
 */
export function trigToComplex(a: number, b: number): Complex {
  return {
    re: a / 2,
    im: -b / 2
  };
}

/**
 * Partial sum reconstruction using complex coefficients
 */
export function partialSumComplex(
  X: Complex[],
  t: number[],
  fs: number,
  N?: number
): number[] {
  const numTerms = N || X.length;
  const result = new Array(t.length).fill(0);

  for (let i = 0; i < t.length; i++) {
    let sum = 0;

    // DC term (k=0)
    if (X.length > 0) {
      sum += X[0].re;
    }

    // Positive frequency terms (k=1 to numTerms-1)
    for (let k = 1; k < Math.min(numTerms, X.length); k++) {
      const angle = 2 * Math.PI * k * t[i] * fs / X.length;
      sum += 2 * (X[k].re * Math.cos(angle) - X[k].im * Math.sin(angle));
    }

    result[i] = sum;
  }

  return result;
}

/**
 * Partial sum reconstruction using trigonometric coefficients
 */
export function partialSumTrig(
  a0: number,
  a: number[],
  b: number[],
  t: number[],
  N?: number
): number[] {
  const numTerms = N || Math.min(a.length, b.length);
  const result = new Array(t.length).fill(0);

  for (let i = 0; i < t.length; i++) {
    let sum = a0; // DC term

    for (let k = 1; k <= numTerms; k++) {
      if (k <= a.length && k <= b.length) {
        const angle = 2 * Math.PI * k * t[i];
        sum += a[k - 1] * Math.cos(angle) - b[k - 1] * Math.sin(angle);
      }
    }

    result[i] = sum;
  }

  return result;
}

/**
 * Calculate imaginary residual RMS for real signal validation
 */
export function calculateImagResidual(x: number[]): number {
  // For a real signal, reconstructed from FFT should have negligible imaginary part
  const X = computeFullFFT(x, 1.0, { normalize: true });
  const reconstructed = partialSumComplex(
    X.re.map((re, i) => ({ re, im: X.im[i] })),
    Array.from({ length: x.length }, (_, i) => i),
    1.0
  );

  // Calculate RMS of difference (should be ~0 for real signals)
  let sumSquaredDiff = 0;
  for (let i = 0; i < x.length; i++) {
    sumSquaredDiff += Math.pow(x[i] - reconstructed[i], 2);
  }

  return Math.sqrt(sumSquaredDiff / x.length);
}

/**
 * Phase unwrapping utility
 */
export function unwrapPhase(phase: number[]): number[] {
  const unwrapped = [...phase];

  for (let i = 1; i < phase.length; i++) {
    let diff = unwrapped[i] - unwrapped[i - 1];

    while (diff > Math.PI) {
      unwrapped[i] -= 2 * Math.PI;
      diff = unwrapped[i] - unwrapped[i - 1];
    }

    while (diff < -Math.PI) {
      unwrapped[i] += 2 * Math.PI;
      diff = unwrapped[i] - unwrapped[i - 1];
    }
  }

  return unwrapped;
}