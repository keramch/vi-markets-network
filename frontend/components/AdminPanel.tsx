
import React, { useState, useEffect } from 'react';
import type { Market, Vendor, Review, User, MemberStatus } from '../types';
import { CheckIcon, TrashIcon, AlertCircleIcon, UsersIcon, RibbonIcon, MapPinIcon, TagIcon, SearchIcon, XIcon } from './Icons';

interface AdminPanelProps {
  markets: Market[];
  vendors: Vendor[];
  users: User[];
  onModerateReview: (entityType: 'market' | 'vendor', entityId: string, reviewId: string, newStatus: 'approved' | 'declined') => void;
  onEditProfile: (profileId: string, profileType: 'market' | 'vendor') => void;
  onUpdateMemberStatus: (memberId: string, type: 'market' | 'vendor', status: MemberStatus) => void;
  onHardDeleteMember: (memberId: string, type: 'market' | 'vendor') => void;
  onToggleFoundingMember: (userId: string, isCurrentlyFounding: boolean) => void;
  onSendMessage: (to: string, subject: string, body: string) => Promise<void>;
  initialTab?: 'reviews' | 'memberships';
  onTabChange?: (tab: 'reviews' | 'memberships') => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({
  markets,
  vendors,
  users,
  onModerateReview,
  onEditProfile,
  onUpdateMemberStatus,
  onHardDeleteMember,
  onToggleFoundingMember,
  onSendMessage,
  initialTab = 'reviews',
  onTabChange,
}) => {
  const [activeMainTab, setActiveMainTab] = useState<'reviews' | 'memberships'>(initialTab);

  const switchTab = (tab: 'reviews' | 'memberships') => {
    setActiveMainTab(tab);
    onTabChange?.(tab);
  };
  const [activeReviewTab, setActiveReviewTab] = useState<'pending' | 'approved'>('pending');

  // Member search / pagination
  const [memberSearch, setMemberSearch] = useState('');
  const [memberPage, setMemberPage] = useState(1);
  const PAGE_SIZE = 50;

  // Dropdown
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  // Message modal
  const [messageTarget, setMessageTarget] = useState<{ email: string; name: string } | null>(null);
  const [msgSubject, setMsgSubject] = useState('');
  const [msgBody, setMsgBody] = useState('');
  const [msgSending, setMsgSending] = useState(false);
  const [msgError, setMsgError] = useState('');

  useEffect(() => { setMemberPage(1); }, [memberSearch]);

  // Close dropdown on outside click
  useEffect(() => {
    if (!openDropdownId) return;
    const handler = (e: MouseEvent) => {
      if (!(e.target as Element).closest('[data-dropdown]')) {
        setOpenDropdownId(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [openDropdownId]);

  const closeMessageModal = () => {
    setMessageTarget(null);
    setMsgSubject('');
    setMsgBody('');
    setMsgError('');
  };

  const handleSendMessage = async () => {
    if (!messageTarget || !msgSubject.trim() || !msgBody.trim()) {
      setMsgError('Subject and message are required.');
      return;
    }
    setMsgSending(true);
    setMsgError('');
    try {
      await onSendMessage(messageTarget.email, msgSubject.trim(), msgBody.trim());
      closeMessageModal();
    } catch {
      setMsgError('Failed to send message. Please try again.');
    } finally {
      setMsgSending(false);
    }
  };

  // ── Data ─────────────────────────────────────────────────────────────────

  const allReviews: { entityType: 'market' | 'vendor'; entity: Market | Vendor; review: Review }[] = [];
  markets.forEach(m => m.reviews.forEach(r => allReviews.push({ entityType: 'market', entity: m, review: r })));
  vendors.forEach(v => v.reviews.forEach(r => allReviews.push({ entityType: 'vendor', entity: v, review: r })));

  const filteredReviews = allReviews
    .filter(item => item.review.status === activeReviewTab)
    .sort((a, b) => new Date(b.review.date).getTime() - new Date(a.review.date).getTime());

  const allMembers: ({ type: 'market'; data: Market } | { type: 'vendor'; data: Vendor })[] = [
    ...markets.map(m => ({ type: 'market' as const, data: m })),
    ...vendors.map(v => ({ type: 'vendor' as const, data: v })),
  ].sort((a, b) => new Date(b.data.joinDate).getTime() - new Date(a.data.joinDate).getTime());

  const filteredMembers = memberSearch.trim() === ''
    ? allMembers
    : allMembers.filter(member => {
        const user = users.find(u => u.ownedMarketId === member.data.id || u.ownedVendorId === member.data.id);
        const q = memberSearch.toLowerCase();
        return (
          member.data.name.toLowerCase().includes(q) ||
          (user?.email ?? '').toLowerCase().includes(q) ||
          (`${user?.firstName ?? ''} ${user?.lastName ?? ''}`).toLowerCase().includes(q)
        );
      });

  const totalPages = Math.max(1, Math.ceil(filteredMembers.length / PAGE_SIZE));
  const pagedMembers = filteredMembers.slice((memberPage - 1) * PAGE_SIZE, memberPage * PAGE_SIZE);

  const tierPrices: { [key: string]: number } = {
    'standard': 60,
    'pro': 144,
    'superPro': 240,
  };
  const totalRevenue = users.reduce((acc, user) => acc + (tierPrices[user.subscription?.tier ?? ''] || 0), 0);

  const getStatusChipClass = (status: MemberStatus) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'suspended': return 'bg-yellow-100 text-yellow-800';
      case 'archived': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // ── Shared dropdown item styles ───────────────────────────────────────────

  const ddItem = 'flex w-full items-center gap-2 px-3 py-2 text-sm text-left rounded-md hover:bg-gray-50 transition-colors';
  const ddDanger = 'flex w-full items-center gap-2 px-3 py-2 text-sm text-left rounded-md text-red-600 hover:bg-red-50 transition-colors';

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-4xl font-serif text-brand-blue mb-8">Market HQ</h1>

      <div className="mb-6 border-b border-gray-300">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => switchTab('reviews')}
            className={`${
              activeMainTab === 'reviews'
                ? 'border-brand-blue text-brand-blue'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } flex items-center gap-2 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            <AlertCircleIcon className="w-5 h-5" /> Review Moderation
          </button>
          <button
            onClick={() => switchTab('memberships')}
            className={`${
              activeMainTab === 'memberships'
                ? 'border-brand-blue text-brand-blue'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } flex items-center gap-2 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            <UsersIcon className="w-5 h-5" /> Memberships
          </button>
        </nav>
      </div>

      {activeMainTab === 'reviews' && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="mb-6 border-b border-gray-300">
            <nav className="-mb-px flex space-x-8">
              {(['pending', 'approved'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveReviewTab(tab)}
                  className={`${
                    activeReviewTab === tab
                      ? 'border-brand-blue text-brand-blue'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm capitalize`}
                >
                  {tab === 'pending' ? 'Pending Reviews' : 'Approved Reviews'}
                </button>
              ))}
            </nav>
          </div>
          {filteredReviews.length > 0 ? (
            <div className="space-y-6">
              {filteredReviews.map(({ entityType, entity, review }) => (
                <div key={review.id} className="p-4 border rounded-md">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold">
                        {review.author} reviewed <span className="text-brand-blue">{entity.name}</span>
                      </p>
                      <p className="text-sm text-gray-500">Rating: {review.rating}/5 | Date: {review.date}</p>
                      <p className="mt-2 text-gray-700">{review.comment}</p>
                    </div>
                    <div className="flex space-x-2 flex-shrink-0 ml-4">
                      {review.status === 'pending' && (
                        <button
                          onClick={() => onModerateReview(entityType, entity.id, review.id, 'approved')}
                          className="bg-green-100 text-green-800 hover:bg-green-200 p-2 rounded-full"
                          title="Approve"
                        >
                          <CheckIcon className="w-5 h-5" />
                        </button>
                      )}
                      <button
                        onClick={() => onModerateReview(entityType, entity.id, review.id, 'declined')}
                        className="bg-red-100 text-red-800 hover:bg-red-200 p-2 rounded-full"
                        title={review.status === 'pending' ? 'Decline' : 'Remove'}
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <AlertCircleIcon className="w-12 h-12 mx-auto text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No {activeReviewTab} reviews</h3>
              <p className="mt-1 text-sm text-gray-500">There are currently no reviews with this status.</p>
            </div>
          )}
        </div>
      )}
      {activeMainTab === 'memberships' && (
        <div className="bg-white rounded-lg shadow-md">

          {/* Sticky header */}
          <div className="sticky top-0 z-10 bg-white rounded-t-lg border-b border-gray-200 px-6 pt-6 pb-3">

            {/* Stats chips */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-brand-cream p-4 rounded-lg text-center">
                <h3 className="text-sm font-medium text-brand-light-blue">Total Members</h3>
                <p className="text-3xl font-bold text-brand-blue">{filteredMembers.length}</p>
              </div>
              <div className="bg-brand-cream p-4 rounded-lg text-center">
                <h3 className="text-sm font-medium text-brand-light-blue">Total Annual Revenue</h3>
                <p className="text-3xl font-bold text-brand-blue">${totalRevenue.toLocaleString()}</p>
              </div>
            </div>

            {/* Search bar */}
            <div className="relative mb-3">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                type="text"
                value={memberSearch}
                onChange={e => setMemberSearch(e.target.value)}
                placeholder="Search by name, contact, or email…"
                className="w-full pl-9 pr-8 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-teal/30 focus:border-brand-teal"
              />
              {memberSearch && (
                <button
                  onClick={() => setMemberSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <XIcon className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Icon legend */}
            <div className="flex items-center gap-4 mb-3 text-xs text-gray-400">
              <span className="flex items-center gap-1.5"><MapPinIcon className="w-3.5 h-3.5 text-brand-teal" /> Market</span>
              <span className="flex items-center gap-1.5"><TagIcon className="w-3.5 h-3.5 text-brand-violet" /> Vendor</span>
              <span className="flex items-center gap-1.5"><RibbonIcon className="w-3.5 h-3.5 text-brand-gold" /> Founding Member</span>
            </div>

            {/* Column headers */}
            <div className="grid grid-cols-[1fr_80px_90px_60px] gap-4 px-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
              <span>Member</span>
              <span>Plan</span>
              <span>Status</span>
              <span className="text-right">Actions</span>
            </div>
          </div>

          {/* Rows */}
          <div className="divide-y divide-gray-100 px-6">
            {pagedMembers.map(member => {
              const user = users.find(u => u.ownedMarketId === member.data.id || u.ownedVendorId === member.data.id);
              const isOpen = openDropdownId === member.data.id;
              const TypeIcon = member.type === 'market' ? MapPinIcon : TagIcon;
              const typeColor = member.type === 'market' ? 'text-brand-teal' : 'text-brand-violet';
              const contactName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.displayName || null;

              return (
                <div key={member.data.id} className="grid grid-cols-[1fr_80px_90px_60px] gap-4 items-center py-2 px-2">

                  {/* Member cell */}
                  <div className="flex items-center gap-1.5 min-w-0">
                    <TypeIcon className={`w-3.5 h-3.5 flex-shrink-0 ${typeColor}`} />
                    <span className="text-sm font-medium text-gray-900 truncate">{member.data.name}</span>
                    {user?.subscription?.foundingMember && (
                      <RibbonIcon className="w-3.5 h-3.5 flex-shrink-0 text-brand-gold" />
                    )}
                    <span className="text-sm text-gray-400 truncate">
                      {contactName ? `· ${contactName} · ` : '· '}
                      {user?.email ?? '—'}
                    </span>
                  </div>

                  {/* Plan */}
                  <span className="text-sm text-gray-500 whitespace-nowrap">{user?.subscription?.tier ?? '—'}</span>

                  {/* Status */}
                  <span className={`px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full whitespace-nowrap ${getStatusChipClass(member.data.status)}`}>
                    {member.data.status}
                  </span>

                  {/* Actions */}
                  <div className="relative inline-block text-right" data-dropdown>
                    <button
                      type="button"
                      onClick={() => setOpenDropdownId(isOpen ? null : member.data.id)}
                      className="px-3 py-1.5 text-sm font-bold text-gray-500 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors leading-none tracking-widest"
                      title="More actions"
                    >
                      •••
                    </button>

                    {isOpen && (
                      <div className="absolute right-0 mt-1 w-52 bg-white rounded-xl shadow-lg border border-gray-100 z-20 py-1 divide-y divide-gray-100">
                        {/* Edit Profile */}
                        <div className="py-1 px-1">
                          <button
                            className={ddItem}
                            onClick={() => { onEditProfile(member.data.id, member.type); setOpenDropdownId(null); }}
                          >
                            ✏️ Edit Profile
                          </button>

                          <button
                            className={ddItem}
                            onClick={() => {
                              const email = user?.email ?? member.data.contact?.email ?? '';
                              setMessageTarget({ email, name: member.data.name });
                              setOpenDropdownId(null);
                            }}
                          >
                            ✉️ Message Member
                          </button>

                          <button
                            className={ddItem}
                            onClick={() => {
                              if (!user) return;
                              onToggleFoundingMember(user.id, !!user.subscription?.foundingMember);
                              setOpenDropdownId(null);
                            }}
                          >
                            ⭐ {user?.subscription?.foundingMember ? 'Remove Founding Member' : 'Make Founding Member'}
                          </button>
                        </div>

                        {/* Status actions */}
                        <div className="py-1 px-1">
                          {member.data.status === 'active' && (
                            <button
                              className={ddItem}
                              onClick={() => {
                                if (window.confirm(`Suspend ${member.data.name}? They will lose access until reactivated.`)) {
                                  onUpdateMemberStatus(member.data.id, member.type, 'suspended');
                                  setOpenDropdownId(null);
                                }
                              }}
                            >
                              ⏸️ Suspend Account
                            </button>
                          )}
                          {member.data.status === 'suspended' && (
                            <button
                              className={ddItem}
                              onClick={() => { onUpdateMemberStatus(member.data.id, member.type, 'active'); setOpenDropdownId(null); }}
                            >
                              ▶️ Reactivate Account
                            </button>
                          )}
                        </div>

                        {/* Destructive */}
                        <div className="py-1 px-1">
                          <button
                            className={ddDanger}
                            onClick={() => {
                              if (window.confirm(`Permanently delete ${member.data.name}? This will remove their profile, user account, and Firebase Auth login. This cannot be undone.`)) {
                                onHardDeleteMember(member.data.id, member.type);
                                setOpenDropdownId(null);
                              }
                            }}
                          >
                            🗑️ Delete Account
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 text-sm text-gray-500">
              <span>
                Showing {((memberPage - 1) * PAGE_SIZE) + 1}–{Math.min(memberPage * PAGE_SIZE, filteredMembers.length)} of {filteredMembers.length} members
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setMemberPage(p => p - 1)}
                  disabled={memberPage === 1}
                  className="px-3 py-1 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  ← Prev
                </button>
                <span className="text-gray-600">{memberPage} / {totalPages}</span>
                <button
                  onClick={() => setMemberPage(p => p + 1)}
                  disabled={memberPage === totalPages}
                  className="px-3 py-1 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Next →
                </button>
              </div>
            </div>
          )}

        </div>
      )}

      {/* Message modal */}
      {messageTarget && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4"
          onMouseDown={e => { if (e.target === e.currentTarget) closeMessageModal(); }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-brand-blue mb-4">Message Member</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
                <input
                  readOnly
                  value={`${messageTarget.name} <${messageTarget.email}>`}
                  className="w-full border border-gray-200 rounded-lg py-2 px-3 text-sm bg-gray-50 text-gray-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                <input
                  type="text"
                  value={msgSubject}
                  onChange={e => setMsgSubject(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue"
                  placeholder="Enter subject…"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                <textarea
                  rows={5}
                  value={msgBody}
                  onChange={e => setMsgBody(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg py-2 px-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue"
                  placeholder="Write your message…"
                />
              </div>
              {msgError && <p className="text-sm text-red-600">{msgError}</p>}
              <div className="flex justify-end gap-3 pt-1">
                <button
                  type="button"
                  onClick={closeMessageModal}
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSendMessage}
                  disabled={msgSending}
                  className="px-5 py-2 text-sm font-semibold bg-brand-blue text-white rounded-full hover:bg-brand-blue/90 disabled:opacity-40 transition-colors"
                >
                  {msgSending ? 'Sending…' : 'Send'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
