
import React, { useState } from 'react';
import { StarIcon } from './Icons';

interface ReviewFormProps {
  onSubmit: (reviewData: { rating: number, comment: string }) => void;
}

const ReviewForm: React.FC<ReviewFormProps> = ({ onSubmit }) => {
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [hoverRating, setHoverRating] = useState(0);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (rating > 0 && comment) {
            onSubmit({ rating, comment });
            setRating(0);
            setComment('');
        } else {
            alert('Please provide a rating and a comment.');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="bg-brand-cream/60 p-6 rounded-lg">
            <h3 className="text-xl font-bold text-brand-blue font-serif mb-4">Write a review</h3>
            <div className="mb-4">
                <p className="font-semibold mb-2 text-brand-text">Your Rating:</p>
                <div className="flex items-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <button
                            type="button"
                            key={star}
                            className="focus:outline-none"
                            onClick={() => setRating(star)}
                            onMouseEnter={() => setHoverRating(star)}
                            onMouseLeave={() => setHoverRating(0)}
                        >
                            <StarIcon
                                className="w-7 h-7 cursor-pointer text-brand-gold"
                                filled={(hoverRating || rating) >= star}
                            />
                        </button>
                    ))}
                </div>
            </div>
            <div className="mb-4">
                <label htmlFor="comment" className="block font-semibold mb-2 text-brand-text">Your Comment:</label>
                <textarea
                    id="comment"
                    rows={4}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-gold"
                    placeholder="Tell us about your experience..."
                    required
                ></textarea>
            </div>
            <button type="submit" className="bg-brand-blue text-white font-semibold py-2 px-6 rounded-md hover:bg-opacity-90 transition-colors disabled:bg-gray-400" disabled={!rating || !comment}>
                Submit Review
            </button>
        </form>
    );
};

export default ReviewForm;