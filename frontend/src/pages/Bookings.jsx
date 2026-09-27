import { useEffect, useState } from 'react';
import api from '../api/axios';
import Loader from '../components/common/Loader';
import { useSocket } from '../context/SocketContext';

const STATUS_STYLE = {
  confirmed: 'bg-brand-50 text-brand-700',
  pending: 'bg-[#fbf0ed] text-[#a84f3b]',
  cancelled: 'bg-ivory text-ink-700/65',
  'checked-in': 'bg-brand-50 text-brand-700',
  completed: 'bg-ivory text-ink-700/65',
};

export default function Bookings() {
  const [bookings, setBookings] = useState(null);
  const [search, setSearch] = useState('');
  const { events } = useSocket();

  function load() { api.get('/bookings').then((res) => setBookings(res.data)); }
  useEffect(load, []);
  useEffect(() => {
    if (events.some((event) => event.type === 'booking:update')) load();
  }, [events]);
  if (!bookings) return <Loader label="Loading bookings..." />;

  const filteredBookings = bookings.filter((b) => {
    const value = search.trim().toLowerCase();
    if (!value) return true;

    const guestName = (b.guest?.name || '').toLowerCase();
    const guestPhone = (b.guest?.phone || '').toLowerCase();
    const guestEmail = (b.guest?.email || '').toLowerCase();

    return guestName.includes(value) || guestPhone.includes(value) || guestEmail.includes(value);
  });

  return (
    <div className="card overflow-hidden">
      <div className="border-b border-sand/50 px-5 py-5 sm:px-6">
        <p className="text-base font-semibold text-ink-900">Recent bookings</p>
        <p className="mt-1 text-xs text-ink-700/60">A clear view of upcoming and current stays</p>
      </div>
      <div className="px-5 py-4 sm:px-6">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search guest by name, phone, or email"
          className="input-field w-full sm:max-w-md"
        />
      </div>
      <div className="overflow-x-auto">
      <table className="w-full min-w-[760px] text-sm">
        <thead className="bg-ink-900/5 text-ink-700/70 text-left">
          <tr>
            <th className="px-4 py-3 font-semibold">Guest</th>
            <th className="px-4 py-3 font-semibold">Room</th>
            <th className="px-4 py-3 font-semibold">Check-in</th>
            <th className="px-4 py-3 font-semibold">Check-out</th>
            <th className="px-4 py-3 font-semibold">Total</th>
            <th className="px-4 py-3 font-semibold">Discount</th>
            <th className="px-4 py-3 font-semibold">Payment</th>
            <th className="px-4 py-3 font-semibold">Status</th>
          </tr>
        </thead>
        <tbody>
          {filteredBookings.length ? filteredBookings.map((b) => (
            <tr key={b._id} className="border-t border-sand/40">
              <td className="px-4 py-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-sage/35 text-xs font-bold text-brand-700">{b.guest?.name?.[0]?.toUpperCase() || '?'}</span>
                  <div>
                    <span className="font-semibold text-ink-900 block">{b.guest?.name}</span>
                    <span className="text-[11px] text-ink-700/60 block">{b.guest?.email || 'No email'}</span>
                    <span className="text-[11px] text-ink-700/60 block">{b.guest?.phone || 'No phone'}</span>
                  </div>
                </div>
              </td>
              <td className="px-4 py-4"><span className="font-semibold text-ink-900">Room {b.room?.roomNumber}</span><span className="block text-xs text-ink-700/60">{b.room?.type}</span></td>
              <td className="px-4 py-4">{new Date(b.checkIn).toLocaleDateString()}</td>
              <td className="px-4 py-4">{new Date(b.checkOut).toLocaleDateString()}</td>
              <td className="px-4 py-4 font-semibold text-ink-900">{b.paymentCurrency || 'USD'} {Number(b.totalPrice || 0).toFixed(2)}{b.originalPrice > b.totalPrice && <span className="block text-[10px] font-normal text-ink-700/50">was {b.paymentCurrency || 'USD'} {Number(b.originalPrice).toFixed(2)}</span>}</td>
              <td className="px-4 py-4">{b.discountAmount > 0 ? <span className="font-semibold text-brand-700">-${Number(b.discountAmount).toFixed(2)} ({b.discountPercent}%)</span> : <span className="text-ink-700/45">—</span>}</td>
              <td className="px-4 py-4"><span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold capitalize ${b.paymentStatus === 'paid' ? 'bg-brand-50 text-brand-700' : b.paymentStatus === 'failed' || b.paymentStatus === 'cancelled' ? 'bg-[#fbf0ed] text-[#a84f3b]' : 'bg-ivory text-ink-700/65'}`}>{b.paymentStatus || 'not_required'}</span>{b.razorpayPaymentId && <span className="mt-1 block max-w-[130px] truncate text-[10px] text-ink-700/50" title={b.razorpayPaymentId}>{b.razorpayPaymentId}</span>}</td>
              <td className="px-4 py-4"><span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold capitalize ${STATUS_STYLE[b.status] || 'bg-ivory text-ink-700'}`}>{b.status}</span></td>
            </tr>
          )) : (
            <tr>
              <td colSpan={8} className="px-4 py-8 text-center text-sm text-ink-700/60">No guest found for this search.</td>
            </tr>
          )}
        </tbody>
      </table>
      </div>
    </div>
  );
}
