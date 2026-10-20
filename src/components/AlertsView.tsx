import React, { useState, useMemo } from 'react';
import { 
  Clock, 
  Send, 
  PhoneCall, 
  MailWarning, 
  CheckCircle2, 
  BookOpen
} from 'lucide-react';
import { useLibrary } from '../context/LibraryContext';

export const AlertsView: React.FC = () => {
  const { 
    emprunts, 
    getOuvrageById, 
    getAdherentById, 
    getJoursDeRetard,
    sendBulkManualReminders,
    setIsScanReturnOpen
  } = useLibrary();

  const [activeTab, setActiveTab] = useState<'aRappeler' | 'aContacter' | 'all'>('aRappeler');
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());
  const [feedback, setFeedback] = useState<string | null>(null);

  // 1. Liste « À rappeler » : étudiants ayant au moins un emprunt avec retard >= 3 jours et nbRappels < 3
  const studentsToRemind = useMemo(() => {
    const map = new Map<string, {
      adherentId: string;
      nom: string;
      prenom: string;
      email: string;
      numeroEtudiant: string;
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

        const bookTitle = ow?.titre || 'Ouvrage inconnu';
        const existing = map.get(adh.id);

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
            email: adh.emailAcademique,
            numeroEtudiant: adh.numeroEtudiant,
            maxDaysLate: days,
            titles: [bookTitle],
            lastReminderDate: loan.dateDernierRappel
          });
        }
      }
    }

    return Array.from(map.values()).sort((a, b) => b.maxDaysLate - a.maxDaysLate);
  }, [emprunts, getJoursDeRetard, getAdherentById, getOuvrageById]);

  // 2. Liste « À contacter » : nbRappels >= 3 et emprunt toujours en retard
  const studentsToContact = useMemo(() => {
    const map = new Map<string, {
      adherentId: string;
      nom: string;
      prenom: string;
      email: string;
      numeroEtudiant: string;
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

        const bookTitle = ow?.titre || 'Ouvrage inconnu';
        const existing = map.get(adh.id);

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
            email: adh.emailAcademique,
            numeroEtudiant: adh.numeroEtudiant,
            maxDaysLate: days,
            titles: [bookTitle],
            lastReminderDate: loan.dateDernierRappel
          });
        }
      }
    }

    return Array.from(map.values()).sort((a, b) => b.maxDaysLate - a.maxDaysLate);
  }, [emprunts, getJoursDeRetard, getAdherentById, getOuvrageById]);

  // Tous les emprunts en retard (pour consultation globale)
  const allOverdueLoans = useMemo(() => {
    return emprunts
      .filter(l => l.statut === 'en_cours' && !l.annule && getJoursDeRetard(l.dateRetourPrevue) > 0)
      .sort((a, b) => getJoursDeRetard(b.dateRetourPrevue) - getJoursDeRetard(a.dateRetourPrevue));
  }, [emprunts, getJoursDeRetard]);

  // Sélection pour envoi groupé
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
      setFeedback(`${res.sentCount} rappel(s) envoyé(s)`);
      setTimeout(() => setFeedback(null), 4000);
    }
  };

  const formatDateDayMonth = (dateStr?: string) => {
    if (!dateStr) return "Jamais rappelé";
    const d = new Date(dateStr);
    return `Dernier rappel : ${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6 pb-12 font-sans max-w-[1100px] mx-auto">
      
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold font-serif text-slate-900">
            Gestion des Retards & Rappels
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Rappels automatiques à J+1 et J+2, envoi manuel groupé à J+3 ou plus, suivi hors application.
          </p>
        </div>
        <button
          onClick={() => setIsScanReturnOpen(true)}
          className="min-h-[44px] px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-2xs"
        >
          <span>Scanner un retour</span>
        </button>
      </div>

      {feedback && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Onglets : À rappeler / À contacter / Tous les retards */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('aRappeler')}
          className={`min-h-[40px] px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'aRappeler'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <MailWarning className="w-3.5 h-3.5" />
          <span>À rappeler (J+3+)</span>
          <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
            activeTab === 'aRappeler' ? 'bg-amber-800 text-white' : 'bg-slate-200 text-slate-700'
          }`}>
            {studentsToRemind.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('aContacter')}
          className={`min-h-[40px] px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'aContacter'
              ? 'bg-rose-700 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <PhoneCall className="w-3.5 h-3.5" />
          <span>À contacter</span>
          <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
            activeTab === 'aContacter' ? 'bg-rose-900 text-white' : 'bg-slate-200 text-slate-700'
          }`}>
            {studentsToContact.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('all')}
          className={`min-h-[40px] px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'all'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Tous les retards</span>
          <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
            activeTab === 'all' ? 'bg-slate-700 text-white' : 'bg-slate-200 text-slate-700'
          }`}>
            {allOverdueLoans.length}
          </span>
        </button>
      </div>

      {/* 1. Onglet À rappeler */}
      {activeTab === 'aRappeler' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="alerts-select-all"
                checked={isAllSelected}
                onChange={toggleSelectAll}
                disabled={studentsToRemind.length === 0}
                className="w-4 h-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500 cursor-pointer disabled:opacity-40"
              />
              <label htmlFor="alerts-select-all" className="text-sm font-semibold text-slate-900 cursor-pointer">
                Tout sélectionner
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
            <div className="py-8 text-center text-slate-500 text-sm">
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
      )}

      {/* 2. Onglet À contacter */}
      {activeTab === 'aContacter' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-sm font-semibold text-slate-900">
              Liste des étudiants à contacter directement (hors application)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Trois rappels ont déjà été émis. Les démarches s'effectuent par téléphone ou convocation administrative.
            </p>
          </div>

          {studentsToContact.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-sm">
              Aucun étudiant à contacter actuellement
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {studentsToContact.map(s => (
                <div 
                  key={s.adherentId} 
                  className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm px-2"
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-slate-900">
                        {s.nom.toUpperCase()} {s.prenom}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
                        J+{s.maxDaysLate}
                      </span>
                    </div>
                    <div className="text-xs text-slate-600 truncate">
                      {s.titles.join(', ')}
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono">
                      {s.email} • {s.numeroEtudiant}
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
      )}

      {/* 3. Onglet Tous les retards */}
      {activeTab === 'all' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-sm font-semibold text-slate-900">
              Historique exhaustif de tous les emprunts actuellement en retard
            </h2>
          </div>

          {allOverdueLoans.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-sm">
              Aucun emprunt en retard
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {allOverdueLoans.map(loan => {
                const adh = getAdherentById(loan.adherentId);
                const ow = getOuvrageById(loan.ouvrageId);
                const days = getJoursDeRetard(loan.dateRetourPrevue);
                return (
                  <div key={loan.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <div>
                      <div className="font-bold text-slate-900">
                        {ow?.titre || 'Ouvrage inconnu'}
                      </div>
                      <div className="text-slate-500 mt-0.5">
                        Emprunteur : <strong>{adh?.prenom} {adh?.nom}</strong> ({adh?.numeroEtudiant})
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-slate-500">
                        Rappels émis : {loan.nbRappels || 0}
                      </span>
                      <span className="px-2 py-0.5 rounded-full font-bold bg-rose-100 text-rose-800 border border-rose-300">
                        J+{days}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

    </div>
  );
};
