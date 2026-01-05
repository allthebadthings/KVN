import React, { useState, useEffect, useMemo } from 'react';
import { Play, Pause, Download, RefreshCw } from 'lucide-react';

// Basic UI components since I don't want to assume a UI library exists besides Tailwind
const ControlGroup = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="mb-4">
    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{label}</label>
    {children}
  </div>
);

const Button = ({ onClick, children, className = '', variant = 'primary' }: any) => {
  const baseStyle = "px-4 py-2 rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2";
  const variants = {
    primary: "bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500",
    secondary: "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 focus:ring-indigo-500 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-700",
    outline: "border border-gray-300 text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-800"
  };
  return (
    <button onClick={onClick} className={`${baseStyle} ${variants[variant as keyof typeof variants]} ${className}`}>
      {children}
    </button>
  );
};

// Input Range component
const Range = ({ value, min, max, step, onChange, label }: any) => (
  <div className="flex flex-col space-y-1">
    <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
      <span>{label || min}</span>
      <span>{value}</span>
      <span>{max}</span>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-indigo-600"
    />
  </div>
);

type PatternType = 'circle' | 'sine' | 'square' | 'triangle' | 'noise';

interface RingConfig {
  id: string;
  radiusOffset: number;
  pattern: PatternType;
  amplitude: number;
  frequency: number;
  strokeWidth: number;
  opacity: number;
  rotationSpeed: number; // degrees per second
  color: string;
  dashArray: string; // "10 5"
}

