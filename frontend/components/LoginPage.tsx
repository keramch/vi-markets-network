import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface LoginPageProps {
  onLogin: (creds: { email: string; password: string }) => void;
  onForgotPassword: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin, onForgotPassword }) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && password) onLogin({ email, password });
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-md">
      <button
        onClick={() => navigate(-1)}
        className="mb-6 text-brand-light-blue hover:text-brand-blue font-semibold"
      >
        &larr; Back
      </button>
      <div className="bg-white rounded-lg shadow-xl p-8">
        <h1 className="text-2xl font-serif text-brand-blue mb-6">Login to VI Markets</h1>
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
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-400 hover:text-gray-600"
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>
          <button
            type="submit"
            className="w-full bg-brand-blue text-white py-2 px-4 rounded-md hover:bg-opacity-90 transition-colors"
          >
            Sign In
          </button>
          <div className="text-center">
            <button
              type="button"
              onClick={onForgotPassword}
              className="text-sm text-brand-light-blue hover:underline"
            >
              Forgot Password?
            </button>
          </div>
        </form>
        <p className="mt-6 text-center text-sm text-gray-500">
          Don't have an account?{' '}
          <button
            type="button"
            onClick={() => navigate('/signup')}
            className="text-brand-blue hover:underline font-medium"
          >
            Join free
          </button>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
