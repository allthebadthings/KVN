import React from 'react';
import { useStore } from '../store/useStore';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const DetailsPanel: React.FC = () => {
  const { selectedNode, setSelectedNode } = useStore();

  if (!selectedNode) return null;

  const { data } = selectedNode;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ x: 300, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 300, opacity: 0 }}
        className="fixed right-0 top-0 h-full w-80 bg-white shadow-xl border-l border-gray-200 p-6 overflow-y-auto z-50"
      >
        <div className="flex justify-between items-start mb-6">
          <h2 className="text-xl font-bold text-gray-900">{data.label}</h2>
          <button 
            onClick={() => setSelectedNode(null)}
            className="p-1 hover:bg-gray-100 rounded-full"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className={`px-2 py-1 text-xs font-semibold rounded-full text-white`} 
              style={{ backgroundColor: selectedNode.style.background }}>
              {data.type.toUpperCase()}
            </span>
          </div>

          {data.description && (
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">Description</h3>
              <p className="text-gray-700">{data.description}</p>
            </div>
          )}

          {data.tech && (
            <div>
               <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">Tech Stack</h3>
               <p className="text-gray-700 font-mono text-sm bg-gray-100 p-2 rounded">{data.tech}</p>
            </div>
          )}

          {data.features && (
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">Features</h3>
              <ul className="list-disc list-inside space-y-1 text-gray-700 text-sm">
                {data.features.map((feature: string, idx: number) => (
                  <li key={idx}>{feature}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Render other dynamic properties */}
          {Object.entries(data).map(([key, value]) => {
            if (['label', 'name', 'type', 'description', 'features', 'children', 'tech'].includes(key)) return null;
            if (typeof value === 'object' && value !== null) {
                 return (
                    <div key={key}>
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">{key.replace(/_/g, ' ')}</h3>
                        <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                            {JSON.stringify(value, null, 2)}
                        </pre>
                    </div>
                 )
            }
            return (
              <div key={key}>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">{key.replace(/_/g, ' ')}</h3>
                <p className="text-gray-700 text-sm break-words">{String(value)}</p>
              </div>
            );
          })}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default DetailsPanel;
