
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import type { Market, Vendor } from '../types';
import { BotIcon, UserIcon, SendIcon } from './Icons';

interface AIConciergeProps {
  markets: Market[];
  vendors: Vendor[];
}

interface Message {
  sender: 'user' | 'bot';
  text: string;
}

const AIConcierge: React.FC<AIConciergeProps> = ({ markets, vendors }) => {
  const [messages, setMessages] = useState<Message[]>([
    { sender: 'bot', text: "Hello! I'm your AI Market Concierge. Ask me anything about our markets and vendors, like 'Which markets are pet-friendly?' or 'Where can I find fresh sourdough?'" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatContainerRef.current?.scrollTo(0, chatContainerRef.current.scrollHeight);
  }, [messages]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { sender: 'user', text: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const marketData = JSON.stringify(markets.map(({ reviews, photos, ...rest }) => rest));
      const vendorData = JSON.stringify(vendors.map(({ reviews, photos, ...rest }) => rest));

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `User question: "${input}"`,
        config: {
            systemInstruction: `You are a friendly and helpful concierge for the VI Markets Network. Your goal is to help users find information about local markets and vendors on Vancouver Island. Use the provided JSON data to answer questions. Be concise, friendly, and helpful. If the answer isn't in the data, say you couldn't find that information. Do not mention you are an AI or that you are using JSON data. You are a market expert. Format your answers for readability (e.g., use lists).
            ---
            MARKET DATA: ${marketData}
            ---
            VENDOR DATA: ${vendorData}
            ---
            `,
        }
      });
      
      const botMessage: Message = { sender: 'bot', text: response.text };
      setMessages(prev => [...prev, botMessage]);

    } catch (error) {
      console.error("Error calling Gemini API:", error);
      const errorMessage: Message = { sender: 'bot', text: "Sorry, I'm having a little trouble connecting right now. Please try again in a moment." };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="flex flex-col h-[60vh]">
      <div ref={chatContainerRef} className="flex-grow p-4 space-y-4 overflow-y-auto bg-brand-cream/50 rounded-t-md">
        {messages.map((msg, index) => (
          <div key={index} className={`flex items-start gap-3 ${msg.sender === 'user' ? 'justify-end' : ''}`}>
            {msg.sender === 'bot' && <div className="w-8 h-8 bg-brand-blue text-white rounded-full flex items-center justify-center flex-shrink-0"><BotIcon className="w-5 h-5"/></div>}
            <div className={`p-3 rounded-lg max-w-sm ${msg.sender === 'bot' ? 'bg-white shadow-sm' : 'bg-brand-blue text-white'}`}>
              <p className="text-sm" style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</p>
            </div>
            {msg.sender === 'user' && <div className="w-8 h-8 bg-brand-gold text-white rounded-full flex items-center justify-center flex-shrink-0"><UserIcon className="w-5 h-5"/></div>}
          </div>
        ))}
         {isLoading && (
            <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-brand-blue text-white rounded-full flex items-center justify-center flex-shrink-0"><BotIcon className="w-5 h-5"/></div>
                <div className="p-3 rounded-lg bg-white shadow-sm">
                    <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse [animation-delay:0.2s]"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse [animation-delay:0.4s]"></div>
                    </div>
                </div>
            </div>
        )}
      </div>
      <form onSubmit={handleSendMessage} className="p-4 border-t bg-white">
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your question..."
            disabled={isLoading}
            className="w-full p-3 pr-12 rounded-full text-gray-900 border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-gold disabled:bg-gray-100"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-brand-blue text-white rounded-full p-2 hover:bg-brand-light-blue disabled:bg-gray-400 transition-colors"
            aria-label="Send message"
          >
            <SendIcon className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  );
};

export default AIConcierge;