
import React, { useState } from 'react';
import type { User } from '../types';
import { SendIcon } from './Icons';

interface ContactFormProps {
    recipientEmail: string;
    currentUser: User | null;
    onSend: (recipientEmail: string, subject: string) => void;
}

const ContactForm: React.FC<ContactFormProps> = ({ recipientEmail, currentUser, onSend }) => {
    const [senderName, setSenderName] = useState('');
    const [senderEmail, setSenderEmail] = useState(currentUser?.email || '');
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [isSent, setIsSent] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSend(recipientEmail, subject);
        setIsSent(true);
    };

    if (isSent) {
        return (
            <div className="bg-brand-cream/60 p-6 rounded-lg text-center">
                <h3 className="text-xl text-brand-blue font-serif">Thank you!</h3>
                <p className="mt-2 text-brand-text">Your message has been sent successfully.</p>
            </div>
        )
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label htmlFor="contact-name" className="block text-sm font-medium text-gray-700">Your Name</label>
                <input type="text" id="contact-name" value={senderName} onChange={e => setSenderName(e.target.value)} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-3 px-3 focus:outline-none focus:ring-brand-gold focus:border-brand-gold"/>
            </div>
             <div>
                <label htmlFor="contact-email" className="block text-sm font-medium text-gray-700">Your Email</label>
                <input type="email" id="contact-email" value={senderEmail} onChange={e => setSenderEmail(e.target.value)} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-3 px-3 focus:outline-none focus:ring-brand-gold focus:border-brand-gold"/>
            </div>
             <div>
                <label htmlFor="contact-subject" className="block text-sm font-medium text-gray-700">Subject</label>
                <input type="text" id="contact-subject" value={subject} onChange={e => setSubject(e.target.value)} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-3 px-3 focus:outline-none focus:ring-brand-gold focus:border-brand-gold"/>
            </div>
            <div>
                <label htmlFor="contact-message" className="block text-sm font-medium text-gray-700">Message</label>
                <textarea id="contact-message" rows={4} value={message} onChange={e => setMessage(e.target.value)} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-3 px-3 focus:outline-none focus:ring-brand-gold focus:border-brand-gold"></textarea>
            </div>
            <button type="submit" className="w-full bg-brand-blue text-white font-semibold py-3 px-4 rounded-md hover:bg-opacity-90 transition-colors flex items-center justify-center">
                <SendIcon className="w-5 h-5 mr-2"/>
                Send Message
            </button>
        </form>
    );
};

export default ContactForm;
