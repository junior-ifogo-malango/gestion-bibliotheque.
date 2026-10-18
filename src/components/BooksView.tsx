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
                    titre={ow.titre}
                    auteur={ow.auteur}
                    categorie={ow.categorie}
                    coverUrl={ow.coverUrl}
                    coverGradient={ow.coverGradient}
                    size="sm"
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

                  {/* Badges de disponibilité bien visibles & Actions */}
                  <div className="mt-3.5 pt-3 border-t border-slate-100 space-y-2.5">
                    {!ow.empruntable ? (
                      /* Badge orange bien visible : « Consultation sur place uniquement » */
                      <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-950 text-xs">
                        <div className="font-bold flex items-center justify-between gap-1.5 text-amber-900">
                          <span className="flex items-center gap-1.5">
                            <Lock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            Consultation sur place uniquement
                          </span>
                        </div>
                        {firstAnyCopy && (
                          <div className="mt-1 font-mono text-[11px] text-amber-800 flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-amber-600 shrink-0" />
                            <span>Emplacement : <strong>Tiroir {firstAnyCopy.emplacement.tiroir}</strong>, <strong>Rangée {firstAnyCopy.emplacement.rangee}</strong></span>
                          </div>
                        )}
                      </div>
                    ) : availableCopies.length > 0 ? (
                      /* Badge vert bien visible : « Disponible : tiroir X, rangée Y » */
                      <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 text-xs">
                        <div className="font-bold flex items-center justify-between gap-1.5 text-emerald-900">
                          <span className="flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            Disponible : tiroir {firstAvailable?.emplacement.tiroir}, rangée {firstAvailable?.emplacement.rangee}
                          </span>
                          <span className="text-[11px] text-emerald-700 font-medium shrink-0">
                            {availableCopies.length}/{activeCopies.length} ex.
                          </span>
                        </div>
                      </div>
                    ) : (
                      /* Badge gris : « Indisponible » */
                      <div className="p-2.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-800 text-xs">
                        <div className="font-bold flex items-center justify-between gap-1.5 text-slate-700">
                          <span className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                            Indisponible
                          </span>
                          <span className="text-[11px] text-slate-500 font-medium">
                            0/{activeCopies.length} en rayon
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Actions de gestion conservées */}
                    <div className="flex items-center justify-between pt-1">
                      <button
                        onClick={() => setActivePrintLabelsOuvrageId(ow.id)}
                        className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1"
                        title="Imprimer les étiquettes QR de cet ouvrage"
                      >
                        <Printer className="w-3.5 h-3.5 text-amber-600" />
                        <span>Planche QR</span>
                      </button>

                      <button
                        onClick={() => setSelectedOuvrage(ow)}
                        className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition shadow-xs"
                      >
                        Fiche & Exemplaires ({exList.length})
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
