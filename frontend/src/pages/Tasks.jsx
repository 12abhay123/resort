import { useEffect, useState } from 'react';
import api from '../api/axios';
import Loader from '../components/common/Loader';
import QrScanner from '../components/common/QrScanner';
import { useAuth } from '../context/AuthContext';
import { QrCode } from 'lucide-react';

// A scanned room QR encodes a full URL like ".../checkin?room=<id>".
// Pull the room id out of it (or accept a bare id, just in case).
function extractRoomId(scanned) {
  try {
    const url = new URL(scanned);
    const room = url.searchParams.get('room');
    if (room) return room;
  } catch {
    // not a URL — fall through
  }
  return scanned;
}

const COLUMNS = ['pending', 'in-progress', 'completed'];
const STATUS_STYLE = { pending: 'bg-ink-900/5 text-ink-700', 'in-progress': 'bg-brand-100 text-brand-700', completed: 'bg-brand-50 text-brand-700' };

function TaskCard({ t, showAssignee }) {
  return (
    <div className="card p-3">
      <p className="text-sm font-semibold text-ink-900">{t.title}</p>
      <p className="text-xs text-ink-700/60 mt-1">
        {showAssignee && <>{t.assignedStaff?.user?.name || 'Unassigned'} · </>}{t.department}
      </p>
    </div>
  );
}

// Staff: classic kanban of their own tasks by status. Status only moves via QR scan now.
function StatusBoard({ tasks }) {
  return (
    <div className="grid md:grid-cols-3 gap-4">
      {COLUMNS.map((col) => (
        <div key={col} className="space-y-3">
          <p className="font-bold text-ink-900 capitalize">{col.replace('-', ' ')} ({tasks.filter((t) => t.status === col).length})</p>
          {tasks.filter((t) => t.status === col).map((t) => (
            <TaskCard key={t._id} t={t} showAssignee={false} />
          ))}
        </div>
      ))}
    </div>
  );
}

// Manager: tasks grouped staff-wise, so it's easy to see everyone's current workload at a glance.
function StaffwiseBoard({ tasks }) {
  const groups = new Map();
  tasks.forEach((t) => {
    const key = t.assignedStaff?._id || 'unassigned';
    if (!groups.has(key)) groups.set(key, { name: t.assignedStaff?.user?.name || 'Unassigned', department: t.assignedStaff?.department, tasks: [] });
    groups.get(key).tasks.push(t);
  });

  return (
    <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
      {[...groups.values()].map((g) => {
        const pending = g.tasks.filter((t) => t.status === 'pending').length;
        const inProgress = g.tasks.filter((t) => t.status === 'in-progress').length;
        const completed = g.tasks.filter((t) => t.status === 'completed').length;
        return (
          <div key={g.name} className="card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="font-bold text-ink-900">{g.name}</p>
              <span className="text-xs text-ink-700/60">{g.tasks.length} task{g.tasks.length === 1 ? '' : 's'}</span>
            </div>
            <div className="flex gap-2 text-[10px] font-bold uppercase">
              <span className={`px-2 py-1 rounded-full ${STATUS_STYLE.pending}`}>{pending} pending</span>
              <span className={`px-2 py-1 rounded-full ${STATUS_STYLE['in-progress']}`}>{inProgress} active</span>
              <span className={`px-2 py-1 rounded-full ${STATUS_STYLE.completed}`}>{completed} done</span>
            </div>
            <div className="space-y-2">
              {g.tasks.map((t) => (
                <div key={t._id} className="border border-ink-900/5 rounded-xl p-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold text-ink-900 truncate">{t.title}</p>
                    <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full shrink-0 ${STATUS_STYLE[t.status]}`}>{t.status}</span>
                  </div>
                  <p className="text-[10px] text-ink-700/50">{t.department}</p>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function Tasks() {
  const { user } = useAuth();
  const isManager = user?.role === 'manager';
  const [tasks, setTasks] = useState(null);
  const [view, setView] = useState('staffwise'); // manager default: staffwise
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scanMsg, setScanMsg] = useState(null); // { type: 'ok' | 'err', text }

  function load() { api.get('/tasks').then((res) => setTasks(res.data)); }
  useEffect(load, []);

  async function handleScan(text) {
    setScannerOpen(false);
    const roomId = extractRoomId(text);
    try {
      const { data } = await api.post('/tasks/complete-by-room', { room: roomId });
      setScanMsg({ type: 'ok', text: `Marked "${data.title}" as completed.` });
      load();
    } catch (err) {
      setScanMsg({ type: 'err', text: err.response?.data?.message || 'Could not complete a task for that room' });
    }
  }

  if (!tasks) return <Loader label="Loading tasks..." />;

  if (!isManager) {
    return (
      <div className="space-y-4">
        <div className="card p-4 flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="font-bold text-ink-900">Done with a room?</p>
            <p className="text-sm text-ink-700/60">Scan its QR to mark your task there as completed.</p>
          </div>
          <button onClick={() => { setScanMsg(null); setScannerOpen(true); }} className="btn-primary"><QrCode size={17} /> Scan room QR</button>
        </div>
        {scanMsg && (
          <p className={`rounded-xl border px-3 py-2 text-sm ${scanMsg.type === 'ok' ? 'border-brand-100 bg-brand-50 text-brand-700' : 'border-coral/20 bg-[#fbf0ed] text-[#a84f3b]'}`}>
            {scanMsg.text}
          </p>
        )}
        <StatusBoard tasks={tasks} />
        <QrScanner open={scannerOpen} onClose={() => setScannerOpen(false)} onResult={handleScan} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button onClick={() => setView('staffwise')} className={`text-sm font-semibold px-3 py-1.5 rounded-full border ${view === 'staffwise' ? 'bg-ink-900 text-white border-ink-900' : 'bg-white text-ink-700 border-ink-900/10'}`}>By staff</button>
        <button onClick={() => setView('status')} className={`text-sm font-semibold px-3 py-1.5 rounded-full border ${view === 'status' ? 'bg-ink-900 text-white border-ink-900' : 'bg-white text-ink-700 border-ink-900/10'}`}>By status</button>
      </div>
      {view === 'staffwise' ? <StaffwiseBoard tasks={tasks} /> : <StatusBoard tasks={tasks} />}
    </div>
  );
}