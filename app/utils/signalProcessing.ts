/**
 * Client-side signal processing utility functions
 * For lightweight processing that can be done in the browser
 */

import * as SignalProcessing from '@/app/lib/signal-processing';

/**
 * Process signal data in the browser
 */
export async function processSignalData(
  operation: string,
  data: any,
  options: any = {}
) {
  switch (operation) {
    case 'generate':
      return generateSignal(data, options);
    case 'filter':
      return filterSignal(data, options);
    case 'fft':
      return computeFFT(data, options);
    case 'spectrogram':
      return computeSpectrogram(data, options);
    default:
      throw new Error(`Unknown operation: ${operation}`);
  }
}

/**
 * Generate a signal client-side
 */
function generateSignal(data: any, options: any = {}) {
  const { signalType, frequency, duration, fs } = data;
  
  if (!signalType || !duration || !fs) {
    throw new Error('Signal type, duration, and sampling frequency are required');
  }
  
  let signal: number[];
  
  switch (signalType) {
    case 'sine':
      signal = SignalProcessing.sineWave(frequency, duration, fs, options);
      break;
    case 'cosine':
      signal = SignalProcessing.cosineWave(frequency, duration, fs, options);
      break;
    case 'square':
      signal = SignalProcessing.squareWave(frequency, duration, fs, options);
      break;
    case 'sawtooth':
      signal = SignalProcessing.sawtoothWave(frequency, duration, fs, options);
      break;
    case 'triangle':
      signal = SignalProcessing.triangleWave(frequency, duration, fs, options);
      break;
    case 'noise':
      signal = SignalProcessing.gaussianNoise(duration, fs, options.amplitude || 1);
      break;
    default:
      throw new Error(`Unknown signal type: ${signalType}`);
  }
  
  // Generate time domain data for plotting
  const timeAxis = Array.from({ length: signal.length }, (_, i) => i / fs);
  
  return {
    signal,
    plotData: {
      time: {
        x: timeAxis,
        y: signal,
        type: 'scatter',
        mode: 'lines',
        name: 'Generated Signal'
      }
    }
  };
}

/**
 * Apply a filter to a signal client-side
 */
function filterSignal(data: any, options: any = {}) {
  const { signal, fs, filterType, cutoffFreq } = data;
  
  if (!signal || !Array.isArray(signal) || !fs || !filterType || !cutoffFreq) {
    throw new Error('Signal, sampling frequency, filter type, and cutoff frequency are required');
  }
  
  let filteredSignal: number[];
  
  // Choose filter design method
  if (options.filterMethod === 'iir') {
    const coefficients = SignalProcessing.designButterworthFilter(
      filterType, 
      cutoffFreq, 
      fs, 
      options
    );
    filteredSignal = SignalProcessing.applyIIRFilter(signal, coefficients);
  } else {
    // Default to FIR filter
    const coefficients = SignalProcessing.designFIRFilter(
      filterType, 
      cutoffFreq, 
      fs, 
      options
    );
    filteredSignal = SignalProcessing.applyFIRFilter(signal, coefficients);
  }
  
  // Generate time axis for plotting
  const timeAxis = Array.from({ length: signal.length }, (_, i) => i / fs);
  
  return {
    originalSignal: signal,
    filteredSignal,
    plotData: {
      time: [
        {
          x: timeAxis,
          y: signal,
          type: 'scatter',
          mode: 'lines',
          name: 'Original Signal'
        },
        {
          x: timeAxis,
          y: filteredSignal,
          type: 'scatter',
          mode: 'lines',
          name: 'Filtered Signal'
        }
      ]
    }
  };
}

/**
 * Compute FFT of a signal client-side
 */
function computeFFT(data: any, options: any = {}) {
  const { signal, fs } = data;
  
  if (!signal || !Array.isArray(signal) || !fs) {
    throw new Error('Signal array and sampling frequency are required');
  }
  
  // Compute FFT
  const fftResult = SignalProcessing.computeFFT(signal, fs, options);
  
  // Generate time axis for plotting
  const timeAxis = Array.from({ length: signal.length }, (_, i) => i / fs);
  
  return {
    fftResult,
    plotData: {
      time: {
        x: timeAxis,
        y: signal,
        type: 'scatter',
        mode: 'lines',
        name: 'Signal'
      },
      frequency: {
        x: fftResult.frequencies,
        y: fftResult.magnitude,
        type: 'scatter',
        mode: 'lines',
        name: 'Frequency Spectrum'
      }
    }
  };
}

/**
 * Compute spectrogram of a signal client-side
 */
function computeSpectrogram(data: any, options: any = {}) {
  const { signal, fs } = data;
  
  if (!signal || !Array.isArray(signal) || !fs) {
    throw new Error('Signal array and sampling frequency are required');
  }
  
  // Compute spectrogram
  const windowSize = options.windowSize || 256;
  const hopSize = options.hopSize || 128;
  const windowType = options.windowType || 'hanning';
  
  const spectrogramResult = SignalProcessing.computeSpectrogram(
    signal, 
    fs, 
    windowSize, 
    hopSize, 
    windowType
  );
  
  // Generate time axis for plotting
  const timeAxis = Array.from({ length: signal.length }, (_, i) => i / fs);
  
  return {
    spectrogramResult,
    plotData: {
      time: {
        x: timeAxis,
        y: signal,
        type: 'scatter',
        mode: 'lines',
        name: 'Signal'
      },
      spectrogram: {
        z: spectrogramResult.spectrogram,
        x: spectrogramResult.timeAxis,
        y: spectrogramResult.freqAxis,
        type: 'heatmap',
        colorscale: 'Jet'
      }
    }
  };
}

/**
 * Submit a processing job to the API server
 */
export async function submitSignalProcessingJob(operation: string, data: any, options: any = {}) {
  try {
    const response = await fetch('/api/signal-process', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        operation,
        parameters: {
          ...data,
          ...options
        }
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to process signal');
    }

    return await response.json();
  } catch (error) {
    console.error('Error processing signal:', error);
    
    // Fallback to client-side processing if the server API fails
    console.log('Falling back to client-side processing');
    return processSignalData(operation, data, options);
  }
} 