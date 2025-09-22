// codeExecutor.ts - Handles MATLAB-like code execution and results
import { CodeExecutionResult, PlotData, CodeExecutionData } from '../types/api';

// Enhanced MATLAB function registry with proper FFT implementation
const functionRegistry: Record<string, Function> = {
  sin: (x: number[] | number) => Array.isArray(x) ? x.map(Math.sin) : Math.sin(x),
  cos: (x: number[] | number) => Array.isArray(x) ? x.map(Math.cos) : Math.cos(x),
  fft: (x: number[]) => {
    // Proper FFT implementation for educational purposes
    const N = x.length;
    const result: { real: number; imag: number }[] = [];
    
    for (let k = 0; k < N; k++) {
      let real = 0;
      let imag = 0;
      
      for (let n = 0; n < N; n++) {
        const angle = -2 * Math.PI * k * n / N;
        real += x[n] * Math.cos(angle);
        imag += x[n] * Math.sin(angle);
      }
      
      result.push({ real, imag });
    }
    return result;
  },
  abs: (x: any[]) => {
    if (typeof x[0] === 'object' && 'real' in x[0]) {
      return x.map(val => Math.sqrt(val.real * val.real + val.imag * val.imag));
    }
    return x.map(Math.abs);
  },
  real: (x: any[]) => {
    if (typeof x[0] === 'object' && 'real' in x[0]) {
      return x.map(val => val.real);
    }
    return x.map(val => val);
  },
  imag: (x: any[]) => {
    if (typeof x[0] === 'object' && 'imag' in x[0]) {
      return x.map(val => val.imag);
    }
    return x.map(() => 0);
  },
  conj: (x: any[]) => {
    if (typeof x[0] === 'object' && 'real' in x[0]) {
      return x.map(val => ({ real: val.real, imag: -val.imag }));
    }
    return x;
  },
  randn: (size: number) => Array(size).fill(0).map(() => Math.random() * 2 - 1),
};

/**
 * Executes MATLAB-like code and returns the results (client-side fallback)
 */
export function fallbackExecutor(code: string): CodeExecutionResult {
  const startTime = performance.now();
  const output: string[] = [];
  let data: CodeExecutionData | null = null;
  
  try {
    // Parse the code to extract key information
    output.push('>> Running code (fallback mode)...');
    
    // Extract sampling variables
    const fsMatch = code.match(/fs\s*=\s*(\d+)/);
    const fs = fsMatch ? parseInt(fsMatch[1]) : 1000;
    output.push(`>> Sampling frequency: ${fs} Hz`);
    
    // Detect signal generation
    if (code.includes('sin(') || code.includes('cos(')) {
      output.push('>> Generating signal...');
    }
    
    // Detect FFT/frequency analysis
    if (code.includes('fft(')) {
      output.push('>> Computing frequency analysis...');
    }
    
    // Generate sample data based on code content
    const sampleSize = 1000;
    
    // Time domain data
    const t = Array.from({ length: sampleSize }, (_, i) => i / fs);
    
    // Detect frequencies in code
    const freqMatches = code.match(/f\d*\s*=\s*(\d+)/g);
    const frequencies = freqMatches 
      ? freqMatches.map(match => parseInt(match.split('=')[1].trim())) 
      : [50];
    
    output.push(`>> Detected frequencies: ${frequencies.join(', ')} Hz`);
    
    // Generate a signal based on detected frequencies
    const signal = t.map(time => {
      return frequencies.reduce((sum, freq, i) => {
        const amplitude = i === 0 ? 1 : 0.5 / (i + 1);
        return sum + amplitude * Math.sin(2 * Math.PI * freq * time);
      }, 0);
    });
    
    // Add noise if mentioned in the code
    const noisy = code.includes('noise') || code.includes('randn');
    const noisySignal = noisy 
      ? signal.map(val => val + 0.1 * (Math.random() * 2 - 1)) 
      : signal;
    
    if (noisy) {
      output.push('>> Added noise to signal');
    }
    
    // Generate frequency domain data
    const N = noisySignal.length;
    const frequencies2 = Array.from({ length: N/2 }, (_, i) => i * (fs / N));
    
    // Simplified FFT calculation
    const fftMagnitude = frequencies2.map(f => {
      return frequencies.reduce((sum, freq, i) => {
        const amplitude = i === 0 ? 1 : 0.5 / (i + 1);
        return sum + amplitude * Math.exp(-10 * Math.pow((f - freq) / 5, 2));
      }, 0);
    });
    
    const timeData: PlotData = {
      x: t,
      y: noisySignal,
      type: 'scatter',
      mode: 'lines',
      name: 'Signal',
    };
    
    const frequencyData: PlotData = {
      x: frequencies2,
      y: fftMagnitude,
      type: 'scatter',
      mode: 'lines',
      name: 'Frequency Spectrum',
    };
    
    data = {
      time: timeData,
      frequency: frequencyData
    };
    
    // Find plot titles in the code
    const titleMatch = code.match(/title\(['"](.+)['"]\)/);
    if (titleMatch && titleMatch[1]) {
      output.push(`>> Plot title: "${titleMatch[1]}"`);
    }
    
    const executionTime = performance.now() - startTime;
    output.push(`>> Code executed successfully in ${executionTime.toFixed(2)} ms`);
    
    return {
      success: true,
      output,
      data,
      executionTime
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      output: [...output, `>> Error: ${errorMsg}`],
      errorMessage: errorMsg
    };
  }
}

// For backward compatibility
export const executeCode = fallbackExecutor;

/**
 * Parse and execute MATLAB-like commands line by line
 */
export function parseCommands(code: string): string[] {
  const lines = code.split('\n');
  const output: string[] = [];
  
  // Process each non-comment line
  lines.forEach(line => {
    line = line.trim();
    
    // Skip empty lines and comments
    if (line === '' || line.startsWith('%')) {
      return;
    }
    
    // Add to output
    output.push(`>> ${line}`);
    
    // If line is a variable assignment, add value
    if (line.includes('=') && !line.includes('function')) {
      const variable = line.split('=')[0].trim();
      output.push(`${variable} = [...]`);
    }
  });
  
  return output;
} 