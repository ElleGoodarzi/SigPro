'use client';

import { useState, useEffect, useCallback } from 'react';
import { Tab } from '@headlessui/react';
import CodeEditor from '../components/CodeEditor';
import PlotlyChart from '../components/PlotlyChart';
import CodeConsole from '../components/CodeConsole';
import ErrorBoundary from '../components/ErrorBoundary';
import { useAppState } from '../context/AppStateContext';
import { PlotData } from '../types/api';
import CodeExamples from '../components/CodeExamples';

// Initial code sample for the editor
const initialCode = `% Generate a simple signal
fs = 1000;           % Sampling frequency (Hz)
t = 0:1/fs:1-1/fs;   % Time vector (1 second)
f1 = 50;             % Frequency of first sine wave (Hz)
f2 = 120;            % Frequency of second sine wave (Hz)
x = sin(2*pi*f1*t) + 0.5*sin(2*pi*f2*t);

% Add some noise
x = x + 0.1*randn(size(t));

% Plot the signal
plot(t, x);
title('Time Domain Signal');
xlabel('Time (s)');
ylabel('Amplitude');

% Compute the FFT
X = fft(x);
N = length(X);
f = (0:N-1)*(fs/N); % Frequency vector
X_mag = abs(X)/N;   % Normalized magnitude

% Plot single-sided amplitude spectrum
X_mag_single = X_mag(1:N/2+1);
X_mag_single(2:end-1) = 2*X_mag_single(2:end-1);
f_single = f(1:N/2+1);

figure;
plot(f_single, X_mag_single);
title('Frequency Domain');
xlabel('Frequency (Hz)');
ylabel('Amplitude');
`;

