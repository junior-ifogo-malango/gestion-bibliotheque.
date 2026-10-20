import React, { useEffect, useState } from 'react';
import { X, Printer, Receipt, QrCode } from 'lucide-react';
import { useLibrary } from '../context/LibraryContext';
import { generateQRCodeDataURL } from '../utils/qrUtils';
import { BookCover } from './BookCover';

export const LoanReceiptModal: React.FC = () => {
  const { 
    activeReceiptEmprunt, 
    setActiveReceiptEmprunt, 
    getOuvrageById, 
    getExemplaireById, 
    getAdherentById 
  } = useLibrary();

  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');

  useEffect(() => {
    if (!activeReceiptEmprunt) return;
    const generate = async () => {
      const url = await generateQRCodeDataURL(activeReceiptEmprunt.loanNumber, 150);
      setQrCodeUrl(url);
    };
    generate();
  }, [activeReceiptEmprunt]);

  if (!activeReceiptEmprunt) return null;

  const ouvrage = getOuvrageById(activeReceiptEmprunt.ouvrageId);
  const exemplaire = getExemplaireById(activeReceiptEmprunt.exemplaireId);
  const adherent = getAdherentById(activeReceiptEmprunt.adherentId);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Receipt className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold font-serif">Ticket d'Emprunt Universitaire</h3>
          </div>
          <button
            onClick={() => setActiveReceiptEmprunt(null)}
            className="p-1 text-slate-400 hover:text-white rounded-lg transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Printable Ticket Receipt */}
        <div className="p-6 bg-amber-50/20 text-slate-800 font-mono text-xs space-y-4">
          <div className="text-center border-b border-dashed border-slate-300 pb-3 space-y-1">
            <div className="font-bold font-serif text-sm text-slate-900 uppercase tracking-widest">
              BIBLIOTHÈQUE UNIVERSITAIRE
            </div>
            <div className="text-[10px] text-slate-500">Service des Prêts aux Étudiants</div>
            <div className="text-[10px] text-slate-400">Reçu d'emprunt officiel</div>
          </div>

          <div className="space-y-1.5 text-[11px]">
            <div className="flex justify-between">
              <span className="text-slate-500">N° Prêt :</span>
              <span className="font-bold text-slate-900">{activeReceiptEmprunt.loanNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Étudiant :</span>
              <span className="font-semibold text-slate-900">{adherent?.prenom} {adherent?.nom}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">N° Étudiant :</span>
              <span className="text-slate-700">{adherent?.numeroEtudiant}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Date d'emprunt :</span>
              <span className="text-slate-700">{new Date(activeReceiptEmprunt.dateEmprunt).toLocaleDateString('fr-FR')}</span>
            </div>
          </div>

          <div className="border-t border-b border-dashed border-slate-300 py-3 text-[11px]">
            <div className="flex items-start gap-3">
              {ouvrage && (
                <div className="w-14 shrink-0 shadow-2xs">
                  <BookCover
                    ouvrage={ouvrage}
                    size="sm"
                  />
                </div>
              )}
              <div className="flex-1 min-w-0 space-y-1">
                <div className="font-bold text-slate-900 line-clamp-2 leading-tight">{ouvrage?.titre}</div>
                <div className="text-slate-500 text-[10px]">par {ouvrage?.auteur}</div>
                <div className="text-[10px] text-slate-500 pt-0.5 space-y-0.5">
                  <div>Cote : <strong className="text-slate-800">{ouvrage?.cote}</strong></div>
                  <div>Exemplaire : <strong className="font-mono text-slate-800">{exemplaire?.codeQR}</strong></div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-amber-100/60 p-2.5 rounded-lg border border-amber-300/50 text-center space-y-0.5">
            <div className="text-[10px] uppercase font-bold text-amber-900 tracking-wider">
              Date limite de retour impérative
            </div>
            <div className="text-sm font-extrabold text-amber-900">
              {new Date(activeReceiptEmprunt.dateRetourPrevue).toLocaleDateString('fr-FR', {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
                year: 'numeric'
              })}
            </div>
          </div>

          {/* QR Code officiel du reçu de prêt */}
          <div className="text-center pt-2 flex flex-col items-center">
            {qrCodeUrl ? (
              <img src={qrCodeUrl} alt={activeReceiptEmprunt.loanNumber} className="w-24 h-24 object-contain border p-1 rounded-lg bg-white border-slate-200" />
            ) : (
              <div className="w-24 h-24 bg-slate-100 flex items-center justify-center text-[10px] text-slate-400">QR Code...</div>
            )}
            <div className="text-[10px] font-mono text-slate-600 font-bold mt-1.5">{activeReceiptEmprunt.loanNumber}</div>
            <p className="text-[9px] text-slate-400 mt-1 italic">
              À scanner au guichet pour retour ou vérification.
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
          <button
            onClick={() => setActiveReceiptEmprunt(null)}
            className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200 rounded-lg transition"
          >
            Fermer
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-1.5 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-lg flex items-center gap-1.5 transition shadow-2xs"
          >
            <Printer className="w-3.5 h-3.5" />
            Imprimer le Reçu QR
          </button>
        </div>

      </div>
    </div>
  );
};
