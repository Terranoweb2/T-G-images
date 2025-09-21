import React, { useState } from 'react';
import type { User } from '../types';
import { Page, Plan } from '../types';
import { LogoIcon } from './Icons';

interface AuthPageProps {
  setUser: (user: User) => void;
  setPage: (page: Page) => void;
}

const AuthPage: React.FC<AuthPageProps> = ({ setUser, setPage }) => {
  const [isLogin, setIsLogin] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isLogin) {
      // Mock login - in a real app, this would be an API call
      const storedUser = localStorage.getItem('t-glacia-user');
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        if (parsedUser.email === email && parsedUser.password === password) {
          setUser(parsedUser);
          setPage(Page.Creator);
        } else {
          setError('Email ou mot de passe incorrect.');
        }
      } else {
        setError('Aucun utilisateur trouvé. Veuillez vous inscrire.');
      }
    } else {
      // Registration
      if (password !== confirmPassword) {
        setError('Les mots de passe ne correspondent pas.');
        return;
      }
      if (!username || !email || !password) {
        setError('Veuillez remplir tous les champs.');
        return;
      }
      const newUser: User = {
        username,
        email,
        plan: Plan.Free,
        generationsLeft: 2,
      };
      // In a real app, you would also store the password hashed, not in plain text
      localStorage.setItem('t-glacia-user', JSON.stringify({ ...newUser, password }));
      setUser(newUser);
      setPage(Page.Creator);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-dark pt-20 px-4">
      <div className="w-full max-w-md p-6 sm:p-8 space-y-6 bg-gray-900 rounded-xl border border-gray-700">
        <div className="flex flex-col items-center">
          <LogoIcon className="w-12 h-12 text-brand-blue" />
          <h2 className="mt-4 text-3xl font-bold text-center text-white">
            {isLogin ? 'Connectez-vous' : 'Créez votre compte'}
          </h2>
        </div>
        {error && <p className="text-red-500 text-sm text-center">{error}</p>}
        <form className="space-y-6" onSubmit={handleSubmit}>
          {!isLogin && (
            <div>
              <label className="text-sm font-bold text-gray-400 block mb-2">Nom d'utilisateur</label>
              <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full p-3 text-white bg-gray-800 rounded-lg border border-gray-700 focus:border-brand-blue focus:outline-none" required />
            </div>
          )}
          <div>
            <label className="text-sm font-bold text-gray-400 block mb-2">Adresse e-mail</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full p-3 text-white bg-gray-800 rounded-lg border border-gray-700 focus:border-brand-blue focus:outline-none" required />
          </div>
          <div>
            <label className="text-sm font-bold text-gray-400 block mb-2">Mot de passe</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full p-3 text-white bg-gray-800 rounded-lg border border-gray-700 focus:border-brand-blue focus:outline-none" required />
          </div>
          {!isLogin && (
            <div>
              <label className="text-sm font-bold text-gray-400 block mb-2">Confirmer le mot de passe</label>
              <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full p-3 text-white bg-gray-800 rounded-lg border border-gray-700 focus:border-brand-blue focus:outline-none" required />
            </div>
          )}
          <button type="submit" className="w-full py-3 px-4 bg-brand-blue hover:bg-blue-500 rounded-lg text-white font-semibold transition-colors">
            {isLogin ? 'Connexion' : 'Créer mon compte'}
          </button>
        </form>
        <div className="text-center text-sm text-gray-400">
          {isLogin ? "Pas encore de compte ? " : "Déjà un compte ? "}
          <span onClick={() => setIsLogin(!isLogin)} className="font-medium text-brand-blue hover:underline cursor-pointer">
            {isLogin ? "S'inscrire" : "Se connecter"}
          </span>
        </div>
        <div className="text-xs text-gray-500 text-center">
            En continuant, vous acceptez notre <a href="#" className="underline">Politique de Confidentialité</a> et nos <a href="#" className="underline">Conditions d'Utilisation</a>.
        </div>
      </div>
    </div>
  );
};

export default AuthPage;