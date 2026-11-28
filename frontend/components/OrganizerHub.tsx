import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ClipboardList, MessageSquare } from 'lucide-react';
import type { User, Organizer, Market } from '../types';
import * as api from '../services/api.live';
import Modal from './Modal';
import MarketEventForm from './MarketEventForm';
import DiscardChangesDialog from './DiscardChangesDialog';
import { marketUrl, listedDates } from '../utils';

interface OrganizerHubProps {
  currentUser: User;
  organizer: Organizer;
  onNavigateToProfile: () => void;
  onBack: () => void;
  // HQ › an organizer's markets: an admin managing any organizer's markets.
  // Hides the owner's plan and coming-soon sections.
  adminView?: boolean;
  // Every organizer, so an admin can hand a market to another one
  allOrganizers?: Organizer[];
  // Keeps the site's market list in step after a save
  onMarketSaved?: (market: Market) => void;
}

const DAY_NAMES_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatRecurringDate(event: Market): string {
  const days = (event.schedule.recurrenceDays ?? [])
    .map((d: number) => DAY_NAMES_SHORT[d])
    .join('/');
  const sd = event.schedule.startDate;
  if (sd) {
    const [, month, day] = sd.split('-');
    const m = parseInt(month, 10) - 1;
    const d = parseInt(day, 10);
    return `Every ${days} · ${MONTH_NAMES_SHORT[m]} ${d}`;
  }
  return `Every ${days}`;
}

// "Sat, Nov 28", or "Sat, Nov 28 + 2 more" for a market on several dates
function formatListedDates(event: Market): string {
  const dates = listedDates(event);
  if (dates.length === 0) return 'No dates yet';
  const today = new Date().toLocaleDateString('en-CA');
  const upcoming = dates.filter(d => d >= today);
  const shown = upcoming[0] ?? dates[dates.length - 1];
  const more = (upcoming.length || dates.length) - 1;
  return more > 0 ? `${formatOneTimeDate(shown)} + ${more} more` : formatOneTimeDate(shown);
}

function formatOneTimeDate(dateStr: string): string {
  const [, month, day] = dateStr.split('-');
  const dt = new Date(dateStr + 'T12:00:00');
  const dayName = DAY_NAMES_SHORT[dt.getDay()];
  const m = parseInt(month, 10) - 1;
  const d = parseInt(day, 10);
  return `${dayName}, ${MONTH_NAMES_SHORT[m]} ${d}`;
}

function sortKey(event: Market): string {
  // A market that switched type keeps its old schedule fields, so sort by the
  // field that matches its current type (T094).
  return event.type !== 'recurring'
    ? listedDates(event)[0] ?? ''
    : event.schedule.startDate ?? '';
}

