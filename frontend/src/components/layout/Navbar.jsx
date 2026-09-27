import { useAuth } from '../../context/AuthContext';
import { Menu } from 'lucide-react';

export default function Navbar({ title, onMenuClick }) {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between border-b border-sand/50 bg-ivory/90 px-4 py-4 backdrop-blur-xl sm:px-7 lg:px-10">
      <div className="flex min-w-0 items-center gap-3">
        <button type="button" onClick={onMenuClick} aria-label="Open navigation" className="rounded-xl border border-sand/70 bg-white p-2.5 text-ink-700 shadow-sm lg:hidden"><Menu size={18} /></button>
        <div className="min-w-0">
          <p className="mb-0.5 text-[9px] font-bold uppercase tracking-[0.17em] text-brand-600">Staylix / Resort workspace</p>
          <h1 className="truncate text-lg font-semibold text-ink-900 sm:text-xl">{title}</h1>
        </div>
      </div>
      <div className="ml-3 flex shrink-0 items-center gap-3">
        <div className="text-right hidden sm:block">
          <p className="text-xs font-semibold text-ink-900">{user?.name}</p>
          <p className="text-[10px] capitalize text-ink-700/60">{user?.role}</p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-sage/40 text-sm font-bold text-brand-700 shadow-sm">
          {user?.name?.[0]?.toUpperCase() || '?'}
        </div>
      </div>
    </header>
  );
}
