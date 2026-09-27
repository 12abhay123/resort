import { useEffect, useState } from 'react';
import api from '../api/axios';
import Loader from '../components/common/Loader';
import StatCard from '../components/dashboard/StatCard';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { MessageCircle, Send } from 'lucide-react';

const PRIORITY_STYLE = { urgent: 'bg-[#fbf0ed] text-[#a84f3b]', high: 'bg-[#fbf0ed] text-[#a84f3b]', normal: 'bg-brand-100 text-brand-700', low: 'bg-ink-900/5 text-ink-700' };

export default function StaffDashboard() {
  const { user } = useAuth();
  const { events } = useSocket();
  const [tasks, setTasks] = useState(null);
  const [profile, setProfile] = useState(null);
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [chatMessage, setChatMessage] = useState('');
  const [chatSending, setChatSending] = useState(false);

  function load() {
    api.get('/tasks').then((res) => setTasks(res.data));
    api.get('/staff').then((res) => setProfile(res.data.find((s) => s.user?._id === user?.id) || null));
  }
  useEffect(load, []);
  useEffect(() => {
    if (events.some((event) => event.type === 'request:update' || event.type === 'task:update')) load();
  }, [events]);

  if (!tasks) return <Loader label="Loading your tasks..." />;

  const pending = tasks.filter((t) => t.status === 'pending').length;
  const inProgress = tasks.filter((t) => t.status === 'in-progress').length;
  const completed = tasks.filter((t) => t.status === 'completed').length;
  const activeTasks = tasks.filter((task) => task.status !== 'completed' && task.request);
  const selectedTask = activeTasks.find((task) => task._id === selectedTaskId) || activeTasks[0];

  async function sendChatMessage(event) {
    event.preventDefault();
    if (!selectedTask?.request?._id || !chatMessage.trim()) return;
    setChatSending(true);
    try {
      await api.post(`/requests/${selectedTask.request._id}/message`, { message: chatMessage.trim() });
      setChatMessage('');
      load();
    } finally {
      setChatSending(false);
    }
  }

  return (
    <div className="space-y-6">
      {profile && (
        <div className="card p-4 flex items-center justify-between flex-wrap gap-2">
          <div>
            <p className="font-bold text-ink-900">{profile.user?.name}</p>
            <p className="text-sm text-ink-700/70">{profile.department} · {profile.shift} shift</p>
          </div>
          <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full ${profile.availability ? 'bg-brand-50 text-brand-700' : 'bg-ink-900/5 text-ink-700'}`}>
            {profile.availability ? 'Available' : 'Off shift'}
          </span>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Assigned to you" value={tasks.length} />
        <StatCard label="Pending" value={pending} accent="warn" />
        <StatCard label="In progress" value={inProgress} />
        <StatCard label="Completed" value={completed} />
      </div>

      <div className="card overflow-hidden">
        <div className="flex items-center gap-2 border-b border-ink-900/5 bg-ink-900/3 px-4 py-3">
          <MessageCircle size={17} className="text-brand-700" />
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-ink-700/60">Guest chat</p>
        </div>
        {!activeTasks.length ? (
          <p className="p-6 text-sm text-ink-700/60">No active guest task chat. A chat appears when a task is assigned to you.</p>
        ) : (
          <div className="grid min-h-[420px] lg:grid-cols-[260px_1fr]">
            <div className="border-b border-ink-900/5 bg-white lg:border-b-0 lg:border-r">
              {activeTasks.map((task) => (
                <button key={task._id} type="button" onClick={() => setSelectedTaskId(task._id)} className={`w-full border-b border-ink-900/5 p-4 text-left hover:bg-brand-50/50 ${selectedTask?._id === task._id ? 'bg-brand-50' : ''}`}>
                  <p className="text-sm font-semibold text-ink-900">{task.request.guest?.name || 'Guest'}</p>
                  <p className="mt-1 truncate text-xs text-ink-700/60">{task.request.message}</p>
                  <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.1em] text-brand-700">{task.status}</p>
                </button>
              ))}
            </div>
            {selectedTask && (
              <div className="flex min-h-[420px] flex-col">
                <div className="border-b border-ink-900/5 bg-white px-4 py-3">
                  <p className="font-semibold text-ink-900">{selectedTask.request.guest?.name || 'Guest'}</p>
                  <p className="text-xs text-ink-700/60">Assigned guest request</p>
                </div>
                <div className="flex-1 space-y-3 overflow-y-auto bg-[#f5f1e9] p-4">
                  {(selectedTask.request.conversation?.length ? selectedTask.request.conversation : [{ sender: 'guest', message: selectedTask.request.message }])
                    .filter((entry) => entry.sender === 'guest' || entry.sender === 'staff')
                    .map((entry, index) => (
                    <div key={`${selectedTask.request._id}-${index}`} className={`flex ${entry.sender === 'staff' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[82%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${entry.sender === 'staff' ? 'rounded-br-sm bg-brand-600 text-white' : 'rounded-bl-sm bg-white text-ink-800'}`}>
                        <p className="leading-6">{entry.message}</p>
                        <p className={`mt-1 text-[10px] ${entry.sender === 'staff' ? 'text-white/65' : 'text-ink-700/45'}`}>{entry.sender === 'staff' ? 'You' : entry.sender === 'manager' ? 'Manager' : 'Guest'}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <form onSubmit={sendChatMessage} className="flex gap-2 border-t border-ink-900/5 bg-white p-3">
                  <input value={chatMessage} onChange={(event) => setChatMessage(event.target.value)} className="input-field flex-1" placeholder="Write a message to the guest..." />
                  <button type="submit" disabled={chatSending || !chatMessage.trim()} aria-label="Send message" className="btn-primary px-4"><Send size={16} /></button>
                </form>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="card p-5">
        <p className="font-bold text-ink-900 mb-3">Your tasks</p>
        {!tasks.length && <p className="text-sm text-ink-700/60">No tasks assigned to you right now.</p>}
        <div className="space-y-3">
          {tasks.map((t) => (
            <div key={t._id} className="border border-ink-900/5 rounded-xl p-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <p className="text-sm font-semibold text-ink-900">{t.title}</p>
                <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full ${PRIORITY_STYLE[t.priority]}`}>{t.priority}</span>
              </div>
              <p className="text-xs text-ink-700/60 mt-1">{t.department} · status: {t.status}</p>
              {t.request?.message && <p className="text-xs text-ink-700/70 mt-1 italic">"{t.request.message}"</p>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}