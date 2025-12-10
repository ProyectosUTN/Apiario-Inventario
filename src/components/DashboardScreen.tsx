import React, { useEffect, useState, useRef } from 'react';
import { fetchGraphQL } from '../api/graphqlClient';

type Props = {
    userEmail?: string;
    onLogout?: () => void;
    onOpenInventory?: () => void;
};

// Componente para el icono del saludo (Emoji de abeja simulado)
const GreetingIcon: React.FC = () => (
    <span style={{ fontSize: '20px', marginRight: '5px' }}>🍯</span>
);

type Metric = {
    colmenasActive?: number;
    mielThisMonth?: number | string;
    metricStatus?: string;
};

type Alert = {
    id: string;
    title?: string;
    description?: string;
    link?: string;
    severity?: string;
    createdAt?: FirestoreTimestampLike | string | number;
};

type Task = {
    id: string;
    scheduled?: string | { seconds?: number };
    location?: string;
    time?: string;
    description?: string;
    dueIn?: string;
};

type FirestoreTimestampLike = { toDate?: () => Date; seconds?: number };

type Insumo = {
    id: string;
    nombre: string;
    cantidad?: number;
};

 

const DashboardScreen: React.FC<Props> = ({ userEmail, onLogout }) => {
    const [metrics, setMetrics] = useState<Metric>({});
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    // removed debugInfo state (was used for temporary debug panel)

    const pollRef = useRef<number | null>(null);

    useEffect(() => {
        // Query the GraphQL API for dashboard data and poll for updates.
        let mounted = true;

        const GET_DASHBOARD = `query GetDashboard { 
            colmenas { 
                id 
                estado 
                apiarioID 
                codigo 
            } 
            insumos { 
                id 
                nombre 
                cantidad 
            } 
        }`;

        const fetchOnce = async () => {
            try {
                const data = await fetchGraphQL(GET_DASHBOARD);
                if (!mounted) return;
                const colmenas = data?.colmenas ?? [];
                const insumos = data?.insumos ?? [];

                // Count active colmenas (estado = true)
                const colmenasActivas = colmenas.filter((c: { estado?: boolean }) => c.estado === true).length;

                // Build metrics from available data
                setMetrics({
                    colmenasActive: colmenasActivas,
                    mielThisMonth: '—',
                    metricStatus: colmenasActivas > 0 
                        ? `${colmenasActivas} de ${colmenas.length} colmenas activas` 
                        : 'Sin colmenas activas'
                });

                // Create simple alerts from insumos with low quantity
                // Prioritize: 1) Most negative stock, 2) Lowest positive stock
                const mappedAlerts: Alert[] = insumos
                    .filter((i: Insumo) => (i.cantidad ?? 0) < 5)
                    .sort((a: Insumo, b: Insumo) => {
                        const cantA = a.cantidad ?? 0;
                        const cantB = b.cantidad ?? 0;
                        // Sort by quantity ascending (most negative first, then lowest positive)
                        return cantA - cantB;
                    })
                    .map((i: Insumo, idx: number) => {
                        const cantidad = i.cantidad ?? 0;
                        const isNegative = cantidad < 0;
                        return {
                            id: `alert-${idx}`,
                            title: isNegative ? `Stock negativo: ${i.nombre}` : `Stock bajo: ${i.nombre}`,
                            description: `Cantidad disponible: ${cantidad}`,
                            severity: isNegative ? 'critical' : 'warning',
                            createdAt: new Date().toISOString()
                        };
                    });
                setAlerts(mappedAlerts);
                // no explicit tasks in this schema; leave empty or map if needed
                setTasks([]);
                setError(null);
            } catch (e: unknown) {
                const errorMessage = e instanceof Error ? e.message : String(e);
                console.error('GraphQL dashboard fetch error', errorMessage);
                if (mounted) setError(errorMessage);
            } finally {
                if (mounted) setLoading(false);
            }
        };

        fetchOnce();
        pollRef.current = window.setInterval(() => fetchOnce(), 10000);

        return () => {
            mounted = false;
            if (pollRef.current) window.clearInterval(pollRef.current);
        };
    }, []);

    const formatScheduled = (val: unknown) => {
        // Firestore Timestamp -> Date
        try {
            if (!val) return '';
            if ((val as FirestoreTimestampLike).toDate) return (val as FirestoreTimestampLike).toDate!().toLocaleString();
            if (typeof val === 'string') return val;
            if ((val as FirestoreTimestampLike).seconds) return new Date((val as FirestoreTimestampLike).seconds! * 1000).toLocaleString();
            return String(val);
        } catch {
            return String(val);
        }
    };

    const firstAlert = alerts[0];
    const nextTask: Task | undefined = tasks[0];

    return (
        <div className="dashboard-container">
            {/* Debug panel removed (was used temporarily during troubleshooting) */}

            {/* Encabezado de Bienvenida */}
            <div className="welcome-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <p className="greeting">
                        <GreetingIcon /> Hola{userEmail ? `, ${userEmail}` : ', Carlos'}!
                    </p>
                    <p className="tagline-sm">Gestiona tus apiarios de un vistazo</p>
                </div>

                <div style={{ marginLeft: 'auto' }}>
                    {onLogout && (
                        <button
                            onClick={onLogout}
                            style={{
                                background: 'transparent',
                                border: '1px solid var(--border-color)',
                                padding: '6px 10px',
                                borderRadius: 6,
                                cursor: 'pointer'
                            }}
                        >
                            Cerrar sesión
                        </button>
                    )}
                </div>
            </div>

            {/* Sección de Métricas Principales (Grid) */}
            <div className="metrics-grid">
                {/* Tarjeta 1: Colmenas Activas */}
                <div className="metric-card card-green">
                    <p className="metric-title">Colmenas activas</p>
                    <div className="metric-value">{metrics.colmenasActive ?? '—'}</div>
                    <p className="metric-status">{metrics.metricStatus ?? 'Sin información'}</p>
                </div>

                {/* Tarjeta 2: Miel este mes */}
                <div className="metric-card card-green">
                    <p className="metric-title">Miel este mes</p>
                    <div className="metric-value">{metrics.mielThisMonth ?? '—'}</div>
                    <p className="metric-status">Producción acumulada</p>
                    <div className="icon-placeholder"></div>
                </div>
            </div>

            {/* --- Alertas --- */}
            <h3 className="section-title">Alertas</h3>
            {loading && <div> Leyendo datos...</div>}
            {error && <div style={{ color: 'crimson' }}>Error: {error}</div>}
            {/* Si no hay métricas ni alertas hay pistas en la consola: revisa projectId mostrado allí */}
            <div className="alert-card card-amber">
                <div className="alert-content">
                    <p className="alert-title">{firstAlert?.title ?? 'Sin alertas'}</p>
                    <p className="alert-description">{firstAlert?.description ?? 'No hay alertas críticas en este momento.'}</p>
                    {/* navigation links removed; TopNav handles page navigation */}
                </div>
                <div className="alert-icon-container">
                    <div className="alert-icon">i</div>
                </div>
            </div>

            {/* --- Próxima Tarea --- */}
            <h3 className="section-title">Próxima tarea</h3>
            <div className="task-card card-green">
                <div className="task-details">
                    <p className="task-scheduled">{nextTask ? formatScheduled((nextTask as Task).scheduled) : 'No hay tareas programadas'}</p>
                    <p className="task-location">{nextTask?.location ?? ''}</p>
                    <p className="task-time">{nextTask?.time ?? ''}</p>
                    <p className="task-description">{nextTask?.description ?? ''}</p>
                </div>
                <div className="task-status">
                    <span className="status-badge">{nextTask?.dueIn ?? ''}</span>
                </div>
            </div>
            {/* navigation button removed; TopNav handles navigation */}
        </div>
    );
};

export default DashboardScreen;