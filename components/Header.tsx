import React, { useState } from 'react';
import type { User } from '../types';
import { Page } from '../types';
import { Logo, MenuIcon, XIcon } from './Icons';

interface HeaderProps {
  user: User | null;
  setPage: (page: Page) => void;
  setUser: (user: User | null) => void;
}

const Header: React.FC<HeaderProps> = ({ user, setPage, setUser }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('t-glacia-user');
    setUser(null);
    setPage(Page.Landing);
    setIsMenuOpen(false);
  };
  
  const handleAuthClick = () => {
    setPage(Page.Auth);
    setIsMenuOpen(false);
  };
  
  const handleLogoClick = () => {
      setPage(Page.Landing);
      setIsMenuOpen(false);
  }

  const MobileMenu = () => (
    <div className="fixed inset-0 bg-black/60 z-[90] transition-opacity duration-300 md:hidden" onClick={() => setIsMenuOpen(false)}>
        <div 
            className="fixed top-0 right-0 h-full w-72 bg-gray-900 z-[100] shadow-2xl p-6 flex flex-col transition-transform duration-300 transform"
            onClick={e => e.stopPropagation()}
        >
            <button onClick={() => setIsMenuOpen(false)} className="self-end mb-8">
                <XIcon className="w-7 h-7 text-gray-400 hover:text-white"/>
            </button>
            <div className="flex flex-col space-y-6">
                {user ? (
                <>
                  <div className="text-center">
                    <div className="font-semibold text-white text-lg">{user.username}</div>
                    <div className="text-sm text-gray-400">Plan: {user.plan}</div>
                  </div>
                  {user.plan === 'Free' && (
                    <div className="bg-brand-blue/20 text-brand-blue text-sm font-bold mx-auto px-4 py-2 rounded-full">
                      {user.generationsLeft} générations restantes
                    </div>
                  )}
                  <button
                    onClick={handleLogout}
                    className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold px-4 py-3 rounded-lg transition-colors"
                  >
                    Déconnexion
                  </button>
                </>
              ) : (
                <button
                  onClick={handleAuthClick}
                  className="w-full bg-brand-blue hover:bg-blue-500 text-white font-semibold px-5 py-3 rounded-lg transition-colors"
                >
                  Commencer
                </button>
              )}
            </div>
        </div>
    </div>
  );

  return (
    <>
      <header className="bg-gray-900/50 backdrop-blur-sm fixed top-0 left-0 right-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 py-3 flex justify-between items-center">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={handleLogoClick}>
            <Logo className="w-10 h-10" />
            <h1 className="text-xl sm:text-2xl font-bold text-white">
              T-Glacia Images²
            </h1>
          </div>
          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center space-x-4">
            {user ? (
              <>
                <div className="text-sm text-gray-300">
                  <span className="font-semibold">{user.username}</span> | Plan: {user.plan}
                </div>
                {user.plan === 'Free' && (
                  <div className="bg-brand-blue/20 text-brand-blue text-xs font-bold px-3 py-1 rounded-full">
                    {user.generationsLeft} générations restantes
                  </div>
                )}
                <button
                  onClick={handleLogout}
                  className="bg-red-500 hover:bg-red-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
                >
                  Déconnexion
                </button>
              </>
            ) : (
              <button
                onClick={handleAuthClick}
                className="bg-brand-blue hover:bg-blue-500 text-white font-semibold px-5 py-2 rounded-lg transition-colors"
              >
                Commencer
              </button>
            )}
          </nav>
          {/* Mobile Menu Button */}
          <div className="md:hidden">
              <button onClick={() => setIsMenuOpen(true)}>
                  <MenuIcon className="w-6 h-6 text-white" />
              </button>
          </div>
        </div>
      </header>
      {isMenuOpen && <MobileMenu />}
    </>
  );
};

export default Header;