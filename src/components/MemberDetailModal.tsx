import React, { useEffect, useState } from 'react';
import { 
  X, 
  CreditCard, 
  Printer, 
  AlertTriangle, 
  CheckCircle2, 
  BookOpen, 
  QrCode, 
  Calendar, 
  Mail, 
  Clock 
} from 'lucide-react';
import { useLibrary } from '../context/LibraryContext';
import { generateQRCodeDataURL } from '../utils/qrUtils';
import { getOverdueBadgeInfo } from '../utils/overdueUtils';

export const MemberDetailModal: React.FC = () => {
  const { 
    selectedAdherent, 
    setSelectedAdherent, 
    getAdherentActiveEmprunts, 
    emprunts,
    getOuvrageById, 
    getExemplaireById, 
    isEmpruntEnRetard, 
    getJoursDeRetard,
    isEmpruntAContacter,
    isAdherentAutorise,
    openNewLoan
  } = useLibrary();

  const [qrCardUrl, setQrCardUrl] = useState<string>('');

  useEffect(() => {
    if (!selectedAdherent) return;
    const generate = async () => {
      const url = await generateQRCodeDataURL(selectedAdherent.codeQR, 140);
      setQrCardUrl(url);
    };
    generate();
  }, [selectedAdherent]);

  if (!selectedAdherent) return null;

  const activeLoans = getAdherentActiveEmprunts(selectedAdherent.id);
  const pastLoans = emprunts.filter(e => e.adherentId === selectedAdherent.id && e.statut === 'rendu' && !e.annule);
  const auth = isAdherentAutorise(selectedAdherent.id);

  const handlePrintCard = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold font-serif">Carte & Dossier de l'Étudiant</h2>
              <p className="text-xs text-slate-400">{selectedAdherent.prenom} {selectedAdherent.nom} • {selectedAdherent.numeroEtudiant}</p>
            </div>
          </div>
          <button
            onClick={() => setSelectedAdherent(null)}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body (Consultation Only) */}
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto text-xs">
          
          {/* Printable Student Library Card with QR Code */}
          <div className="relative rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-amber-950 text-white p-5 shadow-lg border border-slate-700 flex flex-col justify-between overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-500 text-slate-900 flex items-center justify-center font-bold">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-extrabold font-serif text-xs tracking-wider uppercase">BIBLIOTHÈQUE UNIVERSITAIRE</span>
                  <span className="text-[10px] text-amber-300 block font-sans">Carte de Lecteur Étudiant</span>
                </div>
              </div>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded uppercase font-bold ${
                selectedAdherent.statut === 'actif' ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-400/30' : 'bg-rose-500/20 text-rose-200 border border-rose-400/30'
              }`}>
                {selectedAdherent.statut === 'actif' ? 'Inscrit Actif' : 'Inscription Résiliée'}
              </span>
            </div>

            <div className="flex items-center justify-between gap-4 my-2">
              <div>
                <h3 className="text-xl font-bold font-serif tracking-wide">
                  {selectedAdherent.prenom} {selectedAdherent.nom}
                </h3>
                <div className="text-xs text-slate-300 mt-1 font-mono">
                  N° Étudiant : <strong className="text-amber-300">{selectedAdherent.numeroEtudiant}</strong>
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  {selectedAdherent.emailAcademique}
                </div>
              </div>

              {/* QR Code */}
              <div className="bg-white p-1 rounded-xl shadow-xs shrink-0">
                {qrCardUrl ? (
                  <img src={qrCardUrl} alt={selectedAdherent.numeroEtudiant} className="w-20 h-20 object-contain" />
                ) : (
                  <div className="w-20 h-20 bg-slate-100 flex items-center justify-center text-[10px] text-slate-400">QR Code...</div>
                )}
              </div>
            </div>

            <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center justify-between text-[10px] text-slate-400 font-mono">
              <span>Date d'inscription : {new Date(selectedAdherent.dateInscription).toLocaleDateString('fr-FR')}</span>
              <span>Expiration : fin année univ. ({new Date(selectedAdherent.dateExpiration).toLocaleDateString('fr-FR')})</span>
            </div>
          </div>

          {/* Action bar for card */}
          <div className="flex items-center justify-between">
            <span className="text-slate-500">
              Contrôle automatique : {auth.autorise ? <strong className="text-emerald-700">Autorisé aux prêts</strong> : <strong className="text-rose-600">{auth.motif}</strong>}
            </span>
            <button
              onClick={handlePrintCard}
              className="px-3.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 font-semibold text-slate-700 flex items-center gap-1.5 transition"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              Imprimer la Carte QR
            </button>
          </div>

          {/* Active loans */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold uppercase tracking-wider text-slate-700 text-xs">
                Emprunts en cours ({activeLoans.length})
              </h4>
              {auth.autorise && (
                <button
                  onClick={() => {
                    setSelectedAdherent(null);
                    openNewLoan(undefined, selectedAdherent.id);
                  }}
                  className="text-amber-700 font-bold hover:underline text-xs"
                >
                  + Nouveau prêt pour cet étudiant
                </button>
              )}
            </div>

            {activeLoans.length === 0 ? (
              <p className="text-slate-400 italic bg-slate-50 p-3 rounded-xl border border-slate-100">
                Aucun document actuellement emprunté par cet étudiant.
              </p>
            ) : (
              <div className="space-y-2">
                {activeLoans.map(loan => {
                  const ow = getOuvrageById(loan.ouvrageId);
                  const ex = getExemplaireById(loan.exemplaireId);
                  const isLate = isEmpruntEnRetard(loan);

                  return (
                    <div key={loan.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                      <div>
                        <div className="font-bold text-slate-900">{ow?.titre}</div>
                        <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                          Exemplaire : <strong>{ex?.codeQR}</strong> • Cote : {ow?.cote}
                        </div>
                      </div>

                      <div className="text-right">
                        {isLate ? (() => {
                          const daysLate = getJoursDeRetard(loan.dateRetourPrevue);
                          const badge = getOverdueBadgeInfo(daysLate, isEmpruntAContacter(loan));
                          return (
                            <span className={`text-[10px] px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${badge.className}`}>
                              {badge.label}
                            </span>
                          );
                        })() : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                            Échéance : {new Date(loan.dateRetourPrevue).toLocaleDateString('fr-FR')}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Past loans history */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <h4 className="font-bold uppercase tracking-wider text-slate-700 text-xs flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>Historique des prêts restitués ({pastLoans.length})</span>
            </h4>
            {pastLoans.length === 0 ? (
              <p className="text-slate-400 italic">Aucune restitution passée archivée pour cet étudiant.</p>
            ) : (
              <div className="space-y-1.5">
                {pastLoans.map(loan => {
                  const ow = getOuvrageById(loan.ouvrageId);
                  return (
                    <div key={loan.id} className="text-slate-600 flex justify-between py-1 border-b border-slate-100 text-[11px]">
                      <span>{ow?.titre}</span>
                      <span className="text-slate-400">Rendu le {loan.dateRetourEffective ? new Date(loan.dateRetourEffective).toLocaleDateString('fr-FR') : ''}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">
            Fiche universitaire en lecture seule issue de l'import officiel
          </span>

          <button
            onClick={() => setSelectedAdherent(null)}
            className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold"
          >
            Fermer
          </button>
        </div>

      </div>
    </div>
  );
};
