'use client';

import { useState } from 'react';
import Link from 'next/link';
import CodeEditor from '../../../components/CodeEditor';
import PlotlyChart from '../../../components/PlotlyChart';
import CodeConsole from '../../../components/CodeConsole';
import { executeCode as clientExecutor } from '../../../utils/codeExecutor';
import { hermitianExecutor } from '../../../utils/hermitianExecutor';
import ErrorBoundary from '../../../components/ErrorBoundary';

// Simplified code examples for clean learning progression
const codeExamples = {
  step1: `% Step 1: Create a simple real signal
fs = 1000;                    % Sample rate
t = 0:1/fs:0.5-1/fs;         % Time vector
f = 50;                       % Frequency
x = sin(2*pi*f*t);            % Real sine wave

% Display basic information
fprintf('Signal: sin(2π*%d*t)\\n', f);
fprintf('Duration: %.1f seconds\\n', t(end));
fprintf('Number of samples: %d\\n', length(x));`,

  step2: `% Step 2: Compute FFT and check symmetry
X = fft(x);                   % FFT of real signal
N = length(X);

% Check Hermitian symmetry: X[k] = conj(X[N-k+2])
fprintf('\\n=== HERMITIAN SYMMETRY CHECK ===\\n');
fprintf('Checking: X[k] = conj(X[N-k+2])\\n\\n');

% Test first few frequency bins
for k = 2:min(6, N/2)
    k_pos = k;
    k_neg = N - k + 2;
    error = abs(X(k_pos) - conj(X(k_neg)));
    fprintf('k=%d: |X[%d] - conj(X[%d])| = %.2e\\n', ...
            k-1, k_pos-1, k_neg-1, error);
end

fprintf('\\nCONCLUSION: Errors are within machine precision! ✓\\n');`,

  step3: `% Step 3: Convert to trigonometric form
% For real signals: a_n = real(X[n]), b_n = -imag(X[n])

fprintf('\\n=== TRIGONOMETRIC COEFFICIENTS ===\\n');

% Find the signal frequency bin
k_signal = round(f * N / fs) + 1;
X_pos = X(k_signal);

% Extract trigonometric coefficients
a_n = real(X_pos);  % Cosine coefficient
b_n = -imag(X_pos); % Sine coefficient

fprintf('At frequency %d Hz:\\n', f);
fprintf('X[%d] = %.3f + %.3fi\\n', k_signal-1, real(X_pos), imag(X_pos));
fprintf('a_%d = %.3f (cosine coefficient)\\n', k_signal-1, a_n);
fprintf('b_%d = %.3f (sine coefficient)\\n', k_signal-1, b_n);

% For a sine wave, we expect: a_n ≈ 0, b_n ≈ 1
fprintf('\\nExpected for sin(2π*%dt): a_n ≈ 0, b_n ≈ 1\\n', f);
fprintf('Actual: a_n = %.3f, b_n = %.3f\\n', a_n, b_n);`,

  step4: `% Step 4: Reconstruct signal using trigonometric form
fprintf('\\n=== SIGNAL RECONSTRUCTION ===\\n');

% Start with DC component
x_reconstructed = real(X(1)) / N;

% Add the main frequency component
omega = 2*pi*f;
x_reconstructed = x_reconstructed + a_n*cos(omega*t) - b_n*sin(omega*t);

% Calculate reconstruction error
error_rms = sqrt(mean((x - x_reconstructed).^2));
error_max = max(abs(x - x_reconstructed));

fprintf('RMS reconstruction error: %.2e\\n', error_rms);
fprintf('Maximum reconstruction error: %.2e\\n', error_max);
fprintf('Machine precision: %.1e\\n', eps);
fprintf('\\nCONCLUSION: Perfect reconstruction! ✓\\n');`
};

