import React, { useEffect, useState, useRef } from 'react';
import InventoryItemEditor from './InventoryItemEditor';
import type { InventoryItem } from './InventoryItemEditor';
import { fetchGraphQL } from '../api/graphqlClient';

// GraphQL query string used in multiple places
const GET_INSUMOS_STR = `query GetInsumos { insumos { id nombre cantidad unidad descripcion tipo creadoEn } }`;

const InventoryList: React.FC = () => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [collectionName, setCollectionName] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const pollingRef = useRef<number | null>(null);

  // loader used by effects and after mutations
  const loadInsumos = async () => {
    try {
      console.log('[InventoryList] Iniciando carga de insumos...');
      const data = await fetchGraphQL(GET_INSUMOS_STR);
      console.log('[InventoryList] Datos recibidos:', data);
      console.log('[InventoryList] data?.insumos:', data?.insumos);
      console.log('[InventoryList] Tipo de data:', typeof data);
      console.log('[InventoryList] Keys de data:', data ? Object.keys(data) : 'data es null/undefined');
      
      const arr: InventoryItem[] = (data?.insumos ?? []).map((d: InventoryItem & { id: string }) => ({
        id: d.id,
        nombre: d.nombre,
        descripcion: d.descripcion ?? '',
        cantidad: d.cantidad ?? 0,
        unidad: d.unidad ?? '',
        tipo: d.tipo ?? '',
        creadoEn: d.creadoEn
      }));
      console.log('[InventoryList] Items mapeados:', arr.length, 'items');
      console.log('[InventoryList] Array completo:', arr);
      setCollectionName('insumos');
      setItems(arr.sort((a, b) => String(a.nombre ?? '').localeCompare(String(b.nombre ?? ''))));
      setLoading(false);
      setError(null);
    } catch (e: unknown) {
      console.error('[InventoryList] Error al cargar insumos:', e);
      console.error('[InventoryList] Error message:', e instanceof Error ? e.message : String(e));
      setError(e instanceof Error ? e.message : String(e));
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    void (async () => {
      await loadInsumos();
    })();
    pollingRef.current = window.setInterval(() => {
      if (mounted) loadInsumos();
    }, 5000);
    return () => {
      mounted = false;
      if (pollingRef.current) window.clearInterval(pollingRef.current);
    };
  }, []);

  
  useEffect(() => {
    const targetItemId = sessionStorage.getItem('targetItemId');
    if (targetItemId && items.length > 0) {
      const targetItem = items.find(item => item.id === targetItemId);
      if (targetItem) {
        // Usar setTimeout para evitar renderizados en cascada
        setTimeout(() => {
          setEditingId(targetItemId);
        }, 0);
        // Limpiar el sessionStorage después de usarlo
        sessionStorage.removeItem('targetItemId');
      }
    }
  }, [items]);

  // Update item with all fields
  const updateItem = async (id: string, data: Partial<InventoryItem>) => {
    if (!collectionName) throw new Error('Collection not selected');
    const input = {
      nombre: data.nombre,
      descripcion: data.descripcion,
      cantidad: data.cantidad,
      unidad: data.unidad,
      tipo: data.tipo
    };
    const MUT = `mutation UpdateInsumo($id: ID!, $input: InventoryItemInput!) { updateInsumo(id: $id, input: $input) { id nombre cantidad unidad descripcion tipo creadoEn } }`;
    await fetchGraphQL(MUT, { id, input });
    await loadInsumos();
  };

  const changeQuantity = async (id: string, delta: number) => {
    if (!collectionName) return;
    const it = items.find(i => i.id === id);
    const newQ = (it?.cantidad ?? 0) + delta;
    const input = {
      nombre: it?.nombre,
      descripcion: it?.descripcion,
      cantidad: newQ,
      unidad: it?.unidad,
      tipo: it?.tipo
    };
    const MUT = `mutation UpdateInsumo($id: ID!, $input: InventoryItemInput!) { updateInsumo(id:$id, input:$input) { id cantidad } }`;
    await fetchGraphQL(MUT, { id, input });
    await loadInsumos();
  };

  const addNew = () => {
    if (!collectionName) {
      setError('No se ha detectado colección. Asegúrate de tener una colección `inventario` o `inventory`.');
      return;
    }
    setCreating(true);
  };

  const createItem = async (_id: string, data: Partial<InventoryItem>) => {
    if (!collectionName) throw new Error('Collection not selected');
    const MUT = `mutation CreateInsumo($input: InventoryItemInput!) { createInsumo(input: $input) { id nombre cantidad unidad descripcion tipo creadoEn } }`;
    const payload = {
      nombre: data.nombre ?? 'Nuevo ítem',
      descripcion: data.descripcion ?? '',
      cantidad: data.cantidad ?? 0,
      unidad: data.unidad ?? '',
      tipo: data.tipo ?? ''
    };
    await fetchGraphQL(MUT, { input: payload });
    await loadInsumos();
  };

  const deleteItem = async (id: string) => {
    if (!collectionName) throw new Error('Collection not selected');
    const MUT = `mutation DeleteInsumo($id: ID!) { deleteInsumo(id: $id) }`;
    await fetchGraphQL(MUT, { id });
    await loadInsumos();
    setDeletingId(null);
  };

  const getBadgeClass = (tipo?: string | null) => {
    if (!tipo) return 'badge-default';
    const t = String(tipo).toLowerCase().trim();
    // map common spanish/english types to badge classes
    if (t.includes('herr') || t.includes('tool') || t.includes('herramienta')) return 'badge-tools';
    if (t.includes('insumo') || t.includes('supply') || t.includes('consumible')) return 'badge-supply';
    if (t.includes('material') || t.includes('mat')) return 'badge-material';
    if (t.includes('miel') || t.includes('alimento') || t.includes('food')) return 'badge-amber';
    if (t.includes('med') || t.includes('farm') || t.includes('medic')) return 'badge-med';
    return 'badge-default';
  };

  return (
    <div style={{ marginTop: 20 }}>
      <div style={{ marginBottom: 8 }}>
        <button onClick={addNew} className="small-btn add-item-btn" disabled={creating}>
          <span>➕</span> Agregar ítem
        </button>
      </div>
      {/* modal editor rendered below (used for both creating and editing) */}
      {loading && <div>Leyendo inventario...</div>}
      {error && <div style={{ color: 'crimson' }}>Error: {error}</div>}

      <div className="inventory-list">
        {items.length === 0 && !loading && <div>No hay ítems en inventario.</div>}
        {items.map(item => (
          <div key={item.id} className="inventory-item">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div className={`item-badge ${getBadgeClass(item.tipo)}`} title={item.tipo ?? ''}>
                {item.unidad ? String(item.unidad).charAt(0).toUpperCase() : (item.nombre ? String(item.nombre).charAt(0).toUpperCase() : '•')}
              </div>
              <div className="meta">
                <strong>{item.nombre ?? '—'}</strong>
                <div className="subtitle">{item.descripcion}</div>
                <div style={{ marginTop: 6 }}>
                  <small>Cantidad: {item.cantidad ?? '—'} {item.unidad ?? ''}</small>
                  <span style={{ marginLeft: 8 }}><small>Tipo: {item.tipo ?? '—'}</small></span>
                </div>
              </div>
            </div>

            <div className="inventory-actions">
              <button onClick={() => changeQuantity(item.id, 1)} title="+1" className="small-btn qty-btn-plus">+1</button>
              <button onClick={() => changeQuantity(item.id, -1)} title="-1" className="small-btn qty-btn-minus">-1</button>
              <button onClick={() => setEditingId(item.id)} className="small-btn edit-btn">✏️ Editar</button>
              <button onClick={() => setDeletingId(item.id)} className="small-btn delete-btn" title="Eliminar">🗑️</button>
            </div>

            {/* editing now uses modal editor */}
          </div>
        ))}
      </div>

      {(creating || editingId) && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'var(--card-bg, #fff)', padding: 16, borderRadius: 8, width: '92%', maxWidth: 400, boxShadow: '0 8px 32px rgba(0,0,0,0.25)' }}>
            <InventoryItemEditor
              item={editingId ? (items.find(i => i.id === editingId) || { id: editingId, nombre: '', descripcion: '', cantidad: 0, unidad: '', tipo: '', creadoEn: new Date() }) : { id: '', nombre: '', descripcion: '', cantidad: 0, unidad: '', tipo: '', creadoEn: new Date() }}
              onCancel={() => { setCreating(false); setEditingId(null); }}
              onSave={async (id, data) => {
                if (creating) {
                  await createItem(id, data);
                  setCreating(false);
                } else if (editingId) {
                  await updateItem(editingId, data);
                  setEditingId(null);
                }
              }}
            />
          </div>
        </div>
      )}

      {deletingId && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ background: 'var(--card-bg, #fff)', padding: '20px', borderRadius: 8, width: '100%', maxWidth: 380, boxShadow: '0 8px 32px rgba(0,0,0,0.3)', maxHeight: '90vh', overflow: 'auto' }}>
            <h3 style={{ marginTop: 0, marginBottom: 12, fontSize: '18px' }}>⚠️ Confirmar eliminación</h3>
            <p style={{ marginBottom: 12, fontSize: '14px', wordWrap: 'break-word' }}>
              ¿Eliminar <strong>{items.find(i => i.id === deletingId)?.nombre}</strong>?
            </p>
            <p style={{ marginBottom: 16, color: '#666', fontSize: '13px' }}>
              Esta acción no se puede deshacer.
            </p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button 
                onClick={() => setDeletingId(null)} 
                className="small-btn cancel-btn"
                style={{ padding: '6px 12px', fontSize: '14px' }}
              >
                Cancelar
              </button>
              <button 
                onClick={() => deleteItem(deletingId)} 
                className="small-btn delete-btn"
                style={{ padding: '6px 12px', background: '#dc3545', color: 'white', fontSize: '14px' }}
              >
                🗑️ Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryList;
