import React, { useEffect, useState, useRef } from 'react';
import { fetchGraphQL } from '../api/graphqlClient';

type Props = {
    userEmail?: string;
    onLogout?: () => void;
    onOpenInventory?: () => void;
    onOpenColmenas?: () => void;
    onOpenCosechas?: () => void;
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
    targetPage?: 'colmenas' | 'inventory' | 'cosechas';
    targetItemId?: string;
};

// type Task = {
//     id: string;
//     scheduled?: string | { seconds?: number };
//     location?: string;
//     time?: string;
//     description?: string;
//     dueIn?: string;
// };

type FirestoreTimestampLike = { toDate?: () => Date; seconds?: number };

type Insumo = {
    id: string;
    nombre: string;
    cantidad?: number;
};

 

const DashboardScreen: React.FC<Props> = ({ userEmail, onOpenInventory, onOpenColmenas, onOpenCosechas }) => {
    const [metrics, setMetrics] = useState<Metric>({});
    const [alerts, setAlerts] = useState<Alert[]>([]);
    // const [tasks, setTasks] = useState<Task[]>([]);
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
                edadReinaMeses
                cantidadAlzas
                fechaInstalacion
            } 
            insumos { 
                id 
                nombre 
                cantidad 
            }
            cosechas {
                id
                cantidadKg
                fecha
                colmenaId
                humedad
                panalesExtraidos
                floracion
                operador
            }
        }`;

        const fetchOnce = async () => {
            try {
                const data = await fetchGraphQL(GET_DASHBOARD);
                if (!mounted) return;
                const colmenas: Array<{ id: string; codigo?: string; estado?: boolean; edadReinaMeses?: number; cantidadAlzas?: number; fechaInstalacion?: string }> = data?.colmenas ?? [];
                const insumos = data?.insumos ?? [];
                const cosechas = data?.cosechas ?? [];

                // Count active colmenas (estado = true)
                const colmenasActivas = colmenas.filter((c: { estado?: boolean }) => c.estado === true).length;

                // Calculate miel del mes actual
                const currentDate = new Date();
                const currentMonth = currentDate.getMonth();
                const currentYear = currentDate.getFullYear();

                const mielDelMes = cosechas
                    .filter((cosecha: { fecha?: string; cantidadKg?: number }) => {
                        if (!cosecha.fecha) return false;
                        const cosechaDate = new Date(cosecha.fecha);
                        return (
                            cosechaDate.getMonth() === currentMonth &&
                            cosechaDate.getFullYear() === currentYear
                        );
                    })
                    .reduce((total: number, cosecha: { cantidadKg?: number }) => {
                        return total + (cosecha.cantidadKg ?? 0);
                    }, 0);

                // Build metrics from available data
                setMetrics({
                    colmenasActive: colmenasActivas,
                    mielThisMonth: `${mielDelMes.toFixed(1)} kg`,
                    metricStatus: colmenasActivas > 0 
                        ? `${colmenasActivas} de ${colmenas.length} colmenas activas` 
                        : 'Sin colmenas activas'
                });

                // Create alerts based on colmenas and cosechas
                const mappedAlerts: Alert[] = [];
                let alertIdx = 0;

                // 1. Alerta: Reemplazo de Reina por Edad (edadReinaMeses > 18)
                colmenas.forEach((colmena: { id: string; codigo?: string; edadReinaMeses?: number; estado?: boolean }) => {
                    if (colmena.estado && (colmena.edadReinaMeses ?? 0) > 18) {
                        mappedAlerts.push({
                            id: `alert-${alertIdx++}`,
                            title: `Reemplazo de Reina: ${colmena.codigo || colmena.id}`,
                            description: `La reina tiene ${colmena.edadReinaMeses} meses. Se recomienda reemplazo para prevenir colapso y mantener producción.`,
                            severity: 'warning',
                            createdAt: new Date().toISOString(),
                            targetPage: 'colmenas',
                            targetItemId: colmena.id
                        });
                    }
                });

                // 2. Alerta: Necesidad Potencial de Alza (cantidadAlzas >= 3)
                colmenas.forEach((colmena: { id: string; codigo?: string; cantidadAlzas?: number; estado?: boolean }) => {
                    if (colmena.estado && (colmena.cantidadAlzas ?? 0) >= 3) {
                        mappedAlerts.push({
                            id: `alert-${alertIdx++}`,
                            title: `Considerar agregar alza: ${colmena.codigo || colmena.id}`,
                            description: `Colmena con ${colmena.cantidadAlzas} alzas. Puede requerir espacio adicional para evitar enjambrazón.`,
                            severity: 'info',
                            createdAt: new Date().toISOString(),
                            targetPage: 'colmenas',
                            targetItemId: colmena.id
                        });
                    }
                });

                // 3. Alerta: Colmena sin Inspeccionar (fechaInstalacion > 6 meses y sin cosechas en últimos 3 meses)
                const threeMonthsAgo = new Date();
                threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
                const sixMonthsAgo = new Date();
                sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

                colmenas.forEach((colmena: { id: string; codigo?: string; fechaInstalacion?: string; estado?: boolean }) => {
                    if (!colmena.estado || !colmena.fechaInstalacion) return;
                    
                    const fechaInstalacionDate = new Date(colmena.fechaInstalacion);
                    if (fechaInstalacionDate > sixMonthsAgo) return; // Colmena no tiene más de 6 meses
                    
                    // Verificar si tiene cosechas recientes (últimos 3 meses)
                    const tieneCosechasRecientes = cosechas.some((cosecha: { colmenaId?: string; fecha?: string }) => {
                        if (cosecha.colmenaId !== colmena.id) return false;
                        if (!cosecha.fecha) return false;
                        const cosechaDate = new Date(cosecha.fecha);
                        return cosechaDate >= threeMonthsAgo;
                    });

                    if (!tieneCosechasRecientes) {
                        mappedAlerts.push({
                            id: `alert-${alertIdx++}`,
                            title: `Colmena sin inspeccionar: ${colmena.codigo || colmena.id}`,
                            description: `Instalada hace más de 6 meses sin cosechas recientes. Verificar estado y productividad.`,
                            severity: 'warning',
                            createdAt: new Date().toISOString(),
                            targetPage: 'colmenas',
                            targetItemId: colmena.id
                        });
                    }
                });

                // 4. Alerta: Colmena Inactiva (estado = false)
                colmenas.forEach((colmena: { id: string; codigo?: string; estado?: boolean }) => {
                    if (colmena.estado === false) {
                        mappedAlerts.push({
                            id: `alert-${alertIdx++}`,
                            title: `Colmena inactiva: ${colmena.codigo || colmena.id}`,
                            description: `Colmena marcada como inactiva. Confirmar estado y actualizar inventario.`,
                            severity: 'critical',
                            createdAt: new Date().toISOString(),
                            targetPage: 'colmenas',
                            targetItemId: colmena.id
                        });
                    }
                });

                // 5. Alertas de insumos con stock bajo (mantener las existentes)
                insumos
                    .filter((i: Insumo) => (i.cantidad ?? 0) < 5)
                    .sort((a: Insumo, b: Insumo) => {
                        const cantA = a.cantidad ?? 0;
                        const cantB = b.cantidad ?? 0;
                        return cantA - cantB;
                    })
                    .forEach((i: Insumo) => {
                        const cantidad = i.cantidad ?? 0;
                        const isNegative = cantidad < 0;
                        mappedAlerts.push({
                            id: `alert-${alertIdx++}`,
                            title: isNegative ? `Stock negativo: ${i.nombre}` : `Stock bajo: ${i.nombre}`,
                            description: `Cantidad disponible: ${cantidad}`,
                            severity: isNegative ? 'critical' : 'warning',
                            createdAt: new Date().toISOString(),
                            targetPage: 'inventory',
                            targetItemId: i.id
                        });
                    });

                // 6. Alerta: Riesgo de Fermentación por Humedad (humedad > 18.5%)
                cosechas.forEach((cosecha: { id: string; humedad?: number; colmenaId?: string }) => {
                    if ((cosecha.humedad ?? 0) > 18.5) {
                        const colmenaIdSinPrefijo = cosecha.colmenaId?.replace('colmenas/', '') || '';
                        const colmena = colmenas.find(c => c.id === colmenaIdSinPrefijo);
                        if (!colmena) return;
                        mappedAlerts.push({
                            id: `alert-${alertIdx++}`,
                            title: `Riesgo de fermentación: ${colmena.codigo || colmena.id}`,
                            description: `Humedad de ${cosecha.humedad?.toFixed(1)}% detectada. Separar lote y dar tratamiento inmediato para evitar fermentación.`,
                            severity: 'critical',
                            createdAt: new Date().toISOString(),
                            targetPage: 'cosechas',
                            targetItemId: cosecha.id
                        });
                    }
                });

                // 7. Alerta: Bajo Rendimiento por Panal (cantidadKg / panalesExtraidos < 1.0 kg/panal)
                cosechas.forEach((cosecha: { id: string; cantidadKg?: number; panalesExtraidos?: number; colmenaId?: string }) => {
                    const panalesExtraidos = cosecha.panalesExtraidos ?? 0;
                    const cantidadKg = cosecha.cantidadKg ?? 0;
                    
                    if (panalesExtraidos > 0 && (cantidadKg / panalesExtraidos) < 1.0) {
                        const colmenaIdSinPrefijo = cosecha.colmenaId?.replace('colmenas/', '') || '';
                        const colmena = colmenas.find(c => c.id === colmenaIdSinPrefijo);
                        if (!colmena) return;
                        const rendimiento = (cantidadKg / panalesExtraidos).toFixed(1);
                        mappedAlerts.push({
                            id: `alert-${alertIdx++}`,
                            title: `Bajo rendimiento: ${colmena.codigo || colmena.id}`,
                            description: `Rendimiento de ${rendimiento} kg por panal. Puede indicar problemas de sanidad, orfandad o falta de floración.`,
                            severity: 'warning',
                            createdAt: new Date().toISOString(),
                            targetPage: 'colmenas',
                            targetItemId: cosecha.colmenaId || ''
                        });
                    }
                });

                // 8. Alerta: Registro de Cosecha Incompleto (floracion y/o operador vacíos)
                cosechas.forEach((cosecha: { id: string; floracion?: string; operador?: string; colmenaId?: string }) => {
                    const floracionVacia = !cosecha.floracion || cosecha.floracion.trim() === '';
                    const operadorVacio = !cosecha.operador || cosecha.operador.trim() === '';
                    
                    if (floracionVacia || operadorVacio) {
                        const camposFaltantes: string[] = [];
                        if (floracionVacia) camposFaltantes.push('floración');
                        if (operadorVacio) camposFaltantes.push('operador');
                        
                        const colmenaIdSinPrefijo = cosecha.colmenaId?.replace('colmenas/', '') || '';
                        const colmena = colmenas.find(c => c.id === colmenaIdSinPrefijo);
                        if (!colmena) return;
                        
                        mappedAlerts.push({
                            id: `alert-${alertIdx++}`,
                            title: `Datos incompletos: ${colmena.codigo || colmena.id}`,
                            description: `Falta información de ${camposFaltantes.join(' y ')}. Completar registro para mejorar trazabilidad.`,
                            severity: 'warning',
                            createdAt: new Date().toISOString(),
                            targetPage: 'cosechas',
                            targetItemId: cosecha.id
                        });
                    }
                });

                // Ordenar alertas por severidad (critical > warning > info)
                const severityOrder: { [key: string]: number } = { critical: 0, warning: 1, info: 2 };
                mappedAlerts.sort((a, b) => {
                    const severityA = severityOrder[a.severity || 'info'] ?? 999;
                    const severityB = severityOrder[b.severity || 'info'] ?? 999;
                    return severityA - severityB;
                });

                setAlerts(mappedAlerts);
                // no explicit tasks in this schema; leave empty or map if needed
                // setTasks([]);
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

    // const formatScheduled = (val: unknown) => {
    //     // Firestore Timestamp -> Date
    //     try {
    //         if (!val) return '';
    //         if ((val as FirestoreTimestampLike).toDate) return (val as FirestoreTimestampLike).toDate!().toLocaleString();
    //         if (typeof val === 'string') return val;
    //         if ((val as FirestoreTimestampLike).seconds) return new Date((val as FirestoreTimestampLike).seconds! * 1000).toLocaleString();
    //         return String(val);
    //     } catch {
    //         return String(val);
    //     }
    // };

    const handleAlertClick = (alert: Alert) => {
        if (!alert.targetPage) return;
        
        // Guardar el ID del item en localStorage para que la página destino pueda usarlo
        if (alert.targetItemId) {
            sessionStorage.setItem('targetItemId', alert.targetItemId);
        }
        
        // Navegar a la página correspondiente
        if (alert.targetPage === 'inventory' && onOpenInventory) {
            onOpenInventory();
        } else if (alert.targetPage === 'colmenas' && onOpenColmenas) {
            onOpenColmenas();
        } else if (alert.targetPage === 'cosechas' && onOpenCosechas) {
            onOpenCosechas();
        }
    };

    // const nextTask: Task | undefined = tasks[0];

    return (
        <div className="dashboard-container">
            {/* Debug panel removed (was used temporarily during troubleshooting) */}

            {/* Encabezado de Bienvenida */}
            <div className="welcome-header">
                <div className="welcome-content">
                    <div className="welcome-icon-wrapper">
                        <GreetingIcon />
                    </div>
                    <div className="welcome-text">
                        <h2 className="greeting">Hola{userEmail ? `, ${userEmail}` : ', Carlos'}!</h2>
                        <p className="tagline-sm">Gestiona tus apiarios de un vistazo</p>
                    </div>
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
            <h3 className="section-title">Alertas ({alerts.length})</h3>
            {loading && <div> Leyendo datos...</div>}
            {error && <div style={{ color: 'crimson' }}>Error: {error}</div>}
            
            {alerts.length === 0 ? (
                <div className="alert-card card-green">
                    <div className="alert-content">
                        <p className="alert-title">Sin alertas</p>
                        <p className="alert-description">No hay alertas en este momento. Todas las colmenas están en buen estado.</p>
                    </div>
                    <div className="alert-icon-container">
                        <div className="alert-icon">✓</div>
                    </div>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {alerts.slice(0, 5).map((alert) => {
                        // Determinar el color de la tarjeta según la severidad
                        let cardClass = 'alert-card card-amber';
                        let iconSymbol = 'i';
                        if (alert.severity === 'critical') {
                            cardClass = 'alert-card card-red';
                            iconSymbol = '!';
                        } else if (alert.severity === 'warning') {
                            cardClass = 'alert-card card-amber';
                            iconSymbol = '⚠';
                        } else if (alert.severity === 'info') {
                            cardClass = 'alert-card card-blue';
                            iconSymbol = 'i';
                        }

                        return (
                            <div 
                                key={alert.id} 
                                className={cardClass}
                                onClick={() => handleAlertClick(alert)}
                                style={{ 
                                    cursor: alert.targetPage ? 'pointer' : 'default',
                                    transition: 'transform 0.2s, box-shadow 0.2s'
                                }}
                                onMouseEnter={(e) => {
                                    if (alert.targetPage) {
                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                        e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = '';
                                }}
                            >
                                <div className="alert-content">
                                    <p className="alert-title">{alert.title}</p>
                                    <p className="alert-description">
                                        {alert.description}
                                        {alert.targetPage && (
                                            <span style={{ 
                                                marginLeft: '8px', 
                                                fontSize: '12px', 
                                                opacity: 0.7,
                                                fontStyle: 'italic'
                                            }}>
                                                (Atender alerta)
                                            </span>
                                        )}
                                    </p>
                                </div>
                                <div className="alert-icon-container">
                                    <div className="alert-icon">{iconSymbol}</div>
                                </div>
                            </div>
                        );
                    })}
                    {alerts.length > 5 && (
                        <p style={{ fontSize: '14px', color: '#666', textAlign: 'center', marginTop: '8px' }}>
                            Y {alerts.length - 5} alerta{alerts.length - 5 > 1 ? 's' : ''} más...
                        </p>
                    )}
                </div>
            )}

            {/* --- Próxima Tarea --- */}
            {/* <h3 className="section-title">Próxima tarea</h3>
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
            </div> */}
            {/* navigation button removed; TopNav handles navigation */}
        </div>
    );
};

export default DashboardScreen;