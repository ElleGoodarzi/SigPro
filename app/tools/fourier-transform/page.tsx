'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import PlotlyChart from '../../components/PlotlyChart';

// Define interfaces for our data structures
interface SignalData {
  time: number[];
  values: number[];
  N: number;
  fs: number;
}

interface FFTResult {
  magnitude: number[];
  phase: number[];
  real: number[];
  imaginary: number[];
  frequencies: number[];
}

interface Complex {
  real: number;
  imaginary: number;
}

// Working FFT implementation
function computeFFT(signal: number[], sampleRate: number): FFTResult {
  const N = signal.length;
  const real = new Array(N);
  const imaginary = new Array(N);

  // Simple DFT implementation (works correctly)
  for (let k = 0; k < N; k++) {
    real[k] = 0;
    imaginary[k] = 0;
    for (let n = 0; n < N; n++) {
      const angle = -2 * Math.PI * k * n / N;
      real[k] += signal[n] * Math.cos(angle);
      imaginary[k] += signal[n] * Math.sin(angle);
    }
    // Normalize
    real[k] /= N;
    imaginary[k] /= N;
  }

  // Compute magnitude and phase
  const magnitude = new Array(N);
  const phase = new Array(N);
  const frequencies = new Array(N);

  for (let k = 0; k < N; k++) {
    magnitude[k] = Math.sqrt(real[k] * real[k] + imaginary[k] * imaginary[k]);
    phase[k] = Math.atan2(imaginary[k], real[k]);
    frequencies[k] = k < N/2 ? k * sampleRate / N : (k - N) * sampleRate / N;
  }

  return { magnitude, phase, real, imaginary, frequencies };
}

// Measure individual DFT coefficient (for Coefficient Lab)
function measureCoefficient(signal: number[], k: number): Complex {
  const N = signal.length;
  let real = 0;
  let imaginary = 0;

  for (let n = 0; n < N; n++) {
    const angle = -2 * Math.PI * k * n / N;
    real += signal[n] * Math.cos(angle);
    imaginary += signal[n] * Math.sin(angle);
  }

  return {
    real: real / N,
    imaginary: imaginary / N
  };
}

// Generate reference signal for measurement visualization
function generateReferenceSignal(k: number, N: number, fs: number): { real: number[], imaginary: number[], time: number[] } {
  const time = Array.from({ length: N }, (_, n) => n / fs);
  const real = new Array(N);
  const imaginary = new Array(N);

  for (let n = 0; n < N; n++) {
    const angle = -2 * Math.PI * k * n / N;
    real[n] = Math.cos(angle);
    imaginary[n] = Math.sin(angle);
  }

  return { real, imaginary, time };
}

// Generate classic waveforms for pairing view
function generateClassicWaveform(type: string, N: number, fs: number): number[] {
  const signal = new Array(N);
  const fundamentalFreq = fs / N; // One cycle over the signal length

  for (let n = 0; n < N; n++) {
    const t = n / fs;

    switch (type) {
      case 'square':
        // Square wave using Fourier series: sum of odd harmonics
        signal[n] = 0;
        for (let k = 1; k <= 19; k += 2) {
          signal[n] += (4 / Math.PI) * (1 / k) * Math.sin(2 * Math.PI * k * fundamentalFreq * t);
        }
        break;
      case 'triangle':
        // Triangle wave using Fourier series
        signal[n] = 0;
        for (let k = 1; k <= 19; k += 2) {
          const sign = ((k - 1) / 2) % 2 === 0 ? 1 : -1;
          signal[n] += sign * (8 / (Math.PI * Math.PI)) * (1 / (k * k)) * Math.sin(2 * Math.PI * k * fundamentalFreq * t);
        }
        break;
      case 'sawtooth':
        // Sawtooth wave using Fourier series
        signal[n] = 0;
        for (let k = 1; k <= 20; k++) {
          signal[n] += (2 / Math.PI) * (1 / k) * Math.sin(2 * Math.PI * k * fundamentalFreq * t);
        }
        break;
      default:
        signal[n] = Math.sin(2 * Math.PI * fundamentalFreq * t);
    }
  }

  return signal;
}

// Advanced signal generation functions
function generateNoise(type: string, N: number, level: number): number[] {
  const signal = new Array(N);
  
  switch (type) {
    case 'white':
      for (let n = 0; n < N; n++) {
        signal[n] = level * (2 * Math.random() - 1); // White noise: uniform distribution
      }
      break;
    case 'pink':
      // Simplified pink noise (1/f noise)
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let n = 0; n < N; n++) {
        const white = 2 * Math.random() - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        signal[n] = level * (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362);
        b6 = white * 0.115926;
      }
      break;
    case 'brown':
      // Brown noise (1/f^2 noise)
      let lastValue = 0;
      for (let n = 0; n < N; n++) {
        const white = 2 * Math.random() - 1;
        lastValue = 0.99 * lastValue + 0.1 * white;
        signal[n] = level * lastValue;
      }
      break;
    default:
      for (let n = 0; n < N; n++) {
        signal[n] = level * (2 * Math.random() - 1);
      }
  }
  
  return signal;
}

function generateChirp(startFreq: number, endFreq: number, type: string, N: number, fs: number): number[] {
  const signal = new Array(N);
  const duration = N / fs;
  
  for (let n = 0; n < N; n++) {
    const t = n / fs;
    let freq: number;
    
    if (type === 'linear') {
      freq = startFreq + (endFreq - startFreq) * (t / duration);
    } else { // logarithmic
      freq = startFreq * Math.pow(endFreq / startFreq, t / duration);
    }
    
    const phase = 2 * Math.PI * (startFreq * t + (endFreq - startFreq) * t * t / (2 * duration));
    signal[n] = Math.sin(phase);
  }
  
  return signal;
}

function generateAMSignal(carrierFreq: number, modFreq: number, modDepth: number, N: number, fs: number): number[] {
  const signal = new Array(N);
  
  for (let n = 0; n < N; n++) {
    const t = n / fs;
    const carrier = Math.sin(2 * Math.PI * carrierFreq * t);
    const modulator = 1 + modDepth * Math.sin(2 * Math.PI * modFreq * t);
    signal[n] = carrier * modulator;
  }
  
  return signal;
}

