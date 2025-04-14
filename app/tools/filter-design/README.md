# Digital Filter Design Tool

This tool allows users to design and visualize different types of digital filters, including:

- Lowpass filters
- Highpass filters 
- Bandpass filters
- Bandstop filters

## Features

- Interactive selection of filter types
- Adjustable cutoff frequencies
- Visual representation of filter specifications
- Real-time calculation and visualization of ideal filter impulse responses
- Frequency response visualization (magnitude and phase)

## Implementation Details

### Filter Types

The tool implements the following ideal filter impulse response formulas:

- **Lowpass Filter**: `h[k] = ωc * sinc(k * ωc)`
- **Highpass Filter**: `h[k] = δ[k] - ωc * sinc(k * ωc)`
- **Bandpass Filter**: `h[k] = ωc2 * sinc(k * ωc2) - ωc1 * sinc(k * ωc1)`
- **Bandstop Filter**: `h[k] = δ[k] - ωc2 * sinc(k * ωc2) + ωc1 * sinc(k * ωc1)`

Where:
- `ωc`, `ωc1`, `ωc2` are the normalized cutoff frequencies (0 to 1, where 1 represents π radians/sample)
- `sinc(x) = sin(πx)/(πx)` is the normalized sinc function
- `δ[k]` is the Kronecker delta function (1 when k=0, 0 otherwise)

### Visualization

The tool provides two primary visualizations:

1. **Impulse Response**: Shows the time-domain representation of the filter
2. **Frequency Response**: Displays either the magnitude or phase response in the frequency domain

### Technical Implementation

- Filter responses are calculated using ideal filter formulas
- Hamming window is applied to reduce the Gibbs phenomenon in the impulse response
- Discrete Fourier Transform (DFT) is used to calculate the frequency response
- Canvas-based visualization for performance
- Responsive design that works in both standard and fullscreen modes

## Component Structure

- `FilterDesigner`: Main component coordinating the overall tool
- `FilterTypeSelector`: Manages filter type selection
- `FrequencyControls`: Controls for adjusting cutoff frequencies
- `ImpulseResponsePlot`: Visualization of the time-domain response
- `FrequencyResponsePlot`: Visualization of the frequency-domain response
- `filterUtils.ts`: Utility functions for filter calculations

## Future Enhancements

Potential future improvements:

- Add more window types (Hamming, Blackman, Kaiser, etc.)
- Support for designing FIR filters using other methods (windowing, least squares, etc.)
- IIR filter design capabilities
- Filter coefficient export
- Time and frequency response zooming
- 3D visualization options for the frequency response
- Pole-zero plot for designed filters 