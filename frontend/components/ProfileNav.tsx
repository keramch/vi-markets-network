import React, { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { readBrowseList, requestScrollRestore, type BrowseKind } from '../utils';

// Previous / Next between profiles (T118). Follows the list the visitor came
// from (remembered by rememberBrowseList); without one, steps through all
// active profiles of this kind alphabetically. Left and right arrow keys work
// too, except while typing or while a pop-up (the photo viewer) is open.

interface Item { id: string; name: string; slug?: string; status?: string }

interface ProfileNavProps {
  kind: BrowseKind;
  currentId: string;
  items: Item[]; // all markets or all vendors
}

const Chevron: React.FC<{ dir: 'left' | 'right' }> = ({ dir }) => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={dir === 'left' ? 'M15 18l-6-6 6-6' : 'M9 18l6-6-6-6'} />
  </svg>
);

const ProfileNav: React.FC<ProfileNavProps> = ({ kind, currentId, items }) => {
  const navigate = useNavigate();
  const remembered = readBrowseList(kind, currentId);

  const sequence = useMemo(() => {
    const usable = items.filter(i => i.slug && (i.status ?? 'active') === 'active');
    if (remembered) {
      const byId = new Map(usable.map(i => [i.id, i]));
      return remembered.ids.map(id => byId.get(id)).filter((i): i is Item => !!i);
    }
    return [...usable].sort((a, b) => a.name.localeCompare(b.name, 'en', { sensitivity: 'base' }));
  }, [items, remembered?.ids.join(',')]); // eslint-disable-line react-hooks/exhaustive-deps

  const index = sequence.findIndex(i => i.id === currentId);
  const prev = index > 0 ? sequence[index - 1] : null;
  const next = index >= 0 && index < sequence.length - 1 ? sequence[index + 1] : null;
  const path = (i: Item) => `/${kind}/${i.slug}`;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName))) return;
      if (document.querySelector('[aria-modal="true"]')) return; // photo viewer open
      if (e.key === 'ArrowLeft' && prev) navigate(path(prev));
      if (e.key === 'ArrowRight' && next) navigate(path(next));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [prev?.id, next?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (index < 0 || sequence.length < 2) return null;

  const goBack = () => {
    if (!remembered) return;
    requestScrollRestore(remembered.returnTo, remembered.scrollY);
    navigate(remembered.returnTo);
  };

  const pill = 'flex items-center justify-center gap-1.5 min-h-[2.75rem] rounded-full text-sm font-semibold transition-colors';

  return (
    <nav aria-label="Browse profiles" className="container mx-auto px-4 sm:px-6 lg:px-8 pt-6 -mb-2 flex items-center justify-between gap-3">
      {remembered ? (
        <button type="button" onClick={goBack} className="flex items-center gap-1.5 min-h-[2.75rem] text-sm sm:text-base font-medium text-brand-light-blue hover:underline text-left">
          <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M19 12H5" /><path d="M12 19l-7-7 7-7" /></svg>
          <span className="sm:hidden">Back</span>
          <span className="hidden sm:inline">{remembered.backLabel}</span>
        </button>
      ) : <span />}

      <div className="flex items-center gap-2 sm:gap-3">
        {prev ? (
          <button
            type="button"
            onClick={() => navigate(path(prev))}
            aria-label={`Previous: ${prev.name}`}
            className={`${pill} w-11 sm:w-auto sm:px-4 bg-white border border-[#CFE1D9] text-brand-light-blue hover:bg-brand-cream`}
          >
            <Chevron dir="left" />
            <span className="hidden sm:inline">Previous</span>
          </button>
        ) : <span className="w-11 sm:w-[7.5rem]" aria-hidden="true" />}

        <span className="text-sm text-gray-600 min-w-[4rem] text-center" aria-live="polite">
          {index + 1} of {sequence.length}
        </span>

        {next ? (
          <button
            type="button"
            onClick={() => navigate(path(next))}
            aria-label={`Next: ${next.name}`}
            className={`${pill} w-11 sm:w-auto sm:px-4 bg-brand-light-blue text-white hover:bg-opacity-90 sm:max-w-[18rem]`}
          >
            <span className="hidden sm:inline truncate">Next: {next.name}</span>
            <Chevron dir="right" />
          </button>
        ) : <span className="w-11 sm:w-[7.5rem]" aria-hidden="true" />}
      </div>
    </nav>
  );
};

export default ProfileNav;
