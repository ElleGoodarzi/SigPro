import type { Metadata } from 'next';
import './globals.css';
import ClientWrapper from './components/ClientWrapper';
import { Inter } from 'next/font/google';
import Script from 'next/script';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Signal Processing Simulator',
  description: 'Interactive web-based signal processing simulator and learning platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-theme="light">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=VT323&family=Press+Start+2P&family=Share+Tech+Mono&family=Orbitron:wght@400;500;700;900&family=Comic+Neue:wght@400;700&family=Silkscreen&display=swap" rel="stylesheet" />
        <script
          id="MathJax-script"
          async
          src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"
        ></script>
      </head>
      <body className={inter.className}>
        <ClientWrapper>
          {children}
        </ClientWrapper>
      </body>
    </html>
  );
} 