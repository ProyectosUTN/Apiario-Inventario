import React from 'react';
import InventoryList from './InventoryList';

type Props = {
  onBack?: () => void;
};

const InventoryPage: React.FC<Props> = () => {
  return (
    <div className="dashboard-container">
      {/* Encabezado de Página */}
      <div className="page-header">
        <div className="page-header-content">
          <div className="page-icon-wrapper">
            <span style={{ fontSize: '24px' }}>📋</span>
          </div>
          <div className="page-header-text">
            <h2 className="page-title">Inventario</h2>
          </div>
        </div>
      </div>
      <InventoryList />
    </div>
  );
};

export default InventoryPage;
