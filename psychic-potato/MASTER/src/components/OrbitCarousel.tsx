import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, ChevronUp, Layers, Database, Cpu, FileText, Home } from 'lucide-react';
import inventoryData from '../data/inventory.json';

interface DataNode {
  name: string;
  type: string;
  children?: DataNode[];
  [key: string]: any;
}

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'category': return Layers;
    case 'project': return Database;
    case 'device_config': return Cpu;
    default: return FileText;
  }
};

const getTypeColor = (type: string) => {
  switch (type) {
    case 'root': return { bg: 'from-blue-600 to-blue-700', glow: 'rgba(37, 99, 235, 0.4)' };
    case 'category': return { bg: 'from-gray-600 to-gray-700', glow: 'rgba(75, 85, 99, 0.4)' };
    case 'project': return { bg: 'from-green-600 to-green-700', glow: 'rgba(22, 163, 74, 0.4)' };
    case 'config': return { bg: 'from-orange-600 to-orange-700', glow: 'rgba(234, 88, 12, 0.4)' };
    case 'device_config': return { bg: 'from-purple-600 to-purple-700', glow: 'rgba(147, 51, 234, 0.4)' };
    case 'reference': return { bg: 'from-cyan-600 to-cyan-700', glow: 'rgba(8, 145, 178, 0.4)' };
    case 'sensor': return { bg: 'from-red-600 to-red-700', glow: 'rgba(220, 38, 38, 0.4)' };
    default: return { bg: 'from-slate-600 to-slate-700', glow: 'rgba(100, 116, 139, 0.4)' };
  }
};

