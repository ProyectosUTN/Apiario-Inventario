import React, { useEffect, useState } from 'react';
import './App.css'; // Importamos el CSS completo
import LoginScreen from './components/LoginScreen';
import DashboardScreen from './components/DashboardScreen';
import InventoryPage from './components/InventoryPage';
import ColmenaPage from './components/ColmenaPage';
import CosechaPage from './components/CosechaPage';
import TopNav from './components/TopNav';
import { auth } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import type { User } from 'firebase/auth';

// --- Componente Raíz de la Aplicación ---
const App: React.FC = () => {
	const [user, setUser] = useState<User | null>(null);
	const [checkingAuth, setCheckingAuth] = useState(true);
	const [page, setPage] = useState<'dashboard' | 'inventory' | 'colmenas' | 'cosechas'>('dashboard');

	useEffect(() => {
		// Si `auth` no está inicializado, no podemos suscribirnos ni leer user
		if (!auth) {
			setCheckingAuth(false);
			return;
		}

		// 1) Revisar usuario en caché inmediatamente (síncrono)
		const cached = auth.currentUser;
		if (cached) {
			setUser(cached);
			setCheckingAuth(false);
		}

		// 2) Suscribirse a cambios de autenticación (login / logout)
		const unsub = onAuthStateChanged(auth, (u) => {
			setUser(u);
			setCheckingAuth(false);
		});
		return unsub;
	}, []);

	// Nuevo: manejador de logout que se pasa al Dashboard
	const handleLogout = async () => {
		try {
			if (!auth) {
				console.warn('Auth no inicializado: no se puede cerrar sesión');
				return;
			}
			await signOut(auth);
		} catch (err) {
			console.error('Error al cerrar sesión:', err);
		}
	};

	if (checkingAuth) {
		return (
			<div className="app-wrapper">
				<div className="login-container">
					<p>Cargando...</p>
				</div>
			</div>
		);
	}

	return (
		<div className="app-wrapper">
			{user ? (
				<>
					{page === 'dashboard' ? (
						<DashboardScreen userEmail={user.email ?? undefined} onLogout={handleLogout} onOpenInventory={() => setPage('inventory')} />
					) : page === 'inventory' ? (
						<InventoryPage onBack={() => setPage('dashboard')} />
					) : page === 'colmenas' ? (
						<ColmenaPage onBack={() => setPage('dashboard')} />
					) : (
						<CosechaPage onBack={() => setPage('dashboard')} />
					)}
					<TopNav page={page} onNavigate={(p) => setPage(p)} onLogout={handleLogout} userEmail={user?.email ?? undefined} />
				</>
			) : (
				<LoginScreen />
			)}
		</div>
	);
};

export default App;