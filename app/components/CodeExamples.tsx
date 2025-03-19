'use client';

import React, { useState } from 'react';

// Example code samples for different signal processing tasks
const EXAMPLES = {
  'Basic Sine Wave': `% Generate a simple sine wave
fs = 1000;           % Sampling frequency (Hz)
t = 0:1/fs:1-1/fs;   % Time vector (1 second)
f = 10;              % Frequency of sine wave (Hz)
x = sin(2*pi*f*t);   % Generate sine wave

% Plot the signal
plot(t, x);
title('10 Hz Sine Wave');
xlabel('Time (s)');
ylabel('Amplitude');`,

  'Sine Wave with Noise': `% Generate a sine wave with noise
fs = 1000;           % Sampling frequency (Hz)
t = 0:1/fs:1-1/fs;   % Time vector (1 second)
f = 10;              % Frequency of sine wave (Hz)
x = sin(2*pi*f*t);   % Generate sine wave

% Add random noise
noise_level = 0.2;
x = x + noise_level*randn(size(t));

% Plot the signal
plot(t, x);
title('Noisy Sine Wave');
xlabel('Time (s)');
ylabel('Amplitude');`,

  'Frequency Spectrum': `% Generate a complex signal with multiple frequencies
fs = 1000;           % Sampling frequency (Hz)
t = 0:1/fs:1-1/fs;   % Time vector (1 second)
f1 = 10;             % First frequency component (Hz)
f2 = 50;             % Second frequency component (Hz)
f3 = 120;            % Third frequency component (Hz)

% Create signal with three frequency components
x = sin(2*pi*f1*t) + 0.5*sin(2*pi*f2*t) + 0.25*sin(2*pi*f3*t);

% Add a small amount of noise
x = x + 0.1*randn(size(t));

% Plot the signal
plot(t, x);
title('Complex Signal with Multiple Frequencies');
xlabel('Time (s)');
ylabel('Amplitude');

% Compute the FFT
X = fft(x);
N = length(X);
f = (0:N-1)*(fs/N); % Frequency vector
X_mag = abs(X)/N;   % Normalized magnitude

% Plot single-sided amplitude spectrum
X_mag_single = X_mag(1:N/2+1);
X_mag_single(2:end-1) = 2*X_mag_single(2:end-1);
f_single = f(1:N/2+1);

figure;
plot(f_single, X_mag_single);
title('Frequency Spectrum');
xlabel('Frequency (Hz)');
ylabel('Amplitude');`,

  'AM Modulation': `% AM Modulation example
fs = 4000;          % Sampling frequency (Hz)
t = 0:1/fs:1-1/fs;  % Time vector (1 second)

% Message signal (low frequency)
fm = 5;             % Message frequency (Hz)
m = sin(2*pi*fm*t);

% Carrier signal (high frequency)
fc = 100;           % Carrier frequency (Hz)
c = sin(2*pi*fc*t);

% AM modulation
ka = 0.5;           % Modulation index (0-1)
s = (1 + ka*m).*c;  % Modulated signal

% Plot the signals
subplot(3,1,1);
plot(t(1:500), m(1:500));
title('Message Signal');
xlabel('Time (s)');
ylabel('Amplitude');

subplot(3,1,2);
plot(t(1:500), c(1:500));
title('Carrier Signal');
xlabel('Time (s)');
ylabel('Amplitude');

subplot(3,1,3);
plot(t(1:500), s(1:500));
title('AM Modulated Signal');
xlabel('Time (s)');
ylabel('Amplitude');`,

  'Digital Filter': `% Design and apply a digital filter
fs = 1000;          % Sampling frequency (Hz)
t = 0:1/fs:1-1/fs;  % Time vector (1 second)

% Create a signal with multiple frequency components
f1 = 5;             % Low frequency component (Hz)
f2 = 50;            % Medium frequency component (Hz)
f3 = 200;           % High frequency component (Hz)
x = sin(2*pi*f1*t) + sin(2*pi*f2*t) + sin(2*pi*f3*t);

% Add noise
x = x + 0.5*randn(size(t));

% Design a lowpass filter (cutoff at 30 Hz)
cutoff = 30;
[b, a] = butter(4, cutoff/(fs/2), 'low');

% Apply the filter to the signal
y = filter(b, a, x);

% Plot original and filtered signals
subplot(2,1,1);
plot(t, x);
title('Original Signal with Noise');
xlabel('Time (s)');
ylabel('Amplitude');

subplot(2,1,2);
plot(t, y);
title('Filtered Signal (Lowpass 30 Hz)');
xlabel('Time (s)');
ylabel('Amplitude');`
};

interface CodeExamplesProps {
  onSelect: (code: string) => void;
}

export default function CodeExamples({ onSelect }: CodeExamplesProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Filter examples based on search term
  const filteredExamples = Object.entries(EXAMPLES).filter(([title]) => 
    title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <input
          type="text"
          placeholder="Search examples..."
          className="input input-bordered w-full"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredExamples.map(([title, code]) => (
          <div key={title} className="card bg-base-200 hover:bg-base-300 cursor-pointer transition-colors" onClick={() => onSelect(code)}>
            <div className="card-body p-4">
              <h3 className="card-title text-base">{title}</h3>
              <div className="mt-2 text-xs opacity-70 overflow-hidden whitespace-nowrap text-ellipsis">
                {code.split('\n')[0]}
              </div>
              <div className="card-actions justify-end mt-2">
                <button className="btn btn-sm btn-primary" onClick={(e) => {
                  e.stopPropagation();
                  onSelect(code);
                }}>
                  Use Example
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredExamples.length === 0 && (
        <div className="text-center py-6">
          <p className="opacity-70">No examples found matching your search.</p>
        </div>
      )}
    </div>
  );
} 