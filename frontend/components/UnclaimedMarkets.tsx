import React, { useMemo, useState } from 'react';
import type { Market, Vendor } from '../types';
import { MarketCategories } from '../types';

// HQ › Unclaimed markets (T105): markets nobody owns yet, added by vendors
// from their profiles or by an admin here. Lets Kera review and tidy them
// before they get public pages (T020): spot duplicates, edit, delete, and
// add new ones directly.

interface UnclaimedMarketsProps {
  markets: Market[];   // all markets
  vendors: Vendor[];
  onEdit: (id: string) => void;
  onEvents: (id: string) => void;   // that market's dates (T124)
  onDelete: (id: string) => void;
  onCreate: (data: { name: string; city: string; address: string; marketTypes: string[] }) => Promise<void>;
}

// "St. Mary's Christmas Market" and "St Marys christmas market" compare equal
const normalize = (name: string) => name.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]/g, '');

const UnclaimedMarkets: React.FC<UnclaimedMarketsProps> = ({ markets, vendors, onEdit, onEvents, onDelete, onCreate }) => {
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [types, setTypes] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const unclaimed = useMemo(
    () => markets.filter(m => m.status === 'unclaimed').sort((a, b) => a.name.localeCompare(b.name)),
    [markets]
  );

  // Who added or lists each market (vendors linked to it)
  const linkedVendors = (m: Market) =>
    vendors.filter(v => (m.vendorIds || []).includes(v.id) || (v.attendingMarkets || []).some(a => a.marketId === m.id));

  // Another market (claimed or not) with the same or overlapping name
  const possibleDuplicate = (m: Market) => {
    const mine = normalize(m.name);
    return markets.find(o => {
      if (o.id === m.id) return false;
      const theirs = normalize(o.name);
      return theirs === mine || (Math.min(theirs.length, mine.length) >= 6 && (theirs.includes(mine) || mine.includes(theirs)));
    });
  };

  const shown = search.trim()
    ? unclaimed.filter(m => `${m.name} ${m.location?.city ?? ''} ${m.location?.address ?? ''}`.toLowerCase().includes(search.toLowerCase()))
    : unclaimed;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError('Please give the market a name.'); return; }
    setSaving(true);
    setError('');
    try {
      await onCreate({ name: name.trim(), city: city.trim(), address: address.trim(), marketTypes: types });
      setName(''); setCity(''); setAddress(''); setTypes([]);
      setFormOpen(false);
    } catch {
      setError("Couldn't add the market. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const input = 'mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-3 px-3';

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
        <div>
          <h2 className="font-serif text-2xl text-brand-blue">Unclaimed markets <span className="font-sans font-medium text-base text-gray-600 tracking-normal">· {unclaimed.length}</span></h2>
          <p className="text-sm text-gray-600 mt-1 max-w-2xl">
            Markets nobody has claimed yet: added by vendors from their profiles, or by you here. Tidy names and details, merge duplicates by deleting the extra one, then they're ready for public pages.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setFormOpen(o => !o)}
          aria-expanded={formOpen}
          className="min-h-[2.75rem] px-5 rounded-full bg-brand-blue text-white text-sm font-semibold hover:bg-opacity-90"
        >
          {formOpen ? 'Close' : 'Add a market'}
        </button>
      </div>

      {formOpen && (
        <form onSubmit={submit} className="mb-6 p-5 bg-brand-cream rounded-lg space-y-4">
          <div>
            <label htmlFor="new-market-name" className="block text-sm font-medium text-gray-700">Market name</label>
            <input id="new-market-name" value={name} onChange={e => setName(e.target.value)} maxLength={120} required className={input} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="new-market-city" className="block text-sm font-medium text-gray-700">Town</label>
              <input id="new-market-city" value={city} onChange={e => setCity(e.target.value)} maxLength={80} className={input} />
            </div>
            <div>
              <label htmlFor="new-market-address" className="block text-sm font-medium text-gray-700">Venue or address</label>
              <input id="new-market-address" value={address} onChange={e => setAddress(e.target.value)} maxLength={200} className={input} />
            </div>
          </div>
          <fieldset>
            <legend className="block text-sm font-medium text-gray-700 mb-2">Market types (optional)</legend>
            <div className="flex flex-wrap gap-2">
              {Object.values(MarketCategories).map(t => {
                const on = types.includes(t);
                return (
                  <button
                    key={t}
                    type="button"
                    aria-pressed={on}
                    onClick={() => setTypes(prev => on ? prev.filter(x => x !== t) : [...prev, t])}
                    className={`text-sm px-3 py-1.5 rounded-full border ${on ? 'bg-brand-light-blue text-white border-brand-light-blue' : 'bg-white text-brand-text border-gray-300 hover:bg-gray-50'}`}
                  >
                    {t}
                  </button>
                );
              })}
            </div>
          </fieldset>
          {error && <p className="text-sm text-red-700">{error}</p>}
          <div className="flex items-center gap-3">
            <button type="submit" disabled={saving} className="min-h-[2.75rem] px-5 rounded-md bg-brand-light-blue text-white text-sm font-semibold disabled:opacity-60">
              {saving ? 'Adding…' : 'Add market'}
            </button>
            <p className="text-sm text-gray-600">You can add a description and photos after, with Edit, and dates with Events.</p>
          </div>
        </form>
      )}

      <label htmlFor="unclaimed-search" className="block text-sm font-medium text-gray-700">Search unclaimed markets</label>
      <input
        id="unclaimed-search"
        type="search"
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="mt-1 mb-4 block w-full md:w-96 border border-gray-300 rounded-md py-2.5 px-3"
      />

      {shown.length === 0 ? (
        <p className="text-gray-600 py-6">{unclaimed.length === 0 ? 'No unclaimed markets.' : 'No matches.'}</p>
      ) : (
        <ul className="divide-y divide-gray-200 border-t border-gray-200">
          {shown.map(m => {
            const dup = possibleDuplicate(m);
            const by = linkedVendors(m);
            const place = [m.location?.city, m.location?.address].filter(Boolean).join(' · ');
            return (
              <li key={m.id} className="py-4 flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-brand-text">{m.name}</p>
                    {!m.slug && (
                      <span className="text-sm px-2 py-0.5 rounded-full bg-amber-100 text-amber-900">No web address yet: saving it adds one</span>
                    )}
                    {dup && (
                      <span className="text-sm px-2 py-0.5 rounded-full bg-[#FBE3EA] text-[#8E1F43]">Possible duplicate of {dup.name}{dup.status === 'active' ? ' (claimed)' : ''}</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-0.5">{place || 'No town or address'}</p>
                  <p className="text-sm text-gray-600">
                    {by.length > 0 ? `Listed by ${by.map(v => v.name).join(', ')}` : 'Added in HQ'}
                    {m.joinDate ? ` · added ${new Date(m.joinDate).toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' })}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => onEdit(m.id)} className="min-h-[2.75rem] px-4 rounded-md border border-brand-light-blue text-brand-light-blue text-sm font-semibold hover:bg-brand-cream">
                    Edit
                  </button>
                  <button type="button" onClick={() => onEvents(m.id)} className="min-h-[2.75rem] px-4 rounded-md border border-brand-light-blue text-brand-light-blue text-sm font-semibold hover:bg-brand-cream">
                    Events
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const msg = by.length
                        ? `Delete "${m.name}"? It disappears from ${by.length === 1 ? by[0].name + "'s" : by.length + " vendors'"} Find us at list. This can't be undone.`
                        : `Delete "${m.name}"? This can't be undone.`;
                      if (window.confirm(msg)) onDelete(m.id);
                    }}
                    className="min-h-[2.75rem] px-4 rounded-md border border-red-300 text-red-700 text-sm font-semibold hover:bg-red-50"
                  >
                    Delete
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default UnclaimedMarkets;
