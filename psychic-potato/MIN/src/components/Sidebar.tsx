import React, { useState } from 'react';
import { Search, Layers, Database, Cpu, FileText, ChevronRight, ChevronDown, Circle } from 'lucide-react';
import { useStore } from '../store/useStore';
import inventoryData from '../data/inventory.json';

const TreeItem: React.FC<{ item: any; depth?: number }> = ({ item, depth = 0 }) => {
  const [isOpen, setIsOpen] = useState(depth < 1); // Open root and first level by default
  const { setSelectedNode, selectedNode, nodes } = useStore();
  
  const hasChildren = item.children && item.children.length > 0;
  
  // Find the corresponding node in the ReactFlow graph to get the correct ID/Node object
  // This is a simplified lookup. Ideally we'd map IDs better.
  const handleSelect = () => {
    const node = nodes.find(n => n.data.name === item.name);
    if (node) {
      setSelectedNode(node);
    }
  };

  const isSelected = selectedNode?.data?.name === item.name;

  return (
    <div className="select-none">
      <div 
        className={`flex items-center gap-2 py-1 px-2 rounded cursor-pointer transition-colors ${
          isSelected ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100 text-gray-700'
        }`}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
        onClick={handleSelect}
      >
        <div 
          onClick={(e) => {
            if (hasChildren) {
              e.stopPropagation();
              setIsOpen(!isOpen);
            }
          }}
          className={`p-0.5 rounded hover:bg-gray-200 ${hasChildren ? 'visible' : 'invisible'}`}
        >
          {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </div>
        
        {item.type === 'category' ? <Layers size={14} className="text-gray-500" /> : 
         item.type === 'project' ? <Database size={14} className="text-green-600" /> :
         item.type === 'device_config' ? <Cpu size={14} className="text-purple-600" /> :
         <Circle size={8} className="text-gray-400" />}
         
        <span className="text-sm truncate">{item.name}</span>
      </div>
      
      {isOpen && hasChildren && (
        <div>
          {item.children.map((child: any, idx: number) => (
            <TreeItem key={idx} item={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
};

const Sidebar: React.FC = () => {
  const { searchQuery, setSearchQuery } = useStore();

  const legendItems = [
    { type: 'Category', color: '#4b5563', icon: Layers },
    { type: 'Project', color: '#16a34a', icon: Database },
    { type: 'Config', color: '#ea580c', icon: FileText },
    { type: 'Device', color: '#9333ea', icon: Cpu },
    { type: 'Reference', color: '#0891b2', icon: FileText },
    { type: 'Sensor', color: '#dc2626', icon: Cpu },
  ];

  return (
    <div className="w-80 h-full bg-white border-r border-gray-200 flex flex-col z-10 shadow-sm flex-shrink-0">
      <div className="p-4 border-b border-gray-200">
        <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <Database className="text-blue-600" />
          KDS Schema
        </h1>
        <p className="text-xs text-gray-500 mt-1">Reference Inventory Viewer</p>
      </div>

      <div className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search schema..."
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        <div className="mb-6">
          <h3 className="px-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Explorer</h3>
          <TreeItem item={inventoryData} />
        </div>

        <div className="px-2">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Legend</h3>
          <div className="space-y-2">
            {legendItems.map((item) => (
              <div key={item.type} className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-50 transition-colors">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-sm text-gray-600">{item.type}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <div className="p-4 border-t border-gray-200 text-xs text-gray-400 text-center">
        v1.0.0 • KVN Coordinator
      </div>
    </div>
  );
};

export default Sidebar;
