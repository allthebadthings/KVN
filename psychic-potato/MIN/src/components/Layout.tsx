import React from 'react';
import Sidebar from './Sidebar';
import SchemaViewer from './SchemaViewer';
import DetailsPanel from './DetailsPanel';

const Layout: React.FC = () => {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-gray-50">
      <Sidebar />
      <div className="flex-1 relative">
        <SchemaViewer />
        <DetailsPanel />
      </div>
    </div>
  );
};

export default Layout;
