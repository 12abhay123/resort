import { useEffect, useState } from 'react';
import api from '../api/axios';
import Loader from '../components/common/Loader';

export default function Segmentation() {
  const [data, setData] = useState(null);

  useEffect(() => { api.get('/analytics/guest-segmentation').then((res) => setData(res.data)); }, []);
  if (!data) return <Loader label="Loading guest insights..." />;

  return (
    <div className="space-y-6">
      <div className="card p-5">
        <p className="font-bold text-ink-900 mb-1">Guest segmentation</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {data.clusters?.map((c) => (
          <div key={c.clusterId} className="card p-4">
            <p className="font-bold text-ink-900">{c.label}</p>
            <p className="text-2xl font-extrabold text-brand-600 mt-1">{c.size}</p>
            <p className="text-xs text-ink-700/60">guests in segment</p>
          </div>
        ))}
      </div>

      {data.guests?.length > 0 && (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-ink-900/5 text-ink-700/70 text-left">
              <tr><th className="px-4 py-3">Guest</th><th className="px-4 py-3">Segment</th><th className="px-4 py-3">Spend</th><th className="px-4 py-3">Avg stay</th><th className="px-4 py-3">Requests</th></tr>
            </thead>
            <tbody>
              {data.guests.map((g) => (
                <tr key={g.guestId} className="border-t border-ink-900/5">
                  <td className="px-4 py-3 font-semibold text-ink-900">{g.name}</td>
                  <td className="px-4 py-3">{g.clusterLabel}</td>
                  <td className="px-4 py-3">${g.raw.spend.toFixed(0)}</td>
                  <td className="px-4 py-3">{g.raw.avgStayLength.toFixed(1)} nights</td>
                  <td className="px-4 py-3">{g.raw.requestCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
