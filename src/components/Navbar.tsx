import React from 'react';
import { 
  BookOpen, 
  ArrowLeftRight, 
  Library, 
  Users, 
  History, 
  Search, 
  AlertTriangle,
  Camera,
  LogOut,
  BookCheck,
  Settings
} from 'lucide-react';
import { useLibrary, ManagerTab } from '../context/LibraryContext';

export const Navbar: React.FC = () => {
  const { 
    logoutManager,
    activeManagerTab, 
    setActiveManagerTab, 
    openNewLoan, 
    setIsScanReturnOpen,
    stats, 
    currentDate,
    isSimulatedDate,
    setIsGlobalSearchOpen
  } = useLibrary();

  const navItems: { id: ManagerTab; label: string; shortLabel: string; icon: React.ReactNode; badge?: number }[] = [
    {
      id: 'dashboard',
      label: 'Tableau de bord',
      shortLabel: 'Accueil',
      icon: <Library className="w-4 h-4" />
    },
    {
      id: 'loans',
      label: 'Prêts en cours',
      shortLabel: 'Prêts',
      icon: <ArrowLeftRight className="w-4 h-4" />,
      badge: stats.empruntsEnRetard > 0 ? stats.empruntsEnRetard : undefined
    },
    {
      id: 'catalog',
      label: 'Catalogue & Exemplaires',
      shortLabel: 'Catalogue',
      icon: <BookOpen className="w-4 h-4" />
    },
    {
      id: 'students',
      label: 'Étudiants Inscrits',
      shortLabel: 'Étudiants',
      icon: <Users className="w-4 h-4" />
    },
    {
      id: 'history',
      label: 'Historique des Retours',
      shortLabel: 'Historique',
      icon: <History className="w-4 h-4" />
    },
    {
      id: 'alerts',
      label: 'Alertes',
      shortLabel: 'Alertes',
      icon: <AlertTriangle className="w-4 h-4" />,
      badge: stats.empruntsEnRetard > 0 ? stats.empruntsEnRetard : undefined
    },
    {
      id: 'settings',
      label: 'Réglages',
      shortLabel: 'Réglages',
      icon: <Settings className="w-4 h-4" />
    }
  ];

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200 text-slate-800 shadow-2xs font-sans">
      <div className="max-w-[1100px] mx-auto px-3 sm:px-6 lg:px-8">
        
        {/* LIGNE UNIQUE EN-TÊTE : Logo/Nom, Onglets, Recherche, Scans, Espace étudiant */}
        <div className="flex items-center justify-between h-14 gap-2 sm:gap-3">
          
          {/* 1. Logo & Nom */}
          <div className="flex items-center gap-2 shrink-0">
            <div 
              onClick={() => setActiveManagerTab('dashboard')}
              className="flex items-center space-x-2 cursor-pointer group"
              title="BiblioPrêt Universitaire"
            >
              <div className="w-8 h-8 rounded-lg bg-amber-600 flex items-center justify-center text-white shadow-2xs">
                <BookOpen className="w-4 h-4" />
              </div>
              <span className="font-semibold text-sm tracking-tight text-slate-900 hidden sm:inline">
                BiblioPrêt
              </span>
            </div>

            {/* Badge « Date simulée : JJ/MM/AAAA » (affiché seulement si elle diffère de la date réelle) */}
            {isSimulatedDate && (
              <button
                onClick={() => setActiveManagerTab('settings')}
                className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100 transition whitespace-nowrap"
                title="Date simulée active — Cliquez pour ajuster dans Réglages"
              >
                Date simulée : {new Date(currentDate).toLocaleDateString('fr-FR')}
              </button>
            )}
          </div>

          {/* 2. Onglets de navigation */}
          <nav className="flex items-center space-x-1 shrink-0 sm:shrink">
            {navItems.map((item) => {
              const isActive = activeManagerTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveManagerTab(item.id)}
                  title={item.label}
                  className={`flex items-center gap-1.5 px-2 lg:px-2.5 py-1.5 rounded-lg text-xs transition cursor-pointer ${
                    isActive
                      ? 'bg-slate-100 text-slate-900 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <span className="shrink-0">{item.icon}</span>
                  <span className="hidden xl:inline whitespace-nowrap">{item.shortLabel}</span>
                  {item.badge !== undefined && (
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-red-100 text-red-800 border border-red-200">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* 3. Actions : Recherche, Boutons de scan uniques, Lien espace étudiant */}
          <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0">
            
            {/* Champ de recherche (icône sur mobile, champ sur grand écran) */}
            <div className="relative">
              <button
                onClick={() => setIsGlobalSearchOpen(true)}
                className="flex items-center gap-1.5 h-9 px-2.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-white text-slate-600 text-xs transition cursor-pointer"
                title="Rechercher un ouvrage, exemplaire ou étudiant (Ctrl+K)"
              >
                <Search className="w-3.5 h-3.5 text-slate-400" />
                <span className="hidden md:inline text-slate-500">Rechercher</span>
                <kbd className="hidden lg:inline-block px-1 py-0.2 text-[9px] font-mono bg-white border border-slate-200 rounded text-slate-400">
                  Ctrl+K
                </kbd>
              </button>
            </div>

            {/* « Scanner un retour » (UNIQUEMENT DANS L'EN-TÊTE) */}
            <button
              onClick={() => setIsScanReturnOpen(true)}
              className="flex items-center gap-1.5 h-9 px-2.5 sm:px-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium transition cursor-pointer shadow-2xs"
              title="Scanner un retour"
            >
              <BookCheck className="w-4 h-4 text-emerald-600" />
              <span className="hidden lg:inline">Scanner un retour</span>
            </button>

            {/* « Scanner un emprunt » (UNIQUEMENT DANS L'EN-TÊTE - Action principale orange) */}
            <button
              onClick={() => openNewLoan()}
              className="flex items-center gap-1.5 h-9 px-2.5 sm:px-3 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-2xs transition cursor-pointer"
              title="Scanner un emprunt"
            >
              <Camera className="w-4 h-4 text-white" />
              <span className="hidden lg:inline">Scanner un emprunt</span>
            </button>

            {/* Lien vers l'espace étudiant */}
            <button
              onClick={logoutManager}
              className="flex items-center gap-1 h-9 px-2 rounded-lg text-xs text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
              title="Accéder à l'espace étudiant (consultation publique)"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden xl:inline">Espace étudiant</span>
            </button>

          </div>

        </div>

      </div>
    </header>
  );
};
