/**
 * Règle métier stricte de coloration des pastilles de retard :
 * Le rouge sert UNIQUEMENT aux retards, partout dans l'application.
 * - Retard de 1 à 4 jours : pastille rouge clair (fond rose pâle, texte rouge).
 * - Retard de 5 à 7 jours : pastille rouge vif.
 * - Retard de 8 jours et plus, ou « à contacter » : pastille rouge foncé.
 * - Chaque pastille affiche « J+N ».
 * La couleur est calculée dynamiquement à partir de la date active du jour, jamais stockée.
 */

export interface OverdueBadgeInfo {
  className: string;
  label: string;
}

export function getOverdueBadgeInfo(daysLate: number, isToContact?: boolean): OverdueBadgeInfo {
  const safeDays = Math.max(1, daysLate);
  const label = `J+${safeDays}`;

  if (safeDays >= 8 || isToContact) {
    // 8 jours et plus, ou « à contacter » : pastille rouge foncé
    return {
      className: 'bg-red-950 text-red-100 border border-red-900 font-bold',
      label
    };
  }

  if (safeDays >= 5) {
    // 5 à 7 jours : pastille rouge vif
    return {
      className: 'bg-red-600 text-white font-bold',
      label
    };
  }

  // 1 à 4 jours : pastille rouge clair (fond rose pâle, texte rouge)
  return {
    className: 'bg-red-50 text-red-700 border border-red-200 font-semibold',
    label
  };
}
