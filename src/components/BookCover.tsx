/**
 * Composant universel de couverture d'ouvrage
 * Résolution garantie sans erreur visible :
 *   a) coverUrl existant (photo téléversée ou URL saisie)
 *   b) Open Library (via ISBN)
 *   c) Google Books (imageLinks.thumbnail en https)
 *   d) Couverture générée (composant React autonome, ratio 2:3, fond sobre selon discipline)
 * 
 * Dès qu'une source externe (b ou c) est validée, elle est mise en cache dans coverUrl.
 */

import React, { useState, useEffect, useRef } from 'react';
import { BookOpen, GraduationCap } from 'lucide-react';
import { Ouvrage } from '../types';
import { 
  CATEGORY_PALETTE, 
  DEFAULT_CATEGORY_COLOR, 
  cleanIsbnString, 
  fetchGoogleBooksThumbnail 
} from '../utils/coverResolver';

interface BookCoverProps {
  ouvrage?: Partial<Ouvrage>;
  titre?: string;
  auteur?: string;
  categorie?: string;
  coverUrl?: string;
  isbn?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  onCacheCoverUrl?: (url: string) => void;
}

export const BookCover: React.FC<BookCoverProps> = ({
  ouvrage,
  titre: propTitre,
  auteur: propAuteur,
  categorie: propCat,
  coverUrl: propCoverUrl,
  isbn: propIsbn,
  className = '',
  size = 'md',
  onCacheCoverUrl
}) => {
  const titre = ouvrage?.titre || propTitre || 'Ouvrage sans titre';
  const auteur = ouvrage?.auteur || propAuteur || 'Auteur non renseigné';
  const categorie = ouvrage?.categorie || propCat || 'Général & Référence';
  const initialCoverUrl = ouvrage?.coverUrl !== undefined ? ouvrage.coverUrl : propCoverUrl;
  const isbn = ouvrage?.isbn || propIsbn || '';

  // État de la source d'image actuellement tentée :
  // sourceIndex: 
  //   0: coverUrl existant (si présent)
  //   1: Open Library
  //   2: Google Books
  //   3: Échec total -> couverture générée
  const [sourceIndex, setSourceIndex] = useState<number>(0);
  const [currentSrc, setCurrentSrc] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const isMounted = useRef<boolean>(true);

  const cleanIsbn = cleanIsbnString(isbn);
  const hasValidIsbn = cleanIsbn.length === 10 || cleanIsbn.length === 13;

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Initialisation à chaque changement d'ouvrage ou d'URL
  useEffect(() => {
    setIsLoaded(false);
    if (initialCoverUrl && initialCoverUrl.trim()) {
      setSourceIndex(0);
      setCurrentSrc(initialCoverUrl.trim());
    } else if (hasValidIsbn) {
      setSourceIndex(1);
      setCurrentSrc(`https://covers.openlibrary.org/b/isbn/${cleanIsbn}-L.jpg?default=false`);
    } else {
      setSourceIndex(3);
      setCurrentSrc(null);
    }
  }, [initialCoverUrl, cleanIsbn, hasValidIsbn]);

  // Étape suivante en cas d'erreur ou d'image invalide (< 50px)
  const advanceToNextSource = async () => {
    setIsLoaded(false);
    if (sourceIndex === 0) {
      // Passer à Open Library si ISBN disponible, sinon Google Books ou Couverture générée
      if (hasValidIsbn) {
        setSourceIndex(1);
        setCurrentSrc(`https://covers.openlibrary.org/b/isbn/${cleanIsbn}-L.jpg?default=false`);
      } else {
        setSourceIndex(3);
        setCurrentSrc(null);
      }
    } else if (sourceIndex === 1) {
      // Open Library a échoué -> Essayer Google Books
      setSourceIndex(2);
      if (hasValidIsbn) {
        const gbThumbnail = await fetchGoogleBooksThumbnail(cleanIsbn);
        if (isMounted.current) {
          if (gbThumbnail) {
            setCurrentSrc(gbThumbnail);
          } else {
            setSourceIndex(3);
            setCurrentSrc(null);
          }
        }
      } else {
        setSourceIndex(3);
        setCurrentSrc(null);
      }
    } else {
      // Google Books a échoué ou plus de sources -> Couverture générée
      setSourceIndex(3);
      setCurrentSrc(null);
    }
  };

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    // Détection d'image vide ou transparente de 1 pixel retournée par certains fournisseurs
    if (img.naturalWidth < 40 || img.naturalHeight < 40) {
      advanceToNextSource();
    } else {
      setIsLoaded(true);
      // Mettre en cache dans coverUrl si trouvé via b (Open Library) ou c (Google Books)
      if ((sourceIndex === 1 || sourceIndex === 2) && currentSrc && onCacheCoverUrl) {
        onCacheCoverUrl(currentSrc);
      }
    }
  };

  const catTheme = CATEGORY_PALETTE[categorie] || DEFAULT_CATEGORY_COLOR;
  const isSmall = size === 'sm';
  const isLarge = size === 'lg';

  // Si une image valide est en cours ou chargée
  const renderImage = sourceIndex < 3 && currentSrc;

  return (
    <div 
      className={`relative aspect-[2/3] w-full overflow-hidden rounded-xl shadow-xs ring-1 ring-black/10 select-none ${className}`}
      title={`${titre} - ${auteur}`}
    >
      {/* (d) Couverture générée : toujours prête en fond ou affichée si aucune image */}
      <div 
        className={`absolute inset-0 w-full h-full bg-gradient-to-br ${catTheme.bg} text-white p-3 flex flex-col justify-between`}
      >
        {/* Ombre de reliure gauche */}
        <div className="absolute inset-y-0 left-0 w-1.5 bg-gradient-to-r from-black/50 via-black/20 to-transparent pointer-events-none" />
        
        {/* En-tête discipline */}
        <div className="relative z-10 flex items-start justify-between gap-1">
          <span className={`text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded backdrop-blur-xs ${catTheme.badge} truncate max-w-[85%]`}>
            {categorie}
          </span>
          <GraduationCap className="w-3.5 h-3.5 text-white/40 shrink-0" />
        </div>

        {/* Titre (3 lignes max) & auteur */}
        <div className="relative z-10 my-auto py-1">
          <div className="w-5 h-0.5 bg-amber-400/80 mb-1.5 rounded-full" />
          <h4 className={`font-serif font-bold text-white tracking-tight leading-snug line-clamp-3 ${
            isSmall ? 'text-[11px]' : isLarge ? 'text-sm sm:text-base' : 'text-xs sm:text-sm'
          }`}>
            {titre}
          </h4>
          <p className={`text-white/80 font-medium mt-1.5 line-clamp-2 ${
            isSmall ? 'text-[9px]' : 'text-[10px]'
          }`}>
            {auteur}
          </p>
        </div>

        {/* Pied : Mention bibliothèque */}
        <div className="relative z-10 pt-1.5 border-t border-white/10 flex items-center justify-between text-[8px] text-white/50 font-mono">
          <div className="flex items-center gap-1">
            <BookOpen className="w-3 h-3 text-white/40" />
            <span className="uppercase tracking-wider">BiblioPrêt</span>
          </div>
          <span className="opacity-60">EST Univ.</span>
        </div>
      </div>

      {/* Image externe superposée avec transition douce */}
      {renderImage && (
        <img
          key={currentSrc}
          src={currentSrc}
          alt={`Couverture : ${titre}`}
          loading="lazy"
          referrerPolicy="no-referrer"
          onLoad={handleImageLoad}
          onError={advanceToNextSource}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-200 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
        />
      )}
    </div>
  );
};
