'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import CodeEditor from '../../components/CodeEditor';
import PlotlyChart from '../../components/PlotlyChart';
import CodeConsole from '../../components/CodeConsole';
import { executeCode as clientExecutor } from '../../utils/codeExecutor';
import ErrorBoundary from '../../components/ErrorBoundary';

// Code samples for each section
const codeSnippets = {
  functionBasics: `% Define a function to square elements of an array
function squared = array_square(arr)
    squared = arr .^ 2;
end

% Test the function
test_array = [1, 2, 3, 4, 5];
result = array_square(test_array);
disp('Original array:');
disp(test_array);
disp('Squared array:');
disp(result);`,

  parameterPassing: `% Demonstrate pass-by-value behavior in MATLAB
function demo_parameter_passing()
    % Original value
    x = 10;
    disp(['Before function call: x = ' num2str(x)]);
    
    % Call function that tries to modify x
    y = increment(x);
    
    % Check if original value changed
    disp(['After function call: x = ' num2str(x)]);
    disp(['Function return value: y = ' num2str(y)]);
end

% Helper function that tries to modify input
function y = increment(x)
    x = x + 1;
    y = x;
end

% Run the demonstration
demo_parameter_passing();`,

  persistentVariable: `% Demonstrate persistent variable behavior
function demo_persistent()
    % Call counter function multiple times
    for i = 1:5
        count = persistent_counter();
        disp(['Call #' num2str(i) ' returned: ' num2str(count)]);
    end
end

% Persistent variable counter
function out = persistent_counter()
    persistent count
    if isempty(count)
        count = 0;
    end
    count = count + 1;
    out = count;
end

% Run the demonstration
demo_persistent();`,

  sampling: `% Generate and visualize sampling of a sine wave
fs = 100;                    % Sampling frequency (Hz)
t = 0:1/fs:1-1/fs;           % Time vector (1 second)
f = 5;                       % Signal frequency (Hz)

% Generate continuous-time signal
x_continuous = sin(2*pi*f*t);

% Sample at different rates
N1 = 8;                      % Samples per period for proper sampling
N2 = 4;                      % Samples per period for minimum sampling
N3 = 2;                      % Samples per period for undersampling

% Generate sampled signals
n1 = 0:N1-1;                 % Sample indices
n2 = 0:N2-1;                 % Sample indices
n3 = 0:N3-1;                 % Sample indices

t1 = n1/f/N1;                % Sample times
t2 = n2/f/N2;                % Sample times
t3 = n3/f/N3;                % Sample times

x1 = sin(2*pi*f*t1);         % Properly sampled signal
x2 = sin(2*pi*f*t2);         % Signal at Nyquist rate
x3 = sin(2*pi*f*t3);         % Undersampled signal

% Plot all signals
figure();
plot(t, x_continuous, 'b-', 'LineWidth', 1.5);
hold on;
stem(t1, x1, 'ro', 'filled', 'LineWidth', 1.5);
title('Proper Sampling (8 samples per period)');
xlabel('Time (s)');
ylabel('Amplitude');
legend('Continuous signal', 'Sampled signal');

figure();
plot(t, x_continuous, 'b-', 'LineWidth', 1.5);
hold on;
stem(t2, x2, 'ro', 'filled', 'LineWidth', 1.5);
title('Nyquist Rate Sampling (4 samples per period)');
xlabel('Time (s)');
ylabel('Amplitude');
legend('Continuous signal', 'Sampled signal');

figure();
plot(t, x_continuous, 'b-', 'LineWidth', 1.5);
hold on;
stem(t3, x3, 'ro', 'filled', 'LineWidth', 1.5);
title('Undersampling (2 samples per period)');
xlabel('Time (s)');
ylabel('Amplitude');
legend('Continuous signal', 'Sampled signal');`,

  aliasing: `% Demonstrate aliasing phenomenon
fs = 100;                    % Sampling frequency (Hz)
t = 0:1/fs:0.5-1/fs;         % Time vector (0.5 seconds)

f1 = 10;                     % Original signal frequency (Hz)
f2 = fs - f1;                % Aliased frequency (Hz)

% Generate signals
x1 = sin(2*pi*f1*t);         % Original signal
x2 = sin(2*pi*f2*t);         % Aliased signal

% Sample both signals at sampling rate fs
sample_points = 1:5:length(t); % Sample every 5th point
t_sampled = t(sample_points);
x1_sampled = x1(sample_points);
x2_sampled = x2(sample_points);

% Plot the signals
figure();
plot(t, x1, 'b-', 'LineWidth', 1.5);
hold on;
plot(t, x2, 'r--', 'LineWidth', 1.5);
stem(t_sampled, x1_sampled, 'go', 'filled');
title(['Aliasing Demonstration: ' num2str(f1) ' Hz and ' num2str(f2) ' Hz']);
xlabel('Time (s)');
ylabel('Amplitude');
legend('Original signal (10 Hz)', 'Aliased signal (90 Hz)', 'Sampled points');

% Notice how both signals produce the same samples!
disp('Samples from 10 Hz signal:');
disp(x1_sampled(1:5));
disp('Samples from 90 Hz signal:');
disp(x2_sampled(1:5));`
};

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

