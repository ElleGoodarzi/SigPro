import { SignalType, SignalParameters, SignalData, WindowFunction } from '../types/fourierTypes';

export function generateSignal(
  type: SignalType,
  parameters: SignalParameters,
  sampleRate: number,
  duration: number,
  window?: WindowFunction
): SignalData {
  const samples = Math.floor(sampleRate * duration);
  const time = Array.from({ length: samples }, (_, i) => i / sampleRate);
  let values: number[];

  switch (type) {
    case 'sine':
      values = time.map(t => 
        parameters.amplitude * Math.sin(2 * Math.PI * parameters.frequency * t + parameters.phase) + parameters.offset
      );
      break;
    
    case 'cosine':
      values = time.map(t => 
        parameters.amplitude * Math.cos(2 * Math.PI * parameters.frequency * t + parameters.phase) + parameters.offset
      );
      break;
    
    case 'square':
      values = time.map(t => {
        const sine = Math.sin(2 * Math.PI * parameters.frequency * t + parameters.phase);
        return parameters.amplitude * (sine >= 0 ? 1 : -1) + parameters.offset;
      });
      break;
    
    case 'sawtooth':
      values = time.map(t => {
        const phase = (parameters.frequency * t + parameters.phase / (2 * Math.PI)) % 1;
        return parameters.amplitude * (2 * phase - 1) + parameters.offset;
      });
      break;
    
    case 'triangle':
      values = time.map(t => {
        const phase = (parameters.frequency * t + parameters.phase / (2 * Math.PI)) % 1;
        const triangle = phase < 0.5 ? 4 * phase - 1 : 3 - 4 * phase;
        return parameters.amplitude * triangle + parameters.offset;
      });
      break;
    
    case 'chirp':
      values = time.map(t => {
        const instantaneousFreq = parameters.frequency * (1 + t / duration);
        return parameters.amplitude * Math.sin(2 * Math.PI * parameters.frequency * t * (1 + t / (2 * duration)) + parameters.phase) + parameters.offset;
      });
      break;
    
    case 'noise':
      values = Array.from({ length: samples }, () => 
        parameters.amplitude * (Math.random() * 2 - 1) + parameters.offset
      );
      break;
    
    case 'custom':
      // For custom signals, return a simple sine wave as default
      values = time.map(t => 
        parameters.amplitude * Math.sin(2 * Math.PI * parameters.frequency * t + parameters.phase) + parameters.offset
      );
      break;
    
    default:
      values = time.map(t => 
        parameters.amplitude * Math.sin(2 * Math.PI * parameters.frequency * t + parameters.phase) + parameters.offset
      );
  }

  // Apply window function if specified
  if (window && window.apply && window.type !== 'none') {
    values = applyWindowFunction(values, window.type);
  }

  return {
    time,
    values,
    sampleRate,
    duration
  };
}

export function applyWindowFunction(signal: number[], windowType: WindowFunction['type']): number[] {
  const N = signal.length;
  
  switch (windowType) {
    case 'hann':
      return signal.map((value, i) => {
        const windowValue = 0.5 * (1 - Math.cos(2 * Math.PI * i / (N - 1)));
        return value * windowValue;
      });
    
    case 'hamming':
      return signal.map((value, i) => {
        const windowValue = 0.54 - 0.46 * Math.cos(2 * Math.PI * i / (N - 1));
        return value * windowValue;
      });
    
    case 'blackman':
      return signal.map((value, i) => {
        const windowValue = 0.42 - 0.5 * Math.cos(2 * Math.PI * i / (N - 1)) + 0.08 * Math.cos(4 * Math.PI * i / (N - 1));
        return value * windowValue;
      });
    
    case 'flattop':
      return signal.map((value, i) => {
        const windowValue = 0.21557895 - 0.41663158 * Math.cos(2 * Math.PI * i / (N - 1)) + 
                           0.277263158 * Math.cos(4 * Math.PI * i / (N - 1)) - 
                           0.083578947 * Math.cos(6 * Math.PI * i / (N - 1)) + 
                           0.006947368 * Math.cos(8 * Math.PI * i / (N - 1));
        return value * windowValue;
      });
    
    default:
      return signal;
  }
}

export function generateMultiToneSignal(
  components: Array<SignalParameters>,
  sampleRate: number,
  duration: number,
  window?: WindowFunction
): SignalData {
  const samples = Math.floor(sampleRate * duration);
  const time = Array.from({ length: samples }, (_, i) => i / sampleRate);
  
  let values = new Array(samples).fill(0);
  
  // Sum all components
  components.forEach(component => {
    const componentSignal = generateSignal('sine', component, sampleRate, duration);
    values = values.map((value, i) => value + componentSignal.values[i]);
  });
  
  // Apply window function if specified
  if (window && window.apply && window.type !== 'none') {
    values = applyWindowFunction(values, window.type);
  }
  
  return {
    time,
    values,
    sampleRate,
    duration
  };
}
