import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import Loader from '../components/common/Loader';

// Reached by manager scanning a room's QR code:
//   /checkin?room=<roomId>
// Room available  -> guest-details form -> "Check in"
// Room occupied    -> current guest summary -> "Check out"
export default function CheckIn() {
  const [params] = useSearchParams();
  const roomId = params.get('room');
  const navigate = useNavigate();

  const [room, setRoom] = useState(null);
  const [booking, setBooking] = useState(null);
  const [form, setForm] = useState({ name: '', phone: '', email: '', guestCount: 1, checkOut: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState('');

  function load() {
    if (!roomId) return;
    api.get('/rooms').then((res) => {
      const r = res.data.find((x) => x._id === roomId);
      setRoom(r || null);
      setBooking(r?.currentBooking || null);
    });
  }
  useEffect(load, [roomId]);

  if (!roomId) {
    return (
      <div className="card p-6 max-w-lg mx-auto text-center">
        <p className="text-ink-900 font-semibold">No room in this link.</p>
        <p className="text-sm text-ink-700/60 mt-1">Scan a room's QR code from the Rooms page.</p>
        <Link to="/rooms" className="btn-primary inline-block mt-4">Go to Rooms</Link>
      </div>
    );
  }
  if (!room) return <Loader label="Loading room..." />;

  async function handleCheckIn(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api.post('/bookings/checkin', {
        room: roomId,
        name: form.name,
        phone: form.phone,
        email: form.email || undefined,
        guestCount: Number(form.guestCount) || 1,
        checkOut: form.checkOut || undefined,
      });
      setDone('checked-in');
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Check-in failed');
    } finally {
      setSaving(false);
    }
  }

  async function handleCheckOut() {
    setSaving(true);
    setError('');
    try {
      await api.post('/bookings/checkout', { room: roomId });
      setDone('checked-out');
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Check-out failed');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="card p-6 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase font-bold text-ink-700/50">Room</p>
          <p className="text-2xl font-extrabold text-ink-900">{room.roomNumber}</p>
          <p className="text-sm text-ink-700/60">{room.type} · Sleeps {room.capacity}</p>
        </div>
        <span className={`text-xs font-bold uppercase px-3 py-1 rounded-full ${room.status === 'occupied' ? 'bg-[#fbf0ed] text-[#a84f3b]' : 'bg-brand-50 text-brand-700'}`}>
          {room.status}
        </span>
      </div>

      {error && <p className="mt-4 rounded-xl border border-coral/20 bg-[#fbf0ed] px-3 py-2 text-sm text-[#a84f3b]">{error}</p>}

      {done === 'checked-in' && (
        <div className="mt-4 rounded-xl border border-brand-100 bg-brand-50 px-3 py-2 text-sm text-brand-700">
          Guest checked in. They can now sign in with phone <strong>{form.phone}</strong> under "Guest" login.
        </div>
      )}
      {done === 'checked-out' && (
        <div className="mt-4 rounded-xl border border-brand-100 bg-brand-50 px-3 py-2 text-sm text-brand-700">
          Guest checked out. Their temporary login no longer works.
        </div>
      )}

      {room.status !== 'occupied' && done !== 'checked-in' && (
        <form onSubmit={handleCheckIn} className="mt-6 space-y-4">
          <div>
            <label className="label">Guest name</label>
            <input required className="input-field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="label">Phone number (their login for the stay)</label>
            <input required type="tel" className="input-field" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div>
            <label className="label">Email (optional)</label>
            <input type="email" className="input-field" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Guests</label>
              <input type="number" min="1" className="input-field" value={form.guestCount} onChange={(e) => setForm({ ...form, guestCount: e.target.value })} />
            </div>
            <div>
              <label className="label">Check-out date</label>
              <input type="date" className="input-field" value={form.checkOut} onChange={(e) => setForm({ ...form, checkOut: e.target.value })} />
            </div>
          </div>
          <button type="submit" disabled={saving} className="btn-primary w-full py-3">
            {saving ? 'Checking in...' : 'Check in'}
          </button>
        </form>
      )}

      {room.status === 'occupied' && done !== 'checked-out' && (
        <div className="mt-6 space-y-3">
          <p className="text-sm text-ink-700/70">This room is currently occupied.</p>
          <button onClick={handleCheckOut} disabled={saving} className="btn-primary w-full py-3">
            {saving ? 'Checking out...' : 'Check out'}
          </button>
        </div>
      )}

      <button onClick={() => navigate('/rooms')} className="btn-secondary w-full py-2 mt-4 text-sm">Back to Rooms</button>
    </div>
  );
}