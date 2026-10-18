import React, { useState } from 'react';
import { X, Mail, Printer, Copy, Check, AlertTriangle, Building2 } from 'lucide-react';
import { useLibrary } from '../context/LibraryContext';
import { Emprunt } from '../types';

interface ReminderModalProps {
  emprunt: Emprunt | null;
  onClose: () => void;
}

export const ReminderModal: React.FC<ReminderModalProps> = ({
  emprunt,
  onClose
}) => {
  const { 
    getOuvrageById, 
    getExemplaireById, 
    getAdherentById, 
    getJoursDeRetard, 
    currentDate 
  } = useLibrary();

  const [copied, setCopied] = useState(false);

  if (!emprunt) return null;

  const ouvrage = getOuvrageById(emprunt.ouvrageId);
  const exemplaire = getExemplaireById(emprunt.exemplaireId);
  const adherent = getAdherentById(emprunt.adherentId);
  const daysLate = getJoursDeRetard(emprunt.dateRetourPrevue);

  const emailSubject = `[Bibliothèque Universitaire] Retard de restitution - Ouvrage "${ouvrage?.titre}"`;
  const emailBody = `Bonjour ${adherent?.prenom} ${adherent?.nom},

Sauf erreur de notre part, l'exemplaire emprunté sous votre numéro d'étudiant ${adherent?.numeroEtudiant} n'a pas été restitué à l'échéance :

- Ouvrage : ${ouvrage?.titre} (Cote : ${ouvrage?.cote})
- Exemplaire scanné : ${exemplaire?.codeQR}
- Date limite de retour dépassée : ${new Date(emprunt.dateRetourPrevue).toLocaleDateString('fr-FR')} (+${daysLate} jours de retard)

Conformément au règlement de la bibliothèque universitaire, tout retard non régularisé entraîne le blocage immédiat de vos droits d'emprunt. Merci de rapporter cet exemplaire au guichet dans les meilleurs délais.

Cordialement,
Le Service des Prêts Universitaires`;

  const handleCopy = () => {
    navigator.clipboard.writeText(`${emailSubject}\n\n${emailBody}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="bg-rose-950 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold font-serif">Rappel de Retard Académique</h2>
              <p className="text-xs text-rose-300">Message à destination de l'étudiant</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-rose-300 hover:text-white rounded-lg hover:bg-rose-900 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 text-xs font-mono">
          <div className="p-3 bg-slate-100 rounded-lg text-slate-800">
            <span className="font-bold text-slate-500 font-sans">Destinataire : </span>
            {adherent?.emailAcademique}
          </div>
          <div className="p-3 bg-slate-100 rounded-lg text-slate-800">
            <span className="font-bold text-slate-500 font-sans">Objet : </span>
            {emailSubject}
          </div>
          <textarea
            readOnly
            value={emailBody}
            rows={10}
            className="w-full p-4 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-xs leading-relaxed focus:outline-hidden"
          />
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
          <button
            onClick={handleCopy}
            className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition flex items-center gap-1.5 shadow-2xs"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copié !' : 'Copier le message'}</span>
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold rounded-xl bg-slate-900 hover:bg-slate-800 text-white transition shadow-xs"
          >
            Fermer
          </button>
        </div>

      </div>
    </div>
  );
};
