# Signal Processing Lab Simulator

A modern web-based simulator for teaching signal processing concepts through interactive visualizations and code execution.

## Overview

This Next.js application provides an educational environment for learning signal processing with a MATLAB/Octave-compatible code editor, real-time visualizations, and structured learning modules.

## Technical Stack

- **Framework**: Next.js 14.2.25 with TypeScript
- **Styling**: Tailwind CSS with DaisyUI
- **Code Editor**: Monaco Editor with MATLAB/Octave syntax
- **Visualization**: Plotly.js for interactive charts
- **Code Execution**: Octave.js for MATLAB compatibility

## Key Features

### Code Editor
- MATLAB/Octave syntax highlighting and execution
- Real-time error handling and console output
- Terminal-style interface

### Visualization System
- Time and frequency domain plotting
- Interactive charts with zoom and pan
- Real-time plot updates

### Learning Tools
- Structured lab modules and tutorials
- Z-Transform interactive visualizer
- Filter design tools
- Signal comparison utilities

## Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Usage

The simulator supports standard MATLAB/Octave syntax for signal processing operations:

```matlab
% Generate and plot a signal
t = 0:0.01:2;
x = sin(2*pi*2*t);
plot(t, x);
title('Sine Wave');
```

## Project Structure

```
app/
├── labs/           # Educational lab modules
├── tools/          # Interactive tools (Z-transform, filters)
├── tutorials/      # Learning materials
├── api/           # Backend API routes
└── components/    # Reusable UI components
```

## Z-Transform Tool

Interactive 3D visualization for exploring Z-transforms, poles/zeros analysis, and system properties. Features include:

- Complex plane visualization with ROC
- Educational signal presets
- Real-time system analysis
- Stability and causality assessment

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Author

Elle Goodarzi
