import React, { useEffect, useState, useRef } from 'react';
import InventoryItemEditor from './InventoryItemEditor';
import type { InventoryItem } from './InventoryItemEditor';
import { fetchGraphQL } from '../api/graphqlClient';

// GraphQL query string used in multiple places
const GET_INSUMOS_STR = `query GetInsumos { insumos { id nombre cantidad unidad notas creadoEn } }`;

const fmtDate = (val: unknown) => {
  try {
    if (!val) return '';
    // detectar Firestore Timestamp-like
    const maybeTimestamp = val as { toDate?: () => Date; seconds?: number };
    if (maybeTimestamp.toDate) return maybeTimestamp.toDate().toLocaleString();
    if (typeof maybeTimestamp.seconds === 'number') return new Date(maybeTimestamp.seconds * 1000).toLocaleString();
    return String(val);
  } catch {
    return String(val);
  }
};

const InventoryList: React.FC = () => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [collectionName, setCollectionName] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const pollingRef = useRef<number | null>(null);

  // loader used by effects and after mutations
  const loadInsumos = async () => {
    try {
      const data = await fetchGraphQL(GET_INSUMOS_STR);
      const arr: InventoryItem[] = (data?.insumos ?? []).map((d: any) => ({
        id: d.id,
        nombre: d.nombre,
        descripcion: d.notas ?? '',
        cantidad: d.cantidad ?? 0,
        unidad: d.unidad ?? '',
        tipo: '',
        creadoEn: d.creadoEn
      }));
      setCollectionName('insumos');
      setItems(arr.sort((a, b) => String(a.nombre ?? '').localeCompare(String(b.nombre ?? ''))));
      setLoading(false);
      setError(null);
    } catch (e: any) {
      console.warn('graphql fetch insumos', e?.message ?? e);
      setError(e?.message ?? String(e));
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    loadInsumos();
    pollingRef.current = window.setInterval(() => {
      if (mounted) loadInsumos();
    }, 5000);
    return () => {
      mounted = false;
      if (pollingRef.current) window.clearInterval(pollingRef.current);
    };
  }, []);

  // The GraphQL schema supports updating insumos by id and cantidad only
  const updateItem = async (id: string, data: Partial<InventoryItem>) => {
    if (!collectionName) throw new Error('Collection not selected');
    const cantidad = data.cantidad;
    const MUT = `mutation UpdateInsumo($id: ID!, $cantidad: Float) { updateInsumo(id: $id, cantidad: $cantidad) { id nombre cantidad unidad notas creadoEn } }`;
    await fetchGraphQL(MUT, { id, cantidad });
    await loadInsumos();
  };

  const changeQuantity = async (id: string, delta: number) => {
    if (!collectionName) return;
    const it = items.find(i => i.id === id);
    const newQ = (it?.cantidad ?? 0) + delta;
    const MUT = `mutation UpdateInsumo($id: ID!, $cantidad: Float) { updateInsumo(id:$id, cantidad:$cantidad) { id } }`;
    await fetchGraphQL(MUT, { id, cantidad: newQ });
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
    const MUT = `mutation AddInsumo($input: InsumoInput!) { addInsumo(input: $input) { id nombre cantidad unidad notas creadoEn } }`;
    const payload = {
      nombre: data.nombre ?? 'Nuevo ítem',
      notas: data.descripcion ?? '',
      cantidad: data.cantidad ?? 0,
      unidad: data.unidad ?? ''
    };
    await fetchGraphQL(MUT, { input: payload });
    await loadInsumos();
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
      <h3 className="section-title">Inventario</h3>
      <div style={{ marginBottom: 8 }}>
        <small style={{ color: 'gray' }}>Colección: {collectionName ?? 'detectando...'}</small>
      </div>
      <div style={{ marginBottom: 8 }}>
        <button onClick={addNew} className="small-btn" disabled={creating}>Agregar ítem</button>
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
                  <span style={{ marginLeft: 8 }}><small>Creado: {fmtDate(item.creadoEn)}</small></span>
                </div>
              </div>
            </div>

            <div className="inventory-actions">
              <button onClick={() => changeQuantity(item.id, 1)} title="+1" className="small-btn">+1</button>
              <button onClick={() => changeQuantity(item.id, -1)} title="-1" className="small-btn">-1</button>
              <button onClick={() => setEditingId(item.id)} className="small-btn">Editar</button>
            </div>

            {/* editing now uses modal editor */}
          </div>
        ))}
      </div>

      {(creating || editingId) && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'var(--card-bg, #fff)', padding: 16, borderRadius: 8, width: '92%', maxWidth: 640, boxShadow: '0 8px 32px rgba(0,0,0,0.25)' }}>
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
    </div>
  );
};

export default InventoryList;
