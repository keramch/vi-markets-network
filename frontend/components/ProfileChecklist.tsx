import React, { useState } from 'react';
import { Link } from 'react-router-dom';

// "Help shoppers find you": shown only to a profile's owner, on their own
// public profile (T119). Lists what's missing, most valuable first, and shows
// the top three. "Hide for now" is remembered in this browser only.

export interface ChecklistItem {
  key: string;
  done: boolean;
  title: string;
  short: string; // for the "Done:" line, e.g. "logo"
  why: string;
  action: string;
  to?: string; // where the action goes; the profile editor if not set
}

const hiddenKey = (profileId: string) => `vim-checklist-hidden-${profileId}`;

const ProfileChecklist: React.FC<{ profileId: string; items: ChecklistItem[] }> = ({ profileId, items }) => {
  const [hidden, setHidden] = useState(() => {
    try { return localStorage.getItem(hiddenKey(profileId)) === '1'; } catch { return false; }
  });
  const todo = items.filter(i => !i.done);
  const done = items.filter(i => i.done);
  if (hidden || todo.length === 0) return null;

  const hide = () => {
    setHidden(true);
    try { localStorage.setItem(hiddenKey(profileId), '1'); } catch { /* private window */ }
  };

  return (
    <section aria-labelledby="checklist-title" className="bg-white border-2 border-brand-light-blue rounded-xl p-6 md:p-7 mb-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 id="checklist-title" className="font-serif text-2xl text-brand-blue">Help shoppers find you</h2>
          <p className="text-sm text-gray-600 mt-1">Only you can see this. {done.length} of {items.length} done.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/dashboard/profile" className="bg-brand-blue text-white text-sm font-semibold px-5 py-3 rounded-full hover:bg-opacity-90">
            Edit profile
          </Link>
          <button type="button" onClick={hide} className="text-sm text-brand-blue underline px-3 py-3 hover:no-underline">
            Hide for now
          </button>
        </div>
      </div>

      <div
        role="progressbar"
        aria-label="Profile progress"
        aria-valuemin={0}
        aria-valuemax={items.length}
        aria-valuenow={done.length}
        className="mt-4 h-2 bg-brand-cream rounded-full overflow-hidden"
      >
        <div className="h-2 bg-brand-light-blue" style={{ width: `${(done.length / items.length) * 100}%` }} />
      </div>

      <ol className="mt-5 space-y-3">
        {todo.slice(0, 3).map(item => (
          <li key={item.key} className="flex flex-wrap sm:flex-nowrap items-center gap-4 p-4 bg-[#F6FAF6] rounded-lg">
            <span aria-hidden="true" className="w-7 h-7 rounded-full border-2 border-brand-light-blue flex-shrink-0" />
            <div className="flex-1 min-w-[12rem]">
              <p className="text-base font-semibold text-brand-text">{item.title}</p>
              <p className="text-sm text-gray-600 mt-0.5">{item.why}</p>
            </div>
            <Link to={item.to ?? '/dashboard/profile'} className="text-sm font-semibold text-brand-light-blue underline hover:no-underline">
              {item.action}
            </Link>
          </li>
        ))}
      </ol>

      {done.length > 0 && (
        <p className="mt-4 text-sm text-gray-600 flex items-start gap-2">
          <svg className="w-4 h-4 mt-0.5 flex-shrink-0 text-brand-light-blue" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6L9 17l-5-5" /></svg>
          <span>Done: {done.map(i => i.short).join(', ')}</span>
        </p>
      )}
    </section>
  );
};

export default ProfileChecklist;
