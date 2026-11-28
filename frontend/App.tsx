

import React, { useState, useMemo, useEffect } from 'react';
import { useSpamGuard, type SpamGuardFields } from './components/SpamGuard';
import type { View, Organizer, Vendor, User, Review, NotificationSettings, Application, MemberStatus, SubscriptionTier, Market } from './types';
import { Routes, Route, Navigate, useNavigate, useParams, useLocation } from 'react-router-dom';
import * as api from './services/api.live';
import { onAuthStateChanged, signOut, sendPasswordResetEmail, verifyPasswordResetCode, confirmPasswordReset, applyActionCode, checkActionCode } from 'firebase/auth';
import { firebaseAuth } from './services/firebase';
import { signInWithGoogle, isInAppBrowser } from './services/googleAuth';
import { PASSWORD_POLICY_MESSAGE, nextOccurrence, marketPath, rememberBrowseList } from './utils';
import ProfileNav from './components/ProfileNav';

import Header from './components/Header';
import { CheckCircleIcon } from './components/Icons';
import HomePage from './components/HomePage';
import OrganizerProfile from './components/OrganizerProfile';
import VendorProfile from './components/VendorProfile';
import Modal from './components/Modal';
import ImageUploader from './components/ImageUploader';
import ProfileManager from './components/ProfileManager';
import Dashboard from './components/Dashboard';
import StripePaymentForm from './components/StripePaymentForm';
import PaymentSuccessModal from './components/PaymentSuccessModal';
import CalendarView from './components/CalendarView';
import MarketPage from './components/MarketPage';
import NotificationToast from './components/NotificationToast';
import AdminPanel from './components/AdminPanel';
import Promotions from './components/Promotions';
import NotificationSettingsComponent from './components/NotificationSettings';
import MyApplications from './components/MyApplications';
import ApplicationForm from './components/ApplicationForm';
import CookieConsentBanner from './components/CookieConsentBanner';
import ForgotPasswordForm from './components/ForgotPasswordForm';
import ResetPasswordForm from './components/ResetPasswordForm';
import PasswordInput from './components/PasswordInput';
import SignupPage from './components/SignupPage';
import OrganizerHub from './components/OrganizerHub';
import BrowsePage from './components/BrowsePage';
import PricingPage from './components/PricingPage';
import AboutPage from './components/AboutPage';
import PrivacyPage from './components/PrivacyPage';
import TermsOfUsePage from './components/TermsOfUsePage';
import MemberAgreementPage from './components/MemberAgreementPage';
import VerifiedPage from './components/VerifiedPage';


// Maps a View discriminant to its URL path (used to adapt Header's onNavigate prop)
const viewToPath = (view: View): string => {
  switch (view.type) {
    case 'home':               return '/';
    case 'browseMarkets':      return '/markets';
    case 'browseVendors':      return '/vendors';
    case 'calendar':           return '/calendar';
    case 'about':              return '/about';
    case 'privacy':            return '/privacy';
    case 'terms':              return '/terms';
    case 'memberAgreement':    return '/member-agreement';
    case 'pricing':            return '/pricing';
    case 'signup':             return '/signup';
    case 'dashboard':          return '/dashboard';
    case 'organizerHub':       return '/dashboard/my-markets';
    case 'manageProfile':      return '/dashboard/profile';
    case 'notificationSettings': return '/dashboard/notifications';
    case 'myApplications':     return '/dashboard/applications';
    case 'promotions':         return '/dashboard/promotions';
    case 'adminPanel':         return '/hq';
    case 'adminEditProfile':   return `/hq/edit/${view.profileType}/${view.profileId}`;
    case 'marketProfile':      return `/organizers/${view.id}`;
    case 'vendorProfile':      return `/vendors/${view.id}`;
    default:                   return '/';
  }
};

// ── Route wrapper components (defined at module scope to keep stable references) ──

interface OrganizerProfileRouteProps {
  organizers: Organizer[];
  markets: Market[];
  vendors: Vendor[];
  applications: Application[];
  users: User[];
  followedOrganizerIds: string[];
  currentUser: User | null;
  onToggleFollow: (id: string) => void;
  onAddReview: (entityType: 'market' | 'vendor' | 'organizer', entityId: string, data: { rating: number; comment: string }) => Promise<void>;
  onFeatureMarket: (marketId: string) => void;
  onContactSubmit: (params: { recipientEmail: string; recipientName: string; senderName: string; senderEmail: string; subject: string; message: string } & SpamGuardFields) => Promise<void>;
  onApply: (marketId: string) => void;
  onOpenLoginModal: () => void;
  isDataLoading: boolean;
}
// /organizers/:slug — an organizer's profile, with every market they run (T128)
const OrganizerProfileRoute: React.FC<OrganizerProfileRouteProps> = ({
  organizers, markets, vendors, applications, users, followedOrganizerIds, currentUser,
  onToggleFollow, onAddReview, onFeatureMarket, onContactSubmit, onApply, onOpenLoginModal,
  isDataLoading,
}) => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const organizer = organizers.find(m => m.slug === slug);

  // Its markets with a real date coming up (a running series counts), soonest first (T001, T096)
  const upcomingMarkets = useMemo(() => {
    if (!organizer) return [];
    return markets
      .filter(m => m.organizerId === organizer.id && m.status === 'published')
      .map(m => ({ m, next: nextOccurrence(m) }))
      .filter(x => x.next !== null)
      .sort((a, b) => a.next!.date.localeCompare(b.next!.date))
      .map(x => x.m);
  }, [organizer?.id, markets]);

  if (isDataLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-cream">
        <div className="text-brand-blue text-sm">Loading...</div>
      </div>
    );
  }

  if (!organizer || organizer.status !== 'active') return <Navigate to="/" replace />;
  const organizerOwner = users.find(u => u.id === organizer.ownerId);
  return (
    <>
    <ProfileNav kind="organizers" currentId={organizer.id} items={organizers} />
    <OrganizerProfile
      organizer={organizer}
      vendors={vendors}
      applications={applications}
      owner={organizerOwner}
      onSelectVendor={(id) => {
        const v = vendors.find(v => v.id === id);
        if (v?.slug) navigate(`/vendors/${v.slug}`);
      }}
      onBack={() => navigate('/')}
      isFavorited={followedOrganizerIds.includes(organizer.id)}
      onToggleFavorite={onToggleFollow}
      currentUser={currentUser}
      onAddReview={(data) => onAddReview('organizer', organizer.id, data)}
      onFeatureMarket={onFeatureMarket}
      onContactSubmit={onContactSubmit}
      onApply={onApply}
      upcomingEvents={upcomingMarkets}
      onOpenLoginModal={onOpenLoginModal}
    />
    </>
  );
};

interface MarketPageRouteProps {
  markets: Market[];
  organizers: Organizer[];
  vendors: Vendor[];
  savedMarketIds: string[];
  currentUser: User | null;
  onToggleSave: (id: string) => void;
  onOpenLoginModal: () => void;
  isDataLoading: boolean;
}
// /markets/:slug — a market's page (T128). Links from before stage 1 still
// work: an old organizer link (/markets/<organizer>) forwards to
// /organizers/<organizer>, and a renamed market's old slug to its new one.
const MarketPageRoute: React.FC<MarketPageRouteProps> = ({
  markets, organizers, vendors, savedMarketIds, currentUser, onToggleSave, onOpenLoginModal, isDataLoading,
}) => {
  const { slug = '' } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  if (isDataLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-cream">
        <div className="text-brand-blue text-sm">Loading...</div>
      </div>
    );
  }

  const visible = markets.filter(m => m.status === 'published' || currentUser?.isAdmin);
  const market = visible.find(m => m.slug === slug) ?? visible.find(m => m.id === slug);
  if (!market) {
    const moved = visible.find(m => m.legacyPaths?.includes(slug));
    if (moved) return <Navigate to={`${marketPath(moved)}${location.search}`} replace />;
    const organizer = organizers.find(o => o.slug === slug);
    if (organizer) return <Navigate to={`/organizers/${organizer.slug}`} replace />;
    return <Navigate to="/" replace />;
  }
  if (market.slug && market.slug !== slug) return <Navigate to={`${marketPath(market)}${location.search}`} replace />;

  const organizer = market.organizerId ? organizers.find(o => o.id === market.organizerId) : undefined;
  // Vendors who say they'll be there, with their upcoming dates here
  const today = new Date().toLocaleDateString('en-CA');
  const vendorsAttending = vendors
    .filter(v => v.status === 'active')
    .map(v => ({
      vendor: v,
      dates: [...new Set((v.attendingMarkets ?? []).filter(a => a.marketId === market.id).map(a => a.date))]
        .filter(d => d && d >= today)
        .sort(),
      listed: (v.attendingMarkets ?? []).some(a => a.marketId === market.id),
    }))
    .filter(x => x.listed)
    .sort((a, b) => (a.dates[0] ?? '9999').localeCompare(b.dates[0] ?? '9999') || a.vendor.name.localeCompare(b.vendor.name))
    .map(({ vendor, dates }) => ({ vendor, dates }));

  const dateParam = new URLSearchParams(location.search).get('date') ?? undefined;
  return (
    <>
    <ProfileNav kind="markets" currentId={market.id} items={visible} />
    <MarketPage
      market={market}
      organizer={organizer}
      vendorsAttending={vendorsAttending}
      selectedDate={dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam) ? dateParam : undefined}
      currentUser={currentUser}
      isSaved={savedMarketIds.includes(market.id)}
      onToggleSave={onToggleSave}
      onOpenLoginModal={onOpenLoginModal}
      onBack={() => (window.history.length > 1 ? navigate(-1) : navigate('/markets'))}
    />
    </>
  );
};

