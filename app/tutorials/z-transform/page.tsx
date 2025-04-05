"use client";

import React, { useState, useEffect, Suspense } from "react";
import { MathJax, MathJaxContext } from "better-react-mathjax";
import Image from "next/image";
import ZTransformSciFiVisualizer from "../../components/ZTransformSciFiVisualizer";
import SignalComparisonTool from "../../components/SignalComparisonTool";
import Link from "next/link";

// Fallback components for error boundaries
const ZTransformVisualizerFallback = () => (
  <div className="bg-gray-800 p-6 rounded-lg text-center border border-gray-700">
    <div className="text-amber-400 text-xl mb-4">Visualization Failed to Load</div>
    <p className="mb-4">The Z-Transform Visualizer couldn't be displayed. This might be due to:</p>
    <ul className="list-disc text-left pl-8 mb-4">
      <li>Browser compatibility issues</li>
      <li>JavaScript errors</li>
      <li>Memory limitations</li>
    </ul>
    <p>Try refreshing the page or using a different browser.</p>
  </div>
);

const SignalComparisonFallback = () => (
  <div className="bg-gray-800 p-6 rounded-lg text-center border border-gray-700">
    <div className="text-amber-400 text-xl mb-4">Signal Comparison Tool Failed to Load</div>
    <p className="mb-4">The interactive comparison tool couldn't be displayed.</p>
    <p>Try refreshing the page or using a different browser.</p>
  </div>
);

// Error boundary component for catching rendering errors
interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true };
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      return this.props.fallback;
    }

    return this.props.children;
  }
}

