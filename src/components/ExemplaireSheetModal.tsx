import React, { useState } from 'react';
import { 
  X, 
  QrCode, 
  MapPin, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowLeftRight, 
  Printer, 
  RotateCcw
} from 'lucide-react';
import { Exemplaire, Ouvrage } from '../types';
import { useLibrary } from '../context/LibraryContext';

interface ExemplaireSheetModalProps {
  exemplaire: Exemplaire | null;
  onClose: () => void;
}

export const ExemplaireSheetModal: React.FC<ExemplaireSheetModalProps> = ({
  exemplaire,
  onClose
}) => {
  const { 
    getOuvrageById, 
    declarerPerdu,
    declarerRetrouve,
    openNewLoan, 
    setActivePrintLabelsOuvrageId
  } = useLibrary();

  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  if (!exemplaire) return null;

  const ouvrage = getOuvrageById(exemplaire.ouvrageId);

  // Action 1: Perdu -> statut PERDU
  const handleDeclarePerdu = () => {
    if (window.confirm(`Déclarer l'exemplaire ${exemplaire.codeQR} comme PERDU ?\nCette action est réversible si l'exemplaire est ultérieurement retrouvé.`)) {
      declarerPerdu(exemplaire.id);
      setActionFeedback("Exemplaire marqué comme PERDU.");
      setTimeout(() => setActionFeedback(null), 4000);
    }
  };

  // Action 2: Retrouvé -> réversible vers DISPONIBLE
  const handleDeclareRetrouve = () => {
    declarerRetrouve(exemplaire.id);
    setActionFeedback("Exemplaire retrouvé ! Il est désormais DISPONIBLE en rayon.");
    setTimeout(() => setActionFeedback(null), 4000);
  };

  const statusBadge = () => {
    switch (exemplaire.statut) {
      case 'DISPONIBLE':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">DISPONIBLE</span>;
      case 'EMPRUNTE':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">EMPRUNTÉ</span>;
      case 'PERDU':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-900 border border-orange-200">PERDU</span>;
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold font-mono text-amber-300">{exemplaire.codeQR}</h3>
                <span className="text-[10px] text-slate-400">Vie physique de l'exemplaire</span>
              </div>
              <p className="text-xs text-slate-400">Cote : {ouvrage?.cote}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback alert */}
        {actionFeedback && (
          <div className="bg-emerald-50 border-b border-emerald-200 p-3 text-xs text-emerald-900 font-semibold flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionFeedback}</span>
          </div>
        )}

        {/* Body */}
        <div className="p-6 space-y-5 text-xs">
          
          {/* Ouvrage reference card */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">Ouvrage Référencé</span>
                <h4 className="text-sm font-bold font-serif text-slate-900 mt-0.5">{ouvrage?.titre}</h4>
                <p className="text-xs text-slate-500">{ouvrage?.auteur} • {ouvrage?.editeur} ({ouvrage?.anneeEdition})</p>
              </div>
              {statusBadge()}
            </div>
            <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-slate-500 text-[11px]">
              <span>ISBN : <strong className="font-mono text-slate-700">{ouvrage?.isbn}</strong></span>
              <span>{ouvrage?.empruntable ? 'Empruntable à domicile' : 'Consultation sur place uniquement'}</span>
            </div>
          </div>

          {/* Emplacement physique */}
          <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-200 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-lg bg-amber-600 text-white flex items-center justify-center">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[11px] font-semibold text-amber-900 uppercase tracking-wider">Emplacement de rangement</div>
                <div className="text-sm font-extrabold text-slate-900 font-mono mt-0.5">
                  Tiroir : <span className="text-amber-800">{exemplaire.emplacement.tiroir}</span> • Rangée : <span className="text-amber-800">{exemplaire.emplacement.rangee}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Actions de gestion : seules actions perdu et retrouvé */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <div className="font-bold text-slate-800 uppercase tracking-wider text-[10px] text-slate-400">
              Actions sur l'exemplaire :
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {/* Action 1: Perdu (si pas déjà PERDU ni EMPRUNTE) */}
              {exemplaire.statut !== 'PERDU' && exemplaire.statut !== 'EMPRUNTE' && (
                <button
                  type="button"
                  onClick={handleDeclarePerdu}
                  className="min-h-[44px] p-2.5 rounded-xl border border-orange-200 hover:bg-orange-50 text-orange-900 font-semibold text-left flex items-start gap-2.5 transition"
                >
                  <AlertTriangle className="w-4 h-4 text-orange-600 mt-0.5 shrink-0" />
                  <div>
                    <div className="font-bold">Déclarer perdu</div>
                    <div className="text-[10px] text-orange-700 font-normal">Statut PERDU (réversible)</div>
                  </div>
                </button>
              )}

              {/* Action 2: Retrouvé (si PERDU) */}
              {exemplaire.statut === 'PERDU' && (
                <button
                  type="button"
                  onClick={handleDeclareRetrouve}
                  className="min-h-[44px] p-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-left flex items-start gap-2.5 shadow-xs transition sm:col-span-2"
                >
                  <RotateCcw className="w-4 h-4 text-teal-200 mt-0.5 shrink-0" />
                  <div>
                    <div className="font-bold">Exemplaire retrouvé</div>
                    <div className="text-[11px] text-teal-100 font-normal">
                      Passe immédiatement à DISPONIBLE en rayon.
                    </div>
                  </div>
                </button>
              )}

              {/* Prêter si disponible */}
              {exemplaire.statut === 'DISPONIBLE' && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    openNewLoan(exemplaire.ouvrageId, undefined, exemplaire.id);
                  }}
                  className="min-h-[44px] p-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-left flex items-start gap-2.5 shadow-xs transition"
                >
                  <ArrowLeftRight className="w-4 h-4 text-amber-200 mt-0.5 shrink-0" />
                  <div>
                    <div className="font-bold">Prêter l'exemplaire</div>
                    <div className="text-[10px] text-amber-100 font-normal">Nouveau prêt étudiant</div>
                  </div>
                </button>
              )}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              if (ouvrage) setActivePrintLabelsOuvrageId(ouvrage.id);
            }}
            className="min-h-[44px] text-slate-600 hover:text-slate-900 text-xs font-semibold flex items-center gap-1.5 px-3 rounded-lg hover:bg-slate-100 transition"
          >
            <Printer className="w-3.5 h-3.5" />
            Imprimer l'étiquette QR
          </button>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold transition"
          >
            Fermer
          </button>
        </div>

      </div>
    </div>
  );
};
