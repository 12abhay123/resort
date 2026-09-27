import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Clock3, CreditCard } from 'lucide-react';
import api from '../api/axios';
import Loader from '../components/common/Loader';

export default function BookingConfirmation() {
  const { bookingId } = useParams();
  const [booking, setBooking] = useState(null);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  async function load() {
    setRefreshing(true);
    try {
      const { data } = await api.get(`/bookings/payment/${bookingId}/status`);
      setBooking(data);
      setError('');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not load booking status');
    } finally { setRefreshing(false); }
  }

  useEffect(() => { load(); }, [bookingId]);
  if (!booking && !error) return <Loader label="Verifying booking payment..." />;

  const isPaid = booking?.paymentStatus === 'paid' && booking.status === 'confirmed';
  const isPending = booking && ['pending-payment', 'payment-cancelled', 'payment-failed'].includes(booking.status) && booking.paymentStatus !== 'paid';

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Link to="/dashboard" className="inline-flex items-center gap-2 text-sm font-semibold text-brand-700 hover:underline"><ArrowLeft size={16} /> Back to dashboard</Link>
      {error && <div className="rounded-xl border border-coral/20 bg-[#fbf0ed] p-4 text-sm text-[#a84f3b]">{error}</div>}
      {isPaid && <section className="card space-y-5 border-brand-100 p-6 sm:p-8"><div className="flex items-center gap-3"><div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-brand-700"><CheckCircle2 size={26} /></div><div><p className="eyebrow">Payment successful</p><h1 className="text-2xl font-bold text-ink-900">Booking confirmed</h1></div></div><p className="text-sm text-ink-700/70">Your reservation has been confirmed after server-side payment verification. A receipt has been sent if your account has an email address.</p><div className="grid gap-3 rounded-2xl bg-ivory p-4 text-sm sm:grid-cols-2"><p>Booking ID<br /><strong className="break-all text-ink-900">{booking._id}</strong></p><p>Payment ID<br /><strong className="break-all text-ink-900">{booking.razorpayPaymentId}</strong></p><p>Room<br /><strong className="text-ink-900">{booking.room?.roomNumber ? `Room ${booking.room.roomNumber}` : 'Room reserved'}</strong></p><p>Stay<br /><strong className="text-ink-900">{new Date(booking.checkIn).toLocaleDateString()} – {new Date(booking.checkOut).toLocaleDateString()}</strong></p><p>Paid amount<br /><strong className="text-ink-900">{booking.paymentCurrency} {Number(booking.totalPrice).toFixed(2)}</strong></p><p>Payment time<br /><strong className="text-ink-900">{booking.paymentTimestamp ? new Date(booking.paymentTimestamp).toLocaleString() : 'Verified'}</strong></p></div>{booking.discountAmount > 0 && <p className="text-sm font-semibold text-brand-700">Loyalty reward applied: {booking.discountPercent}% off · saved {booking.paymentCurrency} {Number(booking.discountAmount).toFixed(2)}</p>}<Link to="/dashboard" className="btn-primary">Go to guest dashboard</Link></section>}
      {isPending && <section className="card space-y-4 p-6"><div className="flex items-center gap-3"><Clock3 size={24} className="text-[#9b681f]" /><div><p className="eyebrow">Payment status</p><h1 className="text-2xl font-bold text-ink-900">{booking.paymentStatus === 'pending' ? 'Payment is processing' : `Payment ${booking.paymentStatus}`}</h1></div></div><p className="text-sm text-ink-700/70">This booking is not confirmed until Razorpay payment is verified. You can safely refresh this status.</p><p className="text-sm text-ink-700">Booking ID: <strong>{booking._id}</strong></p><div className="flex flex-wrap gap-2"><button type="button" disabled={refreshing} onClick={load} className="btn-secondary"><CreditCard size={15} /> {refreshing ? 'Checking...' : 'Refresh payment status'}</button><Link to="/book-room" className="btn-primary">Retry payment</Link></div></section>}
      {booking && !isPaid && !isPending && <section className="card space-y-3 p-6"><h1 className="text-xl font-bold text-ink-900">Booking not confirmed</h1><p className="text-sm text-ink-700/70">Current booking status: {booking.status} · payment: {booking.paymentStatus}</p><Link to="/book-room" className="btn-primary">Book a room</Link></section>}
    </div>
  );
}
