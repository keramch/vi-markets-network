import React, { useState } from 'react';
import type { View, User } from '../types';
import * as api from '../services/api.live';
import ImageUploader from './ImageUploader';
import { CheckIcon } from './Icons';

// ── Types ────────────────────────────────────────────────────────────────────

type AccountType = 'vendor' | 'market';
type PlanKey = 'free' | 'standard' | 'pro' | 'founding';

interface SignupPageProps {
  onNavigate: (view: View) => void;
  onLogin: () => void;
  onSignupSuccess: (user: User) => void;
  isFoundingMemberOfferActive?: boolean;
}

// ── Plan definitions ─────────────────────────────────────────────────────────

interface PlanDef {
  label: string;
  price: string;
  period: string;
  tagline: string;
  features: string[];
  badge?: string;
}

const PLANS: Record<PlanKey, PlanDef> = {
  free: {
    label: 'Free',
    price: '$0',
    period: 'forever',
    tagline: 'Get started at no cost',
    features: [
      'Basic profile with photos',
      'Visible in search & discovery',
      'Community member access',
      'Connect with local shoppers',
    ],
  },
  standard: {
    label: 'Standard',
    price: '$5',
    period: '/month',
    tagline: 'Grow your presence',
    features: [
      'Everything in Free',
      'Priority search placement',
      'Featured badge on profile',
      'Monthly analytics summary',
    ],
  },
  pro: {
    label: 'Pro',
    price: '$12',
    period: '/month',
    tagline: 'Full power tools',
    features: [
      'Everything in Standard',
      'Application management',
      'Promotional campaigns',
      'Priority support',
    ],
    badge: 'Most Popular',
  },
  founding: {
    label: 'Founding Member',
    price: '$7',
    period: '/month',
    tagline: 'Rate locked in for life',
    features: [
      'All Pro features, forever',
      'Exclusive Founding Member badge',
      'First access to new features',
      'Price locked in permanently',
    ],
  },
};

// ── Step indicator ────────────────────────────────────────────────────────────

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
  2: 'Choose your plan',
  3: 'Create your account',
  4: 'Your profile basics',
};

