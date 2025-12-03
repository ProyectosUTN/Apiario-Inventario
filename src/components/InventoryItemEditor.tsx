import React, { useState } from 'react';

export type InventoryItem = {
  id: string;
  nombre?: string;
  descripcion?: string;
  cantidad?: number;
  unidad?: string;
  tipo?: string;
  creadoEn?: string | number | Date;
};

type Props = {
  item: InventoryItem;
  onCancel: () => void;
  onSave: (id: string, data: Partial<InventoryItem>) => Promise<void>;
};

const InventoryItemEditor: React.FC<Props> = ({ item, onCancel, onSave }) => {
  const [form, setForm] = useState<Partial<InventoryItem>>({
    nombre: item.nombre ?? '',
    descripcion: item.descripcion ?? '',
    cantidad: item.cantidad ?? 0,
    unidad: item.unidad ?? '',
    tipo: item.tipo ?? ''
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (k: keyof InventoryItem) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const val = e.target.value;
    if (k === 'cantidad') {
      setForm(prev => ({ ...prev, cantidad: Number(val) }));
    } else {
      setForm(prev => ({ ...prev, [k]: val }));
    }
  };

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await onSave(item.id, form);
      onCancel();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(String(err));
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="editor-card">
      <form onSubmit={submit}>
        <div className="form-row">
          <label>Nombre</label>
          <input value={form.nombre as string} onChange={handleChange('nombre')} />
        </div>
        <div className="form-row">
          <label>Descripción</label>
          <textarea value={form.descripcion as string} onChange={handleChange('descripcion')} />
        </div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <div style={{ flex: 1 }} className="form-row">
            <label>Cantidad</label>
            <input type="number" value={String(form.cantidad ?? 0)} onChange={handleChange('cantidad')} />
          </div>
          <div style={{ flex: 1 }} className="form-row">
            <label>Unidad</label>
            <input value={form.unidad as string} onChange={handleChange('unidad')} />
          </div>
          <div style={{ flex: 1 }} className="form-row">
            <label>Tipo</label>
            <input value={form.tipo as string} onChange={handleChange('tipo')} />
          </div>
        </div>

        {error && <div style={{ color: 'crimson' }}>{error}</div>}

        <div className="editor-actions">
          <button type="button" onClick={onCancel} disabled={saving} className="small-btn">
            Cancelar
          </button>
          <button type="submit" disabled={saving} className="small-btn primary">
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default InventoryItemEditor;
