

import React, { useState, useMemo, useEffect } from 'react';
import type { View, Market, Vendor, User, Review, NotificationSettings, Application, MemberStatus } from './types';
import { Routes, Route, Navigate, useNavigate, useParams } from 'react-router-dom';
import * as api from './services/api.live';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { firebaseAuth } from './services/firebase';

import Header from './components/Header';
import HomePage from './components/HomePage';
import MarketProfile from './components/MarketProfile';
import VendorProfile from './components/VendorProfile';
import Modal from './components/Modal';
import ImageUploader from './components/ImageUploader';
import ProfileManager from './components/ProfileManager';
import Dashboard from './components/Dashboard';
import StripePaymentForm from './components/StripePaymentForm';
import CalendarView from './components/CalendarView';
import NotificationToast from './components/NotificationToast';
import AdminPanel from './components/AdminPanel';
import Promotions from './components/Promotions';
import NotificationSettingsComponent from './components/NotificationSettings';
import MyApplications from './components/MyApplications';
import ApplicationForm from './components/ApplicationForm';
import CookieConsentBanner from './components/CookieConsentBanner';
import ForgotPasswordForm from './components/ForgotPasswordForm';
import SignupPage from './components/SignupPage';
import OrganizerHub from './components/OrganizerHub';
import BrowsePage from './components/BrowsePage';
import PricingPage from './components/PricingPage';
import AboutPage from './components/AboutPage';
import PrivacyPage from './components/PrivacyPage';
import TermsOfUsePage from './components/TermsOfUsePage';
import MemberAgreementPage from './components/MemberAgreementPage';


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
    case 'organizerHub':       return '/dashboard/my-market';
    case 'manageProfile':      return '/dashboard/profile';
    case 'notificationSettings': return '/dashboard/notifications';
    case 'myApplications':     return '/dashboard/applications';
    case 'promotions':         return '/dashboard/promotions';
    case 'adminPanel':         return '/hq';
    case 'adminEditProfile':   return `/hq/edit/${view.profileType}/${view.profileId}`;
    case 'marketProfile':      return `/markets/${view.id}`;
    case 'vendorProfile':      return `/vendors/${view.id}`;
    default:                   return '/';
  }
};

// ── Route wrapper components (defined at module scope to keep stable references) ──

interface MarketProfileRouteProps {
  markets: Market[];
  vendors: Vendor[];
  applications: Application[];
  users: User[];
  favoritedMarketIds: string[];
  currentUser: User | null;
  onToggleFavorite: (id: string) => void;
  onAddReview: (entityType: 'market' | 'vendor', entityId: string, data: { rating: number; comment: string }) => Promise<void>;
  onFeatureMarket: (marketId: string) => void;
  onContactSubmit: (recipientEmail: string, subject: string) => void;
  onApply: (marketId: string) => void;
}
const MarketProfileRoute: React.FC<MarketProfileRouteProps> = ({
  markets, vendors, applications, users, favoritedMarketIds, currentUser,
  onToggleFavorite, onAddReview, onFeatureMarket, onContactSubmit, onApply,
}) => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const market = markets.find(m => m.slug === slug);
  if (!market || market.status !== 'active') return <Navigate to="/" replace />;
  const marketOwner = users.find(u => u.id === market.ownerId);
  return (
    <MarketProfile
      market={market}
      vendors={vendors}
      applications={applications}
      owner={marketOwner}
      onSelectVendor={(id) => {
        const v = vendors.find(v => v.id === id);
        if (v?.slug) navigate(`/vendors/${v.slug}`);
      }}
      onBack={() => navigate('/')}
      isFavorited={favoritedMarketIds.includes(market.id)}
      onToggleFavorite={onToggleFavorite}
      currentUser={currentUser}
      onAddReview={(data) => onAddReview('market', market.id, data)}
      onFeatureMarket={onFeatureMarket}
      onContactSubmit={onContactSubmit}
      onApply={onApply}
    />
  );
};

