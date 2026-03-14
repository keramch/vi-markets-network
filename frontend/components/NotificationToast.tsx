
import React, { useEffect, useState } from 'react';
import { CheckCircleIcon, XIcon } from './Icons';

interface NotificationToastProps {
  message: string | null;
}

const NotificationToast: React.FC<NotificationToastProps> = ({ message }) => {
  const [visible, setVisible] = useState(false);
  const [currentMessage, setCurrentMessage] = useState<string | null>(null);

  useEffect(() => {
    if (message) {
      setCurrentMessage(message);
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
      }, 4500); 

      return () => clearTimeout(timer);
    }
  }, [message]);

  return (
    <div
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 transition-all duration-500 ease-in-out ${
        visible && message ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
      }`}
      role="alert"
      aria-live="assertive"
    >
      {currentMessage && (
        <div className="bg-brand-blue text-white font-semibold py-3 px-6 rounded-full shadow-lg flex items-center space-x-3">
          <CheckCircleIcon className="w-6 h-6 text-green-300" />
          <span>{currentMessage}</span>
          <button onClick={() => setVisible(false)} className="ml-4 -mr-2 p-1 rounded-full hover:bg-white/20" aria-label="Dismiss">
            <XIcon className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export default NotificationToast;
