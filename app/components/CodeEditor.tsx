'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

// Simple loading component
const Loading = () => (
  <div className="flex items-center justify-center h-full bg-base-300">
    <div className="flex flex-col items-center">
      <div className="loading loading-spinner loading-lg text-primary"></div>
      <p className="mt-2">Loading editor...</p>
    </div>
  </div>
);

// Dynamically import with better error handling
const MonacoEditorNoSSR = dynamic(
  () => import('@monaco-editor/react')
    .then(mod => mod.default)
    .catch(err => {
      console.error('Failed to load Monaco Editor:', err);
      // Return a fallback component if Monaco fails to load
      return () => (
        <div className="flex items-center justify-center h-full bg-base-300 text-center p-4">
          <div>
            <p className="text-error mb-2">Editor failed to load</p>
            <p>Please refresh the page to try again.</p>
          </div>
        </div>
      );
    }),
  { 
    ssr: false,
    loading: () => <Loading /> 
  }
);

interface CodeEditorProps {
  value: string;
  onChange: (value: string | undefined) => void;
  language?: string;
  height?: string;
  theme?: string;
  fontSize?: number;
}

export default function CodeEditor({
  value,
  onChange,
  language = 'matlab',
  height = '100%',
  theme = 'vs-dark',
  fontSize = 16,
}: CodeEditorProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Only render Monaco on client and after mounted
  if (!mounted) return <Loading />;

  return (
    <div className="code-editor-container relative">
      <MonacoEditorNoSSR
        height={height}
        language={language}
        value={value}
        onChange={onChange}
        options={{
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          fontSize: fontSize,
          wordWrap: 'on',
          tabSize: 2,
          formatOnPaste: true,
          automaticLayout: true,
        }}
        theme={theme}
        onMount={(editor, monaco) => {
          // Monaco is ready
          editor.focus();
        }}
      />
    </div>
  );
} 