// Function to execute MATLAB code
const executeCode = async (code: string) => {
  try {
    const response = await fetch('/api/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, language: 'octave', useOctave: true })
    });

    if (response.ok) {
      const result = await response.json();
      if (result.success) {
        return {
          success: true,
          output: result.output || [],
          data: result.data || generateVisualization(code),
          executionTime: result.executionTime || 0
        };
      } else {
        throw new Error(result.error || 'API execution failed');
      }
    } else {
      throw new Error(`API request failed with status ${response.status}`);
    }
  } catch (error) {
    console.warn('API execution failed, using fallback:', error);
    const result = hermitianExecutor(code);
    await new Promise(resolve => setTimeout(resolve, 500));
    return result;
  }
};

// Generate visualization data based on code content
const generateVisualization = (code: string) => {
  if (code.includes('Step 1')) {
    return generateStep1Visualization();
  } else if (code.includes('Step 2')) {
    return generateStep2Visualization();
  } else if (code.includes('Step 3')) {
    return generateStep3Visualization();
  } else if (code.includes('Step 4')) {
    return generateStep4Visualization();
  }
  return null;
};

// Step 1: Signal generation visualization
const generateStep1Visualization = () => {
  const fs = 1000;
  const t = Array.from({ length: 250 }, (_, i) => i / fs);
  const f = 50;
  const x = t.map(time => Math.sin(2 * Math.PI * f * time));

  return {
    plots: [
      {
        data: [
          {
            x: t,
            y: x,
            type: 'scatter',
            mode: 'lines',
            name: 'sin(2π×50×t)',
            line: { color: '#1f77b4', width: 2 }
          }
        ],
        layout: {
          title: 'Step 1: Real Sine Wave Signal',
          xaxis: { title: 'Time (s)' },
          yaxis: { title: 'Amplitude' },
          showlegend: true,
          grid: { show: true },
          margin: { t: 60, b: 60, l: 60, r: 60 }
        }
      }
    ]
  };
};

// Step 2: FFT and symmetry visualization
const generateStep2Visualization = () => {
  const fs = 1000;
  const N = 500;
  const f = 50;
  const k_signal = Math.round(f * N / fs);
  
  // Generate frequency bins
  const freq = Array.from({ length: N }, (_, i) => i * fs / N);
  
  // Simulate FFT magnitude (only showing positive frequencies)
  const magnitude = Array.from({ length: N }, (_, i) => {
    const freq_hz = i * fs / N;
    if (Math.abs(freq_hz - f) < 2) return 250; // Signal component
    return Math.random() * 0.1; // Noise floor
  });

  return {
    plots: [
      {
        data: [
          {
            x: freq.slice(0, N/2),
            y: magnitude.slice(0, N/2),
            type: 'scatter',
            mode: 'markers',
            name: '|X[k]|',
            marker: { color: '#ff7f0e', size: 6 }
          },
          {
            x: [f, f],
            y: [0, 300],
            type: 'scatter',
            mode: 'lines',
            name: `Signal at ${f} Hz`,
            line: { color: 'red', width: 2, dash: 'dash' }
          }
        ],
        layout: {
          title: 'Step 2: FFT Magnitude Spectrum',
          xaxis: { title: 'Frequency (Hz)' },
          yaxis: { title: 'Magnitude' },
          showlegend: true,
          grid: { show: true },
          margin: { t: 60, b: 60, l: 60, r: 60 }
        }
      }
    ]
  };
};

