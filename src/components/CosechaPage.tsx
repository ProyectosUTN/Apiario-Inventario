import React, { useEffect, useState } from 'react';
import { fetchGraphQL } from '../api/graphqlClient';

type Colmena = {
    id: string;
    codigo?: string;
    tipo?: string;
    estado?: boolean;
    apiarioID?: string;
};

type Cosecha = {
    id: string;
    cantidadKg?: number;
    colmenaId?: string;
    fecha?: string;
    floracion?: string;
    humedad?: number;
    metodo?: string;
    notas?: string;
    operador?: string;
    panalesExtraidos?: number;
    tipoMiel?: string;
};

type Props = {
    onBack: () => void;
};

const CosechaPage: React.FC<Props> = () => {
    const [cosechas, setCosechas] = useState<Cosecha[]>([]);
    const [colmenas, setColmenas] = useState<Colmena[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [editingCosecha, setEditingCosecha] = useState<Cosecha | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [filterColmena, setFilterColmena] = useState<string>('');
    const [selectedApiario, setSelectedApiario] = useState<string>('');

    const [formData, setFormData] = useState<Partial<Cosecha>>({
        cantidadKg: 0,
        colmenaId: '',
        fecha: new Date().toISOString().split('T')[0],
        floracion: '',
        humedad: 0,
        metodo: 'centrifuga',
        notas: '',
        operador: '',
        panalesExtraidos: 0,
        tipoMiel: 'multifloral',
    });

    useEffect(() => {
        fetchCosechas();
        fetchColmenas();
    }, []);

    const fetchCosechas = async () => {
        try {
            setLoading(true);
            const GET_COSECHAS = `query GetCosechas { 
                cosechas { 
                    id 
                    cantidadKg
                    colmenaId
                    fecha
                    floracion
                    humedad
                    metodo
                    notas
                    operador
                    panalesExtraidos
                    tipoMiel
                } 
            }`;
            const data = await fetchGraphQL(GET_COSECHAS);
            setCosechas(data?.cosechas ?? []);
            setError(null);
        } catch (err) {
            setError('Error al cargar las cosechas');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchColmenas = async () => {
        try {
            const GET_COLMENAS = `query GetColmenas { 
                colmenas { 
                    id 
                    codigo
                    tipo
                    estado
                    apiarioID
                } 
            }`;
            const data = await fetchGraphQL(GET_COLMENAS);
            setColmenas(data?.colmenas ?? []);
        } catch (err) {
            console.error('Error al cargar colmenas:', err);
        }
    };

    const handleCreateNew = () => {
        setIsCreating(true);
        setEditingCosecha(null);
        setSelectedApiario('');
        setFormData({
            cantidadKg: 0,
            colmenaId: '',
            fecha: new Date().toISOString().split('T')[0],
            floracion: '',
            humedad: 0,
            metodo: 'centrifuga',
            notas: '',
            operador: '',
            panalesExtraidos: 0,
            tipoMiel: 'multifloral',
        });
    };

    const handleEdit = (cosecha: Cosecha) => {
        setIsCreating(false);
        setEditingCosecha(cosecha);
        // Establecer el apiario de la colmena seleccionada
        const colmenaIdOnly = cosecha.colmenaId?.split('/').pop() || '';
        const colmena = colmenas.find(c => c.id === colmenaIdOnly);
        setSelectedApiario(colmena?.apiarioID || '');
        setFormData({
            cantidadKg: cosecha.cantidadKg || 0,
            colmenaId: cosecha.colmenaId || '',
            fecha: cosecha.fecha || new Date().toISOString().split('T')[0],
            floracion: cosecha.floracion || '',
            humedad: cosecha.humedad || 0,
            metodo: cosecha.metodo || 'centrifuga',
            notas: cosecha.notas || '',
            operador: cosecha.operador || '',
            panalesExtraidos: cosecha.panalesExtraidos || 0,
            tipoMiel: cosecha.tipoMiel || 'multifloral',
        });
    };

    const handleCancel = () => {
        setIsCreating(false);
        setEditingCosecha(null);
        setSelectedApiario('');
        setFormData({
            cantidadKg: 0,
            colmenaId: '',
            fecha: new Date().toISOString().split('T')[0],
            floracion: '',
            humedad: 0,
            metodo: 'centrifuga',
            notas: '',
            operador: '',
            panalesExtraidos: 0,
            tipoMiel: 'multifloral',
        });
    };

    const handleSave = async () => {
        try {
            if (isCreating) {
                const CREATE_COSECHA = `mutation CreateCosecha($input: CosechaInput!) {
                    createCosecha(input: $input) {
                        id
                    }
                }`;
                await fetchGraphQL(CREATE_COSECHA, {
                    input: {
                        cantidadKg: Number(formData.cantidadKg) || 0,
                        colmenaId: formData.colmenaId,
                        fecha: formData.fecha,
                        floracion: formData.floracion,
                        humedad: Number(formData.humedad) || 0,
                        metodo: formData.metodo,
                        notas: formData.notas,
                        operador: formData.operador,
                        panalesExtraidos: Number(formData.panalesExtraidos) || 0,
                        tipoMiel: formData.tipoMiel,
                    },
                });
            } else if (editingCosecha) {
                const UPDATE_COSECHA = `mutation UpdateCosecha($id: ID!, $input: CosechaInput!) {
                    updateCosecha(id: $id, input: $input) {
                        id
                    }
                }`;
                await fetchGraphQL(UPDATE_COSECHA, {
                    id: editingCosecha.id,
                    input: {
                        cantidadKg: Number(formData.cantidadKg) || 0,
                        colmenaId: formData.colmenaId,
                        fecha: formData.fecha,
                        floracion: formData.floracion,
                        humedad: Number(formData.humedad) || 0,
                        metodo: formData.metodo,
                        notas: formData.notas,
                        operador: formData.operador,
                        panalesExtraidos: Number(formData.panalesExtraidos) || 0,
                        tipoMiel: formData.tipoMiel,
                    },
                });
            }
            handleCancel();
            await fetchCosechas();
        } catch (err) {
            console.error('Error al guardar:', err);
            alert('Error al guardar la cosecha');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('¿Estás seguro de eliminar esta cosecha?')) return;
        try {
            const DELETE_COSECHA = `mutation DeleteCosecha($id: ID!) {
                deleteCosecha(id: $id)
            }`;
            await fetchGraphQL(DELETE_COSECHA, { id });
            await fetchCosechas();
        } catch (err) {
            console.error('Error al eliminar:', err);
            alert('Error al eliminar la cosecha');
        }
    };

    const filteredCosechas = filterColmena
        ? cosechas.filter((c) => c.colmenaId?.toLowerCase().includes(filterColmena.toLowerCase()))
        : cosechas;

    if (loading) {
        return (
            <div className="dashboard-container">
                <div style={{ marginBottom: 20 }}>
                    <h2 style={{ margin: '0 0 10px 0', fontSize: '24px' }}>🍯 Cosechas</h2>
                </div>
                <p style={{ textAlign: 'center', marginTop: '40px' }}>Cargando...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="dashboard-container">
                <div style={{ marginBottom: 20 }}>
                    <h2 style={{ margin: '0 0 10px 0', fontSize: '24px' }}>🍯 Cosechas</h2>
                </div>
                <p style={{ textAlign: 'center', marginTop: '40px', color: 'red' }}>{error}</p>
            </div>
        );
    }

    return (
        <div className="dashboard-container">
            <div style={{ marginBottom: 20 }}>
                <h2 style={{ margin: '0 0 10px 0', fontSize: '24px' }}>🍯 Cosechas de Miel</h2>
                {!isCreating && !editingCosecha && (
                    <>
                        <button className="add-button" onClick={handleCreateNew} style={{ marginTop: 12, width: '100%' }}>
                            + Nueva Cosecha
                        </button>
                        <div style={{ marginTop: 12 }}>
                            <input
                                type="text"
                                placeholder="Filtrar por colmena..."
                                value={filterColmena}
                                onChange={(e) => setFilterColmena(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '10px',
                                    border: '1px solid #e0e0e0',
                                    borderRadius: '4px',
                                    fontSize: '14px',
                                }}
                            />
                        </div>
                    </>
                )}
            </div>

            {(isCreating || editingCosecha) && (
                <div className="editor-panel">
                    <h2>{isCreating ? 'Nueva Cosecha' : 'Editar Cosecha'}</h2>
                    <div className="form-grid">
                        <div className="form-group">
                            <label>Apiario</label>
                            <select
                                value={selectedApiario}
                                onChange={(e) => {
                                    setSelectedApiario(e.target.value);
                                    setFormData({ ...formData, colmenaId: '' });
                                }}
                            >
                                <option value="">Todos los apiarios</option>
                                {Array.from(new Set(colmenas.map(c => c.apiarioID).filter(Boolean)))
                                    .sort()
                                    .map((apiarioID) => (
                                        <option key={apiarioID} value={apiarioID}>
                                            {apiarioID}
                                        </option>
                                    ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Colmena *</label>
                            <select
                                value={formData.colmenaId || ''}
                                onChange={(e) => setFormData({ ...formData, colmenaId: e.target.value })}
                                required
                            >
                                <option value="">Seleccionar colmena...</option>
                                {colmenas
                                    .filter(c => c.estado !== false)
                                    .filter(c => !selectedApiario || c.apiarioID === selectedApiario)
                                    .map((colmena) => (
                                        <option key={colmena.id} value={`colmenas/${colmena.id}`}>
                                            {colmena.codigo || colmena.id} {colmena.tipo ? `- ${colmena.tipo}` : ''} {colmena.apiarioID ? `(${colmena.apiarioID})` : ''}
                                        </option>
                                    ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Fecha *</label>
                            <input
                                type="date"
                                value={formData.fecha || ''}
                                onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label>Cantidad (Kg) *</label>
                            <input
                                type="number"
                                step="0.1"
                                value={formData.cantidadKg || 0}
                                onChange={(e) => setFormData({ ...formData, cantidadKg: Number(e.target.value) })}
                                min="0"
                            />
                        </div>
                        <div className="form-group">
                            <label>Humedad (%)</label>
                            <input
                                type="number"
                                step="0.1"
                                value={formData.humedad || 0}
                                onChange={(e) => setFormData({ ...formData, humedad: Number(e.target.value) })}
                                min="0"
                                max="100"
                            />
                        </div>
                        <div className="form-group">
                            <label>Panales Extraídos</label>
                            <input
                                type="number"
                                value={formData.panalesExtraidos || 0}
                                onChange={(e) => setFormData({ ...formData, panalesExtraidos: Number(e.target.value) })}
                                min="0"
                            />
                        </div>
                        <div className="form-group">
                            <label>Operador</label>
                            <input
                                type="text"
                                value={formData.operador || ''}
                                onChange={(e) => setFormData({ ...formData, operador: e.target.value })}
                                placeholder="Nombre del operador"
                            />
                        </div>
                        <div className="form-group">
                            <label>Tipo de Miel</label>
                            <select
                                value={formData.tipoMiel || 'multifloral'}
                                onChange={(e) => setFormData({ ...formData, tipoMiel: e.target.value })}
                            >
                                <option value="multifloral">Multifloral</option>
                                <option value="monofloral">Monofloral</option>
                                <option value="mielada">Mielada</option>
                                <option value="organica">Orgánica</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Método de Extracción</label>
                            <select
                                value={formData.metodo || 'centrifuga'}
                                onChange={(e) => setFormData({ ...formData, metodo: e.target.value })}
                            >
                                <option value="centrifuga">Centrífuga</option>
                                <option value="prensado">Prensado</option>
                                <option value="escurrido">Escurrido</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Floración</label>
                            <input
                                type="text"
                                value={formData.floracion || ''}
                                onChange={(e) => setFormData({ ...formData, floracion: e.target.value })}
                                placeholder="Tipo de floración predominante"
                            />
                        </div>
                        <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                            <label>Notas</label>
                            <textarea
                                value={formData.notas || ''}
                                onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                                placeholder="Observaciones sobre la cosecha..."
                                rows={3}
                            />
                        </div>
                    </div>
                    <div className="form-actions">
                        <button className="save-button" onClick={handleSave}>
                            Guardar
                        </button>
                        <button className="cancel-button" onClick={handleCancel}>
                            Cancelar
                        </button>
                    </div>
                </div>
            )}

            <div className="colmenas-list">
                {filteredCosechas.length === 0 ? (
                    <p style={{ textAlign: 'center', marginTop: '40px' }}>
                        {filterColmena
                            ? 'No hay cosechas que coincidan con el filtro.'
                            : 'No hay cosechas registradas. Haz clic en "Nueva Cosecha" para agregar una.'}
                    </p>
                ) : (
                    <div className="colmenas-grid">
                        {filteredCosechas.map((cosecha) => {
                            // Extract colmena ID from reference path (e.g., "colmenas/abc123" -> "abc123")
                            const colmenaIdOnly = cosecha.colmenaId?.split('/').pop() || '';
                            const colmena = colmenas.find(c => c.id === colmenaIdOnly);
                            const colmenaDisplay = colmena?.codigo || colmenaIdOnly || 'Sin ID';
                            
                            return (
                            <div key={cosecha.id} className="colmena-card">
                                <div className="colmena-header">
                                    <h3>🐝 {colmenaDisplay}</h3>
                                    <span className="estado-badge activa">
                                        {cosecha.cantidadKg || 0} kg
                                    </span>
                                </div>
                                <div className="colmena-details">
                                    <p><strong>📅 Fecha:</strong> {cosecha.fecha || 'N/A'}</p>
                                    <p><strong>🌸 Floración:</strong> {cosecha.floracion || 'N/A'}</p>
                                    <p><strong>💧 Humedad:</strong> {cosecha.humedad || 0}%</p>
                                    <p><strong>🍯 Tipo:</strong> {cosecha.tipoMiel || 'N/A'}</p>
                                    <p><strong>⚙️ Método:</strong> {cosecha.metodo || 'N/A'}</p>
                                    <p><strong>📦 Panales:</strong> {cosecha.panalesExtraidos || 0}</p>
                                    {cosecha.operador && (
                                        <p><strong>👤 Operador:</strong> {cosecha.operador}</p>
                                    )}
                                    {cosecha.notas && (
                                        <p className="notas"><strong>📝 Notas:</strong> {cosecha.notas}</p>
                                    )}
                                </div>
                                <div className="colmena-actions">
                                    <button className="edit-button" onClick={() => handleEdit(cosecha)}>
                                        ✏️ Editar
                                    </button>
                                    <button className="delete-button" onClick={() => handleDelete(cosecha.id)}>
                                        🗑️ Eliminar
                                    </button>
                                </div>
                            </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CosechaPage;
