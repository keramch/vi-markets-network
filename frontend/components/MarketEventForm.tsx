import React, { useState, useRef, useEffect } from 'react';
import type { MarketEvent, MarketTag, User } from '../types';
import { MarketTags, MarketCategories } from '../types';
import * as api from '../services/api.live';
import ImageUploader from './ImageUploader';
import { uploadImage, ALLOWED_IMAGE_TYPES, MAX_IMAGE_SIZE_BYTES } from '../services/storageUpload';

interface MarketEventFormProps {
  currentUser: User;
  onSaved: (event: MarketEvent) => void;
  onCancel: () => void;
  existingEvent?: MarketEvent;
  // Told whether anything differs from when the form opened, so a click
  // outside the window can ask before throwing changes away
  onDirtyChange?: (dirty: boolean) => void;
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
  onDirtyChange,
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
  const [marketType, setMarketType] = useState<string[]>(
    (existingEvent as any)?.marketType ?? []
  );
  const [externalUrl, setExternalUrl] = useState(existingEvent?.externalEventUrl ?? '');
  const [description, setDescription] = useState(existingEvent?.description ?? '');
  // Saved image addresses ('' once removed) and newly chosen files, uploaded on save
  const [posterUrl, setPosterUrl]     = useState(existingEvent?.posterUrl ?? '');
  const [tileUrl, setTileUrl]         = useState(existingEvent?.tileUrl ?? '');
  const [posterFile, setPosterFile]   = useState<File | null>(null);
  const [tileFile, setTileFile]       = useState<File | null>(null);
  const [saving, setSaving]           = useState(false);
  const [error, setError]             = useState('');
  // A live event gets Save Changes / Unpublish instead of Save Draft / Publish,
  // and Unpublish asks for confirmation because it hides every date (T093).
  const isLive = existingEvent?.status === 'published';
  const [confirmingUnpublish, setConfirmingUnpublish] = useState(false);
  // Switching a live event to or from One-Time replaces its public dates.
  // Recurring <-> Special Edition use the same series fields, so no warning.
  // The server merges, so the old schedule fields stay and switching back
  // restores them (T094).
  const typeSwitchReplacesDates =
    isLive && (existingEvent!.type === 'oneTime') !== (type === 'oneTime');

  const snapshot = JSON.stringify([
    type, name, venueName, address, city, province, startTime, endTime, date, startDate, endDate,
    recurrenceDays, recurrenceFrequency, selectedTags, marketType, externalUrl, description,
    posterUrl, tileUrl, posterFile?.name ?? '', tileFile?.name ?? '',
  ]);
  const initialSnapshot = useRef(snapshot);
  useEffect(() => {
    onDirtyChange?.(snapshot !== initialSnapshot.current);
  }, [snapshot, onDirtyChange]);

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

    // Upload any newly chosen images into the market's own image folder
    // (storage.rules lets the market's owner write there)
    const marketId = existingEvent?.marketPageId ?? currentUser.ownedMarketId!;
    let finalPosterUrl = posterUrl;
    let finalTileUrl = tileUrl;
    try {
      if (posterFile) {
        const ext = posterFile.name.split('.').pop() ?? 'jpg';
        finalPosterUrl = await uploadImage(posterFile, `markets/${marketId}/event_poster_${Date.now()}.${ext}`);
      }
      if (tileFile) {
        const ext = tileFile.name.split('.').pop() ?? 'jpg';
        finalTileUrl = await uploadImage(tileFile, `markets/${marketId}/event_tile_${Date.now()}.${ext}`);
      }
    } catch {
      setError('The image could not be uploaded. Please try again, or save without it.');
      setSaving(false);
      return;
    }

    const schedule: MarketEvent['schedule'] = {
      startTime,
      endTime,
      ...(type === 'oneTime'
        ? { date }
        : {
            startDate,
            // An emptied end date is sent as '' so the server's merge clears
            // it; leaving it out kept the old value (T004)
            ...(endDate ? { endDate } : existingEvent?.schedule.endDate ? { endDate: '' } : {}),
            recurrenceDays,
            recurrenceFrequency,
          }),
    };

    const payload = {
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
      // Same for an emptied link or Market Type: clear only that field (T004)
      ...(externalUrl.trim()
        ? { externalEventUrl: externalUrl.trim() }
        : existingEvent?.externalEventUrl ? { externalEventUrl: '' } : {}),
      ...(marketType.length > 0
        ? { marketType }
        : ((existingEvent as any)?.marketType?.length ?? 0) > 0 ? { marketType: [] } : {}),
      // Same pattern: send a value, or '' only when one was saved and is now emptied
      ...(description.trim()
        ? { description: description.trim() }
        : existingEvent?.description ? { description: '' } : {}),
      ...(finalPosterUrl ? { posterUrl: finalPosterUrl } : existingEvent?.posterUrl ? { posterUrl: '' } : {}),
      ...(finalTileUrl ? { tileUrl: finalTileUrl } : existingEvent?.tileUrl ? { tileUrl: '' } : {}),
    } as Omit<MarketEvent, 'id' | 'createdAt' | 'updatedAt'>;

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
        {typeSwitchReplacesDates && (
          <p className="mt-2 border border-amber-300 bg-amber-50 rounded-lg p-3 text-sm text-gray-800" role="alert">
            {type === 'oneTime'
              ? 'Saving this replaces every date of this series on the public calendar with the single date below. Your series details are kept, so switching back restores them.'
              : 'Saving this replaces the single date of this event on the public calendar with the series dates below. The one-time date is kept, so switching back restores it.'}
          </p>
        )}
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

