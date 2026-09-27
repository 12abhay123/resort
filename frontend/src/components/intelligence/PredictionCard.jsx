export default function PredictionCard({ forecast }) {
  if (!forecast) return null;
  const level = forecast.demandLevel;
  const color = level === 'High' ? 'text-coral' : level === 'Low' ? 'text-brand-600' : 'text-ink-700';
  return (
    <div className="card p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-ink-700/60">Tomorrow's occupancy</p>
      <div className="flex items-end gap-3 mt-2">
        <p className="text-4xl font-extrabold text-ink-900">{forecast.predictedOccupancy ?? '—'}%</p>
        <span className={`text-sm font-bold pb-1 ${color}`}>{level} demand</span>
      </div>
      <p className="text-sm text-ink-700 mt-3 leading-relaxed">{forecast.explanation}</p>
    </div>
  );
}