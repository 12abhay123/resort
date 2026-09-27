import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import Loader from '../components/common/Loader';
import StatCard from '../components/dashboard/StatCard';
import RevenueChart from '../components/dashboard/RevenueChart';
import AlertCard from '../components/dashboard/AlertCard';
import PredictionCard from '../components/intelligence/PredictionCard';
import QrScanner from '../components/common/QrScanner';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowUpRight, QrCode } from 'lucide-react';

const HERO_IMAGES = ['/img/p1.jpg', '/img/p2.jpg', '/img/p3.jpg', '/img/p4.jpg', '/img/p5.jpg'];

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

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [scannerOpen, setScannerOpen] = useState(false);
  const [heroImageIndex, setHeroImageIndex] = useState(0);
  const { events } = useSocket();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/dashboard/summary').then((res) => setData(res.data)).catch((e) => setError(e.response?.data?.message || 'Failed to load dashboard'));
  }, [events.length]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setHeroImageIndex((current) => (current + 1) % HERO_IMAGES.length);
    }, 5500);
    return () => window.clearInterval(timer);
  }, []);

  function handleScan(text) {
    setScannerOpen(false);
    const roomId = extractRoomId(text);
    navigate(`/checkin?room=${roomId}`);
  }

  if (error) return <p className="text-coral">{error}</p>;
  if (!data) return <Loader label="Loading dashboard..." />;

  return (
    <div className="space-y-6">
      <section className="relative isolate min-h-[270px] overflow-hidden rounded-[28px] bg-brand-900 sm:min-h-[310px]">
        <AnimatePresence initial={false}>
          <motion.img
            key={HERO_IMAGES[heroImageIndex]}
            src={HERO_IMAGES[heroImageIndex]}
            alt={`Resort view ${heroImageIndex + 1}`}
            className="absolute inset-0 -z-20 h-full w-full object-cover"
            initial={{ opacity: 0, scale: 1.025 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.75, ease: 'easeInOut' }}
            loading="eager"
          />
        </AnimatePresence>
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#172f2d]/85 via-[#172f2d]/48 to-[#172f2d]/5" />
        <div className="absolute right-5 top-5 z-10 flex items-center gap-1.5 rounded-full border border-white/20 bg-ink-900/20 px-2.5 py-2 backdrop-blur-sm sm:right-7 sm:top-7" aria-label="Resort photo slides">
          {HERO_IMAGES.map((image, index) => (
            <button
              key={image}
              type="button"
              aria-label={`Show resort photo ${index + 1}`}
              aria-current={index === heroImageIndex ? 'true' : undefined}
              onClick={() => setHeroImageIndex(index)}
              className={`h-1.5 rounded-full transition-none ${index === heroImageIndex ? 'w-5 bg-white' : 'w-1.5 bg-white/55 hover:bg-white/85'}`}
            />
          ))}
        </div>
        <div className="flex min-h-[270px] flex-col items-start justify-between gap-8 p-6 sm:min-h-[310px] sm:flex-row sm:items-end sm:p-9 lg:p-11">
          <div className="max-w-2xl text-white">
            <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.18em] text-white/75">Good morning, {user?.name?.split(' ')[0] || 'Admin'}</p>
            <h2 className="max-w-xl text-3xl font-semibold leading-tight sm:text-4xl">Welcome back to Staylix</h2>
            <p className="mt-2 text-sm text-white/80 sm:text-base">Your resort, smarter than ever.</p>
          </div>
          {user?.role === 'manager' && (
            <button onClick={() => setScannerOpen(true)} className="inline-flex min-h-11 shrink-0 items-center gap-2.5 rounded-xl border border-white/30 bg-white/15 px-4 text-sm font-semibold text-white shadow-sm backdrop-blur-md transition-colors hover:bg-white/25">
              <QrCode size={17} strokeWidth={1.8} /> Scan room QR <ArrowUpRight size={15} />
            </button>
          )}
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard label="Total Rooms" value={data.totalRooms} />
        <StatCard label="Occupied" value={data.occupiedRooms} />
        <StatCard label="Available" value={data.availableRooms} />
        <StatCard label="Today's Occupancy" value={`${data.occupancyPercentage}%`} />
        <StatCard label="Today's Revenue" value={`$${data.todayRevenue?.toLocaleString()}`} />
        <StatCard label="Active Requests" value={data.activeRequests} accent="warn" />
        <StatCard label="Pending Maintenance" value={data.pendingMaintenance} accent="warn" />
        <StatCard label="Low Inventory Items" value={data.lowInventory} accent="danger" />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <PredictionCard forecast={data.forecast} />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="card p-5 sm:p-6 xl:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-base font-semibold text-ink-900">Revenue trend</p>
              <p className="mt-1 text-xs text-ink-700/60">Recent resort performance</p>
            </div>
            <span className="rounded-full bg-brand-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-brand-700">Live data</span>
          </div>
          <RevenueChart history={data.occupancyHistory} />
        </div>
        <div className="card p-5 sm:p-6">
          <p className="mb-4 text-base font-semibold text-ink-900">Recent alerts</p>
          <div className="space-y-2">
            {data.recentAlerts?.length ? data.recentAlerts.map((a) => <AlertCard key={a._id} alert={a} />) : <p className="text-sm text-ink-700/60">No active alerts.</p>}
          </div>
        </div>
      </div>

      <QrScanner open={scannerOpen} onClose={() => setScannerOpen(false)} onResult={handleScan} />
    </div>
  );
}