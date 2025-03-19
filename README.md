# SigPRP - Signal Processing Learning Platform

A modern, interactive web application for engineering students to learn signal processing concepts through hands-on experiments and visualizations.

## Features

- **Interactive MATLAB-like Editor**: Write and execute signal processing code directly in your browser
- **Real-time Visualization**: Instantly see the results of your algorithms with interactive charts
- **Structured Labs**: Progress through guided experiments from basic to advanced topics
- **Responsive Design**: Work on any device - desktop, tablet, or mobile

## Tech Stack

- **Next.js**: React framework for building the web application
- **TypeScript**: For type-safe code
- **Monaco Editor**: The editor that powers VS Code, used for MATLAB-like coding
- **Plotly.js**: For interactive data visualization
- **Tailwind CSS & DaisyUI**: For modern, responsive UI design

## Getting Started

### Prerequisites

- Node.js 18.x or later
- npm 9.x or later

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/your-username/sigprp.git
   cd sigprp
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Run the development server:
   ```
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:3000`

## Project Structure

```
sigprp/
├── app/                # Next.js App Router components
│   ├── components/     # Reusable UI components
│   ├── lib/            # Utility functions and shared logic
│   ├── simulator/      # Signal processing simulator
│   ├── labs/           # Interactive labs
│   └── tutorials/      # Educational content
├── public/             # Static assets
└── ...
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- MATLAB for inspiration on the coding environment
- Signal processing educational resources that informed our labs
- The open-source community for the amazing tools that made this possible