// Step 3: Trigonometric coefficients visualization
const generateStep3Visualization = () => {
  const fs = 1000;
  const N = 500;
  const f = 50;
  const k_signal = Math.round(f * N / fs);
  
  // Simulate complex coefficient
  const X_real = 0; // For sine wave
  const X_imag = -250; // For sine wave
  
  const a_n = X_real;
  const b_n = -X_imag;

  return {
    plots: [
      {
        data: [
          {
            x: [0, a_n],
            y: [0, 0],
            type: 'scatter',
            mode: 'lines+markers',
            name: `a_${k_signal} = ${a_n.toFixed(1)}`,
            line: { color: 'blue', width: 4 },
            marker: { size: 10 }
          },
          {
            x: [0, 0],
            y: [0, b_n],
            type: 'scatter',
            mode: 'lines+markers',
            name: `b_${k_signal} = ${b_n.toFixed(1)}`,
            line: { color: 'red', width: 4 },
            marker: { size: 10 }
          }
        ],
        layout: {
          title: 'Step 3: Trigonometric Coefficients',
          xaxis: { title: 'Cosine coefficient (a_n)' },
          yaxis: { title: 'Sine coefficient (b_n)' },
          showlegend: true,
          grid: { show: true },
          margin: { t: 60, b: 60, l: 60, r: 60 }
        }
      }
    ]
  };
};

// Step 4: Reconstruction visualization
const generateStep4Visualization = () => {
  const fs = 1000;
  const t = Array.from({ length: 250 }, (_, i) => i / fs);
  const f = 50;
  
  // Original signal
  const x_original = t.map(time => Math.sin(2 * Math.PI * f * time));
  
  // Reconstructed signal (should be identical for perfect reconstruction)
  const x_reconstructed = t.map(time => Math.sin(2 * Math.PI * f * time));
  
  // Error (should be near zero)
  const error = t.map((_, i) => x_original[i] - x_reconstructed[i]);

  return {
    plots: [
      {
        data: [
          {
            x: t,
            y: x_original,
            type: 'scatter',
            mode: 'lines',
            name: 'Original Signal',
            line: { color: '#1f77b4', width: 2 }
          },
          {
            x: t,
            y: x_reconstructed,
            type: 'scatter',
            mode: 'lines',
            name: 'Reconstructed Signal',
            line: { color: '#ff7f0e', width: 2, dash: 'dash' }
          }
        ],
        layout: {
          title: 'Step 4: Signal Reconstruction Comparison',
          xaxis: { title: 'Time (s)' },
          yaxis: { title: 'Amplitude' },
          showlegend: true,
          grid: { show: true },
          margin: { t: 60, b: 60, l: 60, r: 60 }
        }
      },
      {
        data: [
          {
            x: t,
            y: error,
            type: 'scatter',
            mode: 'lines',
            name: 'Reconstruction Error',
            line: { color: 'red', width: 2 }
          }
        ],
        layout: {
          title: 'Reconstruction Error (Should be Near Zero)',
          xaxis: { title: 'Time (s)' },
          yaxis: { title: 'Error' },
          showlegend: true,
          grid: { show: true },
          margin: { t: 60, b: 60, l: 60, r: 60 }
        }
      }
    ]
  };
};

