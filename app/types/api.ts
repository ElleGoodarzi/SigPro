// API Response Types

// General API response structure
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  details?: string;
}

// Code execution specific interfaces
export interface CodeExecutionResult {
  success: boolean;
  output: string[];
  errorMessage?: string;
  data?: CodeExecutionData;
  executionTime?: number;
}

// Data structures for visualization
export interface PlotData {
  x: number[] | string[];
  y: number[];
  type: 'scatter' | 'bar' | 'histogram' | 'heatmap';
  mode?: 'lines' | 'markers' | 'lines+markers';
  name?: string;
  z?: number[][];
  colorscale?: string;
}

// Data returned from code execution
export interface CodeExecutionData {
  time?: PlotData;
  frequency?: PlotData;
  spectrogram?: PlotData;
  [key: string]: PlotData | undefined;
}

// Lab-specific interfaces
export interface LabStep {
  id: string;
  title: string;
  description: string;
  code: string;
  expectedOutput?: CodeExecutionData;
}

export interface LabData {
  id: string;
  title: string;
  description: string;
  steps: LabStep[];
}

// Tutorial-specific interfaces
export interface Tutorial {
  id: string;
  title: string;
  content: string;
  code: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

// Signal processing specific interfaces
export interface SignalData {
  sampleRate: number;
  data: number[];
  duration: number;
  name?: string;
}

export interface FilterParameters {
  type: 'lowpass' | 'highpass' | 'bandpass' | 'bandstop';
  cutoffFrequency: number | [number, number];
  order?: number;
}

export interface ProcessedSignalResponse {
  success: boolean;
  originalSignal: SignalData;
  processedSignal: SignalData;
  processingDetails?: {
    method: string;
    parameters: any;
    executionTime: number;
  };
} 