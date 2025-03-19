'use client';

import { useState } from 'react';

interface KeyboardShortcut {
  keys: string[];
  description: string;
  category: string;
}

const shortcuts: KeyboardShortcut[] = [
  {
    keys: ['Ctrl', 'Enter'],
    description: 'Run code',
    category: 'Editor'
  },
  {
    keys: ['Ctrl', 'S'],
    description: 'Save code',
    category: 'Editor'
  },
  {
    keys: ['Ctrl', 'O'],
    description: 'Open saved code',
    category: 'Editor'
  },
  {
    keys: ['Esc'],
    description: 'Close all modals',
    category: 'Interface'
  },
  {
    keys: ['Tab'],
    description: 'Indent code',
    category: 'Editor'
  },
  {
    keys: ['Shift', 'Tab'],
    description: 'Unindent code',
    category: 'Editor'
  },
  {
    keys: ['Ctrl', '/'],
    description: 'Toggle comment',
    category: 'Editor'
  },
  {
    keys: ['Ctrl', 'Z'],
    description: 'Undo',
    category: 'Editor'
  },
  {
    keys: ['Ctrl', 'Shift', 'Z'],
    description: 'Redo',
    category: 'Editor'
  },
  {
    keys: ['Alt', '1'],
    description: 'Switch to Time Domain tab',
    category: 'Visualization'
  },
  {
    keys: ['Alt', '2'],
    description: 'Switch to Frequency Domain tab',
    category: 'Visualization'
  },
  {
    keys: ['Alt', '3'],
    description: 'Switch to Spectrogram tab',
    category: 'Visualization'
  }
];

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function KeyboardShortcutsModal({ isOpen, onClose }: KeyboardShortcutsModalProps) {
  const [filter, setFilter] = useState('All');
  
  if (!isOpen) return null;
  
  const categories = ['All', ...Array.from(new Set(shortcuts.map(s => s.category)))];
  
  const filteredShortcuts = filter === 'All'
    ? shortcuts
    : shortcuts.filter(s => s.category === filter);
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-base-100 rounded-lg shadow-lg max-w-2xl w-full">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold">Keyboard Shortcuts</h2>
          <button 
            className="btn btn-sm btn-circle" 
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        
        <div className="p-4">
          <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
            {categories.map(category => (
              <button
                key={category}
                className={`btn btn-sm ${filter === category ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setFilter(category)}
              >
                {category}
              </button>
            ))}
          </div>
          
          <div className="overflow-y-auto max-h-[60vh]">
            <table className="table table-zebra w-full">
              <thead>
                <tr>
                  <th>Shortcut</th>
                  <th>Description</th>
                  <th>Category</th>
                </tr>
              </thead>
              <tbody>
                {filteredShortcuts.map((shortcut, index) => (
                  <tr key={index}>
                    <td className="flex gap-1">
                      {shortcut.keys.map((key, i) => (
                        <span key={i} className="kbd kbd-sm">
                          {key}
                        </span>
                      ))}
                    </td>
                    <td>{shortcut.description}</td>
                    <td>{shortcut.category}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        <div className="p-4 border-t flex justify-end">
          <button className="btn btn-primary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
} 