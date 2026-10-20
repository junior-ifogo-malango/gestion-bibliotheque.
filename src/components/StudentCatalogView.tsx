import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, 
  BookOpen, 
  MapPin, 
  CheckCircle2, 
  Lock, 
  Shield, 
  Clock, 
  X,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  RotateCcw,
  LogOut
} from 'lucide-react';
import { useLibrary } from '../context/LibraryContext';
import { Ouvrage } from '../types';
import { BookCover } from './BookCover';
import { ConnectedStudent } from '../services/authService';

const normalizeText = (str: string): string => {
  return str
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
};

const matchAllWords = (text: string, filterVal: string): boolean => {
  const normFilter = normalizeText(filterVal).trim();
  if (!normFilter) return true;
  const words = normFilter.split(/\s+/).filter(Boolean);
  const normText = normalizeText(text);
  return words.every(word => normText.includes(word));
};

const SORT_LABELS: Record<string, string> = {
  'title-asc': 'Titre (A → Z)',
  'title-desc': 'Titre (Z → A)',
  'author-asc': 'Auteur (A → Z)',
  'year-desc': 'Année (récent)',
  'cote-asc': 'Cote'
};

interface StudentCatalogViewProps {
  currentStudent?: ConnectedStudent | null;
  onLogout?: () => void;
}

