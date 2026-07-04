import React, { useState } from 'react';
import { KeyIcon } from './Icons';
import PasswordInput from './PasswordInput';

interface ResetPasswordFormProps {
  email: string;
  onSubmit: (newPassword: string) => Promise<void>;
}

const ResetPasswordForm: React.FC<ResetPasswordFormProps> = ({ email, onSubmit }) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (password.length < 8) {
      setValidationError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setValidationError('Passwords do not match.');
      return;
    }
    setValidationError(null);

    setIsSubmitting(true);
    try {
      await onSubmit(password);
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm text-gray-600">
        Resetting password for <span className="font-medium text-gray-800">{email}</span>
      </p>
      <div>
        <label htmlFor="new-password" className="block text-sm font-medium text-gray-700">New Password</label>
        <PasswordInput
          id="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-3 px-3 focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm"
          required
        />
      </div>
      <div>
        <label htmlFor="confirm-new-password" className="block text-sm font-medium text-gray-700">Confirm New Password</label>
        <PasswordInput
          id="confirm-new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          autoComplete="new-password"
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-3 px-3 focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm"
          required
        />
      </div>
      {validationError && (
        <p className="text-red-500 text-xs mt-1">{validationError}</p>
      )}
      {submitError && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2 text-center">
          {submitError}
        </p>
      )}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-brand-blue text-white py-3 px-4 rounded-md hover:bg-opacity-90 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <KeyIcon className="w-5 h-5 mr-2" />
        {isSubmitting ? 'Updating Password...' : 'Set New Password'}
      </button>
    </form>
  );
};

export default ResetPasswordForm;
