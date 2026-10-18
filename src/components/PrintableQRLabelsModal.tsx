import React, { useEffect, useState } from 'react';
import { X, Printer, QrCode } from 'lucide-react';
import { Ouvrage, Exemplaire } from '../types';
import { generateQRCodeDataURL } from '../utils/qrUtils';

interface PrintableQRLabelsModalProps {
  isOpen: boolean;
  onClose: () => void;
  ouvrage?: Ouvrage | null;
  exemplaires: Exemplaire[];
  allOuvrages: Ouvrage[];
}

export const PrintableQRLabelsModal: React.FC<PrintableQRLabelsModalProps> = ({
  isOpen,
  onClose,
  ouvrage,
  exemplaires,
  allOuvrages
}) => {
  const [qrImages, setQrImages] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!isOpen) return;

    // Generate QR images for all matching copies
    let isMounted = true;
    const loadQRs = async () => {
      const mapping: Record<string, string> = {};
      for (const ex of exemplaires) {
        mapping[ex.id] = await generateQRCodeDataURL(ex.codeQR, 140);
      }
      if (isMounted) setQrImages(mapping);
    };
    loadQRs();

    return () => {
      isMounted = false;
    };
  }, [isOpen, exemplaires]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden print:p-0 print:border-none print:shadow-none print:max-w-none">
        
        {/* Modal Top Bar (hidden on print) */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between print:hidden">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold font-serif">Planche d'Étiquettes QR Codes des Exemplaires</h3>
              <p className="text-xs text-slate-400">
                {ouvrage ? `Exemplaires de "${ouvrage.titre}" (${exemplaires.length})` : `Tous les exemplaires actifs (${exemplaires.length})`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition"
            >
              <Printer className="w-3.5 h-3.5" />
              Imprimer la Planche
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Grid of Labels */}
        <div className="p-6 max-h-[75vh] overflow-y-auto print:max-h-none print:overflow-visible print:p-2 bg-slate-50">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 print:grid-cols-3 print:gap-3">
            {exemplaires.map(ex => {
              const ow = ouvrage || allOuvrages.find(o => o.id === ex.ouvrageId);
              const qrUrl = qrImages[ex.id];

              return (
                <div
                  key={ex.id}
                  className="bg-white border-2 border-dashed border-slate-300 rounded-xl p-3 flex flex-col items-center text-center justify-between shadow-2xs print:border-slate-400 print:shadow-none break-inside-avoid"
                  style={{ minHeight: '180px' }}
                >
                  <div className="w-full text-left border-b border-slate-100 pb-1 mb-1 flex items-center justify-between">
                    <span className="font-serif font-extrabold text-[10px] text-amber-900 tracking-wider">BIBLIOTHÈQUE UNIV</span>
                    <span className="font-mono text-[9px] font-bold text-slate-500">{ow?.cote || 'COTE'}</span>
                  </div>

                  {qrUrl ? (
                    <img src={qrUrl} alt={ex.codeQR} className="w-24 h-24 object-contain my-1" />
                  ) : (
                    <div className="w-24 h-24 bg-slate-100 flex items-center justify-center text-slate-400 text-xs">Chargement...</div>
                  )}

                  <div className="font-mono font-extrabold text-xs text-slate-900 tracking-wider mt-0.5">
                    {ex.codeQR}
                  </div>

                  <div className="text-[10px] font-bold text-slate-800 line-clamp-1 w-full mt-0.5">
                    {ow?.titre}
                  </div>

                  <div className="w-full mt-1 pt-1 border-t border-slate-100 flex items-center justify-between text-[9px] text-slate-500 font-mono">
                    <span>Tiroir: <strong className="text-slate-800">{ex.emplacement.tiroir}</strong></span>
                    <span>Rangée: <strong className="text-slate-800">{ex.emplacement.rangee}</strong></span>

                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-white border-t border-slate-200 text-right print:hidden">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
          >
            Fermer
          </button>
        </div>

      </div>
    </div>
  );
};
