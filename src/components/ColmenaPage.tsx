import React, { useEffect, useState, useRef } from 'react';
import { fetchGraphQL } from '../api/graphqlClient';
import { storage, db, auth } from '../firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { doc, getDoc } from 'firebase/firestore';

type Colmena = {
    id: string;
    apiarioID?: string;
    cantidadAlzas?: number;
    codigo?: string;
    edadReinaMeses?: number;
    estado?: boolean;
    fechaInstalacion?: string;
    fotoURL?: string;
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
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const [uploadingPhoto, setUploadingPhoto] = useState(false);
    const [userApiaryName, setUserApiaryName] = useState<string>('');
    const editorRef = useRef<HTMLDivElement>(null);

    const [formData, setFormData] = useState<Partial<Colmena>>({
        apiarioID: '',
        cantidadAlzas: 0,
        codigo: '',
        edadReinaMeses: 0,
        estado: true,
        fechaInstalacion: '',
        fotoURL: '',
        notas: '',
        origenReina: '',
        tipo: 'Langstroth',
    });

    useEffect(() => {
        fetchColmenas();
        fetchUserApiaryName();
    }, []);

    // Obtener el nombre del apiario del perfil del usuario
    const fetchUserApiaryName = async () => {
        if (auth?.currentUser && db) {
            try {
                const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    setUserApiaryName(userData.apiaryName || '');
                }
            } catch (err) {
                console.error('Error al obtener perfil de usuario:', err);
            }
        }
    };

    // Detectar si venimos desde una alerta y abrir el editor automáticamente
    useEffect(() => {
        const targetItemId = sessionStorage.getItem('targetItemId');
        if (targetItemId && colmenas.length > 0) {
            const targetColmena = colmenas.find(c => c.id === targetItemId);
            if (targetColmena) {
                setEditingColmena(targetColmena);
                setFormData({
                    apiarioID: targetColmena.apiarioID || '',
                    cantidadAlzas: targetColmena.cantidadAlzas || 0,
                    codigo: targetColmena.codigo || '',
                    edadReinaMeses: targetColmena.edadReinaMeses || 0,
                    estado: targetColmena.estado ?? true,
                    fechaInstalacion: targetColmena.fechaInstalacion || '',
                    fotoURL: targetColmena.fotoURL || '',
                    notas: targetColmena.notas || '',
                    origenReina: targetColmena.origenReina || '',
                    tipo: targetColmena.tipo || 'Langstroth',
                });
                setPhotoPreview(targetColmena.fotoURL || null);
                // Limpiar el sessionStorage después de usarlo
                sessionStorage.removeItem('targetItemId');
                // Scroll al editor
                setTimeout(() => {
                    editorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 100);
            }
        }
    }, [colmenas]);

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
                    fotoURL
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

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            console.log('Archivo seleccionado:', {
                name: file.name,
                type: file.type,
                size: file.size,
                lastModified: file.lastModified
            });
            
            if (!file.type.startsWith('image/')) {
                alert('Por favor selecciona una imagen válida');
                console.error('Tipo de archivo inválido:', file.type);
                return;
            }
            
            // Validar tamaño
            if (file.size > 10 * 1024 * 1024) {
                alert('La imagen es demasiado grande. El tamaño máximo es 10MB');
                console.error('Archivo demasiado grande:', file.size);
                return;
            }
            
            setSelectedFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPhotoPreview(reader.result as string);
                console.log('Vista previa generada correctamente');
            };
            reader.onerror = (error) => {
                console.error('Error al leer el archivo:', error);
                alert('Error al leer el archivo');
            };
            reader.readAsDataURL(file);
        } else {
            console.log('No se seleccionó ningún archivo');
        }
    };

    const uploadPhoto = async (colmenaId: string): Promise<string | null> => {
        if (!selectedFile || !storage) {
            console.error('No hay archivo seleccionado o storage no está disponible');
            return null;
        }
        try {
            setUploadingPhoto(true);
            console.log('Iniciando subida de foto para colmena:', colmenaId);
            console.log('Archivo a subir:', {
                name: selectedFile.name,
                type: selectedFile.type,
                size: selectedFile.size
            });
            
            const fileExtension = selectedFile.name.split('.').pop();
            const fileName = `colmenas/${colmenaId}_${Date.now()}.${fileExtension}`;
            console.log('Nombre del archivo en storage:', fileName);
            
            const storageRef = ref(storage, fileName);
            console.log('Referencia de storage creada');
            
            await uploadBytes(storageRef, selectedFile);
            console.log('Archivo subido exitosamente');
            
            const downloadURL = await getDownloadURL(storageRef);
            console.log('URL de descarga obtenida:', downloadURL);
            
            return downloadURL;
        } catch (error) {
            console.error('Error detallado al subir foto:', {
                error,
                errorMessage: error instanceof Error ? error.message : 'Error desconocido',
                errorStack: error instanceof Error ? error.stack : undefined
            });
            alert('Error al subir la foto. Por favor, intenta de nuevo.');
            return null;
        } finally {
            setUploadingPhoto(false);
        }
    };

    const deletePhoto = async (photoURL: string) => {
        if (!storage || !photoURL) return;
        try {
            const photoRef = ref(storage, photoURL);
            await deleteObject(photoRef);
        } catch (error) {
            console.error('Error al eliminar foto:', error);
        }
    };

    const handleRemovePhoto = () => {
        setSelectedFile(null);
        setPhotoPreview(null);
        setFormData({ ...formData, fotoURL: '' });
    };

    const generateNextColmenaCode = (): string => {
        // Extraer números de los códigos existentes que siguen el formato COL-XXX
        const existingNumbers = colmenas
            .filter(c => c.codigo && c.codigo.startsWith('COL-'))
            .map(c => {
                const match = c.codigo!.match(/COL-(\d+)/);
                return match ? parseInt(match[1], 10) : 0;
            })
            .filter(num => !isNaN(num));

        // Encontrar el número más alto
        const maxNumber = existingNumbers.length > 0 ? Math.max(...existingNumbers) : 0;
        
        // Generar el siguiente número
        const nextNumber = maxNumber + 1;
        
        // Formatear con padding de 3 dígitos
        return `COL-${nextNumber.toString().padStart(3, '0')}`;
    };

    const handleCreateNew = () => {
        setIsCreating(true);
        setEditingColmena(null);
        setSelectedFile(null);
        setPhotoPreview(null);
        const newCodigo = generateNextColmenaCode();
        setFormData({
            apiarioID: userApiaryName || '',
            cantidadAlzas: 0,
            codigo: newCodigo,
            edadReinaMeses: 0,
            estado: true,
            fechaInstalacion: new Date().toISOString().split('T')[0],
            fotoURL: '',
            notas: '',
            origenReina: '',
            tipo: 'Langstroth',
        });
    };

    const handleEdit = (colmena: Colmena) => {
        setIsCreating(false);
        setEditingColmena(colmena);
        setSelectedFile(null);
        setPhotoPreview(colmena.fotoURL || null);
        setFormData({
            apiarioID: colmena.apiarioID || '',
            cantidadAlzas: colmena.cantidadAlzas || 0,
            codigo: colmena.codigo || '',
            edadReinaMeses: colmena.edadReinaMeses || 0,
            estado: colmena.estado ?? true,
            fechaInstalacion: colmena.fechaInstalacion || '',
            fotoURL: colmena.fotoURL || '',
            notas: colmena.notas || '',
            origenReina: colmena.origenReina || '',
            tipo: colmena.tipo || 'Langstroth',
        });
        // Hacer scroll al formulario de edición
        setTimeout(() => {
            editorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    };

    const handleCancel = () => {
        setIsCreating(false);
        setEditingColmena(null);
        setSelectedFile(null);
        setPhotoPreview(null);
        setFormData({
            apiarioID: '',
            cantidadAlzas: 0,
            codigo: '',
            edadReinaMeses: 0,
            estado: true,
            fechaInstalacion: '',
            fotoURL: '',
            notas: '',
            origenReina: '',
            tipo: 'Langstroth',
        });
    };

    const handleSave = async () => {
        try {
            let fotoURL = formData.fotoURL || '';
            
            if (isCreating) {
                
                const CREATE_COLMENA = `mutation CreateColmena($input: ColmenaInput!) {
                    createColmena(input: $input) {
                        id
                    }
                }`;
                const result = await fetchGraphQL(CREATE_COLMENA, {
                    input: {
                        apiarioID: formData.apiarioID,
                        cantidadAlzas: Number(formData.cantidadAlzas) || 0,
                        codigo: formData.codigo,
                        edadReinaMeses: Number(formData.edadReinaMeses) || 0,
                        estado: formData.estado ?? true,
                        fechaInstalacion: formData.fechaInstalacion,
                        fotoURL: '',
                        notas: formData.notas,
                        origenReina: formData.origenReina,
                        tipo: formData.tipo,
                    },
                });

                const colmenaId = result?.createColmena?.id;
                
                // Si hay foto, subirla y actualizar la colmena
                if (selectedFile && colmenaId) {
                    const uploadedURL = await uploadPhoto(colmenaId);
                    if (uploadedURL) {
                        const UPDATE_COLMENA = `mutation UpdateColmena($id: ID!, $input: ColmenaInput!) {
                            updateColmena(id: $id, input: $input) {
                                id
                            }
                        }`;
                        await fetchGraphQL(UPDATE_COLMENA, {
                            id: colmenaId,
                            input: {
                                apiarioID: formData.apiarioID,
                                cantidadAlzas: Number(formData.cantidadAlzas) || 0,
                                codigo: formData.codigo,
                                edadReinaMeses: Number(formData.edadReinaMeses) || 0,
                                estado: formData.estado ?? true,
                                fechaInstalacion: formData.fechaInstalacion,
                                fotoURL: uploadedURL,
                                notas: formData.notas,
                                origenReina: formData.origenReina,
                                tipo: formData.tipo,
                            },
                        });
                    }
                }
            } else if (editingColmena) {
                
                if (selectedFile) {
                    
                    if (formData.fotoURL) {
                        await deletePhoto(formData.fotoURL);
                    }
                    const uploadedURL = await uploadPhoto(editingColmena.id);
                    if (uploadedURL) {
                        fotoURL = uploadedURL;
                    }
                }

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
                        fotoURL: fotoURL,
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
            <div className="page-header">
                <div className="page-header-content">
                    <div className="page-icon-wrapper">
                        <span style={{ fontSize: '24px' }}>🐝</span>
                    </div>
                    <div className="page-header-text">
                        <h2 className="page-title">Colmenas</h2>
                    </div>
                </div>
            </div>
            <p style={{ textAlign: 'center', marginTop: '40px' }}>Cargando...</p>
        </div>
    );
}

if (error) {
    return (
        <div className="dashboard-container">
            <div className="page-header">
                <div className="page-header-content">
                    <div className="page-icon-wrapper">
                        <span style={{ fontSize: '24px' }}>🐝</span>
                    </div>
                    <div className="page-header-text">
                        <h2 className="page-title">Colmenas</h2>
                    </div>
                </div>
            </div>
            <p style={{ textAlign: 'center', marginTop: '40px', color: 'red' }}>{error}</p>
        </div>
    );
}

return (
    <div className="dashboard-container">
        {/* Encabezado de Página */}
        <div className="page-header">
            <div className="page-header-content">
                <div className="page-icon-wrapper">
                    <span style={{ fontSize: '24px' }}>🐝</span>
                </div>
                <div className="page-header-text">
                    <h2 className="page-title">Colmenas</h2>
                </div>
            </div>
        </div>
        {!isCreating && !editingColmena && (
            <button className="add-button" onClick={handleCreateNew} style={{ marginTop: 12, marginBottom: 20, width: '100%' }}>
                + Nueva Colmena
            </button>
        )}            {(isCreating || editingColmena) && (
                <div ref={editorRef} className="editor-panel">
                    <h2>{isCreating ? 'Nueva Colmena' : 'Editar Colmena'}</h2>
                    <div className="form-grid">
                        <div className="form-group">
                            <label>Código {isCreating && '(Generado automáticamente)'}</label>
                            <input
                                type="text"
                                value={formData.codigo || ''}
                                onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                                placeholder="Ej: COL-001"
                                readOnly={isCreating}
                                style={isCreating ? { backgroundColor: '#f3f4f6', cursor: 'not-allowed' } : {}}
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
                            <select
                                value={formData.origenReina || ''}
                                onChange={(e) => setFormData({ ...formData, origenReina: e.target.value })}
                            >
                                <option value="">Seleccionar...</option>
                                <option value="Africanizada">Africanizada</option>
                                <option value="Italiana">Italiana</option>
                                <option value="Carniola">Carniola</option>
                                <option value="Buckfast">Buckfast</option>
                                <option value="Híbrida">Híbrida</option>
                                <option value="Reina criolla">Reina criolla</option>
                                <option value="Linea local">Linea local</option>
                            </select>
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
                            <label>Foto de la Colmena</label>
                            <input
                                type="file"
                                accept="image/jpeg,image/jpg,image/png,image/webp,image/heic,image/heif"
                                capture="environment"
                                onChange={handleFileSelect}
                                style={{ marginBottom: '10px' }}
                            />
                            {photoPreview && (
                                <div style={{ marginTop: '10px', position: 'relative', display: 'inline-block' }}>
                                    <img 
                                        src={photoPreview} 
                                        alt="Preview" 
                                        style={{ 
                                            maxWidth: '200px', 
                                            maxHeight: '200px', 
                                            borderRadius: '8px',
                                            objectFit: 'cover',
                                            display: 'block'
                                        }} 
                                    />
                                    <button
                                        type="button"
                                        onClick={handleRemovePhoto}
                                        style={{
                                            position: 'absolute',
                                            top: '8px',
                                            right: '8px',
                                            background: 'rgba(220, 38, 38, 0.9)',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '50%',
                                            width: '32px',
                                            height: '32px',
                                            cursor: 'pointer',
                                            fontSize: '18px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontWeight: 'bold'
                                        }}
                                        title="Eliminar foto"
                                    >
                                        ×
                                    </button>
                                </div>
                            )}
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
                        <button className="save-button" onClick={handleSave} disabled={uploadingPhoto}>
                            {uploadingPhoto ? 'Subiendo foto...' : 'Guardar'}
                        </button>
                        <button className="cancel-button" onClick={handleCancel} disabled={uploadingPhoto}>
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
                                {colmena.fotoURL && (
                                    <div style={{ marginBottom: '15px' }}>
                                        <img 
                                            src={colmena.fotoURL} 
                                            alt={colmena.codigo || 'Colmena'}
                                            style={{ 
                                                width: '100%', 
                                                height: '200px', 
                                                objectFit: 'cover', 
                                                borderRadius: '8px'
                                            }}
                                        />
                                    </div>
                                )}
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
