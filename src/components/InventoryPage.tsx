import React from 'react';
import InventoryList from './InventoryList';

type Props = {
  onBack?: () => void;
};

const InventoryPage: React.FC<Props> = () => {
  return (
    <div className="dashboard-container">
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <h2 style={{ margin: 0 }}>Inventario</h2>
      </div>
      <InventoryList />
    </div>
  );
};

export default InventoryPage;
