import React, { useState } from 'react';
import { SendIcon } from './Icons';

interface ForgotPasswordFormProps {
  onSendRecoveryEmail: (email: string) => void;
}

const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({ onSendRecoveryEmail }) => {
  const [email, setEmail] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      onSendRecoveryEmail(email);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm text-gray-600">
        Enter the email address associated with your account, and we'll send you a link to reset your password.
      </p>
      <div>
        <label htmlFor="recovery-email" className="block text-sm font-medium text-gray-700">Email Address</label>
        <input
          id="recovery-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-3 px-3 focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm"
          required
        />
      </div>
      <button type="submit" className="w-full bg-brand-blue text-white py-3 px-4 rounded-md hover:bg-opacity-90 transition-colors flex items-center justify-center">
        <SendIcon className="w-5 h-5 mr-2" />
        Send Recovery Email
      </button>
    </form>
  );
};

export default ForgotPasswordForm;