interface VendorProfileRouteProps {
  vendors: Vendor[];
  markets: Market[];
  users: User[];
  favoritedVendorIds: string[];
  currentUser: User | null;
  onToggleFavorite: (id: string) => void;
  onAddReview: (entityType: 'market' | 'vendor', entityId: string, data: { rating: number; comment: string }) => Promise<void>;
  onFeatureVendor: (vendorId: string) => void;
  onContactSubmit: (recipientEmail: string, subject: string) => void;
}
const VendorProfileRoute: React.FC<VendorProfileRouteProps> = ({
  vendors, markets, users, favoritedVendorIds, currentUser,
  onToggleFavorite, onAddReview, onFeatureVendor, onContactSubmit,
}) => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const vendor = vendors.find(v => v.slug === slug);
  if (!vendor || vendor.status !== 'active') return <Navigate to="/" replace />;
  const vendorOwner = users.find(u => u.id === vendor.ownerId);
  return (
    <VendorProfile
      vendor={vendor}
      markets={markets}
      owner={vendorOwner}
      onSelectMarket={(id) => {
        const m = markets.find(m => m.id === id);
        if (m?.slug) navigate(`/markets/${m.slug}`);
      }}
      onBack={() => navigate('/')}
      isFavorited={favoritedVendorIds.includes(vendor.id)}
      onToggleFavorite={onToggleFavorite}
      currentUser={currentUser}
      onAddReview={(data) => onAddReview('vendor', vendor.id, data)}
      onFeatureVendor={onFeatureVendor}
      onContactSubmit={onContactSubmit}
    />
  );
};

