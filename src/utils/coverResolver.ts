/**
 * Service de résolution et gestion garantie des couvertures d'ouvrages
 * Ordre strict de priorité :
 *   a) coverUrl existant (photo téléversée ou URL saisie)
 *   b) Open Library (https://covers.openlibrary.org/b/isbn/{isbn}-L.jpg?default=false)
 *   c) Google Books (https://www.googleapis.com/books/v1/volumes?q=isbn:{isbn})
 *   d) Couverture générée (composant React autonome, fond sobre selon discipline)
 * 
 * Dès qu'une source externe (b ou c) est validée, elle est mise en cache dans coverUrl.
 * Une couverture générée n'est jamais stockée.
 */

import { Ouvrage } from '../types';

// Palette de 8 couleurs sobres stables pour les disciplines
export const CATEGORY_PALETTE: Record<string, { bg: string; accent: string; badge: string }> = {
  'Informatique & Numérique': {
    bg: 'from-slate-900 via-blue-950 to-indigo-950',
    accent: 'border-cyan-400/40 text-cyan-200',
    badge: 'bg-cyan-500/20 text-cyan-200'
  },
  'Sciences & Techniques': {
    bg: 'from-slate-900 via-teal-950 to-emerald-950',
    accent: 'border-emerald-400/40 text-emerald-200',
    badge: 'bg-emerald-500/20 text-emerald-200'
  },
  'Mathématiques & Physique': {
    bg: 'from-slate-900 via-purple-950 to-violet-950',
    accent: 'border-violet-400/40 text-violet-200',
    badge: 'bg-violet-500/20 text-violet-200'
  },
  'Histoire & Géographie': {
    bg: 'from-stone-900 via-amber-950 to-amber-900',
    accent: 'border-amber-400/40 text-amber-200',
    badge: 'bg-amber-500/20 text-amber-200'
  },
  'Économie & Gestion': {
    bg: 'from-slate-900 via-stone-900 to-emerald-950',
    accent: 'border-teal-400/40 text-teal-200',
    badge: 'bg-teal-500/20 text-teal-200'
  },
  'Droit & Sciences Politiques': {
    bg: 'from-slate-900 via-stone-900 to-rose-950',
    accent: 'border-rose-400/40 text-rose-200',
    badge: 'bg-rose-500/20 text-rose-200'
  },
  'Philosophie & Éthique': {
    bg: 'from-stone-950 via-neutral-900 to-zinc-900',
    accent: 'border-stone-400/40 text-stone-200',
    badge: 'bg-stone-500/20 text-stone-200'
  },
  'Langues & Littérature': {
    bg: 'from-slate-900 via-blue-950 to-sky-950',
    accent: 'border-sky-400/40 text-sky-200',
    badge: 'bg-sky-500/20 text-sky-200'
  }
};

export const DEFAULT_CATEGORY_COLOR = {
  bg: 'from-slate-900 via-slate-800 to-zinc-900',
  accent: 'border-slate-400/40 text-slate-200',
  badge: 'bg-slate-500/20 text-slate-200'
};

/**
 * Nettoie une chaîne ISBN
 */
export const cleanIsbnString = (rawIsbn?: string): string => {
  if (!rawIsbn) return '';
  return rawIsbn.replace(/[^0-9X]/gi, '').trim();
};

/**
 * URLs potentielles selon la priorité
 */
export const getCandidateCoverUrls = (ouvrage: Partial<Ouvrage>): string[] => {
  const candidates: string[] = [];

  // a) coverUrl existant
  if (ouvrage.coverUrl && ouvrage.coverUrl.trim()) {
    candidates.push(ouvrage.coverUrl.trim());
  }

  // b) Open Library via ISBN
  const cleanIsbn = cleanIsbnString(ouvrage.isbn);
  if (cleanIsbn.length === 10 || cleanIsbn.length === 13) {
    const olUrl = `https://covers.openlibrary.org/b/isbn/${cleanIsbn}-L.jpg?default=false`;
    if (!candidates.includes(olUrl)) {
      candidates.push(olUrl);
    }
  }

  return candidates;
};

/**
 * Interroge Google Books pour trouver une miniature de couverture en HTTPS
 */
export const fetchGoogleBooksThumbnail = async (rawIsbn?: string): Promise<string | null> => {
  const cleanIsbn = cleanIsbnString(rawIsbn);
  if (cleanIsbn.length !== 10 && cleanIsbn.length !== 13) return null;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(`https://www.googleapis.com/books/v1/volumes?q=isbn:${cleanIsbn}`, {
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data.items && data.items.length > 0) {
        const info = data.items[0].volumeInfo;
        const cover = info.imageLinks?.thumbnail || 
                      info.imageLinks?.smallThumbnail || 
                      info.imageLinks?.medium || 
                      info.imageLinks?.large;
        if (cover) {
          return cover.replace(/^http:\/\//i, 'https://');
        }
      }
    }
  } catch {
    // Échec sans erreur visible
  }
  return null;
};

/**
 * Redimensionne une photo dans le navigateur (largeur max 400px, JPEG qualité 0.8)
 */
export const resizeImageFileToCoverDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error("Le fichier sélectionné n'est pas une image."));
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const maxW = 400;
        let targetW = img.width;
        let targetH = img.height;

        if (targetW > maxW) {
          targetH = Math.round((targetH * maxW) / targetW);
          targetW = maxW;
        }

        const canvas = document.createElement('canvas');
        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error("Impossible de traiter l'image."));
          return;
        }

        ctx.drawImage(img, 0, 0, targetW, targetH);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error("Échec du chargement de l'image."));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error("Erreur de lecture du fichier."));
    reader.readAsDataURL(file);
  });
};
