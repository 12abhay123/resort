export default function Loader({ label = 'Loading...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-ink-700">
      <div className="h-9 w-9 rounded-full border-4 border-brand-100 border-t-brand-500 animate-spin" />
      <p className="text-sm">{label}</p>
    </div>
  );
}
