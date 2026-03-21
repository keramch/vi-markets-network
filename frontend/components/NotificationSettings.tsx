
import React, { useState } from 'react';
import type { NotificationSettings } from '../types';
import { SettingsIcon } from './Icons';

interface NotificationSettingsProps {
  settings: NotificationSettings;
  onSave: (newSettings: NotificationSettings) => void;
  onBack: () => void;
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

const NotificationSettingsComponent: React.FC<NotificationSettingsProps> = ({ settings, onSave, onBack }) => {
  const [currentSettings, setCurrentSettings] = useState(settings);

  const handleSettingChange = (key: keyof NotificationSettings, value: boolean) => {
    setCurrentSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSaveChanges = () => {
    onSave(currentSettings);
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-8">
            <h1 className="text-4xl font-serif text-brand-blue flex items-center">
                <SettingsIcon className="w-8 h-8 mr-4 text-brand-light-blue" />
                Notification Settings
            </h1>
             <button onClick={onBack} className="text-brand-light-blue hover:text-brand-blue font-semibold">
                &larr; Back to home
            </button>
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
