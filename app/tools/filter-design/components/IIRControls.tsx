import React from 'react';
import { IIRMethod } from '../types/filterTypes';

interface IIRControlsProps {
  iirMethod: IIRMethod;
  setIirMethod: (method: IIRMethod) => void;
  filterOrder: number;
  setFilterOrder: (order: number) => void;
  passbandRipple: number;
  setPassbandRipple: (ripple: number) => void;
  stopbandAttenuation: number;
  setStopbandAttenuation: (attenuation: number) => void;
}

const IIRControls: React.FC<IIRControlsProps> = ({
  iirMethod,
  setIirMethod,
  filterOrder,
  setFilterOrder,
  passbandRipple,
  setPassbandRipple,
  stopbandAttenuation,
  setStopbandAttenuation
}) => {
  const iirMethods: { value: IIRMethod; label: string }[] = [
    { value: 'butterworth', label: 'Butterworth' },
    { value: 'chebyshev1', label: 'Chebyshev I' },
    { value: 'chebyshev2', label: 'Chebyshev II' },
    { value: 'elliptic', label: 'Elliptic' }
  ];

  return (
    <div className="space-y-4">
      {/* IIR Design Method */}
      <div className="space-y-2">
        <label className="text-cyan-300 font-mono text-sm font-bold">IIR Filter Type</label>
        <div className="relative">
          <select 
            value={iirMethod}
            onChange={(e) => setIirMethod(e.target.value as IIRMethod)}
            className="w-full px-4 py-2 bg-gray-800 rounded-lg border border-cyan-700 text-white appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-cyan-600"
          >
            {iirMethods.map(method => (
              <option key={method.value} value={method.value} className="bg-gray-800">
                {method.label}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-cyan-300">
            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
              <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Filter Order */}
      <div className="space-y-2">
        <label className="text-cyan-300 font-mono text-sm">Filter Order</label>
        <div className="flex items-center space-x-4">
          <input
            type="range"
            min="2"
            max="20"
            step="1"
            value={filterOrder}
            onChange={(e) => setFilterOrder(parseInt(e.target.value))}
            className="w-full accent-cyan-500"
          />
          <span className="text-cyan-300 font-mono w-12 text-right">{filterOrder}</span>
        </div>
        <div className="text-xs text-gray-500">Higher order gives steeper rolloff but more phase distortion</div>
      </div>

      {/* Passband Ripple (for Chebyshev I and Elliptic) */}
      {(iirMethod === 'chebyshev1' || iirMethod === 'elliptic') && (
        <div className="space-y-2">
          <label className="text-cyan-300 font-mono text-sm">Passband Ripple (dB)</label>
          <div className="flex items-center space-x-4">
            <input
              type="range"
              min="0.01"
              max="3"
              step="0.01"
              value={passbandRipple}
              onChange={(e) => setPassbandRipple(parseFloat(e.target.value))}
              className="w-full accent-cyan-500"
            />
            <span className="text-cyan-300 font-mono w-12 text-right">{passbandRipple.toFixed(2)}</span>
          </div>
          <div className="text-xs text-gray-500">Maximum ripple allowed in the passband</div>
        </div>
      )}

      {/* Stopband Attenuation (for Chebyshev II and Elliptic) */}
      {(iirMethod === 'chebyshev2' || iirMethod === 'elliptic') && (
        <div className="space-y-2">
          <label className="text-cyan-300 font-mono text-sm">Stopband Attenuation (dB)</label>
          <div className="flex items-center space-x-4">
            <input
              type="range"
              min="20"
              max="120"
              step="1"
              value={stopbandAttenuation}
              onChange={(e) => setStopbandAttenuation(parseFloat(e.target.value))}
              className="w-full accent-cyan-500"
            />
            <span className="text-cyan-300 font-mono w-12 text-right">{stopbandAttenuation.toFixed(0)}</span>
          </div>
          <div className="text-xs text-gray-500">Minimum attenuation in the stopband</div>
        </div>
      )}

      <div className="p-3 bg-gray-800/80 rounded-lg mt-2">
        <div className="text-xs text-gray-300">
          <p><span className="text-cyan-400 font-bold">Butterworth:</span> Maximally flat passband, smooth transition, no ripple</p>
          <p><span className="text-cyan-400 font-bold">Chebyshev I:</span> Equal ripple in passband, steeper rolloff than Butterworth</p>
          <p><span className="text-cyan-400 font-bold">Chebyshev II:</span> Equal ripple in stopband, steeper rolloff than Butterworth</p>
          <p><span className="text-cyan-400 font-bold">Elliptic:</span> Equal ripple in both bands, steepest possible rolloff</p>
        </div>
      </div>
    </div>
  );
};

export default IIRControls; 