'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { CodeExecutionResult } from '../types/api';

// Define types for our context
interface AppState {
  // Editor state
  currentCode: string;
  codeHistory: string[];
  savedCodes: {[key: string]: string};
  
  // Execution state
  isProcessing: boolean;
  lastResult: CodeExecutionResult | null;
  consoleMessages: string[];
  
  // UI state
  isDarkMode: boolean;
  useOctave: boolean;
  
  // Methods
  setCurrentCode: (code: string) => void;
  executeCode: (code: string) => Promise<CodeExecutionResult>;
  clearConsole: () => void;
  saveCode: (name: string, code: string) => void;
  loadCode: (name: string) => string | null;
  toggleDarkMode: () => void;
  toggleOctaveMode: () => void;
}

// Create context with default values
const AppStateContext = createContext<AppState | undefined>(undefined);

// Custom hook for using the app state
export function useAppState() {
  const context = useContext(AppStateContext);
  if (context === undefined) {
    throw new Error('useAppState must be used within an AppStateProvider');
  }
  return context;
}

// Function to execute MATLAB-like code via API
const executeCodeViaAPI = async (code: string, useOctave: boolean = true): Promise<CodeExecutionResult> => {
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
    
    // This would ideally call the client-side executor
    // For now, we'll return an error
    return {
      success: false,
      output: [`Error: ${error instanceof Error ? error.message : 'Unknown error'}`],
      errorMessage: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

// Provider component
export function AppStateProvider({ children }: { children: ReactNode }) {
  // Initialize state
  const [currentCode, setCurrentCode] = useState<string>('');
  const [codeHistory, setCodeHistory] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [lastResult, setLastResult] = useState<CodeExecutionResult | null>(null);
  const [consoleMessages, setConsoleMessages] = useState<string[]>([]);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [useOctave, setUseOctave] = useState<boolean>(true);
  const [savedCodes, setSavedCodes] = useState<{[key: string]: string}>({});

  // Load saved code from localStorage on initial render
  useEffect(() => {
    const storedCodes = localStorage.getItem('sigprp-saved-codes');
    if (storedCodes) {
      setSavedCodes(JSON.parse(storedCodes));
    }
    
    const darkModePreference = localStorage.getItem('sigprp-dark-mode');
    if (darkModePreference) {
      setIsDarkMode(darkModePreference === 'true');
    }
    
    const octavePreference = localStorage.getItem('sigprp-use-octave');
    if (octavePreference) {
      setUseOctave(octavePreference === 'true');
    }
  }, []);

  // Save code implementation
  const saveCode = (name: string, code: string) => {
    const updatedCodes = { ...savedCodes, [name]: code };
    setSavedCodes(updatedCodes);
    localStorage.setItem('sigprp-saved-codes', JSON.stringify(updatedCodes));
  };

  // Load code implementation
  const loadCode = (name: string): string | null => {
    return savedCodes[name] || null;
  };

  // Clear console implementation
  const clearConsole = () => {
    setConsoleMessages([]);
  };

  // Toggle dark mode
  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    localStorage.setItem('sigprp-dark-mode', String(newMode));
    
    // Apply to document
    if (newMode) {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
    }
  };

  // Toggle Octave mode
  const toggleOctaveMode = () => {
    const newMode = !useOctave;
    setUseOctave(newMode);
    localStorage.setItem('sigprp-use-octave', String(newMode));
  };

  // Execute code implementation
  const executeCode = async (code: string): Promise<CodeExecutionResult> => {
    setIsProcessing(true);
    setConsoleMessages(prev => [...prev, '>> Executing code...']);
    
    try {
      // Add to history
      setCodeHistory(prev => [...prev, code].slice(-10)); // Keep last 10 items

      // Execute code
      const result = await executeCodeViaAPI(code, useOctave);
      
      // Update state
      setLastResult(result);
      setConsoleMessages(result.output);
      
      if (!result.success && result.errorMessage) {
        setConsoleMessages(prev => [...prev, `>> Error: ${result.errorMessage}`]);
      }
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      const errorResult: CodeExecutionResult = {
        success: false,
        output: [`>> Error: ${errorMessage}`],
        errorMessage
      };
      
      setLastResult(errorResult);
      setConsoleMessages(prev => [...prev, `>> Error: ${errorMessage}`]);
      return errorResult;
    } finally {
      setIsProcessing(false);
    }
  };

  // Context value
  const value: AppState = {
    currentCode,
    codeHistory,
    savedCodes,
    isProcessing,
    lastResult,
    consoleMessages,
    isDarkMode,
    useOctave,
    setCurrentCode,
    executeCode,
    clearConsole,
    saveCode,
    loadCode,
    toggleDarkMode,
    toggleOctaveMode
  };

  return (
    <AppStateContext.Provider value={value}>
      {children}
    </AppStateContext.Provider>
  );
} 