export default function ZTransformTutorial() {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const totalSteps = 7;
  const [showSolution, setShowSolution] = useState<Record<string, boolean>>({});
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({});
  const [quizResults, setQuizResults] = useState<Record<string, boolean>>({});
  const [componentsLoaded, setComponentsLoaded] = useState(false);
  
  // Set components as loaded after initial render
  useEffect(() => {
    setComponentsLoaded(true);
  }, []);
  
  const handlePreviousStep = () => {
    setCurrentStep((prev) => Math.max(1, prev - 1));
    window.scrollTo(0, 0);
  };

  const handleNextStep = () => {
    setCurrentStep((prev) => Math.min(totalSteps, prev + 1));
    window.scrollTo(0, 0);
  };

  const toggleSolution = (problemId: string) => {
    setShowSolution(prev => ({
      ...prev,
      [problemId]: !prev[problemId]
    }));
  };

  const handleQuizAnswer = (quizId: string, answerId: string) => {
    setQuizAnswers(prev => ({
      ...prev,
      [quizId]: answerId
    }));
  };

  const checkQuizAnswer = (quizId: string, correctAnswer: string) => {
    const isCorrect = quizAnswers[quizId] === correctAnswer;
    setQuizResults(prev => ({
      ...prev,
      [quizId]: isCorrect
    }));
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-cyan-400 mb-2 space-mono">Z-Transform: From Theory to Practice</h1>
        <p className="text-xl mb-8 text-gray-300">Understanding the mathematical bridge between discrete sequences and complex functions</p>
        
        {/* Navigation buttons */}
        <div className="flex justify-between mb-6">
          <button 
            className="px-4 py-2 bg-gray-800 text-white rounded flex items-center disabled:opacity-50"
            onClick={handlePreviousStep}
            disabled={currentStep === 1}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Previous
          </button>
          
          <button 
            className="px-4 py-2 bg-cyan-600 text-white rounded flex items-center disabled:opacity-50"
            onClick={handleNextStep}
            disabled={currentStep === totalSteps}
          >
            Next
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
        
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
          <MathJaxContext>
            
            {/* Step 1: Introduction to Z-Transforms */}
            {currentStep === 1 && (
              <div className="animate-fade-in">
                <h2 className="text-2xl font-bold mb-4 text-cyan-400">Introduction to Z-Transforms</h2>
                
                <p className="mb-4">
                  The Z-transform is a powerful mathematical tool used extensively in digital signal processing, control systems, 
                  and communications. It transforms discrete-time signals into a complex frequency domain representation.
                </p>
                
                <div className="bg-gray-800 p-4 rounded-lg mb-6">
                  <h3 className="text-xl text-purple-400 mb-3">Definition of the Z-Transform</h3>
                  
                  <p className="mb-3">
                    For a discrete-time signal x[n], the Z-transform is defined as:
                  </p>
                  
                  <div className="flex justify-center my-4">
                    <MathJax>
                      {`\\[X(z) = \\sum_{n=-\\infty}^{\\infty} x[n]z^{-n}\\]`}
                    </MathJax>
                  </div>
                  
                  <p className="mb-3">
                    Where z is a complex variable, and the transform exists for values of z where the sum converges.
                  </p>
                </div>
                
                <div className="bg-purple-900 bg-opacity-30 p-4 rounded-lg border border-purple-500 mb-6">
                  <h4 className="text-lg text-cyan-400 mb-2">Key Properties:</h4>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>The Z-transform converts difference equations to algebraic equations</li>
                    <li>It transforms convolution in the time domain to multiplication in the z-domain</li>
                    <li>The region where the Z-transform converges is called the Region of Convergence (ROC)</li>
                    <li>The ROC is crucial for determining signal properties and for inverse transforms</li>
                  </ul>
                </div>
                
                {/* Basic Z-Transform Guide */}
                <div className="mb-8">
                  <h3 className="text-xl text-purple-400 mb-4">Z-Transform Guide</h3>
                  <p className="mb-4">
                    The Z-transform maps discrete sequences to complex functions, enabling powerful analysis techniques
                    for digital signal processing and control systems.
                  </p>
                  
                  <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
                    <h4 className="text-lg text-cyan-400 mb-3">Basic Steps for Z-Transform Calculation:</h4>
                    <ol className="list-decimal pl-6 space-y-2">
                      <li>Identify the discrete-time sequence x[n]</li>
                      <li>Apply the Z-transform formula: X(z) = Σ x[n]z^(-n)</li>
                      <li>Simplify the resulting expression</li>
                      <li>Determine the Region of Convergence (ROC)</li>
                      <li>Analyze stability based on pole locations and ROC</li>
                    </ol>
                  </div>
                </div>
                
                <div className="mt-8 mb-6">
                  <h3 className="text-xl text-purple-400 mb-4">Z-Transform Exploration Tool</h3>
                  
                  <p className="mb-4">
                    To help you visualize how the Z-transform maps discrete-time sequences to complex functions,
                    we've created an interactive visualization tool. You can explore it directly from our tools section.
                  </p>
                  
                  <div className="bg-gray-800 border border-cyan-800 hover:border-cyan-600 rounded-lg overflow-hidden transition-all shadow-lg transform hover:-translate-y-1 hover:shadow-cyan-900/30">
                    <Link 
                      href="/tools/z-transform"
                      className="block"
                    >
                      <div className="flex flex-col md:flex-row items-center">
                        <div className="bg-gradient-to-br from-cyan-900/40 to-purple-900/40 p-6 flex items-center justify-center md:w-1/3">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" />
                          </svg>
                        </div>
                        <div className="p-6 md:w-2/3">
                          <h3 className="text-xl font-semibold text-cyan-400 mb-2">Z-Transform Pole-Zero Visualization Tool</h3>
                          <p className="mb-3 text-gray-300">
                            Explore how different input sequences affect the Z-transform's pole-zero locations and understand
                            system stability with our interactive visualization tool.
                          </p>
                          <div className="flex justify-end">
                            <span className="inline-flex items-center text-cyan-400 text-sm font-medium">
                              Open Tool
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                              </svg>
                            </span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </div>
                  
                  <div className="bg-gray-800 p-4 rounded-lg mt-4">
                    <h4 className="text-lg text-cyan-400 mb-2">Understanding the Pole-Zero Plot:</h4>
                    <ul className="list-disc pl-6 space-y-2">
                      <li>The <strong>complex plane</strong> shows poles (×) and zeros (○) of the Z-transform</li>
                      <li>Poles inside the unit circle indicate a stable system</li>
                      <li>The <strong>unit circle</strong> (|z| = 1) is where the Z-transform evaluates to the DTFT</li>
                      <li>System response is heavily influenced by poles/zeros near the unit circle</li>
                      <li>The angle of poles and zeros relates to frequency response characteristics</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
            
            {/* Step 2: Z-Transform Properties */}
            {currentStep === 2 && (
              <div className="animate-fade-in">
                <h2 className="text-2xl font-bold mb-4 text-cyan-400">Z-Transform Properties</h2>
                
                <p className="mb-4">
                  Understanding Z-transform properties is essential for efficiently analyzing and manipulating discrete-time signals and systems.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="bg-gray-800 p-4 rounded-lg">
                    <h3 className="text-lg text-purple-400 mb-3">Linearity</h3>
                    <MathJax>
                      {`\\[\\mathcal{Z}\\{ax_1[n] + bx_2[n]\\} = aX_1(z) + bX_2(z)\\]`}
                    </MathJax>
                  </div>
                  
                  <div className="bg-gray-800 p-4 rounded-lg">
                    <h3 className="text-lg text-purple-400 mb-3">Time Shifting</h3>
                    <MathJax>
                      {`\\[\\mathcal{Z}\\{x[n-k]\\} = z^{-k}X(z)\\]`}
                    </MathJax>
                  </div>
                  
                  <div className="bg-gray-800 p-4 rounded-lg">
                    <h3 className="text-lg text-purple-400 mb-3">Convolution</h3>
                    <MathJax>
                      {`\\[\\mathcal{Z}\\{x_1[n] * x_2[n]\\} = X_1(z) \\cdot X_2(z)\\]`}
                    </MathJax>
                  </div>
                  
                  <div className="bg-gray-800 p-4 rounded-lg">
                    <h3 className="text-lg text-purple-400 mb-3">Differentiation</h3>
                    <MathJax>
                      {`\\[\\mathcal{Z}\\{nx[n]\\} = -z\\frac{d}{dz}X(z)\\]`}
                    </MathJax>
                  </div>
                </div>
              </div>
            )}
            
            {/* Step 3: Common Z-Transforms */}
            {currentStep === 3 && (
              <div className="animate-fade-in">
                <h2 className="text-2xl font-bold mb-4 text-cyan-400">Common Z-Transforms</h2>
                
                <p className="mb-4">
                  Familiarizing yourself with these common Z-transforms will help you recognize patterns and solve complex problems more efficiently.
                </p>
                
                <div className="overflow-x-auto mb-6">
                  <table className="min-w-full bg-gray-800 rounded-lg">
                    <thead>
                      <tr>
                        <th className="py-3 px-4 border-b border-gray-700 text-left text-purple-400">Signal x[n]</th>
                        <th className="py-3 px-4 border-b border-gray-700 text-left text-purple-400">Z-Transform X(z)</th>
                        <th className="py-3 px-4 border-b border-gray-700 text-left text-purple-400">ROC</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="py-3 px-4 border-b border-gray-700">δ[n] (unit impulse)</td>
                        <td className="py-3 px-4 border-b border-gray-700">1</td>
                        <td className="py-3 px-4 border-b border-gray-700">All z</td>
                      </tr>
                      <tr>
                        <td className="py-3 px-4 border-b border-gray-700">u[n] (unit step)</td>
                        <td className="py-3 px-4 border-b border-gray-700"><MathJax inline>{`\\frac{1}{1-z^{-1}}`}</MathJax></td>
                        <td className="py-3 px-4 border-b border-gray-700">|z| {'>'} 1</td>
                      </tr>
                      <tr>
                        <td className="py-3 px-4 border-b border-gray-700"><MathJax inline>{`a^n u[n]`}</MathJax></td>
                        <td className="py-3 px-4 border-b border-gray-700"><MathJax inline>{`\\frac{1}{1-az^{-1}}`}</MathJax></td>
                        <td className="py-3 px-4 border-b border-gray-700">|z| {'>'} |a|</td>
                      </tr>
                      <tr>
                        <td className="py-3 px-4 border-b border-gray-700"><MathJax inline>{`-a^n u[-n-1]`}</MathJax></td>
                        <td className="py-3 px-4 border-b border-gray-700"><MathJax inline>{`\\frac{1}{1-az^{-1}}`}</MathJax></td>
                        <td className="py-3 px-4 border-b border-gray-700">|z| {'<'} |a|</td>
                      </tr>
                      <tr>
                        <td className="py-3 px-4 border-b border-gray-700"><MathJax inline>{`n a^n u[n]`}</MathJax></td>
                        <td className="py-3 px-4 border-b border-gray-700"><MathJax inline>{`\\frac{az^{-1}}{(1-az^{-1})^2}`}</MathJax></td>
                        <td className="py-3 px-4 border-b border-gray-700">|z| {'>'} |a|</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            
            {/* Step 4: Interactive Z-Transform Explorer */}
            {currentStep === 4 && (
              <div className="animate-fade-in">
                <h2 className="text-2xl font-bold mb-4 text-cyan-400">Interactive Z-Transform Explorer</h2>
                
                <p className="mb-4">
                  This section provides interactive tools to explore Z-transforms, poles, zeros, and the critical concept
                  of Regions of Convergence (ROC). Through these visualizations, you'll gain intuition for how different
                  signals relate to their Z-transforms.
                </p>
                
                <div className="mb-8">
                  <h3 className="text-xl text-purple-400 mb-4">Z-Plane Visualizer</h3>
                  <p className="mb-4">
                    The Z-plane visualizer below lets you experiment with placing poles and zeros. Watch how the 
                    Region of Convergence changes based on pole locations. Double-click any pole or zero to remove it.
                  </p>
                  
                  <div className="bg-gray-800 p-4 rounded-lg mb-6">
                    <ErrorBoundary fallback={<ZTransformVisualizerFallback />}>
                      <Suspense fallback={
                        <div className="flex justify-center items-center h-80">
                          <div className="inline-block w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
                          <span className="ml-3 text-cyan-400">Loading visualizer...</span>
                        </div>
                      }>
                        {componentsLoaded && (
                          <ZTransformSciFiVisualizer 
                            width={700}
                            height={500}
                            className="mx-auto"
                          />
                        )}
                      </Suspense>
                    </ErrorBoundary>
                  </div>
                  
                  <div className="bg-purple-900 bg-opacity-30 p-4 rounded-lg border border-purple-500 mb-6">
                    <h4 className="text-lg text-cyan-400 mb-2">Z-Plane Insights:</h4>
                    <ul className="list-disc pl-6 space-y-2">
                      <li>The <strong>unit circle</strong> (|z| = 1) is where the Z-transform evaluates to the DTFT.</li>
                      <li>For <strong>causal signals</strong>, the ROC extends outward from the outermost pole.</li>
                      <li>For <strong>anti-causal signals</strong>, the ROC extends inward from the innermost pole.</li>
                      <li>For <strong>two-sided signals</strong>, the ROC is a ring between poles.</li>
                      <li>A system is <strong>stable</strong> if and only if its ROC includes the unit circle.</li>
                      <li>The Z-transform is only uniquely invertible when the ROC is specified.</li>
                    </ul>
                  </div>
                </div>
                
                <div className="mb-6">
                  <h3 className="text-xl text-purple-400 mb-4">Signal Comparison Tool</h3>
                  <p className="mb-4">
                    The comparison tool below demonstrates one of the most confusing aspects of Z-transforms: two
                    entirely different signals can have the same Z-transform expression, differing only in their ROC.
                  </p>
                  
                  <div className="bg-gray-800 p-4 rounded-lg mb-6">
                    <ErrorBoundary fallback={<SignalComparisonFallback />}>
                      <Suspense fallback={
                        <div className="flex justify-center items-center h-80">
                          <div className="inline-block w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
                          <span className="ml-3 text-cyan-400">Loading comparison tool...</span>
                        </div>
                      }>
                        {componentsLoaded && <SignalComparisonTool />}
                      </Suspense>
                    </ErrorBoundary>
                  </div>
                  
                  <div className="bg-gray-800 p-4 rounded-lg">
                    <h4 className="text-lg text-cyan-400 mb-2">Key Takeaways:</h4>
                    <ol className="list-decimal pl-6 space-y-2">
                      <li>The Z-transform expression <strong>alone is not enough</strong> to uniquely determine a signal.</li>
                      <li>Both the Z-transform <strong>and</strong> its ROC are required for uniqueness.</li>
                      <li>This is why problems asking for the inverse Z-transform always specify the ROC.</li>
                      <li>The ROC tells us important properties about the signal: causality, stability, etc.</li>
                    </ol>
                  </div>
                </div>
                
                {/* Check Your Understanding Section */}
                <div className="mt-8 bg-gray-800 p-5 rounded-lg border border-purple-800">
                  <h3 className="text-xl text-cyan-400 mb-4">Check Your Understanding</h3>
                  
                  <div className="mb-6">
                    <h4 className="text-lg text-purple-400 mb-2">Quiz 4.1</h4>
                    <p className="mb-3">
                      If X(z) = z/(z-0.75) with ROC |z| {'<'} 0.75, which of the following is true about the signal x[n]?
                    </p>
                    
                    <div className="space-y-2">
                      <div 
                        className={`p-3 rounded cursor-pointer ${
                          quizAnswers['quiz4.1'] === 'A' 
                            ? quizResults['quiz4.1'] === true 
                              ? 'bg-green-800 border border-green-400' 
                              : 'bg-red-800 border border-red-400'
                            : 'bg-gray-700 hover:bg-gray-600'
                        }`}
                        onClick={() => handleQuizAnswer('quiz4.1', 'A')}
                      >
                        A. x[n] is a causal signal
                      </div>
                      
                      <div 
                        className={`p-3 rounded cursor-pointer ${
                          quizAnswers['quiz4.1'] === 'B' 
                            ? quizResults['quiz4.1'] === true 
                              ? 'bg-green-800 border border-green-400' 
                              : 'bg-red-800 border border-red-400'
                            : 'bg-gray-700 hover:bg-gray-600'
                        }`}
                        onClick={() => handleQuizAnswer('quiz4.1', 'B')}
                      >
                        B. x[n] is an anti-causal signal
                      </div>
                      
                      <div 
                        className={`p-3 rounded cursor-pointer ${
                          quizAnswers['quiz4.1'] === 'C' 
                            ? quizResults['quiz4.1'] === true 
                              ? 'bg-green-800 border border-green-400' 
                              : 'bg-red-800 border border-red-400'
                            : 'bg-gray-700 hover:bg-gray-600'
                        }`}
                        onClick={() => handleQuizAnswer('quiz4.1', 'C')}
                      >
                        C. x[n] is a two-sided signal
                      </div>
                      
                      <div 
                        className={`p-3 rounded cursor-pointer ${
                          quizAnswers['quiz4.1'] === 'D' 
                            ? quizResults['quiz4.1'] === true 
                              ? 'bg-green-800 border border-green-400' 
                              : 'bg-red-800 border border-red-400'
                            : 'bg-gray-700 hover:bg-gray-600'
                        }`}
                        onClick={() => handleQuizAnswer('quiz4.1', 'D')}
                      >
                        D. x[n] is a stable signal
                      </div>
                    </div>
                    
                    <div className="mt-4 flex justify-end">
                      <button 
                        className="px-4 py-2 bg-purple-600 rounded text-white"
                        onClick={() => checkQuizAnswer('quiz4.1', 'B')}
                      >
                        Check Answer
                      </button>
                    </div>
                    
                    {quizAnswers['quiz4.1'] && !quizResults['quiz4.1'] && (
                      <div className="mt-3 text-red-400">
                        Incorrect. Think about what ROC |z| {'<'} 0.75 means for the signal type.
                      </div>
                    )}
                    
                    {quizResults['quiz4.1'] && (
                      <div className="mt-3 text-green-400">
                        Correct! When the ROC is |z| {'<'} a (inside a circle), the signal is anti-causal, 
                        meaning it's only non-zero for n ≤ -1. The signal would be x[n] = -0.75ⁿu[-n-1].
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-6">
                    <h4 className="text-lg text-purple-400 mb-2">Practice Problem 4.1</h4>
                    <p className="mb-3">
                      For the rational Z-transform X(z) = (z - 0.5)/(z² - 0.25), find:
                    </p>
                    <ol className="list-decimal pl-6 mb-3">
                      <li>All possible ROCs</li>
                      <li>For each ROC, determine if the signal is causal, anti-causal, or two-sided</li>
                      <li>Which ROC(s) correspond to stable signals?</li>
                    </ol>
                    
                    <div className="mt-4 flex justify-end">
                      <button 
                        className="px-4 py-2 bg-cyan-600 rounded text-white"
                        onClick={() => toggleSolution('problem4.1')}
                      >
                        {showSolution['problem4.1'] ? 'Hide Solution' : 'Show Solution'}
                      </button>
                    </div>
                    
                    {showSolution['problem4.1'] && (
                      <div className="mt-4 bg-gray-700 p-4 rounded">
                        <h5 className="text-cyan-400 mb-2">Solution:</h5>
                        
                        <p className="font-semibold mb-2">Part 1: Find the poles and possible ROCs</p>
                        <p className="mb-2">
                          First, factor the denominator: z² - 0.25 = (z - 0.5)(z + 0.5)
                        </p>
                        <p className="mb-3">
                          So X(z) = (z - 0.5)/((z - 0.5)(z + 0.5)) = 1/(z + 0.5)
                        </p>
                        <p className="mb-3">
                          We have a pole at z = -0.5. The possible ROCs are:
                        </p>
                        <ul className="list-disc pl-6 mb-4">
                          <li>ROC₁: |z| {'<'} 0.5</li>
                          <li>ROC₂: |z| {'>'} 0.5</li>
                        </ul>
                        
                        <p className="font-semibold mb-2">Part 2: Signal types for each ROC</p>
                        <ul className="list-disc pl-6 mb-4">
                          <li>ROC₁: |z| {'<'} 0.5 → Anti-causal signal</li>
                          <li>ROC₂: |z| {'>'} 0.5 → Causal signal</li>
                        </ul>
                        
                        <p className="font-semibold mb-2">Part 3: Stability analysis</p>
                        <p className="mb-3">
                          A signal is stable if its ROC includes the unit circle |z| = 1.
                        </p>
                        <ul className="list-disc pl-6 mb-4">
                          <li>ROC₁: |z| {'<'} 0.5 → Does NOT include |z| = 1, so NOT stable</li>
                          <li>ROC₂: |z| {'>'} 0.5 → Includes |z| = 1, so STABLE</li>
                        </ul>
                        
                        <p className="mt-2"><strong>Time-domain expressions:</strong></p>
                        <ul className="list-disc pl-6">
                          <li>For ROC₁: x[n] = -(-0.5)ⁿu[-n-1] = -(−1)ⁿ(0.5)ⁿu[-n-1]</li>
                          <li>For ROC₂: x[n] = -(-0.5)ⁿu[n-1] = -(−1)ⁿ(0.5)ⁿu[n-1]</li>
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            {/* Step 5: Inverse Z-Transform */}
            {currentStep === 5 && (
              <div className="animate-fade-in">
                <h2 className="text-2xl font-bold mb-4 text-cyan-400">Inverse Z-Transform</h2>
                
                <p className="mb-4">
                  The inverse Z-transform converts a Z-domain representation back to the discrete-time domain. Understanding
                  inverse Z-transforms is crucial for applications in filter design and system analysis.
                </p>
                
                <div className="bg-gray-800 p-4 rounded-lg mb-6">
                  <h3 className="text-xl text-purple-400 mb-3">Definition of the Inverse Z-Transform</h3>
                  
                  <p className="mb-3">
                    The inverse Z-transform is defined by the contour integral:
                  </p>
                  
                  <div className="flex justify-center my-4">
                    <MathJax>
                      {`\\[x[n] = \\frac{1}{2\\pi j}\\oint_C X(z)z^{n-1}dz\\]`}
                    </MathJax>
                  </div>
                  
                  <p className="mb-3">
                    Where C is a counterclockwise contour that lies within the ROC and encircles the origin.
                  </p>
                </div>
                
                <div className="bg-gray-800 p-4 rounded-lg mb-6">
                  <h3 className="text-xl text-purple-400 mb-3">Common Methods for Finding Inverse Z-Transforms</h3>
                  
                  <ol className="list-decimal pl-6 space-y-3">
                    <li>
                      <h4 className="text-cyan-400">Partial Fraction Expansion</h4>
                      <p>Break down complex rational functions into simpler terms that can be easily inverted.</p>
                    </li>
                    <li>
                      <h4 className="text-cyan-400">Power Series Expansion</h4>
                      <p>Expand X(z) as a power series and identify coefficients as time-domain samples.</p>
                    </li>
                    <li>
                      <h4 className="text-cyan-400">Contour Integration</h4>
                      <p>Use complex integration techniques to evaluate the inverse Z-transform integral.</p>
                    </li>
                    <li>
                      <h4 className="text-cyan-400">Z-Transform Pairs</h4>
                      <p>Use a lookup table of common Z-transform pairs and properties.</p>
                    </li>
                  </ol>
                </div>
              </div>
            )}
            
            {/* Step 6: Z-Transform Applications */}
            {currentStep === 6 && (
              <div className="animate-fade-in">
                <h2 className="text-2xl font-bold mb-4 text-cyan-400">Z-Transform Applications</h2>
                
                <p className="mb-4">
                  The Z-transform finds extensive applications in various fields of engineering and science. Here are some key applications:
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="bg-gray-800 p-4 rounded-lg">
                    <h3 className="text-xl text-purple-400 mb-3">Digital Filter Design</h3>
                    <p className="mb-3">
                      Z-transforms allow engineers to design and analyze digital filters by manipulating transfer functions.
                    </p>
                    <ul className="list-disc pl-6">
                      <li>Design FIR and IIR filters</li>
                      <li>Analyze filter stability using pole locations</li>
                      <li>Convert between frequency and time domain specifications</li>
                    </ul>
                  </div>
                  
                  <div className="bg-gray-800 p-4 rounded-lg">
                    <h3 className="text-xl text-purple-400 mb-3">Control Systems</h3>
                    <p className="mb-3">
                      Z-transforms help analyze discrete-time control systems through their transfer functions.
                    </p>
                    <ul className="list-disc pl-6">
                      <li>Model digital controllers</li>
                      <li>Analyze system stability</li>
                      <li>Design compensators</li>
                    </ul>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="bg-gray-800 p-4 rounded-lg">
                    <h3 className="text-xl text-purple-400 mb-3">Signal Processing</h3>
                    <p className="mb-3">
                      Z-transforms are fundamental to understanding and implementing digital signal processing algorithms.
                    </p>
                    <ul className="list-disc pl-6">
                      <li>Analyze signal properties</li>
                      <li>Implement efficient convolution</li>
                      <li>Design spectral estimation techniques</li>
                    </ul>
                  </div>
                  
                  <div className="bg-gray-800 p-4 rounded-lg">
                    <h3 className="text-xl text-purple-400 mb-3">Communications Systems</h3>
                    <p className="mb-3">
                      Z-transforms help in designing and analyzing digital communication systems.
                    </p>
                    <ul className="list-disc pl-6">
                      <li>Model channel characteristics</li>
                      <li>Design equalizers</li>
                      <li>Analyze modulation schemes</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
            
            {/* Step 7: Advanced Z-Transform Topics */}
            {currentStep === 7 && (
              <div className="animate-fade-in">
                <h2 className="text-2xl font-bold mb-4 text-cyan-400">Advanced Z-Transform Topics</h2>
                
                <p className="mb-4">
                  This section explores advanced concepts related to Z-transforms that are essential for tackling complex signal processing problems.
                </p>
                
                <div className="bg-gray-800 p-4 rounded-lg mb-6">
                  <h3 className="text-xl text-purple-400 mb-3">Multi-Dimensional Z-Transforms</h3>
                  
                  <p className="mb-3">
                    For multi-dimensional signals x[n₁, n₂, ..., nₖ], the Z-transform extends to multiple complex variables:
                  </p>
                  
                  <div className="flex justify-center my-4">
                    <MathJax>
                      {`\\[X(z_1, z_2, ..., z_k) = \\sum_{n_1=-\\infty}^{\\infty}\\sum_{n_2=-\\infty}^{\\infty}...\\sum_{n_k=-\\infty}^{\\infty} x[n_1, n_2, ..., n_k]z_1^{-n_1}z_2^{-n_2}...z_k^{-n_k}\\]`}
                    </MathJax>
                  </div>
                  
                  <p className="mb-3">
                    Multi-dimensional Z-transforms are particularly useful in image and video processing.
                  </p>
                </div>
                
                <div className="bg-gray-800 p-4 rounded-lg mb-6">
                  <h3 className="text-xl text-purple-400 mb-3">Relationship to Other Transforms</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-700 p-3 rounded">
                      <h4 className="text-cyan-400 mb-2">Discrete-Time Fourier Transform (DTFT)</h4>
                      <p>
                        The DTFT is a special case of the Z-transform evaluated on the unit circle, where z = e^jω.
                      </p>
                    </div>
                    
                    <div className="bg-gray-700 p-3 rounded">
                      <h4 className="text-cyan-400 mb-2">Laplace Transform</h4>
                      <p>
                        The Z-transform is related to the Laplace transform through the mapping z = e^sT, where T is the sampling period.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-purple-900 bg-opacity-30 p-4 rounded-lg border border-purple-500 mb-6">
                  <h4 className="text-lg text-cyan-400 mb-2">Final Thoughts:</h4>
                  <p className="mb-3">
                    The Z-transform is a powerful mathematical tool that forms the foundation of modern digital signal processing. As you continue
                    your journey, you'll discover even more applications and nuances of this remarkable transform.
                  </p>
                  <p>
                    Consider exploring related topics such as filter design techniques, adaptive filtering, multirate signal processing, and
                    spectral estimation to deepen your understanding of how Z-transforms are applied in practical engineering problems.
                  </p>
                </div>
              </div>
            )}
          
          </MathJaxContext>
        </div>
        
        {/* Navigation buttons (bottom) */}
        <div className="flex justify-between mb-12">
          <button 
            className="px-4 py-2 bg-gray-800 text-white rounded flex items-center disabled:opacity-50"
            onClick={handlePreviousStep}
            disabled={currentStep === 1}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Previous
          </button>
          
          <button 
            className="px-4 py-2 bg-cyan-600 text-white rounded flex items-center disabled:opacity-50"
            onClick={handleNextStep}
            disabled={currentStep === totalSteps}
          >
            Next
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}