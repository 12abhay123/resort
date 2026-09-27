import { NavLink } from 'react-router-dom';
import { BedDouble, Boxes, CalendarCheck2, ChartNoAxesCombined, CircleDollarSign, ClipboardList, CloudRain, DoorOpen, Gift, LayoutDashboard, LogOut, MapPinned, MessageCircle, PartyPopper, Sparkles, Star, UsersRound, Wrench, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import BrandMark from '../common/BrandMark';

// roles: undefined = every logged-in role. Otherwise only the listed roles see the link.
const LINKS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/nearby', label: 'Explore Nearby', icon: MapPinned, roles: ['guest'] },
  { to: '/book-room', label: 'Book a stay', icon: BedDouble, roles: ['guest'] },
  { to: '/events', label: 'Events', icon: PartyPopper, roles: ['guest', 'manager'] },
  { to: '/rooms', label: 'Rooms', icon: BedDouble, roles: ['manager'] },
  { to: '/checkin', label: 'Check-in / Check-out', icon: DoorOpen, roles: ['manager'] },
  { to: '/bookings', label: 'Bookings', icon: CalendarCheck2, roles: ['manager'] },
  { to: '/staff', label: 'Staff', icon: UsersRound, roles: ['manager'] },
  { to: '/helpdesk', label: 'Help Desk', icon: MessageCircle, roles: ['manager'] },
  { to: '/requests', label: 'Guest Requests', icon: MessageCircle, roles: ['manager'] },
  { to: '/tasks', label: 'Tasks', icon: ClipboardList, roles: ['manager', 'staff'] },
  { to: '/inventory', label: 'Inventory', icon: Boxes, roles: ['manager'] },
  { to: '/intelligence', label: 'AI Intelligence', icon: Sparkles, roles: ['manager'] },
  { to: '/digital-twin', label: 'Weather Digital Twin', icon: CloudRain, roles: ['manager'] },
  { to: '/segmentation', label: 'Guest Segmentation', icon: ChartNoAxesCombined, roles: ['manager'] },
  { to: '/pricing', label: 'Dynamic Pricing', icon: CircleDollarSign, roles: ['manager'] },
  { to: '/offers', label: 'Loyalty Offers', icon: Gift, roles: ['manager'] },
  { to: '/feedback', label: 'Feedback', icon: Star, roles: ['manager', 'staff'] },
  { to: '/maintenance', label: 'Maintenance', icon: Wrench, roles: ['manager', 'staff'] },
];

export default function Sidebar({ open, onClose }) {
  const { user, logout } = useAuth();
  const links = LINKS.filter((l) => !l.roles || l.roles.includes(user?.role));

  return (
    <>
      <button
        type="button"
        aria-label="Close navigation"
        onClick={onClose}
        className={`fixed inset-0 z-30 bg-ink-900/20 backdrop-blur-[2px] transition-opacity lg:hidden ${open ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
      />
      <aside className={`fixed inset-y-0 left-0 z-40 flex h-screen w-[276px] shrink-0 flex-col border-r border-sand/70 bg-white px-4 transition-transform duration-300 lg:sticky lg:top-0 lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between border-b border-sand/50 px-2 py-6">
          <div>
            <BrandMark />
            <p className="mt-1 text-[10px] font-medium tracking-[0.08em] text-ink-700/65">SMARTER STAYS. HAPPIER GUESTS.</p>
          </div>
          <button type="button" aria-label="Close navigation" onClick={onClose} className="rounded-lg p-2 text-ink-700 hover:bg-ivory lg:hidden"><X size={18} /></button>
        </div>
        <div className="px-3 pb-2 pt-6 text-[10px] font-bold uppercase tracking-[0.14em] text-ink-700/45">Resort operations</div>
        <nav className="flex-1 space-y-1 overflow-y-auto px-1 pb-4">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              onClick={onClose}
              className={({ isActive }) =>
                `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-semibold transition-colors ${
                  isActive ? 'bg-brand-50 text-brand-700' : 'text-ink-700 hover:bg-ivory hover:text-ink-900'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <l.icon size={18} strokeWidth={1.8} className={isActive ? 'text-brand-600' : 'text-ink-700/65 group-hover:text-brand-600'} />
                  <span>{l.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-sand/60 px-2 pb-3 pt-4">
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sage/35 text-xs font-bold text-brand-700">
              {user?.name?.[0]?.toUpperCase() || '?'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-ink-900">{user?.name}</p>
              <p className="text-[10px] capitalize text-ink-700/60">{user?.role}</p>
            </div>
            <button type="button" title="Log out" onClick={() => { logout(); onClose?.(); }} className="inline-flex min-h-10 items-center gap-2 rounded-lg px-2.5 text-xs font-semibold text-ink-700/70 hover:bg-coral/10 hover:text-coral">
              <LogOut size={16} strokeWidth={1.8} />
              <span>Log out</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}