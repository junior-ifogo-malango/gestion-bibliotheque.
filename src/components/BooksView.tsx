import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Plus, 
  BookOpen, 
  MapPin, 
  Layers, 
  Printer, 
  QrCode, 
  Camera,
  CheckCircle2,
  AlertCircle,
  Lock,
  Clock
} from 'lucide-react';
import { useLibrary } from '../context/LibraryContext';
import { BookCategory } from '../types';
import { BookCover } from './BookCover';

export const BooksView: React.FC = () => {
  const { 
    ouvrages, 
    exemplaires, 
    getExemplairesByOuvrage, 
    setSelectedOuvrage, 
    updateOuvrage,
    setIsNewOuvrageOpen,
    setActivePrintLabelsOuvrageId,
    setIsQRScannerOpen
  } = useLibrary();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [availabilityFilter, setAvailabilityFilter] = useState<'all' | 'available' | 'borrowed'>('all');

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

  const filteredOuvrages = useMemo(() => {
    return ouvrages.filter(ow => {
      if (selectedCategory !== 'all' && ow.categorie !== selectedCategory) return false;

      const exList = getExemplairesByOuvrage(ow.id);
      const availableCopies = exList.filter(e => e.statut === 'DISPONIBLE').length;

      if (availabilityFilter === 'available' && availableCopies === 0) return false;
      if (availabilityFilter === 'borrowed' && availableCopies > 0) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const match =
          ow.titre.toLowerCase().includes(q) ||
          ow.auteur.toLowerCase().includes(q) ||
          ow.cote.toLowerCase().includes(q) ||
          ow.isbn.includes(q) ||
          ow.editeur.toLowerCase().includes(q);
        if (!match) return false;
      }

      return true;
    });
  }, [ouvrages, selectedCategory, availabilityFilter, searchQuery, getExemplairesByOuvrage]);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-2xl font-bold font-serif text-slate-900">
            Fonds Documentaire & Gestion des Exemplaires
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Inventaire des références bibliographiques, suivi des exemplaires physiques et étiquetage QR.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsNewOuvrageOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-medium text-xs shadow-2xs transition transform active:scale-95"
          >
            <Plus className="w-4 h-4 text-amber-100" />
            <span>Nouvel ouvrage</span>
          </button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        {/* Category Pills (Ligne défilante avec active bien marquée) */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all shrink-0 ${
                selectedCategory === cat
                  ? 'bg-slate-900 text-amber-300 ring-2 ring-amber-500/70 shadow-sm'
                  : 'bg-white border border-slate-200/90 text-slate-600 hover:text-slate-900 hover:bg-slate-50 shadow-2xs'
              }`}
            >
              {cat === 'all' ? 'Toutes les disciplines' : cat}
            </button>
          ))}
        </div>

        {/* Search row */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher titre, auteur, cote (ex: INFO-052)..."
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <select
              value={availabilityFilter}
              onChange={(e) => setAvailabilityFilter(e.target.value as any)}
              className="text-xs font-medium rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 focus:outline-hidden"
            >
              <option value="all">Tous les ouvrages</option>
              <option value="available">Ayant des exemplaires disponibles</option>
              <option value="borrowed">Tous exemplaires empruntés</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grid of Ouvrages */}
      {filteredOuvrages.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/90 p-12 text-center shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-400">
            <BookOpen className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-800 font-serif">Aucun ouvrage trouvé</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4 leading-relaxed">
            Aucun livre ne correspond à votre filtre de recherche ou de disponibilité.
          </p>
          <button
            onClick={() => { setSearchQuery(''); setSelectedCategory('all'); setAvailabilityFilter('all'); }}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition shadow-xs"
          >
            Réinitialiser les filtres
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredOuvrages.map(ow => {
            const exList = getExemplairesByOuvrage(ow.id);
            const activeCopies = exList;
            const availableCopies = exList.filter(e => e.statut === 'DISPONIBLE');
            const firstAvailable = availableCopies[0];
            const firstAnyCopy = activeCopies[0];

            return (
              <div
                key={ow.id}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:border-amber-300 hover:shadow-md transition p-4 sm:p-5 flex flex-col sm:flex-row items-stretch sm:items-start gap-4 group"
              >
                {/* Couverture à gauche (ou en haut sur téléphone) */}
                <div 
                  onClick={() => setSelectedOuvrage(ow)}
                  className="w-24 sm:w-28 shrink-0 self-center sm:self-start shadow-xs rounded-lg overflow-hidden cursor-pointer"
                >
                  <BookCover
                    ouvrage={ow}
                    size="sm"
                    onCacheCoverUrl={(url) => updateOuvrage(ow.id, { coverUrl: url })}
                  />
                </div>

                {/* Contenu : Titre, auteur, éditeur et année, cote en petite étiquette, badge de disponibilité */}
                <div className="flex-1 min-w-0 flex flex-col justify-between h-full">
                  <div>
                    {/* Cote en petite étiquette & discipline */}
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="inline-flex items-center font-mono text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                        {ow.cote}
                      </span>
                      <span className="text-[11px] text-slate-400 font-medium truncate">
                        {ow.categorie}
                      </span>
                    </div>

                    {/* Titre */}
                    <h3 
                      onClick={() => setSelectedOuvrage(ow)}
                      className="font-bold font-serif text-base text-slate-900 group-hover:text-amber-800 transition cursor-pointer line-clamp-2 leading-snug"
                    >
                      {ow.titre}
                    </h3>

                    {/* Auteur */}
                    <p className="text-xs text-slate-600 font-medium mt-1">
                      {ow.auteur}
                    </p>

                    {/* Éditeur et Année */}
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {ow.editeur} · {ow.anneeEdition}{ow.pagination ? ` (${ow.pagination} p.)` : ''}
                    </p>

                    {/* Résumé */}
                    {ow.resume && (
                      <p className="text-xs text-slate-500 line-clamp-2 mt-2 leading-relaxed bg-slate-50/70 p-2 rounded-lg border border-slate-100">
                        {ow.resume}
                      </p>
                    )}
                  </div>

                  {/* Disponibilité compacte & Actions */}
                  <div className="mt-3.5 pt-2.5 border-t border-slate-100 space-y-2.5">
                    {/* 1. Disponibilité : ligne compacte et horizontale sur une seule ligne */}
                    <div className="whitespace-nowrap overflow-hidden text-ellipsis">
                      {!ow.empruntable ? (
                        /* Ouvrage à consultation sur place : « Sur place uniquement » */
                        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[12px] font-semibold bg-amber-50 text-amber-900 border border-amber-200/80">
                          <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                          <span>Sur place uniquement</span>
                          {firstAnyCopy && (
                            <>
                              <span className="text-amber-400">·</span>
                              <span className="font-mono">{firstAnyCopy.emplacement.tiroir} / {firstAnyCopy.emplacement.rangee}</span>
                              <span className="text-amber-400">·</span>
                              <span className="font-mono">{activeCopies.length} ex.</span>
                            </>
                          )}
                        </span>
                      ) : availableCopies.length > 0 ? (
                        /* Disponible : vert ● Disponible · T1 / R2 · 2/3 ex. */
                        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[12px] font-semibold bg-emerald-50 text-emerald-900 border border-emerald-200/80">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                          <span>Disponible</span>
                          <span className="text-emerald-400">·</span>
                          <span className="font-mono">{firstAvailable?.emplacement.tiroir} / {firstAvailable?.emplacement.rangee}</span>
                          <span className="text-emerald-400">·</span>
                          <span className="font-mono">{availableCopies.length}/{activeCopies.length} ex.</span>
                        </span>
                      ) : (
                        /* Aucun exemplaire disponible : gris avec « Indisponible » */
                        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[12px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                          <span className="w-2 h-2 rounded-full bg-slate-400 shrink-0" />
                          <span>Indisponible</span>
                          {firstAnyCopy && (
                            <>
                              <span className="text-slate-300">·</span>
                              <span className="font-mono">{firstAnyCopy.emplacement.tiroir} / {firstAnyCopy.emplacement.rangee}</span>
                            </>
                          )}
                          <span className="text-slate-300">·</span>
                          <span className="font-mono">0/{activeCopies.length} ex.</span>
                        </span>
                      )}
                    </div>

                    {/* 2. Boutons du bas : Planche QR à GAUCHE avec contour, Exemplaires (N) à droite, même hauteur, une seule ligne */}
                    <div className="flex items-center justify-between gap-2 pt-0.5">
                      <button
                        type="button"
                        onClick={() => setActivePrintLabelsOuvrageId(ow.id)}
                        className="h-8 px-2.5 sm:px-3 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 text-xs font-semibold flex items-center gap-1.5 shrink-0 transition whitespace-nowrap cursor-pointer shadow-2xs"
                        title="Imprimer les étiquettes QR de cet ouvrage"
                      >
                        <Printer className="w-3.5 h-3.5 text-slate-500" />
                        <span>Planche QR</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedOuvrage(ow)}
                        className="h-8 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition flex items-center justify-center shrink-0 whitespace-nowrap cursor-pointer shadow-xs"
                      >
                        <span>Exemplaires ({exList.length})</span>
                      </button>
                    </div>
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
