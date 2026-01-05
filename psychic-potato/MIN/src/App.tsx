import React, { useEffect } from 'react';
import Layout from './components/Layout';
import { useStore } from './store/useStore';
import { transformDataToFlow } from './utils/transformData';
import inventoryData from './data/inventory.json';

const App: React.FC = () => {
  const { setNodes, setEdges } = useStore();

  useEffect(() => {
    // Transform initial data
    const { nodes, edges } = transformDataToFlow(inventoryData);
    setNodes(nodes);
    setEdges(edges);
  }, [setNodes, setEdges]);

  return (
    <Layout />
  );
};

export default App;