// Interactive code cell component for Jupyter-like experience
const CodeCell = ({ 
  code, 
  setCode, 
  onExecute, 
  consoleMessages = [],
  isProcessing = false,
  onClear,
  cellNumber,
  outputHeight = "180px"
}: { 
  code: string, 
  setCode: (code: string) => void, 
  onExecute: () => void,
  consoleMessages?: string[],
  isProcessing?: boolean,
  onClear?: () => void,
  cellNumber: number,
  outputHeight?: string
}) => {
  return (
    <div className="mb-8 border border-base-300 rounded-lg overflow-hidden shadow-md">
      {/* Code Editor */}
      <div className="bg-base-200 px-4 py-2 flex justify-between items-center">
        <div className="flex items-center">
          <div className="text-primary-500 font-mono text-sm mr-2">Code Cell [{cellNumber}]</div>
        </div>
        <div className="flex items-center gap-2">
          {onClear && (
            <button
              onClick={onClear}
              className="btn btn-outline btn-xs"
            >
              <span className="font-mono">Clear Output</span>
            </button>
          )}
          <button
            onClick={onExecute}
            disabled={isProcessing}
            className="btn btn-primary btn-sm"
          >
            {isProcessing ? (
              <>
                <span className="loading loading-spinner loading-xs mr-2"></span>
                <span className="font-mono">Running...</span>
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
      
      <CodeEditor
        height="200px"
        language="matlab"
        value={code}
        onChange={(value) => setCode(value || '')}
        theme="vs-dark"
        fontSize={14}
      />
      
      {/* Console Output */}
      {consoleMessages.length > 0 && (
        <div className="border-t border-base-300">
          <div className="bg-base-200 px-4 py-2 flex justify-between items-center">
            <div className="text-primary-500 font-mono text-sm">Output</div>
          </div>
          <CodeConsole 
            messages={consoleMessages}
            isProcessing={isProcessing}
            maxHeight={outputHeight}
            className="bg-base-100 text-base font-mono p-4"
            fontSize="14px"
          />
        </div>
      )}
    </div>
  );
};

// Section component for notebook-style layout
const NotebookSection = ({
  title,
  children,
  backgroundColor = "bg-base-100" 
}: {
  title: string,
  children: React.ReactNode,
  backgroundColor?: string
}) => {
  return (
    <div className={`py-8 ${backgroundColor}`}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
        <h2 className="text-2xl font-bold font-mono mb-6 text-primary-500 border-b border-primary-500 pb-2">{title}</h2>
        {children}
      </div>
    </div>
  );
};

// Text block component for explanations
const TextBlock = ({
  children,
  className = ""
}: {
  children: React.ReactNode,
  className?: string
}) => {
  return (
    <div className={`prose prose-lg max-w-none mb-6 font-mono ${className}`}>
      {children}
    </div>
  );
};

export default function MatlabFunctionsSamplingLab() {
  const [codeState, setCodeState] = useState({
    functionBasics: codeSnippets.functionBasics,
    parameterPassing: codeSnippets.parameterPassing,
    persistentVariable: codeSnippets.persistentVariable,
    sampling: codeSnippets.sampling,
    aliasing: codeSnippets.aliasing
  });
  
  const [consoleOutput, setConsoleOutput] = useState({
    functionBasics: [] as string[],
    parameterPassing: [] as string[],
    persistentVariable: [] as string[],
    sampling: [] as string[],
    aliasing: [] as string[]
  });
  
  const [isProcessing, setIsProcessing] = useState({
    functionBasics: false,
    parameterPassing: false,
    persistentVariable: false,
    sampling: false,
    aliasing: false
  });

  const handleRunCode = async (section: keyof typeof codeState) => {
    setIsProcessing(prev => ({ ...prev, [section]: true }));
    setConsoleOutput(prev => ({ 
      ...prev, 
      [section]: ['>> Executing code...'] 
    }));
    
    try {
      const result = await executeCode(codeState[section], true);
      
      const limitedMessages = result.output ? 
        (result.output.length > 50 ? 
          ['>> Output limited to 50 lines for readability...'].concat(result.output.slice(-49)) : 
          result.output) : 
        [];
      
      setConsoleOutput(prev => ({ 
        ...prev, 
        [section]: limitedMessages 
      }));
      
      if (!result.success && result.errorMessage) {
        setConsoleOutput(prev => {
          const currentOutput = prev[section];
          if (currentOutput.includes(`>> Error: ${result.errorMessage}`)) {
            return prev;
          }
          return { 
            ...prev, 
            [section]: [...currentOutput, `>> Error: ${result.errorMessage}`] 
          };
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setConsoleOutput(prev => ({ 
        ...prev, 
        [section]: ['>> Error: ' + errorMessage] 
      }));
    } finally {
      setIsProcessing(prev => ({ ...prev, [section]: false }));
    }
  };

  const handleClearConsole = (section: keyof typeof consoleOutput) => {
    setConsoleOutput(prev => ({ ...prev, [section]: [] }));
  };

  return (
    <ErrorBoundary>
      <div className="bg-base-100 min-h-screen font-mono">
        {/* Header */}
        <div className="bg-base-200 py-8 border-b border-primary-500">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
            <div className="text-center">
              <div className="text-primary-500 font-bold">ELEC 342 LAB 3</div>
              <h1 className="text-3xl font-bold mt-2 mb-4">MATLAB Functions & Sampling Theorem</h1>
              <p className="text-lg opacity-80 max-w-2xl mx-auto">
                Learn to create MATLAB functions and understand the Sampling Theorem in digital signal processing.
              </p>
              
              <div className="flex justify-center mt-6 space-x-4">
                <Link href="/labs" className="btn btn-outline">
                  Back to Labs
                </Link>
                <button className="btn btn-primary">
                  <span className="font-mono">Download Materials</span>
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Introduction */}
        <NotebookSection title="Introduction" backgroundColor="bg-base-100">
          <TextBlock>
            <p>
              Welcome to Lab 3! In this lab, we'll explore MATLAB functions and the Sampling Theorem, which are both fundamental concepts in signal processing.
            </p>
            <p>
              This lab is structured like a Jupyter notebook, where you'll read explanations and then immediately apply the concepts through interactive code cells. You can execute each code cell individually to see the results right away.
            </p>
            <p className="bg-primary-100 text-primary-800 p-4 rounded-md border-l-4 border-primary-500">
              <strong>Learning Objectives:</strong>
              <ul className="list-disc pl-5 mt-2">
                <li>Create and use MATLAB functions</li>
                <li>Understand parameter passing in MATLAB</li>
                <li>Learn about persistent variables</li>
                <li>Explore the Sampling Theorem and aliasing</li>
              </ul>
            </p>
          </TextBlock>
        </NotebookSection>
        
        {/* Section 1: MATLAB Function Basics */}
        <NotebookSection title="1. MATLAB Function Basics" backgroundColor="bg-base-200">
          <TextBlock>
            <p>
              MATLAB functions allow you to encapsulate reusable blocks of code. Functions in MATLAB are defined using the <code>function</code> keyword, followed by the output arguments, function name, and input arguments.
            </p>
            <p>
              The basic syntax is:
            </p>
            <pre className="bg-base-300 p-3 rounded">
              function [output1, output2, ...] = functionName(input1, input2, ...)
                  % Function body
                  % ...
              end
            </pre>
            <p>
              Let's create a simple function that squares all elements in an array:
            </p>
          </TextBlock>
          
          <CodeCell 
            code={codeState.functionBasics} 
            setCode={(newCode) => setCodeState(prev => ({ ...prev, functionBasics: newCode }))} 
            onExecute={() => handleRunCode('functionBasics')}
            consoleMessages={consoleOutput.functionBasics}
            isProcessing={isProcessing.functionBasics}
            onClear={() => handleClearConsole('functionBasics')}
            cellNumber={1}
          />
          
          <TextBlock>
            <p className="bg-base-300 p-4 rounded">
              <strong>Key Points:</strong>
              <ul className="list-disc pl-5 mt-2">
                <li>Function files should be named with the same name as the function (e.g., <code>array_square.m</code>)</li>
                <li>The first function in a file is the main function, but you can define multiple functions in the same file</li>
                <li>Use the element-wise operator (<code>.*</code>, <code>.^</code>, etc.) for array operations</li>
              </ul>
            </p>
          </TextBlock>
        </NotebookSection>
        
        {/* Section 2: Parameter Passing */}
        <NotebookSection title="2. Parameter Passing in MATLAB" backgroundColor="bg-base-100">
          <TextBlock>
            <p>
              MATLAB uses "pass-by-value" for function arguments, which means that functions receive a copy of the input variables, not the original variables themselves.
            </p>
            <p>
              This has important implications:
            </p>
            <ol className="list-decimal pl-5 space-y-2">
              <li>Modifying input parameters inside a function does not affect the original variables</li>
              <li>To "return" modified values, you must explicitly define output parameters</li>
            </ol>
            <p>
              Let's explore this behavior:
            </p>
          </TextBlock>
          
          <CodeCell 
            code={codeState.parameterPassing} 
            setCode={(newCode) => setCodeState(prev => ({ ...prev, parameterPassing: newCode }))} 
            onExecute={() => handleRunCode('parameterPassing')}
            consoleMessages={consoleOutput.parameterPassing}
            isProcessing={isProcessing.parameterPassing}
            onClear={() => handleClearConsole('parameterPassing')}
            cellNumber={2}
          />
          
          <TextBlock>
            <p>
              As you can see from the output, the variable <code>x</code> keeps its original value of 10 even after the function tries to modify it. This is because MATLAB passes a copy of <code>x</code> to the function, not the original variable.
            </p>
            <p>
              The function <code>increment</code> still works correctly, but it must return the modified value, which is then assigned to a new variable <code>y</code>.
            </p>
          </TextBlock>
        </NotebookSection>
        
        {/* Section 3: Persistent Variables */}
        <NotebookSection title="3. Persistent Variables" backgroundColor="bg-base-200">
          <TextBlock>
            <p>
              Sometimes, you need a function to "remember" values between calls. In MATLAB, you can use <code>persistent</code> variables for this purpose.
            </p>
            <p>
              Persistent variables:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Retain their values between function calls</li>
              <li>Are only visible within the function where they are declared</li>
              <li>Exist until the MATLAB session ends or the function is cleared</li>
            </ul>
            <p>
              The following example creates a counter function that keeps track of how many times it has been called:
            </p>
          </TextBlock>
          
          <CodeCell 
            code={codeState.persistentVariable} 
            setCode={(newCode) => setCodeState(prev => ({ ...prev, persistentVariable: newCode }))} 
            onExecute={() => handleRunCode('persistentVariable')}
            consoleMessages={consoleOutput.persistentVariable}
            isProcessing={isProcessing.persistentVariable}
            onClear={() => handleClearConsole('persistentVariable')}
            cellNumber={3}
          />
          
          <TextBlock>
            <p>
              Notice that the counter increments with each call, even though we don't pass any information about previous calls to the function.
            </p>
            <p className="bg-primary-100 text-primary-800 p-4 rounded-md">
              <strong>Tip:</strong> Persistent variables are initialized to <code>[]</code> (empty matrix) the first time the function runs. Always check if a persistent variable is empty before using it.
            </p>
          </TextBlock>
        </NotebookSection>
        
        {/* Section 4: Sampling Theorem */}
        <NotebookSection title="4. Sampling Theorem" backgroundColor="bg-base-100">
          <TextBlock>
            <p>
              The Sampling Theorem is a fundamental concept in digital signal processing that describes how to accurately represent a continuous-time signal with discrete samples.
            </p>
            <p>
              The theorem states that to perfectly reconstruct a continuous bandlimited signal from its samples, the sampling rate must be at least twice the highest frequency component in the signal.
            </p>
            <p className="font-bold">
              f<sub>s</sub> ≥ 2f<sub>max</sub>
            </p>
            <p>
              Where:
            </p>
            <ul className="list-disc pl-5">
              <li>f<sub>s</sub> is the sampling frequency</li>
              <li>f<sub>max</sub> is the highest frequency component in the signal</li>
            </ul>
            <p>
              The minimum required sampling rate (2f<sub>max</sub>) is called the <strong>Nyquist rate</strong>.
            </p>
            <p>
              Let's visualize how sampling works with different sampling rates:
            </p>
          </TextBlock>
          
          <CodeCell 
            code={codeState.sampling} 
            setCode={(newCode) => setCodeState(prev => ({ ...prev, sampling: newCode }))} 
            onExecute={() => handleRunCode('sampling')}
            consoleMessages={consoleOutput.sampling}
            isProcessing={isProcessing.sampling}
            onClear={() => handleClearConsole('sampling')}
            cellNumber={4}
          />
          
          <TextBlock>
            <p>
              The above code demonstrates sampling a 5 Hz sine wave at three different rates:
            </p>
            <ol className="list-decimal pl-5">
              <li><strong>8 samples per period</strong> (40 Hz sampling rate) - Well above the Nyquist rate</li>
              <li><strong>4 samples per period</strong> (20 Hz sampling rate) - Exactly at the Nyquist rate</li>
              <li><strong>2 samples per period</strong> (10 Hz sampling rate) - Below the Nyquist rate (undersampling)</li>
            </ol>
            <p>
              Notice how the first and second cases allow for accurate reconstruction of the signal, while the third case (undersampling) does not provide enough information to recover the original signal.
            </p>
          </TextBlock>
        </NotebookSection>
        
        {/* Section 5: Aliasing */}
        <NotebookSection title="5. Aliasing" backgroundColor="bg-base-200">
          <TextBlock>
            <p>
              When we sample a signal at a rate lower than the Nyquist rate, a phenomenon called <strong>aliasing</strong> occurs. This means that high-frequency components in the original signal appear as lower frequencies in the sampled signal.
            </p>
            <p>
              If a frequency component f<sub>1</sub> is higher than half the sampling rate (f<sub>s</sub>/2), it will appear in the sampled signal as a frequency f<sub>2</sub> given by:
            </p>
            <p className="font-bold text-center my-4">
              f<sub>2</sub> = |f<sub>1</sub> - n·f<sub>s</sub>|
            </p>
            <p>
              where n is the integer that minimizes the absolute value.
            </p>
            <p>
              Let's demonstrate aliasing with a practical example:
            </p>
          </TextBlock>
          
          <CodeCell 
            code={codeState.aliasing} 
            setCode={(newCode) => setCodeState(prev => ({ ...prev, aliasing: newCode }))} 
            onExecute={() => handleRunCode('aliasing')}
            consoleMessages={consoleOutput.aliasing}
            isProcessing={isProcessing.aliasing}
            onClear={() => handleClearConsole('aliasing')}
            cellNumber={5}
            outputHeight="220px"
          />
          
          <TextBlock>
            <p>
              This example demonstrates how a 10 Hz signal and a 90 Hz signal produce identical samples when sampled at 100 Hz. This is because 90 Hz is aliased to 10 Hz (90 Hz = 100 Hz - 10 Hz).
            </p>
            <p>
              Aliasing has significant practical implications:
            </p>
            <ul className="list-disc pl-5">
              <li>Audio sampling: Higher frequencies can "fold back" and create artifacts</li>
              <li>Image processing: Patterns that exceed the camera's resolution can create moiré patterns</li>
              <li>Signal processing: Aliased frequencies can be indistinguishable from true signal components</li>
            </ul>
            <p className="bg-red-100 text-red-800 p-4 rounded-md border-l-4 border-red-500 mt-4">
              <strong>Important:</strong> To prevent aliasing, signals are typically passed through an anti-aliasing filter (low-pass filter) before sampling, which removes frequency components above the Nyquist frequency.
            </p>
          </TextBlock>
        </NotebookSection>
        
        {/* Conclusion */}
        <NotebookSection title="Conclusion" backgroundColor="bg-base-100">
          <TextBlock>
            <p>
              In this lab, you've learned about:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Creating and using MATLAB functions</li>
              <li>How parameter passing works in MATLAB</li>
              <li>Using persistent variables to maintain state between function calls</li>
              <li>The Sampling Theorem and its importance in digital signal processing</li>
              <li>The phenomenon of aliasing and its implications</li>
            </ul>
            <p className="mt-4">
              These concepts are essential for signal processing and will be useful in future labs and assignments. To deepen your understanding, try modifying the code examples to experiment with different scenarios, such as:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Creating functions with multiple inputs and outputs</li>
              <li>Sampling signals with different frequency components</li>
              <li>Visualizing aliasing with different sampling rates</li>
            </ul>
          </TextBlock>
          
          <div className="flex justify-between mt-8">
            <Link href="/labs" className="btn btn-outline">
              <span className="font-mono">← Back to Labs</span>
            </Link>
            <button className="btn btn-primary">
              <span className="font-mono">Complete Lab</span>
            </button>
          </div>
        </NotebookSection>
      </div>
    </ErrorBoundary>
  );
} 