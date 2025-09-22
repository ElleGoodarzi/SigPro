export interface SignalParameters {
  amplitude: number;
  frequency: number;
  phase: number;
  offset: number;
}

export interface FourierTransformResult {
  magnitude: number[];
  phase: number[];
  real: number[];
  imaginary: number[];
  frequencies: number[];
}

export interface SignalData {
  time: number[];
  values: number[];
  sampleRate: number;
  duration: number;
}

export type SignalType = 'sine' | 'cosine' | 'square' | 'sawtooth' | 'triangle' | 'noise' | 'chirp' | 'custom';

export interface WindowFunction {
  type: 'none' | 'hann' | 'hamming' | 'blackman' | 'flattop';
  apply: boolean;
}

export interface FourierTransformSettings {
  sampleRate: number;
  duration: number;
  window: WindowFunction;
  normalize: boolean;
  zeroPadding: boolean;
}
