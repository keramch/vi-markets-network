import React from 'react';
import { Link } from 'react-router-dom';
import type { User } from '../types';

// "Add your market!" (T137): a small, gently pulsing invitation to list a
// market. Where it leads depends on who's looking:
// - signed out: signup, with Organizer already chosen
// - an organizer (or admin with an organizer page): My Markets, or onClick
//   when the page can open the add-market form itself (the calendar)
// - a vendor: their profile, where they add the markets they'll be at
// - a shopper account: nothing (one profile per account, OD-11)

interface AddYourMarketButtonProps {
  currentUser: User | null;
  onDark?: boolean;            // white button on the teal banner
  onClick?: () => void;        // organizers: open the form here instead of going to My Markets
  className?: string;
}

const AddYourMarketButton: React.FC<AddYourMarketButtonProps> = ({ currentUser, onDark = false, onClick, className = '' }) => {
  const isOrganizer = !!currentUser?.ownedOrganizerId;
  const isVendor = !!currentUser?.ownedVendorId;
  if (currentUser && !isOrganizer && !isVendor) return null;

  const look = `vim-pulse inline-flex items-center justify-center gap-1.5 min-h-[2.75rem] px-5 rounded-full text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-4 ${
    onDark
      ? 'bg-white text-brand-gold hover:bg-brand-cream focus-visible:ring-white/70'
      : 'bg-brand-gold text-white hover:bg-brand-gold/90 focus-visible:ring-brand-gold/40'
  } ${className}`;
  const label = (
    <>
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
        <path d="M12 5v14M5 12h14" />
      </svg>
      Add your market!
    </>
  );

  if (isOrganizer && onClick) {
    return <button type="button" onClick={onClick} className={look}>{label}</button>;
  }
  const to = isOrganizer ? '/dashboard/my-markets' : isVendor ? '/dashboard/profile' : '/signup?as=organizer';
  return <Link to={to} className={look}>{label}</Link>;
};

export default AddYourMarketButton;
