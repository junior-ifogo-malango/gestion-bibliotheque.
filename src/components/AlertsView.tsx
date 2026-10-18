import React, { useState } from 'react';
import { 
  AlertTriangle, 
  Clock, 
  Mail, 
  FileText, 
  RefreshCw, 
  ShieldAlert, 
  BookOpen, 
  UserX,
  Send,
  CheckCircle2
} from 'lucide-react';
import { useLibrary } from '../context/LibraryContext';
import { Emprunt } from '../types';
import { ReminderModal } from './ReminderModal';
import { getOverdueBadgeInfo } from '../utils/overdueUtils';

export const AlertsView: React.FC = () => {
  const { 
    emprunts, 
    getOuvrageById, 
    getExemplaireById, 
    getAdherentById, 
    isEmpruntEnRetard, 
    getJoursDeRetard,
    isEmpruntAContacter,
    runDailyChecks,
    setIsScanReturnOpen
  } = useLibrary();

  const [activeTab, setActiveTab] = useState<'all' | 'aContacter'>('all');
  const [selectedLoanForNotice, setSelectedLoanForNotice] = useState<Emprunt | null>(null);

  // Emprunts en retard
  const overdueLoans = emprunts
    .filter(e => isEmpruntEnRetard(e))
    .sort((a, b) => {
      const aContacterA = isEmpruntAContacter(a) ? 1 : 0;
      const aContacterB = isEmpruntAContacter(b) ? 1 : 0;
      if (aContacterA !== aContacterB) return aContacterB - aContacterA;
      return getJoursDeRetard(b.dateRetourPrevue) - getJoursDeRetard(a.dateRetourPrevue);
    });

  const aContacterLoans = overdueLoans.filter(l => isEmpruntAContacter(l));
  const displayedLoans = activeTab === 'aContacter' ? aContacterLoans : overdueLoans;

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold font-serif text-slate-900">
              Centre des Alertes de Gestion
            </h1>
            <span className="text-xs bg-rose-100 text-rose-800 font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
              Surveillance des retards
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Suivi des emprunts non restitués, rappels automatiques (J+2 et J+4) et statut « à contacter ».
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => runDailyChecks()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-2xs transition cursor-pointer"
            title="Lancer le contrôle automatique quotidien (rappels de retards J+2 et J+4)"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
            <span>Contrôle automatique du jour</span>
          </button>
        </div>
      </div>

      {/* KPI Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {/* Total Overdue */}
        <div 
          onClick={() => setActiveTab('all')}
          className={`p-5 rounded-2xl border transition cursor-pointer ${
            activeTab === 'all' 
              ? 'bg-rose-50/50 border-rose-300 shadow-sm' 
              : 'bg-white border-slate-200/80 shadow-xs hover:border-rose-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold tracking-wider text-slate-500 uppercase">Emprunts en Retard</span>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              overdueLoans.length > 0 ? 'bg-rose-100 text-rose-700' : 'bg-emerald-50 text-emerald-600'
            }`}>
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-slate-900">{overdueLoans.length}</span>
            <span className="text-xs font-medium text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full">
              non restitués
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-2">
            Blocage automatique de nouvel emprunt actif pour ces adhérents
          </p>
        </div>

        {/* À contacter */}
        <div 
          onClick={() => setActiveTab('aContacter')}
          className={`p-5 rounded-2xl border transition cursor-pointer ${
            activeTab === 'aContacter' 
              ? 'bg-amber-100/60 border-amber-400 shadow-sm' 
              : 'bg-white border-amber-300/80 bg-amber-50/20 shadow-xs hover:border-amber-400'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold tracking-wider text-amber-800 uppercase">Cas « À Contacter »</span>
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
              <UserX className="w-5 h-5 text-amber-700" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-amber-900">{aContacterLoans.length}</span>
            <span className="text-xs font-bold text-amber-900 bg-amber-200/70 px-2 py-0.5 rounded-full">
              2 rappels envoyés
            </span>
          </div>
          <p className="text-xs text-amber-800/80 mt-2">
            Action extérieure du gestionnaire requise (avis manuel disponible)
          </p>
        </div>
      </div>

      {/* Tab Selectors */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'all'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Tous les retards</span>
          <span className="px-1.5 py-0.2 rounded-full bg-slate-700 text-white text-[10px]">
            {overdueLoans.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('aContacter')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'aContacter'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <UserX className="w-3.5 h-3.5" />
          <span>Cas « À contacter » uniquement</span>
          {aContacterLoans.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-amber-800 text-white text-[10px]">
              {aContacterLoans.length}
            </span>
          )}
        </button>
      </div>

      {/* Loans List */}
      <div className="space-y-4">
        {displayedLoans.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-xs">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-slate-800 font-serif">Aucun retard à signaler</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Tous les exemplaires empruntés sont dans les délais accordés ou ont été restitués au guichet.
            </p>
          </div>
        ) : (
          displayedLoans.map(loan => {
            const adh = getAdherentById(loan.adherentId);
            const ex = getExemplaireById(loan.exemplaireId);
            const ow = ex ? getOuvrageById(ex.ouvrageId) : null;
            const jours = getJoursDeRetard(loan.dateRetourPrevue);
            const aContacter = isEmpruntAContacter(loan);

            return (
              <div 
                key={loan.id}
                className={`bg-white rounded-2xl border p-5 shadow-xs transition ${
                  aContacter 
                    ? 'border-amber-400 bg-amber-50/15 ring-1 ring-amber-300' 
                    : 'border-slate-200/80 hover:border-rose-300'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left: Book & Student Info */}
                  <div className="flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      {(() => {
                        const badge = getOverdueBadgeInfo(jours, aContacter);
                        return (
                          <span className={`text-xs px-2.5 py-0.5 rounded-full flex items-center gap-1 font-mono ${badge.className}`}>
                            <Clock className="w-3 h-3" />
                            {badge.label}
                          </span>
                        );
                      })()}

                      {aContacter ? (
                        <span className="text-xs font-bold text-slate-950 bg-amber-400 px-2.5 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                          <AlertTriangle className="w-3 h-3 text-slate-950" />
                          À CONTACTER
                        </span>
                      ) : (
                        <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                          {loan.nbRappels === 0 
                            ? '0 rappel envoyé (prévu à J+2)' 
                            : `${loan.nbRappels} rappel envoyé`}
                        </span>
                      )}
                    </div>

                    {/* Student Details */}
                    <div className={`p-3 rounded-xl text-xs space-y-1 ${
                      aContacter 
                        ? 'bg-amber-100/80 border border-amber-300 text-amber-950 font-medium' 
                        : 'bg-slate-50 text-slate-600'
                    }`}>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                        <div>
                          <span className="font-bold">Étudiant : </span>
                          <span className="text-slate-900 font-semibold">{adh?.prenom} {adh?.nom}</span>
                          <span className="font-mono text-slate-500 ml-1">({adh?.numeroEtudiant})</span>
                        </div>
                        <div>
                          <span className="font-bold">E-mail académique : </span>
                          <a href={`mailto:${adh?.emailAcademique}`} className="text-amber-800 underline hover:text-amber-900">
                            {adh?.emailAcademique}
                          </a>
                        </div>
                      </div>
                    </div>

                    {/* Book Details */}
                    <div className="text-xs text-slate-600 flex items-center gap-2">
                      <BookOpen className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>
                        <strong className="text-slate-800">{ow?.titre}</strong> par {ow?.auteur}
                      </span>
                      <span className="font-mono text-[11px] bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200">
                        {ex?.codeQR}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-400">
                      Emprunté le {new Date(loan.dateEmprunt).toLocaleDateString('fr-FR')} • Retour prévu le <strong>{new Date(loan.dateRetourPrevue).toLocaleDateString('fr-FR')}</strong>
                    </div>
                  </div>

                  {/* Right Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    {aContacter && (
                      <button
                        onClick={() => setSelectedLoanForNotice(loan)}
                        className="px-3 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Générer avis officiel</span>
                      </button>
                    )}

                    <button
                      onClick={() => setIsScanReturnOpen(true)}
                      className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
                    >
                      <span>Enregistrer retour</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Manual Notice Generator Modal */}
      {selectedLoanForNotice && (
        <ReminderModal 
          emprunt={selectedLoanForNotice} 
          onClose={() => setSelectedLoanForNotice(null)} 
        />
      )}
    </div>
  );
};
