import { useEffect, useState } from 'react';
import { CalendarDays, Check, MapPin, Sparkles, UsersRound } from 'lucide-react';
import api from '../../api/axios';
import { useSocket } from '../../context/SocketContext';

const API_ORIGIN = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '');

export default function UpcomingEvents({ compact = false }) {
  const { events: socketEvents } = useSocket();
  const [events, setEvents] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [message, setMessage] = useState('');

  async function load() {
    const [eventResult, notificationResult] = await Promise.all([
      api.get('/events'),
      api.get('/events/notifications').catch(() => ({ data: [] })),
    ]);
    setEvents(eventResult.data);
    setNotifications(notificationResult.data.filter((item) => !item.readAt).slice(0, 3));
  }

  useEffect(() => { load().catch(() => setEvents([])); }, []);
  useEffect(() => {
    if (socketEvents.some((event) => event.type === 'event:published')) load().catch(() => {});
  }, [socketEvents]);

  async function respond(eventId, status) {
    setMessage('');
    try {
      const { data } = await api.post(`/events/${eventId}/register`, { status });
      setMessage(data.message);
      await load();
    } catch (error) { setMessage(error.response?.data?.message || 'Could not update event registration'); }
  }

  async function markRead(id) {
    await api.put(`/events/notifications/${id}/read`);
    setNotifications((current) => current.filter((item) => item._id !== id));
  }

  if (!events) return <div className="card p-5 text-sm text-ink-700/60">Loading upcoming events...</div>;

  return (
    <section className="space-y-4">
      <div className="flex items-end justify-between gap-3">
        <div><p className="eyebrow">Make your stay memorable</p><h2 className="mt-1 text-xl font-bold text-ink-900">Upcoming events</h2></div>
        {!compact && <span className="text-xs text-ink-700/55">Personalized from your interests</span>}
      </div>

      {notifications.length > 0 && <div className="space-y-2">{notifications.map((notification) => <button key={notification._id} type="button" onClick={() => markRead(notification._id)} className="flex w-full items-start gap-3 rounded-xl border border-brand-100 bg-brand-50 p-3 text-left"><Sparkles size={16} className="mt-0.5 shrink-0 text-brand-700" /><span className="flex-1"><span className="block text-sm font-semibold text-ink-900">{notification.title}</span><span className="mt-0.5 block text-xs text-ink-700/70">{notification.message}</span></span><Check size={15} className="text-brand-700" /></button>)}</div>}
      {message && <p className="rounded-xl bg-brand-50 px-3 py-2 text-sm text-brand-700">{message}</p>}

      {!events.length ? <div className="card p-6 text-sm text-ink-700/60">No upcoming events have been published yet.</div> : (
        <div className={`grid gap-4 ${compact ? 'md:grid-cols-2' : 'sm:grid-cols-2 xl:grid-cols-3'}`}>
          {events.slice(0, compact ? 2 : undefined).map((event) => {
            const registered = event.registrationStatus === 'registered';
            const interested = event.registrationStatus === 'interested';
            return (
              <article key={event._id} className="card overflow-hidden">
                {event.image ? <img src={event.image.startsWith('http') ? event.image : `${API_ORIGIN}${event.image}`} alt={event.name} className="h-44 w-full object-cover" /> : <div className="flex h-32 items-center justify-center bg-brand-50 text-brand-700"><CalendarDays size={30} /></div>}
                <div className="space-y-3 p-4">
                  <div className="flex items-center justify-between gap-2"><span className="rounded-full bg-brand-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-brand-700">{event.category}</span>{event.relevanceScore > 0 && <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#9b681f]"><Sparkles size={12} /> For you</span>}</div>
                  <div><h3 className="text-lg font-bold text-ink-900">{event.name}</h3><p className="mt-1 text-sm leading-6 text-ink-700/70">{event.description}</p></div>
                  <div className="space-y-1.5 text-xs text-ink-700/65"><p className="flex items-center gap-2"><CalendarDays size={14} className="text-brand-600" />{new Date(event.date).toLocaleDateString()} · {event.time}</p><p className="flex items-center gap-2"><MapPin size={14} className="text-brand-600" />{event.location}</p><p className="flex items-center gap-2"><UsersRound size={14} className="text-brand-600" />{event.registrations?.length || 0} attending</p></div>
                  <p className="rounded-xl bg-ivory p-3 text-xs leading-5 text-ink-700/70">{event.registrationDetails}</p>
                  {event.matchedInterests?.length > 0 && <p className="text-[10px] text-brand-700">Suggested for: {event.matchedInterests.join(', ')}</p>}
                  <div className="flex gap-2"><button type="button" onClick={() => respond(event._id, 'registered')} className="btn-primary flex-1 py-2 text-xs">{registered ? 'Registered' : 'Register'}</button><button type="button" onClick={() => respond(event._id, 'interested')} className="btn-secondary flex-1 py-2 text-xs">{interested ? 'Interested' : 'Interested'}</button></div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
