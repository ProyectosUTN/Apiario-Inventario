import React from 'react';

type NavPage = 'dashboard' | 'inventory';

type Props = {
  page: NavPage;
  onNavigate: (p: NavPage) => void;
  onLogout?: () => void;
  userEmail?: string | null | undefined;
};

const TopNav: React.FC<Props> = ({ page, onNavigate, onLogout, userEmail }) => {
  return (
    <nav className="topnav" aria-label="Barra de navegación">
      <div className="topnav-inner">
        <button
          className={`nav-btn ${page === 'dashboard' ? 'active' : ''}`}
          onClick={() => onNavigate('dashboard')}
          aria-current={page === 'dashboard' ? 'page' : undefined}
          title="Inicio"
        >
          <div className="nav-emoji">🏠</div>
          <span className="nav-label">Inicio</span>
        </button>

        <button
          className={`nav-btn ${page === 'inventory' ? 'active' : ''}`}
          onClick={() => onNavigate('inventory')}
          aria-current={page === 'inventory' ? 'page' : undefined}
          title="Inventario"
        >
          <div className="nav-emoji">📦</div>
          <span className="nav-label">Inventario</span>
        </button>

        <div className="nav-spacer" />

        <div className="nav-user" title={userEmail ?? ''}>
          {userEmail ? <span className="user-email">{userEmail}</span> : null}
        </div>

        <button className="nav-btn logout" onClick={onLogout} title="Cerrar sesión">
          <div className="nav-emoji">🔒</div>
          <span className="nav-label">Salir</span>
        </button>
      </div>
    </nav>
  );
};

export default TopNav;
