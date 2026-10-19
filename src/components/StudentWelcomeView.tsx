import React, { useState } from 'react';
import { BookOpen, Shield } from 'lucide-react';
import { StudentLoginModal } from './StudentLoginModal';
import { ConnectedStudent } from '../services/authService';
import { useLibrary } from '../context/LibraryContext';

interface StudentWelcomeViewProps {
  onLoginSuccess: (student: ConnectedStudent) => void;
}

export const StudentWelcomeView: React.FC<StudentWelcomeViewProps> = ({ onLoginSuccess }) => {
  const { setIsManagerLoginOpen } = useLibrary();
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Contenu centré */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-8">
        <div className="max-w-md w-full text-center space-y-8 animate-in fade-in duration-200">
          
          {/* Logo et Titre */}
          <div className="space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-amber-600 text-white flex items-center justify-center mx-auto shadow-md">
              <BookOpen className="w-8 h-8" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold font-serif text-slate-900 tracking-tight">
              Bibliothèque Universitaire
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
              Consultez le catalogue des ouvrages physiques et vérifiez la disponibilité en rayon en temps réel.
            </p>
          </div>

          {/* Bouton unique « Se connecter avec Google » */}
          <div className="bg-white p-8 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
            <p className="text-xs font-semibold text-slate-700">
              Accès réservé aux étudiants inscrits
            </p>

            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="w-full min-h-[48px] px-5 py-3 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-sm font-semibold shadow-xs flex items-center justify-center gap-3 transition group active:scale-[0.99] cursor-pointer"
            >
              {/* Logo Google SVG */}
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
              <span>Se connecter avec Google</span>
            </button>

            <p className="text-[11px] text-slate-400 leading-snug">
              Authentification unique via votre adresse académique institutionnelle.
            </p>
          </div>

        </div>
      </div>

      {/* Pied de page avec lien gestionnaire discret */}
      <footer className="py-6 text-center text-xs text-slate-500 border-t border-slate-200/60 bg-white">
        <div className="max-w-md mx-auto px-4 flex items-center justify-between">
          <span className="text-slate-400">Espace Étudiant</span>
          <button
            type="button"
            onClick={() => setIsManagerLoginOpen(true)}
            className="text-slate-500 hover:text-slate-800 text-xs font-medium flex items-center gap-1.5 hover:underline cursor-pointer"
          >
            <Shield className="w-3.5 h-3.5 text-slate-400" />
            <span>Accès gestionnaire</span>
          </button>
        </div>
      </footer>

      {/* Fenêtre de connexion simulée */}
      <StudentLoginModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onLoginSuccess={(student) => {
          setIsModalOpen(false);
          onLoginSuccess(student);
        }}
      />
    </div>
  );
};
