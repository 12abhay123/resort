const SEVERITY_STYLE = {
  info: 'border-l-brand-400 bg-brand-50',
  warning: 'border-l-coral bg-[#fbf0ed]',
  critical: 'border-l-coral bg-[#fbf0ed]',
};

export default function AlertCard({ alert }) {
  return (
    <div className={`border-l-4 rounded-r-xl p-3 ${SEVERITY_STYLE[alert.severity] || SEVERITY_STYLE.info}`}>
      <p className="text-sm font-semibold text-ink-900">{alert.title}</p>
      <p className="text-xs text-ink-700/70 mt-0.5">{alert.message}</p>
    </div>
  );
}
