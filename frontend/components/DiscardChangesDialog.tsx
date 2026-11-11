import React from 'react';
import Modal from './Modal';

// Asked when someone clicks outside a form window that has unsaved changes.
// Used instead of window.confirm, which freezes the page while it's open and
// doesn't match the site. Clicking outside this one, or Escape, keeps editing.
interface DiscardChangesDialogProps {
  isOpen: boolean;
  onKeepEditing: () => void;
  onDiscard: () => void;
}

const DiscardChangesDialog: React.FC<DiscardChangesDialogProps> = ({ isOpen, onKeepEditing, onDiscard }) => (
  <Modal isOpen={isOpen} onClose={onKeepEditing} onClickOutside={onKeepEditing} title="Close without saving?" maxWidth="sm">
    <p className="text-base text-gray-800">You have changes that aren't saved yet. Closing will lose them.</p>
    <div className="mt-5 flex gap-3">
      <button
        type="button"
        onClick={onKeepEditing}
        autoFocus
        className="flex-1 min-h-[2.75rem] border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
      >
        Keep editing
      </button>
      <button
        type="button"
        onClick={onDiscard}
        className="flex-1 min-h-[2.75rem] bg-brand-blue text-white rounded-lg hover:bg-brand-blue/90 font-medium"
      >
        Discard changes
      </button>
    </div>
  </Modal>
);

export default DiscardChangesDialog;
