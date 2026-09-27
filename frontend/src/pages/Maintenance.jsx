import { useEffect, useState } from 'react';
import { Camera, CheckCircle2, Play, Wrench } from 'lucide-react';
import api from '../api/axios';
import Loader from '../components/common/Loader';
import { useAuth } from '../context/AuthContext';

const API_ORIGIN = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '');
const PRIORITY_STYLE = { urgent: 'bg-[#fbf0ed] text-[#a84f3b]', high: 'bg-[#fbf0ed] text-[#a84f3b]', normal: 'bg-brand-100 text-brand-700', low: 'bg-ink-900/5 text-ink-700' };

function imageUrl(path) {
  return path?.startsWith('http') ? path : `${API_ORIGIN}${path}`;
}

export default function Maintenance() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState(null);
  const [maintenanceRequests, setMaintenanceRequests] = useState([]);
  const [error, setError] = useState('');
  const [savingId, setSavingId] = useState(null);

  function load() {
    Promise.all([api.get('/maintenance'), api.get('/requests')])
      .then(([maintenanceRes, requestsRes]) => {
        setTasks(maintenanceRes.data);
        setMaintenanceRequests(requestsRes.data.filter((request) => request.category === 'Maintenance'));
      })
      .catch((err) => setError(err.response?.data?.message || 'Could not load maintenance tasks'));
  }
  useEffect(load, []);

  async function startTask(id) {
    setSavingId(id);
    try { await api.post(`/maintenance/${id}/start`); load(); } catch (err) { setError(err.response?.data?.message || 'Could not start task'); } finally { setSavingId(null); }
  }

  async function uploadAfterPhoto(id, file) {
    if (!file) return;
    setSavingId(id);
    try {
      const body = new FormData();
      body.append('image', file);
      await api.post(`/maintenance/${id}/photo`, body, { headers: { 'Content-Type': 'multipart/form-data' } });
      load();
    } catch (err) { setError(err.response?.data?.message || 'Could not complete maintenance'); } finally { setSavingId(null); }
  }

  if (!tasks) return <Loader label="Loading maintenance plan..." />;

  return (
    <div className="space-y-6">
      <div className="card p-6 sm:p-8">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
            <Wrench size={22} />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-brand-700">Resort operations</p>
            <h2 className="mt-1 text-2xl font-semibold text-ink-900">Maintenance</h2>
            <p className="mt-2 text-sm text-ink-700/65">AI-prioritized room maintenance, automatically assigned every seven days.</p>
          </div>
        </div>
      </div>

      {error && <p className="rounded-xl border border-coral/20 bg-[#fbf0ed] px-4 py-3 text-sm text-[#a84f3b]">{error}</p>}

      {!tasks.length ? (
        <div className="card p-8 text-center text-sm text-ink-700/60">No maintenance work is due right now.</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {tasks.map((task) => (
            <div key={task._id} className="card overflow-hidden">
              {task.room?.image && <img src={imageUrl(task.room.image)} alt={`Room ${task.room.roomNumber}`} className="h-36 w-full object-cover" />}
              <div className="space-y-4 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-bold text-ink-900">Room {task.room?.roomNumber}</p>
                    <p className="text-xs text-ink-700/60">{task.room?.type} · need score {task.needScore}/100</p>
                  </div>
                  <span className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase ${PRIORITY_STYLE[task.priority]}`}>{task.priority}</span>
                </div>
                <p className="text-sm text-ink-700/75">{task.reason}</p>
                <div className="rounded-xl bg-ink-900/5 p-3 text-xs text-ink-700/70">
                  <p className="font-semibold text-ink-900">Assigned staff</p>
                  <p className="mt-1">{task.assignedStaff?.user?.name || 'Waiting for available staff'}</p>
                  <p className="capitalize">Status: {task.status}</p>
                </div>
                {user?.role === 'staff' && (
                  <div className="flex gap-2">
                    {task.status === 'pending' && <button type="button" disabled={savingId === task._id} onClick={() => startTask(task._id)} className="btn-secondary flex-1 py-2 text-xs"><Play size={14} /> Start work</button>}
                    <label className={`btn-primary flex-1 cursor-pointer justify-center py-2 text-xs ${savingId === task._id ? 'pointer-events-none opacity-60' : ''}`}>
                      {task.status === 'in-progress' ? <><Camera size={14} /> Upload after photo</> : <><CheckCircle2 size={14} /> Complete with photo</>}
                      <input type="file" accept="image/*" className="hidden" disabled={savingId === task._id} onChange={(event) => uploadAfterPhoto(task._id, event.target.files?.[0])} />
                    </label>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-3">
        <div>
          <p className="text-lg font-bold text-ink-900">Guest maintenance requests</p>
          <p className="text-sm text-ink-700/60">Only repair and maintenance issues appear here. Housekeeping requests stay out.</p>
        </div>
        {!maintenanceRequests.length ? (
          <div className="card p-6 text-sm text-ink-700/60">No guest maintenance requests yet.</div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {maintenanceRequests.map((request) => (
              <div key={request._id} className="card space-y-3 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-ink-900">{request.guest?.name || 'Guest'}</p>
                    <p className="text-xs text-ink-700/60">Room {request.room?.roomNumber || '—'}</p>
                  </div>
                  <span className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase ${PRIORITY_STYLE[request.priority]}`}>{request.priority}</span>
                </div>
                <div className="rounded-xl border border-brand-100 bg-brand-50/60 p-3">
                  <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-brand-700">Task assigned for</p>
                  <p className="mt-1 text-sm font-semibold text-ink-900">{request.task?.title || 'Maintenance inspection'}</p>
                  <p className="mt-1 text-xs leading-5 text-ink-700/70">{request.task?.department || 'Maintenance'} work assigned from this guest issue.</p>
                </div>
                <div className="rounded-xl border border-sand/70 bg-white p-3">
                  <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-ink-700/60">Guest issue</p>
                  <p className="mt-1 text-sm font-semibold leading-6 text-ink-900">{request.message}</p>
                  <div className="mt-2 flex flex-wrap gap-2 text-[10px] font-bold uppercase tracking-[0.08em] text-ink-700/60">
                    <span className="rounded-full bg-brand-50 px-2 py-1 text-brand-700">{request.category}</span>
                    <span className="rounded-full bg-ink-900/5 px-2 py-1">Room {request.room?.roomNumber || '—'}</span>
                  </div>
                </div>
                <div className="rounded-xl bg-ink-900/5 p-3 text-xs text-ink-700/70">
                  <p className="font-semibold text-ink-900">Assigned staff</p>
                  <p className="mt-1">{request.task?.assignedStaff?.user?.name || 'Unassigned'}</p>
                  <p className="capitalize">Status: {request.task?.status || request.status}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
