import { Activity, BedDouble, CircleAlert, CircleDollarSign, DoorOpen, Package, TrendingUp, UsersRound, Wrench } from 'lucide-react';

const ICONS = {
  'Total Rooms': BedDouble,
  Occupied: DoorOpen,
  Available: BedDouble,
  "Today's Occupancy": TrendingUp,
  "Today's Revenue": CircleDollarSign,
  'Active Requests': UsersRound,
  'Pending Maintenance': Wrench,
  'Low Inventory Items': Package,
  'Assigned to you': Activity,
  Pending: CircleAlert,
  'In progress': Wrench,
  Completed: TrendingUp,
};

export default function StatCard({ label, value, hint, icon, accent = 'brand' }) {
  const Icon = ICONS[label] || (typeof icon === 'function' ? icon : Activity);
  const accents = {
    brand: 'text-brand-700 bg-brand-50',
    warn: 'text-coral bg-[#fbf0ed]',
    danger: 'text-coral bg-[#fbf0ed]',
  };
  return (
    <div className="card flex min-h-[132px] items-start justify-between gap-2 p-4 sm:min-h-[152px] sm:p-5">
      <div>
        <p className="text-[10px] font-bold uppercase leading-relaxed tracking-[0.09em] text-ink-700/60 sm:text-[11px]">{label}</p>
        <p className="mt-2 text-2xl font-semibold tabular-nums text-ink-900 sm:text-[30px]">{value}</p>
        {hint && <p className="mt-1.5 text-[11px] leading-relaxed text-ink-700/60">{hint}</p>}
      </div>
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl sm:h-10 sm:w-10 ${accents[accent]}`}><Icon size={18} strokeWidth={1.8} /></div>
    </div>
  );
}