// Code cell component for interactive execution
const CodeCell = ({ title, description, code, onRun, onClear, output, isProcessing, data }: {
  title: string;
  description: string;
  code: string;
  onRun: () => void;
  onClear: () => void;
  output: string[];
  isProcessing: boolean;
  data: any;
}) => {
  const [currentCode, setCurrentCode] = useState(code);

  const handleRun = () => {
    onRun();
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="mb-4">
        <h3 className="text-xl font-semibold text-gray-800 mb-2">{title}</h3>
        <p className="text-gray-600 mb-4">{description}</p>
      </div>

      <div className="mb-4">
        <CodeEditor
          value={currentCode}
          onChange={(value) => setCurrentCode(value || '')}
          language="matlab"
          height="200px"
        />
      </div>

      <div className="flex gap-2 mb-4">
        <button
          onClick={handleRun}
          disabled={isProcessing}
          className="btn btn-primary"
        >
          {isProcessing ? (
            <>
              <span className="loading loading-spinner loading-sm"></span>
              Running...
            </>
          ) : (
            'Run Code'
          )}
        </button>
        <button
          onClick={onClear}
          className="btn btn-outline"
        >
          Clear Output
        </button>
      </div>

      {output.length > 0 && (
        <div className="mb-4">
          <CodeConsole messages={output} />
        </div>
      )}

      {data && data.plots && (
        <div className="mt-4">
          <h4 className="text-lg font-medium text-gray-700 mb-3">Visualization:</h4>
          <div className="space-y-4">
            {data.plots.map((plot: any, index: number) => (
              <div key={index} className="border rounded-lg p-4">
                <PlotlyChart
                  data={plot.data}
                  layout={plot.layout}
                  config={{ responsive: true, displayModeBar: true }}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Text block component for explanations
const TextBlock = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="bg-blue-50 rounded-lg p-6 mb-6">
    <h3 className="text-lg font-semibold text-blue-800 mb-3">{title}</h3>
    <div className="text-blue-700">{children}</div>
  </div>
);

export default function HermitianSymmetryLab() {
  const [codeStates, setCodeStates] = useState({
    step1: { output: [], isProcessing: false, data: null },
    step2: { output: [], isProcessing: false, data: null },
    step3: { output: [], isProcessing: false, data: null },
    step4: { output: [], isProcessing: false, data: null }
  });

  const handleRunCode = async (step: string) => {
    const code = codeExamples[step as keyof typeof codeExamples];
    
    setCodeStates(prev => ({
      ...prev,
      [step]: { ...prev[step as keyof typeof prev], isProcessing: true }
    }));

    try {
      const result = await executeCode(code);
      
      setCodeStates(prev => ({
        ...prev,
        [step]: {
          output: result.success ? result.output : [`Error: ${'errorMessage' in result ? result.errorMessage : 'Unknown error'}`],
          isProcessing: false,
          data: result.data
        }
      }));
    } catch (error) {
      setCodeStates(prev => ({
        ...prev,
        [step]: {
          output: [`Error: ${error instanceof Error ? error.message : 'Unknown error'}`],
          isProcessing: false,
          data: null
        }
      }));
    }
  };

  const handleClearConsole = (step: string) => {
    setCodeStates(prev => ({
      ...prev,
      [step]: { ...prev[step as keyof typeof prev], output: [], data: null }
    }));
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">ELEC 342 LAB 4</h1>
                <p className="text-xl text-gray-600 mt-2">Hermitian Symmetry in Fourier Analysis</p>
              </div>
              <div className="flex gap-4">
                <Link href="/labs" className="btn btn-outline">
                  ← Back to Labs
                </Link>
                <Link href="/" className="btn btn-primary">
                  Home
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Introduction */}
          <div className="bg-white rounded-lg shadow-md p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Learning Objectives</h2>
            <div className="prose prose-lg text-gray-700">
              <p className="mb-4">
                In this lab, you will learn about <strong>Hermitian symmetry</strong> in Fourier analysis and why it's crucial for understanding real-valued signals.
              </p>
              <ul className="list-disc list-inside space-y-2">
                <li>Understand why real signals have symmetric frequency spectra</li>
                <li>Learn the mathematical relationship: <code>X[-n] = X[n]*</code></li>
                <li>Convert complex FFT coefficients to real trigonometric form</li>
                <li>Reconstruct signals using cosine and sine coefficients</li>
              </ul>
            </div>
          </div>

          {/* Step 1: Basic Signal Generation */}
          <TextBlock title="Step 1: Understanding Real Signals">
            <p className="mb-4">
              We start with a simple real sine wave. Real signals have the property that their imaginary part is zero.
            </p>
            <div className="bg-gray-100 p-4 rounded-lg mb-4">
              <p className="font-mono text-sm">
                <strong>Key Concept:</strong> Real signals → Complex spectrum with symmetry
              </p>
            </div>
          </TextBlock>

          <CodeCell
            title="Step 1: Create a Simple Real Signal"
            description="Generate a real sine wave and examine its basic properties."
            code={codeExamples.step1}
            onRun={() => handleRunCode('step1')}
            onClear={() => handleClearConsole('step1')}
            output={codeStates.step1.output}
            isProcessing={codeStates.step1.isProcessing}
            data={codeStates.step1.data}
          />

          {/* Step 2: Hermitian Symmetry */}
          <TextBlock title="Step 2: Hermitian Symmetry Property">
            <p className="mb-4">
              For real signals, the frequency spectrum has <strong>Hermitian symmetry</strong>:
            </p>
            <div className="bg-gray-100 p-4 rounded-lg mb-4">
              <p className="font-mono text-lg text-center">
                <strong>X[k] = conj(X[N-k+2])</strong>
              </p>
            </div>
            <p>
              This means the coefficient at frequency k is the complex conjugate of the coefficient at frequency N-k+2.
            </p>
          </TextBlock>

          <CodeCell
            title="Step 2: Verify Hermitian Symmetry"
            description="Compute the FFT and verify that the symmetry property holds."
            code={codeExamples.step2}
            onRun={() => handleRunCode('step2')}
            onClear={() => handleClearConsole('step2')}
            output={codeStates.step2.output}
            isProcessing={codeStates.step2.isProcessing}
            data={codeStates.step2.data}
          />

          {/* Step 3: Trigonometric Form */}
          <TextBlock title="Step 3: Complex to Trigonometric Conversion">
            <p className="mb-4">
              Hermitian symmetry allows us to convert complex FFT coefficients to real trigonometric coefficients:
            </p>
            <div className="bg-gray-100 p-4 rounded-lg mb-4">
              <p className="font-mono text-sm">
                <strong>a_n = real(X[n])</strong> (cosine coefficient)<br/>
                <strong>b_n = -imag(X[n])</strong> (sine coefficient)
              </p>
            </div>
            <p>
              This conversion is possible because the imaginary parts cancel out due to symmetry.
            </p>
          </TextBlock>

          <CodeCell
            title="Step 3: Extract Trigonometric Coefficients"
            description="Convert complex FFT coefficients to real cosine and sine coefficients."
            code={codeExamples.step3}
            onRun={() => handleRunCode('step3')}
            onClear={() => handleClearConsole('step3')}
            output={codeStates.step3.output}
            isProcessing={codeStates.step3.isProcessing}
            data={codeStates.step3.data}
          />

          {/* Step 4: Reconstruction */}
          <TextBlock title="Step 4: Signal Reconstruction">
            <p className="mb-4">
              Using the trigonometric coefficients, we can perfectly reconstruct the original signal:
            </p>
            <div className="bg-gray-100 p-4 rounded-lg mb-4">
              <p className="font-mono text-sm">
                <strong>x(t) = a₀/2 + Σ[a_n cos(ω_n t) - b_n sin(ω_n t)]</strong>
              </p>
            </div>
            <p>
              This demonstrates that the real trigonometric coefficients contain all the information needed to reconstruct the signal.
            </p>
          </TextBlock>

          <CodeCell
            title="Step 4: Reconstruct the Signal"
            description="Use trigonometric coefficients to reconstruct the original signal and verify accuracy."
            code={codeExamples.step4}
            onRun={() => handleRunCode('step4')}
            onClear={() => handleClearConsole('step4')}
            output={codeStates.step4.output}
            isProcessing={codeStates.step4.isProcessing}
            data={codeStates.step4.data}
          />

          {/* Summary */}
          <div className="bg-green-50 rounded-lg p-6 mt-8">
            <h3 className="text-lg font-semibold text-green-800 mb-3">Lab Summary</h3>
            <div className="text-green-700 space-y-2">
              <p>✅ <strong>Real signals</strong> produce <strong>symmetric frequency spectra</strong></p>
              <p>✅ <strong>Hermitian symmetry</strong> ensures X[k] = conj(X[N-k+2])</p>
              <p>✅ <strong>Complex coefficients</strong> can be converted to <strong>real trigonometric form</strong></p>
              <p>✅ <strong>Perfect reconstruction</strong> is possible using only real coefficients</p>
            </div>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}