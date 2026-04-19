import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { firebaseAuth, sendEmailVerification } from '../services/firebase';
import type { View, User } from '../types';
import { VendorTypes, MarketCategories } from '../types';
import * as api from '../services/api.live';
import { uploadImage } from '../services/storageUpload';
import ImageUploader from './ImageUploader';
import { CheckIcon } from './Icons';

// ── Types ────────────────────────────────────────────────────────────────────

type AccountType = 'vendor' | 'market';

interface SignupPageProps {
  onNavigate: (view: View) => void;
  onLogin: () => void;
  onSignupSuccess: (user: User) => void;
  isFoundingMemberOfferActive?: boolean; // kept for API compatibility, unused during beta
}

// ── Step indicator ────────────────────────────────────────────────────────────

const BETA_INVITE_CODE = import.meta.env.VITE_INVITE_CODE ?? '';
const TOTAL_STEPS = 4;

function StepDots({ step }: { step: number }) {
  return (
    <div className="flex items-center justify-center gap-3 mb-6">
      {Array.from({ length: TOTAL_STEPS }, (_, i) => {
        const n = i + 1;
        const done = n < step;
        const active = n === step;
        return (
          <React.Fragment key={n}>
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                done
                  ? 'bg-brand-gold text-white'
                  : active
                  ? 'bg-brand-blue text-white ring-4 ring-brand-blue/20'
                  : 'bg-gray-100 text-gray-400'
              }`}
            >
              {done ? <CheckIcon className="w-4 h-4" /> : n}
            </div>
            {i < TOTAL_STEPS - 1 && (
              <div
                className={`w-10 h-0.5 transition-colors ${
                  n < step ? 'bg-brand-gold' : 'bg-gray-200'
                }`}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ── Component ────────────────────────────────────────────────────────────────

const STEP_TITLES: Record<number, string> = {
  1: 'What brings you to VI Markets?',
  2: 'Before you continue',
  3: 'Create your account',
  4: 'Your profile basics',
};

const SignupPage: React.FC<SignupPageProps> = ({
  onLogin,
  onSignupSuccess,
}) => {
  const navigate = useNavigate();
  // Invite code gate
  const [inviteCode, setInviteCode] = useState('');
  const [inviteCodeError, setInviteCodeError] = useState('');
  const [inviteCodeVerified, setInviteCodeVerified] = useState(false);

  // Wizard navigation
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3 | 4>(1);
  const [isSuccess, setIsSuccess] = useState(false);

  // Step 1
  const [accountType, setAccountType] = useState<AccountType | null>(null);

  // Step 3 (account details)
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [googleMsg, setGoogleMsg] = useState('');
  const [errors3, setErrors3] = useState<Partial<Record<'firstName' | 'lastName' | 'email' | 'password', string>>>({});

  // Step 4 (profile)
  const [businessName, setBusinessName] = useState('');
  const [city] = useState('');
  const [description, setDescription] = useState('');
  const [logoFiles, setLogoFiles] = useState<File[]>([]);
  const [marketTypes, setMarketTypes] = useState<string[]>([]);
  const [vendorTypes, setVendorTypes] = useState<string[]>([]);
  const [errors4, setErrors4] = useState<Partial<Record<'businessName' | 'city', string>>>({});

  // Submission
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [resendSent, setResendSent] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // ── Validation ────────────────────────────────────────────────────────────

  const validate = (): boolean => {
    if (wizardStep === 1) return accountType !== null;
    if (wizardStep === 2) return true; // agreements — consent given by clicking the button
    if (wizardStep === 3) {
      const e: typeof errors3 = {};
      if (!firstName.trim()) e.firstName = 'First name is required';
      if (!lastName.trim()) e.lastName = 'Last name is required';
      if (!/\S+@\S+\.\S+/.test(email.trim())) e.email = 'Enter a valid email address';
      if (password.length < 8) e.password = 'Password must be at least 8 characters';
      setErrors3(e);
      return Object.keys(e).length === 0;
    }
    if (wizardStep === 4) {
      const e: typeof errors4 = {};
      if (!businessName.trim())
        e.businessName = accountType === 'market' ? 'Market name is required' : 'Business name is required';
      setErrors4(e);
      return Object.keys(e).length === 0;
    }
    return true;
  };

  const handleResendVerification = async () => {
    const firebaseUser = firebaseAuth.currentUser;
    if (firebaseUser) {
      await sendEmailVerification(firebaseUser, {
        url: 'https://vimarkets.ca/?verified=true',
        handleCodeInApp: false,
      });
      setResendSent(true);
    }
  };

  const goNext = async () => {
    if (!validate()) return;
    if (wizardStep === 4) {
      setIsSubmitting(true);
      setSubmitError('');
      try {
        const user = await api.register({
          email: email.trim(),
          password,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          accountType: accountType!,
          businessName: businessName.trim(),
          city: city.trim(),
          description: description.trim() || undefined,
          vendorTypes: accountType === 'vendor' && vendorTypes.length > 0 ? vendorTypes : undefined,
          marketCategories: accountType === 'market' && marketTypes.length > 0 ? marketTypes : undefined,
        });
        await signInWithEmailAndPassword(firebaseAuth, email.trim(), password);
        // Send verification email
        const firebaseUser = firebaseAuth.currentUser;
        if (firebaseUser) {
          await sendEmailVerification(firebaseUser, {
            url: 'https://vimarkets.ca/?verified=true',
            handleCodeInApp: false,
          });
        }
        onSignupSuccess(user);
        setIsSuccess(true);
        window.scrollTo(0, 0);

        // Upload logo — blocks the "Go to Your Hub" button until complete
        if (logoFiles[0]) {
          const profileType = accountType === 'vendor' ? 'vendors' : 'markets';
          const profileId = accountType === 'vendor' ? user.ownedVendorId : user.ownedMarketId;
          if (profileId) {
            setIsUploadingLogo(true);
            try {
              const ext = logoFiles[0].name.split('.').pop() ?? 'jpg';
              const path = `${profileType}/${profileId}/logo_${Date.now()}.${ext}`;
              const logoUrl = await uploadImage(logoFiles[0], path);
              if (accountType === 'vendor') {
                await api.updateVendor(profileId, { logoUrl });
              } else {
                await api.updateMarket(profileId, { logoUrl });
              }
            } catch (err) {
              console.error('Logo upload failed after signup:', err);
            } finally {
              setIsUploadingLogo(false);
            }
          }
        }
      } catch (err) {
        setSubmitError(err instanceof Error ? err.message : 'Registration failed. Please try again.');
      } finally {
        setIsSubmitting(false);
      }
    } else {
      setWizardStep((s) => (s + 1) as 1 | 2 | 3 | 4);
    }
  };

  const goBack = () => {
    if (wizardStep > 1) setWizardStep((s) => (s - 1) as 1 | 2 | 3 | 4);
  };

  const handleStepEnter = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') goNext();
  };

  // ── Shared style tokens ───────────────────────────────────────────────────

  const inputCls =
    'w-full border border-gray-300 rounded-lg py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue transition-colors';
  const labelCls = 'block text-sm font-medium text-gray-700 mb-1';
  const errCls = 'text-red-500 text-xs mt-1';

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <main className="min-h-screen bg-brand-cream">
      {/* Hero */}
      <div id="pagetop-header" className="bg-brand-blue text-white py-12 px-4 text-center">
        <h1 className="text-4xl font-extrabold font-serif mb-2">Join VI Markets</h1>
        <p className="text-brand-teal-light text-lg">
          Connect with local markets and shoppers across Vancouver Island
        </p>
      </div>

      <div className="container mx-auto px-4 py-10 max-w-2xl">

        {/* ── Invite code gate ──────────────────────────────────────────── */}
        {!inviteCodeVerified && (
          <div className="bg-white rounded-2xl shadow-lg p-6 md:p-10 mb-6">
            <h2 className="text-2xl font-serif text-brand-blue text-center mb-2">
              Enter Your Invite Code
            </h2>
            <p className="text-center text-sm text-gray-500 mb-6">
              VI Markets Network is currently invite-only.
            </p>
            <div className="mb-1">
              <label className={labelCls}>Invite Code</label>
              <input
                type="password"
                value={inviteCode}
                onChange={(e) => { setInviteCode(e.target.value.toUpperCase()); setInviteCodeError(''); }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    if (inviteCode.trim() === BETA_INVITE_CODE) {
                      setInviteCodeVerified(true);
                    } else {
                      setInviteCodeError('Invalid invite code. VI Markets Network is currently invite-only.');
                    }
                  }
                }}
                className={inputCls}
                placeholder="Enter your invite code"
                autoComplete="off"
              />
              {inviteCodeError && <p className={errCls}>{inviteCodeError}</p>}
              <p className="text-xs text-gray-400 mt-1.5">
                Don't have an invite code?{' '}
                <a href="https://vimarkets.ca" target="_blank" rel="noopener noreferrer" className="text-brand-blue hover:underline">
                  Join the waitlist at vimarkets.ca
                </a>
              </p>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  if (inviteCode.trim() === BETA_INVITE_CODE) {
                    setInviteCodeVerified(true);
                  } else {
                    setInviteCodeError('Invalid invite code. VI Markets Network is currently invite-only.');
                  }
                }}
                className="bg-brand-blue text-white font-semibold px-8 py-3 rounded-full hover:bg-brand-blue/90 transition-colors"
              >
                Continue →
              </button>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-lg">
          {!inviteCodeVerified ? null : !isSuccess ? (
            <div className="p-6 md:p-10">
              {/* Step counter + dots */}
              <p className="text-center text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
                Step {wizardStep} of {TOTAL_STEPS}
              </p>
              <StepDots step={wizardStep} />
              <h2 className="text-2xl font-serif text-brand-blue text-center mb-8">
                {STEP_TITLES[wizardStep]}
              </h2>

              {/* ── Step 1: Account type ─────────────────────────────────── */}
              {wizardStep === 1 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" onKeyDown={handleStepEnter}>
                  {(
                    [
                      {
                        type: 'vendor' as AccountType,
                        emoji: '🧺',
                        title: 'Vendor / Maker',
                        desc: 'I sell products — food, crafts, art, or other goods — at markets.',
                      },
                      {
                        type: 'market' as AccountType,
                        emoji: '🏪',
                        title: 'Market Organizer',
                        desc: 'I run or organize a market and want to list it for vendors and shoppers.',
                      },
                    ] as const
                  ).map(({ type, emoji, title, desc }) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setAccountType(type)}
                      className={`text-left p-6 rounded-xl border-2 transition-all ${
                        accountType === type
                          ? 'border-brand-blue bg-brand-blue/5 ring-2 ring-brand-blue/20'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="text-4xl mb-3">{emoji}</div>
                      <h3
                        className={`font-bold text-lg mb-1 ${
                          accountType === type ? 'text-brand-blue' : 'text-gray-800'
                        }`}
                      >
                        {title}
                      </h3>
                      <p className="text-sm text-gray-500">{desc}</p>
                      {accountType === type && (
                        <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-brand-blue">
                          <CheckIcon className="w-3.5 h-3.5" /> Selected
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}

              {/* ── Step 2: Agreements ───────────────────────────────────── */}
              {wizardStep === 2 && (
                <div className="space-y-5">
                  <p className="text-gray-600 text-sm text-center -mt-4 mb-2">
                    By creating a VI Markets account you agree to a few simple things:
                  </p>
                  <ul className="space-y-3">
                    {[
                      'Your profile information should be accurate and kept up to date',
                      'Be respectful — this is a community platform',
                      "VI Markets is a directory and toolset — we're not responsible for outcomes between markets, vendors, or the public",
                      'Free accounts are free forever. Paid subscriptions renew automatically unless you choose manual renewal',
                      'You can cancel or delete your account any time',
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-3">
                        <span className="text-brand-gold mt-0.5 flex-shrink-0">✓</span>
                        <span className="text-gray-700 text-sm">{item}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="text-sm text-gray-500 pt-1">
                    Want to read the full details?{' '}
                    <Link
                      to="/terms"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-brand-blue hover:underline"
                    >
                      Terms of Use
                    </Link>
                    {', '}
                    <Link
                      to="/member-agreement"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-brand-blue hover:underline"
                    >
                      Member Agreement
                    </Link>
                    {', '}
                    <Link
                      to="/privacy"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-brand-blue hover:underline"
                    >
                      Privacy Policy
                    </Link>
                  </p>
                </div>
              )}

              {/* ── Step 3: Create account ───────────────────────────────── */}
              {wizardStep === 3 && (
                <div className="space-y-4">
                  {/* Google sign-in */}
                  <button
                    type="button"
                    onClick={() =>
                      setGoogleMsg(
                        'Google sign-in requires Firebase Auth — coming soon! Please use email & password below.'
                      )
                    }
                    className="w-full flex items-center justify-center gap-3 border border-gray-300 rounded-lg py-2.5 px-4 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <svg viewBox="0 0 24 24" className="w-5 h-5 flex-shrink-0">
                      <path
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        fill="#4285F4"
                      />
                      <path
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        fill="#34A853"
                      />
                      <path
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        fill="#FBBC05"
                      />
                      <path
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        fill="#EA4335"
                      />
                    </svg>
                    Continue with Google
                  </button>

                  {googleMsg && (
                    <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-center">
                      {googleMsg}
                    </p>
                  )}

                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-px bg-gray-200" />
                    <span className="text-xs text-gray-400">or continue with email</span>
                    <div className="flex-1 h-px bg-gray-200" />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls}>First Name</label>
                      <input
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        onKeyDown={handleStepEnter}
                        className={inputCls}
                        placeholder="Jane"
                        autoComplete="given-name"
                      />
                      {errors3.firstName && <p className={errCls}>{errors3.firstName}</p>}
                    </div>
                    <div>
                      <label className={labelCls}>Last Name</label>
                      <input
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        onKeyDown={handleStepEnter}
                        className={inputCls}
                        placeholder="Smith"
                        autoComplete="family-name"
                      />
                      {errors3.lastName && <p className={errCls}>{errors3.lastName}</p>}
                    </div>
                  </div>

                  <div>
                    <label className={labelCls}>Email Address</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onKeyDown={handleStepEnter}
                      className={inputCls}
                      placeholder="jane@example.com"
                      autoComplete="email"
                    />
                    {errors3.email && <p className={errCls}>{errors3.email}</p>}
                  </div>

                  <div>
                    <label className={labelCls}>Password</label>
                    <div className="relative">
                      <input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onKeyDown={handleStepEnter}
                        className={`${inputCls} pr-14`}
                        placeholder="At least 8 characters"
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        tabIndex={-1}
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? 'Hide' : 'Show'}
                      </button>
                    </div>
                    {errors3.password && <p className={errCls}>{errors3.password}</p>}
                  </div>
                </div>
              )}

              {/* ── Step 4: Basic profile ────────────────────────────────── */}
              {wizardStep === 4 && (
                <div className="space-y-5">
                  <div>
                    <label className={labelCls}>
                      {accountType === 'market' ? 'Organization Name' : 'Business / Stall Name'}
                    </label>
                    <input
                      type="text"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      onKeyDown={handleStepEnter}
                      className={inputCls}
                      placeholder={
                        accountType === 'market'
                          ? 'e.g. Elevate Arts Society, Saanich Peninsula Food Hub'
                          : 'e.g. Green Thumb Organics'
                      }
                    />
                    {accountType === 'market' && (
                      <p className="text-xs text-gray-400 mt-1">
                        This is your organizing entity's name — you'll create individual market events within your profile.
                      </p>
                    )}
                    {errors4.businessName && <p className={errCls}>{errors4.businessName}</p>}
                  </div>

                  {accountType === 'market' && (
                    <div>
                      <label className={labelCls}>Market Type</label>
                      <p className="text-xs text-gray-400 mb-2">Select the types that describe the markets you organize.</p>
                      {marketTypes.length >= 3 && (
                        <p className="text-xs text-amber-600 mb-2">Maximum 3 types selected.</p>
                      )}
                      <div className="grid grid-cols-1 gap-2">
                        {Object.values(MarketCategories).map(cat => (
                          <label key={cat} className="flex items-center">
                            <input
                              type="checkbox"
                              value={cat}
                              checked={marketTypes.includes(cat)}
                              disabled={!marketTypes.includes(cat as string) && marketTypes.length >= 3}
                              onChange={(e) => {
                                const { value, checked } = e.target;
                                setMarketTypes(prev => checked ? [...prev, value] : prev.filter(t => t !== value));
                              }}
                              className="h-4 w-4 border-gray-300 text-brand-blue focus:ring-brand-gold"
                            />
                            <span className="ml-2 text-sm text-gray-600">{cat}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  {accountType === 'vendor' && (
                    <div>
                      <label className={labelCls}>Vendor Type</label>
                      <p className="text-xs text-gray-400 mb-2">Select all that apply — you can update this later.</p>
                      {vendorTypes.length >= 3 && (
                        <p className="text-xs text-amber-600 mb-2">Maximum 3 types selected.</p>
                      )}
                      <div className="grid grid-cols-2 gap-2">
                        {(VendorTypes as readonly string[]).map(vt => (
                          <label key={vt} className="flex items-center">
                            <input
                              type="checkbox"
                              value={vt}
                              checked={vendorTypes.includes(vt)}
                              disabled={!vendorTypes.includes(vt) && vendorTypes.length >= 3}
                              onChange={(e) => {
                                const { value, checked } = e.target;
                                setVendorTypes(checked ? [...vendorTypes, value] : vendorTypes.filter(t => t !== value));
                              }}
                              className="h-4 w-4 rounded border-gray-300 text-brand-blue focus:ring-brand-gold"
                            />
                            <span className="ml-2 text-sm text-gray-600">{vt}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                  {accountType === 'vendor' && (
                    <p className="text-xs text-gray-400 mt-2">
                      You'll be able to add detailed tags to your profile after you're registered.
                    </p>
                  )}


                  <ImageUploader
                    id="signup-logo"
                    label="Logo — optional, you can add this later"
                    onFilesChanged={setLogoFiles}
                    maxFiles={1}
                    maxSizeKB={5120}
                    allowedTypes={['image/jpeg', 'image/png']}
                    aspectRatio="1:1 (Square)"
                  />

                  <div>
                    <label className={labelCls}>
                      Short Description{' '}
                      <span className="text-gray-400 font-normal">(optional)</span>
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') e.stopPropagation(); }}
                      rows={3}
                      className={`${inputCls} resize-none`}
                      placeholder={
                        accountType === 'market'
                          ? 'Tell vendors and shoppers what your organization does...'
                          : 'Tell shoppers what you make or sell...'
                      }
                    />
                  </div>
                </div>
              )}

              {/* ── Navigation buttons ───────────────────────────────────── */}
              {submitError && (
                <p className="mt-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2 text-center">
                  {submitError}
                </p>
              )}
              <div className="flex items-center justify-between mt-4 pt-6 border-t border-gray-100">
                {wizardStep > 1 ? (
                  <button
                    type="button"
                    onClick={goBack}
                    disabled={isSubmitting}
                    className="text-sm text-gray-500 hover:text-gray-700 font-medium flex items-center gap-1 disabled:opacity-40"
                  >
                    ← Back
                  </button>
                ) : (
                  <div />
                )}
                <button
                  type="button"
                  onClick={goNext}
                  disabled={(wizardStep === 1 && accountType === null) || isSubmitting}
                  className="bg-brand-blue text-white font-semibold px-8 py-3 rounded-full hover:bg-brand-blue/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {isSubmitting
                    ? 'Creating…'
                    : wizardStep === 2
                    ? 'I agree — Continue'
                    : wizardStep === 4
                    ? 'Create Profile'
                    : 'Continue →'}
                </button>
              </div>
            </div>
          ) : (
            /* ── Success screen ─────────────────────────────────────────── */
            <div className="p-6 md:p-14 text-center">
              <div className="text-6xl mb-5">🎉</div>
              <h2 className="text-3xl font-extrabold font-serif text-brand-blue mb-3">
                Welcome to VI Markets!
              </h2>
              <p className="text-gray-600 text-lg mb-2">You're all set, {firstName}.</p>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4 text-sm text-amber-800 text-left max-w-sm mx-auto">
                <p className="font-semibold mb-1">Please verify your email</p>
                <p>We've sent a verification link to <strong>{email}</strong>. Please check your inbox and click the link to verify your account.</p>
              </div>
              <div className="mb-8">
                {!resendSent
                  ? <button type="button" onClick={handleResendVerification} className="text-xs text-amber-700 underline hover:no-underline">Resend verification email</button>
                  : <p className="text-xs text-amber-700">Verification email resent.</p>
                }
              </div>
              <button
                type="button"
                onClick={() => navigate('/dashboard/profile')}
                disabled={isUploadingLogo}
                className="bg-brand-blue text-white font-semibold px-10 py-3 rounded-full hover:bg-brand-blue/90 transition-colors text-lg disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isUploadingLogo ? 'Finishing up…' : 'Go to Your Hub →'}
              </button>
            </div>
          )}
        </div>

        {/* Sign-in link */}
        {!isSuccess && (
          <p className="text-center text-sm text-gray-500 mt-5">
            Already have an account?{' '}
            <button
              type="button"
              onClick={onLogin}
              className="text-brand-blue font-medium hover:underline"
            >
              Sign in here
            </button>
          </p>
        )}
      </div>
    </main>
  );
};

export default SignupPage;
