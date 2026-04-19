
import React, { useState } from 'react';
import type { NotificationSettings, User } from '../types';
import { SettingsIcon } from './Icons';
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { firebaseAuth } from '../services/firebase';
import * as api from '../services/api.live';

interface NotificationSettingsProps {
  settings: NotificationSettings;
  onSave: (newSettings: NotificationSettings) => void;
  onBack: () => void;
  currentUser: User;
  onSaveCity: (city: string) => Promise<void>;
}

const ToggleSwitch: React.FC<{
  label: string;
  description: string;
  enabled: boolean;
  onChange: (enabled: boolean) => void;
}> = ({ label, description, enabled, onChange }) => (
  <div className="flex items-center justify-between py-4 border-b">
    <div>
      <h3 className="text-lg font-semibold text-brand-blue">{label}</h3>
      <p className="text-sm text-gray-500">{description}</p>
    </div>
    <button
      type="button"
      className={`${
        enabled ? 'bg-brand-blue' : 'bg-gray-200'
      } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-brand-gold focus:ring-offset-2`}
      role="switch"
      aria-checked={enabled}
      onClick={() => onChange(!enabled)}
    >
      <span
        aria-hidden="true"
        className={`${
          enabled ? 'translate-x-5' : 'translate-x-0'
        } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
      />
    </button>
  </div>
);

const NotificationSettingsComponent: React.FC<NotificationSettingsProps> = ({ settings, onSave, onBack, currentUser, onSaveCity }) => {
  const [currentSettings, setCurrentSettings] = useState(settings);
  const [city, setCity] = useState(currentUser.city ?? '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [citySuccess, setCitySuccess] = useState(false);
  const [isSavingCity, setIsSavingCity] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const handleSettingChange = (key: keyof NotificationSettings, value: boolean) => {
    setCurrentSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSaveChanges = () => {
    onSave(currentSettings);
  };

  const handleSaveCity = async () => {
    setIsSavingCity(true);
    try {
      await onSaveCity(city.trim());
      setCitySuccess(true);
      setTimeout(() => setCitySuccess(false), 3000);
    } catch (err) {
      console.error('Failed to save city:', err);
    } finally {
      setIsSavingCity(false);
    }
  };

  const handleChangePassword = async () => {
    setPasswordError('');
    setPasswordSuccess('');
    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }
    const firebaseUser = firebaseAuth.currentUser;
    if (!firebaseUser) {
      setPasswordError('Not logged in');
      return;
    }
    setIsChangingPassword(true);
    try {
      const credential = EmailAuthProvider.credential(firebaseUser.email!, currentPassword);
      await reauthenticateWithCredential(firebaseUser, credential);
      await updatePassword(firebaseUser, newPassword);
      setPasswordSuccess('Password updated.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setPasswordError('Current password is incorrect');
      } else {
        setPasswordError('Password change failed. Please try again.');
      }
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-8">
            <h1 className="text-4xl font-serif text-brand-blue flex items-center">
                <SettingsIcon className="w-8 h-8 mr-4 text-brand-light-blue" />
                Settings
            </h1>
             <button onClick={onBack} className="text-brand-light-blue hover:text-brand-blue font-semibold">
                &larr; Back to home
            </button>
        </div>

        <div className="bg-white p-8 rounded-lg shadow-xl mb-6">
          <h2 className="text-xl font-serif text-brand-blue mb-6">Account Settings</h2>

          {/* City */}
          <div className="pb-6 border-b mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">Your City</label>
            <p className="text-xs text-gray-400 mb-2">Used to understand where our community is active. Optional.</p>
            <div className="flex gap-3 items-center">
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="border border-gray-300 rounded-lg py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue transition-colors w-64"
                placeholder="e.g. Courtenay, Nanaimo, Victoria"
              />
              <button
                type="button"
                onClick={handleSaveCity}
                disabled={isSavingCity}
                className="bg-brand-blue text-white text-sm font-semibold px-4 py-2.5 rounded-lg hover:bg-brand-blue/90 transition-colors disabled:opacity-50"
              >
                {isSavingCity ? 'Saving…' : 'Save'}
              </button>
              {citySuccess && <span className="text-sm text-green-600">Saved!</span>}
            </div>
          </div>

          {/* Change Password */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">Change Password</h3>
            <div className="space-y-3 max-w-sm">
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Current password"
                className="w-full border border-gray-300 rounded-lg py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue transition-colors"
              />
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="New password (min 8 characters)"
                className="w-full border border-gray-300 rounded-lg py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue transition-colors"
              />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                className="w-full border border-gray-300 rounded-lg py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue transition-colors"
              />
              {passwordError && <p className="text-red-500 text-xs">{passwordError}</p>}
              {passwordSuccess && <p className="text-green-600 text-xs">{passwordSuccess}</p>}
              <button
                type="button"
                onClick={handleChangePassword}
                disabled={isChangingPassword || !currentPassword || !newPassword || !confirmPassword}
                className="bg-brand-blue text-white text-sm font-semibold px-4 py-2.5 rounded-lg hover:bg-brand-blue/90 transition-colors disabled:opacity-50"
              >
                {isChangingPassword ? 'Updating…' : 'Update Password'}
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white p-8 rounded-lg shadow-xl">
          <p className="mb-6 text-gray-600">
            Choose what you want to be notified about. These settings will apply to push notifications on your mobile device.
          </p>
          
          <div className="space-y-4">
            <ToggleSwitch
              label="Favorited Market Reminders"
              description="Get an alert when a market you've favorited is open today."
              enabled={currentSettings.favoriteMarket}
              onChange={(value) => handleSettingChange('favoriteMarket', value)}
            />
            <ToggleSwitch
              label="Favorited Vendor Updates"
              description="Get an alert when a vendor you've favorited is at a market today."
              enabled={currentSettings.favoriteVendor}
              onChange={(value) => handleSettingChange('favoriteVendor', value)}
            />
             <ToggleSwitch
              label="Nearby Market Alerts"
              description="Receive a notification when you are near any market that is currently open. This uses your device's location."
              enabled={currentSettings.nearbyMarket}
              onChange={(value) => handleSettingChange('nearbyMarket', value)}
            />
          </div>

          <div className="mt-8 pt-6 border-t flex justify-end">
            <button
              onClick={handleSaveChanges}
              className="bg-brand-blue text-white font-semibold py-2 px-6 rounded-md hover:bg-opacity-90 transition-colors"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationSettingsComponent;