const OrganizerHub: React.FC<OrganizerHubProps> = ({
  currentUser,
  organizer,
  onNavigateToProfile,
  onBack,
  adminView = false,
  allOrganizers,
  onMarketSaved,
}) => {
  // Shown after an admin hands a market to another organizer
  const [movedNote, setMovedNote] = useState('');
  const [events, setEvents] = useState<Market[]>([]);
  const [loading, setLoading] = useState(true);

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Market | null>(null);

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Copies the market's public page link for sharing (T013)
  const copyEventLink = async (event: Market) => {
    try {
      await navigator.clipboard.writeText(marketUrl(event));
      setCopiedId(event.id);
      setTimeout(() => setCopiedId(prev => (prev === event.id ? null : prev)), 2500);
    } catch {
      window.prompt('Copy this link:', marketUrl(event));
    }
  };

  const tier = currentUser.subscription?.tier ?? 'free';
  const isFoundingMember = currentUser.subscription?.foundingMember === true;

  // ── fetch events ────────────────────────────────────────────────────────────

  const loadEvents = async () => {
    setLoading(true);
    try {
      const all = await api.getMarkets({ organizerId: organizer.id });
      const visible = all
        .filter(e => e.status !== 'archived')
        .sort((a, b) => sortKey(a).localeCompare(sortKey(b)));
      setEvents(visible);
    } catch (err) {
      console.error('Failed to load events:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organizer.id]);

  // ?add=1 (straight after an organizer signs up, T140) opens the market form
  const [searchParams, setSearchParams] = useSearchParams();
  useEffect(() => {
    if (searchParams.get('add') !== '1') return;
    setSelectedEvent(null);
    setEditModalOpen(true);
    setSearchParams({}, { replace: true });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Their organizer page isn't public yet (T140): set it up from the profile editor
  const pageHidden = !!organizer.pageHidden;

  // ── edit handlers ────────────────────────────────────────────────────────────

  const openEdit = (event: Market) => {
    setSelectedEvent(event);
    setEditModalOpen(true);
  };

  const closeEdit = () => {
    formDirty.current = false;
    setEditModalOpen(false);
    setSelectedEvent(null);
  };

  // Clicking outside the event window (or Escape) closes it, asking first if
  // anything was changed
  const formDirty = useRef(false);
  const trackDirty = useCallback((dirty: boolean) => { formDirty.current = dirty; }, []);
  const [confirmingDiscard, setConfirmingDiscard] = useState(false);
  const closeFromOutside = () => {
    if (formDirty.current) setConfirmingDiscard(true);
    else closeEdit();
  };

  const handleSaved = (saved: Market) => {
    closeEdit();
    onMarketSaved?.(saved);
    if (saved.organizerId !== organizer.id) {
      // Handed to another organizer (or back to unclaimed): no longer on this list
      const to = saved.organizerId
        ? allOrganizers?.find(m => m.id === saved.organizerId)?.name ?? 'another organizer'
        : 'unclaimed markets in HQ';
      setMovedNote(`"${saved.name}" moved to ${to}.`);
      setEvents(prev => prev.filter(e => e.id !== saved.id));
      return;
    }
    setMovedNote('');
    setEvents(prev => {
      const exists = prev.some(e => e.id === saved.id);
      const updated = exists
        ? prev.map(e => (e.id === saved.id ? saved : e))
        : [...prev, saved];
      return updated
        .filter(e => e.status !== 'archived')
        .sort((a, b) => sortKey(a).localeCompare(sortKey(b)));
    });
  };

  // ── delete handlers ──────────────────────────────────────────────────────────

  const handleDeleteConfirm = async (id: string) => {
    try {
      await api.archiveMarket(id);
      setEvents(prev => prev.filter(e => e.id !== id));
    } catch (err) {
      console.error('Archive failed:', err);
    } finally {
      setConfirmDeleteId(null);
    }
  };

  // ── subscription pill ────────────────────────────────────────────────────────

  const TierPill = () => {
    if (isFoundingMember) {
      return (
        <span className="text-sm font-medium px-2.5 py-1 rounded-full bg-teal-100 text-teal-700">
          Founding Member
        </span>
      );
    }
    if (tier === 'pro' || tier === 'superPro') {
      return (
        <span className="text-sm font-medium px-2.5 py-1 rounded-full bg-violet-100 text-violet-700">
          Pro
        </span>
      );
    }
    if (tier === 'standard') {
      return (
        <span className="text-sm font-medium px-2.5 py-1 rounded-full bg-gray-100 text-gray-600">
          Standard
        </span>
      );
    }
    return (
      <span className="text-sm font-medium px-2.5 py-1 rounded-full bg-gray-100 text-gray-500">
        Free
      </span>
    );
  };

  // ── event type label ─────────────────────────────────────────────────────────

  const typeLabel = (t: Market['type']) => (t === 'recurring' ? 'Repeats' : 'On set dates');

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-5xl">

      {adminView && (
        <button
          type="button"
          onClick={onBack}
          className="mb-4 min-h-[2.75rem] text-sm font-semibold text-brand-light-blue hover:underline"
        >
          ← Back to HQ
        </button>
      )}

      {/* Page header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-3xl font-serif text-brand-blue">{adminView ? 'Their markets' : 'My Markets'}</h1>
          <p className="text-gray-500 mt-1 text-sm">
            {organizer.name || (adminView ? 'Organizer page not set up yet' : `${currentUser.firstName} ${currentUser.lastName}`.trim())}
            <span className="mx-2 text-gray-300">·</span>
            <button
              onClick={onNavigateToProfile}
              className="text-brand-light-blue hover:text-brand-blue transition-colors"
            >
              {pageHidden && !adminView ? 'Set up organizer page' : 'Edit profile'}
            </button>
          </p>
        </div>
        {adminView ? (
          <span className="flex-shrink-0 mt-1 text-sm font-medium px-3 py-1 rounded-full bg-amber-100 text-amber-900">
            {organizer.status === 'unclaimed' ? 'Unclaimed: managed from HQ' : 'Managing as admin'}
          </span>
        ) : (
        <div className="flex items-center gap-2 flex-shrink-0 mt-1">
          <TierPill />
          <span className="text-sm font-medium px-2.5 py-1 rounded-full bg-green-100 text-green-700">
            Active
          </span>
        </div>
        )}
      </div>

      {movedNote && (
        <p role="status" className="mb-4 px-4 py-3 rounded-lg bg-brand-cream text-brand-text text-sm">{movedNote}</p>
      )}

      {/* ── SECTION 1: Event Manager ─────────────────────────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden mb-6">

        {/* Section header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-800">Your markets</span>
            <span className="text-sm font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-800">
              Live
            </span>
          </div>
          <button
            onClick={() => {
              setSelectedEvent(null);
              setEditModalOpen(true);
            }}
            className="bg-brand-blue text-white text-sm font-medium px-4 py-3 rounded-lg hover:bg-brand-blue/90 transition-colors min-h-[3rem]"
          >
            + Add a market
          </button>
        </div>

        {/* Coming soon note */}
        <p className="px-5 pt-3 text-sm text-gray-400 italic">
          Per-date editing and more market tools are coming soon.
        </p>

        {/* Event list */}
        <div className="px-5 py-4">
          {loading ? (
            <div className="space-y-3 py-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-10 bg-gray-100 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : events.length === 0 ? (
            <p className="text-sm text-gray-500 py-4 text-center">
              No markets yet. Add your first market to get started.
            </p>
          ) : (
            <div>
              {events.map(event => (
                confirmDeleteId === event.id ? (
                  // ── Inline delete confirmation ──
                  <div
                    key={event.id}
                    className="flex items-center gap-3 py-3 border-b border-gray-100 last:border-b-0 text-sm"
                  >
                    <span className="text-gray-700 flex-1">
                      Take <span className="font-medium">{event.name}</span> down? It disappears from the site and from this list.
                    </span>
                    <button
                      onClick={() => handleDeleteConfirm(event.id)}
                      className="text-sm font-semibold bg-red-100 text-red-700 px-3 py-2 rounded hover:bg-red-200"
                    >
                      Confirm
                    </button>
                    <button
                      onClick={() => setConfirmDeleteId(null)}
                      className="text-sm font-semibold bg-gray-100 text-gray-600 px-3 py-2 rounded hover:bg-gray-200"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  // ── Normal event row ──
                  <div
                    key={event.id}
                    className="flex items-center gap-3 py-3 border-b border-gray-100 last:border-b-0"
                  >
                    {/* Date */}
                    <div className="text-sm text-gray-500 flex-shrink-0 min-w-[6.875rem]">
                      {event.type !== 'recurring'
                        ? formatListedDates(event)
                        : formatRecurringDate(event)}
                    </div>

                    {/* Name + location */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate text-sm">{event.name}</p>
                      <p className="text-sm text-gray-500 truncate">
                        {[event.location.venueName, event.location.city].filter(Boolean).join(' · ')}
                      </p>
                    </div>

                    {/* Type pill */}
                    <span className="hidden sm:inline-flex text-sm px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-600 flex-shrink-0">
                      {typeLabel(event.type)}
                    </span>

                    {/* Status badge */}
                    <span
                      className={`text-sm font-medium px-2.5 py-0.5 rounded-full flex-shrink-0 ${
                        event.status === 'published'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {event.status === 'published' ? 'Published' : 'Draft'}
                    </span>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {event.status === 'published' && (
                        <button
                          onClick={() => copyEventLink(event)}
                          className="text-brand-light-blue border border-brand-light-blue/40 rounded text-sm px-3 py-2 hover:bg-brand-cream transition-colors"
                          aria-live="polite"
                        >
                          {copiedId === event.id ? 'Copied!' : 'Copy link'}
                        </button>
                      )}
                      <button
                        onClick={() => openEdit(event)}
                        className="text-brand-light-blue border border-brand-light-blue/40 rounded text-sm px-3 py-2 hover:bg-teal-50 transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(event.id)}
                        className="text-brand-gold border border-brand-gold/30 rounded text-sm px-3 py-2 hover:bg-red-50 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )
              ))}
            </div>
          )}
        </div>
      </div>

      {!adminView && pageHidden && !loading && (
        <div className="bg-brand-cream border border-brand-light-blue/30 rounded-xl p-5 sm:p-6 mb-6 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1">
            <h2 className="font-serif text-xl text-brand-blue">Running more than one market?</h2>
            <p className="mt-1 text-base text-brand-text">
              Set up your organizer page: all your markets in one place, people can follow you for news,
              and you get organizer tools and resources as they arrive. Until then, only your markets show on the site.
            </p>
          </div>
          <button
            type="button"
            onClick={onNavigateToProfile}
            className="flex-shrink-0 min-h-[3rem] px-5 rounded-lg bg-brand-light-blue text-white font-semibold hover:bg-brand-light-blue/90"
          >
            Set up my organizer page
          </button>
        </div>
      )}

      {!adminView && (<>
      {/* ── SECTION 2: Application Manager (Phase 2) ────────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden mb-6 opacity-80">

        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-800">Application manager</span>
            <span className="text-sm font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
              Phase 2
            </span>
          </div>
        </div>

        <div className="px-5 py-6 flex flex-col items-center text-center">
          <ClipboardList className="w-8 h-8 text-gray-400 mb-3" />
          <p className="font-medium text-gray-700 mb-2">
            Vendor applications — coming in Phase 2
          </p>
          <p className="text-sm text-gray-500 max-w-lg">
            Create and manage applications for your markets. Review vendor profiles, accept or decline applicants, and build your vendor roster — all in one place.
          </p>
          <div className="mt-4 border-l-2 border-gray-200 pl-3 text-left max-w-lg">
            <p className="text-sm italic text-gray-400">
              Founding members get early access as soon as this feature launches.
            </p>
          </div>
        </div>
      </div>

      {/* ── SECTION 3: Communication Portal (Phase 3) ───────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden opacity-80">

        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-800">Communication portal</span>
            <span className="text-sm font-medium px-2 py-0.5 rounded-full bg-violet-100 text-violet-700">
              Phase 3
            </span>
          </div>
        </div>

        <div className="px-5 py-6 flex flex-col items-center text-center">
          <MessageSquare className="w-8 h-8 text-violet-300 mb-3" />
          <p className="font-medium text-gray-700 mb-2">
            Message your vendors — coming in Phase 3
          </p>
          <p className="text-sm text-gray-500 max-w-lg">
            Send announcements, updates, and direct messages to your confirmed vendors. Build a communication thread for each market season.
          </p>
          <div className="mt-4 border-l-2 border-gray-200 pl-3 text-left max-w-lg">
            <p className="text-sm italic text-gray-400">
              Founding members get early access as soon as this feature launches.
            </p>
          </div>
        </div>
      </div>

      </>)}

      {/* ── Edit / Add Event Modal ───────────────────────────────────────────── */}
      <Modal
        isOpen={editModalOpen}
        onClose={closeEdit}
        onClickOutside={confirmingDiscard ? undefined : closeFromOutside}
        title={selectedEvent ? 'Edit market' : 'Add a market'}
        maxWidth="3xl"
      >
        <MarketEventForm
          currentUser={currentUser}
          organizer={organizer}
          allOrganizers={allOrganizers}
          existingEvent={selectedEvent ?? undefined}
          onSaved={handleSaved}
          onCancel={closeEdit}
          onDirtyChange={trackDirty}
        />
      </Modal>
      <DiscardChangesDialog
        isOpen={confirmingDiscard}
        onKeepEditing={() => setConfirmingDiscard(false)}
        onDiscard={() => { setConfirmingDiscard(false); closeEdit(); }}
      />
    </div>
  );
};

export default OrganizerHub;
