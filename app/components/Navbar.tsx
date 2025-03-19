'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useAppState } from '../context/AppStateContext';
import KeyboardShortcutsModal from './KeyboardShortcutsModal';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState(false);
  const { isDarkMode, toggleDarkMode } = useAppState();
  
  // Update document theme when dark mode changes
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  return (
    <>
      <div className="navbar bg-base-200 shadow-sm border-b border-primary/20">
        <div className="container mx-auto">
          <div className="flex-1">
            <Link href="/" className="btn btn-ghost normal-case text-xl font-heading">
              <span className="text-primary font-bold animate-nerd-pulse">Sig</span>
              <span className="font-mono tracking-tighter">PRP</span>
              <span className="text-xs text-accent ml-1 opacity-70">v0.1.0</span>
            </Link>
          </div>
          
          {/* Mobile menu button */}
          <div className="flex-none md:hidden">
            <button 
              className="btn btn-square btn-ghost"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="inline-block w-5 h-5 stroke-current">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
              </svg>
            </button>
          </div>
          
          {/* Desktop navigation */}
          <div className="flex-none hidden md:flex">
            <ul className="menu menu-horizontal px-1 gap-1 font-mono text-sm">
              <li>
                <Link href="/simulator" className="hover:text-primary hover:bg-base-300 transition-colors">Simulator</Link>
              </li>
              <li>
                <Link href="/labs" className="hover:text-primary hover:bg-base-300 transition-colors">Labs</Link>
              </li>
              <li>
                <Link href="/tutorials" className="hover:text-primary hover:bg-base-300 transition-colors">Tutorials</Link>
              </li>
              <li>
                <a href="https://github.com/your-username/sigprp" target="_blank" rel="noopener noreferrer" className="hover:text-accent hover:bg-base-300 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.012 8.012 0 0 0 16 8c0-4.42-3.58-8-8-8z"/>
                  </svg>
                  GitHub
                </a>
              </li>
            </ul>
            <div className="dropdown dropdown-end ml-2">
              <label tabIndex={0} className="btn btn-ghost btn-circle">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </label>
              <ul tabIndex={0} className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-200 rounded-box w-52 font-mono">
                <li>
                  <button className="justify-between" onClick={toggleDarkMode}>
                    <span>{isDarkMode ? '[x]' : '[ ]'}</span> Dark Mode
                    <input 
                      type="checkbox" 
                      className="toggle toggle-primary" 
                      checked={isDarkMode}
                      onChange={toggleDarkMode}
                    />
                  </button>
                </li>
                <li><a className="hover:text-primary hover:bg-base-300">Help</a></li>
                <li><a className="hover:text-primary hover:bg-base-300">About</a></li>
                <li><button onClick={() => setIsShortcutsModalOpen(true)} className="hover:text-primary hover:bg-base-300">Keyboard Shortcuts</button></li>
              </ul>
            </div>
          </div>
        </div>
        
        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="fixed inset-0 z-50 bg-base-100 md:hidden">
            <div className="p-4 flex justify-between items-center border-b border-primary/20">
              <Link href="/" className="btn btn-ghost normal-case text-xl font-heading">
                <span className="text-primary font-bold">Sig</span>
                <span className="font-mono">PRP</span>
              </Link>
              <button 
                className="btn btn-square btn-ghost"
                onClick={() => setIsMenuOpen(false)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4">
              <ul className="menu w-full font-mono">
                <li>
                  <Link href="/simulator" onClick={() => setIsMenuOpen(false)} className="hover:text-primary hover:bg-base-300">Simulator</Link>
                </li>
                <li>
                  <Link href="/labs" onClick={() => setIsMenuOpen(false)} className="hover:text-primary hover:bg-base-300">Labs</Link>
                </li>
                <li>
                  <Link href="/tutorials" onClick={() => setIsMenuOpen(false)} className="hover:text-primary hover:bg-base-300">Tutorials</Link>
                </li>
                <li>
                  <a href="https://github.com/your-username/sigprp" target="_blank" rel="noopener noreferrer" className="hover:text-accent hover:bg-base-300">
                    GitHub
                  </a>
                </li>
                <li className="menu-title">
                  <span>[ SETTINGS ]</span>
                </li>
                <li>
                  <button className="justify-between" onClick={toggleDarkMode}>
                    <span>{isDarkMode ? '[x]' : '[ ]'}</span> Dark Mode
                    <input 
                      type="checkbox" 
                      className="toggle toggle-primary" 
                      checked={isDarkMode}
                      onChange={toggleDarkMode}
                    />
                  </button>
                </li>
                <li><a className="hover:text-primary hover:bg-base-300">Help</a></li>
                <li><a className="hover:text-primary hover:bg-base-300">About</a></li>
                <li>
                  <button onClick={() => {
                    setIsMenuOpen(false);
                    setIsShortcutsModalOpen(true);
                  }} className="hover:text-primary hover:bg-base-300">
                    Keyboard Shortcuts
                  </button>
                </li>
              </ul>
            </div>
          </div>
        )}
      </div>
      
      {/* Keyboard Shortcuts Modal */}
      <KeyboardShortcutsModal 
        isOpen={isShortcutsModalOpen}
        onClose={() => setIsShortcutsModalOpen(false)}
      />
    </>
  );
};

export default Navbar; 