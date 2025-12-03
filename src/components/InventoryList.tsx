import React, { useEffect, useState } from 'react';
import { collection, getDocs, onSnapshot, doc, updateDoc, addDoc, query, orderBy, type DocumentData, type QuerySnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import InventoryItemEditor from './InventoryItemEditor';
import type { InventoryItem } from './InventoryItemEditor';

const candidateCollections = ['inventario', 'inventories', 'inventory', 'Inventory'];

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

  useEffect(() => {
    if (!db) {
      // evitar setState síncrono dentro del efecto
      setTimeout(() => {
        setError('Firebase no inicializado.');
        setLoading(false);
      }, 0);
      return;
    }

    let unsub: (() => void) | null = null;

    const detectAndSubscribe = async () => {
      for (const candidate of candidateCollections) {
        try {
          const coll = collection(db!, candidate);
          const snap = await getDocs(coll) as QuerySnapshot<DocumentData>;
          if (snap.size > 0) {
            setCollectionName(candidate);
            const q = query(coll, orderBy('nombre'));
            unsub = onSnapshot(q, (qSnap) => {
              const arr = qSnap.docs.map(d => ({ id: d.id, ...(d.data() as unknown as Partial<InventoryItem>) } as InventoryItem));
              setItems(arr);
              setLoading(false);
            }, (err) => {
              setError(err?.message ?? String(err));
              setLoading(false);
            });
            return;
          }
        } catch (e) {
          // ignorar y probar siguiente
          console.warn('inspect collection', candidate, e);
        }
      }

      // Si no hay colecciones con docs, intentar suscribirse a 'inventario' de todos modos
      try {
        const fallback = 'inventario';
        setCollectionName(fallback);
        const coll = collection(db!, fallback);
        const q = query(coll, orderBy('nombre'));
        unsub = onSnapshot(q, (qSnap) => {
          const arr = qSnap.docs.map(d => ({ id: d.id, ...(d.data() as unknown as Partial<InventoryItem>) } as InventoryItem));
          setItems(arr);
          setLoading(false);
        }, (err) => {
          setError(err?.message ?? String(err));
          setLoading(false);
        });
      } catch (e) {
        setError('No se pudo suscribir a inventario: ' + String(e));
        setLoading(false);
      }
    };

    detectAndSubscribe();

    return () => {
      try {
        if (unsub) unsub();
      } catch (e) {
        console.warn('unsubscribe error', e);
      }
    };
  }, []);

  const updateItem = async (id: string, data: Partial<InventoryItem>) => {
    if (!collectionName) throw new Error('Collection not selected');
    const dRef = doc(db!, collectionName, id);
    await updateDoc(dRef, data as unknown as DocumentData);
  };

  const changeQuantity = async (id: string, delta: number) => {
    if (!collectionName) return;
    const dRef = doc(db!, collectionName, id);
    // optimista: read current in state and update
    const it = items.find(i => i.id === id);
    const newQ = (it?.cantidad ?? 0) + delta;
    await updateDoc(dRef, { cantidad: newQ });
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
    const coll = collection(db!, collectionName);
    const payload: Record<string, unknown> = {
      nombre: data.nombre ?? 'Nuevo ítem',
      descripcion: data.descripcion ?? '',
      cantidad: data.cantidad ?? 0,
      unidad: data.unidad ?? '',
      tipo: data.tipo ?? '',
      creadoEn: data.creadoEn ?? new Date()
    };
    await addDoc(coll, payload as unknown as DocumentData);
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
