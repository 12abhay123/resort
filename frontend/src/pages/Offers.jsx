import { useEffect, useState } from 'react';
import { Gift, Plus, Trash2, UsersRound } from 'lucide-react';
import api from '../api/axios';
import Loader from '../components/common/Loader';

const EMPTY_FORM = { title: '', description: '', minVisits: 2, discountPercent: 5, premium: false };

export default function Offers() {
  const [offers, setOffers] = useState(null);
  const [guests, setGuests] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function load() {
    Promise.all([api.get('/offers'), api.get('/offers/guests')]).then(([offerRes, guestRes]) => {
      setOffers(offerRes.data);
      setGuests(guestRes.data);
    }).catch((err) => setError(err.response?.data?.message || 'Could not load loyalty offers'));
  }
  useEffect(load, []);

  async function createOffer(event) {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api.post('/offers', form);
      setForm(EMPTY_FORM);
      load();
    } catch (err) { setError(err.response?.data?.message || 'Could not create offer'); } finally { setSaving(false); }
  }

  async function toggleOffer(offer) {
    await api.put(`/offers/${offer._id}`, { active: !offer.active });
    load();
  }

  async function removeOffer(id) {
    if (!window.confirm('Remove this loyalty offer?')) return;
    await api.delete(`/offers/${id}`);
    load();
  }

  if (!offers) return <Loader label="Loading loyalty offers..." />;

  return (
    <div className="space-y-6">
      <div className="card p-6 sm:p-8">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-700"><Gift size={22} /></div>
          <div><p className="eyebrow">Customer loyalty</p><h2 className="mt-1 text-2xl font-semibold text-ink-900">Returning guest offers</h2><p className="mt-2 text-sm text-ink-700/65">Offers are selected automatically from completed and active booking history.</p></div>
        </div>
      </div>

      {error && <p className="rounded-xl border border-coral/20 bg-[#fbf0ed] px-4 py-3 text-sm text-[#a84f3b]">{error}</p>}

      <div className="grid gap-4 lg:grid-cols-3">
        {offers.map((offer) => (
          <div key={offer._id} className={`card p-5 ${offer.active ? '' : 'opacity-60'}`}>
            <div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-brand-700">{offer.premium ? 'Premium tier' : 'Loyalty tier'}</p><h3 className="mt-1 text-lg font-bold text-ink-900">{offer.title}</h3></div><span className="text-2xl font-extrabold text-brand-600">{offer.discountPercent}%</span></div>
            <p className="mt-3 text-sm leading-6 text-ink-700/70">{offer.description}</p>
            <p className="mt-4 text-xs font-semibold text-ink-700/60">Unlocks at visit {offer.minVisits}+</p>
            <div className="mt-4 flex gap-2"><button type="button" onClick={() => toggleOffer(offer)} className="btn-secondary flex-1 py-2 text-xs">{offer.active ? 'Deactivate' : 'Activate'}</button><button type="button" onClick={() => removeOffer(offer._id)} aria-label={`Remove ${offer.title}`} className="btn-secondary px-3 py-2 text-coral"><Trash2 size={15} /></button></div>
          </div>
        ))}
      </div>

      <form onSubmit={createOffer} className="card p-5 sm:p-6">
        <div className="mb-4 flex items-center gap-2"><Plus size={17} className="text-brand-700" /><h3 className="font-bold text-ink-900">Create custom offer</h3></div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <input required className="input-field" placeholder="Offer title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <input required className="input-field sm:col-span-2 lg:col-span-1" placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <input required type="number" min="1" className="input-field" placeholder="Minimum visits" value={form.minVisits} onChange={(e) => setForm({ ...form, minVisits: e.target.value })} />
          <input required type="number" min="0" max="100" className="input-field" placeholder="Discount %" value={form.discountPercent} onChange={(e) => setForm({ ...form, discountPercent: e.target.value })} />
        </div>
        <label className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-ink-700"><input type="checkbox" checked={form.premium} onChange={(e) => setForm({ ...form, premium: e.target.checked })} /> Premium offer</label>
        <button type="submit" disabled={saving} className="btn-primary mt-4">{saving ? 'Saving...' : 'Create offer'}</button>
      </form>

      <div className="card overflow-hidden">
        <div className="flex items-center gap-2 border-b border-sand/50 px-5 py-4"><UsersRound size={17} className="text-brand-700" /><div><h3 className="font-bold text-ink-900">Guest visit history</h3><p className="text-xs text-ink-700/60">Returning guests and their current eligible offer</p></div></div>
        <div className="overflow-x-auto"><table className="w-full min-w-[640px] text-sm"><thead><tr><th className="px-5 py-3 text-left">Guest</th><th className="px-5 py-3 text-left">Visits</th><th className="px-5 py-3 text-left">Latest room</th><th className="px-5 py-3 text-left">Active offer</th></tr></thead><tbody>{guests.map((entry) => <tr key={entry.guest._id} className="border-t border-sand/40"><td className="px-5 py-3"><p className="font-semibold text-ink-900">{entry.guest.name}</p><p className="text-xs text-ink-700/60">{entry.guest.email || entry.guest.phone}</p></td><td className="px-5 py-3 font-bold text-brand-700">{entry.visits}</td><td className="px-5 py-3">Room {entry.latestBooking.room?.roomNumber || '—'}</td><td className="px-5 py-3">{entry.offer ? <span className="font-semibold text-brand-700">{entry.offer.title} · {entry.offer.discountPercent}%</span> : <span className="text-ink-700/50">No offer yet</span>}</td></tr>)}</tbody></table></div>
        {!guests.length && <p className="p-6 text-sm text-ink-700/60">No booking history yet.</p>}
      </div>
    </div>
  );
}
