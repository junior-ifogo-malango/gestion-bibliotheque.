import React, { useState } from 'react';
import { Search, X, BookOpen, User, ArrowRight } from 'lucide-react';
import { useLibrary } from '../context/LibraryContext';
import { Ouvrage, Adherent } from '../types';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose
}) => {
  const { 
    ouvrages, 
    adherents, 
    getExemplairesByOuvrage,
    setSelectedOuvrage, 
    setSelectedAdherent 
  } = useLibrary();

  const [query, setQuery] = useState('');

  if (!isOpen) return null;

  const cleanQuery = query.toLowerCase().trim();

  const matchingOuvrages: Ouvrage[] = cleanQuery
    ? ouvrages.filter(b => 
        b.titre.toLowerCase().includes(cleanQuery) ||
        b.auteur.toLowerCase().includes(cleanQuery) ||
        b.cote.toLowerCase().includes(cleanQuery) ||
        b.isbn.includes(cleanQuery) ||
        b.categorie.toLowerCase().includes(cleanQuery)
      ).slice(0, 5)
    : [];

  const matchingAdherents: Adherent[] = cleanQuery
    ? adherents.filter(m =>
        m.nom.toLowerCase().includes(cleanQuery) ||
        m.prenom.toLowerCase().includes(cleanQuery) ||
        m.numeroEtudiant.toLowerCase().includes(cleanQuery) ||
        m.emailAcademique.toLowerCase().includes(cleanQuery)
      ).slice(0, 5)
    : [];

  const handleSelectOuvrage = (ow: Ouvrage) => {
    setSelectedOuvrage(ow);
    onClose();
  };

  const handleSelectAdherent = (adh: Adherent) => {
    setSelectedAdherent(adh);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-start justify-center p-4 pt-16 sm:pt-24">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Search Input Bar */}
        <div className="p-4 border-b border-slate-200 flex items-center space-x-3 bg-slate-50">
          <Search className="w-5 h-5 text-amber-600 shrink-0" />
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Recherche globale : titre, auteur, cote, étudiant, N°..."
            className="w-full text-sm bg-transparent border-none focus:outline-hidden text-slate-800 placeholder-slate-400"
          />
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Results */}
        <div className="max-h-96 overflow-y-auto p-4 space-y-4">
          {!cleanQuery ? (
            <div className="p-6 text-center text-xs text-slate-400">
              Tapez pour rechercher un ouvrage, une cote de rangement ou un numéro étudiant.
            </div>
          ) : matchingOuvrages.length === 0 && matchingAdherents.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500">
              Aucun résultat pour "{query}".
            </div>
          ) : (
            <>
              {/* Ouvrages */}
              {matchingOuvrages.length > 0 && (
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-400 px-2 mb-1 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-amber-600" />
                    Ouvrages Référencés ({matchingOuvrages.length})
                  </div>
                  <div className="space-y-1">
                    {matchingOuvrages.map(b => {
                      const copies = getExemplairesByOuvrage(b.id);
                      const available = copies.filter(c => c.statut === 'DISPONIBLE').length;

                      return (
                        <div
                          key={b.id}
                          onClick={() => handleSelectOuvrage(b)}
                          className="p-2.5 rounded-xl hover:bg-amber-50/60 transition cursor-pointer flex items-center justify-between text-xs group"
                        >
                          <div>
                            <div className="font-bold text-slate-800 group-hover:text-amber-800">
                              {b.titre}
                            </div>
                            <div className="text-[11px] text-slate-500 font-mono">
                              {b.auteur} • Cote : {b.cote}
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              available > 0 ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-700'
                            }`}>
                              {available > 0 ? `${available} dispo` : 'Sorti'}
                            </span>
                            <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-1 group-hover:text-amber-600 transition" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Students */}
              {matchingAdherents.length > 0 && (
                <div className="pt-2 border-t border-slate-100">
                  <div className="text-[10px] uppercase font-bold text-slate-400 px-2 mb-1 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-amber-600" />
                    Étudiants Inscrits ({matchingAdherents.length})
                  </div>
                  <div className="space-y-1">
                    {matchingAdherents.map(m => (
                      <div
                        key={m.id}
                        onClick={() => handleSelectAdherent(m)}
                        className="p-2.5 rounded-xl hover:bg-amber-50/60 transition cursor-pointer flex items-center justify-between text-xs group"
                      >
                        <div>
                          <div className="font-bold text-slate-800 group-hover:text-amber-800">
                            {m.prenom} {m.nom}
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono">
                            {m.numeroEtudiant} • {m.emailAcademique}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                            m.statut === 'actif' ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-700'
                          }`}>
                            {m.statut}
                          </span>
                          <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-1 group-hover:text-amber-600 transition" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div className="p-3 bg-slate-50 border-t border-slate-200 text-right">
          <button
            onClick={onClose}
            className="text-xs text-slate-500 hover:text-slate-800"
          >
            Fermer
          </button>
        </div>

      </div>
    </div>
  );
};