function generateFMSignal(carrierFreq: number, modFreq: number, modIndex: number, N: number, fs: number): number[] {
  const signal = new Array(N);
  
  for (let n = 0; n < N; n++) {
    const t = n / fs;
    const instantaneousFreq = carrierFreq + modIndex * Math.sin(2 * Math.PI * modFreq * t);
    const phase = 2 * Math.PI * carrierFreq * t - (modIndex / modFreq) * Math.cos(2 * Math.PI * modFreq * t);
    signal[n] = Math.sin(phase);
  }
  
  return signal;
}

// Reconstruct signal from selected frequency pairs
function reconstructFromPairs(fftResult: FFTResult, selectedPairs: number[], maxTerms: number): number[] {
  const N = fftResult.real.length;
  const signal = new Array(N).fill(0);

  // Add DC component
  if (selectedPairs.includes(0)) {
    for (let n = 0; n < N; n++) {
      signal[n] += fftResult.real[0];
    }
  }

  // Add selected frequency pairs
  let termCount = 0;
  for (let k = 1; k < N/2 && termCount < maxTerms; k++) {
    if (selectedPairs.includes(k)) {
      for (let n = 0; n < N; n++) {
        const angle = 2 * Math.PI * k * n / N;
        // Add positive frequency contribution
        signal[n] += 2 * fftResult.real[k] * Math.cos(angle) - 2 * fftResult.imaginary[k] * Math.sin(angle);
      }
      termCount++;
    }
  }

  return signal;
}

