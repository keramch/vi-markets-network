import React, { useState, useEffect, useMemo } from 'react';
import type { MarketEvent, MarketTag, User } from '../types';
import * as api from '../services/api.live';
import {
  expandOccurrences,
  downloadIcs,
  buildGoogleCalendarUrl,
  formatTime,
  type CalendarOccurrence,
} from '../utils';
import Modal from './Modal';
import MarketEventForm from './MarketEventForm';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  CalendarDays,
  List,
  MapPin,
  Clock,
  Download,
  CalendarPlus,
  X,
} from 'lucide-react';

interface CalendarViewProps {
  currentUser?: User | null;
  onSelectMarket: (id: string) => void;
  onBack: () => void;
}

// ─── Tag display config ────────────────────────────────────────────────────────

const TAG_LABELS: Record<string, string> = {
  seasonalMarket: 'Seasonal',
  onFarm:         'On-Farm',
  indoorMarket:   'Indoor',
  juried:         'Juried',
};

const TAG_COLORS: Record<string, string> = {
  seasonalMarket: 'bg-green-100 text-green-800',
  onFarm:         'bg-lime-100 text-lime-800',
  indoorMarket:   'bg-blue-100 text-blue-800',
  juried:         'bg-purple-100 text-purple-800',
};

// Chip colours cycled per event
const CHIP_COLORS = [
  'bg-brand-blue text-white',
  'bg-green-700 text-white',
  'bg-purple-700 text-white',
  'bg-orange-500 text-white',
  'bg-teal-600 text-white',
];

// Wider weekend columns (Sat & Sun get 1.4 fr, weekdays get 1 fr)
const WIDE_COLS = '1.4fr 1fr 1fr 1fr 1fr 1fr 1.4fr';

const DAY_HEADERS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// ─── Component ─────────────────────────────────────────────────────────────────

