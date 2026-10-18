import React, { useState } from 'react';
import { 
  X, 
  BookOpen, 
  QrCode, 
  Plus, 
  MapPin, 
  CheckCircle2, 
  AlertTriangle, 
  Printer, 
  Layers, 
  Wrench,
  Clock,
  Users,
  Ban
} from 'lucide-react';
import { useLibrary } from '../context/LibraryContext';
import { Ouvrage, Exemplaire } from '../types';
import { BookCover } from './BookCover';

export const BookDetailModal: React.FC = () => {
  const { 
    selectedOuvrage, 
    setSelectedOuvrage, 
    getExemplairesByOuvrage, 
    getAdherentById, 
    emprunts, 
    setScannedExemplaire, 
    addExemplairesToOuvrage,
    setActivePrintLabelsOuvrageId,
    openNewLoan
  } = useLibrary();

  const [isAddingCopies, setIsAddingCopies] = useState(false);
  const [newCopiesCount, setNewCopiesCount] = useState<number>(1);
  const [newTiroir, setNewTiroir] = useState('T1');
  const [newRangee, setNewRangee] = useState('R1');

  if (!selectedOuvrage) return null;

  const exList = getExemplairesByOuvrage(selectedOuvrage.id);
  const availableCount = exList.filter(e => e.statut === 'DISPONIBLE').length;
  const activeCount = exList.length;

  // Loan history for this ouvrage
  const ouvrageEmprunts = emprunts.filter(e => e.ouvrageId === selectedOuvrage.id);
  const activeEmprunts = ouvrageEmprunts.filter(e => e.statut === 'en_cours');
  const pastEmprunts = ouvrageEmprunts.filter(e => e.statut === 'rendu');

  const handleAddCopiesSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addExemplairesToOuvrage(selectedOuvrage.id, newCopiesCount, {
      tiroir: newTiroir.trim() || 'T1',
      rangee: newRangee.trim() || 'R1'
    });
    setIsAddingCopies(false);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Cover / Header */}
        <div className={`p-6 bg-gradient-to-br ${selectedOuvrage.coverGradient || 'from-slate-800 to-slate-900'} text-white relative`}>
          <button
            onClick={() => setSelectedOuvrage(null)}
            className="absolute top-4 right-4 p-1.5 text-white/70 hover:text-white rounded-lg bg-black/20 hover:bg-black/40 transition z-10"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <div className="w-24 sm:w-28 shrink-0 shadow-lg ring-2 ring-white/20 rounded-xl overflow-hidden">
              <BookCover
                titre={selectedOuvrage.titre}
                auteur={selectedOuvrage.auteur}
                categorie={selectedOuvrage.categorie}
                coverUrl={selectedOuvrage.coverUrl}
                coverGradient={selectedOuvrage.coverGradient}
                size="md"
              />
            </div>

            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs font-bold bg-black/40 px-2.5 py-0.5 rounded border border-white/20">
                  {selectedOuvrage.cote}
                </span>
                <span className="text-xs uppercase tracking-wider text-white/80 font-medium">
                  {selectedOuvrage.categorie}
                </span>
                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                  selectedOuvrage.empruntable ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-400/30' : 'bg-purple-500/20 text-purple-200 border border-purple-400/30'
                }`}>
                  {selectedOuvrage.empruntable ? 'Empruntable' : 'Sur place uniquement'}
                </span>
              </div>

              <h2 className="text-xl sm:text-2xl font-bold font-serif leading-tight">{selectedOuvrage.titre}</h2>
              <p className="text-sm text-white/90">par <strong>{selectedOuvrage.auteur}</strong> • {selectedOuvrage.editeur} ({selectedOuvrage.anneeEdition})</p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto text-xs">
          
          {/* Summary */}
          <div className="space-y-1.5">
            <h4 className="font-bold uppercase tracking-wider text-slate-400 text-[10px]">Description & Référence</h4>
            <p className="text-slate-700 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-100">
              {selectedOuvrage.resume}
            </p>
            <div className="flex items-center justify-between text-slate-400 text-[11px] px-1">
              <span>ISBN : <strong className="font-mono text-slate-700">{selectedOuvrage.isbn}</strong></span>
              <span>Pagination : {selectedOuvrage.pagination} pages</span>
            </div>
          </div>

          {/* Exemplaires Physiques List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold uppercase tracking-wider text-slate-900 text-xs flex items-center gap-2">
                  <Layers className="w-4 h-4 text-amber-600" />
                  Exemplaires Physiques ({availableCount} disponibles / {activeCount} en circulation)
                </h4>
                <p className="text-[11px] text-slate-500">Chaque exemplaire dispose d'un code QR unique et d'un emplacement dédié.</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActivePrintLabelsOuvrageId(selectedOuvrage.id)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold flex items-center gap-1.5 transition text-xs"
                >
                  <Printer className="w-3.5 h-3.5 text-slate-500" />
                  Imprimer QR
                </button>
                <button
                  onClick={() => setIsAddingCopies(true)}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold flex items-center gap-1 shadow-2xs transition text-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Ajouter un Exemplaire
                </button>
              </div>
            </div>

            {/* Quick Add Copies Form */}
            {isAddingCopies && (
              <form onSubmit={handleAddCopiesSubmit} className="p-4 bg-amber-50/50 border border-amber-200 rounded-xl space-y-3">
                <div className="font-bold text-amber-900">Enregistrer de nouveaux exemplaires physiques :</div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 block mb-1">Quantité à créer</label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={newCopiesCount}
                      onChange={(e) => setNewCopiesCount(parseInt(e.target.value) || 1)}
                      className="w-full p-2 border border-slate-200 rounded-lg bg-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 block mb-1">Tiroir de rangement</label>
                    <input
                      type="text"
                      value={newTiroir}
                      onChange={(e) => setNewTiroir(e.target.value)}
                      placeholder="Ex: T2"
                      className="w-full p-2 border border-slate-200 rounded-lg bg-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 block mb-1">Rangée</label>
                    <input
                      type="text"
                      value={newRangee}
                      onChange={(e) => setNewRangee(e.target.value)}
                      placeholder="Ex: R1"
                      className="w-full p-2 border border-slate-200 rounded-lg bg-white font-mono"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsAddingCopies(false)}
                    className="px-3 py-1.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-100"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg shadow-2xs"
                  >
                    Générer les QR Codes
                  </button>
                </div>
              </form>
            )}

            {/* Copies Table / Cards */}
            <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 bg-white">
              {exList.map(ex => {
                return (
                  <div key={ex.id} className="p-3 flex items-center justify-between gap-3 hover:bg-slate-50 transition">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-800 flex items-center justify-center font-mono font-bold text-xs border border-slate-200">
                        <QrCode className="w-4 h-4 text-amber-700" />
                      </div>
                      <div>
                        <div className="font-mono font-bold text-slate-900 flex items-center gap-2">
                          <span>{ex.codeQR}</span>

                        </div>
                        <div className="text-[11px] text-slate-500 font-mono mt-0.5 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <span>Tiroir: <strong>{ex.emplacement.tiroir}</strong> • Rangée: <strong>{ex.emplacement.rangee}</strong></span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        ex.statut === 'DISPONIBLE'
                          ? 'bg-emerald-100 text-emerald-800'
                          : ex.statut === 'EMPRUNTE'
                            ? 'bg-amber-100 text-amber-800'
                            : ex.statut === 'PERDU'
                                ? 'bg-orange-100 text-orange-800'
                                : 'bg-rose-100 text-rose-800'
                      }`}>
                        {ex.statut}
                      </span>

                      <button
                        onClick={() => setScannedExemplaire(ex)}
                        className="px-2.5 py-1 text-xs border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold rounded-lg"
                      >
                        Gérer
                      </button>

                      {ex.statut === 'DISPONIBLE' && selectedOuvrage.empruntable && (
                        <button
                          onClick={() => {
                            setSelectedOuvrage(null);
                            openNewLoan(selectedOuvrage.id, undefined, ex.id);
                          }}
                          className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-xs shadow-2xs"
                        >
                          Prêter
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Loans History for this Ouvrage */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <h4 className="font-bold uppercase tracking-wider text-slate-700 text-xs flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-400" />
              Historique des prêts de cet ouvrage ({ouvrageEmprunts.length})
            </h4>

            {ouvrageEmprunts.length === 0 ? (
              <p className="text-slate-400 italic">Aucun mouvement d'emprunt enregistré pour cet ouvrage.</p>
            ) : (
              <div className="space-y-2">
                {activeEmprunts.map(emp => {
                  const adh = getAdherentById(emp.adherentId);
                  return (
                    <div key={emp.id} className="p-3 bg-amber-50/40 rounded-xl border border-amber-200/80 flex items-center justify-between">
                      <div>
                        <div className="font-bold text-slate-800">
                          {adh?.prenom} {adh?.nom} <span className="font-mono text-slate-500 font-normal">({adh?.numeroEtudiant})</span>
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Prêté le {new Date(emp.dateEmprunt).toLocaleDateString('fr-FR')} • N° {emp.loanNumber}
                        </div>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                        En cours (échéance : {new Date(emp.dateRetourPrevue).toLocaleDateString('fr-FR')})
                      </span>
                    </div>
                  );
                })}

                {pastEmprunts.slice(0, 4).map(emp => {
                  const adh = getAdherentById(emp.adherentId);
                  return (
                    <div key={emp.id} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-slate-600">
                      <div>
                        <span className="font-semibold text-slate-800">{adh?.prenom} {adh?.nom}</span>
                        <span className="text-[10px] text-slate-400 ml-2">Prêt {emp.loanNumber}</span>
                      </div>
                      <span className="text-[11px] text-emerald-700 font-medium">
                        Rendu le {emp.dateRetourEffective ? new Date(emp.dateRetourEffective).toLocaleDateString('fr-FR') : ''}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={() => setActivePrintLabelsOuvrageId(selectedOuvrage.id)}
            className="text-xs font-semibold text-slate-700 hover:text-slate-900 flex items-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5 text-amber-600" />
            Imprimer toutes les étiquettes QR ({exList.length})
          </button>
          <button
            onClick={() => setSelectedOuvrage(null)}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-xs font-bold"
          >
            Fermer
          </button>
        </div>

      </div>
    </div>
  );
};
