import React, { useState, useEffect } from 'react';
import { BookOpen, GraduationCap } from 'lucide-react';
import { BookCategory } from '../types';

interface BookCoverProps {
  titre: string;
  auteur: string;
  categorie?: BookCategory | string;
  coverUrl?: string;
  coverGradient?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const CATEGORY_COLORS: Record<string, { bg: string; accent: string; badge: string }> = {
  'Informatique & Numérique': {
    bg: 'from-blue-900 via-indigo-900 to-slate-900',
    accent: 'border-cyan-400/40 text-cyan-200',
    badge: 'bg-cyan-500/20 text-cyan-200'
  },
  'Sciences & Techniques': {
    bg: 'from-emerald-900 via-teal-900 to-slate-900',
    accent: 'border-emerald-400/40 text-emerald-200',
    badge: 'bg-emerald-500/20 text-emerald-200'
  },
  'Mathématiques & Physique': {
    bg: 'from-violet-900 via-purple-900 to-slate-900',
    accent: 'border-violet-400/40 text-violet-200',
    badge: 'bg-violet-500/20 text-violet-200'
  },
  'Histoire & Géographie': {
    bg: 'from-amber-900 via-yellow-900 to-stone-900',
    accent: 'border-amber-400/40 text-amber-200',
    badge: 'bg-amber-500/20 text-amber-200'
  },
  'Économie & Gestion': {
    bg: 'from-teal-900 via-emerald-950 to-slate-900',
    accent: 'border-teal-400/40 text-teal-200',
    badge: 'bg-teal-500/20 text-teal-200'
  },
  'Droit & Sciences Politiques': {
    bg: 'from-rose-950 via-red-950 to-slate-900',
    accent: 'border-rose-400/40 text-rose-200',
    badge: 'bg-rose-500/20 text-rose-200'
  },
  'Philosophie & Éthique': {
    bg: 'from-stone-900 via-neutral-900 to-slate-950',
    accent: 'border-stone-400/40 text-stone-200',
    badge: 'bg-stone-500/20 text-stone-200'
  },
  'Langues & Littérature': {
    bg: 'from-sky-950 via-blue-950 to-slate-900',
    accent: 'border-sky-400/40 text-sky-200',
    badge: 'bg-sky-500/20 text-sky-200'
  },
  'Médecine & Santé': {
    bg: 'from-rose-900 via-pink-950 to-slate-900',
    accent: 'border-pink-400/40 text-pink-200',
    badge: 'bg-pink-500/20 text-pink-200'
  },
  'Général & Référence': {
    bg: 'from-slate-800 via-slate-900 to-zinc-950',
    accent: 'border-slate-400/40 text-slate-200',
    badge: 'bg-slate-500/20 text-slate-200'
  }
};

export const BookCover: React.FC<BookCoverProps> = ({
  titre,
  auteur,
  categorie = 'Général & Référence',
  coverUrl,
  coverGradient,
  className = '',
  size = 'md'
}) => {
  const [hasError, setHasError] = useState(false);

  // Re-enable image check if URL changes
  useEffect(() => {
    setHasError(false);
  }, [coverUrl]);

  const catTheme = CATEGORY_COLORS[categorie] || CATEGORY_COLORS['Général & Référence'];
  const gradientClass = coverGradient ? `bg-gradient-to-br ${coverGradient}` : `bg-gradient-to-br ${catTheme.bg}`;

  const isSmall = size === 'sm';
  const isLarge = size === 'lg';

  // If coverUrl is provided and has not errored, render the real image
  if (coverUrl && coverUrl.trim() && !hasError) {
    return (
      <div 
        className={`relative aspect-[2/3] overflow-hidden rounded-xl bg-slate-900 shadow-md ring-1 ring-black/10 select-none ${className}`}
      >
        <img
          src={coverUrl}
          alt={`Couverture de ${titre}`}
          loading="lazy"
          onError={() => setHasError(true)}
          className="w-full h-full object-cover transition duration-200 hover:scale-[1.02]"
        />
        {/* Subtle academic spine shadow effect */}
        <div className="absolute inset-y-0 left-0 w-1.5 bg-gradient-to-r from-black/40 to-transparent pointer-events-none" />
      </div>
    );
  }

  // Generated replacement cover (fond de la couleur de la discipline, titre et auteur)
  return (
    <div 
      className={`relative aspect-[2/3] overflow-hidden rounded-xl ${gradientClass} text-white shadow-md ring-1 ring-white/10 p-3 sm:p-4 flex flex-col justify-between select-none ${className}`}
    >
      {/* Spine shadow overlay */}
      <div className="absolute inset-y-0 left-0 w-2 bg-gradient-to-r from-black/50 via-black/20 to-transparent pointer-events-none" />

      {/* Top discipline tag & icon */}
      <div className="relative z-10 flex items-start justify-between gap-1">
        <span className={`text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded backdrop-blur-xs ${catTheme.badge} truncate max-w-[85%]`}>
          {categorie}
        </span>
        <GraduationCap className="w-3.5 h-3.5 text-white/40 shrink-0" />
      </div>

      {/* Middle: Title & Author */}
      <div className="relative z-10 my-auto py-2">
        <div className="w-6 h-0.5 bg-amber-400/80 mb-2 rounded-full" />
        <h4 className={`font-serif font-bold text-white tracking-tight leading-snug line-clamp-3 ${
          isSmall ? 'text-[11px]' : isLarge ? 'text-base sm:text-lg' : 'text-xs sm:text-sm'
        }`}>
          {titre}
        </h4>
        <p className={`text-white/80 font-medium mt-1.5 line-clamp-2 ${
          isSmall ? 'text-[9px]' : 'text-[11px]'
        }`}>
          {auteur}
        </p>
      </div>

      {/* Bottom university seal mark */}
      <div className="relative z-10 pt-2 border-t border-white/10 flex items-center justify-between text-[9px] text-white/50 font-mono">
        <div className="flex items-center gap-1">
          <BookOpen className="w-3 h-3 text-white/40" />
          <span className="uppercase tracking-widest text-[8px]">BiblioPrêt</span>
        </div>
        <span className="text-[8px] opacity-60">Édition Univ.</span>
      </div>
    </div>
  );
};
