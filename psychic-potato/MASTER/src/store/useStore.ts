import { create } from 'zustand';
import { Node, Edge, OnNodesChange, OnEdgesChange, applyNodeChanges, applyEdgeChanges } from 'reactflow';
import inventoryData from '../data/inventory.json';

const POSITIONS_KEY = 'kvn-schema-node-positions';

// Save positions to localStorage
const savePositions = (nodes: Node[]) => {
  const positions: Record<string, { x: number; y: number }> = {};
  nodes.forEach(node => {
    positions[node.id] = node.position;
  });
  localStorage.setItem(POSITIONS_KEY, JSON.stringify(positions));
};

// Load positions from localStorage
export const loadSavedPositions = (): Record<string, { x: number; y: number }> | null => {
  const saved = localStorage.getItem(POSITIONS_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      return null;
    }
  }
  return null;
};

// Clear saved positions
export const clearSavedPositions = () => {
  localStorage.removeItem(POSITIONS_KEY);
};

interface AppState {
  nodes: Node[];
  edges: Edge[];
  selectedNode: any | null;
  layoutMode: 'tree' | 'force';
  searchQuery: string;
  activeView: 'schema' | 'rules';

  setNodes: (nodes: Node[]) => void;
  setEdges: (edges: Edge[]) => void;
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  setSelectedNode: (node: any | null) => void;
  setLayoutMode: (mode: 'tree' | 'force') => void;
  setSearchQuery: (query: string) => void;
  setActiveView: (view: 'schema' | 'rules') => void;
  resetLayout: () => void;
}

export const useStore = create<AppState>((set, get) => ({
  nodes: [],
  edges: [],
  selectedNode: null,
  layoutMode: 'tree',
  searchQuery: '',
  activeView: 'schema',

  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),

  onNodesChange: (changes) => {
    const newNodes = applyNodeChanges(changes, get().nodes);
    set({ nodes: newNodes });
    // Save positions when nodes are dragged
    const hasDrag = changes.some(c => c.type === 'position' && c.dragging === false);
    if (hasDrag) {
      savePositions(newNodes);
    }
  },

  onEdgesChange: (changes) => {
    set({
      edges: applyEdgeChanges(changes, get().edges),
    });
  },

  setSelectedNode: (node) => set({ selectedNode: node }),
  setLayoutMode: (mode) => set({ layoutMode: mode }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setActiveView: (view) => set({ activeView: view }),

  resetLayout: () => {
    clearSavedPositions();
    // Trigger a page reload to reset layout
    window.location.reload();
  },
}));
