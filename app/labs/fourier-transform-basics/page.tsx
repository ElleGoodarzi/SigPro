'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Tab } from '@headlessui/react';
import CodeEditor from '../../components/CodeEditor';
import PlotlyChart from '../../components/PlotlyChart';
import CodeConsole from '../../components/CodeConsole';
import { executeCode as clientExecutor } from '../../utils/codeExecutor';
import ErrorBoundary from '../../components/ErrorBoundary';

// Initial code sample for the lab
const initialCode = `% Generate a simple sine wave
fs = 1000;           % Sampling frequency (Hz)
t = 0:1/fs:1-1/fs;   % Time vector (1 second)
f = 5;               % Frequency of sine wave (Hz)
x = sin(2*pi*f*t);   % Generate sine wave

% Plot the signal
plot(t, x);
title('5 Hz Sine Wave');
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
title('Frequency Spectrum');
xlabel('Frequency (Hz)');
ylabel('Amplitude');

% Notice the peak at 5 Hz
`;

// Sample time domain data for visualization (5 Hz sine wave)
const generateTimeDomainData = () => {
  const fs = 1000;
  const t = Array.from({ length: 1000 }, (_, i) => i / fs);
  const f = 5;
  const y = t.map(time => Math.sin(2 * Math.PI * f * time));
  
  return {
    x: t,
    y: y,
    type: 'scatter',
    mode: 'lines',
    name: '5 Hz Sine Wave',
    line: { color: '#6366f1' },
  };
};

// Sample frequency domain data
const generateFrequencyDomainData = () => {
  const fs = 1000;
  const N = 1000;
  const f = Array.from({ length: N/2 + 1 }, (_, i) => i * (fs / N));
  
  // Create a peak at 5 Hz
  const y = f.map(freq => {
    if (Math.abs(freq - 5) < 0.5) return 0.5 * Math.exp(-10 * Math.pow(freq - 5, 2));
    return 0.01 * Math.random();
  });
  
  return {
    x: f,
    y: y,
    type: 'scatter',
    mode: 'lines',
    name: 'Frequency Spectrum',
    line: { color: '#10b981' },
  };
};

