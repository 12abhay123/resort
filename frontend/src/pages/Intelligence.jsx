import { useEffect, useState } from 'react';
import api from '../api/axios';
import Loader from '../components/common/Loader';
import PredictionCard from '../components/intelligence/PredictionCard';
import RecommendationCard from '../components/intelligence/RecommendationCard';

export default function Intelligence() {
  const [data, setData] = useState(null);

  useEffect(() => { api.get('/intelligence/overview').then((res) => setData(res.data)); }, []);
  if (!data) return <Loader label="Crunching today's numbers..." />;

  const topSegment = [...(data.segmentation.clusters || [])].sort((a, b) => b.size - a.size)[0];

  return (
    <div className="space-y-6">
      <div className="grid lg:grid-cols-3 gap-4">
        <PredictionCard forecast={data.forecast} />

        <div className="card p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-700/60">Your biggest guest group</p>
          {topSegment ? (
            <>
              <p className="text-2xl font-extrabold text-ink-900 mt-2">{topSegment.label}</p>
              <p className="text-sm text-ink-700/70 mt-1">{topSegment.size} guests right now</p>
            </>
          ) : (
            <p className="text-sm text-ink-700/60 mt-2">Not enough guest data yet.</p>
          )}
        </div>

        <div className="card p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-700/60">Suggested room price</p>
          <p className="text-3xl font-extrabold text-ink-900 mt-2">${data.pricing.recommendedPrice}</p>
          <p className="text-xs text-ink-700/60">Base rate ${data.pricing.basePrice}</p>
          <p className="text-sm text-ink-700 mt-2 leading-relaxed">{data.pricing.explanation}</p>
        </div>
      </div>

      <div>
        <p className="font-bold text-ink-900 mb-3">Staffing for tomorrow</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {data.staffing.recommendations?.map((r) => (
            <div key={r.department} className="card p-4">
              <p className="font-semibold text-ink-900 text-sm">{r.department}</p>
              <p className="text-xs text-ink-700/70 mt-1">{r.recommendation}</p>
            </div>
          ))}
        </div>
      </div>

      <div>
        <p className="font-bold text-ink-900 mb-3">Things to act on</p>
        {data.recommendations?.length ? (
          <div className="grid sm:grid-cols-2 gap-3">
            {data.recommendations.map((r) => <RecommendationCard key={r._id} rec={r} />)}
          </div>
        ) : (
          <div className="card p-4">
            <p className="text-sm text-ink-700/60">Nothing needs your attention right now.</p>
          </div>
        )}
      </div>
    </div>
  );
}