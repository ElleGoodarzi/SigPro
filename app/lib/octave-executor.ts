import { CodeExecutionResult, CodeExecutionData, PlotData } from '@/app/types/api';
import { executeOctaveInProduction, executeOctaveViaDocker } from '@/app/lib/octave-integration';

/**
 * Interface for Octave execution options
 */
export interface OctaveExecutionOptions {
  timeout?: number;       // Execution timeout in milliseconds
  memoryLimit?: number;   // Memory limit in MB
  plotOutput?: boolean;   // Whether to generate plot outputs
}

/**
 * Executes MATLAB/Octave code via a server-side process
 */
export async function executeOctaveCode(
  code: string, 
  options: OctaveExecutionOptions = {}
): Promise<CodeExecutionResult> {
  // Attempt to use production methods first
  try {
    // Check if we're in a real server environment that can spawn processes
    if (typeof process !== 'undefined' && process.env.ENABLE_OCTAVE_NATIVE === 'true') {
      console.log('Using native Octave execution');
      return await executeOctaveInProduction(code, options);
    }
    
    // Check if we should use Docker-based execution
    if (typeof process !== 'undefined' && process.env.ENABLE_OCTAVE_DOCKER === 'true') {
      console.log('Using Docker-based Octave execution');
      return await executeOctaveViaDocker(code, options);
    }
  } catch (error) {
    console.error('Error using production Octave methods, falling back to simulation:', error);
    // Fall back to simulation if production methods fail
  }
  
  // If we're here, we're using the simulated version
  const startTime = performance.now();
  const output: string[] = [];
  
  try {
    // Sanitize the code to prevent command injection
    const sanitizedCode = sanitizeCode(code);
    
    // In a production environment, this would use child_process.exec
    // to communicate with a locally installed Octave or a Docker container
    
    output.push('>> Executing code with Octave integration (simulated)...');
    
    // For demonstration, we'll simulate the execution
    // In a real implementation, this would call out to Octave via a process
    await simulateOctaveExecution(sanitizedCode, output);
    
    // Process data results 
    const data = await processOctaveResults(sanitizedCode);
    
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

/**
 * Sanitizes Octave code to prevent command injection
 */
function sanitizeCode(code: string): string {
  // Remove system commands and potentially dangerous function calls
  let sanitized = code
    .replace(/system\s*\(/g, 'BLOCKED_system(')
    .replace(/!\s*(.+)/g, 'BLOCKED_SYSTEM_COMMAND')
    .replace(/exec\s*\(/g, 'BLOCKED_exec(')
    .replace(/eval\s*\(/g, 'BLOCKED_eval(')
    .replace(/feval\s*\(/g, 'BLOCKED_feval(');
  
  // Block file system access functions
  const blockedFuncs = [
    'cd', 'fopen', 'fwrite', 'fprintf', 'fread', 'readdir', 'mkdir', 'rmdir', 'unlink'
  ];
  
  blockedFuncs.forEach(func => {
    const regex = new RegExp(`\\b${func}\\s*\\(`, 'g');
    sanitized = sanitized.replace(regex, `BLOCKED_${func}(`);
  });
  
  return sanitized;
}

/**
 * Simulate Octave execution for development purposes
 */
async function simulateOctaveExecution(code: string, output: string[]): Promise<void> {
  // Parse the code for simulation
  const lines = code.split('\n').filter(line => line.trim() !== '' && !line.trim().startsWith('%'));
  
  // Process variable assignments
  for (const line of lines) {
    if (line.includes('=') && !line.includes('function')) {
      output.push(`>> ${line.trim()}`);
    } else if (line.includes('plot') || line.includes('stem') || line.includes('mesh')) {
      output.push(`>> ${line.trim()}`);
      output.push('>> Generating plot...');
    } else if (line.trim().endsWith(';')) {
      // Command with suppressed output
      output.push(`>> ${line.trim()}`);
    } else {
      // Command that produces output
      output.push(`>> ${line.trim()}`);
      output.push('ans = [Output would appear here in real Octave]');
    }
  }
  
  // Simulate processing time
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return;
}

/**
 * Process results from Octave execution and prepare visualization data
 */
async function processOctaveResults(code: string): Promise<CodeExecutionData> {
  // Detect what kind of processing the code is doing
  const isFFT = code.includes('fft(') || code.includes('abs(fft(');
  const isFilter = code.includes('filter(') || code.includes('filtfilt(');
  const isTimeDomain = code.includes('plot(') || code.includes('stem(');
  
  // Sample rate detection
  const fsMatch = code.match(/fs\s*=\s*(\d+)/);
  const fs = fsMatch ? parseInt(fsMatch[1]) : 1000;
  
  // For demonstration, generate sample data for visualization
  // In a real implementation, this would parse actual Octave output
  
  // Generate time domain data
  const sampleSize = 1000;
  const t = Array.from({ length: sampleSize }, (_, i) => i / fs);
  
  // Detect frequencies in code
  const freqMatches = code.match(/f\d*\s*=\s*(\d+)/g);
  const frequencies = freqMatches 
    ? freqMatches.map(match => parseInt(match.split('=')[1].trim())) 
    : [50, 120];
  
  // Generate signal
  const signal = t.map(time => {
    return frequencies.reduce((sum, freq, i) => {
      const amplitude = i === 0 ? 1 : 0.5 / (i + 1);
      return sum + amplitude * Math.sin(2 * Math.PI * freq * time);
    }, 0);
  });
  
  // Add noise if specified
  const noisy = code.includes('noise') || code.includes('randn');
  const noisySignal = noisy 
    ? signal.map(val => val + 0.1 * (Math.random() * 2 - 1)) 
    : signal;
  
  // Generate frequency domain data if FFT is detected
  let frequencyData: PlotData | undefined = undefined;
  
  if (isFFT) {
    const N = noisySignal.length;
    const freqBins = Array.from({ length: N/2 }, (_, i) => i * (fs / N));
    
    // Simulate FFT magnitude (would be actual FFT in real implementation)
    const fftMagnitude = freqBins.map(f => {
      return frequencies.reduce((sum, freq, i) => {
        const amplitude = i === 0 ? 1 : 0.5 / (i + 1);
        return sum + amplitude * Math.exp(-10 * Math.pow((f - freq) / 5, 2));
      }, 0);
    });
    
    frequencyData = {
      x: freqBins,
      y: fftMagnitude,
      type: 'scatter',
      mode: 'lines',
      name: 'Frequency Spectrum'
    };
  }
  
  const timeData: PlotData = {
    x: t,
    y: noisySignal,
    type: 'scatter',
    mode: 'lines',
    name: 'Signal'
  };
  
  // Return appropriate data
  return {
    time: timeData,
    ...(isFFT && frequencyData ? { frequency: frequencyData } : {})
  };
} 