export const StudentCatalogView: React.FC<StudentCatalogViewProps> = ({
  currentStudent,
  onLogout
}) => {
  const { 
    ouvrages, 
    adherents,
    getExemplairesByOuvrage, 
    setIsManagerLoginOpen,
    updateOuvrage
  } = useLibrary();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'title-asc' | 'title-desc' | 'author-asc' | 'year-desc' | 'cote-asc'>('title-asc');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [selectedStudentOuvrage, setSelectedStudentOuvrage] = useState<Ouvrage | null>(null);
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);

  // Nom affiché dans l'en-tête étudiant : prénom de l'adhérent s'il existe dans la liste, sinon partie avant le @
  const studentDisplayName = useMemo(() => {
    if (!currentStudent) return '';
    const cleanEmail = currentStudent.email?.trim().toLowerCase();
    const matched = cleanEmail ? adherents.find(a => a.emailAcademique.trim().toLowerCase() === cleanEmail) : null;
    if (matched && matched.prenom) {
      return matched.prenom;
    }
    if (currentStudent.prenom && !currentStudent.email) {
      return currentStudent.prenom;
    }
    return cleanEmail ? cleanEmail.split('@')[0] : (currentStudent.prenom || 'Étudiant');
  }, [currentStudent, adherents]);

  // Filtres avancés Titre et Auteur (facultatifs, vides par défaut)
  const [titleFilterInput, setTitleFilterInput] = useState('');
  const [authorFilterInput, setAuthorFilterInput] = useState('');
  const [appliedTitleFilter, setAppliedTitleFilter] = useState('');
  const [appliedAuthorFilter, setAppliedAuthorFilter] = useState('');

  // Mobile draft state for category and sort
  const [mobileCategory, setMobileCategory] = useState<string>('all');
  const [mobileSortBy, setMobileSortBy] = useState<'title-asc' | 'title-desc' | 'author-asc' | 'year-desc' | 'cote-asc'>('title-asc');

  // Ordinateur : application en direct après 300 ms d'inactivité
  useEffect(() => {
    // Si écran large (desktop), debounce 300ms automatique
    if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
      const handler = setTimeout(() => {
        setAppliedTitleFilter(titleFilterInput.trim());
      }, 300);
      return () => clearTimeout(handler);
    }
  }, [titleFilterInput]);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
      const handler = setTimeout(() => {
        setAppliedAuthorFilter(authorFilterInput.trim());
      }, 300);
      return () => clearTimeout(handler);
    }
  }, [authorFilterInput]);

  // Synchronisation lors de l'ouverture du panneau mobile
  const handleOpenFilterPanel = () => {
    setMobileCategory(selectedCategory);
    setMobileSortBy(sortBy);
    setIsFilterPanelOpen(prev => !prev);
  };

  const ITEMS_PER_PAGE = 12;

  const categories = [
    'all',
    'Informatique & Numérique',
    'Sciences & Techniques',
    'Mathématiques & Physique',
    'Histoire & Géographie',
    'Économie & Gestion',
    'Droit & Sciences Politiques',
    'Philosophie & Éthique',
    'Langues & Littérature'
  ];

  // Calcul du nombre de filtres actifs (Titre, Auteur, Catégorie spécifique, Tri modifié)
  const activeFiltersCount = 
    (appliedTitleFilter ? 1 : 0) + 
    (appliedAuthorFilter ? 1 : 0) + 
    (selectedCategory !== 'all' ? 1 : 0) + 
    (sortBy !== 'title-asc' ? 1 : 0);

  // Réinitialiser la page quand la recherche ou un filtre change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, sortBy, appliedTitleFilter, appliedAuthorFilter]);

  // Fermer la modale avec la touche Échap
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedStudentOuvrage(null);
        setIsFilterPanelOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleResetFilters = () => {
    setTitleFilterInput('');
    setAuthorFilterInput('');
    setAppliedTitleFilter('');
    setAppliedAuthorFilter('');
    setSelectedCategory('all');
    setSortBy('title-asc');
    setMobileCategory('all');
    setMobileSortBy('title-asc');
    setCurrentPage(1);
  };

  // Filtrage et tri
  const filteredAndSortedOuvrages = useMemo(() => {
    const filtered = ouvrages.filter(ow => {
      // Filtre Titre (ET) : cherche seulement dans le titre
      if (appliedTitleFilter && !matchAllWords(ow.titre, appliedTitleFilter)) {
        return false;
      }

      // Filtre Auteur (ET) : cherche seulement dans les auteurs
      if (appliedAuthorFilter && !matchAllWords(ow.auteur, appliedAuthorFilter)) {
        return false;
      }

      // Filtre Discipline (ET)
      if (selectedCategory !== 'all' && ow.categorie !== selectedCategory) {
        return false;
      }

      // Recherche générale (ET)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const match =
          ow.titre.toLowerCase().includes(q) ||
          ow.auteur.toLowerCase().includes(q) ||
          ow.cote.toLowerCase().includes(q) ||
          ow.isbn.includes(q) ||
          (ow.resume && ow.resume.toLowerCase().includes(q));
        if (!match) return false;
      }
      return true;
    });

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'title-desc':
          return b.titre.localeCompare(a.titre, 'fr');
        case 'author-asc':
          return a.auteur.localeCompare(b.auteur, 'fr');
        case 'year-desc':
          return b.anneeEdition - a.anneeEdition;
        case 'cote-asc':
          return a.cote.localeCompare(b.cote, 'fr');
        case 'title-asc':
        default:
          return a.titre.localeCompare(b.titre, 'fr');
      }
    });
  }, [ouvrages, selectedCategory, searchQuery, sortBy, appliedTitleFilter, appliedAuthorFilter]);

  // Pagination (12 par page)
  const totalPages = Math.max(1, Math.ceil(filteredAndSortedOuvrages.length / ITEMS_PER_PAGE));
  const paginatedOuvrages = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredAndSortedOuvrages.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredAndSortedOuvrages, currentPage]);

  // Informations de localisation et disponibilité pour un ouvrage
  const getOuvrageStatusAndLocation = (ow: Ouvrage) => {
    const exList = getExemplairesByOuvrage(ow.id);
    const activeCopies = exList;
    const availableCopies = exList.filter(e => e.statut === 'DISPONIBLE');
    const isAvailable = availableCopies.length > 0;
    const copyForLocation = availableCopies[0] || activeCopies[0] || exList[0];
    const tiroir = copyForLocation?.emplacement?.tiroir ?? '—';
    const rangee = copyForLocation?.emplacement?.rangee ?? '—';

    return {
      isAvailable,
      availableCount: availableCopies.length,
      totalCount: activeCopies.length,
      tiroir,
      rangee
    };
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* En-tête Espace Étudiant sobre */}
      <header className="sticky top-0 z-20 bg-white border-b border-slate-200 text-slate-900 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-600 flex items-center justify-center text-white shadow-2xs">
                <BookOpen className="w-4 h-4" />
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base tracking-tight font-serif text-slate-900">
                  Bibliothèque Universitaire
                </span>
                <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                  Catalogue
                </span>
              </div>
            </div>

            {/* Zone utilisateur étudiant connecté & Déconnexion */}
            <div className="flex items-center gap-2 sm:gap-3">
              {currentStudent && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-slate-700">
                    Bonjour, <strong className="font-semibold text-slate-900">{studentDisplayName}</strong>
                  </span>
                  {onLogout && (
                    <button
                      type="button"
                      onClick={onLogout}
                      className="min-h-[36px] flex items-center gap-1.5 px-2.5 py-1 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 text-xs font-medium transition cursor-pointer"
                      title="Se déconnecter de l'espace étudiant"
                    >
                      <LogOut className="w-3.5 h-3.5 text-slate-500" />
                      <span className="hidden sm:inline">Se déconnecter</span>
                    </button>
                  )}
                </div>
              )}

              {/* Bouton discret d'accès gestionnaire */}
              <button
                onClick={() => setIsManagerLoginOpen(true)}
                className="min-h-[36px] flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition cursor-pointer"
              >
                <Shield className="w-3.5 h-3.5 text-amber-600" />
                <span className="hidden sm:inline">Accès</span> Gestionnaire
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Contenu principal */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full space-y-4">
        
        {/* LIGNE UNIQUE DE RECHERCHE + BOUTON FILTRES (identique sur ordi et téléphone) */}
        <div className="flex items-center gap-2 w-full">
          {/* Champ de recherche 44px, fond blanc, fine bordure grise, icône loupe */}
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher un ouvrage"
              className="w-full h-11 pl-10 pr-9 text-sm rounded-xl bg-white text-slate-900 border border-slate-300 placeholder:text-slate-400 focus:outline-hidden focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition shadow-2xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold p-1 cursor-pointer"
                aria-label="Effacer la recherche"
              >
                ✕
              </button>
            )}
          </div>

          {/* Bouton carré de 44 px avec icône filtres (curseurs). Sur ordi (>= 1024px) suivi de 'Filtres'. Pastille activeFiltersCount */}
          <button
            onClick={handleOpenFilterPanel}
            className={`h-11 w-11 lg:w-auto lg:px-4 shrink-0 rounded-xl border flex items-center justify-center gap-2 text-sm font-semibold transition shadow-2xs cursor-pointer ${
              isFilterPanelOpen || activeFiltersCount > 0
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
            }`}
            aria-label="Ouvrir les filtres et le tri"
          >
            <SlidersHorizontal className="w-5 h-5" />
            <span className="hidden lg:inline text-sm font-semibold">Filtres</span>
            {activeFiltersCount > 0 && (
              <span className={`w-5 h-5 rounded-full text-[11px] font-bold flex items-center justify-center ${
                isFilterPanelOpen ? 'bg-amber-500 text-slate-950' : 'bg-amber-600 text-white'
              }`}>
                {activeFiltersCount}
              </span>
            )}
          </button>
        </div>

        {/* Barre dépliable sur ordinateur (>= 1024px) */}
        {isFilterPanelOpen && (
          <div className="hidden lg:block bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4 animate-in fade-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="font-bold text-sm text-slate-900 font-serif">Filtres et options de tri</span>
              {activeFiltersCount > 0 && (
                <button
                  onClick={handleResetFilters}
                  className="text-xs font-semibold text-amber-700 hover:text-amber-800 flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Réinitialiser les filtres</span>
                </button>
              )}
            </div>

            {/* Champs Titre et Auteur en haut du panneau, avant la discipline */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-3 border-b border-slate-100">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
                  Titre
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={titleFilterInput}
                    onChange={(e) => {
                      setTitleFilterInput(e.target.value);
                      setCurrentPage(1);
                    }}
                    placeholder="Filtrer par titre (ex: algo)..."
                    className="w-full h-10 px-3 text-xs rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                  />
                  {titleFilterInput && (
                    <button
                      type="button"
                      onClick={() => {
                        setTitleFilterInput('');
                        setAppliedTitleFilter('');
                        setCurrentPage(1);
                      }}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold p-1 cursor-pointer"
                      aria-label="Effacer le filtre titre"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
                  Auteur
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={authorFilterInput}
                    onChange={(e) => {
                      setAuthorFilterInput(e.target.value);
                      setCurrentPage(1);
                    }}
                    placeholder="Filtrer par auteur (ex: martin)..."
                    className="w-full h-10 px-3 text-xs rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                  />
                  {authorFilterInput && (
                    <button
                      type="button"
                      onClick={() => {
                        setAuthorFilterInput('');
                        setAppliedAuthorFilter('');
                        setCurrentPage(1);
                      }}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold p-1 cursor-pointer"
                      aria-label="Effacer le filtre auteur"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Disciplines */}
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">Discipline</span>
              <div className="flex flex-wrap gap-2">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setMobileCategory(cat)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                      mobileCategory === cat
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {cat === 'all' ? 'Toutes les disciplines' : cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Tri */}
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">Trier par</span>
              <div className="flex flex-wrap gap-2">
                {Object.entries(SORT_LABELS).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => setMobileSortBy(key as any)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                      mobileSortBy === key
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Pastilles de filtres actifs et compteur sous la ligne */}
        <div className="flex flex-wrap items-center justify-between gap-2 min-h-6 pt-1">
          <div className="flex flex-wrap items-center gap-2">
            {appliedTitleFilter && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-100 text-amber-900 border border-amber-200">
                <span>Titre : {appliedTitleFilter}</span>
                <button 
                  onClick={() => {
                    setTitleFilterInput('');
                    setAppliedTitleFilter('');
                    setCurrentPage(1);
                  }} 
                  className="hover:text-amber-950 font-bold ml-0.5 cursor-pointer"
                  aria-label="Supprimer le filtre Titre"
                >
                  ✕
                </button>
              </span>
            )}
            {appliedAuthorFilter && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-100 text-amber-900 border border-amber-200">
                <span>Auteur : {appliedAuthorFilter}</span>
                <button 
                  onClick={() => {
                    setAuthorFilterInput('');
                    setAppliedAuthorFilter('');
                    setCurrentPage(1);
                  }} 
                  className="hover:text-amber-950 font-bold ml-0.5 cursor-pointer"
                  aria-label="Supprimer le filtre Auteur"
                >
                  ✕
                </button>
              </span>
            )}
            {selectedCategory !== 'all' && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-100 text-amber-900 border border-amber-200">
                <span>{selectedCategory}</span>
                <button 
                  onClick={() => {
                    setSelectedCategory('all');
                    setCurrentPage(1);
                  }} 
                  className="hover:text-amber-950 font-bold ml-0.5 cursor-pointer"
                  aria-label="Supprimer le filtre de discipline"
                >
                  ✕
                </button>
              </span>
            )}
            {sortBy !== 'title-asc' && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200">
                <span>Tri : {SORT_LABELS[sortBy]}</span>
                <button 
                  onClick={() => {
                    setSortBy('title-asc');
                    setCurrentPage(1);
                  }} 
                  className="hover:text-slate-950 font-bold ml-0.5 cursor-pointer"
                  aria-label="Réinitialiser le tri"
                >
                  ✕
                </button>
              </span>
            )}
            {activeFiltersCount > 0 && (
              <button
                onClick={handleResetFilters}
                className="text-xs text-slate-500 hover:text-slate-800 underline underline-offset-2 ml-1 cursor-pointer"
              >
                Effacer tout
              </button>
            )}
          </div>

          <div className="text-xs text-slate-500 font-medium">
            <strong>{filteredAndSortedOuvrages.length}</strong> ouvrage{filteredAndSortedOuvrages.length > 1 ? 's' : ''} trouvé{filteredAndSortedOuvrages.length > 1 ? 's' : ''}
            {totalPages > 1 && <span className="text-slate-400"> (Page {currentPage}/{totalPages})</span>}
          </div>
        </div>

        {/* Panneau mobile qui glisse depuis le bas (< 1024px) */}
        {isFilterPanelOpen && (
          <div className="lg:hidden">
            {/* Fond semi-transparent */}
            <div 
              className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-xs animate-in fade-in duration-200"
              onClick={() => setIsFilterPanelOpen(false)}
            />
            {/* Panneau bas coulissant */}
            <div 
              className="fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-3xl border-t border-slate-200 p-5 shadow-2xl max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom duration-200 space-y-5"
            >
              <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto" />
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-base text-slate-900 font-serif">Filtres & Tri</h3>
                <button 
                  onClick={() => setIsFilterPanelOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
                  aria-label="Fermer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Champs Titre et Auteur en haut, avant la discipline */}
              <div className="space-y-3 pb-3 border-b border-slate-100">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                    Titre
                  </label>
                  <input
                    type="text"
                    value={titleFilterInput}
                    onChange={(e) => setTitleFilterInput(e.target.value)}
                    placeholder="Filtrer par titre (ex: algo)..."
                    className="w-full h-11 px-3 text-xs rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                    Auteur
                  </label>
                  <input
                    type="text"
                    value={authorFilterInput}
                    onChange={(e) => setAuthorFilterInput(e.target.value)}
                    placeholder="Filtrer par auteur (ex: martin)..."
                    className="w-full h-11 px-3 text-xs rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Disciplines */}
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Discipline</label>
                <div className="flex flex-wrap gap-1.5">
                  {categories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setMobileCategory(cat)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                        mobileCategory === cat
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {cat === 'all' ? 'Toutes les disciplines' : cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tri */}
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Ordre de tri</label>
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(SORT_LABELS).map(([key, label]) => (
                    <button
                      key={key}
                      onClick={() => setMobileSortBy(key as any)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                        mobileSortBy === key
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Actions en bas */}
              <div className="pt-2 flex items-center gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="min-h-[44px] px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 flex-1 transition"
                >
                  Réinitialiser
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAppliedTitleFilter(titleFilterInput.trim());
                    setAppliedAuthorFilter(authorFilterInput.trim());
                    setSelectedCategory(mobileCategory);
                    setSortBy(mobileSortBy);
                    setCurrentPage(1);
                    setIsFilterPanelOpen(false);
                  }}
                  className="min-h-[44px] px-4 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold flex-1 shadow-xs hover:bg-slate-800 transition"
                >
                  Appliquer
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Grille du catalogue étudiant */}
        {filteredAndSortedOuvrages.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-400">
              <BookOpen className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-800 font-serif">Aucun ouvrage correspondant</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4 leading-relaxed">
              Aucun résultat ne correspond à votre filtre. Vérifiez l'orthographe du titre, de l'auteur ou de la cote.
            </p>
            <button
              onClick={() => { setSearchQuery(''); handleResetFilters(); }}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition shadow-xs cursor-pointer"
            >
              Réinitialiser les filtres
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-6 pt-2">
            {paginatedOuvrages.map(ow => {
              const { isAvailable, tiroir, rangee } = getOuvrageStatusAndLocation(ow);

              return (
                <div
                  key={ow.id}
                  onClick={() => setSelectedStudentOuvrage(ow)}
                  className="group flex flex-col items-center cursor-pointer select-none text-left"
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSelectedStudentOuvrage(ow);
                    }
                  }}
                >
                  {/* Page de couverture : format portrait 2:3, chargement différé, mêmes proportions */}
                  <div className="w-full">
                    <BookCover ouvrage={ow} size="md" onCacheCoverUrl={(url) => updateOuvrage(ow.id, { coverUrl: url })} />
                  </div>

                  {/* En dessous, une seule ligne discrète : « Tiroir X · Rangée Y » (plus « Indisponible » en gris si aucun exemplaire disponible) */}
                  <div className="mt-2 text-center text-xs text-slate-600 font-medium truncate w-full px-1">
                    <span>Tiroir {tiroir} · Rangée {rangee}</span>
                    {!isAvailable && (
                      <span className="text-slate-400 font-normal"> · Indisponible</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination (12 par page) */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-6 pb-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs flex items-center gap-1 transition cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Précédent</span>
            </button>

            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNumber => (
                <button
                  key={pageNumber}
                  onClick={() => setCurrentPage(pageNumber)}
                  className={`w-8 h-8 rounded-xl text-xs font-bold transition cursor-pointer ${
                    currentPage === pageNumber
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {pageNumber}
                </button>
              ))}
            </div>

            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs flex items-center gap-1 transition cursor-pointer"
            >
              <span>Suivant</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

      </main>

      {/* POP-UP au clic ou au toucher sur un ouvrage */}
      {selectedStudentOuvrage && (
        <div 
          className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setSelectedStudentOuvrage(null)}
        >
          <div 
            className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden relative text-slate-800"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Bouton fermer */}
            <button
              onClick={() => setSelectedStudentOuvrage(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition z-10 cursor-pointer"
              aria-label="Fermer la fiche ouvrage"
            >
              <X className="w-5 h-5" />
            </button>

            {/* En-tête de la fiche avec Couverture & Informations principales */}
            {(() => {
              const { isAvailable, tiroir, rangee } = getOuvrageStatusAndLocation(selectedStudentOuvrage);
              const ow = selectedStudentOuvrage;

              return (
                <div className="p-6 space-y-6 max-h-[85vh] overflow-y-auto">
                  <div className="flex flex-col sm:flex-row gap-6 items-start">
                    {/* Couverture au format portrait 2:3 */}
                    <div className="w-32 sm:w-36 shrink-0 shadow-md rounded-xl overflow-hidden self-center sm:self-start">
                      <BookCover ouvrage={ow} size="md" onCacheCoverUrl={(url) => updateOuvrage(ow.id, { coverUrl: url })} />
                    </div>

                    {/* Données de l'ouvrage */}
                    <div className="flex-1 min-w-0 space-y-2.5">
                      {/* Badges de statut et repères */}
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Statut Disponible / Indisponible */}
                        {isAvailable ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Disponible
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            Indisponible
                          </span>
                        )}

                        {/* Consultation sur place uniquement si non empruntable */}
                        {!ow.empruntable && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
                            <Lock className="w-3.5 h-3.5 text-amber-700" />
                            Consultation sur place uniquement
                          </span>
                        )}

                        {/* Cote */}
                        {ow.cote && (
                          <span className="font-mono text-xs font-bold bg-slate-100 text-slate-800 px-2 py-0.5 rounded-md border border-slate-200">
                            {ow.cote}
                          </span>
                        )}

                        {/* Discipline */}
                        {ow.categorie && (
                          <span className="text-xs text-slate-500 font-medium">
                            {ow.categorie}
                          </span>
                        )}
                      </div>

                      {/* Titre */}
                      <h2 className="text-xl sm:text-2xl font-bold font-serif text-slate-900 leading-tight">
                        {ow.titre}
                      </h2>

                      {/* Auteur(s) */}
                      {ow.auteur && (
                        <p className="text-sm text-slate-700 font-medium">
                          par <strong>{ow.auteur}</strong>
                        </p>
                      )}

                      {/* Maison d'édition et Année */}
                      <p className="text-xs text-slate-500">
                        {ow.editeur && <span>{ow.editeur}</span>}
                        {ow.editeur && ow.anneeEdition && <span> · </span>}
                        {ow.anneeEdition && <span>{ow.anneeEdition}</span>}
                        {ow.pagination ? <span> · {ow.pagination} pages</span> : null}
                      </p>

                      {/* ISBN */}
                      {ow.isbn && (
                        <p className="text-xs text-slate-500">
                          ISBN : <strong className="font-mono text-slate-700">{ow.isbn}</strong>
                        </p>
                      )}

                      {/* Emplacement physique */}
                      <div className="pt-2">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold">
                          <MapPin className="w-4 h-4 text-amber-600 shrink-0" />
                          <span>Emplacement en rayon : <strong>Tiroir {tiroir} · Rangée {rangee}</strong></span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Résumé (uniquement si non vide) */}
                  {ow.resume && ow.resume.trim() && (
                    <div className="pt-4 border-t border-slate-100 space-y-1.5">
                      <h4 className="font-bold uppercase tracking-wider text-slate-400 text-[11px]">
                        Résumé
                      </h4>
                      <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                        {ow.resume}
                      </p>
                    </div>
                  )}

                  {/* Sommaire (uniquement si non vide, sinon ne s'affiche pas du tout) */}
                  {ow.sommaire && ow.sommaire.trim() && (
                    <div className="pt-4 border-t border-slate-100 space-y-1.5">
                      <h4 className="font-bold uppercase tracking-wider text-slate-400 text-[11px]">
                        Sommaire
                      </h4>
                      <div className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-100 font-sans whitespace-pre-line">
                        {ow.sommaire}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Pied de page Espace Étudiant */}
      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Bibliothèque Universitaire • Espace de consultation libre</span>
          <span className="text-slate-400">Présentez votre carte étudiant au guichet pour l'enregistrement du prêt</span>
        </div>
      </footer>
    </div>
  );
};
