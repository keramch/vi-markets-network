import React, { useCallback, useMemo, useRef, useState } from 'react';
import type { Market, Organizer, User, Vendor } from '../types';
import { MarketCategories } from '../types';
import { listedDates, nextOccurrence, recurrenceSummary, marketPath } from '../utils';
import Modal from './Modal';
import MarketEventForm from './MarketEventForm';
import DiscardChangesDialog from './DiscardChangesDialog';

// HQ › Unclaimed markets (T105, T128): markets with no organizer yet, added by
// vendors from their profiles or by Kera here. Edit opens the market form (its
// dates, venue, poster…); a market can be handed to an organizer from there.
// Delete removes it and vendors' links to it (T133).

interface UnclaimedMarketsProps {
  markets: Market[];        // every market (admins get drafts too)
  organizers: Organizer[];
  vendors: Vendor[];
  currentUser: User;
  onSaved: (market: Market) => void;
  onDelete: (id: string) => void;
  onCreate: (data: { name: string; city: string; address: string; marketTypes: string[] }) => Promise<void>;
}

// "St. Mary's Christmas Market" and "St Marys christmas market" compare equal
const normalize = (name: string) => name.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]/g, '');

const shortDate = (iso: string) =>
  new Date(iso + 'T12:00:00').toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' });

const UnclaimedMarkets: React.FC<UnclaimedMarketsProps> = ({ markets, organizers, vendors, currentUser, onSaved, onDelete, onCreate }) => {
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [types, setTypes] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<Market | null>(null);

  // The edit window asks before a click outside throws changes away
  const formDirty = useRef(false);
  const trackDirty = useCallback((dirty: boolean) => { formDirty.current = dirty; }, []);
  const [confirmingDiscard, setConfirmingDiscard] = useState(false);
  const closeEdit = () => { formDirty.current = false; setEditing(null); };

  const unclaimed = useMemo(
    () => markets.filter(m => !m.organizerId && m.status !== 'archived').sort((a, b) => a.name.localeCompare(b.name)),
    [markets]
  );

  // Vendors who list each market, and who added it
  const linkedVendors = (m: Market) =>
    vendors.filter(v => (v.attendingMarkets || []).some(a => a.marketId === m.id));
  const addedBy = (m: Market) => m.addedBy?.vendorId ? vendors.find(v => v.id === m.addedBy!.vendorId) : undefined;

  // Another market (claimed or not) with the same or overlapping name
  const possibleDuplicate = (m: Market) => {
    const mine = normalize(m.name);
    return markets.find(o => {
      if (o.id === m.id || o.status === 'archived') return false;
      const theirs = normalize(o.name);
      return theirs === mine || (Math.min(theirs.length, mine.length) >= 6 && (theirs.includes(mine) || mine.includes(theirs)));
    });
  };

  const when = (m: Market) => {
    const repeats = recurrenceSummary(m);
    const next = nextOccurrence(m);
    if (next) return `Next: ${shortDate(next.date)}${repeats ? ` · ${repeats}` : ''}`;
    const dates = listedDates(m);
    return dates.length ? `Last: ${shortDate(dates[dates.length - 1])} (no upcoming dates)` : 'No dates yet';
  };

  const shown = search.trim()
    ? unclaimed.filter(m => `${m.name} ${m.location?.city ?? ''} ${m.location?.address ?? ''} ${m.location?.venueName ?? ''}`.toLowerCase().includes(search.toLowerCase()))
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
            Markets with no organizer yet: added by vendors from their profiles, or by you here. They're public. Edit adds dates, times, the venue and a poster, or hands a market to its organizer.
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
          <div className="flex flex-wrap items-center gap-3">
            <button type="submit" disabled={saving} className="min-h-[2.75rem] px-5 rounded-md bg-brand-light-blue text-white text-sm font-semibold disabled:opacity-60">
              {saving ? 'Adding…' : 'Add market'}
            </button>
            <p className="text-sm text-gray-600">Then use Edit to add its dates, times, venue and poster.</p>
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
            const adder = addedBy(m);
            const place = [m.location?.venueName, m.location?.address, m.location?.city].filter(Boolean).join(' · ');
            return (
              <li key={m.id} className="py-4 flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <a href={marketPath(m)} target="_blank" rel="noopener noreferrer" className="font-semibold text-brand-light-blue hover:underline">{m.name}</a>
                    {m.status !== 'published' && (
                      <span className="text-sm px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">{m.status === 'draft' ? 'Draft: not public' : m.status}</span>
                    )}
                    {dup && (
                      <span className="text-sm px-2 py-0.5 rounded-full bg-[#FBE3EA] text-[#8E1F43]">Possible duplicate of {dup.name}{dup.organizerId ? ' (claimed)' : ''}</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-0.5">{place || 'No venue or town yet'}</p>
                  <p className="text-sm text-gray-600">{when(m)}</p>
                  <p className="text-sm text-gray-600">
                    {adder ? `Added by ${adder.name}` : 'Added in HQ'}
                    {by.length > 0 ? ` · listed by ${by.map(v => v.name).join(', ')}` : ''}
                    {m.hqCheckedAt ? ` · checked ${shortDate(m.hqCheckedAt.slice(0, 10))}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => setEditing(m)} className="min-h-[2.75rem] px-4 rounded-md border border-brand-light-blue text-brand-light-blue text-sm font-semibold hover:bg-brand-cream">
                    Edit
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

      <Modal
        isOpen={!!editing}
        onClose={closeEdit}
        onClickOutside={confirmingDiscard ? undefined : () => (formDirty.current ? setConfirmingDiscard(true) : closeEdit())}
        title={editing ? `Edit ${editing.name}` : 'Edit market'}
        maxWidth="3xl"
      >
        {editing && (
          <MarketEventForm
            key={editing.id}
            currentUser={currentUser}
            existingEvent={editing}
            allOrganizers={organizers}
            onDirtyChange={trackDirty}
            onSaved={saved => { onSaved(saved); closeEdit(); }}
            onCancel={closeEdit}
          />
        )}
      </Modal>
      <DiscardChangesDialog
        isOpen={confirmingDiscard}
        onKeepEditing={() => setConfirmingDiscard(false)}
        onDiscard={() => { setConfirmingDiscard(false); closeEdit(); }}
      />
    </div>
  );
};

export default UnclaimedMarkets;
