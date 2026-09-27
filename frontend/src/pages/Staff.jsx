import { useEffect, useState } from 'react';
import api from '../api/axios';
import Loader from '../components/common/Loader';
import Modal from '../components/common/Modal';
import { Star } from 'lucide-react';

const DEPARTMENTS = ['Housekeeping', 'Maintenance', 'RoomService', 'Restaurant', 'Spa', 'Front Desk', 'Other'];
const SHIFTS = ['morning', 'afternoon', 'night'];

const EMPTY_FORM = { name: '', email: '', password: '', phone: '', department: 'Housekeeping', shift: 'morning', availability: true };

export default function Staff() {
  const [staff, setStaff] = useState(null);
  const [feedbackSummary, setFeedbackSummary] = useState({});
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [feedbackFor, setFeedbackFor] = useState(null); // staff whose feedback modal is open
  const [feedbackDetail, setFeedbackDetail] = useState(null);

  function load() {
    api.get('/staff').then((res) => setStaff(res.data));
    api.get('/feedback/staff-summary').then((res) => setFeedbackSummary(res.data));
  }
  useEffect(load, []);

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError('');
    setModalOpen(true);
  }

  function openEdit(s) {
    setEditingId(s._id);
    setForm({ name: s.user?.name || '', email: s.user?.email || '', password: '', phone: s.user?.phone || '', department: s.department, shift: s.shift, availability: s.availability });
    setError('');
    setModalOpen(true);
  }

  async function openFeedback(s) {
    setFeedbackFor(s);
    setFeedbackDetail(null);
    const { data } = await api.get(`/feedback/staff/${s._id}`);
    setFeedbackDetail(data);
  }

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (editingId) {
        const { name, phone, department, shift, availability } = form;
        await api.put(`/staff/${editingId}`, { name, phone, department, shift, availability });
      } else {
        await api.post('/staff', form);
      }
      setModalOpen(false);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save staff member');
    } finally {
      setSaving(false);
    }
  }

  async function remove(id) {
    if (!window.confirm('Remove this staff member? Their login will be deleted too.')) return;
    await api.delete(`/staff/${id}`);
    load();
  }

  if (!staff) return <Loader label="Loading staff..." />;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={openCreate} className="btn-primary">+ Add staff</button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {staff.map((s) => {
          const fb = feedbackSummary[s._id];
          return (
            <div key={s._id} className="card p-4">
              <div className="flex items-center justify-between">
                <p className="font-bold text-ink-900">{s.user?.name}</p>
                <span className={`h-2.5 w-2.5 rounded-full ${s.availability ? 'bg-brand-500' : 'bg-ink-900/20'}`} title={s.availability ? 'Available' : 'Off shift'} />
              </div>
              <p className="text-sm text-ink-700/70">{s.department} · {s.shift} shift</p>
              <p className="text-xs text-ink-700/50 mt-1">{s.user?.email}</p>

              <button onClick={() => openFeedback(s)} className="mt-2 text-xs font-semibold text-brand-600 hover:underline">
                {fb ? `${fb.avgRating}/5 · ${fb.count} reviews` : 'No guest feedback yet'}
              </button>

              <div className="mt-3">
                <div className="flex justify-between text-xs text-ink-700/60 mb-1">
                  <span>Workload</span><span>{s.currentWorkload} tasks</span>
                </div>
                <div className="h-2 rounded-full bg-ink-900/5 overflow-hidden">
                  <div className="h-full bg-brand-500" style={{ width: `${Math.min(100, s.currentWorkload * 20)}%` }} />
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <button onClick={() => openEdit(s)} className="btn-secondary flex-1 py-1.5 text-xs">Edit</button>
                <button onClick={() => remove(s._id)} className="btn-secondary flex-1 py-1.5 text-xs text-coral">Delete</button>
              </div>
            </div>
          );
        })}
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? 'Edit staff member' : 'Add staff member'}
        footer={(
          <>
            <button className="btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
            <button className="btn-primary" disabled={saving} form="staff-form">{saving ? 'Saving...' : 'Save'}</button>
          </>
        )}
      >
        <form id="staff-form" onSubmit={save} className="space-y-3">
          {error && <p className="text-sm text-coral">{error}</p>}
          <div>
            <label className="label">Name</label>
            <input required className="input-field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Email</label>
              <input required type="email" disabled={!!editingId} className="input-field disabled:opacity-60" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div>
              <label className="label">Phone</label>
              <input className="input-field" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
          </div>
          {!editingId && (
            <div>
              <label className="label">Password</label>
              <input required type="password" minLength={6} className="input-field" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Department</label>
              <select className="input-field" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })}>
                {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Shift</label>
              <select className="input-field" value={form.shift} onChange={(e) => setForm({ ...form, shift: e.target.value })}>
                {SHIFTS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm font-medium text-ink-700">
            <input type="checkbox" checked={form.availability} onChange={(e) => setForm({ ...form, availability: e.target.checked })} />
            Available
          </label>
        </form>
      </Modal>

      <Modal
        open={!!feedbackFor}
        onClose={() => setFeedbackFor(null)}
        title={`Feedback for ${feedbackFor?.user?.name || ''}`}
        footer={<button className="btn-secondary" onClick={() => setFeedbackFor(null)}>Close</button>}
      >
        {!feedbackDetail ? <Loader /> : (
          <div className="space-y-3">
            <p className="text-sm font-semibold text-ink-900">Avg {feedbackDetail.avgRating || '—'}/5 · {feedbackDetail.count} reviews</p>
            {!feedbackDetail.feedback?.length && <p className="text-sm text-ink-700/60">No feedback left for this staff member yet.</p>}
            {feedbackDetail.feedback?.map((f) => (
              <div key={f._id} className="border-t border-ink-900/5 pt-2">
                <p className="flex items-center gap-2 text-sm"><span className="flex gap-0.5 text-coral">{Array.from({ length: f.rating }, (_, index) => <Star key={index} size={13} fill="currentColor" />)}</span><span className="text-xs text-ink-700/50">— {f.guest?.name}</span></p>
                {f.task?.title && <p className="text-xs text-ink-700/50">Task: {f.task.title}</p>}
                {f.comment && <p className="text-sm text-ink-700 mt-0.5">{f.comment}</p>}
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
}