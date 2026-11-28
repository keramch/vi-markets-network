import React, { useState, useRef, useEffect } from 'react';
import type { Organizer, Market, MarketTag, User } from '../types';
import { MarketTags, MarketCategories } from '../types';
import * as api from '../services/api.live';
import ImageUploader from './ImageUploader';
import { uploadImage, ALLOWED_IMAGE_TYPES, MAX_IMAGE_SIZE_BYTES } from '../services/storageUpload';

interface MarketEventFormProps {
  currentUser: User;
  // The organizer whose market this is: the signed-in organizer, or any
  // organizer an admin manages from HQ. None = an unclaimed market (HQ only).
  organizer?: Organizer;
  // All organizers: lets an admin give an existing market to another organizer
  allOrganizers?: Organizer[];
  onSaved: (event: Market) => void;
  onCancel: () => void;
  existingEvent?: Market;
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
  organizer,
  allOrganizers,
  onSaved,
  onCancel,
  existingEvent,
  onDirtyChange,
}) => {
  // 'dates': on a list of days (one-off, several days, irregular); 'recurring': repeats
  const [type, setType] = useState<'recurring' | 'dates'>(
    existingEvent?.type === 'recurring' ? 'recurring' : existingEvent ? 'dates' : 'dates'
  );
  const [name, setName]             = useState(existingEvent?.name ?? '');
  const [venueName, setVenueName]   = useState(existingEvent?.location.venueName ?? '');
  const [address, setAddress]       = useState(existingEvent?.location.address ?? '');
  const [city, setCity]             = useState(existingEvent?.location.city ?? '');
  const [province, setProvince]     = useState(existingEvent?.location.province ?? 'BC');
  const [startTime, setStartTime]   = useState(existingEvent ? existingEvent.schedule.startTime ?? '' : '09:00');
  const [endTime, setEndTime]       = useState(existingEvent ? existingEvent.schedule.endTime ?? '' : '14:00');
  // "On these dates": the list, plus the date picker for adding one
  const [dates, setDates]           = useState<string[]>(
    existingEvent ? (existingEvent.schedule.dates ?? (existingEvent.schedule.date ? [existingEvent.schedule.date] : [])) : []
  );
  const [newDate, setNewDate]       = useState('');
  // Dates known only from a vendor; confirming one removes its mark
  const [dateSources, setDateSources] = useState<Record<string, 'vendor'>>(existingEvent?.dateSources ?? {});
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
    existingEvent?.marketType ?? []
  );
  const [externalUrl, setExternalUrl] = useState(existingEvent?.externalEventUrl ?? '');
  const [description, setDescription] = useState(existingEvent?.description ?? '');
  // "Organized by": only while there's no public organizer page to show instead (T140)
  const [organizedBy, setOrganizedBy] = useState(existingEvent?.organizedBy ?? '');
  const showOrganizedBy = !organizer || !!organizer.pageHidden || !!existingEvent?.organizedBy;
  // Saved image addresses ('' once removed) and newly chosen files, uploaded on save
  const [posterUrl, setPosterUrl]     = useState(existingEvent?.posterUrl ?? '');
  const [tileUrl, setTileUrl]         = useState(existingEvent?.tileUrl ?? '');
  const [posterFile, setPosterFile]   = useState<File | null>(null);
  const [tileFile, setTileFile]       = useState<File | null>(null);
  const [saving, setSaving]           = useState(false);
  const [error, setError]             = useState('');
  // Admins only, editing a market: which organizer runs it ('' = unclaimed)
  const isAdmin = !!currentUser.isAdmin;
  const canMove = !!existingEvent && isAdmin && (allOrganizers?.length ?? 0) > 0;
  const [moveTo, setMoveTo] = useState(existingEvent ? existingEvent.organizerId ?? '' : organizer?.id ?? '');
  const moving = !!existingEvent && moveTo !== (existingEvent.organizerId ?? '');
  // A live event gets Save Changes / Unpublish instead of Save Draft / Publish,
  // and Unpublish asks for confirmation because it hides every date (T093).
  const isLive = existingEvent?.status === 'published';
  const [confirmingUnpublish, setConfirmingUnpublish] = useState(false);
  // Switching a live market between "on these dates" and "repeats" replaces
  // its public dates. The server merges, so the other schedule's fields stay
  // and switching back restores them (T094).
  const typeSwitchReplacesDates =
    isLive && (existingEvent!.type === 'recurring') !== (type === 'recurring');

  const snapshot = JSON.stringify([
    type, name, venueName, address, city, province, startTime, endTime, dates, newDate, dateSources, startDate, endDate,
    recurrenceDays, recurrenceFrequency, selectedTags, marketType, externalUrl, description, organizedBy,
    posterUrl, tileUrl, posterFile?.name ?? '', tileFile?.name ?? '', moveTo,
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

  const addDate = () => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(newDate)) return;
    setDates(prev => [...new Set([...prev, newDate])].sort());
    setNewDate('');
  };
  const removeDate = (d: string) => {
    setDates(prev => prev.filter(x => x !== d));
    setDateSources(prev => { const { [d]: _gone, ...rest } = prev; return rest; });
  };
  const confirmDate = (d: string) =>
    setDateSources(prev => { const { [d]: _gone, ...rest } = prev; return rest; });

  // Organizers give the full details; HQ may list a market with what's known so far
  const validate = (): string | null => {
    if (!name.trim()) return 'Please give the market a name.';
    if (!isAdmin && !venueName.trim()) return 'Venue name is required';
    if (!isAdmin && !address.trim())   return 'Address is required';
    if (!venueName.trim() && !address.trim() && !city.trim()) return 'Please add a venue, address or town.';
    if (!!startTime !== !!endTime) return 'Please add both a start and an end time, or neither.';
    if (!isAdmin && (!startTime || !endTime)) return 'Start and end times are required';
    if (type === 'dates' && !isAdmin && allDates().length === 0) return 'Please add at least one date.';
    if (type === 'recurring' && !startDate) return 'Start date is required for a repeating market';
    if (type === 'recurring' && recurrenceDays.length === 0) return 'Select at least one day it repeats on';
    return null;
  };

  // The listed dates plus one picked in the date box but not yet added with
  // "Add date": saving shouldn't drop it (Kera lost Dec 5 that way, Nov 26)
  function allDates(): string[] {
    const pending = /^\d{4}-\d{2}-\d{2}$/.test(newDate) ? [newDate] : [];
    return [...new Set([...dates, ...pending])].sort();
  }

  const handleSubmit = async (status: 'draft' | 'published') => {
    const validationError = validate();
    if (validationError) { setError(validationError); return; }

    setSaving(true);
    setError('');

    // Upload any newly chosen images: into the organizer's folder (their owner
    // can write there), or for an unclaimed market into markets/ (admins only)
    const organizerId = existingEvent ? existingEvent.organizerId : organizer?.id;
    const folder = organizerId ? `organizers/${organizerId}` : `markets/${existingEvent?.id ?? 'new'}`;
    let finalPosterUrl = posterUrl;
    let finalTileUrl = tileUrl;
    try {
      if (posterFile) {
        const ext = posterFile.name.split('.').pop() ?? 'jpg';
        finalPosterUrl = await uploadImage(posterFile, `${folder}/market_poster_${Date.now()}.${ext}`);
      }
      if (tileFile) {
        const ext = tileFile.name.split('.').pop() ?? 'jpg';
        finalTileUrl = await uploadImage(tileFile, `${folder}/market_tile_${Date.now()}.${ext}`);
      }
    } catch {
      setError('The image could not be uploaded. Please try again, or save without it.');
      setSaving(false);
      return;
    }

    const schedule: Market['schedule'] = {
      startTime,
      endTime,
      ...(type === 'dates'
        ? { dates: allDates() }
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
      ...(organizedBy.trim()
        ? { organizedBy: organizedBy.trim() }
        : existingEvent?.organizedBy ? { organizedBy: '' } : {}),
      ...(finalPosterUrl ? { posterUrl: finalPosterUrl } : existingEvent?.posterUrl ? { posterUrl: '' } : {}),
      ...(finalTileUrl ? { tileUrl: finalTileUrl } : existingEvent?.tileUrl ? { tileUrl: '' } : {}),
      // An organizer's own dates are confirmed; HQ keeps "from a vendor" marks it hasn't confirmed
      dateSources: isAdmin
        ? Object.fromEntries(Object.entries(dateSources).filter(([d]) => allDates().includes(d)))
        : {},
    } as Partial<Market>;

    try {
      // A new market belongs to this organizer (or is unclaimed, from HQ). An
      // edit only sends the organizer when an admin chose a different one, so
      // editing can't move a market by accident. Who can edit comes from the organizer.
      const saved = existingEvent
        ? await api.updateMarket(existingEvent.id, { ...payload, status, ...(moving ? { organizerId: moveTo || null } : {}) })
        : await api.createMarket({ ...payload, organizerId: organizer?.id ?? null });
      onSaved(saved);
    } catch (e: any) {
      setError(e.message ?? 'Failed to save the market');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5 text-sm">

      {/* Name */}
      <div>
        <label className={labelCls}>Market name *</label>
        <input
          className={inputCls}
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="e.g. Saturday Farmers Market"
          maxLength={200}
        />
      </div>

      {showOrganizedBy && (
        <div>
          <label htmlFor="market-organized-by" className={labelCls}>Organized by</label>
          <p id="market-organized-by-help" className="text-sm text-gray-500 mb-2">
            Optional. The group or business that runs it, if it has one. Shown on the market's page as "Run by".
          </p>
          <input
            id="market-organized-by"
            aria-describedby="market-organized-by-help"
            className={inputCls}
            value={organizedBy}
            onChange={e => setOrganizedBy(e.target.value)}
            placeholder="e.g. Comox Valley Arts Council"
            maxLength={200}
          />
        </div>
      )}

      {/* When it's on */}
      <div>
        <p className={labelCls} id="market-when">When is it on?</p>
        <div className="flex gap-2" role="group" aria-labelledby="market-when">
          {(['dates', 'recurring'] as const).map(t => (
            <button
              key={t}
              type="button"
              aria-pressed={type === t}
              onClick={() => setType(t)}
              className={`flex-1 py-2 min-h-[2.75rem] rounded-lg border text-sm font-medium transition-colors ${
                type === t
                  ? 'bg-brand-blue text-white border-brand-blue'
                  : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
              }`}
            >
              {t === 'dates' ? 'On these dates' : 'Repeats'}
            </button>
          ))}
        </div>
        <p className="mt-1 text-sm text-gray-500">
          {type === 'dates'
            ? 'One day, a weekend, or any set of days: add each date below.'
            : 'Every week, every other week or monthly, between a start and end date.'}
        </p>
        {typeSwitchReplacesDates && (
          <p className="mt-2 border border-amber-300 bg-amber-50 rounded-lg p-3 text-sm text-gray-800" role="alert">
            {type === 'dates'
              ? 'Saving this replaces every repeating date on the public calendar with the dates below. Your repeat details are kept, so switching back restores them.'
              : 'Saving this replaces the listed dates on the public calendar with the repeating dates below. The list is kept, so switching back restores it.'}
          </p>
        )}
      </div>

      {/* Schedule */}
      <fieldset className="border border-gray-200 rounded-lg p-3 space-y-3">
        <legend className="text-sm font-semibold text-gray-500 px-1 uppercase tracking-wide">Dates and times</legend>

        {type === 'dates' ? (
          <div>
            <label htmlFor="market-new-date" className={labelCls}>Dates{isAdmin ? '' : ' *'}</label>
            {dates.length > 0 && (
              <ul className="mb-2 grid sm:grid-cols-2 gap-1.5">
                {dates.map(d => (
                  <li key={d} className="flex flex-wrap items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5">
                    <span className="font-medium text-brand-text">
                      {new Date(d + 'T12:00:00').toLocaleDateString('en-CA', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                    {dateSources[d] === 'vendor' && (
                      <>
                        <span className="text-sm text-gray-600">from a vendor</span>
                        <button type="button" onClick={() => confirmDate(d)} className="min-h-[2.75rem] px-2 text-sm font-semibold text-brand-light-blue hover:underline">
                          Confirm
                        </button>
                      </>
                    )}
                    <button
                      type="button"
                      onClick={() => removeDate(d)}
                      aria-label={`Remove ${d}`}
                      className="ml-auto min-h-[2.75rem] px-2 text-sm text-gray-600 hover:text-red-700"
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <div className="flex gap-2">
              <input
                id="market-new-date"
                type="date"
                className={inputCls}
                value={newDate}
                onChange={e => setNewDate(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addDate(); } }}
              />
              <button
                type="button"
                onClick={addDate}
                disabled={!newDate}
                className="px-4 min-h-[2.75rem] rounded-lg border border-brand-blue text-brand-blue font-medium hover:bg-brand-blue/5 disabled:opacity-50"
              >
                Add date
              </button>
            </div>
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
                    className={`px-2.5 py-1 rounded-full text-sm font-semibold border transition-colors ${
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
            <label className={labelCls}>Start time{isAdmin ? '' : ' *'}</label>
            <input type="time" className={inputCls} value={startTime} onChange={e => setStartTime(e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>End time{isAdmin ? '' : ' *'}</label>
            <input type="time" className={inputCls} value={endTime} onChange={e => setEndTime(e.target.value)} />
          </div>
        </div>
      </fieldset>

      {/* Location */}
      <fieldset className="border border-gray-200 rounded-lg p-3 space-y-3">
        <legend className="text-sm font-semibold text-gray-500 px-1 uppercase tracking-wide">Location</legend>
        <div>
          <label className={labelCls}>Venue name{isAdmin ? '' : ' *'}</label>
          <input className={inputCls} value={venueName} onChange={e => setVenueName(e.target.value)} placeholder="e.g. Centennial Square" />
        </div>
        <div>
          <label className={labelCls}>Address{isAdmin ? '' : ' *'}</label>
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
        <label htmlFor="event-description" className={labelCls}>About this market</label>
        <p id="event-description-help" className="text-sm text-gray-500 mb-2">
          Optional. Shown on the market's page. If you leave it empty, the organizer's own description is shown instead.
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

      {/* Market Tags */}
      <div>
        <label className={labelCls}>Market Tags</label>
        <div className="flex flex-wrap gap-1.5">
          {Object.values(MarketTags).map(tag => (
            <button
              key={tag}
              type="button"
              onClick={() => toggleTag(tag)}
              className={`px-3 py-1 rounded-full text-sm font-medium border transition-colors ${
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
        <legend className="text-sm font-semibold text-gray-600 px-1">Market images</legend>
        <div className="bg-brand-cream rounded-lg p-3 text-sm text-gray-700 space-y-1">
          <p>Both images are optional, but we recommend adding both:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Vertical poster</strong>, like your print poster (8.5 × 11). It's shown on the market's page.</li>
            <li><strong>Horizontal share image</strong>. It's the picture people see when the market's link is shared on Facebook, in messages and elsewhere. The best fit is 1200 × 628 (Canva's "Facebook Ad" size). A Facebook event cover (1920 × 1080) works too, with a little trimmed off the top and bottom. Keep important words away from the edges.</li>
          </ul>
        </div>

        {([
          { key: 'poster', title: 'Vertical poster', url: posterUrl, setUrl: setPosterUrl, file: posterFile, setFile: setPosterFile, ratio: '8.5:11', max: 1600, format: 'webp', shape: 'w-24 aspect-[17/22]' },
          { key: 'tile',   title: 'Horizontal share image', url: tileUrl, setUrl: setTileUrl, file: tileFile, setFile: setTileFile, ratio: '1.9:1', max: 1200, format: 'jpeg', shape: 'w-40 aspect-[40/21]' },
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
                outputFormat={img.format}
              />
            )}
          </div>
        ))}
      </fieldset>

      {/* External URL */}
      <div>
        <label className={labelCls}>Market website or event link</label>
        <input
          className={inputCls}
          value={externalUrl}
          onChange={e => setExternalUrl(e.target.value)}
          placeholder="https://facebook.com/events/..."
          type="url"
        />
      </div>

      {canMove && (
        <div className="p-4 rounded-lg bg-brand-cream">
          <label htmlFor="event-market-page" className={labelCls}>Organizer (admin)</label>
          <select
            id="event-market-page"
            value={moveTo}
            onChange={e => setMoveTo(e.target.value)}
            className={inputCls + ' bg-white'}
          >
            <option value="">No organizer yet (unclaimed)</option>
            {[...allOrganizers!]
              .filter(o => o.status === 'active' || o.id === moveTo)
              .sort((a, b) => a.name.localeCompare(b.name))
              .map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
          </select>
          <p className="mt-2 text-sm text-gray-600">
            {moving
              ? 'Saving hands this market to that organizer: they can edit it from then on. Its web address stays the same.'
              : 'To hand this market to an organizer, or take it back to unclaimed, choose here.'}
          </p>
        </div>
      )}


      {existingEvent && type === 'recurring' && (
        <p className="text-gray-600 text-sm">Changes apply to every date it repeats on.</p>
      )}

      {/* Actions: pinned to the bottom of the window, so Save is always in reach
          on a long form (Kera, Nov 26). The error shows here so it's seen. */}
      <div className="sticky bottom-0 -mx-6 -mb-6 px-6 py-3 bg-white border-t border-gray-200 z-10 space-y-2">
      {error && <p className="text-red-600 text-sm" role="alert">{error}</p>}
      {confirmingUnpublish ? (
        <div className="border border-amber-300 bg-amber-50 rounded-lg p-4 space-y-3" role="alert">
          <p className="text-sm text-gray-800">
            Unpublishing takes this market and its dates off the public site. Your changes are
            saved, and it stays in your list as a draft. Publish it again any time to bring it back.
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
              className="flex-1 py-2 min-h-[2.75rem] bg-brand-blue text-white rounded-lg hover:bg-brand-blue/90 font-medium disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Yes, unpublish'}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-2 min-h-[2.75rem] border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 font-medium"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => (isLive ? setConfirmingUnpublish(true) : handleSubmit('draft'))}
            disabled={saving}
            className="flex-1 py-2 min-h-[2.75rem] border border-brand-blue text-brand-blue rounded-lg hover:bg-brand-blue/5 font-medium disabled:opacity-50"
          >
            {isLive ? 'Unpublish' : 'Save Draft'}
          </button>
          <button
            type="button"
            onClick={() => handleSubmit('published')}
            disabled={saving}
            className="flex-1 py-2 min-h-[2.75rem] bg-brand-blue text-white rounded-lg hover:bg-brand-blue/90 font-medium disabled:opacity-50"
          >
            {saving ? 'Saving…' : isLive ? 'Save Changes' : 'Publish'}
          </button>
        </div>
      )}
      </div>
    </div>
  );
};

export default MarketEventForm;