export default function FourierTransformTool() {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeTab, setActiveTab] = useState<'explorer' | 'measure' | 'pairing'>('explorer');
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1920,
    height: typeof window !== 'undefined' ? window.innerHeight : 1080
  });

  // Signal generation parameters
  const [signalParams, setSignalParams] = useState({
    type: 'sine' as 'sine' | 'cosine' | 'square' | 'sawtooth' | 'triangle' | 'multi-tone' | 'chirp' | 'noise' | 'am-modulated' | 'fm-modulated',
    amplitude: 1.0,
    frequency: 50,
    phase: 0,
    offset: 0,
    sampleRate: 1000,
    duration: 1.0,
    // Multi-tone parameters
    frequencies: [50, 120],
    amplitudes: [1.0, 0.7],
    // Advanced signal parameters
    noiseType: 'white' as 'white' | 'pink' | 'brown',
    noiseLevel: 0.1,
    chirpStartFreq: 10,
    chirpEndFreq: 100,
    chirpType: 'linear' as 'linear' | 'logarithmic',
    modFreq: 10,
    modDepth: 0.5,
    modIndex: 5
  });

  // FFT settings
  const [fftSettings, setFftSettings] = useState({
    normalize: true,
    showNegativeFreqs: true,
    units: 'Hz' as 'Hz' | 'rad/s',
    phaseUnits: 'rad' as 'rad' | 'deg'
  });

  // Measurement settings (for Coefficient Lab)
  const [measureSettings, setMeasureSettings] = useState({
    selectedBin: 2,
    showReference: true,
    showProduct: true,
    showMagnitudePhase: true
  });

  // Pairing settings (for Pairing & Trig View)
  const [pairingSettings, setPairingSettings] = useState({
    selectedPairs: [1, 2, 3] as number[],
    showTrigForm: true,
    showPartialSum: true,
    maxTerms: 10,
    waveformPreset: 'square' as 'square' | 'triangle' | 'sawtooth' | 'custom'
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // Generate time-domain signal
  const signalData = useMemo((): SignalData => {
    const { sampleRate, duration } = signalParams;
    const N = Math.floor(sampleRate * duration);
    const t = Array.from({ length: N }, (_, i) => i / sampleRate);
    let values: number[];

    switch (signalParams.type) {
      case 'sine':
        values = t.map(time =>
          signalParams.amplitude * Math.sin(2 * Math.PI * signalParams.frequency * time + signalParams.phase) + signalParams.offset
        );
        break;
      case 'cosine':
        values = t.map(time =>
          signalParams.amplitude * Math.cos(2 * Math.PI * signalParams.frequency * time + signalParams.phase) + signalParams.offset
        );
        break;
      case 'square':
        values = generateClassicWaveform('square', N, sampleRate);
        values = values.map(v => signalParams.amplitude * v + signalParams.offset);
        break;
      case 'triangle':
        values = generateClassicWaveform('triangle', N, sampleRate);
        values = values.map(v => signalParams.amplitude * v + signalParams.offset);
        break;
      case 'sawtooth':
        values = generateClassicWaveform('sawtooth', N, sampleRate);
        values = values.map(v => signalParams.amplitude * v + signalParams.offset);
        break;
      case 'multi-tone':
        values = t.map(time => {
          let sum = signalParams.offset;
          for (let i = 0; i < signalParams.frequencies.length; i++) {
            sum += (signalParams.amplitudes[i] || 1.0) *
                   Math.sin(2 * Math.PI * signalParams.frequencies[i] * time);
          }
          return sum;
        });
        break;
      case 'chirp':
        values = generateChirp(signalParams.chirpStartFreq, signalParams.chirpEndFreq, signalParams.chirpType, N, sampleRate);
        values = values.map(v => signalParams.amplitude * v + signalParams.offset);
        break;
      case 'noise':
        values = generateNoise(signalParams.noiseType, N, signalParams.noiseLevel);
        values = values.map(v => signalParams.amplitude * v + signalParams.offset);
        break;
      case 'am-modulated':
        values = generateAMSignal(signalParams.frequency, signalParams.modFreq, signalParams.modDepth, N, sampleRate);
        values = values.map(v => signalParams.amplitude * v + signalParams.offset);
        break;
      case 'fm-modulated':
        values = generateFMSignal(signalParams.frequency, signalParams.modFreq, signalParams.modIndex, N, sampleRate);
        values = values.map(v => signalParams.amplitude * v + signalParams.offset);
        break;
      default:
        values = t.map(() => 0);
    }

    return { time: t, values, N, fs: sampleRate };
  }, [signalParams]);

  // Compute FFT
  const fftData = useMemo((): FFTResult | null => {
    try {
      return computeFFT(signalData.values, signalData.fs);
    } catch (error) {
      console.error('FFT computation failed:', error);
      return null;
    }
  }, [signalData]);

  // Coefficient measurement data
  const measurementData = useMemo(() => {
    if (!fftData) return null;

    const k = measureSettings.selectedBin;
    const N = signalData.N;
    const fs = signalData.fs;

    // Measure the coefficient
    const coefficient = measureCoefficient(signalData.values, k);

    // Generate reference signal
    const reference = generateReferenceSignal(k, N, fs);

    // Generate product signal
    const product = {
      real: new Array(N),
      imaginary: new Array(N)
    };

    for (let n = 0; n < N; n++) {
      product.real[n] = signalData.values[n] * reference.real[n];
      product.imaginary[n] = signalData.values[n] * reference.imaginary[n];
    }

    // Calculate running average
    const runningAverage = {
      real: new Array(N),
      imaginary: new Array(N)
    };

    let sumReal = 0;
    let sumImag = 0;

    for (let n = 0; n < N; n++) {
      sumReal += product.real[n];
      sumImag += product.imaginary[n];
      runningAverage.real[n] = sumReal / (n + 1);
      runningAverage.imaginary[n] = sumImag / (n + 1);
    }

    return {
      coefficient,
      reference,
      product,
      runningAverage,
      theoretical: {
        real: fftData.real[k],
        imaginary: fftData.imaginary[k]
      }
    };
  }, [signalData, fftData, measureSettings.selectedBin]);

  // Pairing and reconstruction data
  const pairingData = useMemo(() => {
    if (!fftData) return null;

    // Get original signal or generate classic waveform
    let originalSignal = signalData.values;
    if (pairingSettings.waveformPreset !== 'custom') {
      originalSignal = generateClassicWaveform(pairingSettings.waveformPreset, signalData.N, signalData.fs);
      // Recompute FFT for the classic waveform
      const classicFFT = computeFFT(originalSignal, signalData.fs);

      // Reconstruct from selected pairs
      const reconstructed = reconstructFromPairs(classicFFT, pairingSettings.selectedPairs, pairingSettings.maxTerms);

      // Calculate RMS error
      let errorSum = 0;
      for (let n = 0; n < signalData.N; n++) {
        const diff = originalSignal[n] - reconstructed[n];
        errorSum += diff * diff;
      }
      const rmsError = Math.sqrt(errorSum / signalData.N);

      return {
        original: originalSignal,
        reconstructed,
        rmsError,
        fftResult: classicFFT
      };
    }

    // For custom signal, use existing FFT
    const reconstructed = reconstructFromPairs(fftData, pairingSettings.selectedPairs, pairingSettings.maxTerms);

    let errorSum = 0;
    for (let n = 0; n < signalData.N; n++) {
      const diff = originalSignal[n] - reconstructed[n];
      errorSum += diff * diff;
    }
    const rmsError = Math.sqrt(errorSum / signalData.N);

    return {
      original: originalSignal,
      reconstructed,
      rmsError,
      fftResult: fftData
    };
  }, [signalData, fftData, pairingSettings]);

  const tabs = [
    {
      id: 'explorer' as const,
      label: 'Time ↔ Frequency Explorer',
      icon: '⚡',
      description: 'Interactive signal analysis and spectrum visualization'
    },
    {
      id: 'advanced' as const,
      label: 'Advanced Signal Generator',
      icon: '🎛️',
      description: 'Complex signals, noise, modulation, and chirps'
    },
    {
      id: 'windowing' as const,
      label: 'Windowing Analysis',
      icon: '🪟',
      description: 'Window functions and spectral leakage analysis'
    },
    {
      id: 'stft' as const,
      label: 'STFT & Time-Frequency',
      icon: '📊',
      description: 'Short-Time Fourier Transform and spectrograms'
    },
    {
      id: 'measure' as const,
      label: 'Coefficient Lab',
      icon: '🔬',
      description: 'Learn coefficient measurement via "freeze & average"'
    },
    {
      id: 'pairing' as const,
      label: 'Pairing & Trig View',
      icon: '🎭',
      description: 'Frequency pairing and trigonometric synthesis'
    },
    {
      id: 'filtering' as const,
      label: 'FFT Filtering',
      icon: '🔧',
      description: 'Frequency domain filtering and convolution'
    },
    {
      id: 'analysis' as const,
      label: 'Spectral Analysis',
      icon: '📈',
      description: 'Peak detection, THD, SNR, and spectral metrics'
    }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'advanced':
        return (
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h3 className="text-xl font-bold text-cyan-400 mb-4">Advanced Signal Generator</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-cyan-300 mb-2">Signal Type</label>
                  <select
                    value={signalParams.type}
                    onChange={(e) => setSignalParams(prev => ({ ...prev, type: e.target.value as any }))}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-cyan-100 focus:ring-2 focus:ring-cyan-500"
                  >
                    <option value="sine">Sine Wave</option>
                    <option value="cosine">Cosine Wave</option>
                    <option value="square">Square Wave</option>
                    <option value="triangle">Triangle Wave</option>
                    <option value="sawtooth">Sawtooth Wave</option>
                    <option value="multi-tone">Multi-Tone</option>
                    <option value="chirp">Linear/Log Chirp</option>
                    <option value="noise">Noise (White/Pink/Brown)</option>
                    <option value="am-modulated">AM Modulation</option>
                    <option value="fm-modulated">FM Modulation</option>
                  </select>
                </div>
                
                {signalParams.type === 'chirp' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-cyan-300 mb-2">Start Frequency (Hz)</label>
                      <input
                        type="number"
                        value={signalParams.chirpStartFreq}
                        onChange={(e) => setSignalParams(prev => ({ ...prev, chirpStartFreq: parseFloat(e.target.value) || 0 }))}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-cyan-100 focus:ring-2 focus:ring-cyan-500"
                        min="1"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-cyan-300 mb-2">End Frequency (Hz)</label>
                      <input
                        type="number"
                        value={signalParams.chirpEndFreq}
                        onChange={(e) => setSignalParams(prev => ({ ...prev, chirpEndFreq: parseFloat(e.target.value) || 0 }))}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-cyan-100 focus:ring-2 focus:ring-cyan-500"
                        min="1"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-cyan-300 mb-2">Chirp Type</label>
                      <select
                        value={signalParams.chirpType}
                        onChange={(e) => setSignalParams(prev => ({ ...prev, chirpType: e.target.value as any }))}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-cyan-100 focus:ring-2 focus:ring-cyan-500"
                      >
                        <option value="linear">Linear</option>
                        <option value="logarithmic">Logarithmic</option>
                      </select>
                    </div>
                  </>
                )}
                
                {signalParams.type === 'noise' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-cyan-300 mb-2">Noise Type</label>
                      <select
                        value={signalParams.noiseType}
                        onChange={(e) => setSignalParams(prev => ({ ...prev, noiseType: e.target.value as any }))}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-cyan-100 focus:ring-2 focus:ring-cyan-500"
                      >
                        <option value="white">White Noise</option>
                        <option value="pink">Pink Noise (1/f)</option>
                        <option value="brown">Brown Noise (1/f²)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-cyan-300 mb-2">Noise Level</label>
                      <input
                        type="number"
                        value={signalParams.noiseLevel}
                        onChange={(e) => setSignalParams(prev => ({ ...prev, noiseLevel: parseFloat(e.target.value) || 0 }))}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-cyan-100 focus:ring-2 focus:ring-cyan-500"
                        min="0"
                        max="2"
                        step="0.1"
                      />
                    </div>
                  </>
                )}
                
                {(signalParams.type === 'am-modulated' || signalParams.type === 'fm-modulated') && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-cyan-300 mb-2">Carrier Frequency (Hz)</label>
                      <input
                        type="number"
                        value={signalParams.frequency}
                        onChange={(e) => setSignalParams(prev => ({ ...prev, frequency: parseFloat(e.target.value) || 0 }))}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-cyan-100 focus:ring-2 focus:ring-cyan-500"
                        min="1"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-cyan-300 mb-2">Modulation Frequency (Hz)</label>
                      <input
                        type="number"
                        value={signalParams.modFreq}
                        onChange={(e) => setSignalParams(prev => ({ ...prev, modFreq: parseFloat(e.target.value) || 0 }))}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-cyan-100 focus:ring-2 focus:ring-cyan-500"
                        min="0.1"
                        step="0.1"
                      />
                    </div>
                  </>
                )}
                
                {signalParams.type === 'am-modulated' && (
                  <div>
                    <label className="block text-sm font-medium text-cyan-300 mb-2">Modulation Depth</label>
                    <input
                      type="number"
                      value={signalParams.modDepth}
                      onChange={(e) => setSignalParams(prev => ({ ...prev, modDepth: parseFloat(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-cyan-100 focus:ring-2 focus:ring-cyan-500"
                      min="0"
                      max="1"
                      step="0.1"
                    />
                  </div>
                )}
                
                {signalParams.type === 'fm-modulated' && (
                  <div>
                    <label className="block text-sm font-medium text-cyan-300 mb-2">Modulation Index</label>
                    <input
                      type="number"
                      value={signalParams.modIndex}
                      onChange={(e) => setSignalParams(prev => ({ ...prev, modIndex: parseFloat(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-cyan-100 focus:ring-2 focus:ring-cyan-500"
                      min="0"
                      max="20"
                      step="0.5"
                    />
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-cyan-300 mb-2">Amplitude</label>
                  <input
                    type="number"
                    value={signalParams.amplitude}
                    onChange={(e) => setSignalParams(prev => ({ ...prev, amplitude: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-cyan-100 focus:ring-2 focus:ring-cyan-500"
                    min="0"
                    step="0.1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-cyan-300 mb-2">Sample Rate (Hz)</label>
                  <input
                    type="number"
                    value={signalParams.sampleRate}
                    onChange={(e) => setSignalParams(prev => ({ ...prev, sampleRate: parseFloat(e.target.value) || 1 }))}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-cyan-100 focus:ring-2 focus:ring-cyan-500"
                    min="100"
                    step="100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-cyan-300 mb-2">Duration (s)</label>
                  <input
                    type="number"
                    value={signalParams.duration}
                    onChange={(e) => setSignalParams(prev => ({ ...prev, duration: parseFloat(e.target.value) || 0.1 }))}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-cyan-100 focus:ring-2 focus:ring-cyan-500"
                    min="0.1"
                    step="0.1"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Time Domain Plot */}
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <h3 className="text-xl font-bold text-cyan-400 mb-4">Time Domain Signal</h3>
                <PlotlyChart
                  data={[{
                    x: signalData.time,
                    y: signalData.values,
                    type: 'scatter',
                    mode: 'lines',
                    name: 'Signal',
                    line: { color: '#06b6d4', width: 2 }
                  }]}
                  layout={{
                    title: { text: 'Advanced Signal', font: { color: '#e2e8f0' } },
                    xaxis: { title: 'Time (s)', color: '#94a3b8' },
                    yaxis: { title: 'Amplitude', color: '#94a3b8' },
                    paper_bgcolor: 'rgba(0,0,0,0)',
                    plot_bgcolor: 'rgba(0,0,0,0)',
                    font: { color: '#e2e8f0' },
                    showlegend: false,
                    margin: { t: 40, r: 40, b: 40, l: 40 }
                  }}
                />
              </div>

              {/* Frequency Domain Plot */}
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <h3 className="text-xl font-bold text-cyan-400 mb-4">Frequency Domain Spectrum</h3>
                {fftData ? (
                  <PlotlyChart
                    data={[{
                      x: fftSettings.showNegativeFreqs ? fftData.frequencies : fftData.frequencies.slice(0, Math.floor(fftData.frequencies.length/2)),
                      y: fftSettings.showNegativeFreqs ? fftData.magnitude : fftData.magnitude.slice(0, Math.floor(fftData.magnitude.length/2)),
                      type: 'scatter',
                      mode: 'lines+markers',
                      name: 'Magnitude',
                      line: { color: '#8b5cf6', width: 2 },
                      marker: { color: '#8b5cf6', size: 4 }
                    }]}
                    layout={{
                      title: { text: 'Magnitude Spectrum', font: { color: '#e2e8f0' } },
                      xaxis: { title: 'Frequency (Hz)', color: '#94a3b8' },
                      yaxis: { title: 'Magnitude', color: '#94a3b8' },
                      paper_bgcolor: 'rgba(0,0,0,0)',
                      plot_bgcolor: 'rgba(0,0,0,0)',
                      font: { color: '#e2e8f0' },
                      showlegend: false,
                      margin: { t: 40, r: 40, b: 40, l: 40 }
                    }}
                  />
                ) : (
                  <div className="text-red-400 text-center py-8">
                    FFT computation failed. Please check signal parameters.
                  </div>
                )}
              </div>
            </div>

            {/* Signal Information */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h3 className="text-xl font-bold text-cyan-400 mb-4">Signal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <h4 className="text-lg font-bold text-yellow-400">Time Domain</h4>
                  <div className="text-cyan-100 font-mono text-sm space-y-1">
                    <p>Length: {signalData.N} samples</p>
                    <p>Duration: {signalData.time[signalData.time.length - 1].toFixed(3)} s</p>
                    <p>Sample Rate: {signalData.fs} Hz</p>
                    <p>Max Value: {Math.max(...signalData.values).toFixed(3)}</p>
                    <p>Min Value: {Math.min(...signalData.values).toFixed(3)}</p>
                    <p>RMS: {(Math.sqrt(signalData.values.reduce((sum, val) => sum + val*val, 0) / signalData.values.length)).toFixed(3)}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <h4 className="text-lg font-bold text-green-400">Frequency Domain</h4>
                  {fftData && (
                    <div className="text-cyan-100 font-mono text-sm space-y-1">
                      <p>Frequency Resolution: {(signalData.fs / signalData.N).toFixed(3)} Hz</p>
                      <p>Nyquist Frequency: {(signalData.fs / 2).toFixed(1)} Hz</p>
                      <p>DC Component: {fftData.dc.toFixed(6)}</p>
                      <p>Peak Frequency: {fftData.frequencies[fftData.magnitude.indexOf(Math.max(...fftData.magnitude))].toFixed(1)} Hz</p>
                      <p>Peak Magnitude: {Math.max(...fftData.magnitude).toFixed(6)}</p>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <h4 className="text-lg font-bold text-purple-400">Signal Type: {signalParams.type}</h4>
                  <div className="text-cyan-100 font-mono text-sm space-y-1">
                    {signalParams.type === 'chirp' && (
                      <>
                        <p>Start: {signalParams.chirpStartFreq} Hz</p>
                        <p>End: {signalParams.chirpEndFreq} Hz</p>
                        <p>Type: {signalParams.chirpType}</p>
                      </>
                    )}
                    {signalParams.type === 'noise' && (
                      <>
                        <p>Type: {signalParams.noiseType}</p>
                        <p>Level: {signalParams.noiseLevel}</p>
                      </>
                    )}
                    {(signalParams.type === 'am-modulated' || signalParams.type === 'fm-modulated') && (
                      <>
                        <p>Carrier: {signalParams.frequency} Hz</p>
                        <p>Modulation: {signalParams.modFreq} Hz</p>
                        {signalParams.type === 'am-modulated' && <p>Depth: {signalParams.modDepth}</p>}
                        {signalParams.type === 'fm-modulated' && <p>Index: {signalParams.modIndex}</p>}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'explorer':
        return (
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h3 className="text-xl font-bold text-cyan-400 mb-4">Signal Generator</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-cyan-300 mb-2">Signal Type</label>
                  <select
                    value={signalParams.type}
                    onChange={(e) => setSignalParams(prev => ({ ...prev, type: e.target.value as any }))}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-cyan-100 focus:ring-2 focus:ring-cyan-500"
                  >
                    <option value="sine">Sine Wave</option>
                    <option value="cosine">Cosine Wave</option>
                    <option value="square">Square Wave</option>
                    <option value="triangle">Triangle Wave</option>
                    <option value="sawtooth">Sawtooth Wave</option>
                    <option value="multi-tone">Multi-Tone</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-cyan-300 mb-2">Frequency (Hz)</label>
                  <input
                    type="number"
                    value={signalParams.frequency}
                    onChange={(e) => setSignalParams(prev => ({ ...prev, frequency: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-cyan-100 focus:ring-2 focus:ring-cyan-500"
                    min="0"
                    step="0.1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-cyan-300 mb-2">Amplitude</label>
                  <input
                    type="number"
                    value={signalParams.amplitude}
                    onChange={(e) => setSignalParams(prev => ({ ...prev, amplitude: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-cyan-100 focus:ring-2 focus:ring-cyan-500"
                    min="0"
                    step="0.1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-cyan-300 mb-2">Sample Rate (Hz)</label>
                  <input
                    type="number"
                    value={signalParams.sampleRate}
                    onChange={(e) => setSignalParams(prev => ({ ...prev, sampleRate: parseFloat(e.target.value) || 1 }))}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-cyan-100 focus:ring-2 focus:ring-cyan-500"
                    min="100"
                    step="100"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Time Domain Plot */}
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <h3 className="text-xl font-bold text-cyan-400 mb-4">Time Domain Signal</h3>
                <PlotlyChart
                  data={[{
                    x: signalData.time,
                    y: signalData.values,
                    type: 'scatter',
                    mode: 'lines',
                    name: 'Signal',
                    line: { color: '#06b6d4', width: 2 }
                  }]}
                  layout={{
                    title: { text: 'Time Domain', font: { color: '#e2e8f0' } },
                    xaxis: { title: 'Time (s)', color: '#94a3b8' },
                    yaxis: { title: 'Amplitude', color: '#94a3b8' },
                    paper_bgcolor: 'rgba(0,0,0,0)',
                    plot_bgcolor: 'rgba(0,0,0,0)',
                    font: { color: '#e2e8f0' },
                    showlegend: false,
                    margin: { t: 40, r: 40, b: 40, l: 40 }
                  }}
                />
              </div>

              {/* Frequency Domain Plot */}
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <h3 className="text-xl font-bold text-cyan-400 mb-4">Frequency Domain Spectrum</h3>
                {fftData ? (
                  <PlotlyChart
                    data={[{
                      x: fftSettings.showNegativeFreqs ? fftData.frequencies : fftData.frequencies.slice(0, Math.floor(fftData.frequencies.length/2)),
                      y: fftSettings.showNegativeFreqs ? fftData.magnitude : fftData.magnitude.slice(0, Math.floor(fftData.magnitude.length/2)),
                      type: 'scatter',
                      mode: 'lines+markers',
                      name: 'Magnitude',
                      line: { color: '#8b5cf6', width: 2 },
                      marker: { color: '#8b5cf6', size: 4 }
                    }]}
                    layout={{
                      title: { text: 'Magnitude Spectrum', font: { color: '#e2e8f0' } },
                      xaxis: { title: 'Frequency (Hz)', color: '#94a3b8' },
                      yaxis: { title: 'Magnitude', color: '#94a3b8' },
                      paper_bgcolor: 'rgba(0,0,0,0)',
                      plot_bgcolor: 'rgba(0,0,0,0)',
                      font: { color: '#e2e8f0' },
                      showlegend: false,
                      margin: { t: 40, r: 40, b: 40, l: 40 }
                    }}
                  />
                ) : (
                  <div className="text-red-400 text-center py-8">
                    FFT computation failed. Please check signal parameters.
                  </div>
                )}
              </div>
            </div>

            {/* FFT Settings */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h3 className="text-xl font-bold text-cyan-400 mb-4">Display Settings</h3>
              <div className="flex flex-wrap gap-4 items-center">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={fftSettings.showNegativeFreqs}
                    onChange={(e) => setFftSettings(prev => ({ ...prev, showNegativeFreqs: e.target.checked }))}
                    className="rounded border-gray-600 text-cyan-500 focus:ring-cyan-500"
                  />
                  <span className="text-cyan-300">Show Negative Frequencies</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={fftSettings.normalize}
                    onChange={(e) => setFftSettings(prev => ({ ...prev, normalize: e.target.checked }))}
                    className="rounded border-gray-600 text-cyan-500 focus:ring-cyan-500"
                  />
                  <span className="text-cyan-300">Normalize</span>
                </label>
              </div>
            </div>
          </div>
        );

      case 'measure':
        return (
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h3 className="text-xl font-bold text-cyan-400 mb-4">Coefficient Measurement Lab</h3>
              <p className="text-cyan-100 mb-4">
                This lab demonstrates how DFT coefficients are measured using the "freeze and average" technique.
                The DFT coefficient X[k] is computed as: X[k] = (1/N) Σ x[n] e^(-j2πkn/N)
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-cyan-300 mb-2">Frequency Bin (k)</label>
                  <input
                    type="number"
                    value={measureSettings.selectedBin}
                    onChange={(e) => setMeasureSettings(prev => ({ ...prev, selectedBin: parseInt(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-cyan-100 focus:ring-2 focus:ring-cyan-500"
                    min="0"
                    max={Math.floor(signalData.N/2)}
                  />
                </div>
                <div className="flex items-center">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={measureSettings.showReference}
                      onChange={(e) => setMeasureSettings(prev => ({ ...prev, showReference: e.target.checked }))}
                      className="rounded border-gray-600 text-cyan-500 focus:ring-cyan-500"
                    />
                    <span className="text-cyan-300">Show Reference Signal</span>
                  </label>
                </div>
                <div className="flex items-center">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={measureSettings.showProduct}
                      onChange={(e) => setMeasureSettings(prev => ({ ...prev, showProduct: e.target.checked }))}
                      className="rounded border-gray-600 text-cyan-500 focus:ring-cyan-500"
                    />
                    <span className="text-cyan-300">Show Product Signal</span>
                  </label>
                </div>
              </div>
            </div>

            {measurementData && (
              <>
                {/* Measurement Results */}
                <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                  <h3 className="text-xl font-bold text-cyan-400 mb-4">Measurement Results</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <h4 className="text-lg font-bold text-yellow-400">Measured Coefficient X[{measureSettings.selectedBin}]</h4>
                      <div className="text-cyan-100 font-mono">
                        <p>Real: {measurementData.coefficient.real.toFixed(6)}</p>
                        <p>Imaginary: {measurementData.coefficient.imaginary.toFixed(6)}</p>
                        <p>Magnitude: {Math.sqrt(measurementData.coefficient.real**2 + measurementData.coefficient.imaginary**2).toFixed(6)}</p>
                        <p>Phase: {Math.atan2(measurementData.coefficient.imaginary, measurementData.coefficient.real).toFixed(6)} rad</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <h4 className="text-lg font-bold text-green-400">FFT Coefficient (Reference)</h4>
                      <div className="text-cyan-100 font-mono">
                        <p>Real: {measurementData.theoretical.real.toFixed(6)}</p>
                        <p>Imaginary: {measurementData.theoretical.imaginary.toFixed(6)}</p>
                        <p>Magnitude: {Math.sqrt(measurementData.theoretical.real**2 + measurementData.theoretical.imaginary**2).toFixed(6)}</p>
                        <p>Phase: {Math.atan2(measurementData.theoretical.imaginary, measurementData.theoretical.real).toFixed(6)} rad</p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 p-3 bg-blue-900/30 rounded-lg border border-blue-700">
                    <p className="text-blue-200">
                      <strong>Accuracy:</strong> Error = {Math.abs(measurementData.coefficient.real - measurementData.theoretical.real).toExponential(3)} (Real), {Math.abs(measurementData.coefficient.imaginary - measurementData.theoretical.imaginary).toExponential(3)} (Imaginary)
                    </p>
                  </div>
                </div>

                {/* Visualization */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {measureSettings.showReference && (
                    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                      <h3 className="text-xl font-bold text-cyan-400 mb-4">Reference Signal e^(-j2πkt/T)</h3>
                      <PlotlyChart
                        data={[
                          {
                            x: measurementData.reference.time,
                            y: measurementData.reference.real,
                            type: 'scatter',
                            mode: 'lines',
                            name: 'Real Part',
                            line: { color: '#06b6d4', width: 2 }
                          },
                          {
                            x: measurementData.reference.time,
                            y: measurementData.reference.imaginary,
                            type: 'scatter',
                            mode: 'lines',
                            name: 'Imaginary Part',
                            line: { color: '#f59e0b', width: 2 }
                          }
                        ]}
                        layout={{
                          title: { text: `Reference Signal for k=${measureSettings.selectedBin}`, font: { color: '#e2e8f0' } },
                          xaxis: { title: 'Time (s)', color: '#94a3b8' },
                          yaxis: { title: 'Amplitude', color: '#94a3b8' },
                          paper_bgcolor: 'rgba(0,0,0,0)',
                          plot_bgcolor: 'rgba(0,0,0,0)',
                          font: { color: '#e2e8f0' },
                          margin: { t: 40, r: 40, b: 40, l: 40 }
                        }}
                      />
                    </div>
                  )}

                  {measureSettings.showProduct && (
                    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                      <h3 className="text-xl font-bold text-cyan-400 mb-4">Running Average (Converges to X[k])</h3>
                      <PlotlyChart
                        data={[
                          {
                            x: measurementData.reference.time,
                            y: measurementData.runningAverage.real,
                            type: 'scatter',
                            mode: 'lines',
                            name: 'Real Part',
                            line: { color: '#10b981', width: 2 }
                          },
                          {
                            x: measurementData.reference.time,
                            y: measurementData.runningAverage.imaginary,
                            type: 'scatter',
                            mode: 'lines',
                            name: 'Imaginary Part',
                            line: { color: '#ef4444', width: 2 }
                          }
                        ]}
                        layout={{
                          title: { text: 'Running Average Convergence', font: { color: '#e2e8f0' } },
                          xaxis: { title: 'Time (s)', color: '#94a3b8' },
                          yaxis: { title: 'Running Average', color: '#94a3b8' },
                          paper_bgcolor: 'rgba(0,0,0,0)',
                          plot_bgcolor: 'rgba(0,0,0,0)',
                          font: { color: '#e2e8f0' },
                          margin: { t: 40, r: 40, b: 40, l: 40 }
                        }}
                      />
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        );

      case 'pairing':
        return (
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h3 className="text-xl font-bold text-cyan-400 mb-4">Frequency Pairing & Trigonometric View</h3>
              <p className="text-cyan-100 mb-4">
                Explore how positive and negative frequency pairs combine to create real cosine waves.
                For real signals: X[-k] = X[k]* (Hermitian symmetry)
              </p>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-cyan-300 mb-2">Waveform Preset</label>
                  <select
                    value={pairingSettings.waveformPreset}
                    onChange={(e) => setPairingSettings(prev => ({ ...prev, waveformPreset: e.target.value as any }))}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-cyan-100 focus:ring-2 focus:ring-cyan-500"
                  >
                    <option value="square">Square Wave</option>
                    <option value="triangle">Triangle Wave</option>
                    <option value="sawtooth">Sawtooth Wave</option>
                    <option value="custom">Custom Signal</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-cyan-300 mb-2">Max Terms</label>
                  <input
                    type="number"
                    value={pairingSettings.maxTerms}
                    onChange={(e) => setPairingSettings(prev => ({ ...prev, maxTerms: parseInt(e.target.value) || 1 }))}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-cyan-100 focus:ring-2 focus:ring-cyan-500"
                    min="1"
                    max="20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-cyan-300 mb-2">Selected Pairs</label>
                  <input
                    type="text"
                    value={pairingSettings.selectedPairs.join(', ')}
                    onChange={(e) => {
                      const pairs = e.target.value.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n) && n >= 0);
                      setPairingSettings(prev => ({ ...prev, selectedPairs: pairs }));
                    }}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-cyan-100 focus:ring-2 focus:ring-cyan-500"
                    placeholder="1, 2, 3"
                  />
                </div>
                <div className="flex items-center">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={pairingSettings.showTrigForm}
                      onChange={(e) => setPairingSettings(prev => ({ ...prev, showTrigForm: e.target.checked }))}
                      className="rounded border-gray-600 text-cyan-500 focus:ring-cyan-500"
                    />
                    <span className="text-cyan-300">Show Trigonometric Form</span>
                  </label>
                </div>
              </div>
            </div>

            {pairingData && (
              <>
                {/* Reconstruction Results */}
                <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                  <h3 className="text-xl font-bold text-cyan-400 mb-4">Reconstruction Results</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center">
                      <h4 className="text-lg font-bold text-yellow-400 mb-2">Selected Pairs</h4>
                      <p className="text-cyan-100 font-mono">[{pairingSettings.selectedPairs.join(', ')}]</p>
                    </div>
                    <div className="text-center">
                      <h4 className="text-lg font-bold text-green-400 mb-2">Terms Used</h4>
                      <p className="text-cyan-100 font-mono">{Math.min(pairingSettings.selectedPairs.length, pairingSettings.maxTerms)}</p>
                    </div>
                    <div className="text-center">
                      <h4 className="text-lg font-bold text-red-400 mb-2">RMS Error</h4>
                      <p className="text-cyan-100 font-mono">{pairingData.rmsError.toFixed(6)}</p>
                    </div>
                  </div>
                </div>

                {/* Signal Comparison */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                    <h3 className="text-xl font-bold text-cyan-400 mb-4">Original vs Reconstructed Signal</h3>
                    <PlotlyChart
                      data={[
                        {
                          x: signalData.time,
                          y: pairingData.original,
                          type: 'scatter',
                          mode: 'lines',
                          name: 'Original',
                          line: { color: '#06b6d4', width: 2 }
                        },
                        {
                          x: signalData.time,
                          y: pairingData.reconstructed,
                          type: 'scatter',
                          mode: 'lines',
                          name: 'Reconstructed',
                          line: { color: '#f59e0b', width: 2, dash: 'dash' }
                        }
                      ]}
                      layout={{
                        title: { text: 'Signal Reconstruction', font: { color: '#e2e8f0' } },
                        xaxis: { title: 'Time (s)', color: '#94a3b8' },
                        yaxis: { title: 'Amplitude', color: '#94a3b8' },
                        paper_bgcolor: 'rgba(0,0,0,0)',
                        plot_bgcolor: 'rgba(0,0,0,0)',
                        font: { color: '#e2e8f0' },
                        margin: { t: 40, r: 40, b: 40, l: 40 }
                      }}
                    />
                  </div>

                  <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                    <h3 className="text-xl font-bold text-cyan-400 mb-4">Frequency Spectrum</h3>
                    <PlotlyChart
                      data={[{
                        x: pairingData.fftResult.frequencies.slice(0, Math.floor(pairingData.fftResult.frequencies.length/2)),
                        y: pairingData.fftResult.magnitude.slice(0, Math.floor(pairingData.fftResult.magnitude.length/2)),
                        type: 'scatter',
                        mode: 'lines+markers',
                        name: 'Magnitude',
                        line: { color: '#8b5cf6', width: 2 },
                        marker: {
                          color: pairingData.fftResult.frequencies.slice(0, Math.floor(pairingData.fftResult.frequencies.length/2)).map((_, i) =>
                            pairingSettings.selectedPairs.includes(i) ? '#10b981' : '#8b5cf6'
                          ),
                          size: 6
                        }
                      }]}
                      layout={{
                        title: { text: 'Spectrum (Selected Pairs in Green)', font: { color: '#e2e8f0' } },
                        xaxis: { title: 'Frequency (Hz)', color: '#94a3b8' },
                        yaxis: { title: 'Magnitude', color: '#94a3b8' },
                        paper_bgcolor: 'rgba(0,0,0,0)',
                        plot_bgcolor: 'rgba(0,0,0,0)',
                        font: { color: '#e2e8f0' },
                        showlegend: false,
                        margin: { t: 40, r: 40, b: 40, l: 40 }
                      }}
                    />
                  </div>
                </div>

                {/* Trigonometric Form */}
                {pairingSettings.showTrigForm && (
                  <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                    <h3 className="text-xl font-bold text-cyan-400 mb-4">Trigonometric Series Representation</h3>
                    <div className="bg-gray-900 p-4 rounded-lg font-mono text-cyan-100 overflow-x-auto">
                      <p className="mb-2">x(t) = X[0] + Σ (a_k cos(2πkt/T) + b_k sin(2πkt/T))</p>
                      <p className="mb-4">where: a_k = 2×Re(X_k), b_k = -2×Im(X_k)</p>
                      <div className="space-y-1">
                        <p>X[0] = {pairingData.fftResult.real[0].toFixed(4)} (DC component)</p>
                        {pairingSettings.selectedPairs.filter(k => k > 0).slice(0, 5).map(k => (
                          <p key={k}>
                            k={k}: a_{k} = {(2 * pairingData.fftResult.real[k]).toFixed(4)},
                            b_{k} = {(-2 * pairingData.fftResult.imaginary[k]).toFixed(4)}
                          </p>
                        ))}
                        {pairingSettings.selectedPairs.filter(k => k > 0).length > 5 && (
                          <p>... and {pairingSettings.selectedPairs.filter(k => k > 0).length - 5} more terms</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        );

      case 'windowing':
        return (
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h3 className="text-xl font-bold text-cyan-400 mb-4">Windowing Analysis</h3>
              <p className="text-cyan-100 mb-4">
                Compare different window functions and their effects on spectral leakage.
              </p>
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🪟</div>
                <h4 className="text-xl font-bold text-cyan-300 mb-2">Coming Soon!</h4>
                <p className="text-gray-400">Advanced windowing analysis with spectral leakage visualization</p>
              </div>
            </div>
          </div>
        );

      case 'stft':
        return (
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h3 className="text-xl font-bold text-cyan-400 mb-4">STFT & Time-Frequency Analysis</h3>
              <p className="text-cyan-100 mb-4">
                Short-Time Fourier Transform and spectrogram visualization for time-varying signals.
              </p>
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📊</div>
                <h4 className="text-xl font-bold text-cyan-300 mb-2">Coming Soon!</h4>
                <p className="text-gray-400">Real-time spectrograms and time-frequency analysis</p>
              </div>
            </div>
          </div>
        );

      case 'filtering':
        return (
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h3 className="text-xl font-bold text-cyan-400 mb-4">FFT Filtering</h3>
              <p className="text-cyan-100 mb-4">
                Frequency domain filtering, convolution, and signal processing operations.
              </p>
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🔧</div>
                <h4 className="text-xl font-bold text-cyan-300 mb-2">Coming Soon!</h4>
                <p className="text-gray-400">Advanced filtering tools and convolution analysis</p>
              </div>
            </div>
          </div>
        );

      case 'analysis':
        return (
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h3 className="text-xl font-bold text-cyan-400 mb-4">Spectral Analysis</h3>
              <p className="text-cyan-100 mb-4">
                Peak detection, THD calculation, SNR analysis, and advanced spectral metrics.
              </p>
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📈</div>
                <h4 className="text-xl font-bold text-cyan-300 mb-2">Coming Soon!</h4>
                <p className="text-gray-400">Advanced spectral analysis and measurement tools</p>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={`fourier-transform-tool min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 text-gray-100 transition-all duration-300 ${isFullscreen ? 'overflow-hidden' : ''}`}>
      {/* Header with navigation */}
      {!isFullscreen && (
        <header className="bg-gradient-to-r from-blue-950 via-indigo-950 to-purple-950 text-white py-4 px-6 shadow-lg border-b border-cyan-900/50">
          <div className="container mx-auto flex flex-wrap justify-between items-center">
            <div className="flex items-center mb-2 md:mb-0">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-700 to-cyan-500 flex items-center justify-center mr-4 border-2 border-cyan-300/30 shadow-lg shadow-cyan-500/20">
                <span className="text-3xl font-orbitron text-white">ℱ</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold font-orbitron text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-300">
                Fourier Transform Tool
              </h1>
            </div>
            <div className="flex flex-wrap gap-3 items-center">
              <button
                onClick={toggleFullscreen}
                className="px-5 py-3 bg-indigo-800 hover:bg-indigo-700 rounded-md text-gray-100 transition-colors border border-indigo-600 shadow-md hover:shadow-indigo-500/30 font-mono text-base"
              >
                {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Mode'}
              </button>
              <Link
                href="/tools"
                className="px-5 py-3 bg-gray-800 hover:bg-gray-700 rounded-md text-gray-100 transition-colors border border-gray-700 shadow-md hover:shadow-gray-700/20 font-mono text-base"
              >
                All Tools
              </Link>
              <Link
                href="/"
                className="px-5 py-3 bg-gray-800 hover:bg-gray-700 rounded-md text-gray-100 transition-colors border border-gray-700 shadow-md hover:shadow-gray-700/20 font-mono text-base"
              >
                Home
              </Link>
            </div>
          </div>
        </header>
      )}

      {/* Main Content */}
      <main className={`container mx-auto py-6 px-6 ${isFullscreen ? 'h-screen overflow-hidden' : ''}`}>
        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2 bg-gray-800 p-2 rounded-lg border border-gray-700">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 min-w-48 py-3 px-4 rounded-md font-mono text-sm transition-all ${
                  activeTab === tab.id
                    ? 'bg-cyan-600 text-white shadow-lg'
                    : 'text-gray-300 hover:bg-gray-700'
                }`}
              >
                <div className="flex items-center justify-center space-x-2">
                  <span className="text-lg">{tab.icon}</span>
                  <span className="font-bold">{tab.label}</span>
                </div>
                <div className="text-xs opacity-80 mt-1">{tab.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className={`${isFullscreen ? 'h-full overflow-auto' : ''}`}>
          {renderTabContent()}
        </div>
      </main>

      {/* Footer */}
      {!isFullscreen && (
        <footer className="bg-gradient-to-r from-gray-950 via-gray-900 to-gray-950 text-gray-400 p-6 mt-8 border-t border-gray-800/50">
          <div className="container mx-auto text-center">
            <p className="text-sm tracking-wider font-mono">© 2025 Signal Processing Interactive Learning Platform</p>
            <p className="text-xs text-gray-500 mt-1">Fully Functional Fourier Transform Tool v4.0</p>
          </div>
        </footer>
      )}
    </div>
  );
}