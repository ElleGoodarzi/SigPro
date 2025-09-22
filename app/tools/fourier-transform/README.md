# Fourier Transform Tool

A comprehensive interactive tool for signal analysis and frequency domain visualization.

## Features

### Signal Generation
- **Multiple Signal Types**: Sine, Cosine, Square, Sawtooth, Triangle, Chirp, and White Noise
- **Parameter Control**: Amplitude, Frequency, Phase, and DC Offset
- **Advanced Options**: Configurable phase and offset parameters

### FFT Analysis
- **Configurable Settings**: Sample rate, duration, window functions
- **Window Functions**: None, Hann, Hamming, Blackman, Flattop
- **Processing Options**: Normalization and zero padding
- **Real-time Computation**: Instant updates when parameters change

### Visualizations
- **Time Domain Plot**: Interactive signal display with statistics
- **Frequency Domain Plot**: Magnitude, phase, real, and imaginary components
- **Spectrum Analyzer**: Advanced frequency analysis with peak detection

### Educational Content
- **Mathematical Background**: Explanations of Fourier transforms
- **Application Examples**: Real-world use cases
- **Interactive Learning**: Hands-on exploration of signal properties

## Usage

1. **Select Signal Type**: Choose from available signal types
2. **Adjust Parameters**: Use sliders to modify signal properties
3. **Configure FFT**: Set sample rate, duration, and windowing
4. **Analyze Results**: Switch between time and frequency domain views
5. **Explore Spectrum**: Use the spectrum analyzer for detailed analysis

## Technical Details

### Signal Generation
- Supports multiple waveform types with mathematical precision
- Real-time parameter adjustment with immediate visualization
- Window function application for spectral analysis

### FFT Implementation
- Uses the existing `computeFullFFT` function from the signal processing library
- Supports both positive and negative frequency components
- Configurable normalization and zero padding options

### Visualization
- Interactive Plotly.js charts with zoom and pan capabilities
- Real-time statistics display (max, min, RMS, mean)
- Peak detection and frequency analysis tools

## File Structure

```
fourier-transform/
├── components/
│   ├── SignalControls.tsx      # Signal generation controls
│   └── FFTSettings.tsx         # FFT configuration panel
├── Visualizations/
│   ├── TimeDomainPlot.tsx      # Time domain visualization
│   ├── FrequencyDomainPlot.tsx # Frequency domain plots
│   └── SpectrumAnalyzer.tsx    # Advanced spectrum analysis
├── utils/
│   └── signalGenerator.ts      # Signal generation utilities
├── types/
│   └── fourierTypes.ts         # TypeScript type definitions
├── page.tsx                    # Main tool page
└── README.md                   # This file
```

## Dependencies

- **React**: Component framework
- **TypeScript**: Type safety
- **Plotly.js**: Interactive visualizations
- **Tailwind CSS**: Styling
- **Signal Processing Library**: FFT computations

## Educational Value

This tool provides hands-on experience with:
- Signal generation and manipulation
- Fourier transform concepts
- Frequency domain analysis
- Spectral analysis techniques
- Window function effects
- Signal processing fundamentals

Perfect for students learning digital signal processing, communications, or any field requiring frequency domain analysis.
