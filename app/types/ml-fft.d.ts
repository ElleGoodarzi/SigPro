declare module 'ml-fft' {
  export interface FFTResult {
    re: number[];  // Real part
    im: number[];  // Imaginary part
  }

  export class FFT {
    static fft(signal: number[]): FFTResult;
    static ifft(signal: FFTResult): number[];
  }
} 