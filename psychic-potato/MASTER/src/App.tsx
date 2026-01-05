import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import Layout from './components/Layout';
import SchemaViewer from './components/SchemaViewer';
import DetailsPanel from './components/DetailsPanel';
import RulesPage from './pages/RulesPage';
import OrbitalRingsPage from './pages/OrbitalRingsPage';
import OrbitCarousel from './components/OrbitCarousel';
import { useStore, loadSavedPositions } from './store/useStore';
import { transformDataToFlow } from './utils/transformData';
import inventoryData from './data/inventory.json';

// Wrapper to handle layout with routing
const AppContent: React.FC = () => {
  const { setNodes, setEdges } = useStore();

  useEffect(() => {
    // Transform initial data
    const { nodes, edges } = transformDataToFlow(inventoryData);

    // Apply saved positions if available
    const savedPositions = loadSavedPositions();
    if (savedPositions) {
      const nodesWithSavedPositions = nodes.map(node => {
        if (savedPositions[node.id]) {
          return { ...node, position: savedPositions[node.id] };
        }
        return node;
      });
      setNodes(nodesWithSavedPositions);
    } else {
      setNodes(nodes);
    }
    setEdges(edges);
  }, [setNodes, setEdges]);

  return (
    <Layout>
      <Routes>
        <Route path="/" element={
          <>
            <SchemaViewer />
            <DetailsPanel />
          </>
        } />
        <Route path="/carousel" element={<OrbitCarousel />} />
        <Route path="/rules" element={<RulesPage />} />
        <Route path="/orbital-rings" element={<OrbitalRingsPage />} />
      </Routes>
    </Layout>
  );
};

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
};

export default App;