// /markets/:organizer/:event — event links from before stage 1 (T128). Forwards
// to the market's own page, keeping ?date= so a shared date still opens.
const LegacyMarketLinkRoute: React.FC<{ markets: Market[]; organizers: Organizer[]; isDataLoading: boolean }> = ({
  markets, organizers, isDataLoading,
}) => {
  const { slug = '', eventSlug = '' } = useParams<{ slug: string; eventSlug: string }>();
  const location = useLocation();
  if (isDataLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-cream">
        <div className="text-brand-blue text-sm">Loading...</div>
      </div>
    );
  }
  const organizer = organizers.find(o => o.slug === slug);
  const market = markets.find(m => m.legacyPaths?.includes(`${slug}/${eventSlug}`))
    ?? markets.find(m => m.id === eventSlug)
    ?? (organizer ? markets.find(m => m.organizerId === organizer.id && m.slug === eventSlug) : undefined);
  if (market) return <Navigate to={`${marketPath(market)}${location.search}`} replace />;
  if (organizer) return <Navigate to={`/organizers/${organizer.slug}`} replace />;
  return <Navigate to="/" replace />;
};

interface VendorProfileRouteProps {
  vendors: Vendor[];
  markets: Market[];
  users: User[];
  favoritedVendorIds: string[];
  currentUser: User | null;
  onToggleFavorite: (id: string) => void;
  onAddReview: (entityType: 'market' | 'vendor' | 'organizer', entityId: string, data: { rating: number; comment: string }) => Promise<void>;
  onFeatureVendor: (vendorId: string) => void;
  onContactSubmit: (params: { recipientEmail: string; recipientName: string; senderName: string; senderEmail: string; subject: string; message: string } & SpamGuardFields) => Promise<void>;
  onOpenLoginModal: () => void;
  isDataLoading: boolean;
}
const VendorProfileRoute: React.FC<VendorProfileRouteProps> = ({
  vendors, markets, users, favoritedVendorIds, currentUser,
  onToggleFavorite, onAddReview, onFeatureVendor, onContactSubmit, onOpenLoginModal,
  isDataLoading,
}) => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const vendor = vendors.find(v => v.slug === slug);

  if (isDataLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-cream">
        <div className="text-brand-blue text-sm">Loading...</div>
      </div>
    );
  }

  if (!vendor || vendor.status !== 'active') return <Navigate to="/" replace />;
  const vendorOwner = users.find(u => u.id === vendor.ownerId);
  // Markets this vendor attends, in their order, for Previous / Next (T118)
  const attendedMarketIds = [...new Set((vendor.attendingMarkets || []).map(a => a.marketId))]
    .filter(id => markets.some(m => m.id === id && m.status === 'published'));
  return (
    <>
    <ProfileNav kind="vendors" currentId={vendor.id} items={vendors} />
    <VendorProfile
      vendor={vendor}
      markets={markets}
      owner={vendorOwner}
      onSelectMarket={(id, date) => {
        const m = markets.find(m => m.id === id);
        if (!m) return;
        rememberBrowseList('markets', attendedMarketIds, `Back to ${vendor.name}`);
        navigate(marketPath(m, date));
      }}
      onBack={() => navigate('/')}
      isFavorited={favoritedVendorIds.includes(vendor.id)}
      onToggleFavorite={onToggleFavorite}
      currentUser={currentUser}
      onAddReview={(data) => onAddReview('vendor', vendor.id, data)}
      onFeatureVendor={onFeatureVendor}
      onContactSubmit={onContactSubmit}
      onOpenLoginModal={onOpenLoginModal}
    />
    </>
  );
};

interface AdminEditProfileRouteProps {
  organizers: Organizer[];
  markets: Market[];
  vendors: Vendor[];
  users: User[];
  currentUser: User | null;
  onSaveChanges: (data: Organizer | Vendor, returnTo?: string) => Promise<void>;
}
// HQ › an organizer's markets: the My Markets screen for any organizer, so an
// admin can add and edit their dates
const AdminOrganizerMarketsRoute: React.FC<{ organizers: Organizer[]; currentUser: User | null }> = ({ organizers, currentUser }) => {
  const { organizerId } = useParams<{ organizerId: string }>();
  const navigate = useNavigate();
  if (!currentUser?.isAdmin) return <Navigate to="/" replace />;
  const organizer = organizers.find(m => m.id === organizerId);
  if (!organizer) return <Navigate to="/hq" replace />;
  return (
    <OrganizerHub
      currentUser={currentUser}
      organizer={organizer}
      allOrganizers={organizers}
      adminView
      onNavigateToProfile={() => navigate(`/hq/edit/organizer/${organizer.id}`)}
      onBack={() => navigate('/hq')}
    />
  );
};

const AdminEditProfileRoute: React.FC<AdminEditProfileRouteProps> = ({
  organizers, markets, vendors, users, currentUser, onSaveChanges,
}) => {
  const { profileType, profileId } = useParams<{ profileType: string; profileId: string }>();
  const navigate = useNavigate();
  // Opened from a profile's Edit profile link: go back to that profile, not HQ
  const requested = (useLocation().state as { returnTo?: string } | null)?.returnTo;
  const returnTo = typeof requested === 'string' && /^\/(organizers|vendors)\/[\w-]+$/.test(requested) ? requested : undefined;
  if (!currentUser?.isAdmin) return <Navigate to="/" replace />;
  const profileToEdit = profileType === 'organizer' || profileType === 'market'
    ? organizers.find(m => m.id === profileId)
    : vendors.find(v => v.id === profileId);
  if (!profileToEdit) return <Navigate to="/hq" replace />;
  return (
    <ProfileManager
      profileData={profileToEdit}
      user={users.find(u => u.ownedOrganizerId === profileToEdit.id || u.ownedVendorId === profileToEdit.id) || null}
      allMarkets={markets}
      onSaveChanges={(data) => onSaveChanges(data, returnTo)}
      onBack={() => navigate(returnTo ?? '/hq')}
      isAdmin={true}
      listingReviews={[]}
      onRequestReviewRemoval={async () => {}}
      onToggleAutoRenew={() => {}}
    />
  );
};

// Local type kept for the membership modal UI (not tied to User data model)
type MembershipPlan = string;

interface Promotion {
    title: string;
    price: number;
    description: string;
    onConfirm: () => void;
}

const isOrganizer = (profile: Organizer | Vendor): profile is Organizer => {
    return 'location' in profile;
};

