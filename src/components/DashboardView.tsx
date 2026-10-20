import React, { useState, useMemo } from 'react';
import { 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Send, 
  PhoneCall, 
  MailWarning 
} from 'lucide-react';
import { useLibrary } from '../context/LibraryContext';

export const DashboardView: React.FC = () => {
  const { 
    emprunts, 
    stats, 
    setActiveManagerTab, 
    getOuvrageById, 
    getAdherentById, 
    getJoursDeRetard,
    sendBulkManualReminders
  } = useLibrary();

  // 1. Liste « À rappeler » : étudiants ayant au moins un emprunt avec retard >= 3 jours et nbRappels < 3
  const studentsToRemind = useMemo(() => {
    const map = new Map<string, {
      adherentId: string;
      nom: string;
      prenom: string;
      maxDaysLate: number;
      titles: string[];
      lastReminderDate?: string;
    }>();

    for (const loan of emprunts) {
      if (loan.statut !== 'en_cours' || loan.annule) continue;
      const days = getJoursDeRetard(loan.dateRetourPrevue);
      const nb = loan.nbRappels || 0;
      if (days >= 3 && nb < 3) {
        const adh = getAdherentById(loan.adherentId);
        const ow = getOuvrageById(loan.ouvrageId);
        if (!adh) continue;

        const existing = map.get(adh.id);
        const bookTitle = ow?.titre || 'Ouvrage inconnu';

        if (existing) {
          existing.maxDaysLate = Math.max(existing.maxDaysLate, days);
          if (!existing.titles.includes(bookTitle)) {
            existing.titles.push(bookTitle);
          }
          if (loan.dateDernierRappel) {
            if (!existing.lastReminderDate || loan.dateDernierRappel > existing.lastReminderDate) {
              existing.lastReminderDate = loan.dateDernierRappel;
            }
          }
        } else {
          map.set(adh.id, {
            adherentId: adh.id,
            nom: adh.nom,
            prenom: adh.prenom,
            maxDaysLate: days,
            titles: [bookTitle],
            lastReminderDate: loan.dateDernierRappel
          });
        }
      }
    }

    return Array.from(map.values()).sort((a, b) => b.maxDaysLate - a.maxDaysLate);
  }, [emprunts, getJoursDeRetard, getAdherentById, getOuvrageById]);

  // 2. Liste « À contacter » : nbRappels >= 3 et emprunt toujours en retard (contact hors application)
  const studentsToContact = useMemo(() => {
    const map = new Map<string, {
      adherentId: string;
      nom: string;
      prenom: string;
      maxDaysLate: number;
      titles: string[];
      lastReminderDate?: string;
    }>();

    for (const loan of emprunts) {
      if (loan.statut !== 'en_cours' || loan.annule) continue;
      const days = getJoursDeRetard(loan.dateRetourPrevue);
      const nb = loan.nbRappels || 0;
      if (days > 0 && nb >= 3) {
        const adh = getAdherentById(loan.adherentId);
        const ow = getOuvrageById(loan.ouvrageId);
        if (!adh) continue;

        const existing = map.get(adh.id);
        const bookTitle = ow?.titre || 'Ouvrage inconnu';

        if (existing) {
          existing.maxDaysLate = Math.max(existing.maxDaysLate, days);
          if (!existing.titles.includes(bookTitle)) {
            existing.titles.push(bookTitle);
          }
          if (loan.dateDernierRappel) {
            if (!existing.lastReminderDate || loan.dateDernierRappel > existing.lastReminderDate) {
              existing.lastReminderDate = loan.dateDernierRappel;
            }
          }
        } else {
          map.set(adh.id, {
            adherentId: adh.id,
            nom: adh.nom,
            prenom: adh.prenom,
            maxDaysLate: days,
            titles: [bookTitle],
            lastReminderDate: loan.dateDernierRappel
          });
        }
      }
    }

    return Array.from(map.values()).sort((a, b) => b.maxDaysLate - a.maxDaysLate);
  }, [emprunts, getJoursDeRetard, getAdherentById, getOuvrageById]);

  // Sélection pour envoi groupé
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  const isAllSelected = studentsToRemind.length > 0 && selectedStudentIds.size === studentsToRemind.length;

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedStudentIds(new Set());
    } else {
      setSelectedStudentIds(new Set(studentsToRemind.map(s => s.adherentId)));
    }
  };

  const toggleSelectStudent = (id: string) => {
    setSelectedStudentIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSendReminders = () => {
    const count = selectedStudentIds.size;
    if (count === 0) return;

    if (window.confirm(`Envoyer ${count} rappel(s) ?`)) {
      const res = sendBulkManualReminders(Array.from(selectedStudentIds));
      setSelectedStudentIds(new Set());
      setActionFeedback(`${res.sentCount} rappel(s) envoyé(s)`);
      setTimeout(() => setActionFeedback(null), 4000);
    }
  };

  // Format date helper: "JJ/MM"
  const formatDateDayMonth = (dateStr?: string) => {
    if (!dateStr) return "Jamais rappelé";
    const d = new Date(dateStr);
    return `Dernier rappel : ${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
  };

  // 3. Activité récente : 5 lignes maximum
  const recentMovements = emprunts
    .filter(l => !l.annule)
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
      
      {/* Feedback message */}
      {actionFeedback && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionFeedback}</span>
        </div>
      )}

      {/* 1. Quatre indicateurs */}
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

      {/* 2. Liste « À rappeler » : étudiants avec retard >= 3 jours et nbRappels < 3 */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-4">
        {/* En-tête avec case tout sélectionner, compteur et bouton d'envoi groupé */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="dash-select-all"
              checked={isAllSelected}
              onChange={toggleSelectAll}
              disabled={studentsToRemind.length === 0}
              className="w-4 h-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500 cursor-pointer disabled:opacity-40"
            />
            <label htmlFor="dash-select-all" className="text-base font-semibold text-slate-900 cursor-pointer flex items-center gap-2">
              <MailWarning className="w-4 h-4 text-amber-600" />
              <span>À rappeler</span>
            </label>
            <span className="text-xs text-slate-500 font-medium">
              ({selectedStudentIds.size} sélectionné{selectedStudentIds.size > 1 ? 's' : ''})
            </span>
          </div>

          <button
            type="button"
            onClick={handleSendReminders}
            disabled={selectedStudentIds.size === 0}
            className="min-h-[40px] px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:bg-slate-200 disabled:text-slate-400 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer disabled:cursor-not-allowed shadow-2xs"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Envoyer les rappels ({selectedStudentIds.size})</span>
          </button>
        </div>

        {studentsToRemind.length === 0 ? (
          <div className="py-6 text-center text-slate-500 text-sm">
            Aucun retard à rappeler
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {studentsToRemind.map(s => {
              const isChecked = selectedStudentIds.has(s.adherentId);
              return (
                <div 
                  key={s.adherentId} 
                  className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm hover:bg-amber-50/30 transition px-2 rounded-lg"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleSelectStudent(s.adherentId)}
                      className="w-4 h-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500 cursor-pointer shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-slate-900">
                          {s.nom.toUpperCase()} {s.prenom}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
                          J+{s.maxDaysLate}
                        </span>
                      </div>
                      <div className="text-xs text-slate-600 truncate mt-0.5">
                        {s.titles.join(', ')}
                      </div>
                    </div>
                  </div>

                  <div className="text-xs text-slate-500 shrink-0 self-end sm:self-center font-mono">
                    {formatDateDayMonth(s.lastReminderDate)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. Liste « À contacter » : nbRappels >= 3 et emprunt toujours en retard (contact hors application) */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <PhoneCall className="w-4 h-4 text-rose-600" />
            <h2 className="text-base font-semibold text-slate-900">
              À contacter
            </h2>
          </div>
          <span className="text-xs text-slate-500">
            {studentsToContact.length} étudiant{studentsToContact.length > 1 ? 's' : ''} (contact hors application)
          </span>
        </div>

        {studentsToContact.length === 0 ? (
          <div className="py-6 text-center text-slate-500 text-sm">
            Aucun étudiant à contacter actuellement
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {studentsToContact.map(s => (
              <div 
                key={s.adherentId} 
                className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm px-2"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-slate-900">
                      {s.nom.toUpperCase()} {s.prenom}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
                      J+{s.maxDaysLate}
                    </span>
                  </div>
                  <div className="text-xs text-slate-600 truncate mt-0.5">
                    {s.titles.join(', ')}
                  </div>
                </div>

                <div className="text-xs text-slate-500 shrink-0 self-end sm:self-center font-mono">
                  {formatDateDayMonth(s.lastReminderDate)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. Bloc « Activité récente » (5 lignes maximum) */}
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

    </div>
  );
};
