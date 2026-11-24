

import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Logo, UserIcon, MegaphoneIcon, SettingsIcon, FileTextIcon, HeartIcon } from './Icons';
import type { User, View } from '../types';

interface HeaderProps {
  onNavigate: (view: View) => void;
  onMembership: () => void;
  onLogin: () => void;
  onLogout: () => void;
  currentUser: User | null;
}

const Header: React.FC<HeaderProps> = ({ onNavigate, onMembership, onLogin, onLogout, currentUser }) => {
  const isVendorOwner = !!currentUser?.ownedVendorId;
  const isProMember = currentUser?.subscription?.tier === 'pro' || currentUser?.subscription?.tier === 'superPro' || currentUser?.subscription?.foundingMember === true;
  const [menuOpen, setMenuOpen] = useState(false);
  // Teal bar on every page except the home page, whose hero is already teal (T120)
  const onColour = useLocation().pathname !== '/';
  const navTone = onColour ? 'text-white hover:bg-white/15' : 'text-brand-blue hover:bg-brand-blue/10';
  const joinTone = onColour ? 'bg-white text-brand-gold hover:bg-brand-cream' : 'bg-brand-gold text-white hover:bg-brand-gold/90';

  return (
    <header className={`${onColour ? 'bg-brand-light-blue' : 'bg-white'} shadow-md sticky top-0 z-20`}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <div
            className="flex-shrink-0 cursor-pointer"
            onClick={() => onNavigate({ type: 'home' })}
          >
            <Logo onDark={onColour} />
          </div>
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              <button
                onClick={() => onNavigate({ type: 'home' })}
                className={`${navTone} px-3 py-3 rounded-md text-sm font-medium`}
              >
                Home
              </button>
              <button
                onClick={() => onNavigate({ type: 'calendar' })}
                className={`${navTone} px-3 py-3 rounded-md text-sm font-medium`}
              >
                Calendar
              </button>
               {currentUser ? (
                <>
                  <button
                    onClick={() => onNavigate({ type: 'dashboard' })}
                    className={`${navTone} px-3 py-3 rounded-md text-sm font-medium flex items-center`}
                  >
                    <HeartIcon className="w-4 h-4 mr-2" />
                    Saved
                  </button>
                  {isVendorOwner && isProMember && (
                    <button
                        onClick={() => onNavigate({ type: 'myApplications' })}
                        className={`${navTone} px-3 py-3 rounded-md text-sm font-medium flex items-center`}
                    >
                        <FileTextIcon className="w-4 h-4 mr-2" />
                        My Applications
                    </button>
                  )}
                  {currentUser.ownedOrganizerId && (
                    <button
                      onClick={() => onNavigate({ type: 'organizerHub' })}
                      className={`${navTone} px-3 py-3 rounded-md text-sm font-medium`}
                    >
                      My Market
                    </button>
                  )}
                  {currentUser.ownedVendorId && (
                    <>
                      <button
                        onClick={() => onNavigate({ type: 'manageProfile' })}
                        className={`${navTone} px-3 py-3 rounded-md text-sm font-medium`}
                      >
                        Manage Profile
                      </button>
                      {isProMember && (
                        <button
                          onClick={() => onNavigate({ type: 'promotions' })}
                          className={`${navTone} px-3 py-3 rounded-md text-sm font-medium flex items-center`}
                        >
                          <MegaphoneIcon className="w-4 h-4 mr-2" />
                          Promotions
                        </button>
                      )}
                    </>
                  )}
                  {currentUser.isAdmin && (
                     <button onClick={() => onNavigate({ type: 'adminPanel' })} className={`${onColour ? 'text-white font-semibold hover:bg-white/15' : 'text-brand-gold hover:bg-brand-gold/10 font-medium'} px-3 py-3 rounded-md text-sm`}>Market HQ</button>
                  )}
                  <div className={`flex items-center border-l pl-4 ml-2 space-x-4 ${onColour ? 'border-white/40' : ''}`}>
                    <div className={`flex items-center text-sm ${onColour ? 'text-white' : 'text-brand-blue'}`}>
                      <UserIcon className="w-5 h-5 mr-2" />
                      <span>{currentUser.email}</span>
                    </div>
                     <button
                        onClick={() => onNavigate({ type: 'notificationSettings' })}
                        className={`${onColour ? 'text-white hover:bg-white/15' : 'text-gray-500 hover:text-brand-blue'} p-2 rounded-full`}
                        title="Notification Settings"
                      >
                        <SettingsIcon className="w-5 h-5" />
                      </button>
                    <button
                      onClick={onLogout}
                      className={`${navTone} px-3 py-3 rounded-md text-sm font-medium`}
                    >
                      Logout
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <button
                    onClick={() => onNavigate({ type: 'signup' })}
                    className={`${joinTone} px-4 py-3 rounded-full text-sm font-semibold transition-colors`}
                  >
                    Join Free
                  </button>
                   <button
                    onClick={onMembership}
                    className={`${navTone} px-3 py-3 rounded-md text-sm font-medium`}
                  >
                    Membership
                  </button>
                  <button
                    onClick={onLogin}
                    className={`${navTone} px-3 py-3 rounded-md text-sm font-medium`}
                  >
                    User Login
                  </button>
                </>
              )}
            </div>
          </div>
          {!currentUser && (
            <button
              className={`md:hidden ${joinTone} px-4 py-3 rounded-full text-sm font-semibold transition-colors min-h-[3rem]`}
              onClick={() => onNavigate({ type: 'signup' })}
            >
              Join Free
            </button>
          )}
          <button
            className={`md:hidden ${onColour ? 'text-white' : 'text-brand-blue'} text-2xl px-3 py-2`}
            onClick={() => setMenuOpen(open => !open)}
            aria-label="Toggle menu"
          >
            ☰
          </button>
        </div>
      </div>
      {menuOpen && (
        <div className="md:hidden bg-white shadow-lg w-full">
          <div className="flex flex-col px-4 py-3 space-y-1">
            <button
              onClick={() => { onNavigate({ type: 'home' }); setMenuOpen(false); }}
              className="text-brand-blue hover:bg-brand-blue/10 px-3 py-3 rounded-md text-sm font-medium text-left"
            >
              Home
            </button>
            <button
              onClick={() => { onNavigate({ type: 'calendar' }); setMenuOpen(false); }}
              className="text-brand-blue hover:bg-brand-blue/10 px-3 py-3 rounded-md text-sm font-medium text-left"
            >
              Calendar
            </button>
            {currentUser ? (
              <>
                <button
                  onClick={() => { onNavigate({ type: 'dashboard' }); setMenuOpen(false); }}
                  className="text-brand-blue hover:bg-brand-blue/10 px-3 py-3 rounded-md text-sm font-medium flex items-center"
                >
                  <HeartIcon className="w-4 h-4 mr-2" />
                  Saved
                </button>
                {isVendorOwner && isProMember && (
                  <button
                    onClick={() => { onNavigate({ type: 'myApplications' }); setMenuOpen(false); }}
                    className="text-brand-blue hover:bg-brand-blue/10 px-3 py-3 rounded-md text-sm font-medium flex items-center"
                  >
                    <FileTextIcon className="w-4 h-4 mr-2" />
                    My Applications
                  </button>
                )}
                {currentUser.ownedOrganizerId && (
                  <button
                    onClick={() => { onNavigate({ type: 'organizerHub' }); setMenuOpen(false); }}
                    className="text-brand-blue hover:bg-brand-blue/10 px-3 py-3 rounded-md text-sm font-medium text-left"
                  >
                    My Market
                  </button>
                )}
                {currentUser.ownedVendorId && (
                  <>
                    <button
                      onClick={() => { onNavigate({ type: 'manageProfile' }); setMenuOpen(false); }}
                      className="text-brand-blue hover:bg-brand-blue/10 px-3 py-3 rounded-md text-sm font-medium text-left"
                    >
                      Manage Profile
                    </button>
                    {isProMember && (
                      <button
                        onClick={() => { onNavigate({ type: 'promotions' }); setMenuOpen(false); }}
                        className="text-brand-blue hover:bg-brand-blue/10 px-3 py-3 rounded-md text-sm font-medium flex items-center"
                      >
                        <MegaphoneIcon className="w-4 h-4 mr-2" />
                        Promotions
                      </button>
                    )}
                  </>
                )}
                {currentUser.isAdmin && (
                  <button
                    onClick={() => { onNavigate({ type: 'adminPanel' }); setMenuOpen(false); }}
                    className="text-brand-gold hover:bg-brand-gold/10 px-3 py-3 rounded-md text-sm font-medium text-left"
                  >
                    Market HQ
                  </button>
                )}
                <div className="border-t pt-3 mt-1 space-y-1">
                  <div className="flex items-center text-sm text-brand-blue px-3 py-2">
                    <UserIcon className="w-5 h-5 mr-2" />
                    <span>{currentUser.email}</span>
                  </div>
                  <button
                    onClick={() => { onNavigate({ type: 'notificationSettings' }); setMenuOpen(false); }}
                    className="text-gray-500 hover:text-brand-blue px-3 py-3 rounded-md text-sm font-medium flex items-center"
                    title="Notification Settings"
                  >
                    <SettingsIcon className="w-5 h-5 mr-2" />
                    Notification Settings
                  </button>
                  <button
                    onClick={() => { onLogout(); setMenuOpen(false); }}
                    className="text-brand-blue hover:bg-brand-blue/10 px-3 py-3 rounded-md text-sm font-medium text-left w-full"
                  >
                    Logout
                  </button>
                </div>
              </>
            ) : (
              <>
                <button
                  onClick={() => { onNavigate({ type: 'signup' }); setMenuOpen(false); }}
                  className="bg-brand-gold text-white px-4 py-3 rounded-full text-sm font-semibold hover:bg-brand-gold/90 transition-colors text-center"
                >
                  Join Free
                </button>
                <button
                  onClick={() => { onMembership(); setMenuOpen(false); }}
                  className="text-brand-blue hover:bg-brand-blue/10 px-3 py-3 rounded-md text-sm font-medium text-left"
                >
                  Membership
                </button>
                <button
                  onClick={() => { onLogin(); setMenuOpen(false); }}
                  className="text-brand-blue hover:bg-brand-blue/10 px-3 py-3 rounded-md text-sm font-medium text-left"
                >
                  User Login
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
