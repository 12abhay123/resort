import { useEffect, useState } from 'react';
import api from '../api/axios';
import Loader from '../components/common/Loader';
import Modal from '../components/common/Modal';
import { useAuth } from '../context/AuthContext';

const CATEGORIES = ['linen', 'toiletries', 'food', 'beverage', 'other'];
const EMPTY_FORM = { name: '', category: 'other', currentStock: '', unit: 'units', minimumStock: '', usagePerGuest: 1 };

export default function Inventory() {
  const { user } = useAuth();
  const isManager = user?.role === 'manager';

  const [items, setItems] = useState(null);
  const [predictions, setPredictions] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function load() {
    api.get('/inventory').then((res) => setItems(res.data));
    api.get('/analytics/inventory-predictions').then((res) => setPredictions(res.data));
  }
  useEffect(load, []);

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError('');
    setModalOpen(true);
  }

  function openEdit(item) {
    setEditingId(item._id);
    setForm({ name: item.name, category: item.category, currentStock: item.currentStock, unit: item.unit, minimumStock: item.minimumStock, usagePerGuest: item.usagePerGuest });
    setError('');
    setModalOpen(true);
  }

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = { ...form, currentStock: Number(form.currentStock), minimumStock: Number(form.minimumStock), usagePerGuest: Number(form.usagePerGuest) };
      if (editingId) await api.put(`/inventory/${editingId}`, payload);
      else await api.post('/inventory', payload);
      setModalOpen(false);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save item');
    } finally {
      setSaving(false);
    }
  }

  async function remove(id) {
    if (!window.confirm('Delete this item?')) return;
    await api.delete(`/inventory/${id}`);
    load();
  }

  if (!items) return <Loader label="Loading inventory..." />;
  const predMap = Object.fromEntries((predictions || []).map((p) => [p.itemId, p]));

  return (
    <div className="space-y-4">
      {isManager && (
        <div className="flex justify-end">
          <button onClick={openCreate} className="btn-primary">+ Add item</button>
        </div>
      )}

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-ink-900/5 text-ink-700/70 text-left">
            <tr>
              <th className="px-4 py-3">Item</th><th className="px-4 py-3">Stock</th><th className="px-4 py-3">Min</th>
              <th className="px-4 py-3">Predicted need (tomorrow)</th><th className="px-4 py-3">Reorder</th>
              {isManager && <th className="px-4 py-3">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {items.map((i) => {
              const pred = predMap[i._id];
              return (
                <tr key={i._id} className="border-t border-ink-900/5">
                  <td className="px-4 py-3 font-semibold text-ink-900">{i.name}</td>
                  <td className={`px-4 py-3 ${i.currentStock < i.minimumStock ? 'font-bold text-coral' : ''}`}>{i.currentStock} {i.unit}</td>
                  <td className="px-4 py-3 text-ink-700/60">{i.minimumStock}</td>
                  <td className="px-4 py-3">{pred?.requiredForTomorrow ?? '—'}</td>
                  <td className="px-4 py-3">{pred?.reorderQuantity > 0 ? <span className="font-semibold text-coral">Reorder {pred.reorderQuantity}</span> : <span className="text-brand-700">OK</span>}</td>
                  {isManager && (
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => openEdit(i)} className="btn-secondary py-1 px-2 text-xs">Edit</button>
                        <button onClick={() => remove(i._id)} className="btn-secondary py-1 px-2 text-xs text-coral">Delete</button>
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? 'Edit item' : 'Add item'}
        footer={(
          <>
            <button className="btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
            <button className="btn-primary" disabled={saving} form="inventory-form">{saving ? 'Saving...' : 'Save'}</button>
          </>
        )}
      >
        <form id="inventory-form" onSubmit={save} className="space-y-3">
          {error && <p className="text-sm text-coral">{error}</p>}
          <div>
            <label className="label">Name</label>
            <input required className="input-field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Category</label>
              <select className="input-field" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Unit</label>
              <input className="input-field" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Current stock</label>
              <input required type="number" min="0" className="input-field" value={form.currentStock} onChange={(e) => setForm({ ...form, currentStock: e.target.value })} />
            </div>
            <div>
              <label className="label">Minimum stock</label>
              <input required type="number" min="0" className="input-field" value={form.minimumStock} onChange={(e) => setForm({ ...form, minimumStock: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="label">Usage per guest</label>
            <input type="number" min="0" step="0.1" className="input-field" value={form.usagePerGuest} onChange={(e) => setForm({ ...form, usagePerGuest: e.target.value })} />
          </div>
        </form>
      </Modal>
    </div>
  );
}