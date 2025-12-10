import React, { useEffect, useState } from 'react';
import { fetchGraphQL } from '../api/graphqlClient';

type Colmena = {
    id: string;
    apiarioID?: string;
    cantidadAlzas?: number;
    codigo?: string;
    edadReinaMeses?: number;
    estado?: boolean;
    fechaInstalacion?: string;
    notas?: string;
    origenReina?: string;
    tipo?: string;
};

type Props = {
    onBack: () => void;
};

const ColmenaPage: React.FC<Props> = () => {
    const [colmenas, setColmenas] = useState<Colmena[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [editingColmena, setEditingColmena] = useState<Colmena | null>(null);
    const [isCreating, setIsCreating] = useState(false);

    const [formData, setFormData] = useState<Partial<Colmena>>({
        apiarioID: '',
        cantidadAlzas: 0,
        codigo: '',
        edadReinaMeses: 0,
        estado: true,
        fechaInstalacion: '',
        notas: '',
        origenReina: '',
        tipo: 'Langstroth',
    });

    useEffect(() => {
        fetchColmenas();
    }, []);

    const fetchColmenas = async () => {
        try {
            setLoading(true);
            const GET_COLMENAS = `query GetColmenas { 
                colmenas { 
                    id 
                    apiarioID
                    cantidadAlzas
                    codigo
                    edadReinaMeses
                    estado
                    fechaInstalacion
                    notas
                    origenReina
                    tipo
                } 
            }`;
            const data = await fetchGraphQL(GET_COLMENAS);
            setColmenas(data?.colmenas ?? []);
            setError(null);
        } catch (err) {
            setError('Error al cargar las colmenas');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateNew = () => {
        setIsCreating(true);
        setEditingColmena(null);
        setFormData({
            apiarioID: '',
            cantidadAlzas: 0,
            codigo: '',
            edadReinaMeses: 0,
            estado: true,
            fechaInstalacion: new Date().toISOString().split('T')[0],
            notas: '',
            origenReina: '',
            tipo: 'Langstroth',
        });
    };

    const handleEdit = (colmena: Colmena) => {
        setIsCreating(false);
        setEditingColmena(colmena);
        setFormData({
            apiarioID: colmena.apiarioID || '',
            cantidadAlzas: colmena.cantidadAlzas || 0,
            codigo: colmena.codigo || '',
            edadReinaMeses: colmena.edadReinaMeses || 0,
            estado: colmena.estado ?? true,
            fechaInstalacion: colmena.fechaInstalacion || '',
            notas: colmena.notas || '',
            origenReina: colmena.origenReina || '',
            tipo: colmena.tipo || 'Langstroth',
        });
    };

    const handleCancel = () => {
        setIsCreating(false);
        setEditingColmena(null);
        setFormData({
            apiarioID: '',
            cantidadAlzas: 0,
            codigo: '',
            edadReinaMeses: 0,
            estado: true,
            fechaInstalacion: '',
            notas: '',
            origenReina: '',
            tipo: 'Langstroth',
        });
    };

    const handleSave = async () => {
        try {
            if (isCreating) {
                const CREATE_COLMENA = `mutation CreateColmena($input: ColmenaInput!) {
                    createColmena(input: $input) {
                        id
                    }
                }`;
                await fetchGraphQL(CREATE_COLMENA, {
                    input: {
                        apiarioID: formData.apiarioID,
                        cantidadAlzas: Number(formData.cantidadAlzas) || 0,
                        codigo: formData.codigo,
                        edadReinaMeses: Number(formData.edadReinaMeses) || 0,
                        estado: formData.estado ?? true,
                        fechaInstalacion: formData.fechaInstalacion,
                        notas: formData.notas,
                        origenReina: formData.origenReina,
                        tipo: formData.tipo,
                    },
                });
            } else if (editingColmena) {
                const UPDATE_COLMENA = `mutation UpdateColmena($id: ID!, $input: ColmenaInput!) {
                    updateColmena(id: $id, input: $input) {
                        id
                    }
                }`;
                await fetchGraphQL(UPDATE_COLMENA, {
                    id: editingColmena.id,
                    input: {
                        apiarioID: formData.apiarioID,
                        cantidadAlzas: Number(formData.cantidadAlzas) || 0,
                        codigo: formData.codigo,
                        edadReinaMeses: Number(formData.edadReinaMeses) || 0,
                        estado: formData.estado ?? true,
                        fechaInstalacion: formData.fechaInstalacion,
                        notas: formData.notas,
                        origenReina: formData.origenReina,
                        tipo: formData.tipo,
                    },
                });
            }
            handleCancel();
            await fetchColmenas();
        } catch (err) {
            console.error('Error al guardar:', err);
            alert('Error al guardar la colmena');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('¿Estás seguro de eliminar esta colmena?')) return;
        try {
            const DELETE_COLMENA = `mutation DeleteColmena($id: ID!) {
                deleteColmena(id: $id)
            }`;
            await fetchGraphQL(DELETE_COLMENA, { id });
            await fetchColmenas();
        } catch (err) {
            console.error('Error al eliminar:', err);
            alert('Error al eliminar la colmena');
        }
    };

    if (loading) {
    return (
        <div className="dashboard-container">
            <div style={{ marginBottom: 20 }}>
                <h2 style={{ margin: '0 0 10px 0', fontSize: '24px' }}>🐝 Colmenas</h2>
            </div>
            <p style={{ textAlign: 'center', marginTop: '40px' }}>Cargando...</p>
        </div>
    );
}

if (error) {
    return (
        <div className="dashboard-container">
            <div style={{ marginBottom: 20 }}>
                <h2 style={{ margin: '0 0 10px 0', fontSize: '24px' }}>🐝 Colmenas</h2>
            </div>
            <p style={{ textAlign: 'center', marginTop: '40px', color: 'red' }}>{error}</p>
        </div>
    );
}

return (
    <div className="dashboard-container">
        <div style={{ marginBottom: 20 }}>
            <h2 style={{ margin: '0 0 10px 0', fontSize: '24px' }}>🐝 Colmenas</h2>
            {!isCreating && !editingColmena && (
                <button className="add-button" onClick={handleCreateNew} style={{ marginTop: 12, width: '100%' }}>
                    + Nueva Colmena
                </button>
            )}
        </div>            {(isCreating || editingColmena) && (
                <div className="editor-panel">
                    <h2>{isCreating ? 'Nueva Colmena' : 'Editar Colmena'}</h2>
                    <div className="form-grid">
                        <div className="form-group">
                            <label>Código *</label>
                            <input
                                type="text"
                                value={formData.codigo || ''}
                                onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                                placeholder="Ej: COL-001"
                            />
                        </div>
                        <div className="form-group">
                            <label>Apiario ID</label>
                            <input
                                type="text"
                                value={formData.apiarioID || ''}
                                onChange={(e) => setFormData({ ...formData, apiarioID: e.target.value })}
                                placeholder="ID del apiario"
                            />
                        </div>
                        <div className="form-group">
                            <label>Tipo</label>
                            <select
                                value={formData.tipo || 'Langstroth'}
                                onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                            >
                                <option value="Langstroth">Langstroth</option>
                                <option value="Dadant">Dadant</option>
                                <option value="Warre">Warre</option>
                                <option value="Top Bar">Top Bar</option>
                                <option value="Otro">Otro</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Cantidad de Alzas</label>
                            <input
                                type="number"
                                value={formData.cantidadAlzas || 0}
                                onChange={(e) => setFormData({ ...formData, cantidadAlzas: Number(e.target.value) })}
                                min="0"
                            />
                        </div>
                        <div className="form-group">
                            <label>Edad Reina (meses)</label>
                            <input
                                type="number"
                                value={formData.edadReinaMeses || 0}
                                onChange={(e) => setFormData({ ...formData, edadReinaMeses: Number(e.target.value) })}
                                min="0"
                            />
                        </div>
                        <div className="form-group">
                            <label>Origen Reina</label>
                            <input
                                type="text"
                                value={formData.origenReina || ''}
                                onChange={(e) => setFormData({ ...formData, origenReina: e.target.value })}
                                placeholder="Origen de la reina"
                            />
                        </div>
                        <div className="form-group">
                            <label>Fecha Instalación</label>
                            <input
                                type="date"
                                value={formData.fechaInstalacion || ''}
                                onChange={(e) => setFormData({ ...formData, fechaInstalacion: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label>Estado</label>
                            <select
                                value={formData.estado ? 'activa' : 'inactiva'}
                                onChange={(e) => setFormData({ ...formData, estado: e.target.value === 'activa' })}
                            >
                                <option value="activa">Activa</option>
                                <option value="inactiva">Inactiva</option>
                            </select>
                        </div>
                        <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                            <label>Notas</label>
                            <textarea
                                value={formData.notas || ''}
                                onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                                placeholder="Notas adicionales..."
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
                {colmenas.length === 0 ? (
                    <p style={{ textAlign: 'center', marginTop: '40px' }}>
                        No hay colmenas registradas. Haz clic en "Nueva Colmena" para agregar una.
                    </p>
                ) : (
                    <div className="colmenas-grid">
                        {colmenas.map((colmena) => (
                            <div key={colmena.id} className="colmena-card">
                                <div className="colmena-header">
                                    <h3>{colmena.codigo || 'Sin código'}</h3>
                                    <span className={`estado-badge ${colmena.estado ? 'activa' : 'inactiva'}`}>
                                        {colmena.estado ? '✓ Activa' : '✗ Inactiva'}
                                    </span>
                                </div>
                                <div className="colmena-details">
                                    <p><strong>Tipo:</strong> {colmena.tipo || 'N/A'}</p>
                                    <p><strong>Apiario:</strong> {colmena.apiarioID || 'N/A'}</p>
                                    <p><strong>Alzas:</strong> {colmena.cantidadAlzas ?? 0}</p>
                                    <p><strong>Edad Reina:</strong> {colmena.edadReinaMeses ?? 0} meses</p>
                                    {colmena.fechaInstalacion && (
                                        <p><strong>Instalación:</strong> {new Date(colmena.fechaInstalacion).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                                    )}
                                    {colmena.origenReina && (
                                        <p><strong>Origen Reina:</strong> {colmena.origenReina}</p>
                                    )}
                                    {colmena.notas && (
                                        <p className="notas"><strong>Notas:</strong> {colmena.notas}</p>
                                    )}
                                </div>
                                <div className="colmena-actions">
                                    <button className="edit-button" onClick={() => handleEdit(colmena)}>
                                        ✏️ Editar
                                    </button>
                                    <button className="delete-button" onClick={() => handleDelete(colmena.id)}>
                                        🗑️ Eliminar
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ColmenaPage;
