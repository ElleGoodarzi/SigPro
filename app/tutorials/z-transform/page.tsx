"use client";

import React, { useState } from "react";
import { MathJax, MathJaxContext } from "better-react-mathjax";
import Image from "next/image";

export default function ZTransformTutorial() {
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 6;
  
  const handlePreviousStep = () => {
    setCurrentStep((prev) => Math.max(1, prev - 1));
  };

  const handleNextStep = () => {
    setCurrentStep((prev) => Math.min(totalSteps, prev + 1));
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-cyan-400 mb-2 space-mono">Z-Transform: From Theory to Practice</h1>
        <p className="text-xl mb-8 text-gray-300">Understanding the mathematical bridge between discrete sequences and complex functions</p>
        
        {/* Progress Tracker */}
        <div className="mb-8 bg-gray-800 p-4 rounded-lg">
          <div className="flex items-center mb-2">
            <div className="text-sm text-cyan-400">Progress</div>
            <div className="ml-auto text-sm text-cyan-400">{currentStep}/{totalSteps}</div>
          </div>
          <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-purple-500 to-cyan-400" 
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            ></div>
          </div>
          <div className="flex justify-between mt-2">
            {Array.from({ length: totalSteps }).map((_, index) => (
              <button
                key={index}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs 
                  ${currentStep > index 
                    ? "bg-cyan-400 text-gray-900" 
                    : currentStep === index + 1 
                      ? "bg-purple-500 text-white" 
                      : "bg-gray-700 text-gray-400"}`}
                onClick={() => setCurrentStep(index + 1)}
              >
                {index + 1}
              </button>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="panel-sci-fi p-6 mb-8">
          {/* Tutorial content will be rendered here based on currentStep */}
          <div>
            <MathJaxContext>
              {/* Step 1 */}
              {currentStep === 1 && (
                <div className="animate-fade-in">
                  <h2 className="text-2xl font-bold mb-4 text-cyan-400">Introduction to the Z-Transform</h2>
                  <p className="mb-4">
                    The Z-transform is a powerful mathematical tool for analyzing discrete-time signals and systems, similar to 
                    how the Laplace transform is used for continuous-time signals.
                  </p>
                  <div className="bg-gray-800 p-4 rounded-lg mb-6">
                    <h3 className="text-xl text-purple-400 mb-2">Definition:</h3>
                    <MathJax>
                      {"\\[X(z) = \\sum_{k=-\\infty}^{\\infty} x[k]z^{-k}\\]"}
                    </MathJax>
                    <p className="text-sm text-gray-400 mt-2">
                      Where z is a complex number and x[k] is the discrete-time signal.
                    </p>
                  </div>
                  
                  <div className="mt-6">
                    <h3 className="text-xl text-cyan-400 mb-2">Why Study the Z-Transform?</h3>
                    <ul className="list-disc pl-6 space-y-2">
                      <li>Simplifies analysis of discrete-time systems</li>
                      <li>Converts difference equations to algebraic equations</li>
                      <li>Crucial for digital filter design</li>
                      <li>Essential for understanding frequency response</li>
                      <li>Forms the theoretical foundation for the Discrete Fourier Transform (DFT)</li>
                    </ul>
                  </div>
                </div>
              )}

              {/* Step 2 */}
              {currentStep === 2 && (
                <div className="animate-fade-in">
                  <h2 className="text-2xl font-bold mb-4 text-cyan-400">The Inverse Z-Transform</h2>
                  
                  <p className="mb-4">
                    The inverse Z-transform allows us to recover the original discrete-time signal x[k] from its Z-transform X(z).
                  </p>
                  
                  <div className="bg-gray-800 p-4 rounded-lg mb-6">
                    <h3 className="text-xl text-purple-400 mb-2">Inverse Formula:</h3>
                    <MathJax>
                      {"\\[x[k] = \\frac{1}{2\\pi j}\\oint_C X(z)z^{k-1}dz\\]"}
                    </MathJax>
                    <p className="text-sm text-gray-400 mt-2">
                      Where C is a closed contour that encircles the origin of the z-plane in a counter-clockwise direction.
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                    <div className="bg-gray-800 p-4 rounded-lg">
                      <h3 className="text-lg text-cyan-400 mb-2">Important Points:</h3>
                      <ul className="list-disc pl-6 space-y-2 text-sm">
                        <li>The contour C must lie within the Region of Convergence (ROC)</li>
                        <li>Counter-clockwise direction is crucial for the residue theorem application</li>
                        <li>The formula is a direct application of Laurent series coefficient extraction</li>
                      </ul>
                    </div>
                    
                    <div className="bg-gray-800 p-4 rounded-lg">
                      <h3 className="text-lg text-cyan-400 mb-2">Practical Methods:</h3>
                      <ul className="list-disc pl-6 space-y-2 text-sm">
                        <li>Partial fraction expansion</li>
                        <li>Power series expansion</li>
                        <li>Residue method</li>
                        <li>Reference tables</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3 */}
              {currentStep === 3 && (
                <div className="animate-fade-in">
                  <h2 className="text-2xl font-bold mb-4 text-cyan-400">Region of Convergence (ROC)</h2>
                  
                  <p className="mb-4">
                    The Region of Convergence (ROC) is a crucial concept in Z-transform theory. It defines the set of z-values for which the Z-transform sum converges.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div className="bg-gray-800 p-4 rounded-lg">
                      <h3 className="text-lg text-cyan-400 mb-2">Key Properties of ROC:</h3>
                      <ul className="list-disc pl-6 space-y-2 text-sm">
                        <li>The ROC is always a ring or annular region in the z-plane</li>
                        <li>For causal signals, the ROC extends outward from the outermost pole</li>
                        <li>For anti-causal signals, the ROC extends inward from the innermost pole</li>
                        <li>For finite-duration signals, the ROC is the entire z-plane (except possibly z=0 or z=∞)</li>
                        <li>The ROC cannot contain any poles</li>
                      </ul>
                    </div>
                    
                    <div className="bg-gray-800 p-4 rounded-lg">
                      <h3 className="text-lg text-cyan-400 mb-2">ROC and Signal Types:</h3>
                      <table className="w-full text-sm">
                        <thead>
                          <tr>
                            <th className="text-left text-purple-400 pb-2">Signal Type</th>
                            <th className="text-left text-purple-400 pb-2">ROC Shape</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="py-1">Right-sided</td>
                            <td>|z| &gt; r (outside a circle)</td>
                          </tr>
                          <tr>
                            <td className="py-1">Left-sided</td>
                            <td>|z| &lt; r (inside a circle)</td>
                          </tr>
                          <tr>
                            <td className="py-1">Two-sided</td>
                            <td>r₁ &lt; |z| &lt; r₂ (between circles)</td>
                          </tr>
                          <tr>
                            <td className="py-1">Finite duration</td>
                            <td>All z (entire plane)</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                  
                  <div className="bg-gray-800 p-4 rounded-lg">
                    <h3 className="text-lg text-cyan-400 mb-2">Why ROC Matters:</h3>
                    <p className="mb-2">
                      The ROC is essential because:
                    </p>
                    <ul className="list-disc pl-6 space-y-2 text-sm">
                      <li>It determines the stability of a system (stable if ROC includes the unit circle)</li>
                      <li>Different ROCs for the same rational function correspond to different time-domain signals</li>
                      <li>It impacts the causality and realizability of systems</li>
                      <li>For the inverse Z-transform, the contour must lie within the ROC</li>
                    </ul>
                  </div>
                </div>
              )}

              {/* Step 4 */}
              {currentStep === 4 && (
                <div className="animate-fade-in">
                  <h2 className="text-2xl font-bold mb-4 text-cyan-400">Z-Transform Properties</h2>
                  
                  <p className="mb-4">
                    The Z-transform possesses several useful properties that simplify the analysis of discrete-time signals and systems.
                  </p>
                  
                  <div className="bg-gray-800 p-4 rounded-lg mb-6">
                    <h3 className="text-xl text-purple-400 mb-2">Key Properties:</h3>
                    <table className="w-full">
                      <thead>
                        <tr>
                          <th className="text-left py-2 text-cyan-400">Property</th>
                          <th className="text-left py-2 text-cyan-400">Time Domain</th>
                          <th className="text-left py-2 text-cyan-400">Z Domain</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-t border-gray-700">
                          <td className="py-2">Linearity</td>
                          <td>ax₁[n] + bx₂[n]</td>
                          <td>aX₁(z) + bX₂(z)</td>
                        </tr>
                        <tr className="border-t border-gray-700">
                          <td className="py-2">Time Shift</td>
                          <td>x[n-k]</td>
                          <td>z⁻ᵏX(z)</td>
                        </tr>
                        <tr className="border-t border-gray-700">
                          <td className="py-2">Scaling</td>
                          <td>aⁿx[n]</td>
                          <td>X(z/a)</td>
                        </tr>
                        <tr className="border-t border-gray-700">
                          <td className="py-2">Time Reversal</td>
                          <td>x[-n]</td>
                          <td>X(1/z)</td>
                        </tr>
                        <tr className="border-t border-gray-700">
                          <td className="py-2">Differentiation</td>
                          <td>nx[n]</td>
                          <td>-z·d/dz X(z)</td>
                        </tr>
                        <tr className="border-t border-gray-700">
                          <td className="py-2">Convolution</td>
                          <td>x₁[n] * x₂[n]</td>
                          <td>X₁(z)·X₂(z)</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  
                  <div className="mt-6">
                    <h3 className="text-xl text-cyan-400 mb-4">Application: Solving Difference Equations</h3>
                    <p className="mb-4">
                      One of the most powerful applications of the Z-transform is solving linear difference equations.
                    </p>
                    
                    <div className="bg-gray-800 p-4 rounded-lg">
                      <h4 className="text-lg text-purple-400 mb-2">Example:</h4>
                      <p className="mb-2">Consider the difference equation:</p>
                      <MathJax>
                        {"\\[y[n] - 0.8y[n-1] = x[n]\\]"}
                      </MathJax>
                      
                      <p className="mt-4 mb-2">Taking the Z-transform of both sides:</p>
                      <MathJax>
                        {"\\[Y(z) - 0.8z^{-1}Y(z) = X(z)\\]"}
                      </MathJax>
                      
                      <p className="mt-4 mb-2">Solving for Y(z):</p>
                      <MathJax>
                        {"\\[Y(z)(1 - 0.8z^{-1}) = X(z)\\]"}
                        {"\\[Y(z) = \\frac{X(z)}{1 - 0.8z^{-1}} = \\frac{z}{z - 0.8}X(z)\\]"}
                      </MathJax>
                      
                      <p className="mt-4 text-sm text-gray-400">
                        This is the transfer function H(z) = Y(z)/X(z) = z/(z-0.8) of a first-order IIR filter.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 5 */}
              {currentStep === 5 && (
                <div className="animate-fade-in">
                  <h2 className="text-2xl font-bold mb-4 text-cyan-400">Common Z-Transforms</h2>
                  
                  <p className="mb-4">
                    Here are some frequently used Z-transform pairs that are essential for signal processing applications.
                  </p>
                  
                  <div className="bg-gray-800 p-4 rounded-lg mb-6">
                    <h3 className="text-xl text-purple-400 mb-2">Basic Z-Transform Pairs:</h3>
                    <table className="w-full">
                      <thead>
                        <tr>
                          <th className="text-left py-2 text-cyan-400">Signal x[n]</th>
                          <th className="text-left py-2 text-cyan-400">Z-Transform X(z)</th>
                          <th className="text-left py-2 text-cyan-400">ROC</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-t border-gray-700">
                          <td className="py-2">δ[n] (unit impulse)</td>
                          <td>1</td>
                          <td>All z</td>
                        </tr>
                        <tr className="border-t border-gray-700">
                          <td className="py-2">u[n] (unit step)</td>
                          <td>z/(z-1)</td>
                          <td>|z| &gt; 1</td>
                        </tr>
                        <tr className="border-t border-gray-700">
                          <td className="py-2">aⁿu[n]</td>
                          <td>z/(z-a)</td>
                          <td>|z| &gt; |a|</td>
                        </tr>
                        <tr className="border-t border-gray-700">
                          <td className="py-2">naⁿu[n]</td>
                          <td>az/(z-a)²</td>
                          <td>|z| &gt; |a|</td>
                        </tr>
                        <tr className="border-t border-gray-700">
                          <td className="py-2">-aⁿu[-n-1]</td>
                          <td>z/(z-a)</td>
                          <td>|z| &lt; |a|</td>
                        </tr>
                        <tr className="border-t border-gray-700">
                          <td className="py-2">cos(ω₀n)u[n]</td>
                          <td>z(z-cos(ω₀))/((z-cos(ω₀))²+sin²(ω₀))</td>
                          <td>|z| &gt; 1</td>
                        </tr>
                        <tr className="border-t border-gray-700">
                          <td className="py-2">sin(ω₀n)u[n]</td>
                          <td>z·sin(ω₀)/((z-cos(ω₀))²+sin²(ω₀))</td>
                          <td>|z| &gt; 1</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  
                  <div className="mt-6">
                    <h3 className="text-xl text-cyan-400 mb-4">Interactive Example: First-Order System Response</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-gray-800 p-4 rounded-lg">
                        <h4 className="text-lg text-purple-400 mb-2">System Analysis:</h4>
                        <p className="mb-2">Consider a first-order system with transfer function:</p>
                        <MathJax>
                          {"\\[H(z) = \\frac{z}{z - 0.8}\\]"}
                        </MathJax>
                        
                        <p className="mt-4 mb-2">The impulse response h[n] is:</p>
                        <MathJax>
                          {"\\[h[n] = 0.8^n u[n]\\]"}
                        </MathJax>
                        
                        <p className="mt-4 mb-2">The step response s[n] is:</p>
                        <MathJax>
                          {"\\[S(z) = H(z) \\cdot \\frac{z}{z-1} = \\frac{z^2}{(z-0.8)(z-1)}\\]"}
                        </MathJax>
                        
                        <p className="mt-2 mb-2">Using partial fraction expansion:</p>
                        <MathJax>
                          {"\\[S(z) = \\frac{5}{z-1} - \\frac{5}{z-0.8}\\]"}
                        </MathJax>
                        
                        <p className="mt-2">Therefore:</p>
                        <MathJax>
                          {"\\[s[n] = 5 - 5(0.8)^n for n \\geq 0\\]"}
                        </MathJax>
                      </div>
                      
                      <div className="bg-gray-800 p-4 rounded-lg">
                        <h4 className="text-lg text-purple-400 mb-2">System Response:</h4>
                        <div className="h-64 w-full bg-gray-900 rounded flex items-center justify-center">
                          <div className="text-center">
                            <div className="text-cyan-400 mb-2">First-Order System Response</div>
                            <div className="text-xs text-gray-500">
                              The step response approaches a steady-state value of 5<br/>
                              The impulse response decays exponentially
                            </div>
                          </div>
                        </div>
                        <p className="text-sm text-gray-400 mt-2">
                          The step response approaches a steady-state value of 5 as n increases, while the impulse response decays exponentially.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 6 */}
              {currentStep === 6 && (
                <div className="animate-fade-in">
                  <h2 className="text-2xl font-bold mb-4 text-cyan-400">Practical Applications & MATLAB Implementation</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div className="bg-gray-800 p-4 rounded-lg">
                      <h3 className="text-lg text-cyan-400 mb-2">Applications:</h3>
                      <ul className="list-disc pl-6 space-y-2">
                        <li>Digital filter design</li>
                        <li>Control system analysis</li>
                        <li>Signal processing algorithms</li>
                        <li>Communication systems</li>
                        <li>Image processing</li>
                        <li>Audio processing</li>
                      </ul>
                    </div>
                    
                    <div className="bg-gray-800 p-4 rounded-lg">
                      <h3 className="text-lg text-cyan-400 mb-2">Z-Transform in MATLAB:</h3>
                      <p className="mb-2">MATLAB provides several functions for working with Z-transforms:</p>
                      <ul className="list-disc pl-6 space-y-2 text-sm">
                        <li><span className="text-purple-400">tf2zpk</span> - Convert transfer function to zero-pole-gain form</li>
                        <li><span className="text-purple-400">zplane</span> - Plot poles and zeros in z-plane</li>
                        <li><span className="text-purple-400">freqz</span> - Compute frequency response</li>
                        <li><span className="text-purple-400">filter</span> - Apply digital filter to data</li>
                        <li><span className="text-purple-400">residuez</span> - Partial fraction expansion</li>
                      </ul>
                    </div>
                  </div>
                  
                  <div className="bg-gray-800 p-4 rounded-lg mb-6">
                    <h3 className="text-lg text-cyan-400 mb-2">MATLAB Example: Digital Filter Analysis</h3>
                    <p className="mb-4">The following code demonstrates how to analyze a digital filter using Z-transform concepts:</p>
                    
                    <pre className="bg-gray-900 p-4 rounded overflow-x-auto text-sm">
                      <code className="text-gray-300">
{`% Define a simple first-order IIR filter
b = [1];       % Numerator coefficients
a = [1, -0.8]; % Denominator coefficients

% Display the transfer function in z-domain
disp('Transfer Function H(z) = z/(z-0.8)')

% Convert to zero-pole-gain form
[z, p, k] = tf2zpk(b, a);
disp('Zeros:'); disp(z);
disp('Poles:'); disp(p);
disp('Gain:'); disp(k);

% Plot pole-zero diagram
figure(1)
zplane(b, a)
title('Pole-Zero Plot')

% Compute and plot frequency response
[h, w] = freqz(b, a);
figure(2)
subplot(2,1,1)
plot(w/pi, abs(h))
grid on
title('Magnitude Response')
xlabel('Normalized Frequency (×π rad/sample)')
ylabel('Magnitude')

subplot(2,1,2)
plot(w/pi, angle(h))
grid on
title('Phase Response')
xlabel('Normalized Frequency (×π rad/sample)')
ylabel('Phase (radians)')

% Compute impulse response
n = 0:20;
impulse = [1 zeros(1,20)];
h = filter(b, a, impulse);

figure(3)
stem(n, h)
grid on
title('Impulse Response h[n]')
xlabel('Sample (n)')
ylabel('Amplitude')`}
                      </code>
                    </pre>
                  </div>
                  
                  <div className="mt-6 p-4 bg-purple-900 bg-opacity-30 border border-purple-500 rounded-lg">
                    <h4 className="text-lg text-cyan-400 mb-2">Further Learning:</h4>
                    <p>
                      Try implementing the provided MATLAB code in our simulator to visualize the concepts covered
                      in this tutorial. Experiment with different filter coefficients and observe how the pole-zero
                      locations affect the system response.
                    </p>
                  </div>
                  
                  <div className="mt-8 bg-gray-900 p-4 rounded-lg border border-gray-700">
                    <h3 className="text-xl text-cyan-400 mb-4">Interactive Z-Transform Simulator</h3>
                    <div className="mb-4">
                      <p className="mb-2">Try the examples below or modify the code to experiment with different systems:</p>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-4">
                      <div className="bg-gray-800 rounded-lg overflow-hidden">
                        <div className="bg-gray-900 p-2 flex justify-between items-center">
                          <div className="text-sm text-purple-400">MATLAB/Octave Code</div>
                          <div className="space-x-2">
                            <button className="px-2 py-1 text-xs rounded bg-purple-600 hover:bg-purple-500 text-white">
                              Run
                            </button>
                            <button className="px-2 py-1 text-xs rounded bg-gray-700 hover:bg-gray-600 text-white">
                              Clear
                            </button>
                          </div>
                        </div>
                        <div className="bg-gray-900 p-4 text-gray-300 font-mono text-sm h-64 overflow-auto">
{`% Define a simple first-order IIR filter
b = [1];       % Numerator coefficients
a = [1, -0.8]; % Denominator coefficients

% Convert to zero-pole-gain form
[z, p, k] = tf2zpk(b, a);
disp('Zeros:'); disp(z);
disp('Poles:'); disp(p);
disp('Gain:'); disp(k);

% Compute frequency response
[h, w] = freqz(b, a);

% Plot magnitude response
figure;
plot(w/pi, abs(h));
grid on;
title('Magnitude Response');
xlabel('Normalized Frequency (×π rad/sample)');
ylabel('Magnitude');

% Compute impulse response
n = 0:20;
impulse = [1 zeros(1,20)];
h = filter(b, a, impulse);

% Plot impulse response
figure;
stem(n, h);
grid on;
title('Impulse Response h[n]');
xlabel('Sample (n)');
ylabel('Amplitude');`}
                        </div>
                      </div>
                      
                      <div className="bg-gray-800 rounded-lg overflow-hidden">
                        <div className="bg-gray-900 p-2">
                          <div className="text-sm text-purple-400">Console Output</div>
                        </div>
                        <div className="p-4 font-mono text-sm text-gray-300 h-40 overflow-y-auto">
                          Zeros:
                              0
                           
                          Poles:
                              0.8000
                           
                          Gain:
                              1
                           
                          [Plot windows would appear here]
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-4 text-sm text-gray-500">
                      Note: This is a simplified version of the simulator. For full functionality, please use the main simulator in the Labs section.
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation Controls */}
              <div className="flex justify-between mt-8">
                <button 
                  onClick={handlePreviousStep} 
                  className={`px-4 py-2 rounded bg-gray-700 text-white hover:bg-gray-600 
                    ${currentStep === 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
                  disabled={currentStep === 1}
                >
                  Previous
                </button>
                <button 
                  onClick={handleNextStep} 
                  className={`px-4 py-2 rounded bg-cyan-600 text-white hover:bg-cyan-500
                    ${currentStep === totalSteps ? 'opacity-50 cursor-not-allowed' : ''}`}
                  disabled={currentStep === totalSteps}
                >
                  Next
                </button>
              </div>
            </MathJaxContext>
          </div>
        </div>
      </div>
    </div>
  );
}