export default function SimulatorPage() {
  // Get app state from context
  const { 
    currentCode, 
    setCurrentCode, 
    executeCode, 
    clearConsole, 
    isProcessing, 
    consoleMessages, 
    lastResult, 
    useOctave, 
    toggleOctaveMode, 
    saveCode,
    loadCode,
    savedCodes
  } = useAppState();
  
  const [output, setOutput] = useState<any>(null);
  const [currentVisualTab, setCurrentVisualTab] = useState(0);
  const [showExamples, setShowExamples] = useState(false);
  const [showSaveLoad, setShowSaveLoad] = useState(false);
  const [codeName, setCodeName] = useState('');
  
  // Set initial code
  useEffect(() => {
    if (!currentCode) {
      setCurrentCode(initialCode);
    }
  }, [currentCode, setCurrentCode]);

  // Run the code on initial load to show sample output
  useEffect(() => {
    const runInitialCode = async () => {
      if (currentCode) {
        await handleRunCode();
      }
    };
    
    runInitialCode();
  }, []);

  // Update output state when lastResult changes
  useEffect(() => {
    if (lastResult?.data) {
      setOutput(lastResult.data);
    }
  }, [lastResult]);
  
  // Keyboard shortcuts handler
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Ctrl/Cmd + Enter to run code
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      handleRunCode();
    }
    
    // Ctrl/Cmd + S to save code
    if ((event.ctrlKey || event.metaKey) && event.key === 's') {
      event.preventDefault(); // Prevent browser save dialog
      setShowSaveLoad(true);
    }
    
    // Ctrl/Cmd + O to open saved code
    if ((event.ctrlKey || event.metaKey) && event.key === 'o') {
      event.preventDefault();
      setShowSaveLoad(true);
    }
    
    // Escape to close modals
    if (event.key === 'Escape') {
      setShowExamples(false);
      setShowSaveLoad(false);
    }
  }, []);
  
  // Add keyboard event listener
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  const handleRunCode = async () => {
    if (currentCode && !isProcessing) {
      const result = await executeCode(currentCode);
      if (result.data) {
        setOutput(result.data);
      }
    }
  };
  
  const handleSaveCode = () => {
    if (codeName && currentCode) {
      saveCode(codeName, currentCode);
      setShowSaveLoad(false);
      setCodeName('');
    }
  };
  
  const handleLoadCode = (name: string) => {
    const code = loadCode(name);
    if (code) {
      setCurrentCode(code);
      setShowSaveLoad(false);
    }
  };
  
  const handleSelectExample = (exampleCode: string) => {
    setCurrentCode(exampleCode);
    setShowExamples(false);
  };

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      setCurrentCode(value);
    }
  };

  return (
    <ErrorBoundary>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Signal Processing Simulator</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Code Editor Section */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">MATLAB-like Editor</h2>
              <div className="flex flex-wrap gap-2">
                <div className="form-control">
                  <label className="label cursor-pointer gap-2">
                    <span className="label-text">Use Octave</span>
                    <input 
                      type="checkbox" 
                      className="toggle toggle-primary toggle-sm" 
                      checked={useOctave}
                      onChange={toggleOctaveMode}
                    />
                  </label>
                </div>
                <button
                  onClick={() => setShowExamples(true)}
                  className="btn btn-outline btn-sm"
                >
                  Examples
                </button>
                <button
                  onClick={() => setShowSaveLoad(true)}
                  className="btn btn-outline btn-sm"
                >
                  Save/Load
                </button>
                <button
                  onClick={clearConsole}
                  className="btn btn-outline btn-sm"
                >
                  Clear Console
                </button>
                <button
                  onClick={handleRunCode}
                  disabled={isProcessing}
                  className="btn btn-primary"
                >
                  {isProcessing ? (
                    <>
                      <span className="loading loading-spinner loading-sm"></span>
                      Processing...
                    </>
                  ) : (
                    'Run Code'
                  )}
                </button>
              </div>
            </div>
            
            <div className="relative h-96 border border-base-300 rounded-lg overflow-hidden">
              <CodeEditor
                height="100%"
                language="matlab"
                value={currentCode}
                onChange={handleEditorChange}
                theme="vs-dark"
              />
              <div className="absolute bottom-2 right-2 opacity-60 text-xs bg-base-300 p-1 rounded">
                Press Ctrl+Enter to run
              </div>
            </div>
            
            {/* Code Console */}
            <CodeConsole 
              messages={consoleMessages}
              isProcessing={isProcessing}
              maxHeight="150px"
              className="border-2 border-primary-500 shadow-lg text-base"
              fontSize="16px"
            />
          </div>
          
          {/* Visualization Section */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Visualization</h2>
            
            <Tab.Group selectedIndex={currentVisualTab} onChange={setCurrentVisualTab}>
              <Tab.List className="tabs tabs-boxed">
                <Tab className={({ selected }) => 
                  selected ? 'tab tab-active' : 'tab'
                }>
                  Time Domain
                </Tab>
                <Tab className={({ selected }) => 
                  selected ? 'tab tab-active' : 'tab'
                }>
                  Frequency Domain
                </Tab>
                <Tab className={({ selected }) => 
                  selected ? 'tab tab-active' : 'tab'
                }>
                  Spectrogram
                </Tab>
              </Tab.List>
              
              <Tab.Panels className="mt-4">
                <Tab.Panel>
                  {output?.time ? (
                    <PlotlyChart
                      data={[output.time]}
                      layout={{
                        title: 'Time Domain Signal',
                        xaxis: { title: 'Time (s)' },
                        yaxis: { title: 'Amplitude' },
                      }}
                      style={{ width: '100%', height: '400px' }}
                    />
                  ) : (
                    <div className="h-[400px] flex items-center justify-center bg-base-200 rounded-lg">
                      <div className="text-center">
                        <p className="opacity-60">Run your code to see visualization</p>
                      </div>
                    </div>
                  )}
                </Tab.Panel>
                
                <Tab.Panel>
                  {output?.frequency ? (
                    <PlotlyChart
                      data={[output.frequency]}
                      layout={{
                        title: 'Frequency Domain',
                        xaxis: { title: 'Frequency (Hz)' },
                        yaxis: { title: 'Magnitude' },
                      }}
                      style={{ width: '100%', height: '400px' }}
                    />
                  ) : (
                    <div className="h-[400px] flex items-center justify-center bg-base-200 rounded-lg">
                      <div className="text-center">
                        <p className="opacity-60">Run your code to see visualization</p>
                      </div>
                    </div>
                  )}
                </Tab.Panel>
                
                <Tab.Panel>
                  <div className="h-[400px] flex items-center justify-center bg-base-200 rounded-lg">
                    <div className="text-center">
                      <p className="opacity-60">
                        Spectrogram visualization will be available in the next update
                      </p>
                      <button className="btn btn-sm btn-outline mt-4">Request Feature</button>
                    </div>
                  </div>
                </Tab.Panel>
              </Tab.Panels>
            </Tab.Group>
            
            {/* Code Reference Panel */}
            <div className="mt-6">
              <h3 className="text-lg font-medium mb-2">MATLAB Function Reference</h3>
              <div className="bg-base-200 p-4 rounded-lg">
                <div className="flex flex-wrap gap-2">
                  <div className="badge badge-primary">sin</div>
                  <div className="badge badge-primary">cos</div>
                  <div className="badge badge-primary">fft</div>
                  <div className="badge badge-primary">ifft</div>
                  <div className="badge badge-primary">abs</div>
                  <div className="badge badge-primary">plot</div>
                  <div className="badge badge-primary">randn</div>
                  <div className="badge badge-primary">linspace</div>
                  <div className="badge badge-primary">title</div>
                  <div className="badge badge-primary">xlabel</div>
                  <div className="badge badge-primary">ylabel</div>
                </div>
                <p className="mt-2 text-sm opacity-70">
                  Click on any function to insert it into the editor with sample usage.
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Import/Export Section */}
        <div className="mt-8 p-4 bg-base-200 rounded-lg">
          <h2 className="text-lg font-semibold mb-3">Import/Export</h2>
          <div className="flex flex-wrap gap-3">
            <button 
              className="btn btn-sm btn-primary"
              onClick={() => {
                // Export current code
                const blob = new Blob([currentCode], { type: 'text/plain' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'sigprp-code.m';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
              }}
            >
              Export Code
            </button>
            
            <button
              className="btn btn-sm btn-outline"
              onClick={() => {
                // Create a file input for importing code
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = '.m,.txt';
                input.onchange = (e) => {
                  const file = (e.target as HTMLInputElement).files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                      const content = e.target?.result as string;
                      if (content) {
                        setCurrentCode(content);
                      }
                    };
                    reader.readAsText(file);
                  }
                };
                input.click();
              }}
            >
              Import Code
            </button>
            
            {output && (
              <button
                className="btn btn-sm btn-outline"
                onClick={() => {
                  // Export visualization as JSON
                  const dataStr = JSON.stringify(output, null, 2);
                  const blob = new Blob([dataStr], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'sigprp-visualization.json';
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                }}
              >
                Export Visualization Data
              </button>
            )}
          </div>
        </div>
        
        {/* Additional Resources */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-4">Resources & Documentation</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="card bg-base-200">
              <div className="card-body">
                <h3 className="card-title">MATLAB Reference</h3>
                <p>Access documentation for supported MATLAB functions and syntax</p>
                <div className="card-actions justify-end">
                  <button className="btn btn-sm btn-primary">View Docs</button>
                </div>
              </div>
            </div>
            <div className="card bg-base-200">
              <div className="card-body">
                <h3 className="card-title">Example Code</h3>
                <p>Browse sample code for common signal processing tasks</p>
                <div className="card-actions justify-end">
                  <button onClick={() => setShowExamples(true)} className="btn btn-sm btn-primary">Explore</button>
                </div>
              </div>
            </div>
            <div className="card bg-base-200">
              <div className="card-body">
                <h3 className="card-title">Related Labs</h3>
                <p>Check out guided labs to practice your skills</p>
                <div className="card-actions justify-end">
                  <button className="btn btn-sm btn-primary">See Labs</button>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Examples Modal */}
        {showExamples && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <div className="bg-base-100 rounded-lg shadow-lg max-w-3xl w-full max-h-[80vh] overflow-auto">
              <div className="p-4 border-b">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold">Code Examples</h2>
                  <button 
                    className="btn btn-sm btn-circle" 
                    onClick={() => setShowExamples(false)}
                  >
                    ✕
                  </button>
                </div>
              </div>
              <div className="p-4">
                <CodeExamples onSelect={handleSelectExample} />
              </div>
            </div>
          </div>
        )}
        
        {/* Save/Load Modal */}
        {showSaveLoad && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <div className="bg-base-100 rounded-lg shadow-lg max-w-lg w-full">
              <div className="p-4 border-b">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold">Save/Load Code</h2>
                  <button 
                    className="btn btn-sm btn-circle" 
                    onClick={() => setShowSaveLoad(false)}
                  >
                    ✕
                  </button>
                </div>
              </div>
              <div className="p-4">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium mb-2">Save Current Code</h3>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        className="input input-bordered flex-grow" 
                        placeholder="Name your code..."
                        value={codeName}
                        onChange={(e) => setCodeName(e.target.value)}
                      />
                      <button 
                        className="btn btn-primary"
                        disabled={!codeName}
                        onClick={handleSaveCode}
                      >
                        Save
                      </button>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-medium mb-2">Load Saved Code</h3>
                    {Object.keys(savedCodes).length > 0 ? (
                      <div className="space-y-2">
                        {Object.keys(savedCodes).map((name) => (
                          <div key={name} className="flex justify-between items-center p-2 bg-base-200 rounded hover:bg-base-300">
                            <span>{name}</span>
                            <button 
                              className="btn btn-sm btn-primary"
                              onClick={() => handleLoadCode(name)}
                            >
                              Load
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm opacity-70">No saved code yet</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
} 