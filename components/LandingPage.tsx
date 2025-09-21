import React from 'react';
import { Page } from '../types';
import { UploadIcon, WandIcon, VideoIcon } from './Icons';

interface LandingPageProps {
  setPage: (page: Page) => void;
}

const FeatureCard: React.FC<{ icon: React.ReactNode; title: string; description: string }> = ({ icon, title, description }) => (
    <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700 text-center transform hover:scale-105 hover:border-brand-blue transition-all duration-300">
        <div className="flex justify-center mb-4 text-brand-blue">{icon}</div>
        <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
        <p className="text-gray-400">{description}</p>
    </div>
);

const LandingPage: React.FC<LandingPageProps> = ({ setPage }) => {
  return (
    <div className="min-h-screen bg-brand-dark text-brand-light">
      <main className="pt-28 md:pt-32 pb-20">
        {/* Hero Section */}
        <section className="text-center container mx-auto px-4 sm:px-6">
            <div 
                className="absolute inset-0 bg-grid-pattern opacity-10"
                style={{
                    backgroundImage: 'radial-gradient(circle, rgba(59, 130, 246, 0.3) 1px, transparent 1px)',
                    backgroundSize: '30px 30px'
                }}>
            </div>
          <h2 className="text-4xl sm:text-5xl md:text-7xl font-extrabold text-white mb-4 leading-tight">
            T-Glacia Images²
          </h2>
          <p className="text-lg sm:text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
            Transformez vos idées en vidéos haute définition.
          </p>
          <button
            onClick={() => setPage(Page.Auth)}
            className="bg-brand-blue hover:bg-blue-500 text-white font-bold py-3 px-8 sm:py-4 sm:px-10 rounded-full text-base sm:text-lg transition-transform transform hover:scale-105"
          >
            Commencer Gratuitement
          </button>
        </section>

        {/* Features Section */}
        <section className="container mx-auto px-4 sm:px-6 mt-20 sm:mt-24">
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
                icon={<UploadIcon className="w-12 h-12"/>}
                title="Génération HD"
                description="Importez vos images ou décrivez simplement votre vision pour créer des vidéos et des images en haute définition."
            />
            <FeatureCard
                icon={<WandIcon className="w-12 h-12"/>}
                title="Édition par Invite"
                description="Modifiez et affinez vos créations avec de simples instructions textuelles jusqu'à atteindre la perfection."
            />
            <FeatureCard
                icon={<VideoIcon className="w-12 h-12"/>}
                title="Téléchargement Facile"
                description="Sauvegardez vos chefs-d'œuvre finaux directement sur votre appareil en un seul clic."
            />
          </div>
        </section>
      </main>

      <footer className="text-center py-6 border-t border-gray-800 px-4">
        <p className="text-gray-500">&copy; {new Date().getFullYear()} T-Glacia Images². Tous droits réservés.</p>
      </footer>
    </div>
  );
};

export default LandingPage;