const SignupPage: React.FC<SignupPageProps> = ({
  onNavigate,
  onLogin,
  onSignupSuccess,
  isFoundingMemberOfferActive = false,
}) => {
  // Wizard navigation
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3 | 4>(1);
  const [isSuccess, setIsSuccess] = useState(false);

  // Step 1
  const [accountType, setAccountType] = useState<AccountType | null>(null);

  // Step 2
  const [selectedPlan, setSelectedPlan] = useState<PlanKey>('free');

  // Step 3
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [googleMsg, setGoogleMsg] = useState('');
  const [errors3, setErrors3] = useState<Partial<Record<'firstName' | 'lastName' | 'email' | 'password', string>>>({});

  // Step 4
  const [businessName, setBusinessName] = useState('');
  const [city, setCity] = useState('');
  const [description, setDescription] = useState('');
  const [logoFiles, setLogoFiles] = useState<File[]>([]);
  const [errors4, setErrors4] = useState<Partial<Record<'businessName' | 'city', string>>>({});

  // Submission
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // ── Validation ────────────────────────────────────────────────────────────

  const validate = (): boolean => {
    if (wizardStep === 1) return accountType !== null;
    if (wizardStep === 2) return true;
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
      if (!city.trim()) e.city = 'City is required';
      setErrors4(e);
      return Object.keys(e).length === 0;
    }
    return true;
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
          plan: selectedPlan,
        });
        onSignupSuccess(user);
        setIsSuccess(true);
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

  // ── Shared style tokens ───────────────────────────────────────────────────

  const inputCls =
    'w-full border border-gray-300 rounded-lg py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue transition-colors';
  const labelCls = 'block text-sm font-medium text-gray-700 mb-1';
  const errCls = 'text-red-500 text-xs mt-1';

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <main className="min-h-screen bg-brand-cream">
      {/* Hero */}
      <div className="bg-brand-blue text-white py-12 px-4 text-center">
        <h1 className="text-4xl font-extrabold font-serif mb-2">Join VI Markets</h1>
        <p className="text-brand-light-blue text-lg">
          Connect with local markets and shoppers across Vancouver Island
        </p>
      </div>

      <div className="container mx-auto px-4 py-10 max-w-2xl">
        <div className="bg-white rounded-2xl shadow-lg">
          {!isSuccess ? (
            <div className="p-6 md:p-10">
              {/* Step counter + dots */}
              <p className="text-center text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
                Step {wizardStep} of {TOTAL_STEPS}
              </p>
              <StepDots step={wizardStep} />
              <h2 className="text-2xl font-bold font-serif text-brand-blue text-center mb-8">
                {STEP_TITLES[wizardStep]}
              </h2>

              {/* ── Step 1: Account type ─────────────────────────────────── */}
              {wizardStep === 1 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

              {/* ── Step 2: Plans ────────────────────────────────────────── */}
              {wizardStep === 2 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {(['free', 'standard', 'pro'] as PlanKey[]).map((key) => {
                      const plan = PLANS[key];
                      const isSelected = selectedPlan === key;
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setSelectedPlan(key)}
                          className={`relative text-left p-4 rounded-xl border-2 transition-all flex flex-col ${
                            isSelected
                              ? 'border-brand-blue bg-brand-blue/5 ring-2 ring-brand-blue/20'
                              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {plan.badge && (
                            <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-brand-gold text-white text-xs font-bold px-2.5 py-0.5 rounded-full whitespace-nowrap">
                              {plan.badge}
                            </span>
                          )}
                          <div className="font-bold text-gray-800 mb-1">{plan.label}</div>
                          <div className="mb-1">
                            <span
                              className={`text-2xl font-extrabold ${
                                isSelected ? 'text-brand-blue' : 'text-gray-800'
                              }`}
                            >
                              {plan.price}
                            </span>
                            <span className="text-xs text-gray-500 ml-1">{plan.period}</span>
                          </div>
                          <p className="text-xs text-gray-500 mb-3">{plan.tagline}</p>
                          <ul className="space-y-1.5 mt-auto">
                            {plan.features.map((f) => (
                              <li key={f} className="flex items-start gap-1.5 text-xs text-gray-600">
                                <CheckIcon
                                  className={`w-3.5 h-3.5 flex-shrink-0 mt-0.5 ${
                                    isSelected ? 'text-brand-blue' : 'text-brand-gold'
                                  }`}
                                />
                                {f}
                              </li>
                            ))}
                          </ul>
                          {isSelected && (
                            <p className="mt-3 text-xs font-semibold text-brand-blue">✓ Selected</p>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Founding Member highlight card */}
                  {isFoundingMemberOfferActive && (
                    <button
                      type="button"
                      onClick={() => setSelectedPlan('founding')}
                      className={`w-full text-left p-5 rounded-xl border-2 transition-all ${
                        selectedPlan === 'founding'
                          ? 'border-brand-gold bg-amber-50 ring-2 ring-brand-gold/30'
                          : 'border-brand-gold/50 bg-amber-50/50 hover:bg-amber-50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-grow">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <span className="text-lg">⭐</span>
                            <span className="font-bold text-brand-blue">Founding Member Offer</span>
                            <span className="bg-brand-gold text-white text-xs font-bold px-2 py-0.5 rounded-full">
                              Limited Time
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-3">
                            Lock in all Pro features at{' '}
                            <strong className="text-brand-blue">$7/month — forever.</strong> Only
                            available to early members.
                          </p>
                          <ul className="grid grid-cols-2 gap-x-4 gap-y-1">
                            {PLANS.founding.features.map((f) => (
                              <li key={f} className="flex items-center gap-1.5 text-xs text-gray-600">
                                <CheckIcon className="w-3 h-3 text-brand-gold flex-shrink-0" />
                                {f}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="text-2xl font-extrabold text-brand-blue">$7</div>
                          <div className="text-xs text-gray-500">/month</div>
                        </div>
                      </div>
                      {selectedPlan === 'founding' && (
                        <p className="mt-2 text-xs font-semibold text-brand-gold">✓ Selected</p>
                      )}
                    </button>
                  )}

                  <p className="text-center text-xs text-gray-400 pt-1">
                    Not sure?{' '}
                    <button
                      type="button"
                      onClick={() => onNavigate({ type: 'home' })}
                      className="text-brand-blue hover:underline"
                    >
                      See full pricing details
                    </button>
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
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
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
                      {accountType === 'market' ? 'Market Name' : 'Business / Stall Name'}
                    </label>
                    <input
                      type="text"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      className={inputCls}
                      placeholder={
                        accountType === 'market'
                          ? 'e.g. Saanich Farmers Market'
                          : 'e.g. Green Thumb Organics'
                      }
                    />
                    {errors4.businessName && <p className={errCls}>{errors4.businessName}</p>}
                  </div>

                  <div>
                    <label className={labelCls}>City / Location</label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className={inputCls}
                      placeholder="e.g. Victoria, BC"
                    />
                    {errors4.city && <p className={errCls}>{errors4.city}</p>}
                  </div>

                  <ImageUploader
                    id="signup-logo"
                    label="Logo — optional, you can add this later"
                    onFilesChanged={setLogoFiles}
                    maxFiles={1}
                    maxSizeKB={2048}
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
                      rows={3}
                      className={`${inputCls} resize-none`}
                      placeholder={
                        accountType === 'market'
                          ? 'Tell vendors and shoppers what makes your market special...'
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
                  {isSubmitting ? 'Creating…' : wizardStep === 4 ? 'Create Profile' : 'Continue →'}
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
              <p className="text-gray-500 mb-8 max-w-sm mx-auto">
                An email is on its way to{' '}
                <strong className="text-gray-700">{email}</strong> with your account details and
                next steps.
              </p>
              <button
                type="button"
                onClick={() => onNavigate({ type: 'manageProfile' })}
                className="bg-brand-blue text-white font-semibold px-10 py-3 rounded-full hover:bg-brand-blue/90 transition-colors text-lg"
              >
                Go to Your Hub →
              </button>
              <p className="mt-4 text-xs text-gray-400">
                Didn't receive it? Check your spam folder or contact support.
              </p>
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
