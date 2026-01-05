import React, { useCallback, useEffect } from 'react';
import ReactFlow, { 
  Background, 
  Controls, 
  MiniMap, 
  Node,
  useNodesState,
  useEdgesState,
  Edge,
  ReactFlowProvider,
  useReactFlow
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useStore } from '../store/useStore';

const SchemaViewerContent: React.FC = () => {
  const { 
    nodes, 
    edges, 
    onNodesChange, 
    onEdgesChange,
    setSelectedNode,
    selectedNode,
    searchQuery
  } = useStore();

  const { fitView, setCenter, getNodes } = useReactFlow();

  // Handle Node Click
  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
  }, [setSelectedNode]);

  // Handle Search Highlighting
  useEffect(() => {
    const currentNodes = getNodes();
    const updatedNodes = currentNodes.map((node) => {
      const isMatch = searchQuery 
        ? node.data.label.toLowerCase().includes(searchQuery.toLowerCase())
        : true;
      
      const isSelected = selectedNode?.id === node.id;

      return {
        ...node,
        style: {
          ...node.style,
          opacity: searchQuery && !isMatch ? 0.2 : 1,
          border: isSelected ? '2px solid #2563eb' : node.style?.border || '1px solid #777',
          boxShadow: isSelected ? '0 0 10px rgba(37, 99, 235, 0.3)' : 'none'
        }
      };
    });

    // Only update if there are changes to avoid infinite loop
    // But direct setNodes might cause loop if not careful. 
    // Actually, useStore's nodes are the source of truth.
    // We should update the store nodes.
    // However, calling setNodes here might be tricky if we are depending on `nodes` from store.
    
    // Better approach: Derived state or just applying styles in render? 
    // React Flow nodes are stateful. 
    // Let's rely on the store's nodes, but we need to update them when search/selection changes.
    // We can use a separate effect for this in the store or here.
    
  }, [searchQuery, selectedNode]); 

  // Since we can't easily modify nodes in-place without triggering re-renders, 
  // let's just pass the modified nodes to ReactFlow? 
  // No, ReactFlow needs internal state or onNodesChange.
  
  // Let's compute the display nodes.
  const displayNodes = nodes.map(node => {
     const isMatch = searchQuery 
        ? node.data.label.toLowerCase().includes(searchQuery.toLowerCase())
        : true;
      
     const isSelected = selectedNode?.id === node.id;
     
     return {
        ...node,
        style: {
          ...node.style,
          opacity: searchQuery && !isMatch ? 0.2 : 1,
          border: isSelected ? '2px solid #2563eb' : '1px solid #777',
          boxShadow: isSelected ? '0 0 10px rgba(37, 99, 235, 0.5)' : 'none',
          width: 160,
          fontSize: '11px',
          borderRadius: '8px',
          padding: '8px'
        }
     };
  });

  // Center on Selection
  useEffect(() => {
    if (selectedNode) {
      setCenter(selectedNode.position.x + 90, selectedNode.position.y + 40, { zoom: 1.2, duration: 800 });
    }
  }, [selectedNode, setCenter]);

  return (
    <div className="h-full w-full bg-slate-50">
      <ReactFlow
        nodes={displayNodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        fitView
        attributionPosition="bottom-right"
        minZoom={0.1}
        maxZoom={4}
      >
        <Background color="#ccc" gap={16} />
        <Controls />
        <MiniMap 
          nodeColor={(node) => {
             // Use the node's background color from style if available
             return (node.style?.background as string) || '#cbd5e1';
          }}
          nodeStrokeWidth={3} 
          zoomable 
          pannable 
        />
      </ReactFlow>
    </div>
  );
};

export default function SchemaViewer() {
  return (
    <ReactFlowProvider>
      <SchemaViewerContent />
    </ReactFlowProvider>
  );
}
