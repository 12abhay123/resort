const PRIORITY_STYLE = {
  high: 'bg-[#fbf0ed] text-[#a84f3b]',
  normal: 'bg-brand-100 text-brand-700',
  low: 'bg-ink-900/5 text-ink-700',
};

export default function RecommendationCard({ rec }) {
  return (
    <div className="card p-4 flex items-start justify-between gap-4">
      <div>
        <p className="font-semibold text-ink-900 text-sm">{rec.title}</p>
        <p className="text-xs text-ink-700/70 mt-1 leading-relaxed">{rec.description}</p>
      </div>
      <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full shrink-0 ${PRIORITY_STYLE[rec.priority] || PRIORITY_STYLE.normal}`}>
        {rec.priority}
      </span>
    </div>
  );
}