const OrbitCarousel: React.FC = () => {
  // Navigation stack - stores path of selected nodes
  const [pathStack, setPathStack] = useState<DataNode[]>([inventoryData as DataNode]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Current level's items (children of current node)
  const currentNode = pathStack[pathStack.length - 1];
  const items: DataNode[] = currentNode?.children || [];
  const itemCount = items.length;

  // Visible items (show 5 at a time in the carousel)
  const visibleCount = Math.min(5, itemCount);
  const startIndex = Math.max(0, Math.min(activeIndex - Math.floor(visibleCount / 2), itemCount - visibleCount));

  const visibleItems = useMemo(() => {
    return items.slice(startIndex, startIndex + visibleCount);
  }, [items, startIndex, visibleCount]);

  const handlePrev = () => {
    setActiveIndex(prev => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    setActiveIndex(prev => Math.min(itemCount - 1, prev + 1));
  };

  const handleDrillDown = (item: DataNode) => {
    if (item.children && item.children.length > 0) {
      setPathStack(prev => [...prev, item]);
      setActiveIndex(0);
    }
  };

  const handleGoUp = () => {
    if (pathStack.length > 1) {
      setPathStack(prev => prev.slice(0, -1));
      setActiveIndex(0);
    }
  };

  const handleGoHome = () => {
    setPathStack([inventoryData as DataNode]);
    setActiveIndex(0);
  };

  const handleBreadcrumbClick = (index: number) => {
    setPathStack(prev => prev.slice(0, index + 1));
    setActiveIndex(0);
  };

  return (
    <div className="relative w-full h-full bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 overflow-hidden flex flex-col">
      {/* Ambient background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-3xl" />
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl" />
      </div>

      {/* Breadcrumb navigation */}
      <div className="relative z-10 p-6 pb-0">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleGoHome}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <Home size={16} />
          </button>
          {pathStack.map((node, idx) => (
            <React.Fragment key={idx}>
              <ChevronRight size={16} className="text-white/40" />
              <button
                onClick={() => handleBreadcrumbClick(idx)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  idx === pathStack.length - 1
                    ? 'bg-white/20 text-white'
                    : 'text-white/60 hover:text-white hover:bg-white/10'
                }`}
              >
                {node.name}
              </button>
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Current level title */}
      <div className="relative z-10 px-6 py-4 text-center">
        <motion.h1
          key={currentNode.name}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-bold text-white mb-2"
        >
          {currentNode.name}
        </motion.h1>
        <p className="text-white/50 text-sm">
          {itemCount} {itemCount === 1 ? 'item' : 'items'} • Click to drill down
        </p>
      </div>

      {/* Main carousel area */}
      <div className="flex-1 relative flex items-center justify-center px-4">
        {itemCount === 0 ? (
          <div className="text-center text-white/50">
            <FileText size={48} className="mx-auto mb-4 opacity-50" />
            <p>No children at this level</p>
            {pathStack.length > 1 && (
              <button
                onClick={handleGoUp}
                className="mt-4 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                Go Back
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Left arrow */}
            <button
              onClick={handlePrev}
              disabled={activeIndex === 0}
              className={`absolute left-4 z-20 p-3 rounded-full bg-white/10 backdrop-blur-sm transition-all ${
                activeIndex === 0
                  ? 'opacity-30 cursor-not-allowed'
                  : 'hover:bg-white/20 hover:scale-110'
              }`}
            >
              <ChevronLeft size={28} className="text-white" />
            </button>

            {/* Cards container */}
            <div className="flex items-center justify-center gap-4 perspective-[1000px]">
              <AnimatePresence mode="popLayout">
                {visibleItems.map((item, idx) => {
                  const actualIndex = startIndex + idx;
                  const isCenter = actualIndex === activeIndex;
                  const distanceFromCenter = actualIndex - activeIndex;
                  const colors = getTypeColor(item.type);
                  const Icon = getTypeIcon(item.type);
                  const hasChildren = item.children && item.children.length > 0;
                  const isHovered = hoveredIndex === actualIndex;

                  return (
                    <motion.div
                      key={item.name + actualIndex}
                      layout
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{
                        opacity: isCenter ? 1 : 0.6,
                        scale: isHovered ? 1.1 : isCenter ? 1 : 0.85,
                        rotateY: distanceFromCenter * -8,
                        z: isCenter ? 50 : 0,
                      }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                      className={`relative cursor-pointer transform-gpu ${
                        isCenter ? 'z-20' : 'z-10'
                      }`}
                      style={{ transformStyle: 'preserve-3d' }}
                      onMouseEnter={() => setHoveredIndex(actualIndex)}
                      onMouseLeave={() => setHoveredIndex(null)}
                      onClick={() => {
                        if (isCenter) {
                          handleDrillDown(item);
                        } else {
                          setActiveIndex(actualIndex);
                        }
                      }}
                    >
                      <div
                        className={`w-48 h-64 rounded-2xl p-5 bg-gradient-to-br ${colors.bg} text-white shadow-2xl transition-shadow duration-300`}
                        style={{
                          boxShadow: isHovered || isCenter
                            ? `0 25px 50px -12px ${colors.glow}, 0 0 40px ${colors.glow}`
                            : '0 10px 30px -10px rgba(0,0,0,0.5)',
                        }}
                      >
                        {/* Type badge */}
                        <div className="flex items-center gap-2 mb-4">
                          <Icon size={18} className="opacity-80" />
                          <span className="text-xs uppercase tracking-wider opacity-70">
                            {item.type}
                          </span>
                        </div>

                        {/* Name */}
                        <h3 className="text-lg font-bold leading-tight mb-3">
                          {item.name}
                        </h3>

                        {/* Children count */}
                        {hasChildren && (
                          <div className="mt-auto">
                            <div className="flex items-center gap-2 text-sm opacity-70">
                              <Layers size={14} />
                              <span>{item.children!.length} items</span>
                            </div>
                          </div>
                        )}

                        {/* Drill down indicator */}
                        {hasChildren && isCenter && (
                          <motion.div
                            className="absolute bottom-4 right-4"
                            animate={{ y: [0, 4, 0] }}
                            transition={{ repeat: Infinity, duration: 1.5 }}
                          >
                            <ChevronRight size={24} className="opacity-60" />
                          </motion.div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>

            {/* Right arrow */}
            <button
              onClick={handleNext}
              disabled={activeIndex === itemCount - 1}
              className={`absolute right-4 z-20 p-3 rounded-full bg-white/10 backdrop-blur-sm transition-all ${
                activeIndex === itemCount - 1
                  ? 'opacity-30 cursor-not-allowed'
                  : 'hover:bg-white/20 hover:scale-110'
              }`}
            >
              <ChevronRight size={28} className="text-white" />
            </button>
          </>
        )}
      </div>

      {/* Navigation dots */}
      {itemCount > 1 && (
        <div className="relative z-10 pb-6 flex justify-center gap-2">
          {items.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setActiveIndex(idx)}
              className={`w-2 h-2 rounded-full transition-all ${
                idx === activeIndex
                  ? 'bg-white w-6'
                  : 'bg-white/30 hover:bg-white/50'
              }`}
            />
          ))}
        </div>
      )}

      {/* Go up button */}
      {pathStack.length > 1 && (
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={handleGoUp}
          className="absolute bottom-6 left-6 flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
        >
          <ChevronUp size={18} />
          Back
        </motion.button>
      )}
    </div>
  );
};

export default OrbitCarousel;