const CalendarView: React.FC<CalendarViewProps> = ({ currentUser, onSelectMarket, onBack }) => {
  const today = new Date();
  const [currentDate, setCurrentDate] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1)
  );
  const [viewMode, setViewMode] = useState<'grid' | 'agenda'>('grid');
  const [events, setEvents] = useState<MarketEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTag, setActiveTag] = useState<MarketTag | null>(null);
  const [selectedOcc, setSelectedOcc] = useState<CalendarOccurrence | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const year  = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-based

  // Fetch published events when the month changes
  useEffect(() => {
    setLoading(true);
    api
      .getMarketEvents({ status: 'published', year, month: month + 1 })
      .then(setEvents)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [year, month]);

  // Expand occurrences for this month
  const occurrences = useMemo(() => {
    const all = expandOccurrences(events, year, month);
    if (!activeTag) return all;
    return all.filter(o => o.event.marketTags.includes(activeTag));
  }, [events, year, month, activeTag]);

  // Group by date string for the grid view
  const byDate = useMemo(() => {
    const map = new Map<string, CalendarOccurrence[]>();
    for (const occ of occurrences) {
      const list = map.get(occ.date) ?? [];
      list.push(occ);
      map.set(occ.date, list);
    }
    return map;
  }, [occurrences]);

  // Collect all tags that appear in this month's events (for filter bar)
  const usedTags = useMemo(() => {
    const set = new Set<MarketTag>();
    for (const ev of events) for (const tag of ev.marketTags) set.add(tag);
    return Array.from(set);
  }, [events]);

  // Assign a stable chip colour per event
  const eventColorMap = useMemo(() => {
    const map = new Map<string, string>();
    let i = 0;
    for (const ev of events) { map.set(ev.id, CHIP_COLORS[i++ % CHIP_COLORS.length]); }
    return map;
  }, [events]);

  const handlePrev = () => setCurrentDate(new Date(year, month - 1, 1));
  const handleNext = () => setCurrentDate(new Date(year, month + 1, 1));

  const isOrganizer = !!currentUser?.ownedMarketId;

  // ── Grid cell helpers ──────────────────────────────────────────────────────
  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 = Sunday
  const daysInMonth     = new Date(year, month + 1, 0).getDate();

  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const toDateStr = (d: number) =>
    `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

  // ── Grid view ──────────────────────────────────────────────────────────────
  const renderGrid = () => {
    const cells: React.ReactNode[] = [];

    // Blank cells before the 1st
    for (let i = 0; i < firstDayOfMonth; i++) {
      const isWkend = i === 0 || i === 6;
      cells.push(
        <div
          key={`blank-${i}`}
          className={`border border-gray-100 min-h-[120px] ${isWkend ? 'bg-brand-cream/20' : 'bg-gray-50/40'}`}
        />
      );
    }

    // Day cells
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr  = toDateStr(d);
      const dayOccs  = byDate.get(dateStr) ?? [];
      const isToday  = dateStr === todayStr;
      const colIndex = (firstDayOfMonth + d - 1) % 7;
      const isWkend  = colIndex === 0 || colIndex === 6;

      cells.push(
        <div
          key={d}
          className={`border border-gray-200 p-1.5 min-h-[120px] ${isWkend ? 'bg-brand-cream/30' : 'bg-white'}`}
        >
          {/* Day number */}
          <div
            className={`text-right text-xs font-semibold mb-1 w-5 h-5 rounded-full flex items-center justify-center ml-auto ${
              isToday ? 'bg-brand-blue text-white' : 'text-gray-600'
            }`}
          >
            {d}
          </div>

          {/* Event chips */}
          <div className="space-y-0.5">
            {dayOccs.slice(0, 3).map((occ, i) => (
              <div
                key={`${occ.event.id}-${i}`}
                onClick={() => setSelectedOcc(occ)}
                className={`text-xs px-1.5 py-0.5 rounded cursor-pointer leading-tight ${
                  eventColorMap.get(occ.event.id) ?? CHIP_COLORS[0]
                }`}
                title={`${occ.event.name} · ${occ.event.location.city}`}
              >
                <span className="font-medium truncate block">{occ.event.name}</span>
                <span className="opacity-75 truncate block" style={{ fontSize: '0.65rem' }}>
                  {occ.event.location.city}
                </span>
              </div>
            ))}
            {dayOccs.length > 3 && (
              <button
                onClick={() => setSelectedOcc(dayOccs[3])}
                className="text-xs text-brand-blue px-1 hover:underline"
              >
                +{dayOccs.length - 3} more
              </button>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {/* Header row */}
        <div className="grid" style={{ gridTemplateColumns: WIDE_COLS }}>
          {DAY_HEADERS.map(d => (
            <div
              key={d}
              className={`py-2 text-center text-sm font-semibold text-brand-blue border-b-2 border-gray-200 ${
                d === 'Sun' || d === 'Sat' ? 'bg-brand-cream/40' : ''
              }`}
            >
              {d}
            </div>
          ))}
        </div>
        {/* Day cells */}
        <div className="grid" style={{ gridTemplateColumns: WIDE_COLS }}>
          {cells}
        </div>
      </div>
    );
  };

  // ── Agenda view ────────────────────────────────────────────────────────────
  const renderAgenda = () => {
    if (occurrences.length === 0) {
      return (
        <div className="bg-white rounded-lg shadow p-12 text-center text-gray-500">
          No published events this month.
        </div>
      );
    }

    let lastDate = '';
    return (
      <div className="bg-white rounded-lg shadow divide-y">
        {occurrences.map((occ, i) => {
          const showDate = occ.date !== lastDate;
          lastDate = occ.date;
          // Use T12:00:00 to prevent timezone rollback
          const dateObj = new Date(`${occ.date}T12:00:00`);
          const chipColor = (eventColorMap.get(occ.event.id) ?? CHIP_COLORS[0]).split(' ')[0];

          return (
            <React.Fragment key={`${occ.event.id}-${occ.date}-${i}`}>
              {showDate && (
                <div className="bg-brand-cream/40 px-4 py-2 text-sm font-semibold text-brand-blue">
                  {dateObj.toLocaleDateString('en-CA', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                  })}
                </div>
              )}
              <div
                onClick={() => setSelectedOcc(occ)}
                className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50"
              >
                <div className={`w-2 h-8 rounded-sm flex-shrink-0 ${chipColor}`} />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-brand-blue truncate">{occ.event.name}</p>
                  <p className="text-xs text-gray-500 flex items-center gap-3 mt-0.5">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatTime(occ.startTime)} – {formatTime(occ.endTime)}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {occ.event.location.venueName}
                    </span>
                  </p>
                </div>
              </div>
            </React.Fragment>
          );
        })}
      </div>
    );
  };

  // ── Event detail modal ─────────────────────────────────────────────────────
  const renderEventDetail = () => {
    if (!selectedOcc) return null;
    const { event, date, startTime, endTime } = selectedOcc;
    const dateObj = new Date(`${date}T12:00:00`);

    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        onClick={() => setSelectedOcc(null)}
      >
        <div
          className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6"
          onClick={e => e.stopPropagation()}
        >
          {/* Title */}
          <div className="flex items-start justify-between mb-3">
            <h2 className="text-xl font-serif text-brand-blue pr-2">{event.name}</h2>
            <button
              onClick={() => setSelectedOcc(null)}
              className="text-gray-400 hover:text-gray-600 flex-shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tags */}
          {event.marketTags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {event.marketTags.map(tag => (
                <span
                  key={tag}
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    TAG_COLORS[tag] ?? 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {TAG_LABELS[tag] ?? tag}
                </span>
              ))}
            </div>
          )}

          {/* Details */}
          <div className="space-y-2 text-sm text-gray-700 mb-5">
            <div className="flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-brand-blue flex-shrink-0" />
              <span>
                {dateObj.toLocaleDateString('en-CA', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-brand-blue flex-shrink-0" />
              <span>
                {formatTime(startTime)} – {formatTime(endTime)}
              </span>
            </div>
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-brand-blue flex-shrink-0 mt-0.5" />
              <span>
                {event.location.venueName}
                <br />
                {event.location.address}, {event.location.city}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => downloadIcs(event, date, startTime, endTime)}
              className="flex items-center gap-1.5 px-3 py-3 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200"
            >
              <Download className="w-3.5 h-3.5" />
              Export .ics
            </button>
            <a
              href={buildGoogleCalendarUrl(event, date, startTime, endTime)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-3 bg-blue-50 text-blue-700 rounded-lg text-sm hover:bg-blue-100"
            >
              <CalendarPlus className="w-3.5 h-3.5" />
              Add to Google
            </a>
            <button
              onClick={() => {
                onSelectMarket(event.marketPageId);
                setSelectedOcc(null);
              }}
              className="flex items-center gap-1.5 px-3 py-3 bg-brand-blue/10 text-brand-blue rounded-lg text-sm hover:bg-brand-blue/20 ml-auto"
            >
              View Market →
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">

      {/* Page header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="text-brand-light-blue hover:text-brand-blue font-semibold"
          >
            &larr; Back
          </button>
          <h1 className="text-4xl font-serif text-brand-blue">Market Calendar</h1>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Add Event button — organizers only */}
          {isOrganizer && (
            <button
              onClick={() => setIsFormOpen(true)}
              className="flex items-center gap-1.5 px-4 py-3 bg-brand-blue text-white rounded-lg text-sm font-semibold hover:bg-brand-blue/90 min-h-[48px]"
            >
              <Plus className="w-4 h-4" />
              Add Event
            </button>
          )}

          {/* Month navigation */}
          <div className="flex items-center gap-1 bg-white rounded-lg shadow-sm px-2 py-1">
            <button onClick={handlePrev} className="p-2.5 rounded hover:bg-gray-100">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="font-semibold w-40 text-center text-sm">
              {currentDate.toLocaleDateString('en-CA', { month: 'long', year: 'numeric' })}
            </span>
            <button onClick={handleNext} className="p-2.5 rounded hover:bg-gray-100">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Grid / Agenda toggle */}
          <div className="flex gap-1 bg-white rounded-lg shadow-sm p-1">
            <button
              onClick={() => setViewMode('grid')}
              title="Grid view"
              className={`p-1.5 rounded transition-colors ${
                viewMode === 'grid' ? 'bg-brand-blue text-white' : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              <CalendarDays className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('agenda')}
              title="Agenda view"
              className={`p-1.5 rounded transition-colors ${
                viewMode === 'agenda' ? 'bg-brand-blue text-white' : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Tag filter bar */}
      {usedTags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => setActiveTag(null)}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              !activeTag
                ? 'bg-brand-blue text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100 shadow-sm'
            }`}
          >
            All
          </button>
          {usedTags.map(tag => (
            <button
              key={tag}
              onClick={() => setActiveTag(activeTag === tag ? null : tag)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                activeTag === tag
                  ? TAG_COLORS[tag] ?? 'bg-gray-200 text-gray-800'
                  : 'bg-white text-gray-600 hover:bg-gray-100 shadow-sm'
              }`}
            >
              {TAG_LABELS[tag] ?? tag}
            </button>
          ))}
        </div>
      )}

      {/* Main content */}
      {loading ? (
        <div className="text-center py-20 text-gray-400">Loading events…</div>
      ) : viewMode === 'grid' ? (
        renderGrid()
      ) : (
        renderAgenda()
      )}

      {/* Event detail overlay */}
      {renderEventDetail()}

      {/* Create event modal */}
      {isFormOpen && currentUser && (
        <Modal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} title="Create Market Event" maxWidth="xl">
          <MarketEventForm
            currentUser={currentUser}
            onSaved={newEvent => {
              setEvents(prev => [...prev, newEvent]);
              setIsFormOpen(false);
            }}
            onCancel={() => setIsFormOpen(false)}
          />
        </Modal>
      )}
    </div>
  );
};

export default CalendarView;