export const OrbitalRingGenerator: React.FC = () => {
  // Global Settings
  const [numRings, setNumRings] = useState(5);
  const [baseRadius, setBaseRadius] = useState(50);
  const [spacing, setSpacing] = useState(30);
  const [globalRotationSpeed, setGlobalRotationSpeed] = useState(10);
  const [isPlaying, setIsPlaying] = useState(true);
  const [colorStart, setColorStart] = useState('#4f46e5'); // Indigo 600
  const [colorEnd, setColorEnd] = useState('#ec4899'); // Pink 500
  const [patternType, setPatternType] = useState<PatternType>('sine');
  const [amplitude, setAmplitude] = useState(10);
  const [frequency, setFrequency] = useState(8);
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [resolution, setResolution] = useState(360); // Points per ring

  // Derived state for rings to allow individual variation (simplified for now to algorithmic generation)
  const rings = useMemo(() => {
    return Array.from({ length: numRings }).map((_, i) => {
      const progress = i / (numRings - 1 || 1);
      
      // Interpolate color
      // Simple linear interpolation of RGB would be better, but let's stick to a simple mapping for now
      // Or we can just use CSS variables or let SVG handle gradients?
      // Let's compute a color for each ring
      
      return {
        id: `ring-${i}`,
        radius: baseRadius + i * spacing,
        // Add some variation based on index
        amplitude: amplitude * (1 + i * 0.1), 
        frequency: frequency + (i % 2 === 0 ? 0 : 2), // Vary frequency slightly
        speed: globalRotationSpeed * (i % 2 === 0 ? 1 : -1) * (1 - i * 0.05), // Alternating direction
        color: i % 2 === 0 ? colorStart : colorEnd // Simplified color strategy for now
      };
    });
  }, [numRings, baseRadius, spacing, amplitude, frequency, globalRotationSpeed, colorStart, colorEnd]);

  // Animation loop
  const [rotation, setRotation] = useState(0);
  
  useEffect(() => {
    let animationFrame: number;
    let lastTime = performance.now();

    const animate = (time: number) => {
      if (!isPlaying) {
        lastTime = time;
        animationFrame = requestAnimationFrame(animate);
        return;
      }
      
      const delta = (time - lastTime) / 1000;
      lastTime = time;
      
      setRotation(prev => (prev + delta * 1) % 360); // Base time ticker
      animationFrame = requestAnimationFrame(animate);
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [isPlaying]);

  // Path Generation Logic
  const generatePath = (radius: number, amp: number, freq: number, type: PatternType) => {
    const points: [number, number][] = [];
    const steps = resolution;
    
    for (let i = 0; i <= steps; i++) {
      const theta = (i / steps) * 2 * Math.PI;
      // Add a tiny overlap to close the loop perfectly
      
      let r = radius;
      
      // Wave function
      let wave = 0;
      switch (type) {
        case 'sine':
          wave = Math.sin(theta * freq);
          break;
        case 'square':
          wave = Math.sign(Math.sin(theta * freq));
          break;
        case 'triangle':
          wave = Math.asin(Math.sin(theta * freq)) / (Math.PI / 2);
          break;
        case 'noise':
          // Noise is tricky because it needs to loop. 
          // We can use sin combinations for pseudo-noise that loops.
          wave = (Math.sin(theta * freq) + Math.sin(theta * freq * 2.5) * 0.5) / 1.5;
          break;
        case 'circle':
        default:
          wave = 0;
      }
      
      r += wave * amp;
      
      const x = r * Math.cos(theta);
      const y = r * Math.sin(theta);
      points.push([x, y]);
    }
    
    // SVG Path command
    if (points.length === 0) return '';
    
    const d = points.reduce((acc, point, i) => {
      const command = i === 0 ? 'M' : 'L';
      return `${acc} ${command} ${point[0].toFixed(2)} ${point[1].toFixed(2)}`;
    }, '');
    
    return d + ' Z';
  };

  const handleDownload = () => {
    const svg = document.getElementById('orbital-canvas');
    if (!svg) return;
    
    const serializer = new XMLSerializer();
    const source = serializer.serializeToString(svg);
    const blob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = 'orbital-rings.svg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden">
      {/* Controls Sidebar */}
      <div className="w-full lg:w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 p-6 overflow-y-auto z-10 shadow-xl">
        <div className="flex items-center space-x-2 mb-8">
          <RefreshCw className="w-6 h-6 text-indigo-600" />
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Orbital Rings</h1>
        </div>

        <div className="space-y-6">
          <ControlGroup label="Animation">
            <div className="flex space-x-2">
              <Button onClick={() => setIsPlaying(!isPlaying)} variant={isPlaying ? 'secondary' : 'primary'} className="flex-1 flex justify-center items-center">
                {isPlaying ? <Pause size={16} className="mr-2" /> : <Play size={16} className="mr-2" />}
                {isPlaying ? 'Pause' : 'Play'}
              </Button>
              <Button onClick={handleDownload} variant="outline" className="flex justify-center items-center">
                <Download size={16} />
              </Button>
            </div>
          </ControlGroup>

          <ControlGroup label="Structure">
            <Range label="Rings" value={numRings} min={1} max={20} step={1} onChange={setNumRings} />
            <Range label="Base Radius" value={baseRadius} min={10} max={200} step={5} onChange={setBaseRadius} />
            <Range label="Spacing" value={spacing} min={5} max={100} step={1} onChange={setSpacing} />
          </ControlGroup>

          <ControlGroup label="Pattern">
            <div className="grid grid-cols-3 gap-2 mb-4">
              {['circle', 'sine', 'square', 'triangle', 'noise'].map((p) => (
                <button
                  key={p}
                  onClick={() => setPatternType(p as PatternType)}
                  className={`px-2 py-1 text-xs rounded-md border ${
                    patternType === p
                      ? 'bg-indigo-100 border-indigo-500 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200'
                      : 'border-gray-300 text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-400'
                  }`}
                >
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>
            <Range label="Amplitude" value={amplitude} min={0} max={100} step={1} onChange={setAmplitude} />
            <Range label="Frequency" value={frequency} min={1} max={50} step={1} onChange={setFrequency} />
            <Range label="Resolution" value={resolution} min={20} max={720} step={10} onChange={setResolution} />
          </ControlGroup>

          <ControlGroup label="Style">
            <Range label="Thickness" value={strokeWidth} min={0.5} max={20} step={0.5} onChange={setStrokeWidth} />
            <Range label="Speed" value={globalRotationSpeed} min={0} max={360} step={1} onChange={setGlobalRotationSpeed} />
            
            <div className="flex flex-col space-y-2 mt-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Start Color</span>
                <input type="color" value={colorStart} onChange={(e) => setColorStart(e.target.value)} className="h-6 w-12 rounded cursor-pointer" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">End Color</span>
                <input type="color" value={colorEnd} onChange={(e) => setColorEnd(e.target.value)} className="h-6 w-12 rounded cursor-pointer" />
              </div>
            </div>
          </ControlGroup>
        </div>
      </div>

      {/* Canvas Area */}
      <div className="flex-1 bg-gray-100 dark:bg-black flex items-center justify-center p-8 overflow-hidden relative">
        <div className="absolute inset-0 grid grid-cols-[repeat(40,minmax(0,1fr))] grid-rows-[repeat(40,minmax(0,1fr))] opacity-[0.03] pointer-events-none">
          {/* Grid background just for visual context */}
          {Array.from({ length: 1600 }).map((_, i) => (
            <div key={i} className="border-[0.5px] border-gray-900 dark:border-white" />
          ))}
        </div>

        <svg
          id="orbital-canvas"
          viewBox="-500 -500 1000 1000"
          className="w-full h-full max-w-[800px] max-h-[800px] drop-shadow-2xl"
          style={{ overflow: 'visible' }}
        >
          <defs>
             {/* Gradient Definition */}
             <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="100%">
               <stop offset="0%" stopColor={colorStart} />
               <stop offset="100%" stopColor={colorEnd} />
             </linearGradient>
          </defs>
          
          {rings.map((ring, index) => (
            <g key={ring.id} style={{ 
              transform: `rotate(${rotation * ring.speed}deg)`,
              transformOrigin: '0 0',
              transition: 'transform 0s linear' // Remove transition for smooth animation frame updates
            }}>
              <path
                d={generatePath(ring.radius, ring.amplitude, ring.frequency, patternType)}
                fill="none"
                stroke={`url(#ringGradient)`} // Use gradient or interpolate colors manually if needed
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={0.8}
              />
              {/* Optional: Add a subtle ghost ring or dots for more "tech" feel */}
               <circle r={ring.radius} fill="none" stroke={colorEnd} strokeWidth={0.5} opacity={0.1} />
            </g>
          ))}
          
          {/* Center Point */}
          <circle r={3} fill={colorStart} />
        </svg>
      </div>
    </div>
  );
};
