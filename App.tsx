
import React, { useState, useEffect } from 'react';
import type { User } from './types';
import { Page, Plan } from './types';
import Header from './components/Header';
import LandingPage from './components/LandingPage';
import AuthPage from './components/AuthPage';
import CreatorPage from './components/CreatorPage';
import SubscriptionPage from './components/SubscriptionPage';

const LoadingOverlay: React.FC<{ message: string }> = ({ message }) => {
    const [currentMessage, setCurrentMessage] = useState(message);
    const videoGenerationMessages = [
        "Préparation de l'espace de création...",
        "Analyse de votre invite...",
        "Les processeurs quantiques chauffent...",
        "Assemblage des pixels en haute définition...",
        "Application des filtres cinématiques...",
        "Finalisation de votre chef-d'œuvre...",
    ];

    useEffect(() => {
        if (message.includes('vidéo')) {
            let index = 0;
            const interval = setInterval(() => {
                index = (index + 1) % videoGenerationMessages.length;
                setCurrentMessage(videoGenerationMessages[index]);
            }, 3000);
            return () => clearInterval(interval);
        } else {
            setCurrentMessage(message);
        }
    }, [message]);


    return (
        <div className="fixed inset-0 bg-black/80 flex flex-col items-center justify-center z-[100]">
            <svg className="animate-spin h-12 w-12 text-brand-blue" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-white text-lg mt-4 animate-pulse">{currentMessage}</p>
        </div>
    );
};

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [page, setPage] = useState<Page>(Page.Landing);
  const [isLoading, setIsLoadingState] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Chargement...');

  useEffect(() => {
    // Check for logged-in user in localStorage on initial load
    const storedUser = localStorage.getItem('t-glacia-user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        // We strip the stored password for security in the app state
        const { password, ...userState } = parsedUser;
        setUser(userState);
        setPage(Page.Creator);
      } catch (error) {
        console.error("Failed to parse user from localStorage", error);
        localStorage.removeItem('t-glacia-user');
      }
    }
  }, []);
  
  const setIsLoading = (loading: boolean, message: string = 'Chargement...') => {
    setIsLoadingState(loading);
    setLoadingMessage(message);
  };

  const renderPage = () => {
    switch (page) {
      case Page.Auth:
        return <AuthPage setUser={setUser} setPage={setPage} />;
      case Page.Creator:
        if (user) {
          return <CreatorPage user={user} setUser={setUser} setPage={setPage} setIsLoading={setIsLoading} />;
        }
        // If no user, redirect to auth
        setPage(Page.Auth);
        return <AuthPage setUser={setUser} setPage={setPage} />;
      case Page.Subscription:
        return <SubscriptionPage />;
      case Page.Landing:
      default:
        return <LandingPage setPage={setPage} />;
    }
  };

  return (
    <>
      {isLoading && <LoadingOverlay message={loadingMessage} />}
      <Header user={user} setPage={setPage} setUser={setUser} />
      {renderPage()}
    </>
  );
};

export default App;
