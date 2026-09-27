import { useEffect, useState } from 'react';
import api from '../api/axios';
import Loader from '../components/common/Loader';

export default function Pricing() {
  const [rooms, setRooms] = useState(null);
  const [roomId, setRoomId] = useState('');
  const [pricing, setPricing] = useState(null);

  useEffect(() => { api.get('/rooms').then((res) => { setRooms(res.data); if (res.data[0]) setRoomId(res.data[0]._id); }); }, []);
  useEffect(() => {
    if (!roomId) return;
    api.get(`/analytics/pricing-recommendation?roomId=${roomId}`).then((res) => setPricing(res.data));
  }, [roomId]);

  if (!rooms) return <Loader label="Loading rooms..." />;

  return (
    <div className="space-y-6">
      <div className="card p-5 max-w-sm">
        <label className="label">Select room</label>
        <select className="input-field" value={roomId} onChange={(e) => setRoomId(e.target.value)}>
          {rooms.map((r) => <option key={r._id} value={r._id}>Room {r.roomNumber} ({r.type})</option>)}
        </select>
      </div>

      {!pricing ? <Loader label="Calculating recommended price..." /> : (
        <div className="grid lg:grid-cols-2 gap-4">
          <div className="card p-6 text-center">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-700/60">Recommended price</p>
            <p className="text-5xl font-extrabold text-brand-600 mt-2">${pricing.recommendedPrice}</p>
            <p className="text-sm text-ink-700/60 mt-1">Base price: ${pricing.basePrice} · {pricing.season} season {pricing.weekend ? '· weekend' : ''}</p>
          </div>
          <div className="card p-6">
            <p className="font-bold text-ink-900 mb-3">Why this price?</p>
            <p className="text-sm text-ink-700 leading-relaxed">{pricing.explanation}</p>
            <div className="mt-4 space-y-2 text-sm">
              {Object.entries(pricing.breakdown).map(([k, v]) => v !== 0 && (
                <div key={k} className="flex justify-between border-b border-ink-900/5 pb-1.5">
                  <span className="text-ink-700/70 capitalize">{k.replace('Adjustment', '')}</span>
                  <span className={`font-semibold ${v > 0 ? 'text-brand-700' : 'text-coral'}`}>{v > 0 ? '+' : ''}{Math.round(v)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
