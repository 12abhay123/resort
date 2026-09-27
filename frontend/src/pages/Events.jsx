import { useEffect, useState } from 'react';
import { CalendarDays, ImagePlus, Pencil, Send, Trash2, UsersRound } from 'lucide-react';
import api from '../api/axios';
import Loader from '../components/common/Loader';
import Modal from '../components/common/Modal';
import { useAuth } from '../context/AuthContext';
import UpcomingEvents from '../components/events/UpcomingEvents';

const EMPTY_FORM = { name: '', date: '', time: '', location: '', description: '', image: '', category: 'General', tags: '', registrationDetails: '', status: 'draft' };
const API_ORIGIN = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '');

export default function Events() {
  const { user } = useAuth();
  const isManager = user?.role === 'manager';
  const [events, setEvents] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  function load() { api.get('/events').then((res) => setEvents(res.data)); }
  useEffect(() => { if (isManager) load(); }, [isManager]);

  function openCreate() { setEditingId(null); setForm(EMPTY_FORM); setError(''); setModalOpen(true); }
  function openEdit(event) {
    setEditingId(event._id);
    setForm({ name: event.name, date: new Date(event.date).toISOString().slice(0, 10), time: event.time, location: event.location, description: event.description, image: event.image || '', category: event.category || 'General', tags: (event.tags || []).join(', '), registrationDetails: event.registrationDetails || '', status: event.status });
    setError(''); setModalOpen(true);
  }

  async function uploadImage(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true); setError('');
    try {
      const body = new FormData(); body.append('image', file);
      const { data } = await api.post('/events/upload-image', body, { headers: { 'Content-Type': 'multipart/form-data' } });
      setForm((current) => ({ ...current, image: data.url }));
    } catch (uploadError) { setError(uploadError.response?.data?.message || 'Could not upload image'); }
    finally { setUploading(false); }
  }

  async function save(event) {
    event.preventDefault(); setSaving(true); setError('');
    const payload = { ...form, tags: form.tags.split(',').map((tag) => tag.trim()).filter(Boolean) };
    try {
      if (editingId) await api.put(`/events/${editingId}`, payload);
      else await api.post('/events', payload);
      setModalOpen(false); load();
    } catch (saveError) { setError(saveError.response?.data?.message || 'Could not save event'); }
    finally { setSaving(false); }
  }

  async function publish(event) {
    try { await api.post(`/events/${event._id}/publish`); load(); }
    catch (publishError) { setError(publishError.response?.data?.message || 'Could not publish event'); }
  }

  async function remove(event) {
    if (!window.confirm(`Delete ${event.name}?`)) return;
    await api.delete(`/events/${event._id}`); load();
  }

  if (!isManager) return <UpcomingEvents />;
  if (!events) return <Loader label="Loading events..." />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="eyebrow">Resort calendar</p><h2 className="mt-1 text-2xl font-semibold text-ink-900">Events</h2><p className="mt-1 text-sm text-ink-700/60">Publish resort events and manage guest registrations.</p></div><button type="button" onClick={openCreate} className="btn-primary"><CalendarDays size={16} /> Create event</button></div>
      {error && <p className="rounded-xl border border-coral/20 bg-[#fbf0ed] px-4 py-3 text-sm text-[#a84f3b]">{error}</p>}
      {!events.length ? <div className="card p-8 text-center text-sm text-ink-700/60">No events created yet.</div> : <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{events.map((event) => <article key={event._id} className="card overflow-hidden">{event.image && <img src={event.image.startsWith('http') ? event.image : `${API_ORIGIN}${event.image}`} alt={event.name} className="h-40 w-full object-cover" />}<div className="space-y-3 p-4"><div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[0.12em] text-brand-700">{event.category}</p><h3 className="mt-1 text-lg font-bold text-ink-900">{event.name}</h3></div><span className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase ${event.status === 'published' ? 'bg-brand-50 text-brand-700' : 'bg-ivory text-ink-700/60'}`}>{event.status}</span></div><p className="text-sm leading-5 text-ink-700/70">{event.description}</p><div className="text-xs text-ink-700/60">{new Date(event.date).toLocaleDateString()} · {event.time}<br />{event.location}</div><div className="flex items-center gap-1 text-xs font-semibold text-ink-700/70"><UsersRound size={14} /> {event.registrations?.length || 0} responses</div>{event.registrations?.length > 0 && <div className="max-h-24 space-y-1 overflow-y-auto rounded-xl bg-ivory p-2">{event.registrations.map((registration, index) => <p key={`${event._id}-${index}`} className="text-[11px] text-ink-700">{registration.guest?.name || 'Guest'} · {registration.status}</p>)}</div>}<div className="flex flex-wrap gap-2"><button type="button" onClick={() => openEdit(event)} className="btn-secondary flex-1 py-2 text-xs"><Pencil size={13} /> Edit</button>{event.status !== 'published' && <button type="button" onClick={() => publish(event)} className="btn-primary flex-1 py-2 text-xs"><Send size={13} /> Publish</button>}<button type="button" onClick={() => remove(event)} aria-label={`Delete ${event.name}`} className="btn-secondary px-3 py-2 text-coral"><Trash2 size={14} /></button></div></div></article>)}</div>}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'Edit event' : 'Create event'} footer={<><button type="button" className="btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button><button type="submit" form="event-form" disabled={saving || uploading} className="btn-primary">{saving ? 'Saving...' : 'Save event'}</button></>}>
        <form id="event-form" onSubmit={save} className="space-y-3">{error && <p className="text-sm text-coral">{error}</p>}
          <div><label className="label">Event image</label>{form.image && <img src={form.image.startsWith('http') ? form.image : `${API_ORIGIN}${form.image}`} alt="Event preview" className="mb-2 h-32 w-full rounded-xl object-cover" />}<label className="btn-secondary w-full cursor-pointer"><ImagePlus size={15} /> {uploading ? 'Uploading...' : 'Upload image'}<input type="file" accept="image/*" className="hidden" onChange={uploadImage} disabled={uploading} /></label></div>
          <div className="grid gap-3 sm:grid-cols-2"><div><label className="label">Event name</label><input required className="input-field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div><div><label className="label">Category</label><select className="input-field" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>{['General', 'Food', 'Culture', 'Wellness', 'Entertainment', 'Outdoors', 'Family'].map((category) => <option key={category}>{category}</option>)}</select></div><div><label className="label">Date</label><input required type="date" className="input-field" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div><div><label className="label">Time</label><input required type="time" className="input-field" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} /></div></div>
          <div><label className="label">Location</label><input required className="input-field" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></div><div><label className="label">Description</label><textarea required rows={3} className="input-field resize-y" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div><div><label className="label">Interest tags (comma separated)</label><input className="input-field" placeholder="food, music, wellness" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} /></div><div><label className="label">Registration details</label><textarea rows={2} className="input-field resize-y" value={form.registrationDetails} onChange={(e) => setForm({ ...form, registrationDetails: e.target.value })} placeholder="Capacity, price, or how to join" /></div>
        </form>
      </Modal>
    </div>
  );
}
