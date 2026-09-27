import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import api from '../api/axios';
import Loader from '../components/common/Loader';
import Modal from '../components/common/Modal';
import { useAuth } from '../context/AuthContext';

const STATUS_STYLE = {
  available: 'bg-brand-50 text-brand-700',
  occupied: 'bg-[#fbf0ed] text-[#a84f3b]',
  maintenance: 'bg-[#fbf0ed] text-[#a84f3b]',
  cleaning: 'bg-ivory text-ink-700',
};

const ROOM_TYPES = ['Standard', 'Deluxe', 'Suite', 'Villa'];
const ROOM_STATUSES = ['available', 'occupied', 'maintenance', 'cleaning'];

const EMPTY_FORM = { roomNumber: '', type: 'Standard', basePrice: '', capacity: 2, status: 'available', image: null };

// Uploaded images come back as relative paths (e.g. /uploads/rooms/xyz.jpg) —
// resolve against the API's origin (baseURL minus the /api suffix), not the frontend's.
const API_ORIGIN = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '');
function resolveImageUrl(imagePath) {
  if (!imagePath) return null;
  return imagePath.startsWith('http') ? imagePath : `${API_ORIGIN}${imagePath}`;
}

// A few curated shots per room type so cards don't all look identical.
const ROOM_IMAGES = {
  Standard: [
    'https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1595576508898-0ad5c879a061?auto=format&fit=crop&w=600&q=80',
  ],
  Deluxe: [
    'https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=600&q=80',
  ],
  Suite: [
    'https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=600&q=80',
  ],
  Villa: [
    'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=600&q=80',
  ],
};

function roomImage(room) {
  if (room.image) return resolveImageUrl(room.image);
  const options = ROOM_IMAGES[room.type] || ROOM_IMAGES.Standard;
  const hash = String(room.roomNumber).split('').reduce((s, c) => s + c.charCodeAt(0), 0);
  return options[hash % options.length];
}

export default function Rooms() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isManager = user?.role === 'manager';

  const [rooms, setRooms] = useState(null);
  const [filter, setFilter] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  function load() { api.get('/rooms').then((res) => setRooms(res.data)); }
  useEffect(load, []);

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError('');
    setModalOpen(true);
  }

  function openEdit(room) {
    setEditingId(room._id);
    setForm({ roomNumber: room.roomNumber, type: room.type, basePrice: room.basePrice, capacity: room.capacity, status: room.status, image: room.image || null });
    setError('');
    setModalOpen(true);
  }

  async function handleImagePick(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const body = new FormData();
      body.append('image', file);
      const { data } = await api.post('/rooms/upload-image', body, { headers: { 'Content-Type': 'multipart/form-data' } });
      setForm((f) => ({ ...f, image: data.url }));
    } catch (err) {
      setError(err.response?.data?.message || 'Could not upload image');
    } finally {
      setUploading(false);
    }
  }

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = { ...form, basePrice: Number(form.basePrice), capacity: Number(form.capacity) };
      if (editingId) await api.put(`/rooms/${editingId}`, payload);
      else await api.post('/rooms', payload);
      setModalOpen(false);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save room');
    } finally {
      setSaving(false);
    }
  }

  async function remove(id) {
    if (!window.confirm('Delete this room?')) return;
    await api.delete(`/rooms/${id}`);
    load();
  }

  if (!rooms) return <Loader label="Loading rooms..." />;
  const filtered = filter === 'all' ? rooms : rooms.filter((r) => r.status === filter);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex gap-2 flex-wrap">
          {['all', ...ROOM_STATUSES].map((s) => (
            <button key={s} onClick={() => setFilter(s)}
              className={`min-h-10 text-sm font-semibold px-4 py-2 rounded-xl border transition-colors ${filter === s ? 'bg-brand-50 text-brand-700 border-brand-100' : 'bg-white text-ink-700 border-sand/80 hover:bg-ivory'}`}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
        {isManager && <button onClick={openCreate} className="btn-primary">+ Add room</button>}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {filtered.map((r) => (
          <div key={r._id} className="card group overflow-hidden">
            <button
              type="button"
              onClick={() => navigate(`/room?room=${r._id}`)}
              className="block h-44 w-full overflow-hidden bg-ivory text-left"
              aria-label={`Open room ${r.roomNumber}`}
            >
              <img src={roomImage(r)} alt={`${r.type} room`} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.035]" loading="lazy" />
            </button>
            <div className="p-4">
            <div className="flex items-center justify-between">
              <p className="font-bold text-ink-900">Room {r.roomNumber}</p>
              <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full ${STATUS_STYLE[r.status]}`}>{r.status}</span>
            </div>
            <p className="text-sm text-ink-700/70 mt-1">{r.type} · Sleeps {r.capacity}</p>
            <p className="text-lg font-extrabold text-brand-600 mt-2">${r.basePrice}<span className="text-xs font-medium text-ink-700/50">/night</span></p>

            {isManager && (
              <>
                {/* This QR is the room's digital key: manager scans it to check a guest
                    in (room available) or check them out (room occupied). */}
                {/* Only use: manager scans this to check a guest in (room available)
                    or check them out (room occupied). Guests sign in separately
                    with their phone number on the Login page. */}
                <div className="mt-3 flex flex-col items-center gap-1 border-t border-ink-900/5 pt-3">
                  <QRCodeSVG value={`${window.location.origin}/checkin?room=${r._id}`} size={96} />
                  <p className="text-[10px] text-ink-700/50">
                    {r.status === 'occupied' ? 'Scan to check out' : 'Scan to check in'}
                  </p>
                </div>
                <div className="flex gap-2 mt-3">
                  <button onClick={() => openEdit(r)} className="btn-secondary flex-1 py-1.5 text-xs">Edit</button>
                  <button onClick={() => remove(r._id)} className="btn-secondary flex-1 py-1.5 text-xs text-coral">Delete</button>
                </div>
              </>
            )}
            </div>
          </div>
        ))}
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? 'Edit room' : 'Add room'}
        footer={(
          <>
            <button className="btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
            <button className="btn-primary" disabled={saving || uploading} form="room-form">{saving ? 'Saving...' : 'Save'}</button>
          </>
        )}
      >
        <form id="room-form" onSubmit={save} className="space-y-3">
          {error && <p className="text-sm text-coral">{error}</p>}
          <div>
            <label className="label">Room photo</label>
            {form.image && <img src={resolveImageUrl(form.image)} alt="Room preview" className="w-full h-28 object-cover rounded-lg mb-2" />}
            <input type="file" accept="image/*" className="input-field" onChange={handleImagePick} disabled={uploading} />
            {uploading && <p className="text-xs text-ink-700/50 mt-1">Uploading...</p>}
          </div>
          <div>
            <label className="label">Room number</label>
            <input required className="input-field" value={form.roomNumber} onChange={(e) => setForm({ ...form, roomNumber: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Type</label>
              <select className="input-field" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                {ROOM_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Status</label>
              <select className="input-field" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                {ROOM_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Base price ($/night)</label>
              <input required type="number" min="0" className="input-field" value={form.basePrice} onChange={(e) => setForm({ ...form, basePrice: e.target.value })} />
            </div>
            <div>
              <label className="label">Capacity</label>
              <input required type="number" min="1" className="input-field" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} />
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}