const App: React.FC = () => {
  const [organizers, setOrganizers] = useState<Organizer[]>([]);
  // Organizers with a public page: what lists, search and links use (T140)
  const publicOrganizers = useMemo(() => organizers.filter(o => !o.pageHidden), [organizers]);
  // Markets: the events people go to (OD-16). Published ones for everyone; an
  // admin also gets drafts and unclaimed ones (reloaded when an admin logs in).
  const [markets, setMarkets] = useState<Market[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);

  const navigate = useNavigate();
  const location = useLocation();

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isForgotPasswordOpen, setForgotPasswordOpen] = useState(false);
  const [isLoginModalOpen, setLoginModalOpen] = useState(false);
  const [isResetPasswordOpen, setResetPasswordOpen] = useState(false);
  const [resetPasswordEmail, setResetPasswordEmail] = useState<string | null>(null);
  const [resetOobCode, setResetOobCode] = useState<string | null>(null);

  const [isVendorSignUpModalOpen, setVendorSignUpModalOpen] = useState(false);
  const [isMembershipModalOpen, setMembershipModalOpen] = useState(false);
  const [showPaymentSuccess, setShowPaymentSuccess] = useState(false);

  const [isFeatureMarketModalOpen, setFeatureMarketModalOpen] = useState(false);
  const [organizerToFeature, setOrganizerToFeature] = useState<Organizer | null>(null);

  const [isFeatureVendorModalOpen, setFeatureVendorModalOpen] = useState(false);
  const [vendorToFeature, setVendorToFeature] = useState<Vendor | null>(null);

  const [isPromotionModalOpen, setPromotionModalOpen] = useState(false);
  const [selectedPromotion, setSelectedPromotion] = useState<Promotion | null>(null);

  const [favoritedMarketIds, setFavoritedMarketIds] = useState<string[]>([]);
  const [favoritedVendorIds, setFavoritedVendorIds] = useState<string[]>([]);
  const [followedOrganizerIds, setFollowedOrganizerIds] = useState<string[]>([]);
  
  const [notification, setNotification] = useState<string | null>(null);

  const [isApplicationFormOpen, setApplicationFormOpen] = useState(false);
  const [organizerToApplyTo, setOrganizerToApplyTo] = useState<Organizer | null>(null);

  const [isAuthReady, setIsAuthReady] = useState(false);
  const [showCookieBanner, setShowCookieBanner] = useState(false);
  const [showVerifiedToast, setShowVerifiedToast] = useState(false);
  const [adminActiveTab, setAdminActiveTab] = useState<'reviews' | 'memberships' | 'unclaimed'>('reviews');

  const [footerFirstName, setFooterFirstName] = useState('');
  const [footerEmail, setFooterEmail] = useState('');
  const [footerCity, setFooterCity] = useState('');
  const footerSpamGuard = useSpamGuard();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    // Handle Firebase Auth email verification link: confirm the code with
    // Firebase (this is what actually marks the email verified), then show /verified
    const oobCode = params.get('oobCode');
    if (params.get('mode') === 'verifyEmail' && oobCode) {
      let verifiedEmail: string | undefined;
      // Read which email the link is for before the one-time code is used up
      checkActionCode(firebaseAuth, oobCode)
        .then((info) => { verifiedEmail = info.data.email ?? undefined; })
        .catch(() => {})
        .then(() => applyActionCode(firebaseAuth, oobCode))
        .then(() => firebaseAuth.currentUser?.reload())
        .then(() => {
          // Verification = newsletter double opt-in: the backend adds them to the
          // Brevo list if eligible (works even if not logged in on this device)
          const email = verifiedEmail ?? firebaseAuth.currentUser?.email ?? undefined;
          if (email) api.notifyEmailVerified(email).catch(() => {});
          navigate('/verified', { replace: true });
        })
        .catch(() => {
          showNotification('This verification link has expired or was already used.');
          navigate('/', { replace: true });
        });
    } else if (params.get('verified') === 'true') {
      navigate('/verified');
    } else if (params.get('subscribed') === 'true') {
      // Arrived from the newsletter double opt-in confirmation link
      showNotification("You're subscribed! Thanks for joining the VI Markets newsletter.");
      navigate('/', { replace: true });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle Firebase Auth password reset redirect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('mode') !== 'resetPassword') return;

    const oobCode = params.get('oobCode');
    if (!oobCode) return;

    verifyPasswordResetCode(firebaseAuth, oobCode)
      .then((email) => {
        setResetPasswordEmail(email);
        setResetOobCode(oobCode);
        setResetPasswordOpen(true);
      })
      .catch(() => {
        showNotification('This password reset link has expired or is invalid. Please request a new one.');
      })
      .finally(() => {
        window.history.replaceState(null, '', window.location.pathname);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paymentStatus = params.get('payment');
    if (paymentStatus === 'success') {
      setShowPaymentSuccess(true);
      showNotification('Payment successful! Your Pro membership is active.');
      navigate('/dashboard', { replace: true });
    } else if (paymentStatus === 'cancelled') {
      showNotification('Payment cancelled.');
      navigate('/dashboard', { replace: true });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const consent = localStorage.getItem('cookie_consent');
    if (!consent) setShowCookieBanner(true);

    // Wave 1: public data — homepage needs this
    const fetchPublicData = async () => {
      try {
        const [organizersData, marketsData, vendorsData] = await Promise.all([
          api.getOrganizers(),
          api.getMarkets({ status: 'published' }),
          api.getVendors(),
        ]);
        setOrganizers(organizersData);
        setMarkets(marketsData);
        setVendors(vendorsData);
      } catch (error) {
        console.error("Failed to fetch organizers/markets/vendors:", error);
        showNotification("Error: Could not load listings.");
      } finally {
        setIsDataLoading(false);
      }
    };

    fetchPublicData();
  }, []);

  // Applications are private — the backend returns only the ones this member
  // is involved in (none when signed out), so reload whenever the user changes
  useEffect(() => {
    if (!currentUser) {
      setApplications([]);
      return;
    }
    api.getApplications()
      .then(setApplications)
      .catch((error) => console.error("Failed to fetch applications:", error));
  }, [currentUser?.id]);

  // Admins see every market (drafts and unclaimed ones too) and every organizer,
  // hidden ones included; everyone else keeps the published lists
  useEffect(() => {
    if (!currentUser?.isAdmin) return;
    Promise.all([api.getMarkets(), api.getOrganizers()])
      .then(([allMarkets, allOrganizers]) => { setMarkets(allMarkets); setOrganizers(allOrganizers); })
      .catch((error) => console.error("Failed to fetch admin lists:", error));
  }, [currentUser?.isAdmin]);

  // Full member list is admin-only (backend enforces this too)
  useEffect(() => {
    if (!currentUser?.isAdmin) {
      setUsers([]);
      return;
    }
    api.getUsers()
      .then(setUsers)
      .catch((error) => console.error("Failed to fetch users:", error));
  }, [currentUser?.isAdmin]);

  // All reviews (pending/approved/declined) for Admin HQ moderation
  const [adminReviews, setAdminReviews] = useState<Review[]>([]);
  useEffect(() => {
    if (!currentUser?.isAdmin) {
      setAdminReviews([]);
      return;
    }
    api.getAllReviews()
      .then(setAdminReviews)
      .catch((error) => console.error("Failed to fetch reviews:", error));
  }, [currentUser?.isAdmin]);

  // Reviews about the member's own listing, for the profile editor's reviews tab
  const [ownListingReviews, setOwnListingReviews] = useState<Review[]>([]);
  useEffect(() => {
    if (!currentUser?.ownedOrganizerId && !currentUser?.ownedVendorId) {
      setOwnListingReviews([]);
      return;
    }
    api.getMyListingReviews()
      .then(setOwnListingReviews)
      .catch((error) => console.error("Failed to fetch own listing reviews:", error));
  }, [currentUser?.id, currentUser?.ownedOrganizerId, currentUser?.ownedVendorId]);

  const handleCookieConsent = () => {
    localStorage.setItem('cookie_consent', 'true');
    setShowCookieBanner(false);
  };

  // Restore session on page reload via Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, async (firebaseUser) => {
      if (firebaseUser?.email && !currentUser) {
        try {
          const user = await api.fetchMe(firebaseUser.email);
          setCurrentUser(user);
          try {
            const follows = await api.fetchFollows(user.id);
            setFavoritedMarketIds(follows.marketIds);
            setFavoritedVendorIds(follows.vendorIds);
            setFollowedOrganizerIds(follows.organizerIds);
          } catch {
            // follows failed — non-fatal, continue with empty state
          }
        } catch {
          // user doc not found — stay logged out
        }
      }
      setIsAuthReady(true);
    });
    return unsubscribe;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  const showNotification = (message: string) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 5000);
  };

  const ownedOrganizer = useMemo(() => 
    currentUser ? organizers.find(m => m.id === currentUser.ownedOrganizerId) : undefined
  , [currentUser, organizers]);

  const ownedVendor = useMemo(() =>
    currentUser ? vendors.find(v => v.id === currentUser.ownedVendorId) : undefined
  , [currentUser, vendors]);


  const handleLogin = async (credentials: { email: string, password: string }) => {
      try {
        const user = await api.login(credentials.email, credentials.password);
        setCurrentUser(user);
        setLoginModalOpen(false);
        showNotification(`Welcome, ${user.email}!`);
        try {
          const follows = await api.fetchFollows(user.id);
          setFavoritedMarketIds(follows.marketIds);
          setFavoritedVendorIds(follows.vendorIds);
          setFollowedOrganizerIds(follows.organizerIds);
        } catch {
          // follows failed — non-fatal
        }
      } catch (error) {
          showNotification(friendlyLoginError(error));
      }
  };

  // "Continue with Google" in the login window
  const handleGoogleLogin = async () => {
      try {
          const firebaseUser = await signInWithGoogle();
          if (!firebaseUser?.email) return; // closed the popup
          try {
              const user = await api.fetchMe(firebaseUser.email);
              setCurrentUser(user);
              setLoginModalOpen(false);
              showNotification(`Welcome, ${user.firstName || user.email}!`);
              try {
                  const follows = await api.fetchFollows(user.id);
                  setFavoritedMarketIds(follows.marketIds);
                  setFavoritedVendorIds(follows.vendorIds);
                  setFollowedOrganizerIds(follows.organizerIds);
              } catch {
                  // follows failed — non-fatal
              }
          } catch (error) {
              if (error instanceof api.ApiError && error.status === 404) {
                  // Signed in with Google but never finished signing up
                  setLoginModalOpen(false);
                  navigate('/signup');
                  showNotification("Let's finish setting up your account.");
                  return;
              }
              throw error;
          }
      } catch (error) {
          showNotification(error instanceof Error ? error.message : 'Login failed. Please try again.');
      }
  };

  // Turn Firebase Auth error codes into plain-language messages
  const friendlyLoginError = (error: unknown): string => {
      const code = (error as { code?: string })?.code ?? '';
      switch (code) {
        case 'auth/invalid-credential':
        case 'auth/wrong-password':
        case 'auth/user-not-found':
          return "That email and password don't match. Check for typos, or use \"Forgot password?\" to reset it.";
        case 'auth/invalid-email':
          return "That doesn't look like a valid email address.";
        case 'auth/too-many-requests':
          return 'Too many attempts. Please wait a few minutes, or use "Forgot password?" to reset your password.';
        case 'auth/user-disabled':
          return 'This account has been disabled. Please contact hello@vimarkets.ca.';
        case 'auth/network-request-failed':
          return 'Connection problem. Check your internet connection and try again.';
        case 'auth/password-does-not-meet-requirements':
          return 'Our password requirements have changed. Please use "Forgot password?" to set a new password.';
        default:
          if (error instanceof api.ApiError && error.status === 404) {
            return "We couldn't find a profile for this login. Please contact hello@vimarkets.ca.";
          }
          return 'Login failed. Please try again.';
      }
  };
  
  const handleLogout = () => {
      signOut(firebaseAuth).catch(() => {});
      setCurrentUser(null);
      setFavoritedMarketIds([]);
      setFavoritedVendorIds([]);
      setFollowedOrganizerIds([]);
      // Back to the public lists (an admin had drafts and hidden ones)
      Promise.all([api.getMarkets({ status: 'published' }), api.getOrganizers()])
        .then(([m, o]) => { setMarkets(m); setOrganizers(o); })
        .catch(() => {});
      navigate('/');
  };

  const handleUpgradeMembership = async (plan: MembershipPlan) => {
    if (!currentUser) return;
    try {
        const updatedUser = await api.updateUser(currentUser.id, { subscription: { ...currentUser.subscription, tier: plan as SubscriptionTier } });
        setCurrentUser(updatedUser);
        setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
        setMembershipModalOpen(false);
        setSelectedPlanForPayment(null);
        showNotification(`Successfully upgraded to ${plan.replace(/-/g, ' ')} plan!`);
    } catch (error) {
        showNotification("Failed to upgrade membership.");
    }
  };

  const handleOpenFeatureMarketModal = (marketId: string) => {
    const market = organizers.find(m => m.id === marketId);
    if (market) {
      setOrganizerToFeature(market);
      setFeatureMarketModalOpen(true);
    }
  };
  
  const handleOpenFeatureVendorModal = (vendorId: string) => {
    const vendor = vendors.find(v => v.id === vendorId);
    if (vendor) {
      setVendorToFeature(vendor);
      setFeatureVendorModalOpen(true);
    }
  };

  const handleConfirmFeatureMarket = async () => {
    if (!organizerToFeature) return;
    try {
        const updatedMarket = await api.updateOrganizer(organizerToFeature.id, { isFeatured: true });
        setOrganizers(prev => prev.map(m => m.id === updatedMarket.id ? updatedMarket : m));
        setFeatureMarketModalOpen(false);
        setOrganizerToFeature(null);
        showNotification(`Successfully featured ${updatedMarket.name}!`);
    } catch (error) {
        showNotification("Failed to feature market.");
    }
  }
  
  const handleConfirmFeatureVendor = async () => {
    if (!vendorToFeature) return;
     try {
        const updatedVendor = await api.updateVendor(vendorToFeature.id, { isFeatured: true });
        setVendors(prev => prev.map(v => v.id === updatedVendor.id ? updatedVendor : v));
        setFeatureVendorModalOpen(false);
        setVendorToFeature(null);
        showNotification(`Successfully featured ${updatedVendor.name}!`);
    } catch (error) {
        showNotification("Failed to feature vendor.");
    }
  }

  const handleToggleMarketFavorite = (id: string) => {
    if (!currentUser) {
        setLoginModalOpen(true);
        return;
    }
    const isFollowing = favoritedMarketIds.includes(id);
    setFavoritedMarketIds(prev =>
      isFollowing ? prev.filter(marketId => marketId !== id) : [...prev, id]
    );
    if (isFollowing) {
      api.removeFollow(currentUser.id, id).catch(err => console.error('Unfollow failed:', err));
    } else {
      api.addFollow(currentUser.id, id, 'market').catch(err => console.error('Follow failed:', err));
    }
  };
  
  // Organizers are Followed (markets and vendors are Saved) — OD-16
  const handleToggleOrganizerFollow = (id: string) => {
    if (!currentUser) {
        setLoginModalOpen(true);
        return;
    }
    const isFollowing = followedOrganizerIds.includes(id);
    setFollowedOrganizerIds(prev => isFollowing ? prev.filter(o => o !== id) : [...prev, id]);
    if (isFollowing) {
      api.removeFollow(currentUser.id, id).catch(err => console.error('Unfollow failed:', err));
    } else {
      api.addFollow(currentUser.id, id, 'organizer').catch(err => console.error('Follow failed:', err));
    }
  };

  const handleToggleVendorFavorite = (id: string) => {
    if (!currentUser) {
        setLoginModalOpen(true);
        return;
    }
    const isFollowing = favoritedVendorIds.includes(id);
    setFavoritedVendorIds(prev =>
      isFollowing ? prev.filter(vendorId => vendorId !== id) : [...prev, id]
    );
    if (isFollowing) {
      api.removeFollow(currentUser.id, id).catch(err => console.error('Unfollow failed:', err));
    } else {
      api.addFollow(currentUser.id, id, 'vendor').catch(err => console.error('Follow failed:', err));
    }
  };

  const handleAddReview = async (
    entityType: 'market' | 'vendor' | 'organizer', 
    entityId: string, 
    reviewData: { rating: number, comment: string }
  ) => {
      if (!currentUser) return;
      try {
          const newReview = await api.addReview(entityType, entityId, { ...reviewData, author: currentUser.firstName && currentUser.lastName ? `${currentUser.firstName} ${currentUser.lastName.charAt(0)}.` : currentUser.email.split('@')[0], userId: currentUser?.id, reviewerAccountType: currentUser?.accountType });
          // Approved reviews only show once HQ approves them; keep the local list in step
          const add = <T extends { id: string; reviews?: Review[] }>(prev: T[]) =>
              prev.map(item => item.id === entityId ? { ...item, reviews: [newReview, ...(item.reviews ?? [])] } : item);
          if (entityType === 'market') setMarkets(add);
          else if (entityType === 'organizer') setOrganizers(add);
          else setVendors(add);
          showNotification("Thank you! Your review is pending approval.");
      } catch (error) {
          // e.g. "You've already reviewed this listing."
          showNotification(error instanceof api.ApiError ? error.message : "Failed to submit review.");
      }
  };

  // Owner asks for a review of their listing to be removed. Throws on failure
  // so the reviews tab can show the error next to the review.
  const handleRequestReviewRemoval = async (reviewId: string, reason: string): Promise<void> => {
      const { removalRequest } = await api.requestReviewRemoval(reviewId, reason);
      setOwnListingReviews(prev => prev.map(r => r.id === reviewId ? { ...r, removalRequest } : r));
      showNotification("Thanks — we'll review your request and let you know.");
  };

  // Admin decides on an owner's removal request
  const handleResolveReviewRemoval = async (entityType: 'market' | 'vendor' | 'organizer', entityId: string, reviewId: string, action: 'remove' | 'keep') => {
      try {
          const updated = await api.resolveReviewRemoval(reviewId, action);
          setAdminReviews(prev => prev.map(r => r.id === reviewId ? { ...r, ...updated } : r));
          if (action === 'remove') {
              const drop = <T extends { id: string; reviews?: Review[] }>(prev: T[]) =>
                  prev.map(item => item.id === entityId ? { ...item, reviews: (item.reviews ?? []).filter(r => r.id !== reviewId) } : item);
              if (entityType === 'market') setMarkets(drop);
              else if (entityType === 'organizer') setOrganizers(drop);
              else setVendors(drop);
          }
          showNotification(action === 'remove' ? 'Review removed.' : 'Review kept.');
      } catch (error) {
          showNotification("Failed to update the removal request.");
      }
  };

  const handleModerateReview = async (entityType: 'market' | 'vendor' | 'organizer', entityId: string, reviewId: string, newStatus: 'approved' | 'declined') => {
      try {
          await api.moderateReview(entityId, reviewId, newStatus);
          const moderated = adminReviews.find(r => r.id === reviewId);
          setAdminReviews(prev => prev.map(r => r.id === reviewId ? { ...r, status: newStatus } : r));

          // Public listings only ever hold approved reviews: add it when approved,
          // remove it when declined
          const apply = <T extends { id: string; reviews?: Review[] }>(prev: T[]) => prev.map(item => {
              if (item.id !== entityId) return item;
              const others = (item.reviews ?? []).filter(review => review.id !== reviewId);
              return {
                  ...item,
                  reviews: newStatus === 'approved' && moderated
                      ? [{ ...moderated, status: 'approved' as const }, ...others]
                      : others,
              };
          });
          if (entityType === 'market') setMarkets(apply);
          else if (entityType === 'organizer') setOrganizers(apply);
          else setVendors(apply);
          showNotification(`Review status updated to ${newStatus}.`);
      } catch (error) {
          showNotification("Failed to update review status.");
      }
  };

  const handleUpdateProfile = async (updatedProfileData: Organizer | Vendor) => {
    try {
        if (isOrganizer(updatedProfileData)) {
            const wasHidden = !!organizers.find(o => o.id === updatedProfileData.id)?.pageHidden;
            const updatedMarket = await api.updateOrganizer(updatedProfileData.id, updatedProfileData);
            setOrganizers(prev => prev.map(m => m.id === updatedMarket.id ? updatedMarket : m));
            // Just showed their organizer page (T140): take them to it
            if (wasHidden && !updatedMarket.pageHidden && updatedMarket.slug) {
                showNotification("Your organizer page is on the site!");
                navigate(`/organizers/${updatedMarket.slug}`);
                return;
            }
        } else {
            const updatedVendor = await api.updateVendor(updatedProfileData.id, updatedProfileData);
            setVendors(prev => prev.map(v => v.id === updatedVendor.id ? updatedVendor : v));
            // Refetch markets so any markets the vendor added during save appear immediately
            const freshMarkets = await api.getMarkets(currentUser?.isAdmin ? {} : { status: 'published' });
            setMarkets(freshMarkets);
        }
        showNotification("Your profile has been updated successfully!");
        navigate('/');
    } catch (error) {
        showNotification("Failed to update profile.");
    }
  };

  const handleUpdateProfileAsAdmin = async (updatedProfileData: Organizer | Vendor, returnTo?: string) => {
    try {
        if (isOrganizer(updatedProfileData)) {
            const updatedMarket = await api.updateOrganizer(updatedProfileData.id, updatedProfileData);
            setOrganizers(prev => prev.map(m => m.id === updatedMarket.id ? updatedMarket : m));
        } else {
            const updatedVendor = await api.updateVendor(updatedProfileData.id, updatedProfileData);
            setVendors(prev => prev.map(v => v.id === updatedVendor.id ? updatedVendor : v));
            // Refetch markets so any markets added during save appear immediately
            const freshMarkets = await api.getMarkets();
            setMarkets(freshMarkets);
        }
        if (returnTo) {
            navigate(returnTo);
        } else {
            // Back to whichever HQ tab the edit was opened from (adminActiveTab remembers it)
            navigate('/hq');
        }
        showNotification("Profile updated successfully!");
    } catch (error) {
        showNotification("Failed to update profile.");
    }
  };

  const handleContactSubmit = async (params: {
    recipientEmail: string;
    recipientName: string;
    senderName: string;
    senderEmail: string;
    subject: string;
    message: string;
  } & SpamGuardFields): Promise<void> => {
    await api.sendContactMessage(params);
    showNotification(`Message sent to ${params.recipientName} regarding "${params.subject}"`);
  };

  const handlePurchasePromotion = (promotion: Promotion) => {
    setSelectedPromotion(promotion);
    setPromotionModalOpen(true);
  };
  
  const handleConfirmPromotion = () => {
      if (!selectedPromotion) return;
      selectedPromotion.onConfirm();
      showNotification(`Successfully purchased: ${selectedPromotion.title}`);
      setPromotionModalOpen(false);
      setSelectedPromotion(null);
  };

  const handleUpdateNotificationSettings = async (newSettings: NotificationSettings) => {
    if (!currentUser) return;
    try {
        const updatedUser = await api.updateUser(currentUser.id, { notificationSettings: newSettings });
        setCurrentUser(updatedUser);
        setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
        showNotification("Notification settings saved!");
    } catch (error) {
        showNotification("Failed to save settings.");
    }
  };

  const handleOpenApplicationForm = (marketId: string) => {
    const market = organizers.find(m => m.id === marketId);
    if (market && ownedVendor) {
        setOrganizerToApplyTo(market);
        setApplicationFormOpen(true);
    }
  };

  const handleApplyToMarket = async (marketId: string, customResponses: { question: string, answer: string }[]) => {
    if (!ownedVendor) return;
    try {
        const newApplication = await api.createApplication(ownedVendor.id, marketId, customResponses);
        setApplications(prev => [...prev, newApplication]);
        setApplicationFormOpen(false);
        setOrganizerToApplyTo(null);
        showNotification("Application submitted successfully!");
    } catch (error) {
        showNotification("Failed to submit application.");
    }
  };

  const handleUpdateApplicationStatus = async (applicationId: string, status: 'approved' | 'rejected') => {
    try {
        const updatedApplication = await api.updateApplicationStatus(applicationId, status);
        setApplications(prev => prev.map(app => app.id === updatedApplication.id ? updatedApplication : app));
        showNotification(`Application status updated to ${status}.`);
    } catch (error) {
        showNotification("Failed to update application status.");
    }
  };
  
  const handleUpdateMemberStatus = async (memberId: string, type: 'organizer' | 'vendor', status: MemberStatus) => {
    // Capture original status for rollback, then apply optimistic update immediately
    const originalStatus = type === 'organizer'
      ? organizers.find(m => m.id === memberId)?.status
      : vendors.find(v => v.id === memberId)?.status;

    if (type === 'organizer') {
      setOrganizers(prev => prev.map(m => m.id === memberId ? { ...m, status } : m));
    } else {
      setVendors(prev => prev.map(v => v.id === memberId ? { ...v, status } : v));
    }

    try {
      if (type === 'organizer') {
        const updatedMarket = await api.updateOrganizer(memberId, { status });
        setOrganizers(prev => prev.map(m => m.id === updatedMarket.id ? updatedMarket : m));
      } else {
        const updatedVendor = await api.updateVendor(memberId, { status });
        setVendors(prev => prev.map(v => v.id === updatedVendor.id ? updatedVendor : v));
      }
      showNotification(`Member status updated to ${status}.`);
    } catch (error) {
      // Revert to original status on failure
      if (originalStatus !== undefined) {
        if (type === 'organizer') {
          setOrganizers(prev => prev.map(m => m.id === memberId ? { ...m, status: originalStatus } : m));
        } else {
          setVendors(prev => prev.map(v => v.id === memberId ? { ...v, status: originalStatus } : v));
        }
      }
      showNotification("Failed to update member status.");
    }
  };

  // HQ › Unclaimed markets › Add a market (T105, T128): an unclaimed market,
  // public straight away. Throws so the form can show an error.
  const handleCreateMarketAsAdmin = async (data: { name: string; city: string; address: string; marketTypes: string[] }) => {
    const created = await api.createMarket({
      name: data.name,
      type: 'dates',
      schedule: { dates: [], startTime: '', endTime: '' },
      location: { venueName: '', address: data.address, city: data.city, province: 'BC' },
      marketType: data.marketTypes,
      status: 'published',
      organizerId: null,
    });
    setMarkets(prev => [...prev, created]);
    showNotification(`Added ${created.name}.`);
  };

  // HQ edits to a market (the event form saves through the API itself)
  const handleMarketSaved = (saved: Market) => {
    setMarkets(prev => prev.some(m => m.id === saved.id) ? prev.map(m => m.id === saved.id ? saved : m) : [...prev, saved]);
  };

  // HQ › Unclaimed › Delete: removes the market and vendors' links to it (T133)
  const handleDeleteUnclaimedMarket = async (id: string) => {
    try {
      await api.deleteMarketPermanently(id);
      setMarkets(prev => prev.filter(m => m.id !== id));
      setVendors(prev => prev.map(v => ({ ...v, attendingMarkets: (v.attendingMarkets ?? []).filter(a => a.marketId !== id) })));
      showNotification('Market deleted.');
    } catch {
      showNotification('Failed to delete the market.');
    }
  };

  const handleHardDeleteMember = async (memberId: string, type: 'organizer' | 'vendor') => {
    try {
      await api.hardDeleteMember(memberId, type);
      if (type === 'organizer') {
        setOrganizers(prev => prev.filter(m => m.id !== memberId));
      } else {
        setVendors(prev => prev.filter(v => v.id !== memberId));
      }
      setUsers(prev => prev.filter(u => u.ownedOrganizerId !== memberId && u.ownedVendorId !== memberId));
      showNotification("Member and account permanently deleted.");
    } catch (error) {
      showNotification("Failed to delete member.");
    }
  };

  const handleToggleAutoRenew = async (userId: string, autoRenew: boolean) => {
      if (!currentUser || currentUser.id !== userId) return;
      try {
        const updatedUser = await api.updateUser(userId, { autoRenew });
        setCurrentUser(updatedUser);
        setUsers(prev => prev.map(u => u.id === userId ? updatedUser : u));
        showNotification(`Auto-renewal has been ${autoRenew ? 'enabled' : 'disabled'}.`);
      } catch (error) {
        showNotification("Failed to update auto-renewal status.");
      }
  };
  
  const handleToggleFoundingMember = async (userId: string, isCurrentlyFounding: boolean) => {
      try {
        const targetUser = users.find(u => u.id === userId);
        const currentSub = targetUser?.subscription ?? { tier: 'free' as const, billingCycle: null, foundingMember: false, termEnds: null, introRate: false, stripeCustomerId: null, stripePaymentId: null };
        const updatedUser = await api.updateUser(userId, {
          subscription: { ...currentSub, foundingMember: !isCurrentlyFounding },
        });
        setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
        showNotification(isCurrentlyFounding ? 'Founding Member status removed.' : `${updatedUser.email} is now a Founding Member!`);
      } catch (error) {
        showNotification("Failed to update Founding Member status.");
      }
  };

  const handleToggleFeatured = async (type: 'organizer' | 'vendor', id: string, currentValue: boolean) => {
    const newValue = !currentValue;
    if (type === 'organizer') {
      setOrganizers(prev => prev.map(m => m.id === id ? { ...m, isFeatured: newValue } : m));
    } else {
      setVendors(prev => prev.map(v => v.id === id ? { ...v, isFeatured: newValue } : v));
    }
    try {
      if (type === 'organizer') {
        await api.updateOrganizer(id, { isFeatured: newValue });
      } else {
        await api.updateVendor(id, { isFeatured: newValue });
      }
      showNotification(newValue ? 'Featured!' : 'Removed from featured');
    } catch {
      if (type === 'organizer') {
        setOrganizers(prev => prev.map(m => m.id === id ? { ...m, isFeatured: currentValue } : m));
      } else {
        setVendors(prev => prev.map(v => v.id === id ? { ...v, isFeatured: currentValue } : v));
      }
      showNotification('Failed to update featured status.');
    }
  };

  const handleSendAdminMessage = async (to: string, subject: string, body: string): Promise<void> => {
      await api.sendAdminMessage(to, subject, body);
      showNotification(`Message sent to ${to}.`);
  };

  const isProAccess = (user: User | null) =>
    user?.subscription?.tier === 'pro' ||
    user?.subscription?.tier === 'superPro' ||
    user?.subscription?.foundingMember === true;

  const VendorSignUpForm = () => {
    const [logoFiles, setLogoFiles] = useState<File[]>([]);
    const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
    
    return (
        <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
        <div>
            <label className="block text-sm font-medium text-gray-700">I am a...</label>
            <select className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm rounded-md">
            <option>Market Organizer</option>
            <option>Vendor</option>
            </select>
        </div>
        <div>
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <input type="text" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm"/>
        </div>
        <div>
            <label className="block text-sm font-medium text-gray-700">Email Address</label>
            <input type="email" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm"/>
        </div>
        
        <ImageUploader
            id="logo-uploader"
            label="Profile Logo (1 image)"
            onFilesChanged={setLogoFiles}
            maxFiles={1}
            maxSizeKB={5120}
            allowedTypes={['image/jpeg', 'image/png']}
            aspectRatio="1:1 (Square)"
        />
        
        <ImageUploader
            id="gallery-uploader"
            label="Gallery Photos (up to 5 images)"
            onFilesChanged={setGalleryFiles}
            maxFiles={5}
            maxSizeKB={5120}
            allowedTypes={['image/jpeg', 'image/png']}
            aspectRatio="16:9 (Widescreen)"
        />

        <button type="submit" className="w-full bg-brand-blue text-white py-2 px-4 rounded-md hover:bg-opacity-90 transition-colors">Submit Application</button>
        </form>
    );
  };
  
  const LoginForm: React.FC<{ onLogin: (creds: { email: string, password: string }) => void; onGoogleLogin: () => void; onForgotPassword: () => void; }> = ({ onLogin, onGoogleLogin, onForgotPassword }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (email && password) {
            onLogin({ email, password });
        }
    };

    return (
        <form className="space-y-4" onSubmit={handleSubmit}>
            {isInAppBrowser() ? (
                <p className="text-sm text-gray-700 bg-brand-cream border border-gray-200 rounded-lg px-4 py-3 text-center">
                    To sign in with Google, open this page in Safari or Chrome.
                </p>
            ) : (
                <button
                    type="button"
                    onClick={onGoogleLogin}
                    className="w-full flex items-center justify-center gap-3 border border-gray-300 rounded-md py-2 px-4 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                    <svg viewBox="0 0 24 24" className="w-5 h-5 flex-shrink-0" aria-hidden="true">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                    Continue with Google
                </button>
            )}
            <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-sm text-gray-500">or sign in with email</span>
                <div className="flex-1 h-px bg-gray-200" />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Email Address</label>
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm"
                    autoComplete="email"
                    required
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Password</label>
                <div className="mt-1">
                    <PasswordInput
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm"
                        autoComplete="current-password"
                        required
                    />
                </div>
            </div>
            <button type="submit" className="w-full bg-brand-blue text-white py-2 px-4 rounded-md hover:bg-opacity-90 transition-colors">Sign In</button>
            <div className="text-center">
                <button type="button" onClick={onForgotPassword} className="text-sm text-brand-light-blue hover:underline">Forgot Password?</button>
            </div>
        </form>
    );
  };

  const MembershipForm: React.FC<{ onSelectPlan: (plan: MembershipPlan, amount: number, description: string) => void }> = ({ onSelectPlan }) => {
    const plans = {
        vendor: [
            { plan: 'vendor-annual' as MembershipPlan, title: 'Standard Annual', price: 100, per: '/yr', bestValue: false },
            { plan: 'vendor-pro-annual' as MembershipPlan, title: 'Pro Annual', price: 250, per: '/yr', bestValue: true, description: 'Includes application system & promotions.' },
            { plan: 'vendor-pro-lifetime' as MembershipPlan, title: 'Pro Lifetime', price: 750, per: '/once', bestValue: false, description: 'One-time payment for Pro access.' },
        ],
        market: [
            { plan: 'market-annual' as MembershipPlan, title: 'Standard Annual', price: 400, per: '/yr', bestValue: false },
            { plan: 'market-pro-annual' as MembershipPlan, title: 'Pro Annual', price: 800, per: '/yr', bestValue: true, description: 'Includes application management & more.' },
            { plan: 'market-pro-lifetime' as MembershipPlan, title: 'Pro Lifetime', price: 2000, per: '/once', bestValue: false, description: 'One-time payment for Pro access.' },
        ]
    };
  
    const PlanCard: React.FC<{plan: any}> = ({plan}) => (
       <div className={`border ${plan.bestValue ? 'border-2 border-brand-gold' : 'border-gray-200'} rounded-lg p-4 text-center relative flex flex-col`}>
        {plan.bestValue && <span className="absolute top-0 -translate-y-1/2 bg-brand-gold text-white text-xs font-bold px-2 py-1 rounded-full">Best Value</span>}
        <h4 className="font-bold text-lg">{plan.title}</h4>
        <p className="text-2xl font-extrabold my-2">${plan.price}<span className="text-sm font-normal">{plan.per}</span></p>
        {plan.description && <p className="text-xs text-gray-500 mb-3 flex-grow">{plan.description}</p>}
        <button onClick={() => onSelectPlan(plan.plan, plan.price, `${plan.title} Plan`)} className="w-full bg-brand-blue text-white py-2 px-4 rounded-md hover:bg-opacity-90 mt-auto">Choose Plan</button>
    </div>
    )

    return (
        <div className="space-y-8">
            <div>
                <h3 className="text-xl font-serif text-brand-blue mb-4">For Vendors</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {plans.vendor.map(p => <PlanCard key={p.plan} plan={p} />)}
                </div>
            </div>
            <div>
                <h3 className="text-xl font-serif text-brand-blue mb-4">For Markets</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                     {plans.market.map(p => <PlanCard key={p.plan} plan={p} />)}
                </div>
            </div>
        </div>
    );
  };

  return (
    <div className="flex flex-col min-h-screen bg-brand-cream">
      {showVerifiedToast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-white border border-green-200 shadow-lg rounded-full px-6 py-3 flex items-center gap-3 text-sm font-medium text-green-800">
          <CheckCircleIcon className="w-5 h-5 text-green-500" />
          Your email has been verified — welcome to VI Markets!
        </div>
      )}
      <Header
        onNavigate={(view) => { navigate(viewToPath(view)); window.scrollTo(0, 0); }}
        onMembership={() => navigate('/pricing')}
        onLogin={() => setLoginModalOpen(true)}
        onLogout={handleLogout}
        currentUser={currentUser}
      />
      <div className="flex-grow">
          {!isAuthReady ? (
            <div className="min-h-screen flex items-center justify-center bg-brand-cream">
              <div className="text-brand-blue text-sm">Loading...</div>
            </div>
          ) : <Routes>
            <Route path="/" element={
              <HomePage
                organizers={publicOrganizers}
                markets={markets.filter(m => m.status === 'published')}
                vendors={vendors}
                currentUser={currentUser}
                isLoading={isDataLoading}
                onSelectMarket={(id) => { const m = markets.find(m => m.id === id); if (m) navigate(marketPath(m)); }}
                onSelectVendor={(id) => { const v = vendors.find(v => v.id === id); if (v?.slug) navigate(`/vendors/${v.slug}`); }}
                onSelectOrganizer={(id) => { const o = organizers.find(o => o.id === id); if (o?.slug) navigate(`/organizers/${o.slug}`); }}
                onViewAllMarkets={() => navigate('/markets')}
                onViewAllVendors={() => navigate('/vendors')}
              />
            } />
            <Route path="/markets" element={
              <BrowsePage
                mode="markets"
                markets={markets.filter(m => m.status === 'published')}
                organizers={publicOrganizers}
                onSelect={(id) => { const m = markets.find(m => m.id === id); if (m) navigate(marketPath(m)); }}
                onBack={() => navigate('/')}
                onSwitchMode={() => navigate('/vendors')}
              />
            } />
            <Route path="/vendors" element={
              <BrowsePage
                mode="vendors"
                vendors={vendors.filter(v => v.status === 'active')}
                onSelect={(id) => { const v = vendors.find(v => v.id === id); if (v?.slug) navigate(`/vendors/${v.slug}`); }}
                onBack={() => navigate('/')}
                onSwitchMode={() => navigate('/markets')}
              />
            } />
            <Route path="/markets/:slug" element={
              <MarketPageRoute
                markets={markets}
                organizers={publicOrganizers}
                vendors={vendors}
                savedMarketIds={favoritedMarketIds}
                currentUser={currentUser}
                onToggleSave={handleToggleMarketFavorite}
                onOpenLoginModal={() => setLoginModalOpen(true)}
                isDataLoading={isDataLoading}
              />
            } />
            <Route path="/markets/:slug/:eventSlug" element={
              <LegacyMarketLinkRoute markets={markets} organizers={publicOrganizers} isDataLoading={isDataLoading} />
            } />
            <Route path="/organizers/:slug" element={
              <OrganizerProfileRoute
                organizers={publicOrganizers}
                markets={markets}
                vendors={vendors}
                applications={applications}
                users={users}
                followedOrganizerIds={followedOrganizerIds}
                currentUser={currentUser}
                onToggleFollow={handleToggleOrganizerFollow}
                onAddReview={handleAddReview}
                onFeatureMarket={handleOpenFeatureMarketModal}
                onContactSubmit={handleContactSubmit}
                onApply={handleOpenApplicationForm}
                onOpenLoginModal={() => setLoginModalOpen(true)}
                isDataLoading={isDataLoading}
              />
            } />
            <Route path="/vendors/:slug" element={
              <VendorProfileRoute
                vendors={vendors}
                markets={markets.filter(m => m.status === 'published')}
                users={users}
                favoritedVendorIds={favoritedVendorIds}
                currentUser={currentUser}
                onToggleFavorite={handleToggleVendorFavorite}
                onAddReview={handleAddReview}
                onFeatureVendor={handleOpenFeatureVendorModal}
                onContactSubmit={handleContactSubmit}
                onOpenLoginModal={() => setLoginModalOpen(true)}
                isDataLoading={isDataLoading}
              />
            } />
            <Route path="/calendar" element={
              <CalendarView
                currentUser={currentUser}
                markets={markets.filter(m => m.status === 'published')}
                ownOrganizer={currentUser?.ownedOrganizerId ? organizers.find(m => m.id === currentUser.ownedOrganizerId) : undefined}
                onMarketAdded={handleMarketSaved}
                onSelectEvent={(market, date) => navigate(marketPath(market, date))}
                onBack={() => navigate('/')}
              />
            } />
            <Route path="/about" element={<AboutPage onSignup={() => navigate('/signup')} />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/terms" element={<TermsOfUsePage />} />
            <Route path="/member-agreement" element={<MemberAgreementPage />} />
            <Route path="/pricing" element={
              <PricingPage onBack={() => navigate('/')} onSignup={() => navigate('/signup')} />
            } />
            <Route path="/signup" element={
              <SignupPage
                onNavigate={(view) => navigate(viewToPath(view))}
                onLogin={() => setLoginModalOpen(true)}
                isFoundingMemberOfferActive={true}
                onSignupSuccess={async (user: User) => {
                  setCurrentUser(user);
                  showNotification(`Welcome to VI Markets, ${user.firstName || user.email}!`);
                  // Organizers go straight to My Markets (T140) and have no logo to wait for
                  if (user.accountType === 'organizer') {
                    api.getOrganizers().then(setOrganizers).catch(() => {});
                    return;
                  }
                  // Delay refetch to allow logo upload to complete before
                  // refreshing organizer/vendor data from Firestore
                  setTimeout(async () => {
                    try {
                      const [organizersData, vendorsData] = await Promise.all([
                        api.getOrganizers(),
                        api.getVendors(),
                      ]);
                      setOrganizers(organizersData);
                      setVendors(vendorsData);
                    } catch {
                      // non-fatal
                    }
                  }, 4000);
                }}
              />
            } />
            <Route path="/dashboard" element={
              <Dashboard
                markets={markets.filter(m => favoritedMarketIds.includes(m.id))}
                vendors={vendors.filter(v => favoritedVendorIds.includes(v.id))}
                organizers={organizers.filter(o => followedOrganizerIds.includes(o.id))}
                onSelectMarket={(id) => {
                  const m = markets.find(m => m.id === id); if (!m) return;
                  rememberBrowseList('markets', markets.filter(m => favoritedMarketIds.includes(m.id)).map(m => m.id), 'Back to Saved');
                  navigate(marketPath(m));
                }}
                onSelectVendor={(id) => {
                  const v = vendors.find(v => v.id === id); if (!v?.slug) return;
                  rememberBrowseList('vendors', vendors.filter(v => favoritedVendorIds.includes(v.id)).map(v => v.id), 'Back to Saved');
                  navigate(`/vendors/${v.slug}`);
                }}
                onSelectOrganizer={(id) => {
                  const o = organizers.find(o => o.id === id); if (o?.slug) navigate(`/organizers/${o.slug}`);
                }}
                onBack={() => navigate('/')}
              />
            } />
            <Route path="/dashboard/my-market" element={<Navigate to="/dashboard/my-markets" replace />} />
            <Route path="/dashboard/my-markets" element={
              // (or their organizer record is still loading, just after signup)
              currentUser?.ownedOrganizerId && (isDataLoading || !ownedOrganizer) ? (
                <div className="min-h-screen flex items-center justify-center bg-brand-cream">
                  <div className="text-brand-blue text-sm">Loading...</div>
                </div>
              ) : currentUser && currentUser.ownedOrganizerId && ownedOrganizer ? (
                <OrganizerHub
                  currentUser={currentUser}
                  organizer={ownedOrganizer}
                  allOrganizers={currentUser.isAdmin ? organizers : undefined}
                  onNavigateToProfile={() => navigate('/dashboard/profile')}
                  onBack={() => navigate('/')}
                  onMarketSaved={handleMarketSaved}
                />
              ) : <Navigate to="/" replace />
            } />
            <Route path="/dashboard/profile" element={(() => {
              const profileData = ownedOrganizer || ownedVendor;
              if (!currentUser || !profileData) return <Navigate to="/" replace />;
              const organizerApplications = isOrganizer(profileData) ? applications.filter(app => app.organizerId === profileData.id) : [];
              return (
                <ProfileManager
                  profileData={profileData}
                  user={currentUser}
                  allMarkets={markets.filter(m => m.status === 'published')}
                  applications={organizerApplications}
                  vendors={vendors}
                  listingReviews={ownListingReviews}
                  onRequestReviewRemoval={handleRequestReviewRemoval}
                  onUpdateApplicationStatus={handleUpdateApplicationStatus}
                  onSaveChanges={handleUpdateProfile}
                  onToggleAutoRenew={(autoRenew) => handleToggleAutoRenew(currentUser.id, autoRenew)}
                  onOpenUpgradeModal={() => setMembershipModalOpen(true)}
                  onUserUpdated={setCurrentUser}
                  onBack={() => navigate(isOrganizer(profileData) ? '/dashboard/my-markets' : '/')}
                  isAdmin={false}
                />
              );
            })()} />
            <Route path="/dashboard/notifications" element={
              !currentUser?.notificationSettings ? <Navigate to="/" replace /> : (
                <NotificationSettingsComponent
                  settings={currentUser.notificationSettings}
                  onSave={handleUpdateNotificationSettings}
                  onBack={() => navigate('/')}
                  currentUser={currentUser}
                  onSaveCity={async (city: string) => {
                    const updatedUser = await api.updateUser(currentUser.id, { city });
                    setCurrentUser(updatedUser);
                    setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
                  }}
                />
              )
            } />
            <Route path="/dashboard/applications" element={(() => {
              if (!ownedVendor || !isProAccess(currentUser)) return <Navigate to="/" replace />;
              const vendorApps = applications.filter(app => app.vendorId === ownedVendor.id);
              return (
                <MyApplications
                  applications={vendorApps}
                  organizers={organizers}
                  onSelectMarket={(id) => { const m = organizers.find(m => m.id === id); if (m?.slug) navigate(`/organizers/${m.slug}`); }}
                  onBack={() => navigate('/')}
                />
              );
            })()} />
            <Route path="/dashboard/promotions" element={
              !currentUser || (!ownedOrganizer && !ownedVendor) || !isProAccess(currentUser) ? (
                <Navigate to="/" replace />
              ) : (
                <Promotions
                  ownedOrganizer={ownedOrganizer}
                  ownedVendor={ownedVendor}
                  onPurchasePromotion={handlePurchasePromotion}
                  onBack={() => navigate('/')}
                />
              )
            } />
            <Route path="/hq" element={
              !currentUser?.isAdmin ? <Navigate to="/" replace /> : (
                <AdminPanel
                  organizers={organizers}
                  markets={markets}
                  vendors={vendors}
                  users={users}
                  reviews={adminReviews}
                  currentUser={currentUser}
                  onModerateReview={handleModerateReview}
                  onResolveReviewRemoval={handleResolveReviewRemoval}
                  onEditProfile={(profileId, profileType) => navigate(`/hq/edit/${profileType}/${profileId}`)}
                  onOpenOrganizerMarkets={(id) => navigate(`/hq/organizer/${id}/markets`)}
                  onUpdateMemberStatus={handleUpdateMemberStatus}
                  onHardDeleteMember={handleHardDeleteMember}
                  onToggleFoundingMember={handleToggleFoundingMember}
                  onToggleFeatured={handleToggleFeatured}
                  onSendMessage={handleSendAdminMessage}
                  onCreateMarket={handleCreateMarketAsAdmin}
                  onMarketSaved={handleMarketSaved}
                  onDeleteMarket={handleDeleteUnclaimedMarket}
                  initialTab={adminActiveTab}
                  onTabChange={setAdminActiveTab}
                />
              )
            } />
            <Route path="/hq/organizer/:organizerId/markets" element={
              <AdminOrganizerMarketsRoute organizers={organizers} currentUser={currentUser} />
            } />
            <Route path="/hq/edit/:profileType/:profileId" element={
              <AdminEditProfileRoute
                organizers={organizers}
                markets={markets}
                vendors={vendors}
                users={users}
                currentUser={currentUser}
                onSaveChanges={handleUpdateProfileAsAdmin}
              />
            } />
            <Route path="/verified" element={<VerifiedPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>}
      </div>
      <footer className="bg-brand-blue text-white">
        <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
                <h3 className="text-xl mb-2 font-serif">Stay in the loop!</h3>
                <p className="text-gray-300">Get updates on new markets, featured vendors, and what's in season. You'll receive notifications for markets in your area and for your favorite vendors and markets.</p>
            </div>
            <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";
                  try {
                    const res = await fetch(`${BASE_URL}/brevo/subscribe`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ email: footerEmail, firstName: footerFirstName, city: footerCity, ...footerSpamGuard.guardFields() }),
                    });
                    if (!res.ok) throw new Error();
                    showNotification("Almost there, " + footerFirstName + "! Check your email and click the link to confirm your subscription.");
                    setFooterFirstName('');
                    setFooterEmail('');
                    setFooterCity('');
                  } catch {
                    showNotification("Something went wrong. Please try again.");
                  }
                }}
                className="flex flex-col md:flex-row gap-2"
              >
                {footerSpamGuard.honeypotField}
                <input
                  type="text"
                  placeholder="First Name"
                  value={footerFirstName}
                  onChange={(e) => setFooterFirstName(e.target.value)}
                  className="p-3 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-gold focus:ring-offset-2 focus:ring-offset-brand-blue"
                  required
                  aria-label="First name for newsletter"
                />
                <input
                  type="email"
                  placeholder="your.email@example.com"
                  value={footerEmail}
                  onChange={(e) => setFooterEmail(e.target.value)}
                  className="p-3 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-gold focus:ring-offset-2 focus:ring-offset-brand-blue"
                  required
                  aria-label="Email for newsletter"
                />
                <input
                  type="text"
                  placeholder="City"
                  value={footerCity}
                  onChange={(e) => setFooterCity(e.target.value)}
                  className="p-3 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-gold focus:ring-offset-2 focus:ring-offset-brand-blue"
                  aria-label="City for newsletter"
                />
                <button type="submit" className="bg-brand-gold text-white font-semibold px-6 py-3 rounded-md hover:bg-opacity-80 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-gold focus:ring-offset-2 focus:ring-offset-brand-blue whitespace-nowrap">
                  Sign Me Up!
                </button>
            </form>
            </div>
            <div className="mt-8 pt-4 border-t border-gray-700 text-center text-sm text-gray-400">
                <div className="flex flex-wrap justify-center gap-x-5 gap-y-1 mb-3">
                    <button onClick={() => navigate('/about')} className="hover:text-white transition-colors">About</button>
                    <a href="mailto:hello@vimarkets.ca" className="hover:text-white transition-colors">Contact</a>
                    <button onClick={() => navigate('/privacy')} className="hover:text-white transition-colors">Privacy Policy</button>
                    <button onClick={() => navigate('/terms')} className="hover:text-white transition-colors">Terms of Use</button>
                    <button onClick={() => navigate('/member-agreement')} className="hover:text-white transition-colors">Member Agreement</button>
                </div>
                &copy; {new Date().getFullYear()} VI Markets Network. All rights reserved.
            </div>
        </div>
      </footer>

      {/* Modals */}
      <Modal isOpen={isVendorSignUpModalOpen} onClose={() => setVendorSignUpModalOpen(false)} title="Join Our Community" maxWidth="2xl">
        <VendorSignUpForm />
      </Modal>
      <Modal isOpen={isLoginModalOpen} onClose={() => setLoginModalOpen(false)} title="Login or Sign Up">
        <LoginForm onLogin={handleLogin} onGoogleLogin={handleGoogleLogin} onForgotPassword={() => { setLoginModalOpen(false); setForgotPasswordOpen(true); }}/>
      </Modal>
      <Modal
          isOpen={isForgotPasswordOpen}
          onClose={() => setForgotPasswordOpen(false)}
          title="Forgot Password"
          maxWidth="sm"
        >
        <ForgotPasswordForm onSendRecoveryEmail={async (email) => {
          try {
            await sendPasswordResetEmail(firebaseAuth, email);
            showNotification(`Recovery email sent to ${email}.`);
            setForgotPasswordOpen(false);
          } catch (err: unknown) {
            const code = (err as { code?: string }).code;
            if (code === 'auth/user-not-found' || code === 'auth/invalid-email') {
              showNotification('If an account exists for this email, a reset link has been sent.');
              setForgotPasswordOpen(false);
            } else {
              showNotification('Something went wrong. Please try again.');
            }
          }
        }} />
      </Modal>
      <Modal
          isOpen={isResetPasswordOpen}
          onClose={() => setResetPasswordOpen(false)}
          title="Set New Password"
          maxWidth="sm"
        >
        <ResetPasswordForm
          email={resetPasswordEmail ?? ''}
          onSubmit={async (newPassword) => {
            if (!resetOobCode) {
              throw new Error('Something went wrong. Please request a new password reset link.');
            }
            try {
              await confirmPasswordReset(firebaseAuth, resetOobCode, newPassword);
              setResetPasswordOpen(false);
              showNotification('Your password has been updated. Please sign in.');
              setLoginModalOpen(true);
            } catch (err: unknown) {
              const code = (err as { code?: string }).code;
              if (code === 'auth/expired-action-code' || code === 'auth/invalid-action-code') {
                throw new Error('This link has expired. Please request a new password reset email.');
              }
              if (code === 'auth/weak-password' || code === 'auth/password-does-not-meet-requirements') {
                throw new Error(PASSWORD_POLICY_MESSAGE);
              }
              throw new Error('Something went wrong. Please try again.');
            }
          }}
        />
      </Modal>
      <Modal
        isOpen={isMembershipModalOpen}
        onClose={() => setMembershipModalOpen(false)}
        title="Upgrade to Pro"
        maxWidth="sm"
      >
        {currentUser && (
          <StripePaymentForm
            billingCycle="6month"
            uid={currentUser.id}
            userEmail={currentUser.email}
            onCancel={() => setMembershipModalOpen(false)}
          />
        )}
      </Modal>
      {/* HIDDEN: Featured listings — not yet implemented, see Phase 3 */}
      {false && <Modal isOpen={isFeatureMarketModalOpen} onClose={() => setFeatureMarketModalOpen(false)} title={`Feature ${organizerToFeature?.name}`}>
        <p className="text-gray-500 text-sm text-center py-4">Payment flow — Phase 2.</p>
      </Modal>}
      {false && <Modal isOpen={isFeatureVendorModalOpen} onClose={() => setFeatureVendorModalOpen(false)} title={`Feature ${vendorToFeature?.name}`}>
        <p className="text-gray-500 text-sm text-center py-4">Payment flow — Phase 2.</p>
      </Modal>}
      <Modal isOpen={isPromotionModalOpen} onClose={() => setPromotionModalOpen(false)} title={`Purchase: ${selectedPromotion?.title}`}>
        <p className="text-gray-500 text-sm text-center py-4">Payment flow — coming in Phase 2.</p>
      </Modal>
      <Modal isOpen={isApplicationFormOpen} onClose={() => setApplicationFormOpen(false)} title={`Apply to ${organizerToApplyTo?.name}`}>
        {organizerToApplyTo && ownedVendor && (
            <ApplicationForm
                organizer={organizerToApplyTo}
                vendor={ownedVendor}
                onSubmit={handleApplyToMarket}
            />
        )}
      </Modal>


      {/* Global Alerts */}
      <NotificationToast message={notification} />
      <CookieConsentBanner isVisible={showCookieBanner} onAccept={handleCookieConsent} />
      {showPaymentSuccess && (
        <PaymentSuccessModal
          onClose={() => setShowPaymentSuccess(false)}
          termEnds={currentUser?.subscription?.termEnds ?? null}
        />
      )}
    </div>
  );
};

export default App;