const LabSteps = [
  {
    title: 'Introduction to Fourier Transform',
    content: (
      <div className="space-y-3">
        <p className="font-mono text-base animate-fade-in">Welcome to <span className="text-primary-500">LAB 01</span> in our Signal Processing series.</p>
        
        <div className="bg-base-300 bg-opacity-30 p-3 border-l-2 border-primary-500 mt-4">
          <p className="font-bold mb-1 text-base font-mono">What is the Fourier Transform?</p>
          <p className="font-mono text-base">The Fourier Transform converts a signal from the <span className="text-primary-500 font-semibold">time domain</span> to the <span className="text-primary-500 font-semibold">frequency domain</span>.</p>
          <p className="font-mono text-base">It reveals the frequency components hidden within any signal.</p>
        </div>
        
        <div className="flex items-center mt-4 bg-base-200 p-3 rounded-md">
          <div className="mr-3 text-3xl text-primary-500">→</div>
          <div>
            <p className="font-semibold">In this lab, you will:</p>
            <ul className="list-disc list-inside space-y-1 text-base">
              <li className="font-mono">Generate simple sine waves</li>
              <li className="font-mono">Visualize signals in both time and frequency domains</li>
              <li className="font-mono">Combine multiple frequency components</li>
              <li className="font-mono">Understand how the Fourier Transform works</li>
            </ul>
          </div>
        </div>
        
        <div className="text-base mt-4 font-mono flex items-center bg-base-300 bg-opacity-40 p-2 rounded">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Look at both the <span className="text-primary-500 mx-1">code editor</span> and the <span className="text-primary-500 mx-1">visualizations</span> as you progress through this lab.
        </div>
      </div>
    )
  },
  {
    title: 'Generating a Sine Wave',
    content: (
      <div className="space-y-3">
        <p className="font-mono text-base">Let's start by generating a simple sine wave with a single frequency component.</p>
        
        <div className="grid grid-cols-2 gap-4 my-4">
          <div className="bg-base-300 bg-opacity-30 p-3 rounded-md">
            <p className="font-bold mb-2 text-base space-mono">TIME DOMAIN</p>
            <p className="font-mono text-base">A 5 Hz sine wave completes 5 cycles every second.</p>
            <p className="mt-2 text-base font-mono text-primary-500">x = sin(2*pi*f*t)</p>
          </div>
          <div className="bg-base-300 bg-opacity-30 p-3 rounded-md">
            <p className="font-bold mb-2 text-base space-mono">FREQUENCY DOMAIN</p>
            <p className="font-mono text-base">The frequency spectrum shows a single peak at 5 Hz.</p>
            <p className="mt-2 text-base font-mono text-primary-500">X = fft(x)</p>
          </div>
        </div>
        
        <div className="bg-base-200 p-3 border-l-2 border-primary-500 mt-4">
          <p className="font-bold space-mono text-base">ACTION REQUIRED:</p>
          <ol className="list-decimal list-inside text-base space-y-1">
            <li className="font-mono">Review the code in the editor</li>
            <li className="font-mono">Click the <span className="text-primary-500 font-semibold">Run Code</span> button</li>
            <li className="font-mono">Observe both time and frequency domain visualizations</li>
            <li className="font-mono">Notice the spike at exactly 5 Hz in the frequency domain</li>
          </ol>
        </div>
        
        <p className="text-base mt-3 font-mono bg-base-300 inline-block px-2 py-1 rounded">
          <span className="text-primary-500">TIP:</span> The code uses the Fast Fourier Transform (FFT) function to convert the signal.
        </p>
      </div>
    )
  },
  {
    title: 'Changing the Frequency',
    content: (
      <div className="space-y-3">
        <p className="font-mono text-base">Let's explore what happens when we change the frequency of our sine wave.</p>
        
        <div className="bg-base-200 p-3 rounded-md my-4">
          <p className="font-bold mb-2 space-mono text-base">EXPERIMENT:</p>
          <div className="flex items-start">
            <div className="bg-primary-500 text-white w-6 h-6 rounded-full flex items-center justify-center mr-3 mt-1">1</div>
            <div>
              <p className="font-semibold">Modify this line in the code editor:</p>
              <pre className="bg-base-300 p-2 rounded mt-1 text-base overflow-x-auto">
                <code>f = 5; <span className="text-green-500">% Change this value</span></code>
              </pre>
              <p className="font-mono text-base mt-2">Try values like 10, 15, or 20 Hz</p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center p-3 bg-base-300 bg-opacity-40 rounded-md">
          <div className="mr-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="font-semibold">What to observe:</p>
            <ul className="list-disc list-inside text-base">
              <li className="font-mono">Higher frequency means more cycles per second in the time domain</li>
              <li className="font-mono">The peak in the frequency domain moves to match your new frequency</li>
            </ul>
          </div>
        </div>
        
        <div className="text-base mt-3 font-mono">
          The relationship is precise: a sine wave with frequency f Hz creates a peak at exactly f Hz in the frequency domain.
        </div>
      </div>
    )
  },
  {
    title: 'Multiple Frequency Components',
    content: (
      <div className="space-y-3">
        <p className="font-mono text-base">Real-world signals are composed of <span className="text-primary-500">multiple frequency components</span>.</p>
        
        <div className="bg-base-200 p-4 rounded-md my-4">
          <p className="font-bold mb-3 space-mono text-base">CREATING A COMPLEX SIGNAL:</p>
          <div className="space-y-4">
            <div className="flex items-start">
              <div className="bg-primary-500 text-white w-6 h-6 rounded-full flex items-center justify-center mr-3 mt-1">1</div>
              <div>
                <p className="font-semibold">Replace this line:</p>
                <pre className="bg-base-300 p-2 rounded mt-1 text-base overflow-x-auto">
                  <code>x = sin(2*pi*f*t);</code>
                </pre>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="bg-primary-500 text-white w-6 h-6 rounded-full flex items-center justify-center mr-3 mt-1">2</div>
              <div>
                <p className="font-semibold">With this line:</p>
                <pre className="bg-base-300 p-2 rounded mt-1 text-base overflow-x-auto">
                  <code>x = sin(2*pi*5*t) + 0.5*sin(2*pi*20*t);</code>
                </pre>
                <p className="font-mono text-base mt-1">This creates a signal with:</p>
                <ul className="list-disc list-inside text-base">
                  <li className="font-mono">A primary 5 Hz component with amplitude 1</li>
                  <li className="font-mono">A secondary 20 Hz component with amplitude 0.5</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-base-200 p-3 border-l-2 border-primary-500">
          <p className="font-bold space-mono text-base">THE POWER OF FOURIER TRANSFORM:</p>
          <p className="font-mono text-base">The Fourier Transform can identify <span className="text-primary-500">all</span> frequency components in a complex signal, showing both their frequencies and relative amplitudes.</p>
          <p className="font-mono text-base">This is why the Fourier Transform is so essential for signal analysis!</p>
        </div>
        
        <div className="text-base mt-3 font-mono">
          After running the code, you'll see both 5 Hz and 20 Hz peaks in the frequency domain, with the 20 Hz peak being half the height.
        </div>
      </div>
    )
  },
  {
    title: 'Exploring Further',
    content: (
      <div className="space-y-3">
        <div className="bg-base-300 bg-opacity-50 p-3 rounded-md">
          <p className="font-bold space-mono text-base">CONGRATULATIONS!</p>
          <p className="font-mono text-base">You've completed the basics of the Fourier Transform.</p>
        </div>
        
        <div className="mt-4">
          <p className="font-semibold mb-2 text-base">Here are some experiments you can try:</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4">
            <div className="bg-base-200 p-3 rounded-md">
              <div className="text-primary-500 space-mono mb-2">EXPERIMENT 1</div>
              <p className="font-mono text-base font-semibold">Add more frequency components</p>
              <pre className="bg-base-300 p-2 rounded mt-2 text-base overflow-x-auto">
                <code>x = sin(2*pi*5*t) + 0.5*sin(2*pi*20*t) + <br />0.2*sin(2*pi*35*t);</code>
              </pre>
              <p className="font-mono text-base mt-2">Adds a third component at 35 Hz</p>
            </div>
            
            <div className="bg-base-200 p-3 rounded-md">
              <div className="text-primary-500 space-mono mb-2">EXPERIMENT 2</div>
              <p className="font-mono text-base font-semibold">Add random noise</p>
              <pre className="bg-base-300 p-2 rounded mt-2 text-base overflow-x-auto">
                <code>x = sin(2*pi*5*t) + 0.1*randn(size(t));</code>
              </pre>
              <p className="font-mono text-base mt-2">Adds random noise to simulate real-world signals</p>
            </div>
          </div>
          
          <div className="bg-base-200 p-3 rounded-md mt-4">
            <div className="text-primary-500 space-mono mb-2">EXPERIMENT 3</div>
            <p className="font-mono text-base font-semibold">Create a square wave approximation</p>
            <pre className="bg-base-300 p-2 rounded mt-2 text-base overflow-x-auto">
              <code>x = sin(2*pi*5*t) + (1/3)*sin(2*pi*15*t) + <br />(1/5)*sin(2*pi*25*t) + (1/7)*sin(2*pi*35*t);</code>
            </pre>
            <p className="font-mono text-base mt-2">This creates an approximation of a square wave using the first few terms of its Fourier series</p>
          </div>
        </div>
        
        <div className="bg-base-200 p-3 border-l-2 border-primary-500 mt-4">
          <p className="font-bold space-mono text-base">REAL-WORLD APPLICATIONS:</p>
          <ul className="list-disc list-inside text-base space-y-1">
            <li className="font-mono">Audio processing and music analysis</li>
            <li className="font-mono">Image compression (JPEG uses a 2D variant)</li>
            <li className="font-mono">Telecommunications and data transmission</li>
            <li className="font-mono">Medical imaging (MRI uses the Fourier Transform)</li>
            <li className="font-mono">Vibration analysis in engineering</li>
          </ul>
        </div>
        
        <div className="mt-4 font-mono text-base flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="font-mono">Continue to the next lab to explore more advanced signal processing concepts!</span>
        </div>
      </div>
    )
  },
];

