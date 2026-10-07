import React, { useState } from 'react';
import type { Review } from '../types';

interface ReviewRemovalRequestProps {
  review: Review;
  onSubmit: (reviewId: string, reason: string) => Promise<void>;
}

// Shown under each review in the owner's Reviews tab. Owners can't remove
// reviews themselves — they ask, and the VI Markets admin decides.
const ReviewRemovalRequest: React.FC<ReviewRemovalRequestProps> = ({ review, onSubmit }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const request = review.removalRequest;
  if (request?.status === 'open') {
    return <p className="text-sm text-amber-800 mt-2">Removal requested — our team is looking at it.</p>;
  }
  if (request?.status === 'dismissed') {
    return <p className="text-sm text-gray-600 mt-2">Our team reviewed your removal request and kept this review.</p>;
  }

  const textareaId = `removal-reason-${review.id}`;

  const handleSubmit = async () => {
    if (!reason.trim()) {
      setError('Please tell us why this review should be removed.');
      return;
    }
    setError('');
    setIsSubmitting(true);
    try {
      await onSubmit(review.id, reason.trim());
      setIsOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) {
    return (
      <div className="flex justify-end mt-2">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="text-sm font-medium text-brand-blue underline hover:no-underline"
        >
          Request removal
        </button>
      </div>
    );
  }

  return (
    <div className="mt-3 pt-3 border-t border-gray-200">
      <label htmlFor={textareaId} className="block text-sm font-medium text-gray-700 mb-1">
        Why should this review be removed?
      </label>
      <p className="text-sm text-gray-600 mb-2">
        For example: it's abusive, it's about a different business, or it's part of a pile-on.
        Our team will decide — honest negative reviews usually stay up.
      </p>
      <textarea
        id={textareaId}
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        rows={3}
        maxLength={1000}
        className="w-full border border-gray-300 rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue"
      />
      {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
      <div className="flex justify-end gap-3 mt-2">
        <button
          type="button"
          onClick={() => { setIsOpen(false); setError(''); }}
          disabled={isSubmitting}
          className="text-sm font-medium text-gray-600 hover:text-gray-800"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="text-sm font-semibold bg-brand-blue text-white px-3 py-2 rounded-md hover:bg-brand-blue/90 disabled:opacity-50"
        >
          {isSubmitting ? 'Sending…' : 'Send request'}
        </button>
      </div>
    </div>
  );
};

export default ReviewRemovalRequest;
