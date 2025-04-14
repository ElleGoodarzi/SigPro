export type FilterType = 'lowpass' | 'highpass' | 'bandpass' | 'bandstop';

export type FilterImplementation = 'ideal' | 'fir' | 'iir';

export type FIRMethod = 'window' | 'least-squares' | 'equiripple';
export type WindowType = 'rectangular' | 'hamming' | 'hanning' | 'blackman' | 'kaiser';

export type IIRMethod = 'butterworth' | 'chebyshev1' | 'chebyshev2' | 'elliptic';

export interface FilterParams {
  type: FilterType;
  implementation: FilterImplementation;
  cutoffFrequency: number;
  cutoffFrequency2?: number; // For bandpass and bandstop filters
  windowLength?: number;     // Number of samples in the impulse response
  
  // FIR specific parameters
  firMethod?: FIRMethod;
  windowType?: WindowType;
  kaiserBeta?: number;       // Kaiser window parameter
  
  // IIR specific parameters
  iirMethod?: IIRMethod;
  filterOrder?: number;
  passbandRipple?: number;   // In dB
  stopbandAttenuation?: number;  // In dB
}

export interface FilterResponse {
  impulseResponse: number[];
  frequencyResponse: {
    magnitude: number[];
    phase: number[];
    frequencies: number[];
  };
  timeIndices: number[];
  poles?: { re: number; im: number }[];
  zeros?: { re: number; im: number }[];
  groupDelay?: number[];
}

export interface WindowFunction {
  name: string;
  function: (n: number, length: number, param?: number) => number;
} 