import React, { useState } from 'react';
import type { MarketEvent, MarketTag, User } from '../types';
import { MarketTags } from '../types';
import * as api from '../services/api.live';

interface MarketEventFormProps {
  currentUser: User;
  onSaved: (event: MarketEvent) => void;
  onCancel: () => void;
  existingEvent?: MarketEvent;
}

const TAG_LABELS: Record<string, string> = {
  seasonalMarket: 'Seasonal',
  onFarm:         'On-Farm',
  indoorMarket:   'Indoor',
  juried:         'Juried',
};

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const inputCls = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/40';
const labelCls = 'block text-sm font-medium text-gray-700 mb-1';

const MarketEventForm: React.FC<MarketEventFormProps> = ({
  currentUser,
  onSaved,
  onCancel,
  existingEvent,
}) => {
  const [type, setType] = useState<'recurring' | 'oneTime' | 'specialEdition'>(
    existingEvent?.type ?? 'recurring'
  );
  const [name, setName]             = useState(existingEvent?.name ?? '');
  const [venueName, setVenueName]   = useState(existingEvent?.location.venueName ?? '');
  const [address, setAddress]       = useState(existingEvent?.location.address ?? '');
  const [city, setCity]             = useState(existingEvent?.location.city ?? 'Victoria');
  const [province, setProvince]     = useState(existingEvent?.location.province ?? 'BC');
  const [startTime, setStartTime]   = useState(existingEvent?.schedule.startTime ?? '09:00');
  const [endTime, setEndTime]       = useState(existingEvent?.schedule.endTime ?? '14:00');
  const [date, setDate]             = useState(existingEvent?.schedule.date ?? '');
  const [startDate, setStartDate]   = useState(existingEvent?.schedule.startDate ?? '');
  const [endDate, setEndDate]       = useState(existingEvent?.schedule.endDate ?? '');
  const [recurrenceDays, setRecurrenceDays] = useState<number[]>(
    existingEvent?.schedule.recurrenceDays ?? []
  );
  const [recurrenceFrequency, setRecurrenceFrequency] = useState<'weekly' | 'biweekly' | 'monthly'>(
    existingEvent?.schedule.recurrenceFrequency ?? 'weekly'
  );
  const [selectedTags, setSelectedTags] = useState<string[]>(
    existingEvent?.marketTags ?? []
  );
  const [externalUrl, setExternalUrl] = useState(existingEvent?.externalEventUrl ?? '');
  const [saving, setSaving]           = useState(false);
  const [error, setError]             = useState('');

  const toggleDay = (d: number) =>
    setRecurrenceDays(prev =>
      prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]
    );

  const toggleTag = (tag: string) =>
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );

  const validate = (): string | null => {
    if (!name.trim())      return 'Event name is required';
    if (!venueName.trim()) return 'Venue name is required';
    if (!address.trim())   return 'Address is required';
    if (!startTime || !endTime) return 'Start and end times are required';
    if (type === 'oneTime' && !date)
      return 'Date is required for one-time events';
    if (type !== 'oneTime' && !startDate)
      return 'Start date is required for recurring events';
    if (type !== 'oneTime' && recurrenceDays.length === 0)
      return 'Select at least one recurrence day';
    return null;
  };

  const handleSubmit = async (status: 'draft' | 'published') => {
    const validationError = validate();
    if (validationError) { setError(validationError); return; }

    setSaving(true);
    setError('');

    const schedule: MarketEvent['schedule'] = {
      startTime,
      endTime,
      ...(type === 'oneTime'
        ? { date }
        : {
            startDate,
            ...(endDate ? { endDate } : {}),
            recurrenceDays,
            recurrenceFrequency,
          }),
    };

    const payload: Omit<MarketEvent, 'id' | 'createdAt' | 'updatedAt'> = {
      marketPageId:  currentUser.ownedMarketId!,
      organizerUid:  currentUser.id,
      name:          name.trim(),
      type,
      marketTags:    selectedTags as MarketTag[],
      location: {
        venueName: venueName.trim(),
        address:   address.trim(),
        city:      city.trim(),
        province:  province.trim(),
      },
      schedule,
      exceptions: existingEvent?.exceptions ?? [],
      status,
      photos:     existingEvent?.photos ?? [],
      ...(externalUrl.trim() ? { externalEventUrl: externalUrl.trim() } : {}),
    };

    try {
      const saved = existingEvent
        ? await api.updateMarketEvent(existingEvent.id, { ...payload, status })
        : await api.createMarketEvent(payload);
      onSaved(saved);
    } catch (e: any) {
      setError(e.message ?? 'Failed to save event');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5 text-sm">

      {/* Event type */}
      <div>
        <label className={labelCls}>Event Type</label>
        <div className="flex gap-2">
          {(['recurring', 'oneTime', 'specialEdition'] as const).map(t => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-colors ${
                type === t
                  ? 'bg-brand-blue text-white border-brand-blue'
                  : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
              }`}
            >
              {t === 'recurring' ? 'Recurring' : t === 'oneTime' ? 'One-Time' : 'Special Edition'}
            </button>
          ))}
        </div>
      </div>

      {/* Name */}
      <div>
        <label className={labelCls}>Event Name *</label>
        <input
          className={inputCls}
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="e.g. Saturday Farmers Market"
        />
      </div>

      {/* Location */}
      <fieldset className="border border-gray-200 rounded-lg p-3 space-y-3">
        <legend className="text-xs font-semibold text-gray-500 px-1 uppercase tracking-wide">Location</legend>
        <div>
          <label className={labelCls}>Venue Name *</label>
          <input className={inputCls} value={venueName} onChange={e => setVenueName(e.target.value)} placeholder="e.g. Centennial Square" />
        </div>
        <div>
          <label className={labelCls}>Address *</label>
          <input className={inputCls} value={address} onChange={e => setAddress(e.target.value)} placeholder="e.g. 1 Centennial Square" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>City</label>
            <input className={inputCls} value={city} onChange={e => setCity(e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Province</label>
            <input className={inputCls} value={province} onChange={e => setProvince(e.target.value)} maxLength={2} />
          </div>
        </div>
      </fieldset>

      {/* Schedule */}
      <fieldset className="border border-gray-200 rounded-lg p-3 space-y-3">
        <legend className="text-xs font-semibold text-gray-500 px-1 uppercase tracking-wide">Schedule</legend>

        {type === 'oneTime' ? (
          <div>
            <label className={labelCls}>Date *</label>
            <input type="date" className={inputCls} value={date} onChange={e => setDate(e.target.value)} />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Start Date *</label>
                <input type="date" className={inputCls} value={startDate} onChange={e => setStartDate(e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>End Date</label>
                <input type="date" className={inputCls} value={endDate} onChange={e => setEndDate(e.target.value)} />
              </div>
            </div>

            <div>
              <label className={labelCls}>Recurrence Days *</label>
              <div className="flex gap-1.5 flex-wrap">
                {DAY_NAMES.map((d, i) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => toggleDay(i)}
                    className={`px-2.5 py-1 rounded-full text-xs font-semibold border transition-colors ${
                      recurrenceDays.includes(i)
                        ? 'bg-brand-blue text-white border-brand-blue'
                        : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-100'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className={labelCls}>Frequency</label>
              <select
                className={inputCls}
                value={recurrenceFrequency}
                onChange={e => setRecurrenceFrequency(e.target.value as typeof recurrenceFrequency)}
              >
                <option value="weekly">Weekly</option>
                <option value="biweekly">Bi-weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
          </>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Start Time *</label>
            <input type="time" className={inputCls} value={startTime} onChange={e => setStartTime(e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>End Time *</label>
            <input type="time" className={inputCls} value={endTime} onChange={e => setEndTime(e.target.value)} />
          </div>
        </div>
      </fieldset>

      {/* Market Tags */}
      <div>
        <label className={labelCls}>Market Tags</label>
        <div className="flex flex-wrap gap-1.5">
          {Object.values(MarketTags).map(tag => (
            <button
              key={tag}
              type="button"
              onClick={() => toggleTag(tag)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                selectedTags.includes(tag)
                  ? 'bg-brand-blue text-white border-brand-blue'
                  : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-100'
              }`}
            >
              {TAG_LABELS[tag] ?? tag}
            </button>
          ))}
        </div>
      </div>

      {/* External URL */}
      <div>
        <label className={labelCls}>External Event URL</label>
        <input
          className={inputCls}
          value={externalUrl}
          onChange={e => setExternalUrl(e.target.value)}
          placeholder="https://facebook.com/events/..."
          type="url"
        />
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 font-medium"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => handleSubmit('draft')}
          disabled={saving}
          className="flex-1 py-2 border border-brand-blue text-brand-blue rounded-lg hover:bg-brand-blue/5 font-medium disabled:opacity-50"
        >
          Save Draft
        </button>
        <button
          type="button"
          onClick={() => handleSubmit('published')}
          disabled={saving}
          className="flex-1 py-2 bg-brand-blue text-white rounded-lg hover:bg-brand-blue/90 font-medium disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Publish'}
        </button>
      </div>
    </div>
  );
};

export default MarketEventForm;
