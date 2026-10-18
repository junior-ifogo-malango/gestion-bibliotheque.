import React, { useState, useMemo } from 'react';
import { 
  History, 
  Search, 
  CheckCircle2, 
  Download, 
  MapPin
} from 'lucide-react';
import { useLibrary } from '../context/LibraryContext';

export const HistoryView: React.FC = () => {
  const { emprunts, getOuvrageById, getExemplaireById, getAdherentById, exportDatabaseJSON } = useLibrary();

  const [searchQuery, setSearchQuery] = useState('');

  const returnedLoans = useMemo(() => {
    return emprunts.filter(l => {
      if (l.statut !== 'rendu' || l.annule) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const ow = getOuvrageById(l.ouvrageId);
        const ex = getExemplaireById(l.exemplaireId);
        const adh = getAdherentById(l.adherentId);

        const matchOuvrage = ow && (
          ow.titre.toLowerCase().includes(q) ||
          ow.auteur.toLowerCase().includes(q) ||
          ow.cote.toLowerCase().includes(q)
        );

        const matchAdherent = adh && (
          adh.nom.toLowerCase().includes(q) ||
          adh.prenom.toLowerCase().includes(q) ||
          adh.numeroEtudiant.toLowerCase().includes(q)
        );

        const matchCopy = ex && ex.codeQR.toLowerCase().includes(q);

        if (!matchOuvrage && !matchAdherent && !matchCopy && !l.loanNumber.toLowerCase().includes(q)) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => (b.dateRetourEffective || '').localeCompare(a.dateRetourEffective || ''));
  }, [emprunts, searchQuery, getOuvrageById, getExemplaireById, getAdherentById]);

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['N° Prêt', 'Ouvrage', 'Cote', 'Code QR Exemplaire', 'Tiroir', 'Rangée', 'Étudiant', 'N° Étudiant', 'Date Emprunt', 'Échéance', 'Date Retour Effective', 'Remarques'];
    const rows = returnedLoans.map(l => {
      const ow = getOuvrageById(l.ouvrageId);
      const ex = getExemplaireById(l.exemplaireId);
      const adh = getAdherentById(l.adherentId);
      return [
        l.loanNumber,
        `"${ow?.titre || ''}"`,
        ow?.cote || '',
        ex?.codeQR || '',
        ex?.emplacement.tiroir || '',
        ex?.emplacement.rangee || '',
        `"${adh?.prenom} ${adh?.nom}"`,
        adh?.numeroEtudiant || '',
        l.dateEmprunt,
        l.dateRetourPrevue,
        l.dateRetourEffective || '',
        
        `"${l.notes || ''}"`
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `registre-retours-universite-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-2xl font-bold font-serif text-slate-900">
            Journal des Restitutions & Traçabilité
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Registre officiel des retours d'exemplaires et constats d'état physique.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Exporter en CSV</span>
          </button>
          <button
            onClick={exportDatabaseJSON}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-2xs transition"
          >
            <Download className="w-3.5 h-3.5 text-amber-300" />
            <span>Sauvegarde Globale</span>
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher par ouvrage, N° étudiant, QR code..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
          />
        </div>


      </div>

      {/* Table with Sticky Header and Compact Density */}
      {returnedLoans.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200/90 text-slate-500 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-400">
            <History className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800 font-serif">Aucune restitution enregistrée</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4 leading-relaxed">
            Aucun retour d'exemplaire ne correspond au filtre ou à la recherche.
          </p>
          <button
            onClick={() => { setSearchQuery('');  }}
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
                  <th className="py-2.5 px-3.5 bg-slate-100">Date Retour</th>
                  <th className="py-2.5 px-3.5 bg-slate-100">N° Prêt</th>
                  <th className="py-2.5 px-3.5 bg-slate-100">Ouvrage & Exemplaire</th>
                  <th className="py-2.5 px-3.5 bg-slate-100">Étudiant</th>
                  <th className="py-2.5 px-3.5 bg-slate-100">Emplacement</th>
                  <th className="py-2.5 px-3.5 bg-slate-100">Remarques</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {returnedLoans.map(loan => {
                  const ow = getOuvrageById(loan.ouvrageId);
                  const ex = getExemplaireById(loan.exemplaireId);
                  const adh = getAdherentById(loan.adherentId);

                  return (
                    <tr key={loan.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-2.5 px-3.5 font-semibold text-slate-900 whitespace-nowrap">
                        {loan.dateRetourEffective ? new Date(loan.dateRetourEffective).toLocaleDateString('fr-FR') : '-'}
                      </td>

                      <td className="py-2.5 px-3.5 font-mono font-bold text-slate-700 whitespace-nowrap">
                        {loan.loanNumber}
                      </td>

                      <td className="py-2.5 px-3.5">
                        <div className="font-bold text-slate-800 leading-snug">{ow?.titre}</div>
                        <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                          <span className="font-bold text-amber-800 bg-amber-50 px-1 py-0.2 rounded border border-amber-200">{ex?.codeQR}</span> • Cote: {ow?.cote}
                        </div>
                      </td>

                      <td className="py-2.5 px-3.5 whitespace-nowrap">
                        <div className="font-semibold text-slate-800">{adh?.prenom} {adh?.nom}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{adh?.numeroEtudiant}</div>
                      </td>

                      <td className="py-2.5 px-3.5 whitespace-nowrap font-mono text-slate-600">
                        {ex?.emplacement.tiroir}, {ex?.emplacement.rangee}
                      </td>


                      <td className="py-2.5 px-3.5 text-slate-500 italic text-[11px] max-w-xs truncate">
                        {loan.notes || '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};
