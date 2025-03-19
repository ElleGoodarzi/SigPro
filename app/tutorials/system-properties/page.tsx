'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Tab } from '@headlessui/react';
import ErrorBoundary from '../../components/ErrorBoundary';
import { useAppState } from '../../context/AppStateContext';

export default function SystemPropertiesTutorial() {
  const { isDarkMode } = useAppState();
  const [activeExample, setActiveExample] = useState('linear');
  
  const handleExampleChange = (id: string) => {
    setActiveExample(id);
  };

  return (
    <ErrorBoundary>
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row justify-between items-start mb-6">
          <div>
            <div className="text-sm breadcrumbs mb-2">
              <ul>
                <li><Link href="/">Home</Link></li>
                <li><Link href="/tutorials">Tutorials</Link></li>
                <li>System Properties</li>
              </ul>
            </div>
            <h1 className="text-4xl font-bold mb-2">System Properties in Signals & Systems</h1>
            <div className="flex flex-wrap gap-2 mb-4">
              <div className="badge badge-outline">Intermediate</div>
              <div className="badge badge-outline">30 minutes</div>
              <div className="badge badge-primary badge-outline">Signals</div>
              <div className="badge badge-primary badge-outline">Systems</div>
              <div className="badge badge-primary badge-outline">Properties</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar/Table of Contents */}
          <div className="lg:col-span-1">
            <div className="sticky top-4">
              <div className="bg-base-200 p-4 rounded-lg">
                <h3 className="text-lg font-bold mb-3">Contents</h3>
                <ul className="menu menu-compact">
                  <li><a href="#what-is-system">1. What is a System?</a></li>
                  <li><a href="#key-properties">2. Key Properties</a>
                    <ul className="pl-4">
                      <li><a href="#linearity">2.1 Linearity</a></li>
                      <li><a href="#stability">2.2 BIBO Stability</a></li>
                      <li><a href="#invertibility">2.3 Invertibility</a></li>
                    </ul>
                  </li>
                  <li><a href="#case-study">3. Case Study</a></li>
                  <li><a href="#practice">4. Practice Problem</a></li>
                  <li><a href="#recap">5. Recap</a></li>
                </ul>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="prose max-w-none">
              {/* Section 1: What is a System? */}
              <section id="what-is-system" className="mb-12">
                <div className="card bg-base-200 p-6 mb-8">
                  <h2 className="text-2xl font-bold mb-4">1. What is a System?</h2>
                  
                  <div className="mb-6">
                    <h3 className="text-xl font-semibold mb-2">Definition</h3>
                    <p>
                      A <em>system</em> (T) is a <strong>black box</strong> that takes an input signal x[k] 
                      and transforms it into an output signal y[k]:
                    </p>
                    <div className="bg-base-100 p-4 rounded-lg my-4 text-center">
                      y[k] = T{'{x[k]}'}
                    </div>
                  </div>
                  
                  <div className="mb-6">
                    <h3 className="text-xl font-semibold mb-2">Examples</h3>
                    <ul className="list-disc pl-6 mb-4">
                      <li><strong>Audio amplifier:</strong> y[k] = 2x[k] (linear)</li>
                      <li><strong>Rectifier:</strong> y[k] = |x[k]| (nonlinear)</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Visualization</h3>
                    <div className="bg-base-100 p-6 rounded-lg flex items-center justify-center">
                      <div className="flex items-center space-x-4">
                        <div>Input x[k]</div>
                        <div className="arrow">→</div>
                        <div className="border-2 border-primary px-6 py-3 rounded">T</div>
                        <div className="arrow">→</div>
                        <div>Output y[k]</div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Section 2: Key System Properties */}
              <section id="key-properties" className="mb-12">
                <div className="card bg-base-200 p-6 mb-8">
                  <h2 className="text-2xl font-bold mb-4">2. Key System Properties</h2>
                  <p className="mb-6">
                    We analyze systems using three critical properties: <strong>linearity</strong>, 
                    <strong> BIBO stability</strong>, and <strong>invertibility</strong>. Let's dissect each.
                  </p>
                </div>

                {/* Linearity */}
                <div id="linearity" className="card bg-base-100 p-6 mb-8 border-l-4 border-primary">
                  <h3 className="text-xl font-bold mb-4">Property 1: Linearity</h3>
                  
                  <div className="mb-6">
                    <h4 className="text-lg font-semibold mb-2">Definition</h4>
                    <p>A system is <em>linear</em> if it satisfies <strong>superposition</strong>:</p>
                    <ol className="list-decimal pl-6 mb-4">
                      <li><strong>Additivity:</strong> T{'{x₁[k] + x₂[k]}'} = T{'{x₁[k]}'} + T{'{x₂[k]}'}</li>
                      <li><strong>Homogeneity:</strong> T{'{a·x[k]}'} = a·T{'{x[k]}'}, for any scalar a</li>
                    </ol>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div className="card bg-success/10 p-4 rounded-lg">
                      <h4 className="font-semibold mb-2">Example (Linear System)</h4>
                      <p>y[k] = 3x[k]</p>
                      <p className="mt-2"><strong>Proof:</strong></p>
                      <p>T{'{ax₁[k] + bx₂[k]}'} = 3(ax₁[k] + bx₂[k]) = a·3x₁[k] + b·3x₂[k]</p>
                    </div>
                    
                    <div className="card bg-error/10 p-4 rounded-lg">
                      <h4 className="font-semibold mb-2">Example (Nonlinear System)</h4>
                      <p>y[k] = x²[k]</p>
                      <p className="mt-2"><strong>Counterexample:</strong></p>
                      <p>Let x₁[k] = 1, x₂[k] = 1</p>
                      <p>T{'{x₁ + x₂}'} = (1+1)² = 4, but</p>
                      <p>T{'{x₁}'} + T{'{x₂}'} = 1 + 1 = 2 ≠ 4</p>
                    </div>
                  </div>
                  
                  <div className="bg-base-200 p-4 rounded-lg">
                    <h4 className="font-semibold mb-2">Why Care?</h4>
                    <p>Linear systems are predictable and easier to analyze. Nonlinear systems (like chaos) are wilder.</p>
                  </div>
                </div>

                {/* BIBO Stability */}
                <div id="stability" className="card bg-base-100 p-6 mb-8 border-l-4 border-secondary">
                  <h3 className="text-xl font-bold mb-4">Property 2: BIBO Stability</h3>
                  
                  <div className="mb-6">
                    <h4 className="text-lg font-semibold mb-2">Definition</h4>
                    <p>
                      A system is <em>BIBO stable</em> if <strong>every bounded input</strong> |x[k]| ≤ M 
                      produces a <strong>bounded output</strong> |y[k]| ≤ N.
                    </p>
                  </div>
                  
                  <div className="mb-6">
                    <h4 className="text-lg font-semibold mb-2">Test Method</h4>
                    <p>Assume |x[k]| ≤ M. Show |y[k]| ≤ N using algebraic manipulation.</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div className="card bg-success/10 p-4 rounded-lg">
                      <h4 className="font-semibold mb-2">Example (Stable System)</h4>
                      <p>y[k] = 0.5x[k]</p>
                      <p className="mt-2"><strong>Proof:</strong></p>
                      <p>|y[k]| = 0.5|x[k]| ≤ 0.5M</p>
                    </div>
                    
                    <div className="card bg-error/10 p-4 rounded-lg">
                      <h4 className="font-semibold mb-2">Example (Unstable System)</h4>
                      <p>y[k] = eˣ⁽ᵏ⁾</p>
                      <p className="mt-2"><strong>Counterexample:</strong></p>
                      <p>If x[k] = k, y[k] grows exponentially (unbounded)</p>
                    </div>
                  </div>
                  
                  <div className="bg-base-200 p-4 rounded-lg">
                    <h4 className="font-semibold mb-2">Why Care?</h4>
                    <p>Stable systems won't blow up your speakers (or your lab equipment).</p>
                  </div>
                </div>

                {/* Invertibility */}
                <div id="invertibility" className="card bg-base-100 p-6 mb-8 border-l-4 border-accent">
                  <h3 className="text-xl font-bold mb-4">Property 3: Invertibility</h3>
                  
                  <div className="mb-6">
                    <h4 className="text-lg font-semibold mb-2">Definition</h4>
                    <p>
                      A system is <em>invertible</em> if distinct inputs x₁ ≠ x₂ produce distinct outputs y₁ ≠ y₂.
                    </p>
                  </div>
                  
                  <div className="mb-6">
                    <h4 className="text-lg font-semibold mb-2">Test Method</h4>
                    <p>Find <strong>at least two different inputs</strong> that produce the <strong>same output</strong>.</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div className="card bg-success/10 p-4 rounded-lg">
                      <h4 className="font-semibold mb-2">Example (Invertible)</h4>
                      <p>y[k] = x[k] + 5</p>
                      <p className="mt-2"><strong>Inverse:</strong></p>
                      <p>x[k] = y[k] - 5</p>
                    </div>
                    
                    <div className="card bg-error/10 p-4 rounded-lg">
                      <h4 className="font-semibold mb-2">Example (Non-Invertible)</h4>
                      <p>y[k] = |x[k]|</p>
                      <p className="mt-2"><strong>Counterexample:</strong></p>
                      <p>x₁[k] = 1, x₂[k] = -1 both give y[k] = 1</p>
                    </div>
                  </div>
                  
                  <div className="bg-base-200 p-4 rounded-lg">
                    <h4 className="font-semibold mb-2">Why Care?</h4>
                    <p>Invertible systems let you recover original signals (e.g., decryption).</p>
                  </div>
                </div>
              </section>

              {/* Section 3: Case Study */}
              <section id="case-study" className="mb-12">
                <div className="card bg-base-200 p-6 mb-8">
                  <h2 className="text-2xl font-bold mb-4">3. Case Study: The System y[k] = √|x[k]|</h2>
                  
                  <div className="mb-8">
                    <Tab.Group>
                      <Tab.List className="tabs tabs-boxed mb-4">
                        <Tab className={({ selected }) => 
                          selected ? 'tab tab-active' : 'tab'
                        }>
                          Linearity
                        </Tab>
                        <Tab className={({ selected }) => 
                          selected ? 'tab tab-active' : 'tab'
                        }>
                          BIBO Stability
                        </Tab>
                        <Tab className={({ selected }) => 
                          selected ? 'tab tab-active' : 'tab'
                        }>
                          Invertibility
                        </Tab>
                      </Tab.List>
                      
                      <Tab.Panels className="p-6 bg-base-100 rounded-lg">
                        <Tab.Panel>
                          <h3 className="text-lg font-bold mb-3">Question 1a: Is This System Linear?</h3>
                          
                          <div className="mb-4">
                            <h4 className="font-semibold">Step 1: Test Additivity</h4>
                            <p className="my-2">Let x₁[k] = 1, x₂[k] = 1:</p>
                            <div className="bg-base-200 p-3 rounded">
                              T{'{x₁ + x₂}'} = √|1 + 1| = √2
                              <br />
                              vs.
                              <br />
                              T{'{x₁}'} + T{'{x₂}'} = √1 + √1 = 2
                            </div>
                            <p className="mt-2">Since √2 ≠ 2, <strong>additivity fails</strong>.</p>
                          </div>
                          
                          <div className="mb-4">
                            <h4 className="font-semibold">Step 2: Test Homogeneity</h4>
                            <p className="my-2">Let a = 4, x[k] = 1:</p>
                            <div className="bg-base-200 p-3 rounded">
                              T{'{4·1}'} = √|4| = 2
                              <br />
                              vs.
                              <br />
                              4·T{'{1}'} = 4·1 = 4
                            </div>
                            <p className="mt-2">Since 2 ≠ 4, <strong>homogeneity fails</strong>.</p>
                          </div>
                          
                          <div className="alert alert-error">
                            <div>
                              <span className="font-bold">Conclusion:</span> The system is <strong>nonlinear</strong>.
                            </div>
                          </div>
                        </Tab.Panel>
                        
                        <Tab.Panel>
                          <h3 className="text-lg font-bold mb-3">Question 1b: Is This System BIBO Stable?</h3>
                          
                          <div className="mb-4">
                            <h4 className="font-semibold">Step 1: Assume Bounded Input</h4>
                            <p>Let |x[k]| ≤ M.</p>
                          </div>
                          
                          <div className="mb-4">
                            <h4 className="font-semibold">Step 2: Compute Output Bound</h4>
                            <div className="bg-base-200 p-3 rounded">
                              |y[k]| = √|x[k]| ≤ √M
                            </div>
                            <p className="mt-2">Since √M is finite for finite M, <strong>output is bounded</strong>.</p>
                          </div>
                          
                          <div className="alert alert-success">
                            <div>
                              <span className="font-bold">Conclusion:</span> The system is <strong>BIBO stable</strong>.
                            </div>
                          </div>
                        </Tab.Panel>
                        
                        <Tab.Panel>
                          <h3 className="text-lg font-bold mb-3">Question 1c: Is This System Invertible?</h3>
                          
                          <div className="mb-4">
                            <h4 className="font-semibold">Step 1: Find Collisions</h4>
                            <p className="my-2">Let x₁[k] = 4, x₂[k] = -4:</p>
                            <div className="bg-base-200 p-3 rounded">
                              T{'{4}'} = √|4| = 2
                              <br />
                              and
                              <br />
                              T{'{-4}'} = √|-4| = √4 = 2
                            </div>
                            <p className="mt-2">Two distinct inputs x₁ ≠ x₂ produce the <strong>same output</strong>.</p>
                          </div>
                          
                          <div className="alert alert-error">
                            <div>
                              <span className="font-bold">Conclusion:</span> The system is <strong>not invertible</strong>.
                            </div>
                          </div>
                        </Tab.Panel>
                      </Tab.Panels>
                    </Tab.Group>
                  </div>
                </div>
              </section>

              {/* Section 4: Practice Problem */}
              <section id="practice" className="mb-12">
                <div className="card bg-base-200 p-6 mb-8">
                  <h2 className="text-2xl font-bold mb-4">4. Practice Problem</h2>
                  
                  <div className="mb-6">
                    <p className="text-lg font-bold">System: y[k] = ln(1 + |x[k]|)</p>
                  </div>
                  
                  <div className="mb-6">
                    <div className="collapse collapse-plus bg-base-100">
                      <input type="checkbox" /> 
                      <div className="collapse-title font-medium">
                        1. Is this system linear?
                      </div>
                      <div className="collapse-content bg-base-200"> 
                        <p><strong>Answer:</strong> Nonlinear (logarithm is nonlinear)</p>
                        <p className="mt-2">
                          <strong>Explanation:</strong> We can test with simple values:
                          <br />
                          Let x₁ = 1, x₂ = 1
                          <br />
                          T{'{x₁ + x₂}'} = ln(1 + |1 + 1|) = ln(3)
                          <br />
                          T{'{x₁}'} + T{'{x₂}'} = ln(2) + ln(2) = 2ln(2)
                          <br />
                          Since ln(3) ≠ 2ln(2), the system is nonlinear.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mb-6">
                    <div className="collapse collapse-plus bg-base-100">
                      <input type="checkbox" /> 
                      <div className="collapse-title font-medium">
                        2. Is this system BIBO stable?
                      </div>
                      <div className="collapse-content bg-base-200"> 
                        <p><strong>Answer:</strong> Stable (since ln(1 + M) is bounded for bounded M)</p>
                        <p className="mt-2">
                          <strong>Explanation:</strong> If |x[k]| ≤ M, then |y[k]| = ln(1 + |x[k]|) ≤ ln(1 + M), which is a finite value.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mb-6">
                    <div className="collapse collapse-plus bg-base-100">
                      <input type="checkbox" /> 
                      <div className="collapse-title font-medium">
                        3. Is this system invertible?
                      </div>
                      <div className="collapse-content bg-base-200"> 
                        <p><strong>Answer:</strong> Non-invertible</p>
                        <p className="mt-2">
                          <strong>Explanation:</strong> Both x = 1 and x = -1 give the same output:
                          <br />
                          T{'{1}'} = ln(1 + |1|) = ln(2)
                          <br />
                          T{'{-1}'} = ln(1 + |-1|) = ln(2)
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Section 5: Recap */}
              <section id="recap" className="mb-12">
                <div className="card bg-base-200 p-6">
                  <h2 className="text-2xl font-bold mb-4">5. Recap Cheat Sheet</h2>
                  
                  <div className="overflow-x-auto">
                    <table className="table table-zebra w-full">
                      <thead>
                        <tr>
                          <th>Property</th>
                          <th>Test</th>
                          <th>Key Insight</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="font-bold">Linearity</td>
                          <td>Check T{'{ax₁ + bx₂}'}</td>
                          <td>Nonlinear if sqrt, log, or powers exist.</td>
                        </tr>
                        <tr>
                          <td className="font-bold">BIBO Stability</td>
                          <td>Assume |x| ≤ M, bound |y|.</td>
                          <td>Stability depends on growth rate.</td>
                        </tr>
                        <tr>
                          <td className="font-bold">Invertibility</td>
                          <td>Find x₁ ≠ x₂ with y₁ = y₂</td>
                          <td>Absolute value or even functions fail.</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  
                  <div className="alert alert-info mt-6">
                    <div>
                      <h3 className="font-bold mb-2">Lab Gear-Up</h3>
                      <ul className="list-disc pl-6">
                        <li>For nonlinear systems, expect chaos.</li>
                        <li>Stability? Check if outputs stay in check.</li>
                        <li>Invertible? Think "unique fingerprint" for inputs.</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </section>

              <div className="mt-12 flex justify-between">
                <Link href="/tutorials" className="btn btn-outline">
                  ← Back to Tutorials
                </Link>
                <Link href="/simulator" className="btn btn-primary">
                  Practice in Simulator →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
} 