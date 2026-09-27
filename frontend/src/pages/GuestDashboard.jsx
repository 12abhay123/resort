import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import api from '../api/axios';
import Loader from '../components/common/Loader';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import UpcomingEvents from '../components/events/UpcomingEvents';
import { BedDouble, CalendarDays, Gift, Send, Star, X } from 'lucide-react';

const PRIORITY_STYLE = { urgent: 'bg-[#fbf0ed] text-[#a84f3b]', high: 'bg-[#fbf0ed] text-[#a84f3b]', normal: 'bg-brand-100 text-brand-700', low: 'bg-ink-900/5 text-ink-700' };

const RESORT_SLIDES = [
  {
    image: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1600&q=85',
    title: 'A little space to unwind',
    subtitle: 'Smarter Stays. Happier Guests.',
  },
  {
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=85',
    title: 'Oceanfront calm',
    subtitle: 'Sunset views, fresh air, and easy comfort.',
  },
  {
    image: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1600&q=85',
    title: 'Guest-first service',
    subtitle: 'Every request handled with care and speed.',
  },
];

// Guest's whole world lives here: their allotted room, a place to submit
// requests, feedback per request, and one overall resort feedback form.
export default function GuestDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { events } = useSocket();
  const [booking, setBooking] = useState(null);
  const [allBookings, setAllBookings] = useState([]);
  const [requests, setRequests] = useState(null);
  const [offers, setOffers] = useState(null);

  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [lastIntent, setLastIntent] = useState(null);

  const [rateFor, setRateFor] = useState(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);

  const [resortRating, setResortRating] = useState(5);
  const [resortComment, setResortComment] = useState('');
  const [resortSaving, setResortSaving] = useState(false);
  const [resortDone, setResortDone] = useState(false);
  const [slideIndex, setSlideIndex] = useState(0);
  const [qrOpen, setQrOpen] = useState(false);
  const [helpDeskOpen, setHelpDeskOpen] = useState(false);
  const [chatTarget, setChatTarget] = useState('manager');
  const [helpDeskMessage, setHelpDeskMessage] = useState('');
  const [helpDeskSending, setHelpDeskSending] = useState(false);
  const [helpDeskSent, setHelpDeskSent] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setSlideIndex((prev) => (prev + 1) % RESORT_SLIDES.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  function loadBooking() {
    api.get('/bookings').then((res) => {
      const bookings = [...res.data].sort((a, b) => new Date(b.checkIn) - new Date(a.checkIn));
      const current = bookings.find((b) => b.status === 'checked-in')
        || bookings.find((b) => b.status === 'confirmed' && new Date(b.checkOut) >= new Date())
        || null;
      setBooking(current);
      setAllBookings(bookings);
    });
  }
  function loadRequests() { api.get('/requests').then((res) => setRequests(res.data)); }
  useEffect(() => {
    loadBooking();
    loadRequests();
    api.get('/offers/my').then((res) => setOffers(res.data)).catch(() => setOffers({ visitCount: 0, offers: [], eligibleOffer: null, nextOffer: null }));
  }, []);
  useEffect(() => {
    if (!events.some((event) => event.type === 'request:update' || event.type === 'request:new')) return;
    loadRequests();
  }, [events]);
  useEffect(() => {
    if (events.some((event) => event.type === 'booking:update')) loadBooking();
  }, [events]);

  async function submitRequest(e) {
    e.preventDefault();
    if (!message.trim()) return;
    setSubmitting(true);
    try {
      const { data } = await api.post('/requests', { message, room: booking?.room?._id });
      setLastIntent(data.intent);
      setMessage('');
      loadRequests();
    } finally { setSubmitting(false); }
  }

  function openRate(r) { setRateFor(r); setRating(5); setComment(''); }

  async function submitRating(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/feedback', { task: rateFor.task._id, booking: booking?._id, rating, comment });
      setRateFor(null);
      loadRequests();
    } finally { setSaving(false); }
  }

  async function submitResortFeedback(e) {
    e.preventDefault();
    setResortSaving(true);
    try {
      await api.post('/feedback', { booking: booking?._id, rating: resortRating, comment: resortComment });
      setResortDone(true);
      setResortComment('');
    } finally { setResortSaving(false); }
  }

  async function sendHelpDeskMessage(e) {
    e.preventDefault();
    if (!helpDeskMessage.trim()) return;
    setHelpDeskSending(true);
    try {
      await api.post('/requests', {
        message: helpDeskMessage.trim(),
        room: booking?.room?._id,
      });
      setHelpDeskMessage('');
      setHelpDeskSent(true);
      loadRequests();
    } finally { setHelpDeskSending(false); }
  }

  async function sendChatMessage(e) {
    e.preventDefault();
    if (!helpDeskMessage.trim()) return;
    if (chatTarget === 'staff' && !activeSupportRequest) return;
    const activeConversation = chatTarget === 'staff' ? activeSupportRequest : requests?.[0];
    if (!activeConversation) return sendHelpDeskMessage(e);
    setHelpDeskSending(true);
    try {
      await api.post(`/requests/${activeConversation._id}/message`, { message: helpDeskMessage.trim() });
      setHelpDeskMessage('');
      loadRequests();
    } finally { setHelpDeskSending(false); }
  }

  const hasActiveStay = booking?.status === 'checked-in';
  const allChatMessages = requests?.flatMap((request) => request.conversation?.length
    ? request.conversation
    : [{ sender: 'guest', message: request.message }]) || [];
  const chatConversation = allChatMessages.filter((entry) => chatTarget === 'staff'
    ? entry.sender === 'guest' || entry.sender === 'staff'
    : entry.sender === 'guest' || entry.sender === 'manager');
  const activeSupportRequest = requests?.find((request) => request.task?.status !== 'completed' && request.task?.assignedStaff);
  const assignedStaffName = activeSupportRequest?.task?.assignedStaff?.user?.name || 'Assigned staff';
  const previousBookings = allBookings.filter((b) => b._id !== booking?._id);

  if (!requests) return <Loader label="Loading your stay..." />;

  return (
    <div className="space-y-6">
      <section className="relative isolate min-h-[220px] overflow-hidden rounded-[26px] bg-brand-900 sm:min-h-[260px]">
        <div className="absolute inset-0 -z-20">
          {RESORT_SLIDES.map((slide, index) => (
            <img
              key={slide.title}
              src={slide.image}
              alt={slide.title}
              className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${index === slideIndex ? 'opacity-100' : 'opacity-0'}`}
              loading="eager"
            />
          ))}
        </div>
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#172f2d]/80 via-[#172f2d]/42 to-transparent" />
        <div className="flex min-h-[220px] items-end justify-between gap-4 p-6 sm:min-h-[260px] sm:p-9">
          <div className="max-w-lg text-white">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-white/75">{RESORT_SLIDES[slideIndex].title}</p>
            <h2 className="text-3xl font-semibold leading-tight sm:text-4xl">Welcome, {user?.name?.split(' ')[0] || 'Guest'}</h2>
            <p className="mt-2 text-sm text-white/80">{RESORT_SLIDES[slideIndex].subtitle}</p>
          </div>
          <div className="hidden items-center gap-2 sm:flex">
            {RESORT_SLIDES.map((slide, index) => (
              <button
                key={slide.title}
                type="button"
                onClick={() => setSlideIndex(index)}
                aria-label={`Show slide ${index + 1}`}
                className={`h-2.5 rounded-full transition-all ${index === slideIndex ? 'w-8 bg-white' : 'w-2.5 bg-white/45 hover:bg-white/70'}`}
              />
            ))}
          </div>
        </div>
      </section>
      <UpcomingEvents compact />
      <div className="card flex flex-col gap-3 border-brand-100 bg-brand-50/60 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div><p className="text-sm font-bold text-ink-900">Planning another stay?</p><p className="mt-1 text-sm text-ink-700/65">Search dates, compare available rooms and use your returning guest offer.</p></div>
        <button type="button" onClick={() => navigate('/book-room')} className="btn-primary shrink-0">Book a stay</button>
      </div>
      {/* Room details — only the room allotted to this guest */}
      <div className="card p-5 sm:p-6">
        <div className="mb-4 flex items-center gap-2 text-brand-700"><BedDouble size={18} /><p className="text-xs font-bold uppercase tracking-[0.1em]">{hasActiveStay ? 'Your current stay' : 'Your upcoming stay'}</p></div>
        {booking?.room ? (
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2"><p className="text-2xl font-extrabold text-ink-900">Room {booking.room.roomNumber}</p><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${hasActiveStay ? 'bg-brand-50 text-brand-700' : 'bg-[#fff4df] text-[#9b681f]'}`}>{booking.status}</span></div>
              <p className="text-sm text-ink-700/60">{booking.room.type} · Sleeps {booking.room.capacity}</p>
              <div className="mt-3 flex items-start gap-2 text-sm text-ink-700/70 sm:text-right">
                <CalendarDays size={16} className="mt-0.5 shrink-0 text-brand-600 sm:hidden" />
                <div>
                  <p>Check-in: {new Date(booking.checkIn).toLocaleDateString()}</p>
                  <p>Check-out: {new Date(booking.checkOut).toLocaleDateString()}</p>
                  <p className="mt-1 font-semibold text-ink-900">Total: {booking.paymentCurrency || 'USD'} {booking.totalPrice?.toFixed?.(2) ?? booking.totalPrice}</p>
                  {booking.discountAmount > 0 && <p className="text-brand-700">Loyalty discount: {booking.paymentCurrency || 'USD'} {booking.discountAmount.toFixed(2)} ({booking.discountPercent}%)</p>}
                </div>
              </div>
            </div>

            {hasActiveStay && booking?.room?._id && (
              <button
                type="button"
                onClick={() => setQrOpen(true)}
                aria-label="Open room access QR"
                className="flex cursor-pointer flex-col items-center gap-2 rounded-2xl border border-ink-900/5 bg-ivory p-3 transition hover:scale-[1.01] hover:shadow-sm"
              >
                <QRCodeSVG value={`${window.location.origin}/room?room=${booking.room._id}`} size={110} />
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-ink-700/60">Room access QR</p>
              </button>
            )}
          </div>
        ) : (
          <div><p className="text-sm text-ink-700/60 mt-1">No upcoming booking found.</p><button type="button" onClick={() => navigate('/book-room')} className="btn-primary mt-4">Book a stay</button></div>
        )}
      </div>

      {offers && (
        <section className="card overflow-hidden border-brand-100">
          <div className="flex flex-col gap-4 bg-brand-50 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div className="flex items-start gap-3"><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-brand-700"><Gift size={21} /></div><div><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-brand-700">Returning guest rewards</p><h3 className="mt-1 text-xl font-bold text-ink-900">Visit {offers.visitCount}</h3><p className="mt-1 text-sm text-ink-700/70">Your rewards grow every time you stay with us.</p></div></div>
            {offers.eligibleOffer ? <div className="rounded-2xl bg-white px-4 py-3 text-center shadow-sm"><p className="text-2xl font-extrabold text-brand-600">{offers.eligibleOffer.discountPercent}% OFF</p><p className="text-xs font-semibold text-ink-700/65">{offers.eligibleOffer.title}</p></div> : <p className="rounded-full bg-white px-3 py-2 text-xs font-semibold text-ink-700/70">Your first reward unlocks on visit {offers.nextOffer?.minVisits || 2}</p>}
          </div>
          <div className="grid gap-3 p-5 sm:grid-cols-3 sm:p-6">{offers.offers.map((offer) => <div key={offer._id} className={`rounded-2xl border p-4 ${offers.visitCount >= offer.minVisits ? 'border-brand-100 bg-brand-50/50' : 'border-sand/70 bg-white'}`}><div className="flex items-center justify-between gap-2"><p className="text-sm font-bold text-ink-900">{offer.title}</p><span className="text-lg font-extrabold text-brand-600">{offer.discountPercent}%</span></div><p className="mt-1 text-xs text-ink-700/60">{offer.description}</p><p className="mt-3 text-[10px] font-bold uppercase tracking-[0.1em] text-ink-700/50">Visit {offer.minVisits}+ {offers.visitCount >= offer.minVisits ? '· Unlocked' : '· Locked'}</p></div>)}</div>
        </section>
      )}

      <div className="card p-5 sm:p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-brand-700">
            <BedDouble size={18} />
            <p className="text-xs font-bold uppercase tracking-[0.1em]">Help desk</p>
          </div>
          <span className="rounded-full bg-brand-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-brand-700">24/7 support</span>
        </div>

        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xl font-extrabold text-ink-900">Need help urgently?</p>
            <p className="mt-1 text-sm text-ink-700/70">
              {activeSupportRequest ? `Your request is assigned to ${assignedStaffName}. You can chat with the manager and assigned staff here.` : 'Send a quick message to the manager and front desk team.'}
            </p>
          </div>

          <button
            type="button"
            onClick={() => { setChatTarget('manager'); setHelpDeskOpen(true); }}
            className="inline-flex items-center justify-center rounded-xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700"
          >
            Chat with manager
          </button>
        </div>

        {activeSupportRequest && (
          <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-brand-100 bg-brand-50 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-ink-900">Assigned staff: {assignedStaffName}</p>
              <p className="mt-1 text-xs text-ink-700/60">{activeSupportRequest.task.assignedStaff.department} · chat available until the task is complete</p>
            </div>
            <button type="button" onClick={() => { setChatTarget('staff'); setHelpDeskOpen(true); }} className="btn-secondary shrink-0 py-2 text-xs">
              Chat with {assignedStaffName}
            </button>
          </div>
        )}

        {helpDeskOpen && (
          <div className="fixed inset-0 z-50 flex flex-col bg-[#f5f1e9]">
            <div className="flex items-center justify-between border-b border-ink-900/5 bg-white px-4 py-3 shadow-sm sm:px-[12%]">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-brand-700">Live conversation</p>
                <p className="mt-1 font-semibold text-ink-900">Manager</p>
                <p className="text-xs text-ink-700/60">Help desk support</p>
              </div>
              <button type="button" onClick={() => setHelpDeskOpen(false)} aria-label="Close chat" className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-ink-900/5 text-ink-700 hover:bg-ink-900/10">
                <X size={18} />
              </button>
            </div>
            <div className="grid min-h-0 flex-1 lg:grid-cols-[280px_1fr]">
              <div className="border-b border-ink-900/5 bg-white p-4 lg:border-b-0 lg:border-r">
                <div className="rounded-2xl bg-brand-50 p-4">
                    <p className="text-sm font-semibold text-ink-900">Manager support</p>
                    <p className="mt-1 text-xs text-ink-700/60">Your private Help Desk chat</p>
                    {activeSupportRequest && <p className="mt-3 text-xs font-semibold text-brand-700">Assigned staff: {assignedStaffName} · {activeSupportRequest.task.assignedStaff.department}</p>}
                  <span className="mt-3 inline-flex rounded-full bg-brand-100 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-brand-700">Available</span>
                </div>
              </div>
              <div className="flex min-h-0 flex-col">
                <div className="border-b border-ink-900/5 bg-white px-4 py-3">
                  <p className="font-semibold text-ink-900">{chatTarget === 'staff' ? assignedStaffName : 'Manager'}</p>
                  <p className="text-xs text-ink-700/60">{chatTarget === 'staff' ? 'Assigned staff chat' : 'Help desk support'}</p>
                  {activeSupportRequest && <p className="mt-1 text-xs text-brand-700">Assigned staff: {assignedStaffName}</p>}
                </div>
                <div className="flex-1 space-y-3 overflow-y-auto bg-[#f5f1e9] p-4 sm:p-6">
                  {chatConversation.length ? chatConversation.map((entry, index) => (
                    <div key={`${requests[0]._id}-${index}`} className={`flex ${entry.sender === 'guest' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[82%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${entry.sender === 'guest' ? 'rounded-br-sm bg-brand-600 text-white' : 'rounded-bl-sm bg-white text-ink-800'}`}>
                        <p className="leading-6">{entry.message}</p>
                        <p className={`mt-1 text-[10px] ${entry.sender === 'guest' ? 'text-white/65' : 'text-ink-700/45'}`}>{entry.sender === 'guest' ? 'You' : entry.sender === 'staff' ? 'Assigned staff' : 'Manager'}</p>
                      </div>
                    </div>
                  )) : <p className="text-sm text-ink-700/60">Start a conversation with the manager.</p>}
                </div>
                <form onSubmit={sendChatMessage} className="flex gap-2 border-t border-ink-900/5 bg-white p-3">
                  <input
                    value={helpDeskMessage}
                    onChange={(e) => setHelpDeskMessage(e.target.value)}
                    placeholder="Write a message..."
                    className="input-field flex-1"
                  />
                  <button type="submit" disabled={helpDeskSending || !helpDeskMessage.trim() || (chatTarget === 'staff' && !activeSupportRequest)} className="btn-primary px-4">
                    {helpDeskSending ? '...' : <Send size={16} />}
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {helpDeskSent && (
          <p className="mt-3 text-sm font-medium text-brand-700">Your message has been sent to the manager.</p>
        )}
      </div>

      {/* Submit a request */}
      {hasActiveStay ? (
        <form onSubmit={submitRequest} className="card p-5 flex flex-col sm:flex-row gap-3">
          <input value={message} onChange={(e) => setMessage(e.target.value)}
            placeholder='e.g. "My AC is not cooling" or "I need two towels"'
            className="input-field flex-1" />
          <button disabled={submitting} className="btn-primary sm:w-auto">
            {submitting ? 'Submitting...' : <><Send size={16} /> Submit request</>}
          </button>
        </form>
      ) : (
        <div className="card p-4 text-sm text-ink-700/70">
          Request submission is available only during an active checked-in stay.
        </div>
      )}

      {lastIntent && (
        <div className="card p-4 bg-brand-50 border-brand-100">
          <p className="text-sm font-semibold text-brand-700">Intent detected: {lastIntent.category} · priority {lastIntent.priority}</p>
          <p className="text-xs text-brand-700/70 mt-1">{lastIntent.explanation}</p>
        </div>
      )}

      <div className="card p-5">
        <div className="mb-4 flex items-center gap-2 text-brand-700"><CalendarDays size={18} /><p className="text-xs font-bold uppercase tracking-[0.1em]">Booking history</p></div>
        {previousBookings.length ? (
          <div className="space-y-3">
            {previousBookings.map((b) => (
              <div key={b._id} className="rounded-2xl border border-ink-900/5 bg-ivory px-4 py-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold text-ink-900">Room {b.room?.roomNumber || '—'} · {b.paymentCurrency || 'USD'} {b.totalPrice?.toFixed?.(2) ?? b.totalPrice}</p>
                    <p className="text-xs text-ink-700/60">{b.room?.type || 'Room'} · {new Date(b.checkIn).toLocaleDateString()} to {new Date(b.checkOut).toLocaleDateString()}</p>
                  </div>
                  <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full ${b.status === 'checked-out' ? 'bg-brand-50 text-brand-700' : 'bg-[#fbf0ed] text-[#a84f3b]'}`}>
                    {b.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-ink-700/60">No previous bookings yet.</p>
        )}
      </div>

      {/* My requests + per-request feedback */}
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-ink-900/5 text-ink-700/70 text-left">
            <tr>
              <th className="px-4 py-3">Message</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Priority</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Manager reply</th>
              <th className="px-4 py-3">Feedback</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((r) => (
              <tr key={r._id} className="border-t border-ink-900/5">
                <td className="px-4 py-3 max-w-xs truncate">{r.message}</td>
                <td className="px-4 py-3">{r.category}</td>
                <td className="px-4 py-3"><span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full ${PRIORITY_STYLE[r.priority]}`}>{r.priority}</span></td>
                <td className="px-4 py-3 capitalize">{r.status}</td>
                <td className="px-4 py-3">
                  {r.managerReply ? <span className="text-xs text-brand-700">{r.managerReply}</span> : <span className="text-xs text-ink-700/40">No reply yet</span>}
                </td>
                <td className="px-4 py-3">
                  {r.task?.status === 'completed' && !r.feedbackGiven && (
                    <button onClick={() => openRate(r)} className="btn-secondary py-1 px-2 text-xs"><Star size={14} /> Rate this request</button>
                  )}
                  {r.task?.status === 'completed' && r.feedbackGiven && <span className="text-xs font-semibold text-brand-700">Thanks for rating!</span>}
                  {r.task && r.task.status !== 'completed' && <span className="text-xs text-ink-700/40">Pending completion</span>}
                </td>
              </tr>
            ))}
            {!requests.length && (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-ink-700/50">No requests yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {qrOpen && booking?.room?._id && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0f1f1d]/80 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-[30px] border border-white/10 bg-white p-6 text-center shadow-2xl">
            <button
              type="button"
              onClick={() => setQrOpen(false)}
              aria-label="Close QR viewer"
              className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-ink-900/5 text-ink-700 transition hover:bg-ink-900/10"
            >
              <X size={18} />
            </button>
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-brand-700">Room access</p>
            <h3 className="mt-3 text-2xl font-bold text-ink-900">Room {booking.room.roomNumber}</h3>
            <div className="mt-5 flex justify-center rounded-2xl bg-ivory p-5">
              <QRCodeSVG value={`${window.location.origin}/room?room=${booking.room._id}`} size={240} />
            </div>
            <p className="mt-4 text-sm text-ink-700/70">Scan this QR to open your room access flow.</p>
            <button
              type="button"
              onClick={() => {
                setQrOpen(false);
                navigate(`/room?room=${booking.room._id}`);
              }}
              className="btn-primary mt-5 w-full"
            >
              Open room access
            </button>
          </div>
        </div>
      )}

      {rateFor && (
        <div className="card p-5">
          <p className="text-sm font-semibold text-ink-900">Rate: "{rateFor.message}"</p>
          <form onSubmit={submitRating} className="mt-3 space-y-3">
            <div className="flex gap-1 text-2xl">
              {[1, 2, 3, 4, 5].map((n) => (
                <button type="button" key={n} aria-label={`Rate ${n} out of 5`} onClick={() => setRating(n)} className={`p-1 transition-colors ${n <= rating ? 'text-coral' : 'text-sand'}`}><Star size={24} fill="currentColor" /></button>
              ))}
            </div>
            <textarea className="input-field" rows={2} placeholder="Comment (optional)" value={comment} onChange={(e) => setComment(e.target.value)} />
            <div className="flex gap-2">
              <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving...' : 'Submit'}</button>
              <button type="button" className="btn-secondary" onClick={() => setRateFor(null)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Whole-resort feedback — not tied to any one request */}
      <div className="card p-5">
        <p className="text-sm font-bold text-ink-900">Feedback for the whole resort</p>
        <p className="text-xs text-ink-700/60 mt-0.5">Not about one request — how's your overall stay?</p>
        {resortDone ? (
          <p className="mt-3 text-sm text-brand-700">Thanks for your feedback!</p>
        ) : (
          <form onSubmit={submitResortFeedback} className="mt-3 space-y-3">
            <div className="flex gap-1 text-2xl">
              {[1, 2, 3, 4, 5].map((n) => (
                <button type="button" key={n} aria-label={`Rate ${n} out of 5`} onClick={() => setResortRating(n)} className={`p-1 transition-colors ${n <= resortRating ? 'text-coral' : 'text-sand'}`}><Star size={24} fill="currentColor" /></button>
              ))}
            </div>
            <textarea className="input-field" rows={2} placeholder="Comment (optional)" value={resortComment} onChange={(e) => setResortComment(e.target.value)} />
            <button type="submit" disabled={resortSaving} className="btn-primary">{resortSaving ? 'Saving...' : 'Submit resort feedback'}</button>
          </form>
        )}
      </div>
    </div>
  );
}