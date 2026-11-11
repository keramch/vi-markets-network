

import React, { ReactNode, useEffect, useRef } from 'react';
import { XIcon } from './Icons';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  // Opt-in: clicking outside the window or pressing Escape calls this. Left off
  // by default so login and payment windows can't be closed by a stray tap.
  onClickOutside?: () => void;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, maxWidth = 'md', onClickOutside }) => {
  // Only a press that starts AND ends on the backdrop counts, so dragging to
  // select text inside the window and letting go outside doesn't close it
  const pressStartedOnBackdrop = useRef(false);

  useEffect(() => {
    if (!isOpen || !onClickOutside) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClickOutside(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClickOutside]);

  if (!isOpen) return null;

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4"
      onMouseDown={e => { pressStartedOnBackdrop.current = e.target === e.currentTarget; }}
      onClick={e => {
        if (onClickOutside && pressStartedOnBackdrop.current && e.target === e.currentTarget) onClickOutside();
        pressStartedOnBackdrop.current = false;
      }}
    >
      <div className={`bg-white rounded-lg shadow-xl w-full ${maxWidthClasses[maxWidth]} max-h-[90vh] overflow-y-auto`}>
        <div className="p-4 border-b flex justify-between items-center sticky top-0 bg-white z-10">
          <h2 className="text-xl font-semibold text-brand-blue">{title}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800" aria-label="Close">
            <XIcon className="w-6 h-6" />
          </button>
        </div>
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;