      {/* Market Type */}
      <div>
        <label className={labelCls}>Market Type <span className="text-gray-400 font-normal">(select up to 3)</span></label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {Object.values(MarketCategories).map(cat => {
            const checked = marketType.includes(cat);
            const disabled = !checked && marketType.length >= 3;
            return (
              <label key={cat} className={`flex items-center gap-2 bg-gray-50 border rounded-lg px-3 py-2 transition-colors ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer hover:bg-gray-100 border-gray-200'} ${checked ? 'border-brand-blue bg-brand-blue/5' : 'border-gray-200'}`}>
                <input
                  type="checkbox"
                  value={cat}
                  checked={checked}
                  disabled={disabled}
                  onChange={() => {
                    if (checked) {
                      setMarketType(prev => prev.filter(t => t !== cat));
                    } else if (marketType.length < 3) {
                      setMarketType(prev => [...prev, cat]);
                    }
                  }}
                  className="h-3.5 w-3.5 text-brand-blue border-gray-300 focus:ring-brand-gold"
                />
                <span className="text-sm text-gray-600 leading-tight">{cat}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Description */}
      <div>
        <label htmlFor="event-description" className={labelCls}>About this event</label>
        <p id="event-description-help" className="text-sm text-gray-500 mb-2">
          Optional. Shown on the event page. If you leave it empty, your market's own description is shown instead.
        </p>
        <textarea
          id="event-description"
          aria-describedby="event-description-help"
          className={`${inputCls} min-h-[7rem]`}
          value={description}
          onChange={e => setDescription(e.target.value)}
          maxLength={2000}
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

      {/* Images: a vertical poster for the page, a horizontal share image for link
          previews (stored as tileUrl; it was a square tile until Nov 10, when
          Kera saw Facebook crop squares to a wide strip) */}
      <fieldset className="border border-gray-200 rounded-lg p-3 space-y-4">
        <legend className="text-sm font-semibold text-gray-600 px-1">Event images</legend>
        <div className="bg-brand-cream rounded-lg p-3 text-sm text-gray-700 space-y-1">
          <p>Both images are optional, but we recommend adding both:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Vertical poster</strong>, like your print poster (8.5 × 11). It's shown on your event page.</li>
            <li><strong>Horizontal share image</strong>, like a Facebook event cover (1200 × 630). It's the picture people see when your event link is shared on Facebook, in messages and elsewhere. Keep important words away from the edges, since some apps trim them a little.</li>
          </ul>
        </div>

        {([
          { key: 'poster', title: 'Vertical poster', url: posterUrl, setUrl: setPosterUrl, file: posterFile, setFile: setPosterFile, ratio: '8.5:11', max: 1600, shape: 'w-24 aspect-[17/22]' },
          { key: 'tile',   title: 'Horizontal share image', url: tileUrl, setUrl: setTileUrl, file: tileFile, setFile: setTileFile, ratio: '1.9:1', max: 1200, shape: 'w-40 aspect-[40/21]' },
        ] as const).map(img => (
          <div key={img.key}>
            {img.url && !img.file ? (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">{img.title}</p>
                <div className="flex items-center gap-4">
                  <img src={img.url} alt={`Current ${img.title.toLowerCase()}`} className={`${img.shape} object-cover rounded-md border border-gray-200`} />
                  <button
                    type="button"
                    onClick={() => img.setUrl('')}
                    className="px-4 py-2 min-h-[2.75rem] border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 font-medium"
                  >
                    Remove or replace
                  </button>
                </div>
              </div>
            ) : (
              <ImageUploader
                id={`event-${img.key}`}
                label={img.title}
                onFilesChanged={files => img.setFile(files[0] ?? null)}
                maxFiles={1}
                maxSizeKB={MAX_IMAGE_SIZE_BYTES / 1024}
                allowedTypes={ALLOWED_IMAGE_TYPES}
                aspectRatio={img.ratio}
                maxDimension={img.max}
              />
            )}
          </div>
        ))}
      </fieldset>

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

      {existingEvent && existingEvent.type !== 'oneTime' && (
        <p className="text-gray-600 text-sm">Changes apply to every date in this series.</p>
      )}

      {/* Actions */}
      {confirmingUnpublish ? (
        <div className="border border-amber-300 bg-amber-50 rounded-lg p-4 space-y-3" role="alert">
          <p className="text-sm text-gray-800">
            Unpublishing takes every date of this event off the public calendar and your market
            profile. Your changes are saved, and the event stays in your list as a draft. Publish
            it again any time to bring the dates back.
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setConfirmingUnpublish(false)}
              disabled={saving}
              className="flex-1 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 font-medium disabled:opacity-50"
            >
              Keep it live
            </button>
            <button
              type="button"
              onClick={() => handleSubmit('draft')}
              disabled={saving}
              className="flex-1 py-2 bg-brand-blue text-white rounded-lg hover:bg-brand-blue/90 font-medium disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Yes, unpublish'}
            </button>
          </div>
        </div>
      ) : (
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
            onClick={() => (isLive ? setConfirmingUnpublish(true) : handleSubmit('draft'))}
            disabled={saving}
            className="flex-1 py-2 border border-brand-blue text-brand-blue rounded-lg hover:bg-brand-blue/5 font-medium disabled:opacity-50"
          >
            {isLive ? 'Unpublish' : 'Save Draft'}
          </button>
          <button
            type="button"
            onClick={() => handleSubmit('published')}
            disabled={saving}
            className="flex-1 py-2 bg-brand-blue text-white rounded-lg hover:bg-brand-blue/90 font-medium disabled:opacity-50"
          >
            {saving ? 'Saving…' : isLive ? 'Save Changes' : 'Publish'}
          </button>
        </div>
      )}
    </div>
  );
};

export default MarketEventForm;
