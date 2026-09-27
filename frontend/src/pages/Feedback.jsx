import { useEffect, useState } from 'react';
import api from '../api/axios';
import Loader from '../components/common/Loader';
import { useAuth } from '../context/AuthContext';
import { Star } from 'lucide-react';

const SENTIMENT_STYLE = { positive: 'bg-brand-50 text-brand-700', neutral: 'bg-ink-900/5 text-ink-700', negative: 'bg-[#fbf0ed] text-[#a84f3b]' };

function FeedbackRow({ f }) {
  return (
    <div className="card p-4 flex items-start justify-between gap-4">
      <div>
        <div className="flex gap-0.5 text-coral" aria-label={`${f.rating} out of 5 stars`}>{Array.from({ length: f.rating }, (_, index) => <Star key={index} size={14} fill="currentColor" />)}</div>
        {f.task?.title && <p className="text-xs text-ink-700/50 mt-0.5">Task: {f.task.title}</p>}
        <p className="text-sm text-ink-700 mt-1">{f.comment}</p>
      </div>
      <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full shrink-0 ${SENTIMENT_STYLE[f.sentiment]}`}>{f.sentiment}</span>
    </div>
  );
}

// Manager: overall resort feedback analytics. Guests give this feedback per completed
// task/staff member (see Requests page); this view rolls it all up.
function ManagerFeedback() {
  const [data, setData] = useState(null);

  useEffect(() => { api.get('/feedback/analytics').then((res) => setData(res.data)); }, []);
  if (!data) return <Loader label="Analyzing sentiment..." />;

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-5"><p className="text-xs font-semibold uppercase text-ink-700/60">Total reviews</p><p className="text-2xl font-extrabold text-ink-900 mt-1">{data.total}</p></div>
        <div className="card p-5"><p className="text-xs font-semibold uppercase text-ink-700/60">Avg rating</p><p className="text-2xl font-extrabold text-ink-900 mt-1">{data.avgRating} / 5</p></div>
        <div className="card p-5"><p className="text-xs font-semibold uppercase text-ink-700/60">Positive</p><p className="text-2xl font-extrabold text-brand-700 mt-1">{data.positivePct}%</p></div>
        <div className="card p-5"><p className="text-xs font-semibold uppercase text-ink-700/60">Negative</p><p className="text-2xl font-extrabold text-coral mt-1">{data.negativePct}%</p></div>
      </div>

      <div className="space-y-3">
        {data.recent?.map((f) => <FeedbackRow key={f._id} f={f} />)}
      </div>
    </div>
  );
}

// Staff: no overall resort rating here — only the feedback guests left them, per completed task.
function StaffFeedback() {
  const { user } = useAuth();
  const [data, setData] = useState(null);

  useEffect(() => { api.get('/feedback/mine').then((res) => setData(res.data)); }, [user?.id]);
  if (!data) return <Loader label="Loading your feedback..." />;

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="card p-5"><p className="text-xs font-semibold uppercase text-ink-700/60">Your avg rating</p><p className="text-2xl font-extrabold text-ink-900 mt-1">{data.avgRating || '—'} / 5</p></div>
        <div className="card p-5"><p className="text-xs font-semibold uppercase text-ink-700/60">Reviews received</p><p className="text-2xl font-extrabold text-ink-900 mt-1">{data.count}</p></div>
      </div>

      <div className="space-y-3">
        {!data.feedback?.length && <p className="text-sm text-ink-700/60">No feedback yet — complete a task and the guest can rate you.</p>}
        {data.feedback?.map((f) => <FeedbackRow key={f._id} f={f} />)}
      </div>
    </div>
  );
}

export default function Feedback() {
  const { user } = useAuth();
  return user?.role === 'staff' ? <StaffFeedback /> : <ManagerFeedback />;
}