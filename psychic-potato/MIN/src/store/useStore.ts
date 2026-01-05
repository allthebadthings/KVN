import { create } from 'zustand';
import { Node, Edge, OnNodesChange, OnEdgesChange, applyNodeChanges, applyEdgeChanges } from 'reactflow';
import inventoryData from '../data/inventory.json';

interface AppState {
  nodes: Node[];
  edges: Edge[];
  selectedNode: any | null;
  layoutMode: 'tree' | 'force';
  searchQuery: string;
  
  setNodes: (nodes: Node[]) => void;
  setEdges: (edges: Edge[]) => void;
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  setSelectedNode: (node: any | null) => void;
  setLayoutMode: (mode: 'tree' | 'force') => void;
  setSearchQuery: (query: string) => void;
}

export const useStore = create<AppState>((set, get) => ({
  nodes: [],
  edges: [],
  selectedNode: null,
  layoutMode: 'tree',
  searchQuery: '',

  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),
  
  onNodesChange: (changes) => {
    set({
      nodes: applyNodeChanges(changes, get().nodes),
    });
  },
  
  onEdgesChange: (changes) => {
    set({
      edges: applyEdgeChanges(changes, get().edges),
    });
  },

  setSelectedNode: (node) => set({ selectedNode: node }),
  setLayoutMode: (mode) => set({ layoutMode: mode }),
  setSearchQuery: (query) => set({ searchQuery: query }),
}));
