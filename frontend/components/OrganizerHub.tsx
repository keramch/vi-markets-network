import React, { useState, useEffect } from 'react';
import { ClipboardList, MessageSquare } from 'lucide-react';
import type { User, Market, MarketEvent } from '../types';
import * as api from '../services/api.live';
import Modal from './Modal';
import MarketEventForm from './MarketEventForm';

interface OrganizerHubProps {
  currentUser: User;
  market: Market;
  onNavigateToProfile: () => void;
  onBack: () => void;
}

const DAY_NAMES_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatRecurringDate(event: MarketEvent): string {
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

function formatOneTimeDate(dateStr: string): string {
  const [, month, day] = dateStr.split('-');
  const dt = new Date(dateStr + 'T12:00:00');
  const dayName = DAY_NAMES_SHORT[dt.getDay()];
  const m = parseInt(month, 10) - 1;
  const d = parseInt(day, 10);
  return `${dayName}, ${MONTH_NAMES_SHORT[m]} ${d}`;
}

function sortKey(event: MarketEvent): string {
  return event.schedule.startDate ?? event.schedule.date ?? '';
}

type EditScope = 'series' | 'following' | 'occurrence';

const OrganizerHub: React.FC<OrganizerHubProps> = ({
  currentUser,
  market,
  onNavigateToProfile,
  onBack,
}) => {
  const [events, setEvents] = useState<MarketEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<MarketEvent | null>(null);
  const [editScope, setEditScope] = useState<EditScope>('series');

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const tier = currentUser.subscription?.tier ?? 'free';
  const isFoundingMember = currentUser.subscription?.foundingMember === true;

  // ── fetch events ────────────────────────────────────────────────────────────

  const loadEvents = async () => {
    setLoading(true);
    try {
      const all = await api.getMarketEvents({ marketPageId: market.id });
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
  }, [market.id]);

  // ── edit handlers ────────────────────────────────────────────────────────────

  const openEdit = (event: MarketEvent) => {
    setSelectedEvent(event);
    setEditScope('series');
    setEditModalOpen(true);
  };

  const closeEdit = () => {
    setEditModalOpen(false);
    setSelectedEvent(null);
  };

  const handleSaved = (saved: MarketEvent) => {
    closeEdit();
    setEvents(prev =>
      prev
        .map(e => (e.id === saved.id ? saved : e))
        .sort((a, b) => sortKey(a).localeCompare(sortKey(b)))
    );
  };

  // ── delete handlers ──────────────────────────────────────────────────────────

  const handleDeleteConfirm = async (id: string) => {
    try {
      await api.archiveMarketEvent(id);
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
        <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-teal-100 text-teal-700">
          Founding Member
        </span>
      );
    }
    if (tier === 'pro' || tier === 'superPro') {
      return (
        <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-violet-100 text-violet-700">
          Pro
        </span>
      );
    }
    if (tier === 'standard') {
      return (
        <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-gray-100 text-gray-600">
          Standard
        </span>
      );
    }
    return (
      <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-gray-100 text-gray-500">
        Free
      </span>
    );
  };

  // ── event type label ─────────────────────────────────────────────────────────

  const typeLabel = (t: MarketEvent['type']) => {
    if (t === 'recurring') return 'Recurring';
    if (t === 'oneTime') return 'One-Time';
    return 'Special Edition';
  };

  const isScopeDisabled = editScope !== 'series';

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-5xl">

      {/* Back link */}
      <button
        onClick={onBack}
        className="mb-4 text-brand-light-blue hover:text-brand-blue font-semibold text-sm"
      >
        &larr; Back to home
      </button>

      {/* Page header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-3xl font-serif text-brand-blue">Organizer Hub</h1>
          <p className="text-gray-500 mt-1 text-sm">
            {market.name}
            <span className="mx-2 text-gray-300">·</span>
            <button
              onClick={onNavigateToProfile}
              className="text-brand-teal hover:text-brand-blue transition-colors"
            >
              Edit profile
            </button>
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 mt-1">
          <TierPill />
          <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-green-100 text-green-700">
            Active
          </span>
        </div>
      </div>

      {/* ── SECTION 1: Event Manager ─────────────────────────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden mb-6">

        {/* Section header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-800">Event manager</span>
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-800">
              Live
            </span>
          </div>
          <button
            onClick={() => {
              setSelectedEvent(null);
              setEditScope('series');
              setEditModalOpen(true);
            }}
            className="bg-brand-blue text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-brand-blue/90 transition-colors"
          >
            + Add event
          </button>
        </div>

        {/* Coming soon note */}
        <p className="px-5 pt-3 text-xs text-gray-400 italic">
          Per-occurrence editing and more event management features coming soon.
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
              No events yet. Add your first event to get started.
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
                      Archive <span className="font-medium">{event.name}</span>? This cannot be undone.
                    </span>
                    <button
                      onClick={() => handleDeleteConfirm(event.id)}
                      className="text-xs font-semibold bg-red-100 text-red-700 px-3 py-1 rounded hover:bg-red-200"
                    >
                      Confirm
                    </button>
                    <button
                      onClick={() => setConfirmDeleteId(null)}
                      className="text-xs font-semibold bg-gray-100 text-gray-600 px-3 py-1 rounded hover:bg-gray-200"
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
                    <div className="text-xs text-gray-500 flex-shrink-0" style={{ minWidth: 110 }}>
                      {event.type === 'oneTime' && event.schedule.date
                        ? formatOneTimeDate(event.schedule.date)
                        : formatRecurringDate(event)}
                    </div>

                    {/* Name + location */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate text-sm">{event.name}</p>
                      <p className="text-xs text-gray-500 truncate">
                        {event.location.venueName} · {event.location.city}
                      </p>
                    </div>

                    {/* Type pill */}
                    <span className="hidden sm:inline-flex text-xs px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-600 flex-shrink-0">
                      {typeLabel(event.type)}
                    </span>

                    {/* Status badge */}
                    <span
                      className={`text-xs font-medium px-2.5 py-0.5 rounded-full flex-shrink-0 ${
                        event.status === 'published'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {event.status === 'published' ? 'Published' : 'Draft'}
                    </span>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => openEdit(event)}
                        className="text-brand-teal border border-brand-teal/40 rounded text-xs px-3 py-1 hover:bg-teal-50 transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(event.id)}
                        className="text-brand-rhubarb border border-brand-rhubarb/30 rounded text-xs px-3 py-1 hover:bg-red-50 transition-colors"
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

      {/* ── SECTION 2: Application Manager (Phase 2) ────────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden mb-6 opacity-80">

        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-800">Application manager</span>
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
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
            <p className="text-xs italic text-gray-400">
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
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-violet-100 text-violet-700">
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
            <p className="text-xs italic text-gray-400">
              Founding members get early access as soon as this feature launches.
            </p>
          </div>
        </div>
      </div>

      {/* ── Edit / Add Event Modal ───────────────────────────────────────────── */}
      <Modal
        isOpen={editModalOpen}
        onClose={closeEdit}
        title={selectedEvent ? 'Edit Event' : 'Add Event'}
        maxWidth="lg"
      >
        {/* Edit scope selector — only shown when editing an existing event */}
        {selectedEvent && (
          <div className="mb-5">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Edit scope
            </p>
            <div className="flex gap-2">
              {(['series', 'following', 'occurrence'] as EditScope[]).map(scope => (
                <button
                  key={scope}
                  type="button"
                  onClick={() => setEditScope(scope)}
                  className={`flex-1 py-1.5 rounded-full border text-xs font-medium transition-colors ${
                    editScope === scope
                      ? 'bg-brand-blue text-white border-brand-blue'
                      : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {scope === 'series'
                    ? 'This series'
                    : scope === 'following'
                    ? 'This & following'
                    : 'One occurrence'}
                </button>
              ))}
            </div>
            {isScopeDisabled && (
              <p className="mt-2 text-xs text-amber-600 italic">
                Per-occurrence editing coming soon.
              </p>
            )}
          </div>
        )}

        <MarketEventForm
          currentUser={currentUser}
          existingEvent={selectedEvent ?? undefined}
          onSaved={isScopeDisabled ? () => {} : handleSaved}
          onCancel={closeEdit}
        />
      </Modal>
    </div>
  );
};

export default OrganizerHub;
