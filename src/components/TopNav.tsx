import React from 'react';

type NavPage = 'dashboard' | 'inventory' | 'colmenas' | 'cosechas';

type Props = {
  page: NavPage;
  onNavigate: (p: NavPage) => void;
  onLogout?: () => void;
  userEmail?: string | null | undefined;
};

const TopNav: React.FC<Props> = ({ page, onNavigate, onLogout }) => {
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

        <button
          className={`nav-btn ${page === 'colmenas' ? 'active' : ''}`}
          onClick={() => onNavigate('colmenas')}
          aria-current={page === 'colmenas' ? 'page' : undefined}
          title="Colmenas"
        >
          <div className="nav-emoji">🐝</div>
          <span className="nav-label">Colmenas</span>
        </button>

        <button
          className={`nav-btn ${page === 'cosechas' ? 'active' : ''}`}
          onClick={() => onNavigate('cosechas')}
          aria-current={page === 'cosechas' ? 'page' : undefined}
          title="Cosechas"
        >
          <div className="nav-emoji">🍯</div>
          <span className="nav-label">Cosechas</span>
        </button>

        <div className="nav-spacer" />

        

        <button className="nav-btn logout" onClick={onLogout} title="Cerrar sesión">
          <div className="nav-emoji">🔒</div>
          <span className="nav-label">Salir</span>
        </button>
      </div>
    </nav>
  );
};

export default TopNav;
