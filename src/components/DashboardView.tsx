import React, { useState } from 'react';
import { 
  CheckCircle2, 
  Clock 
} from 'lucide-react';
import { useLibrary } from '../context/LibraryContext';
import { Emprunt } from '../types';
import { ReminderModal } from './ReminderModal';
import { getOverdueBadgeInfo } from '../utils/overdueUtils';

export const DashboardView: React.FC = () => {
  const { 
    emprunts, 
    stats, 
    setActiveManagerTab, 
    getOuvrageById, 
    getAdherentById, 
    getJoursDeRetard,
    isEmpruntEnRetard,
    isEmpruntAContacter
  } = useLibrary();

  const [selectedLoanForNotice, setSelectedLoanForNotice] = useState<Emprunt | null>(null);

  // 1. Éléments « À traiter », ordonnés du plus critique au moins critique :
  // - Emprunts « à contacter »
  // - Autres emprunts en retard
  const aContacterLoans = emprunts
    .filter(l => l.statut === 'en_cours' && !l.annule && isEmpruntEnRetard(l) && isEmpruntAContacter(l))
    .sort((a, b) => getJoursDeRetard(b.dateRetourPrevue) - getJoursDeRetard(a.dateRetourPrevue));

  const standardOverdueLoans = emprunts
    .filter(l => l.statut === 'en_cours' && !l.annule && isEmpruntEnRetard(l) && !isEmpruntAContacter(l))
    .sort((a, b) => getJoursDeRetard(b.dateRetourPrevue) - getJoursDeRetard(a.dateRetourPrevue));

  interface ItemToProcess {
    id: string;
    titre: string;
    etudiant: string;
    daysLate: number;
    isToContact: boolean;
    actionLabel: string;
    onAction: () => void;
  }

  const itemsToProcess: ItemToProcess[] = [
    // Emprunts « à contacter »
    ...aContacterLoans.map(loan => {
      const ow = getOuvrageById(loan.ouvrageId);
      const adh = getAdherentById(loan.adherentId);
      const days = getJoursDeRetard(loan.dateRetourPrevue);
      return {
        id: `contact-${loan.id}`,
        titre: ow?.titre || 'Ouvrage inconnu',
        etudiant: adh ? `${adh.prenom} ${adh.nom}` : 'Étudiant inconnu',
        daysLate: days,
        isToContact: true,
        actionLabel: 'Contacter',
        onAction: () => setSelectedLoanForNotice(loan)
      };
    }),

    // Autres retards
    ...standardOverdueLoans.map(loan => {
      const ow = getOuvrageById(loan.ouvrageId);
      const adh = getAdherentById(loan.adherentId);
      const days = getJoursDeRetard(loan.dateRetourPrevue);
      return {
        id: `retard-${loan.id}`,
        titre: ow?.titre || 'Ouvrage inconnu',
        etudiant: adh ? `${adh.prenom} ${adh.nom}` : 'Étudiant inconnu',
        daysLate: days,
        isToContact: false,
        actionLabel: 'Rappeler',
        onAction: () => setSelectedLoanForNotice(loan)
      };
    })
  ];

  const treatedLoanIds = new Set([
    ...aContacterLoans.map(l => l.id),
    ...standardOverdueLoans.map(l => l.id)
  ]);

  // 2. Activité récente : 5 lignes maximum, sans répéter les retards déjà affichés dans « À traiter »
  const recentMovements = emprunts
    .filter(l => !l.annule && !treatedLoanIds.has(l.id))
    .slice(0, 5)
    .map(loan => {
      const ow = getOuvrageById(loan.ouvrageId);
      const adh = getAdherentById(loan.adherentId);
      const isReturned = loan.statut === 'rendu';

      let statutText = '';
      if (isReturned) {
        statutText = loan.reclasse
          ? 'Rangé'
          : (loan.dateRetourEffective 
              ? `Restitué le ${new Date(loan.dateRetourEffective).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}`
              : 'Restitué');
      } else {
        statutText = `Échéance le ${new Date(loan.dateRetourPrevue).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}`;
      }

      return {
        id: loan.id,
        titre: ow?.titre || 'Ouvrage inconnu',
        etudiant: adh ? `${adh.prenom} ${adh.nom}` : 'Étudiant inconnu',
        statut: statutText,
        isReturned
      };
    });

  return (
    <div className="space-y-6 pb-12 font-sans max-w-[1100px] mx-auto">
      
      {/* 1. Quatre indicateurs (Emprunts en cours, Exemplaires disponibles, Adhérents actifs, Retards à traiter) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Indicateur 1 : Emprunts en cours */}
        <button
          type="button"
          onClick={() => setActiveManagerTab('loans')}
          className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs hover:border-slate-300 transition text-left cursor-pointer"
        >
          <div className="text-3xl font-semibold text-slate-900">
            {stats.empruntsEnCours}
          </div>
          <div className="text-sm text-slate-600 mt-1 font-normal">
            Emprunts en cours
          </div>
        </button>

        {/* Indicateur 2 : Exemplaires disponibles */}
        <button
          type="button"
          onClick={() => setActiveManagerTab('catalog')}
          className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs hover:border-slate-300 transition text-left cursor-pointer"
        >
          <div className="text-3xl font-semibold text-slate-900">
            {stats.disponiblesEnRayon}
          </div>
          <div className="text-sm text-slate-600 mt-1 font-normal">
            Exemplaires disponibles
          </div>
        </button>

        {/* Indicateur 3 : Adhérents actifs */}
        <button
          type="button"
          onClick={() => setActiveManagerTab('students')}
          className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs hover:border-slate-300 transition text-left cursor-pointer"
        >
          <div className="text-3xl font-semibold text-slate-900">
            {stats.adherentsActifs}
          </div>
          <div className="text-sm text-slate-600 mt-1 font-normal">
            Adhérents actifs
          </div>
        </button>

        {/* Indicateur 4 : Retards à traiter */}
        <button
          type="button"
          onClick={() => setActiveManagerTab('alerts')}
          className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs hover:border-slate-300 transition text-left cursor-pointer"
        >
          <div className={`text-3xl font-semibold ${stats.empruntsEnRetard > 0 ? 'text-red-700' : 'text-slate-900'}`}>
            {stats.empruntsEnRetard}
          </div>
          <div className="text-sm text-slate-600 mt-1 font-normal">
            Retards à traiter
          </div>
        </button>

      </div>

      {/* 2. Bloc « À traiter » */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="text-base font-semibold text-slate-900">
            À traiter
          </h2>
          {itemsToProcess.length > 0 && (
            <span className="text-xs text-slate-500 font-normal">
              {itemsToProcess.length} élément{itemsToProcess.length > 1 ? 's' : ''}
            </span>
          )}
        </div>

        {itemsToProcess.length === 0 ? (
          <div className="py-8 text-center text-slate-500 text-sm">
            Rien à traiter aujourd'hui
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {itemsToProcess.map(item => {
              const badge = getOverdueBadgeInfo(item.daysLate, item.isToContact);
              return (
                <div 
                  key={item.id} 
                  className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 min-w-0">
                    <span className="font-medium text-slate-900 truncate max-w-xs sm:max-w-md">
                      {item.titre}
                    </span>
                    <span className="text-slate-600 text-xs sm:text-sm truncate">
                      {item.etudiant}
                    </span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs whitespace-nowrap self-start sm:self-center ${badge.className}`}>
                      {badge.label}
                    </span>
                  </div>

                  <div className="shrink-0 self-end sm:self-center">
                    <button
                      type="button"
                      onClick={item.onAction}
                      className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 transition cursor-pointer"
                    >
                      {item.actionLabel}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. Bloc « Activité récente » (5 lignes maximum, sans répéter les retards) */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="text-base font-semibold text-slate-900">
            Activité récente
          </h2>
          <button
            type="button"
            onClick={() => setActiveManagerTab('history')}
            className="text-xs text-slate-600 hover:text-slate-900 hover:underline font-medium cursor-pointer"
          >
            Voir tout l'historique
          </button>
        </div>

        {recentMovements.length === 0 ? (
          <div className="py-6 text-center text-slate-500 text-sm">
            Aucun mouvement récent
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {recentMovements.map(m => (
              <div 
                key={m.id} 
                className="py-3 flex items-center justify-between gap-3 text-sm"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="shrink-0">
                    {m.isReturned ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Clock className="w-4 h-4 text-slate-400" />
                    )}
                  </span>
                  <span className="font-medium text-slate-900 truncate">
                    {m.titre}
                  </span>
                  <span className="text-slate-600 text-xs sm:text-sm truncate hidden sm:inline">
                    {m.etudiant}
                  </span>
                </div>

                <div className="text-xs text-slate-500 shrink-0">
                  {m.statut}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal d'avis de relance */}
      {selectedLoanForNotice && (
        <ReminderModal 
          emprunt={selectedLoanForNotice} 
          onClose={() => setSelectedLoanForNotice(null)} 
        />
      )}

    </div>
  );
};
