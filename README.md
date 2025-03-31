# Signal Processing Lab Simulator

A modern, interactive web-based simulator for teaching signal processing concepts with a sci-fi aesthetic.

## 🚀 Overview

This project is a Next.js-based web application that provides an interactive environment for learning signal processing concepts. It features a MATLAB/Octave-like code editor, real-time visualizations, and a structured learning path through various signal processing topics.

## 🛠️ Technical Stack

### Core Technologies
- **Framework**: Next.js 14.2.25
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: DaisyUI 4.12.24

### Key Libraries
- **Code Editor**: Monaco Editor
- **Visualization**: Plotly.js
- **Code Execution**: Octave.js
- **State Management**: React Hooks
- **Styling**: Custom CSS with Tailwind

## 📁 Project Structure

```
/app
├── /labs
│   └── /matlab-functions-sampling
│       └── page.tsx
├── /simulator
│   └── page.tsx
└── /api
    └── /execute
        └── route.ts
```

## 🔧 Core Features

### 1. Code Editor
- Monaco Editor integration
- MATLAB/Octave syntax highlighting
- Terminal-like interface
- Real-time code execution
- Error handling and display

### 2. Visualization System
- Time domain plots
- Frequency domain plots
- Interactive Plotly charts
- Custom sci-fi styling
- Real-time updates

### 3. Learning Interface
- Step-based progress tracking
- Interactive navigation
- Educational content structure
- Visual progress indicators

### 4. UI/UX Design
- Sci-fi aesthetic
- Neon effects
- Grid blueprint background
- CRT overlay effects
- Holographic elements

## 🎨 Styling System

### Custom CSS Classes
```css
.space-mono      /* Terminal text styling */
.grid-blueprint  /* Background grid */
.panel-sci-fi    /* Container styling */
.crt-overlay     /* Visual effects */
.hologram        /* Animation effects */
```

### Theme Components
- Neon text effects
- Grid blueprint background
- Panel styling with borders
- Shadow effects
- Animation system

## 🔄 Data Flow

1. **Code Input**
   - User enters MATLAB/Octave code
   - Code is validated and processed

2. **Code Execution**
   - Code sent to API endpoint
   - Octave.js processes code
   - Results are generated

3. **Visualization**
   - Plot data is extracted
   - Plotly charts are updated
   - UI is refreshed

## 🛡️ Error Handling

### Code Execution
- Syntax error detection
- Runtime error handling
- Console error display

### UI States
- Loading states
- Error messages
- Fallback displays

## 📊 API Integration

### Code Execution Flow
1. User enters code
2. Code sent to `/api/execute`
3. Octave.js processes code
4. Results returned to frontend
5. Visualizations updated

### Data Processing
- MATLAB/Octave code parsing
- Figure data extraction
- Plot data formatting
- Error handling

## 🔒 Security Considerations

- Code execution sandboxing
- Input validation
- Error handling
- Resource limits

## 🚀 Performance Optimizations

### Code Execution
- Asynchronous processing
- Batch updates
- Error recovery

### Rendering
- Efficient state updates
- Optimized re-renders
- Lazy loading

## 📦 Dependencies

```json
{
  "dependencies": {
    "next": "14.2.25",
    "react": "latest",
    "plotly.js": "latest",
    "monaco-editor": "latest",
    "octave.js": "latest",
    "tailwindcss": "latest",
    "daisyui": "4.12.24"
  }
}
```

## 🎯 Future Improvements

### Planned Features
- Additional plot types
- More interactive features
- Enhanced error handling
- Performance optimizations
- Additional lab content

### Technical Enhancements
- Code execution optimization
- Visualization improvements
- UI/UX refinements
- Mobile responsiveness

## 🛠️ Development Setup

1. **Prerequisites**
   - Node.js (v18 or higher)
   - npm or yarn

2. **Installation**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Development Server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

4. **Build**
   ```bash
   npm run build
   # or
   yarn build
   ```

## 📝 Usage Examples

### Basic Signal Generation
```matlab
% Generate a simple sine wave
t = 0:0.01:2;
f = 2;
x = sin(2*pi*f*t);

% Plot the signal
plot(t, x);
title('Time Domain Signal');
xlabel('Time (s)');
ylabel('Amplitude');
grid on;
```

### FFT Analysis
```matlab
% Calculate and plot FFT
Fs = 100;
N = length(x);
freq = (-N/2:N/2-1)*(Fs/N);
X = fftshift(fft(x))/N;

plot(freq, abs(X));
title('Frequency Domain');
xlabel('Frequency (Hz)');
ylabel('Magnitude');
grid on;
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👥 Authors

- Elle Goodarzi - Initial work

## 🙏 Acknowledgments

- Next.js team for the framework
- Plotly.js team for visualization
- Octave.js team for code execution
- All contributors and users
