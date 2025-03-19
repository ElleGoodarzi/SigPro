// This extends the Plotly types to support our custom data format
import { PlotData } from 'plotly.js';

declare module 'react-plotly.js' {
  export interface PlotParams {
    data: Partial<PlotData>[];
    layout?: Partial<Plotly.Layout>;
    frames?: Partial<Plotly.Frame>[] | null;
    config?: Partial<Plotly.Config>;
    useResizeHandler?: boolean;
    style?: React.CSSProperties;
    className?: string;
    onInitialized?: (figure: Plotly.Figure, graphDiv: HTMLElement) => void;
    onUpdate?: (figure: Plotly.Figure, graphDiv: HTMLElement) => void;
    onPurge?: (figure: Plotly.Figure, graphDiv: HTMLElement) => void;
    onError?: (err: Error) => void;
    onClickAnnotation?: (event: Plotly.ClickAnnotationEvent) => void;
    [key: string]: any;
  }

  const Plot: React.ComponentType<PlotParams>;
  export default Plot;
} 