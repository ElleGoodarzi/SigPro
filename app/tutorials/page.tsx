'use client';

import Link from 'next/link';
import { useAppState } from '../context/AppStateContext';
import ErrorBoundary from '../components/ErrorBoundary';

export default function TutorialsPage() {
  const { isDarkMode } = useAppState();

  const tutorials = [
    {
      id: 'system-properties',
      title: 'System Properties in Signals & Systems',
      description: 'Learn about key system properties: linearity, BIBO stability, and invertibility.',
      difficulty: 'Intermediate',
      duration: '30 minutes',
      tags: ['Signals', 'Systems', 'Properties'],
    },
    {
      id: 'getting-started',
      title: 'Getting Started with Signal Processing',
      description: 'Introduction to basic concepts and tools in signal processing.',
      difficulty: 'Beginner',
      duration: '20 minutes',
      tags: ['Basics', 'Introduction'],
    },
    {
      id: 'coming-soon',
      title: 'Fourier Transform Fundamentals',
      description: 'Coming soon: Deep dive into Fourier transforms and their applications.',
      difficulty: 'Advanced',
      duration: '45 minutes',
      tags: ['Fourier', 'Frequency Domain'],
      comingSoon: true,
    },
  ];

  return (
    <ErrorBoundary>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Signal Processing Tutorials</h1>
        
        <div className="mb-8">
          <p className="text-lg">
            Explore our collection of tutorials to deepen your understanding of signal processing concepts.
            Each tutorial provides theoretical foundations paired with practical examples.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tutorials.map((tutorial) => (
            <div key={tutorial.id} className="card bg-base-200 shadow-lg hover:shadow-xl transition-shadow">
              <div className="card-body">
                <h2 className="card-title">
                  {tutorial.title}
                  {tutorial.comingSoon && (
                    <div className="badge badge-secondary">Coming Soon</div>
                  )}
                </h2>
                <p>{tutorial.description}</p>
                
                <div className="flex flex-wrap gap-2 mt-3">
                  <div className="badge badge-outline">{tutorial.difficulty}</div>
                  <div className="badge badge-outline">{tutorial.duration}</div>
                  {tutorial.tags.map((tag) => (
                    <div key={tag} className="badge badge-primary badge-outline">{tag}</div>
                  ))}
                </div>
                
                <div className="card-actions justify-end mt-4">
                  {tutorial.comingSoon ? (
                    <button className="btn btn-disabled" disabled>
                      Coming Soon
                    </button>
                  ) : (
                    <Link href={`/tutorials/${tutorial.id}`} className="btn btn-primary">
                      Start Tutorial
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-12 p-6 bg-base-200 rounded-lg">
          <h2 className="text-xl font-bold mb-4">Want to suggest a tutorial?</h2>
          <p className="mb-4">
            We're continuously adding new tutorials. If you have a specific topic you'd like to see covered,
            let us know by submitting a tutorial request.
          </p>
          <button className="btn btn-outline">Request Tutorial</button>
        </div>
      </div>
    </ErrorBoundary>
  );
} 