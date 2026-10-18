import React, { useState, useMemo } from 'react';
import { 
  Search, 
  ArrowLeftRight, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Receipt, 
  Plus, 
  Camera,
  BookCheck,
  FileText
} from 'lucide-react';
import { useLibrary } from '../context/LibraryContext';
import { Emprunt } from '../types';
import { ReminderModal } from './ReminderModal';
import { getOverdueBadgeInfo } from '../utils/overdueUtils';

export const LoansView: React.FC = () => {
  const { 
    emprunts, 
    getOuvrageById, 
    getExemplaireById, 
    getAdherentById, 
    isEmpruntEnRetard, 
    getJoursDeRetard,
    isEmpruntAContacter,
    setActiveReceiptEmprunt
  } = useLibrary();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'en_cours' | 'retard' | 'rendu'>('all');
  const [selectedLoanForNotice, setSelectedLoanForNotice] = useState<Emprunt | null>(null);

  // Filtered loans
  const filteredLoans = useMemo(() => {
    return emprunts.filter(loan => {
      if (loan.annule) return false;
      const isLate = isEmpruntEnRetard(loan);

      if (statusFilter === 'en_cours' && loan.statut !== 'en_cours') return false;
      if (statusFilter === 'retard' && (!isLate || loan.statut !== 'en_cours')) return false;
      if (statusFilter === 'rendu' && loan.statut !== 'rendu') return false;

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const ow = getOuvrageById(loan.ouvrageId);
        const ex = getExemplaireById(loan.exemplaireId);
        const adh = getAdherentById(loan.adherentId);

        const matchOuvrage = ow && (
          ow.titre.toLowerCase().includes(query) ||
          ow.auteur.toLowerCase().includes(query) ||
          ow.cote.toLowerCase().includes(query)
        );

        const matchAdherent = adh && (
          adh.nom.toLowerCase().includes(query) ||
          adh.prenom.toLowerCase().includes(query) ||
          adh.numeroEtudiant.toLowerCase().includes(query)
        );

        const matchCopy = ex && ex.codeQR.toLowerCase().includes(query);
        const matchNumber = loan.loanNumber.toLowerCase().includes(query);

        if (!matchOuvrage && !matchAdherent && !matchCopy && !matchNumber) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      const lateA = isEmpruntEnRetard(a);
      const lateB = isEmpruntEnRetard(b);
      if (lateA && !lateB) return -1;
      if (!lateA && lateB) return 1;
      return a.dateRetourPrevue.localeCompare(b.dateRetourPrevue);
    });
  }, [emprunts, statusFilter, searchQuery, isEmpruntEnRetard, getOuvrageById, getExemplaireById, getAdherentById]);

  const countAll = emprunts.filter(l => !l.annule).length;
  const countActive = emprunts.filter(l => l.statut === 'en_cours' && !l.annule).length;
  const countLate = emprunts.filter(l => isEmpruntEnRetard(l)).length;
  const countReturned = emprunts.filter(l => l.statut === 'rendu' && !l.annule).length;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-2xl font-bold font-serif text-slate-900">
            Gestion des Prêts & Retours Universitaires
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Opérations directes par scan de QR codes au guichet de la bibliothèque.
          </p>
        </div>

      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        {/* Status Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar border-b border-slate-100 pb-3">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
              statusFilter === 'all'
                ? 'bg-slate-900 text-amber-300 ring-2 ring-amber-500/70 shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span>Tous les prêts ({countAll})</span>
          </button>

          <button
            onClick={() => setStatusFilter('en_cours')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
              statusFilter === 'en_cours'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>En cours ({countActive})</span>
          </button>

          <button
            onClick={() => setStatusFilter('retard')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
              statusFilter === 'retard'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>En retard ({countLate})</span>
          </button>

          <button
            onClick={() => setStatusFilter('rendu')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
              statusFilter === 'rendu'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Restitués ({countReturned})</span>
          </button>
        </div>

        {/* Search input */}
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher par titre, étudiant, N° carte, QR code..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
          />
        </div>
      </div>

      {/* Table with Sticky Header and Compact Density */}
      {filteredLoans.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200/90 text-slate-500 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-400">
            <ArrowLeftRight className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800 font-serif">Aucun emprunt correspondant</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4 leading-relaxed">
            Aucun prêt enregistré ne correspond à ce filtre ou critère de recherche.
          </p>
          <button
            onClick={() => { setSearchQuery(''); setStatusFilter('all'); }}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition shadow-xs"
          >
            Réinitialiser les filtres
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="overflow-x-auto max-h-[620px] overflow-y-auto">
            <table className="w-full text-left text-xs text-slate-600 border-collapse">
              <thead className="sticky top-0 z-10 bg-slate-100 text-slate-700 uppercase text-[10px] font-bold border-b border-slate-200 shadow-2xs">
                <tr>
                  <th className="py-2.5 px-3.5 bg-slate-100">N° Prêt</th>
                  <th className="py-2.5 px-3.5 bg-slate-100">Ouvrage & Exemplaire</th>
                  <th className="py-2.5 px-3.5 bg-slate-100">Étudiant Emprunteur</th>
                  <th className="py-2.5 px-3.5 bg-slate-100">Date de Prêt</th>
                  <th className="py-2.5 px-3.5 bg-slate-100">Échéance & Retard</th>
                  <th className="py-2.5 px-3.5 bg-slate-100 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLoans.map(loan => {
                  const ow = getOuvrageById(loan.ouvrageId);
                  const ex = getExemplaireById(loan.exemplaireId);
                  const adh = getAdherentById(loan.adherentId);
                  if (loan.annule) return false;
      const isLate = isEmpruntEnRetard(loan);
                  const daysLate = isLate ? getJoursDeRetard(loan.dateRetourPrevue) : 0;
                  const isReturned = loan.statut === 'rendu';
                  const aContacter = isEmpruntAContacter(loan);

                  return (
                    <tr key={loan.id} className={`hover:bg-slate-50/70 transition ${
                      aContacter ? 'bg-amber-100/40 ring-1 ring-amber-300' : isLate ? 'bg-rose-50/30' : ''
                    }`}>
                      {/* Loan number */}
                      <td className="py-2.5 px-3.5 font-mono font-bold text-slate-800 whitespace-nowrap">
                        {loan.loanNumber}
                      </td>

                      {/* Book & copy */}
                      <td className="py-2.5 px-3.5">
                        <div className="font-bold text-slate-900 leading-snug">{ow?.titre}</div>
                        <div className="text-[11px] text-slate-500 flex flex-wrap items-center gap-1.5 mt-0.5 font-mono">
                          <span className="bg-amber-50 text-amber-900 px-1.5 py-0.2 rounded border border-amber-200 font-bold">{ex?.codeQR}</span>
                          <span>Cote: {ow?.cote}</span>
                          <span className="text-slate-400">({ex?.emplacement.tiroir}, {ex?.emplacement.rangee})</span>
                        </div>
                      </td>

                      {/* Student */}
                      <td className="py-2.5 px-3.5">
                        <div className="font-semibold text-slate-800 flex items-center gap-2">
                          <span>{adh?.prenom} {adh?.nom}</span>
                          {aContacter && (
                            <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-full bg-amber-500 text-slate-950 animate-pulse">
                              À CONTACTER
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">{adh?.numeroEtudiant}</div>
                        <div className={`text-[10px] ${aContacter ? 'text-amber-900 font-bold' : 'text-slate-400'}`}>
                          {adh?.emailAcademique}
                        </div>
                      </td>

                      {/* Loan Date */}
                      <td className="py-2.5 px-3.5 whitespace-nowrap text-slate-600">
                        {new Date(loan.dateEmprunt).toLocaleDateString('fr-FR')}
                      </td>

                      {/* Due Date & Overdue status */}
                      <td className="py-2.5 px-3.5 whitespace-nowrap">
                        {isReturned ? (
                          <div>
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              Rendu le {loan.dateRetourEffective ? new Date(loan.dateRetourEffective).toLocaleDateString('fr-FR') : ''}
                            </span>
                          </div>
                        ) : isLate ? (
                          <div>
                            <div className="flex items-center gap-1.5">
                              {(() => {
                                const badge = getOverdueBadgeInfo(daysLate, aContacter);
                                return (
                                  <span className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full ${badge.className}`}>
                                    <AlertTriangle className="w-3 h-3" />
                                    {badge.label}
                                  </span>
                                );
                              })()}
                            </div>
                            <div className="text-[10px] font-semibold text-red-700 mt-0.5">
                              Échéance : {new Date(loan.dateRetourPrevue).toLocaleDateString('fr-FR')}
                            </div>
                          </div>
                        ) : (
                          <div>
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full">
                              <Clock className="w-3 h-3 text-amber-600" />
                              En cours
                            </span>
                            <div className="text-[10px] text-slate-500 mt-0.5">
                              Jusqu'au {new Date(loan.dateRetourPrevue).toLocaleDateString('fr-FR')}
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-2.5 px-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Only offered for loans marked "à contacter" */}
                          {aContacter && (
                            <button
                              onClick={() => setSelectedLoanForNotice(loan)}
                              className="px-2 py-1 text-xs font-bold rounded-lg bg-amber-500/20 text-amber-900 hover:bg-amber-500/30 border border-amber-400 flex items-center gap-1"
                              title="Aide manuelle : générer et copier l'avis de relance pour cet emprunt à contacter"
                            >
                              <FileText className="w-3 h-3 text-amber-800" />
                              <span>Avis</span>
                            </button>
                          )}

                          <button
                            onClick={() => setActiveReceiptEmprunt(loan)}
                            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
                            title="Imprimer le reçu d'emprunt avec QR"
                          >
                            <Receipt className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Reminder notice modal (only for loans marked "à contacter") */}
      {selectedLoanForNotice && (
        <ReminderModal
          emprunt={selectedLoanForNotice}
          onClose={() => setSelectedLoanForNotice(null)}
        />
      )}
    </div>
  );
};
