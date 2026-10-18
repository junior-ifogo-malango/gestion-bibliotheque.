import React, { useState } from 'react';
import { X, Shield, Lock, Check } from 'lucide-react';
import { useLibrary } from '../context/LibraryContext';

export const ManagerLoginModal: React.FC = () => {
  const { isManagerLoginOpen, setIsManagerLoginOpen, loginAsManager } = useLibrary();
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  if (!isManagerLoginOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simple university manager authentication
    if (password === 'admin' || password === '' || password === '1234') {
      loginAsManager();
      setIsManagerLoginOpen(false);
      setPassword('');
      setError(false);
    } else {
      setError(true);
    }
  };

  const handleQuickLogin = () => {
    loginAsManager();
    setIsManagerLoginOpen(false);
    setPassword('');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold font-serif">Connexion Gestionnaire</h3>
              <p className="text-[11px] text-slate-400">Guichet & Administration des Prêts</p>
            </div>
          </div>
          <button
            onClick={() => setIsManagerLoginOpen(false)}
            className="p-1 text-slate-400 hover:text-white rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <p className="text-slate-600 leading-relaxed">
            Cet espace est réservé au gestionnaire de la bibliothèque pour la gestion des prêts, retours et inventaire.
          </p>

          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 block">Mot de passe du guichet :</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mot de passe (ou valider directement)"
                className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-amber-500 bg-slate-50"
              />
            </div>
            {error && (
              <p className="text-rose-600 text-[11px] font-semibold">Mot de passe incorrect (essayez 'admin').</p>
            )}
          </div>

          <div className="space-y-2 pt-2">
            <button
              type="submit"
              className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-xs transition"
            >
              Se Connecter
            </button>
            <button
              type="button"
              onClick={handleQuickLogin}
              className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-[11px] transition"
            >
              Accès rapide immédiat (Démo)
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
