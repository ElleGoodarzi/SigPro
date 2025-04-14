import React from 'react';
import { FIRMethod, WindowType } from '../types/filterTypes';

interface FIRControlsProps {
  windowLength: number;
  setWindowLength: (length: number) => void;
  firMethod: FIRMethod;
  setFirMethod: (method: FIRMethod) => void;
  windowType: WindowType;
  setWindowType: (type: WindowType) => void;
  kaiserBeta: number;
  setKaiserBeta: (beta: number) => void;
}

const FIRControls: React.FC<FIRControlsProps> = ({
  windowLength,
  setWindowLength,
  firMethod,
  setFirMethod,
  windowType,
  setWindowType,
  kaiserBeta,
  setKaiserBeta
}) => {
  const firMethods: { value: FIRMethod; label: string }[] = [
    { value: 'window', label: 'Window Method' },
    { value: 'least-squares', label: 'Least Squares' },
    { value: 'equiripple', label: 'Equiripple' }
  ];

  const windowTypes: { value: WindowType; label: string }[] = [
    { value: 'rectangular', label: 'Rectangular' },
    { value: 'hamming', label: 'Hamming' },
    { value: 'hanning', label: 'Hanning' },
    { value: 'blackman', label: 'Blackman' },
    { value: 'kaiser', label: 'Kaiser' }
  ];

  return (
    <div className="space-y-4">
      {/* Filter Length */}
      <div className="space-y-2">
        <label className="text-cyan-300 font-mono text-sm">Filter Length</label>
        <div className="flex items-center space-x-4">
          <input
            type="range"
            min="21"
            max="501"
            step="2"
            value={windowLength}
            onChange={(e) => setWindowLength(parseInt(e.target.value))}
            className="w-full accent-cyan-500"
          />
          <span className="text-cyan-300 font-mono w-12 text-right">{windowLength}</span>
        </div>
        <div className="text-xs text-gray-500">Length of the FIR filter in samples</div>
      </div>

      {/* FIR Design Method */}
      <div className="space-y-2">
        <label className="text-cyan-300 font-mono text-sm">Design Method</label>
        <select 
          value={firMethod}
          onChange={(e) => setFirMethod(e.target.value as FIRMethod)}
          className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
        >
          {firMethods.map(method => (
            <option key={method.value} value={method.value}>{method.label}</option>
          ))}
        </select>
      </div>

      {/* Window Type (for window method) */}
      {firMethod === 'window' && (
        <div className="space-y-2">
          <label className="text-cyan-300 font-mono text-sm">Window Type</label>
          <select 
            value={windowType}
            onChange={(e) => setWindowType(e.target.value as WindowType)}
            className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
          >
            {windowTypes.map(type => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
        </div>
      )}

      {/* Kaiser Beta (for Kaiser window) */}
      {firMethod === 'window' && windowType === 'kaiser' && (
        <div className="space-y-2">
          <label className="text-cyan-300 font-mono text-sm">Kaiser β Parameter</label>
          <div className="flex items-center space-x-4">
            <input
              type="range"
              min="1"
              max="10"
              step="0.1"
              value={kaiserBeta}
              onChange={(e) => setKaiserBeta(parseFloat(e.target.value))}
              className="w-full accent-cyan-500"
            />
            <span className="text-cyan-300 font-mono w-12 text-right">{kaiserBeta.toFixed(1)}</span>
          </div>
          <div className="text-xs text-gray-500">
            Controls main lobe width (lower β) vs. side lobe level (higher β)
          </div>
        </div>
      )}

      <div className="p-3 bg-gray-800/80 rounded-lg mt-2">
        <div className="text-xs text-gray-300">
          <p><span className="text-cyan-400 font-bold">Window Method:</span> Truncates the ideal impulse response with a window function</p>
          <p><span className="text-cyan-400 font-bold">Least Squares:</span> Minimizes the mean squared error in the frequency response</p>
          <p><span className="text-cyan-400 font-bold">Equiripple:</span> Creates equal ripple in passband and stopband (Parks-McClellan)</p>
        </div>
      </div>
    </div>
  );
};

export default FIRControls; 