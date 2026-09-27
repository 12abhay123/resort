import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../api/axios';
import Loader from '../components/common/Loader';
import Modal from '../components/common/Modal';
import { useAuth } from '../context/AuthContext';
import { Phone, Star } from 'lucide-react';

const PRIORITY_STYLE = { urgent: 'bg-[#fbf0ed] text-[#a84f3b]', high: 'bg-[#fbf0ed] text-[#a84f3b]', normal: 'bg-brand-100 text-brand-700', low: 'bg-ink-900/5 text-ink-700' };

export default function Requests() {
  const { user } = useAuth();
  const isManager = user?.role === 'manager';
  const [searchParams] = useSearchParams();
  const roomId = searchParams.get('room'); // set when guest scans a room's QR key

  const [requests, setRequests] = useState(null);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [lastIntent, setLastIntent] = useState(null);

  const [rateFor, setRateFor] = useState(null); // request currently being rated
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [ratingSaving, setRatingSaving] = useState(false);

  function load() { api.get('/requests').then((res) => setRequests(res.data)); }
  useEffect(load, []);

  async function submit(e) {
    e.preventDefault();
    if (!message.trim()) return;
    setSubmitting(true);
    try {
      const { data } = await api.post('/requests', { message, room: roomId || undefined });
      setLastIntent(data.intent);
      setMessage('');
      load();
    } finally {
      setSubmitting(false);
    }
  }

  function openRate(r) {
    setRateFor(r);
    setRating(5);
    setComment('');
  }

  async function submitRating(e) {
    e.preventDefault();
    setRatingSaving(true);
    try {
      await api.post('/feedback', { task: rateFor.task._id, rating, comment });
      setRateFor(null);
      load();
    } finally {
      setRatingSaving(false);
    }
  }

  if (!requests) return <Loader />;

  return (
    <div className="space-y-6">
      {/* Managers can only see requests, not submit them. */}
      {!isManager && (
        <form onSubmit={submit} className="card p-5 flex flex-col sm:flex-row gap-3">
          <input value={message} onChange={(e) => setMessage(e.target.value)} placeholder='e.g. "My AC is not cooling" or "I need two towels"'
            className="input-field flex-1" />
          <button disabled={submitting} className="btn-primary sm:w-auto">{submitting ? 'Submitting...' : 'Submit request'}</button>
        </form>
      )}

      {roomId && !isManager && <p className="text-xs text-ink-700/60">Submitting for your room via the room's QR key.</p>}

      {lastIntent && (
        <div className="card p-4 bg-brand-50 border-brand-100">
          <p className="text-sm font-semibold text-brand-700">Intent detected: {lastIntent.category} · priority {lastIntent.priority}</p>
          <p className="text-xs text-brand-700/70 mt-1">{lastIntent.explanation}</p>
        </div>
      )}

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-ink-900/5 text-ink-700/70 text-left">
            <tr>
              <th className="px-4 py-3">Guest</th>
              {isManager && <th className="px-4 py-3">Contact</th>}
              <th className="px-4 py-3">Message</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Priority</th>
              <th className="px-4 py-3">Assigned Staff</th>
              <th className="px-4 py-3">Status</th>
              {!isManager && <th className="px-4 py-3">Manager Reply</th>}
              {!isManager && <th className="px-4 py-3">Rate</th>}
            </tr>
          </thead>
          <tbody>
            {requests.map((r) => (
              <tr key={r._id} className="border-t border-ink-900/5">
                <td className="px-4 py-3">{r.guest?.name}</td>
                {isManager && (
                  <td className="px-4 py-3">
                    {r.guest?.phone ? (
                      <a href={`tel:${r.guest.phone}`} className="inline-flex items-center gap-1.5 font-semibold text-brand-600 hover:underline"><Phone size={14} /> {r.guest.phone}</a>
                    ) : (
                      <span className="text-ink-700/40">—</span>
                    )}
                  </td>
                )}
                <td className="px-4 py-3 max-w-xs truncate">{r.message}</td>
                <td className="px-4 py-3">{r.category}</td>
                <td className="px-4 py-3"><span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full ${PRIORITY_STYLE[r.priority]}`}>{r.priority}</span></td>
                <td className="px-4 py-3">
                  {r.task?.assignedStaff ? (
                    <div className="space-y-1">
                      <p className="font-semibold text-ink-900">{r.task.assignedStaff.user?.name || 'Unassigned'}</p>
                      <p className="text-[11px] text-ink-700/60">{r.task.assignedStaff.department} · workload {r.task.assignedStaff.currentWorkload || 0}</p>
                    </div>
                  ) : (
                    <span className="text-ink-700/40">Unassigned</span>
                  )}
                </td>
                <td className="px-4 py-3 capitalize">{r.status}</td>
                {!isManager && (
                  <td className="px-4 py-3">
                    {r.managerReply ? <span className="text-xs text-ink-700/80">{r.managerReply}</span> : <span className="text-xs text-ink-700/40">No reply yet</span>}
                  </td>
                )}
                {!isManager && (
                  <td className="px-4 py-3">
                    {r.task?.status === 'completed' && !r.feedbackGiven && (
                      <button onClick={() => openRate(r)} className="btn-secondary py-1 px-2 text-xs"><Star size={14} /> Rate service</button>
                    )}
                    {r.task?.status === 'completed' && r.feedbackGiven && (
                      <span className="text-xs font-semibold text-brand-700">Thanks for rating!</span>
                    )}
                    {r.task && r.task.status !== 'completed' && <span className="text-xs text-ink-700/40">Pending completion</span>}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal
        open={!!rateFor}
        onClose={() => setRateFor(null)}
        title={`Rate ${rateFor?.task?.assignedStaff?.user?.name || 'the staff member'}`}
        footer={(
          <>
            <button className="btn-secondary" onClick={() => setRateFor(null)}>Cancel</button>
            <button className="btn-primary" disabled={ratingSaving} form="rate-form">{ratingSaving ? 'Saving...' : 'Submit'}</button>
          </>
        )}
      >
        <form id="rate-form" onSubmit={submitRating} className="space-y-3">
          <p className="text-xs text-ink-700/60">For request: "{rateFor?.message}"</p>
          <div>
            <label className="label">Rating</label>
            <div className="flex gap-1 text-2xl">
              {[1, 2, 3, 4, 5].map((n) => (
                <button type="button" key={n} aria-label={`Rate ${n} out of 5`} onClick={() => setRating(n)} className={`p-1 transition-colors ${n <= rating ? 'text-coral' : 'text-sand'}`}><Star size={24} fill="currentColor" /></button>
              ))}
            </div>
          </div>
          <div>
            <label className="label">Comment (optional)</label>
            <textarea className="input-field" rows={3} value={comment} onChange={(e) => setComment(e.target.value)} />
          </div>
        </form>
      </Modal>
    </div>
  );
}