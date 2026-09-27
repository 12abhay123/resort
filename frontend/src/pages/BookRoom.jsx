import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BedDouble, CalendarDays, CheckCircle2, CreditCard, QrCode, Smartphone, UsersRound } from 'lucide-react';
import api from '../api/axios';
import Loader from '../components/common/Loader';

const API_ORIGIN = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '');
const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
const nextDay = new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10);

function imageFor(room) {
  if (room.image) return room.image.startsWith('http') ? room.image : `${API_ORIGIN}${room.image}`;
  return 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=900&q=80';
}

export default function BookRoom() {
  const navigate = useNavigate();
  const [checkIn, setCheckIn] = useState(tomorrow);
  const [checkOut, setCheckOut] = useState(nextDay);
  const [guestCount, setGuestCount] = useState(1);
  const [rooms, setRooms] = useState(null);
  const [loading, setLoading] = useState(false);
  const [bookingId, setBookingId] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(null);
  const [retryBookingId, setRetryBookingId] = useState('');
  const [pendingBooking, setPendingBooking] = useState(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const attemptKeyRef = useRef({ context: '', key: '' });

  const searchRooms = async () => {
    setLoading(true); setError(''); setRooms(null);
    try {
      const { data } = await api.get('/bookings/available', { params: { checkIn, checkOut, guests: guestCount } });
      setRooms(data);
    } catch (searchError) { setError(searchError.response?.data?.message || 'Could not find available rooms'); setRooms([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { searchRooms(); }, []);
  useEffect(() => {
    api.get('/bookings').then(({ data }) => {
      const pending = data.find((booking) => ['pending-payment', 'payment-failed', 'payment-cancelled'].includes(booking.status) && booking.paymentStatus !== 'paid');
      if (pending) {
        setPendingBooking(pending);
        setRetryBookingId(pending._id);
      }
    }).catch(() => {});
  }, []);

  function loadRazorpay() {
    if (window.Razorpay) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Could not load secure Razorpay checkout'));
      document.body.appendChild(script);
    });
  }

  async function openCheckout(order, room) {
    await loadRazorpay();
    setPaymentLoading(true);
    return new Promise((resolve) => {
      let settled = false;
      const checkout = new window.Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: 'Staylix Resort',
        description: `Room ${room.roomNumber} · ${order.booking.checkIn.slice(0, 10)} to ${order.booking.checkOut.slice(0, 10)}`,
        order_id: order.orderId,
        prefill: { ...order.guest, contact: order.guest.phone || '' },
        notes: { bookingId: order.bookingId },
        theme: { color: '#1f5b50' },
        modal: {
          ondismiss: async () => {
            if (settled) return;
            settled = true;
            let alreadyPaid = false;
            try {
              await api.post(`/bookings/payment/${order.bookingId}/cancel`);
              setPendingBooking((current) => ({ ...current, _id: order.bookingId, status: 'payment-cancelled' }));
              setRetryBookingId(order.bookingId);
            } catch {
              const { data } = await api.get(`/bookings/payment/${order.bookingId}/status`).catch(() => ({ data: null }));
              if (data?.paymentStatus === 'paid') {
                alreadyPaid = true;
                setSuccess(data);
                setPendingBooking(null);
                setRetryBookingId('');
                attemptKeyRef.current = { context: '', key: '' };
              } else {
                setPendingBooking((current) => ({ ...current, _id: order.bookingId }));
                setRetryBookingId(order.bookingId);
              }
            }
            setPaymentLoading(false);
            if (!alreadyPaid) setError('Payment cancelled. Your room is held briefly; retry payment to confirm the same booking.');
            resolve();
          },
        },
        handler: async (response) => {
          if (settled) return;
          settled = true;
          try {
            const { data } = await api.post('/bookings/payment/verify', response);
            setSuccess(data.booking);
            setPendingBooking(null);
            setRetryBookingId('');
            attemptKeyRef.current = { context: '', key: '' };
            setError('');
            navigate(`/booking-confirmation/${data.booking._id}`);
          } catch (verifyError) {
            const latest = await api.get(`/bookings/payment/${order.bookingId}/status`).catch(() => null);
            if (latest?.data?.paymentStatus === 'paid') {
              setPendingBooking(null);
              setRetryBookingId('');
              navigate(`/booking-confirmation/${order.bookingId}`);
            } else {
              setRetryBookingId(order.bookingId);
              setError(verifyError.response?.data?.message || 'Payment was received but could not be verified yet. Retry payment for this booking.');
            }
          } finally {
            setPaymentLoading(false);
            resolve();
          }
        },
      });
      checkout.on('payment.failed', async (failure) => {
        if (settled) return;
        settled = true;
        const failureReason = failure.error?.description || 'Payment failed';
        await api.post(`/bookings/payment/${order.bookingId}/failure`, { reason: failureReason }).catch(() => {});
        setPendingBooking((current) => ({ ...current, _id: order.bookingId, status: 'payment-failed' }));
        setRetryBookingId(order.bookingId);
        setError(`${failureReason}. Retry payment for the same booking.`);
        setPaymentLoading(false);
        resolve();
      });
      checkout.open();
    });
  }

  async function bookRoom(room) {
    setBookingId(room._id); setError(''); setSuccess(null);
    try {
      const context = `${room._id}:${checkIn}:${checkOut}:${guestCount}`;
      if (attemptKeyRef.current.context !== context) attemptKeyRef.current = { context, key: window.crypto.randomUUID() };
      const requestKey = attemptKeyRef.current.key;
      const { data } = await api.post('/bookings/payment/order', { room: room._id, checkIn, checkOut, guestCount, idempotencyKey: requestKey }, { headers: { 'Idempotency-Key': requestKey } });
      setRetryBookingId(data.bookingId);
      setPendingBooking({ _id: data.bookingId, room: { roomNumber: room.roomNumber }, checkIn, checkOut, totalPrice: room.pricing.totalPrice, paymentCurrency: room.currency, status: 'pending-payment' });
      await openCheckout(data, room);
    } catch (bookingError) { setError(bookingError.response?.data?.message || bookingError.message || 'Could not complete your booking'); setPaymentLoading(false); }
    finally { setBookingId(''); }
  }

  async function retryPayment() {
    setError(''); setPaymentLoading(true);
    try {
      const { data } = await api.post(`/bookings/payment/${retryBookingId}/retry`);
      const room = rooms?.find((item) => item._id === data.booking.room) || { roomNumber: pendingBooking?.room?.roomNumber || 'Reserved room' };
      setPendingBooking((current) => ({ ...current, _id: data.bookingId, status: 'pending-payment' }));
      await openCheckout(data, room);
    } catch (retryError) {
      if (retryError.response?.status === 409) {
        const latest = await api.get(`/bookings/payment/${retryBookingId}/status`).catch(() => null);
        if (latest?.data?.paymentStatus === 'paid') {
          navigate(`/booking-confirmation/${retryBookingId}`);
          setPaymentLoading(false);
          return;
        }
      }
      setError(retryError.response?.data?.message || 'Could not retry payment. Search available rooms again.');
      setPaymentLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[26px] bg-[#17312f] p-6 text-white sm:p-9">
        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/70">Staylix reservations</p>
        <h2 className="mt-2 text-3xl font-semibold sm:text-4xl">Find your room.</h2>
        <p className="mt-2 max-w-xl text-sm leading-6 text-white/75">Choose your dates and we’ll show rooms available for your stay. Returning guest rewards apply automatically.</p>
      </section>

      <form onSubmit={(event) => { event.preventDefault(); searchRooms(); }} className="card grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_150px_auto] lg:items-end">
        <div><label className="label">Check-in</label><input required type="date" min={new Date().toISOString().slice(0, 10)} className="input-field" value={checkIn} onChange={(event) => setCheckIn(event.target.value)} /></div>
        <div><label className="label">Check-out</label><input required type="date" min={checkIn || tomorrow} className="input-field" value={checkOut} onChange={(event) => setCheckOut(event.target.value)} /></div>
        <div><label className="label">Guests</label><input required type="number" min="1" max="20" className="input-field" value={guestCount} onChange={(event) => setGuestCount(Number(event.target.value))} /></div>
        <button type="submit" disabled={loading} className="btn-primary"><CalendarDays size={16} /> {loading ? 'Searching...' : 'Search rooms'}</button>
      </form>

      {success && <div className="card space-y-3 border-brand-100 bg-brand-50 p-5"><div className="flex items-center gap-2 text-brand-700"><CheckCircle2 size={19} /><h3 className="font-bold">Booking confirmed · Paid</h3></div><div className="grid gap-2 text-sm text-ink-700 sm:grid-cols-2"><p>Booking ID: <strong className="text-ink-900">{success._id}</strong></p><p>Payment ID: <strong className="text-ink-900">{success.razorpayPaymentId}</strong></p><p>Room: <strong className="text-ink-900">{success.room?.roomNumber}</strong></p><p>Dates: <strong className="text-ink-900">{new Date(success.checkIn).toLocaleDateString()} – {new Date(success.checkOut).toLocaleDateString()}</strong></p><p>Paid amount: <strong className="text-ink-900">{success.paymentCurrency} {Number(success.totalPrice).toFixed(2)}</strong></p><p>Payment time: <strong className="text-ink-900">{success.paymentTimestamp ? new Date(success.paymentTimestamp).toLocaleString() : 'Just now'}</strong></p></div></div>}
      {error && <div className="rounded-xl border border-coral/20 bg-[#fbf0ed] px-4 py-3 text-sm text-[#a84f3b]">{error}</div>}
      {pendingBooking && !success && <div className="card flex flex-col gap-3 border-sand/70 p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-semibold text-ink-900">Payment {pendingBooking.status === 'pending-payment' ? 'pending' : pendingBooking.status.replace('payment-', '')} · Room {pendingBooking.room?.roomNumber || 'reservation'}</p><p className="mt-1 text-xs text-ink-700/60">Booking ID: {pendingBooking._id}</p></div>{retryBookingId && <button type="button" disabled={paymentLoading} onClick={retryPayment} className="btn-primary">{paymentLoading ? 'Opening checkout...' : 'Retry payment'}</button>}</div>}
      {loading && <Loader label="Checking room availability..." />}
      {rooms && !loading && !rooms.length && <div className="card p-8 text-center"><BedDouble size={28} className="mx-auto text-brand-600" /><p className="mt-3 font-semibold text-ink-900">No rooms available for those dates</p><p className="mt-1 text-sm text-ink-700/60">Try changing your dates or check back later.</p></div>}

      {rooms?.length > 0 && <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{rooms.map((room) => (
        <article key={room._id} className="card overflow-hidden">
          <img src={imageFor(room)} alt={`${room.type} room ${room.roomNumber}`} className="h-48 w-full object-cover" />
          <div className="space-y-4 p-5">
            <div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[0.12em] text-brand-700">{room.type}</p><h3 className="mt-1 text-xl font-bold text-ink-900">Room {room.roomNumber}</h3></div><span className="inline-flex items-center gap-1 rounded-full bg-ivory px-2.5 py-1 text-xs font-semibold text-ink-700"><UsersRound size={13} /> Up to {room.capacity}</span></div>
            <div className="rounded-xl bg-ivory p-3"><p className="text-xs text-ink-700/60">{room.nights} night{room.nights === 1 ? '' : 's'} · {room.currency} {Number(room.basePrice).toFixed(2)}/night</p>{room.pricing.discountAmount > 0 && <p className="mt-2 text-xs font-semibold text-brand-700">{room.pricing.appliedOffer?.title} · {room.pricing.discountPercent}% off (save {room.currency} {room.pricing.discountAmount.toFixed(2)})</p>}<div className="mt-2 flex items-end justify-between"><span className="text-xs text-ink-700/60">Total</span><span className="text-2xl font-extrabold text-ink-900">{room.currency} {room.pricing.totalPrice.toFixed(2)}</span></div></div>
            <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] font-semibold text-ink-700/60">{room.currency === 'INR' && <span className="inline-flex items-center gap-1"><QrCode size={12} /> UPI / QR</span>}<span className="inline-flex items-center gap-1"><CreditCard size={12} /> Cards</span><span className="inline-flex items-center gap-1"><Smartphone size={12} /> Bank OTP if required</span></div>
            <button type="button" disabled={bookingId === room._id || paymentLoading} onClick={() => bookRoom(room)} className="btn-primary w-full">{bookingId === room._id || paymentLoading ? 'Opening secure checkout...' : 'Confirm & pay'}</button>
          </div>
        </article>
      ))}</div>}
    </div>
  );
}
