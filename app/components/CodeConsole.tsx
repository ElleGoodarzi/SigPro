'use client';

import { useEffect, useRef } from 'react';

interface CodeConsoleProps {
  messages: string[];
  isProcessing?: boolean;
  maxHeight?: string;
  className?: string;
  fontSize?: string;
}

export default function CodeConsole({
  messages,
  isProcessing = false,
  maxHeight = '200px',
  className = '',
  fontSize = '14px'
}: CodeConsoleProps) {
  const consoleEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (consoleEndRef.current) {
      consoleEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [messages]);

  return (
    <div 
      className={`bg-neutral rounded-lg font-mono overflow-y-auto terminal-like ${className}`}
      style={{ maxHeight, fontSize }}
    >
      <div className="flex items-center justify-between p-2 border-b border-base-200 bg-base-300 bg-opacity-20">
        <span className="font-semibold tracking-wide">Console Output</span>
        {isProcessing && (
          <div className="flex items-center">
            <span className="loading loading-spinner loading-xs mr-2"></span>
            <span className="text-xs">Processing...</span>
          </div>
        )}
      </div>
      
      <div className="p-3 console-text">
        {messages.length === 0 ? (
          <div className="text-base-content/50 italic">No output yet. Run your code to see results.</div>
        ) : (
          messages.map((message, index) => {
            // Style command lines vs output lines differently
            const isCommand = message.startsWith('>>');
            const isError = message.toLowerCase().includes('error');
            const isSuccess = message.toLowerCase().includes('success');
            
            let messageClass = '';
            if (isCommand) messageClass = 'font-semibold text-primary-400';
            if (isError) messageClass = 'text-error';
            if (isSuccess) messageClass = 'text-success';
            
            return (
              <div key={index} className={`mb-1 ${messageClass}`}>
                {message}
              </div>
            );
          })
        )}
        
        {/* Invisible element to scroll to */}
        <div ref={consoleEndRef} />
      </div>
    </div>
  );
} 