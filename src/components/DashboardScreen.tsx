import React, { useEffect, useState } from 'react';
import { doc, onSnapshot, collection, getDocs, type QuerySnapshot, type QueryDocumentSnapshot, type DocumentData } from 'firebase/firestore';
import { db, firebaseConfig, auth } from '../firebase';

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

type CheckedCollection = { name: string; size: number; ids: string[] };
type DebugInfo = {
    projectId: string;
    user: { uid?: string; email?: string | null } | null;
    checkedCollections: CheckedCollection[];
    result?: 'found' | 'not-found';
    dashboard?: { collectionSize?: number; metrics?: { exists?: boolean }; alerts?: { exists?: boolean } };
    rootMetricsDoc?: { exists?: boolean };
    rootAlertsDoc?: { exists?: boolean };
    rootCollections?: { metricsCollectionSize?: number; alertsCollectionSize?: number };
};

const DashboardScreen: React.FC<Props> = ({ userEmail, onLogout }) => {
    const [metrics, setMetrics] = useState<Metric>({});
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    // removed debugInfo state (was used for temporary debug panel)

    useEffect(() => {
        // Detección dinámica de estructura y debug inicial
        const candidateCollections = ['dashboard', 'dashboards', 'Dashboard', 'DashboardData'];
        const unsubscribers: (() => void)[] = [];

        const detectAndSubscribe = async () => {
            const projectId = firebaseConfig?.projectId ?? 'unknown';
            const user = auth?.currentUser ? { uid: auth.currentUser.uid, email: auth.currentUser.email } : null;
            let found = false;
            const info: DebugInfo = { projectId, user, checkedCollections: [] };

            for (const colName of candidateCollections) {
                try {
                    const collSnap = await getDocs(collection(db!, colName)) as QuerySnapshot<DocumentData>;
                    info.checkedCollections.push({ name: colName, size: collSnap.size, ids: collSnap.docs.map((d: QueryDocumentSnapshot<DocumentData>) => d.id) });

                    if (collSnap.size > 0) {
                        found = true;
                        // Buscar docs metrics/alerts por id dentro de la colección encontrada
                        const metricsDoc = collSnap.docs.find((d: QueryDocumentSnapshot<DocumentData>) => d.id === 'metrics') ?? collSnap.docs[0];
                        const alertsDoc = collSnap.docs.find((d: QueryDocumentSnapshot<DocumentData>) => d.id === 'alerts') ?? collSnap.docs.find((d: QueryDocumentSnapshot<DocumentData>) => d.id !== metricsDoc.id) ?? null;

                        // Suscribirse a metricsDoc
                        const mUnsub = onSnapshot(doc(db!, colName, metricsDoc.id), (snap) => {
                            if (snap.exists()) setMetrics(snap.data() as Metric);
                        }, (err) => setError(err?.message ?? String(err)));
                        unsubscribers.push(mUnsub);

                        // Suscribirse al documento de tareas si existe (id 'task' o 'tasks')
                        const taskDoc = collSnap.docs.find((d: QueryDocumentSnapshot<DocumentData>) => d.id === 'task')
                            ?? collSnap.docs.find((d: QueryDocumentSnapshot<DocumentData>) => d.id === 'tasks') ?? null;
                        if (taskDoc) {
                            const tUnsub = onSnapshot(doc(db!, colName, taskDoc.id), (snap) => {
                                if (snap.exists()) {
                                    const data = snap.data();
                                    // soportar doc que contiene un array de tareas o un objeto de tarea
                                    if (Array.isArray(data)) {
                                        setTasks(data.map((t: unknown, i: number) => ({ ...(t as Task), id: `${snap.id}-${i}` })));
                                    } else if ((data as Record<string, unknown>).tasks && Array.isArray((data as Record<string, unknown>).tasks)) {
                                        const arr = (data as Record<string, unknown>).tasks as unknown[];
                                        setTasks(arr.map((t: unknown, i: number) => ({ ...(t as Task), id: `${snap.id}-${i}` })));
                                    } else {
                                        setTasks([{ ...(data as Task), id: snap.id }]);
                                    }
                                } else {
                                    setTasks([]);
                                }
                            }, (err) => setError(err?.message ?? String(err)));
                            unsubscribers.push(tUnsub);
                        } else {
                            // no task doc found in this collection
                        }

                        // Suscribirse a alertsDoc si existe
                        if (alertsDoc) {
                            const aUnsub = onSnapshot(doc(db!, colName, alertsDoc.id), (snap) => {
                                if (snap.exists()) {
                                    const data = snap.data() as Omit<Alert, 'id'>;
                                    setAlerts([{ id: snap.id, ...data } as Alert]);
                                } else {
                                    setAlerts([]);
                                }
                            }, (err) => setError(err?.message ?? String(err)));
                            unsubscribers.push(aUnsub);
                        } else {
                            setAlerts([]);
                        }

                        // Si la colección tuvo al menos un doc, dejar de probar otras colecciones
                        break;
                    }
                } catch (e) {
                    console.warn('Error inspeccionando colección', colName, e);
                }
            }

            // Si no encontramos colecciones con docs, intentar leer campos dentro de un documento en una colección común (por ejemplo 'config' o 'app')
            if (!found) {
                // Lista de colecciones donde a veces se guardan configuraciones
                const altCollections = ['config', 'app', 'settings'];
                for (const col of altCollections) {
                    try {
                        const coll = await getDocs(collection(db!, col)) as QuerySnapshot<DocumentData>;
                        info.checkedCollections.push({ name: col, size: coll.size, ids: coll.docs.map((d: QueryDocumentSnapshot<DocumentData>) => d.id) });
                        if (coll.size > 0) {
                            // buscar en el primer doc campos metrics/alerts
                            const doc0 = coll.docs[0];
                            const data = doc0.data();
                            if (data && (data.metrics || data.alerts)) {
                                found = true;
                                if (data.metrics) setMetrics(data.metrics as Metric);
                                if (data.alerts) {
                                    const arr = Array.isArray(data.alerts) ? data.alerts : [data.alerts];
                                    setAlerts(arr.map((a: Partial<Alert>, i: number) => ({ ...(a as Alert), id: `${doc0.id}-${i}` })));
                                }
                                // suscribirse al doc0 para cambios
                                const dUnsub = onSnapshot(doc(db!, col, doc0.id), (snap) => {
                                    if (snap.exists()) {
                                        const d = snap.data();
                                        if (d.metrics) setMetrics(d.metrics as Metric);
                                        if (d.alerts) {
                                            const arr = Array.isArray(d.alerts) ? d.alerts : [d.alerts];
                                            setAlerts(arr.map((a: Partial<Alert>, i: number) => ({ ...(a as Alert), id: `${snap.id}-${i}` })));
                                        }
                                    }
                                }, (err) => setError(err?.message ?? String(err)));
                                unsubscribers.push(dUnsub);
                                break;
                            }
                        }
                    } catch (e) {
                        console.warn('Error inspeccionando colección alternativa', col, e);
                    }
                }
            }

            // Actualizar loading/error según resultado
            info.result = found ? 'found' : 'not-found';
            if (!found) {
                setError('No se encontraron documentos de dashboard/metrics o dashboard/alerts. Revisa rutas en Firestore Console.');
            }
            setLoading(false);
            // guardar unsub para limpieza
            return () => {
                unsubscribers.forEach(u => {
                    try {
                        u();
                    } catch (e) {
                        console.warn('unsubscribe error', e);
                    }
                });
            };
        };

        if (!db) {
            // Defer state updates to avoid sync setState inside effect body
            setTimeout(() => {
                setError('Firebase no inicializado.');
                setLoading(false);
            }, 0);
            return;
        }
        const cleanupPromise = detectAndSubscribe();

        // Cleanup: detectAndSubscribe returns a function; ensure it runs on unmount
        return () => {
            cleanupPromise.then(fn => {
                try {
                    if (typeof fn === 'function') fn();
                } catch (e) {
                    console.warn('cleanup promise error', e);
                }
            });
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