interface AdminEditProfileRouteProps {
  markets: Market[];
  vendors: Vendor[];
  users: User[];
  currentUser: User | null;
  onSaveChanges: (data: Market | Vendor) => Promise<void>;
}
const AdminEditProfileRoute: React.FC<AdminEditProfileRouteProps> = ({
  markets, vendors, users, currentUser, onSaveChanges,
}) => {
  const { profileType, profileId } = useParams<{ profileType: string; profileId: string }>();
  const navigate = useNavigate();
  if (!currentUser?.isAdmin) return <Navigate to="/" replace />;
  const profileToEdit = profileType === 'market'
    ? markets.find(m => m.id === profileId)
    : vendors.find(v => v.id === profileId);
  if (!profileToEdit) return <Navigate to="/hq" replace />;
  return (
    <ProfileManager
      profileData={profileToEdit}
      user={users.find(u => u.ownedMarketId === profileToEdit.id || u.ownedVendorId === profileToEdit.id) || null}
      allMarkets={markets}
      onSaveChanges={onSaveChanges}
      onBack={() => navigate('/hq')}
      isAdmin={true}
      reviewsToModerate={[]}
      onModerateReview={() => {}}
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

const isMarket = (profile: Market | Vendor): profile is Market => {
    return 'location' in profile;
};

const App: React.FC = () => {
  const [markets, setMarkets] = useState<Market[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);

  const navigate = useNavigate();

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isForgotPasswordOpen, setForgotPasswordOpen] = useState(false);
  const [isLoginModalOpen, setLoginModalOpen] = useState(false);

  const [isVendorSignUpModalOpen, setVendorSignUpModalOpen] = useState(false);
  const [isMembershipModalOpen, setMembershipModalOpen] = useState(false);
  const [selectedPlanForPayment, setSelectedPlanForPayment] = useState<{ plan: MembershipPlan, amount: number, description: string } | null>(null);
  
  const [isFeatureMarketModalOpen, setFeatureMarketModalOpen] = useState(false);
  const [marketToFeature, setMarketToFeature] = useState<Market | null>(null);

  const [isFeatureVendorModalOpen, setFeatureVendorModalOpen] = useState(false);
  const [vendorToFeature, setVendorToFeature] = useState<Vendor | null>(null);

  const [isPromotionModalOpen, setPromotionModalOpen] = useState(false);
  const [selectedPromotion, setSelectedPromotion] = useState<Promotion | null>(null);

  const [favoritedMarketIds, setFavoritedMarketIds] = useState<string[]>([]);
  const [favoritedVendorIds, setFavoritedVendorIds] = useState<string[]>([]);
  
  const [notification, setNotification] = useState<string | null>(null);

  const [isApplicationFormOpen, setApplicationFormOpen] = useState(false);
  const [marketToApplyTo, setMarketToApplyTo] = useState<Market | null>(null);

  const [showCookieBanner, setShowCookieBanner] = useState(false);
  const [adminActiveTab, setAdminActiveTab] = useState<'reviews' | 'memberships'>('reviews');

  const [footerFirstName, setFooterFirstName] = useState('');
  const [footerEmail, setFooterEmail] = useState('');
  const [footerCity, setFooterCity] = useState('');

  useEffect(() => {
    const consent = localStorage.getItem('cookie_consent');
    if (!consent) setShowCookieBanner(true);

    // Wave 1: public data — homepage needs this
    const fetchPublicData = async () => {
      try {
        const [marketsData, vendorsData] = await Promise.all([
          api.getMarkets(),
          api.getVendors(),
        ]);
        setMarkets(marketsData);
        setVendors(vendorsData);
      } catch (error) {
        console.error("Failed to fetch markets/vendors:", error);
        showNotification("Error: Could not load listings.");
      } finally {
        setIsDataLoading(false);
      }
    };

    // Wave 2: admin/app data — fetch in background, no loading gate
    const fetchAdminData = async () => {
      try {
        const [applicationsData, usersData] = await Promise.all([
          api.getApplications(),
          api.getUsers(),
        ]);
        setApplications(applicationsData);
        setUsers(usersData);
      } catch (error) {
        console.error("Failed to fetch admin data:", error);
      }
    };

    fetchPublicData();
    fetchAdminData();
  }, []);

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
        } catch {
          // user doc not found — stay logged out
        }
      }
    });
    return unsubscribe;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  const showNotification = (message: string) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 5000);
  };

  const ownedMarket = useMemo(() => 
    currentUser ? markets.find(m => m.id === currentUser.ownedMarketId) : undefined
  , [currentUser, markets]);

  const ownedVendor = useMemo(() =>
    currentUser ? vendors.find(v => v.id === currentUser.ownedVendorId) : undefined
  , [currentUser, vendors]);


  const handleLogin = async (credentials: { email: string, password: string }) => {
      try {
        const user = await api.login(credentials.email, credentials.password);
        setCurrentUser(user);
        setLoginModalOpen(false);
        showNotification(`Welcome, ${user.email}!`);
      } catch (error) {
          showNotification(error instanceof Error ? error.message : 'Login failed.');
      }
  };
  
  const handleLogout = () => {
      signOut(firebaseAuth).catch(() => {});
      setCurrentUser(null);
      setFavoritedMarketIds([]);
      setFavoritedVendorIds([]);
      navigate('/');
  };

  const handleUpgradeMembership = async (plan: MembershipPlan) => {
    if (!currentUser) return;
    try {
        const updatedUser = await api.updateUser(currentUser.id, { membership: plan });
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
    const market = markets.find(m => m.id === marketId);
    if (market) {
      setMarketToFeature(market);
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
    if (!marketToFeature) return;
    try {
        const updatedMarket = await api.updateMarket(marketToFeature.id, { isFeatured: true });
        setMarkets(prev => prev.map(m => m.id === updatedMarket.id ? updatedMarket : m));
        setFeatureMarketModalOpen(false);
        setMarketToFeature(null);
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
    setFavoritedMarketIds(prev =>
      prev.includes(id) ? prev.filter(marketId => marketId !== id) : [...prev, id]
    );
  };
  
  const handleToggleVendorFavorite = (id: string) => {
    if (!currentUser) {
        setLoginModalOpen(true);
        return;
    }
    setFavoritedVendorIds(prev =>
      prev.includes(id) ? prev.filter(vendorId => vendorId !== id) : [...prev, id]
    );
  };

  const handleAddReview = async (
    entityType: 'market' | 'vendor', 
    entityId: string, 
    reviewData: { rating: number, comment: string }
  ) => {
      if (!currentUser) return;
      try {
          const newReview = await api.addReview(entityType, entityId, { ...reviewData, author: currentUser.email.split('@')[0] });
          const collectionSetter = entityType === 'market' ? setMarkets : setVendors;
          collectionSetter(prev => 
              prev.map(item => 
                  item.id === entityId 
                      ? { ...item, reviews: [newReview, ...item.reviews] }
                      : item
              )
          );
          showNotification("Thank you! Your review is pending approval.");
      } catch (error) {
          showNotification("Failed to submit review.");
      }
  };
  
  const handleModerateReview = async (entityType: 'market' | 'vendor', entityId: string, reviewId: string, newStatus: 'approved' | 'declined') => {
      try {
          await api.moderateReview(entityId, reviewId, newStatus);
          const collectionSetter = entityType === 'market' ? setMarkets : setVendors;
          
          collectionSetter(prev => prev.map(item => {
              if (item.id === entityId) {
                  const updatedReviews = item.reviews.map(review => {
                      if (review.id === reviewId) {
                          return { ...review, status: newStatus };
                      }
                      return review;
                  });
                  return { ...item, reviews: updatedReviews };
              }
              return item;
          }));
          showNotification(`Review status updated to ${newStatus}.`);
      } catch (error) {
          showNotification("Failed to update review status.");
      }
  };

  const handleUpdateProfile = async (updatedProfileData: Market | Vendor) => {
    try {
        if (isMarket(updatedProfileData)) {
            const updatedMarket = await api.updateMarket(updatedProfileData.id, updatedProfileData);
            setMarkets(prev => prev.map(m => m.id === updatedMarket.id ? updatedMarket : m));
        } else {
            const updatedVendor = await api.updateVendor(updatedProfileData.id, updatedProfileData);
            setVendors(prev => prev.map(v => v.id === updatedVendor.id ? updatedVendor : v));
        }
        showNotification("Your profile has been updated successfully!");
        navigate('/');
    } catch (error) {
        showNotification("Failed to update profile.");
    }
  };

  const handleUpdateProfileAsAdmin = async (updatedProfileData: Market | Vendor) => {
    try {
        if (isMarket(updatedProfileData)) {
            const updatedMarket = await api.updateMarket(updatedProfileData.id, updatedProfileData);
            setMarkets(prev => prev.map(m => m.id === updatedMarket.id ? updatedMarket : m));
        } else {
            const updatedVendor = await api.updateVendor(updatedProfileData.id, updatedProfileData);
            setVendors(prev => prev.map(v => v.id === updatedVendor.id ? updatedVendor : v));
        }
        setAdminActiveTab('memberships');
        navigate('/hq');
        showNotification("Profile updated successfully!");
    } catch (error) {
        showNotification("Failed to update profile.");
    }
  };

  const handleContactSubmit = (recipientEmail: string, subject: string) => {
    showNotification(`Message sent to ${recipientEmail} regarding "${subject}"`);
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
    const market = markets.find(m => m.id === marketId);
    if (market && ownedVendor) {
        setMarketToApplyTo(market);
        setApplicationFormOpen(true);
    }
  };

  const handleApplyToMarket = async (marketId: string, customResponses: { question: string, answer: string }[]) => {
    if (!ownedVendor) return;
    try {
        const newApplication = await api.createApplication(ownedVendor.id, marketId, customResponses);
        setApplications(prev => [...prev, newApplication]);
        setApplicationFormOpen(false);
        setMarketToApplyTo(null);
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
  
  const handleUpdateMemberStatus = async (memberId: string, type: 'market' | 'vendor', status: MemberStatus) => {
    // Capture original status for rollback, then apply optimistic update immediately
    const originalStatus = type === 'market'
      ? markets.find(m => m.id === memberId)?.status
      : vendors.find(v => v.id === memberId)?.status;

    if (type === 'market') {
      setMarkets(prev => prev.map(m => m.id === memberId ? { ...m, status } : m));
    } else {
      setVendors(prev => prev.map(v => v.id === memberId ? { ...v, status } : v));
    }

    try {
      if (type === 'market') {
        const updatedMarket = await api.updateMarket(memberId, { status });
        setMarkets(prev => prev.map(m => m.id === updatedMarket.id ? updatedMarket : m));
      } else {
        const updatedVendor = await api.updateVendor(memberId, { status });
        setVendors(prev => prev.map(v => v.id === updatedVendor.id ? updatedVendor : v));
      }
      showNotification(`Member status updated to ${status}.`);
    } catch (error) {
      // Revert to original status on failure
      if (originalStatus !== undefined) {
        if (type === 'market') {
          setMarkets(prev => prev.map(m => m.id === memberId ? { ...m, status: originalStatus } : m));
        } else {
          setVendors(prev => prev.map(v => v.id === memberId ? { ...v, status: originalStatus } : v));
        }
      }
      showNotification("Failed to update member status.");
    }
  };

  const handleHardDeleteMember = async (memberId: string, type: 'market' | 'vendor') => {
    try {
      await api.hardDeleteMember(memberId, type);
      if (type === 'market') {
        setMarkets(prev => prev.filter(m => m.id !== memberId));
      } else {
        setVendors(prev => prev.filter(v => v.id !== memberId));
      }
      setUsers(prev => prev.filter(u => u.ownedMarketId !== memberId && u.ownedVendorId !== memberId));
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
        const currentSub = targetUser?.subscription ?? { tier: 'free' as const, billingCycle: null, foundingMember: false };
        const updatedUser = await api.updateUser(userId, {
          subscription: { ...currentSub, foundingMember: !isCurrentlyFounding },
        });
        setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
        showNotification(isCurrentlyFounding ? 'Founding Member status removed.' : `${updatedUser.email} is now a Founding Member!`);
      } catch (error) {
        showNotification("Failed to update Founding Member status.");
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
  
  const LoginForm: React.FC<{ onLogin: (creds: { email: string, password: string }) => void; onForgotPassword: () => void; }> = ({ onLogin, onForgotPassword }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (email && password) {
            onLogin({ email, password });
        }
    };

    return (
        <form className="space-y-4" onSubmit={handleSubmit}>
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
                <div className="relative mt-1">
                    <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 pr-14 focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm"
                        autoComplete="current-password"
                        required
                    />
                    <button
                        type="button"
                        tabIndex={-1}
                        onClick={() => setShowPassword(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-400 hover:text-gray-600"
                    >
                        {showPassword ? 'Hide' : 'Show'}
                    </button>
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
      <Header
        onNavigate={(view) => { navigate(viewToPath(view)); window.scrollTo(0, 0); }}
        onMembership={() => navigate('/pricing')}
        onLogin={() => setLoginModalOpen(true)}
        onLogout={handleLogout}
        currentUser={currentUser}
      />
      <div className="flex-grow">
          <Routes>
            <Route path="/" element={
              <HomePage
                markets={markets}
                vendors={vendors}
                isLoading={isDataLoading}
                onSelectMarket={(id) => { const m = markets.find(m => m.id === id); if (m?.slug) navigate(`/markets/${m.slug}`); }}
                onSelectVendor={(id) => { const v = vendors.find(v => v.id === id); if (v?.slug) navigate(`/vendors/${v.slug}`); }}
                onViewAllMarkets={() => navigate('/markets')}
                onViewAllVendors={() => navigate('/vendors')}
              />
            } />
            <Route path="/markets" element={
              <BrowsePage
                mode="markets"
                items={markets.filter(m => m.status === 'active')}
                onSelect={(id) => { const m = markets.find(m => m.id === id); if (m?.slug) navigate(`/markets/${m.slug}`); }}
                onBack={() => navigate('/')}
                onSwitchMode={() => navigate('/vendors')}
              />
            } />
            <Route path="/vendors" element={
              <BrowsePage
                mode="vendors"
                items={vendors.filter(v => v.status === 'active')}
                onSelect={(id) => { const v = vendors.find(v => v.id === id); if (v?.slug) navigate(`/vendors/${v.slug}`); }}
                onBack={() => navigate('/')}
                onSwitchMode={() => navigate('/markets')}
              />
            } />
            <Route path="/markets/:slug" element={
              <MarketProfileRoute
                markets={markets}
                vendors={vendors}
                applications={applications}
                users={users}
                favoritedMarketIds={favoritedMarketIds}
                currentUser={currentUser}
                onToggleFavorite={handleToggleMarketFavorite}
                onAddReview={handleAddReview}
                onFeatureMarket={handleOpenFeatureMarketModal}
                onContactSubmit={handleContactSubmit}
                onApply={handleOpenApplicationForm}
              />
            } />
            <Route path="/vendors/:slug" element={
              <VendorProfileRoute
                vendors={vendors}
                markets={markets}
                users={users}
                favoritedVendorIds={favoritedVendorIds}
                currentUser={currentUser}
                onToggleFavorite={handleToggleVendorFavorite}
                onAddReview={handleAddReview}
                onFeatureVendor={handleOpenFeatureVendorModal}
                onContactSubmit={handleContactSubmit}
              />
            } />
            <Route path="/calendar" element={
              <CalendarView
                currentUser={currentUser}
                onSelectMarket={(id) => { const m = markets.find(m => m.id === id); if (m?.slug) navigate(`/markets/${m.slug}`); }}
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
                  showNotification(`Welcome to VI Markets, ${user.email}!`);
                  // Delay refetch to allow logo upload to complete before
                  // refreshing market/vendor data from Firestore
                  setTimeout(async () => {
                    try {
                      const [marketsData, vendorsData] = await Promise.all([
                        api.getMarkets(),
                        api.getVendors(),
                      ]);
                      setMarkets(marketsData);
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
                onSelectMarket={(id) => { const m = markets.find(m => m.id === id); if (m?.slug) navigate(`/markets/${m.slug}`); }}
                onSelectVendor={(id) => { const v = vendors.find(v => v.id === id); if (v?.slug) navigate(`/vendors/${v.slug}`); }}
                onBack={() => navigate('/')}
              />
            } />
            <Route path="/dashboard/my-market" element={
              currentUser && currentUser.ownedMarketId
                ? (() => {
                    const ownedMarket = markets.find(m => m.id === currentUser.ownedMarketId);
                    return ownedMarket ? (
                      <OrganizerHub
                        currentUser={currentUser}
                        market={ownedMarket}
                        onNavigateToProfile={() => navigate('/dashboard/profile')}
                        onBack={() => navigate('/')}
                      />
                    ) : <Navigate to="/" replace />;
                  })()
                : <Navigate to="/" replace />
            } />
            <Route path="/dashboard/profile" element={(() => {
              const profileData = ownedMarket || ownedVendor;
              if (!currentUser || !profileData) return <Navigate to="/" replace />;
              const reviewsToModerate = (profileData.reviews || []).filter(r => r.status === 'pending');
              const marketApplications = isMarket(profileData) ? applications.filter(app => app.marketId === profileData.id) : [];
              return (
                <ProfileManager
                  profileData={profileData}
                  user={currentUser}
                  allMarkets={markets}
                  applications={marketApplications}
                  vendors={vendors}
                  reviewsToModerate={reviewsToModerate}
                  onModerateReview={(reviewId, newStatus) => handleModerateReview(ownedMarket ? 'market' : 'vendor', profileData.id, reviewId, newStatus)}
                  onUpdateApplicationStatus={handleUpdateApplicationStatus}
                  onSaveChanges={handleUpdateProfile}
                  onToggleAutoRenew={(autoRenew) => handleToggleAutoRenew(currentUser.id, autoRenew)}
                  onBack={() => navigate(isMarket(profileData) ? '/dashboard/my-market' : '/')}
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
                />
              )
            } />
            <Route path="/dashboard/applications" element={(() => {
              if (!ownedVendor || !isProAccess(currentUser)) return <Navigate to="/" replace />;
              const vendorApps = applications.filter(app => app.vendorId === ownedVendor.id);
              return (
                <MyApplications
                  applications={vendorApps}
                  markets={markets}
                  onSelectMarket={(id) => { const m = markets.find(m => m.id === id); if (m?.slug) navigate(`/markets/${m.slug}`); }}
                  onBack={() => navigate('/')}
                />
              );
            })()} />
            <Route path="/dashboard/promotions" element={
              !currentUser || (!ownedMarket && !ownedVendor) || !isProAccess(currentUser) ? (
                <Navigate to="/" replace />
              ) : (
                <Promotions
                  ownedMarket={ownedMarket}
                  ownedVendor={ownedVendor}
                  onPurchasePromotion={handlePurchasePromotion}
                  onBack={() => navigate('/')}
                />
              )
            } />
            <Route path="/hq" element={
              !currentUser?.isAdmin ? <Navigate to="/" replace /> : (
                <AdminPanel
                  markets={markets}
                  vendors={vendors}
                  users={users}
                  onModerateReview={handleModerateReview}
                  onEditProfile={(profileId, profileType) => navigate(`/hq/edit/${profileType}/${profileId}`)}
                  onUpdateMemberStatus={handleUpdateMemberStatus}
                  onHardDeleteMember={handleHardDeleteMember}
                  onToggleFoundingMember={handleToggleFoundingMember}
                  onSendMessage={handleSendAdminMessage}
                  initialTab={adminActiveTab}
                  onTabChange={setAdminActiveTab}
                />
              )
            } />
            <Route path="/hq/edit/:profileType/:profileId" element={
              <AdminEditProfileRoute
                markets={markets}
                vendors={vendors}
                users={users}
                currentUser={currentUser}
                onSaveChanges={handleUpdateProfileAsAdmin}
              />
            } />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
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
                      body: JSON.stringify({ email: footerEmail, firstName: footerFirstName, city: footerCity }),
                    });
                    if (!res.ok) throw new Error();
                    showNotification("You're in! Thanks for joining, " + footerFirstName + "!");
                    setFooterFirstName('');
                    setFooterEmail('');
                    setFooterCity('');
                  } catch {
                    showNotification("Something went wrong. Please try again.");
                  }
                }}
                className="flex flex-col md:flex-row gap-2"
              >
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
        <LoginForm onLogin={handleLogin} onForgotPassword={() => { setLoginModalOpen(false); setForgotPasswordOpen(true); }}/>
      </Modal>
      <Modal
          isOpen={isForgotPasswordOpen}
          onClose={() => setForgotPasswordOpen(false)}
          title="Forgot Password"
          maxWidth="sm"
        >
        <ForgotPasswordForm onSendRecoveryEmail={(email) => { showNotification(`Recovery email sent to ${email}.`); setForgotPasswordOpen(false); }} />
      </Modal>
       <Modal 
        isOpen={isMembershipModalOpen} 
        onClose={() => {
            setMembershipModalOpen(false);
            setSelectedPlanForPayment(null);
        }} 
        title={selectedPlanForPayment ? `Payment for ${selectedPlanForPayment.description}`: "Membership Plans"}
        maxWidth="2xl"
       >
        {!selectedPlanForPayment ? (
            <MembershipForm onSelectPlan={(plan, amount, description) => setSelectedPlanForPayment({ plan, amount, description })} />
        ) : (
            <StripePaymentForm 
                amount={selectedPlanForPayment.amount}
                description={selectedPlanForPayment.description}
                onSuccess={() => handleUpgradeMembership(selectedPlanForPayment.plan)}
                onBack={() => setSelectedPlanForPayment(null)}
            />
        )}
      </Modal>
      {/* HIDDEN: Featured listings — not yet implemented, see Phase 3 */}
      {false && <Modal isOpen={isFeatureMarketModalOpen} onClose={() => setFeatureMarketModalOpen(false)} title={`Feature ${marketToFeature?.name}`}>
        <StripePaymentForm
          amount={15}
          description={`One-time fee to feature ${marketToFeature?.name}`}
          onSuccess={handleConfirmFeatureMarket}
          onBack={() => setFeatureMarketModalOpen(false)}
        />
      </Modal>}
      {false && <Modal isOpen={isFeatureVendorModalOpen} onClose={() => setFeatureVendorModalOpen(false)} title={`Feature ${vendorToFeature?.name}`}>
        <StripePaymentForm
          amount={10}
          description={`One-time fee to feature ${vendorToFeature?.name}`}
          onSuccess={handleConfirmFeatureVendor}
          onBack={() => setFeatureVendorModalOpen(false)}
        />
      </Modal>}
       <Modal isOpen={isPromotionModalOpen} onClose={() => setPromotionModalOpen(false)} title={`Purchase: ${selectedPromotion?.title}`}>
        {selectedPromotion && (
          <StripePaymentForm 
            amount={selectedPromotion.price}
            description={selectedPromotion.description}
            onSuccess={handleConfirmPromotion}
            onBack={() => setPromotionModalOpen(false)}
          />
        )}
      </Modal>
      <Modal isOpen={isApplicationFormOpen} onClose={() => setApplicationFormOpen(false)} title={`Apply to ${marketToApplyTo?.name}`}>
        {marketToApplyTo && ownedVendor && (
            <ApplicationForm
                market={marketToApplyTo}
                vendor={ownedVendor}
                onSubmit={handleApplyToMarket}
            />
        )}
      </Modal>


      {/* Global Alerts */}
      <NotificationToast message={notification} />
      <CookieConsentBanner isVisible={showCookieBanner} onAccept={handleCookieConsent} />
    </div>
  );
};

export default App;