// Function to execute MATLAB-like code via API
const executeCode = async (code: string, useOctave: boolean = true) => {
  try {
    const response = await fetch('/api/execute', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code, useOctave }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to execute code');
    }

    return await response.json();
  } catch (error) {
    console.error('Error executing code:', error);
    // Fallback to client-side execution if API fails
    return clientExecutor(code);
  }
};

export default function FourierTransformBasicsLab() {
  const [code, setCode] = useState(initialCode);
  const [output, setOutput] = useState<any>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [consoleMessages, setConsoleMessages] = useState<string[]>([]);
  const [useOctave, setUseOctave] = useState(true);

  // Run the code once at the start to show initial visualization
  useEffect(() => {
    handleRunCode();
  }, []);

  const handleRunCode = async () => {
    setIsProcessing(true);
    // Clear previous messages and add just the execution message
    setConsoleMessages(['>> Executing code...']);
    
    try {
      // Execute the code via API
      const result = await executeCode(code, useOctave);
      
      // Update state with results
      if (result.data) {
        setOutput(result.data);
      }
      
      // Limit the number of console messages to prevent excessive scrolling
      const limitedMessages = result.output ? 
        (result.output.length > 50 ? 
          ['>> Output limited to 50 lines for readability...'].concat(result.output.slice(-49)) : 
          result.output) : 
        [];
      setConsoleMessages(limitedMessages);
      
      if (!result.success && result.errorMessage) {
        // Handle error case
        setConsoleMessages(prev => {
          // Remove duplicates
          if (prev.includes(`>> Error: ${result.errorMessage}`)) {
            return prev;
          }
          return [...prev, `>> Error: ${result.errorMessage}`];
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setConsoleMessages(['>> Error: ' + errorMessage]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClearConsole = () => {
    setConsoleMessages([]);
  };

  return (
    <ErrorBoundary>
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row justify-between items-start mb-6">
          <div>
            <div className="space-mono text-base font-bold tracking-wider text-primary-400">ELEC 342 LAB 01</div>
            <h1 className="text-3xl font-bold space-mono neon-text">Fourier Transform B4sics</h1>
            <p className="text-lg font-mono">Exploring the relationship between time and frequency domains</p>
          </div>
          <div className="flex mt-4 lg:mt-0 space-x-2">
            <Link href="/labs" className="btn btn-outline">
              Back to Labs
            </Link>
            <button className="btn btn-outline">
              Save Progress
            </button>
          </div>
        </div>
        
        {/* Lab Progress Tracker */}
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            <span className="text-base space-mono">LAB SEQUENCE</span>
            <span className="text-base font-mono bg-base-300 px-2 py-0.5 rounded-md">
              <span className="text-primary-500">{currentStep + 1}</span>/{LabSteps.length}
            </span>
          </div>
          <div className="w-full bg-neutral rounded-full h-2.5 neon-border">
            <div 
              className="bg-primary h-2.5 rounded-full hologram" 
              style={{ width: `${((currentStep + 1) / LabSteps.length) * 100}%` }}
            ></div>
          </div>
          
          {/* Step indicators */}
          <div className="flex justify-between mt-2">
            {LabSteps.map((step, index) => (
              <div 
                key={index}
                onClick={() => setCurrentStep(index)}
                className={`cursor-pointer transition-colors duration-300 ${
                  index <= currentStep ? 'text-primary-500' : 'text-base-content opacity-50'
                }`}
              >
                <div className="w-5 h-5 rounded-full flex items-center justify-center">
                  {index < currentStep ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <span className="text-base">{index + 1}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Lab Instructions and Steps */}
          <div className="space-y-6">
            <div className="card bg-base-200 border border-primary-500">
              <div className="card-body">
                <div className="flex items-center mb-2">
                  <div className="w-3 h-3 rounded-full bg-primary-500 mr-2 animate-pulse"></div>
                  <h2 className="text-xl font-bold space-mono">{LabSteps[currentStep].title}</h2>
                </div>
                <div className="border-l-2 border-primary-500 pl-4 py-1 mb-4 space-mono text-base opacity-70">
                  STEP {currentStep + 1} OF {LabSteps.length}
                </div>
                
                <div className="lab-content text-base">
                  {LabSteps[currentStep].content}
                </div>
                
                {/* Key concept box (only for some steps) */}
                {[0, 1, 3].includes(currentStep) && (
                  <div className="bg-base-300 bg-opacity-50 border-l-4 border-primary-500 p-3 my-4 text-base">
                    <div className="font-bold mb-1 text-primary-400">KEY CONCEPT</div>
                    {currentStep === 0 && (
                      <p>The Fourier Transform converts time-domain signals into frequency-domain representation, showing which frequencies are present in the signal.</p>
                    )}
                    {currentStep === 1 && (
                      <p>A pure sine wave of frequency f Hz will appear as a single spike at f Hz in the frequency domain.</p>
                    )}
                    {currentStep === 3 && (
                      <p>Real-world signals are composed of multiple frequency components. The Fourier Transform can identify each component's magnitude and frequency.</p>
                    )}
                  </div>
                )}
                
                <div className="card-actions justify-between mt-4">
                  <button 
                    className="btn btn-nerd" 
                    onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                    disabled={currentStep === 0}
                  >
                    <span className="font-mono">← Previous</span>
                  </button>
                  <button 
                    className="btn btn-nerd" 
                    onClick={() => setCurrentStep(Math.min(LabSteps.length - 1, currentStep + 1))}
                    disabled={currentStep === LabSteps.length - 1}
                  >
                    <span className="font-mono">Next →</span>
                  </button>
                </div>
                
                {/* Navigation dots */}
                <div className="flex justify-center gap-2 mt-4">
                  {LabSteps.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentStep(i)}
                      className={`w-2 h-2 rounded-full ${
                        i === currentStep ? 'bg-primary-500' : 'bg-base-300'
                      }`}
                      aria-label={`Go to step ${i + 1}`}
                    />
                  ))}
                </div>
              </div>
            </div>
            
            {/* Visualization Section */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold space-mono neon-text">Signal Visualization</h2>
                <div className="text-base space-mono bg-base-300 px-2 py-1 rounded-md">
                  REAL-TIME ANALYSIS
                </div>
              </div>
              
              <Tab.Group>
                <Tab.List className="tabs tabs-boxed">
                  <Tab className={({ selected }) => 
                    selected ? 'tab tab-active space-mono text-base' : 'tab space-mono text-base'
                  }>
                    <div className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M2 10h16m-8-8v16" stroke="currentColor" strokeWidth="2" fill="none"/>
                      </svg>
                      Time Domain
                    </div>
                  </Tab>
                  <Tab className={({ selected }) => 
                    selected ? 'tab tab-active space-mono text-base' : 'tab space-mono text-base'
                  }>
                    <div className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M2 10h16M2 14h16M2 6h16" stroke="currentColor" strokeWidth="1" fill="none"/>
                      </svg>
                      Frequency Domain
                    </div>
                  </Tab>
                </Tab.List>
                
                <Tab.Panels className="mt-4">
                  <Tab.Panel>
                    <div className="visualizer-container bg-base-200 border border-primary-500">
                      {output ? (
                        <PlotlyChart
                          data={[output.time]}
                          layout={{
                            title: 'Time Domain Signal',
                            xaxis: { title: 'Time (s)' },
                            yaxis: { title: 'Amplitude' },
                            font: { family: "'Space Mono', monospace", size: 16 },
                            paper_bgcolor: 'rgba(0,0,0,0.1)',
                            plot_bgcolor: 'rgba(0,0,0,0.1)',
                            margin: { t: 40, r: 30, l: 60, b: 40 }
                          }}
                          style={{ width: '100%', height: '300px' }}
                        />
                      ) : (
                        <div className="h-[300px] flex items-center justify-center bg-neutral-900 rounded-lg">
                          <div className="text-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mx-auto mb-2 text-primary-500 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3-2a1 1 0 000-1.664z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="font-mono text-base">Run your code to visualize signal</p>
                          </div>
                        </div>
                      )}
                      
                      {/* Overlay explanatory text for visualization */}
                      {currentStep === 1 && output && (
                        <div className="absolute top-12 right-8 bg-base-300 bg-opacity-80 p-2 rounded-md text-base font-mono max-w-[200px] pointer-events-none">
                          This is a 5 Hz sine wave in the time domain. It completes 5 full cycles per second.
                        </div>
                      )}
                    </div>
                  </Tab.Panel>
                  
                  <Tab.Panel>
                    <div className="visualizer-container bg-base-200 border border-primary-500">
                      {output ? (
                        <PlotlyChart
                          data={[output.frequency]}
                          layout={{
                            title: 'Frequency Domain',
                            xaxis: { title: 'Frequency (Hz)', range: [0, 50] },
                            yaxis: { title: 'Magnitude' },
                            font: { family: "'Space Mono', monospace", size: 16 },
                            paper_bgcolor: 'rgba(0,0,0,0.1)',
                            plot_bgcolor: 'rgba(0,0,0,0.1)',
                            margin: { t: 40, r: 30, l: 60, b: 40 },
                            annotations: currentStep === 1 && output ? [
                              {
                                x: 5,
                                y: output.frequency.y[Math.round(5 * output.frequency.x.length / 50)],
                                text: '5 Hz',
                                showarrow: true,
                                arrowhead: 5,
                                ax: 0,
                                ay: -40,
                                font: {
                                  family: "'Space Mono', monospace",
                                  size: 14,
                                  color: '#10b981'
                                }
                              }
                            ] : []
                          }}
                          style={{ width: '100%', height: '300px' }}
                        />
                      ) : (
                        <div className="h-[300px] flex items-center justify-center bg-neutral-900 rounded-lg">
                          <div className="text-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mx-auto mb-2 text-primary-500 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                            <p className="font-mono text-base">Run your code to see frequency components</p>
                          </div>
                        </div>
                      )}
                      
                      {/* Overlay explanatory text for visualization */}
                      {currentStep === 1 && output && (
                        <div className="absolute top-12 left-8 bg-base-300 bg-opacity-80 p-2 rounded-md text-base font-mono max-w-[200px] pointer-events-none">
                          The spike at 5 Hz shows the frequency component of your sine wave.
                        </div>
                      )}
                    </div>
                  </Tab.Panel>
                </Tab.Panels>
              </Tab.Group>
            </div>
          </div>
          
          {/* Code Editor Section */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold space-mono neon-text">C0DE EDITOR</h2>
                <p className="text-base opacity-70">MATLAB-compatible syntax</p>
              </div>
              <div className="flex gap-2">
                <div className="form-control">
                  <label className="label cursor-pointer gap-2">
                    <span className="label-text font-mono text-base">OCTAVE MODE</span>
                    <input 
                      type="checkbox" 
                      className="toggle toggle-primary toggle-sm" 
                      checked={useOctave}
                      onChange={() => setUseOctave(!useOctave)}
                    />
                  </label>
                </div>
                <button
                  onClick={handleClearConsole}
                  className="btn btn-nerd btn-sm"
                >
                  <span className="font-mono">Clear Console</span>
                </button>
                <button
                  onClick={handleRunCode}
                  disabled={isProcessing}
                  className="btn btn-nerd"
                >
                  {isProcessing ? (
                    <>
                      <span className="loading loading-spinner loading-sm mr-2"></span>
                      <span className="font-mono">Processing...</span>
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                      </svg>
                      <span className="font-mono">Run Code</span>
                    </>
                  )}
                </button>
              </div>
            </div>
            
            <div className="code-editor-container bg-base-200 border border-primary-500">
              <div className="terminal-header flex items-center bg-base-300 p-1 px-2">
                <div className="w-3 h-3 rounded-full bg-red-500 mr-1"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500 mr-1"></div>
                <div className="w-3 h-3 rounded-full bg-green-500 mr-3"></div>
                <div className="font-mono text-base opacity-70">signal_processor.m</div>
                
                {/* Hint system for specific lab steps */}
                {currentStep === 2 && (
                  <div className="ml-auto bg-base-200 px-2 py-0.5 rounded text-base font-mono text-primary-400 cursor-pointer hover:bg-base-100" onClick={() => setCode(code.replace(/f = 5;/, 'f = 10; % Try changing this to see the effect'))}>
                    <span className="animate-pulse">?</span> Hint
                  </div>
                )}
                {currentStep === 3 && (
                  <div className="ml-auto bg-base-200 px-2 py-0.5 rounded text-base font-mono text-primary-400 cursor-pointer hover:bg-base-100" onClick={() => setCode(code.replace(/x = sin\(2\*pi\*f\*t\);/, 'x = sin(2*pi*5*t) + 0.5*sin(2*pi*20*t); % Combined signal'))}>
                    <span className="animate-pulse">?</span> Hint
                  </div>
                )}
              </div>
              <CodeEditor
                height="calc(100% - 24px)"
                language="matlab"
                value={code}
                onChange={(value) => setCode(value || '')}
                theme="vs-dark"
                fontSize={16}
              />
            </div>
            
            {/* Code Console */}
            <CodeConsole 
              messages={consoleMessages}
              isProcessing={isProcessing}
              maxHeight="150px"
              className="panel-sci-fi border-2 border-primary-500 shadow-lg text-base font-mono"
              fontSize="16px"
            />
          </div>
        </div>
        
        {/* Related Resources */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold space-mono neon-text mb-4">Related Resources</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="card bg-base-200 border border-primary-500">
              <div className="card-body">
                <h3 className="card-title space-mono">Fourier Series</h3>
                <p className="font-mono text-base">Learn about representing periodic signals as sums of sinusoids</p>
                <div className="card-actions justify-end">
                  <button className="btn btn-nerd btn-sm">
                    <span className="font-mono">View Tutorial</span>
                  </button>
                </div>
              </div>
            </div>
            <div className="card bg-base-200 border border-primary-500">
              <div className="card-body">
                <h3 className="card-title space-mono">Sampling & Aliasing</h3>
                <p className="font-mono text-base">Understand how signal sampling affects frequency analysis</p>
                <div className="card-actions justify-end">
                  <Link href="/labs/sampling-and-aliasing" className="btn btn-nerd btn-sm">
                    <span className="font-mono">Go to Lab</span>
                  </Link>
                </div>
              </div>
            </div>
            <div className="card bg-base-200 border border-primary-500">
              <div className="card-body">
                <h3 className="card-title space-mono">Signal Filtering</h3>
                <p className="font-mono text-base">Apply frequency-domain filtering to signals</p>
                <div className="card-actions justify-end">
                  <Link href="/labs/digital-filters-design" className="btn btn-nerd btn-sm">
                    <span className="font-mono">Go to Lab</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
} 