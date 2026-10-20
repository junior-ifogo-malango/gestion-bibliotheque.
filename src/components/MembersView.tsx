import React, { useState, useMemo } from 'react';
import { 
  Users, 
  Search, 
  Upload, 
  ChevronLeft, 
  ChevronRight
} from 'lucide-react';
import { useLibrary } from '../context/LibraryContext';
import { Adherent } from '../types';

/**
 * Normalise une chaîne de caractères (suppression des accents, passage en minuscules)
 */
const normalizeText = (str: string): string => {
  return str
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
};

export const MembersView: React.FC = () => {
  const { 
    adherents, 
    emprunts,
    getAdherentActiveEmprunts, 
    setSelectedAdherent, 
    setIsImportStudentsOpen,
    isEmpruntEnRetard,
    getJoursDeRetard
  } = useLibrary();

  // Sélecteur « Ayant emprunté / Tous ». Par défaut : « Ayant emprunté »
  const [loanFilter, setLoanFilter] = useState<'having_borrowed' | 'all'>('having_borrowed');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const ITEMS_PER_PAGE = 20;

  // Étudiants ayant au moins un emprunt (en cours ou rendu, hors emprunts annulés)
  const studentIdsWithLoans = useMemo(() => {
    const ids = new Set<string>();
    for (const emp of emprunts) {
      if (!emp.annule) {
        ids.add(emp.adherentId);
      }
    }
    return ids;
  }, [emprunts]);

  // Filtrage, recherche sans accent ni majuscule, et tri alphabétique par nom puis prénom
  const filteredAdherents = useMemo(() => {
    const normQuery = normalizeText(searchQuery.trim());
    const queryWords = normQuery ? normQuery.split(/\s+/).filter(Boolean) : [];

    const list = adherents.filter(adh => {
      // 1. Filtre « Ayant emprunté / Tous »
      if (loanFilter === 'having_borrowed' && !studentIdsWithLoans.has(adh.id)) {
        return false;
      }

      // 2. Recherche par nom, prénom ou numéro d'étudiant
      if (queryWords.length > 0) {
        const normNom = normalizeText(adh.nom);
        const normPrenom = normalizeText(adh.prenom);
        const normNum = normalizeText(adh.numeroEtudiant);
        const fullName = `${normNom} ${normPrenom} ${normNum}`;
        const match = queryWords.every(word => fullName.includes(word));
        if (!match) return false;
      }

      return true;
    });

    // Tri alphabétique (par nom de famille puis prénom)
    return list.sort((a, b) => {
      const cmpNom = a.nom.localeCompare(b.nom, 'fr', { sensitivity: 'base' });
      if (cmpNom !== 0) return cmpNom;
      return a.prenom.localeCompare(b.prenom, 'fr', { sensitivity: 'base' });
    });
  }, [adherents, loanFilter, studentIdsWithLoans, searchQuery]);

  // Réinitialiser la page quand la recherche ou le sélecteur change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, loanFilter]);

  // Pagination de 20
  const totalPages = Math.max(1, Math.ceil(filteredAdherents.length / ITEMS_PER_PAGE));
  const paginatedAdherents = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredAdherents.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredAdherents, currentPage]);

  return (
    <div className="space-y-5 pb-12 font-sans max-w-[1000px] mx-auto">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold font-serif text-slate-900">
            Étudiants
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Répertoire des étudiants universitaires issu de l'import officiel.
          </p>
        </div>
        <div>
          <button
            type="button"
            onClick={() => setIsImportStudentsOpen(true)}
            className="min-h-[44px] inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs shadow-2xs transition cursor-pointer"
          >
            <Upload className="w-4 h-4 text-slate-500" />
            <span>Importer la liste (CSV)</span>
          </button>
        </div>
      </div>

      {/* Barre de recherche et sélecteur « Ayant emprunté / Tous » */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Recherche nom, prénom, numéro */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher nom, prénom, numéro d'étudiant..."
            className="w-full pl-9 pr-8 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500 transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold p-1 cursor-pointer"
              aria-label="Effacer la recherche"
            >
              ✕
            </button>
          )}
        </div>

        {/* Sélecteur « Ayant emprunté / Tous » */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200/80 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setLoanFilter('having_borrowed')}
            className={`min-h-[36px] flex-1 sm:flex-initial px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              loanFilter === 'having_borrowed'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Ayant emprunté ({studentIdsWithLoans.size})
          </button>
          <button
            type="button"
            onClick={() => setLoanFilter('all')}
            className={`min-h-[36px] flex-1 sm:flex-initial px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              loanFilter === 'all'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Tous ({adherents.length})
          </button>
        </div>
      </div>

      {/* Liste des étudiants : chaque ligne affiche UNIQUEMENT le nom (en gras) et le prénom */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        {paginatedAdherents.length === 0 ? (
          <div className="p-10 text-center text-slate-400 text-xs">
            Aucun étudiant correspondant.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {paginatedAdherents.map(adh => {
              const activeLoans = getAdherentActiveEmprunts(adh.id);
              const lateLoans = activeLoans.filter(l => isEmpruntEnRetard(l));
              const hasLate = lateLoans.length > 0;
              const maxDaysLate = hasLate 
                ? Math.max(...lateLoans.map(l => getJoursDeRetard(l.dateRetourPrevue)))
                : 0;
              const isResilie = adh.statut === 'resilie';

              return (
                <div
                  key={adh.id}
                  onClick={() => setSelectedAdherent(adh)}
                  className={`min-h-[48px] px-5 py-3.5 flex items-center justify-between gap-3 transition cursor-pointer hover:bg-amber-50/50 ${
                    isResilie ? 'text-slate-400 bg-slate-50/40' : 'text-slate-800'
                  }`}
                >
                  {/* Nom (en gras) et prénom uniquement */}
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-sm truncate">
                      <strong className={isResilie ? 'font-bold text-slate-500' : 'font-bold text-slate-900'}>
                        {adh.nom.toUpperCase()}
                      </strong>{' '}
                      <span className={isResilie ? 'text-slate-400' : 'text-slate-700'}>
                        {adh.prenom}
                      </span>
                    </span>

                    {/* Mention Résilié en gris */}
                    {isResilie && (
                      <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-200 text-slate-600 shrink-0">
                        Résilié
                      </span>
                    )}
                  </div>

                  {/* Pastille J+N si l'étudiant a un retard */}
                  <div className="shrink-0 flex items-center gap-2">
                    {hasLate && (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
                        J+{maxDaysLate}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination de 20 */}
        {totalPages > 1 && (
          <div className="p-4 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <div>
              Affichage de <strong>{(currentPage - 1) * ITEMS_PER_PAGE + 1}</strong> à{' '}
              <strong>{Math.min(currentPage * ITEMS_PER_PAGE, filteredAdherents.length)}</strong> sur{' '}
              <strong>{filteredAdherents.length}</strong> étudiant{filteredAdherents.length > 1 ? 's' : ''}
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="min-h-[36px] px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-1 cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Précédent</span>
              </button>
              <span className="px-2 font-medium">
                Page {currentPage} / {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="min-h-[36px] px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-1 cursor-pointer"
              >
                <span>Suivant</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
