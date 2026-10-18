import React, { useState, useMemo } from 'react';
import { 
  Users, 
  Search, 
  Upload, 
  CreditCard, 
  AlertTriangle, 
  CheckCircle2, 
  Mail, 
  Calendar,
  UserX,
  Camera,
  LayoutGrid,
  List
} from 'lucide-react';
import { useLibrary } from '../context/LibraryContext';
import { Adherent, StatutAdherent } from '../types';

export const MembersView: React.FC = () => {
  const { 
    adherents, 
    getAdherentActiveEmprunts, 
    isAdherentAutorise, 
    openNewLoan, 
    setSelectedAdherent, 
    setIsImportStudentsOpen,
    isEmpruntEnRetard
  } = useLibrary();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | StatutAdherent>('all');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  const filteredAdherents = useMemo(() => {
    return adherents.filter(adh => {
      if (statusFilter !== 'all' && adh.statut !== statusFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const match =
          adh.nom.toLowerCase().includes(q) ||
          adh.prenom.toLowerCase().includes(q) ||
          adh.numeroEtudiant.toLowerCase().includes(q) ||
          adh.emailAcademique.toLowerCase().includes(q);
        if (!match) return false;
      }

      return true;
    });
  }, [adherents, statusFilter, searchQuery]);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-2xl font-bold font-serif text-slate-900">
            Étudiants Inscrits & Cartes de Bibliothèque
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Répertoire universitaire issu de l'import officiel, contrôle des droits et cartes QR.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsImportStudentsOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium text-xs shadow-2xs transition"
          >
            <Upload className="w-4 h-4 text-slate-500" />
            <span>Importer la liste (CSV)</span>
          </button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher nom, prénom, numéro d'étudiant..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="text-xs font-medium rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 focus:outline-hidden"
          >
            <option value="all">Tous les étudiants ({adherents.length})</option>
            <option value="actif">Inscriptions Actives ({adherents.filter(a => a.statut === 'actif').length})</option>
            <option value="resilie">Inscriptions Résiliées ({adherents.filter(a => a.statut === 'resilie').length})</option>
          </select>

          {/* View toggle */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 shrink-0">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md text-xs font-bold transition ${
                viewMode === 'table' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Vue tableau dense"
            >
              <List className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`p-1.5 rounded-md text-xs font-bold transition ${
                viewMode === 'cards' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Vue cartes"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Empty State */}
      {filteredAdherents.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200/90 text-slate-500 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-400">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800 font-serif">Aucun étudiant trouvé</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4 leading-relaxed">
            Aucun dossier étudiant ne correspond à cette recherche ou à ce filtre.
          </p>
          <button
            onClick={() => { setSearchQuery(''); setStatusFilter('all'); }}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition shadow-xs"
          >
            Réinitialiser les filtres
          </button>
        </div>
      ) : viewMode === 'table' ? (
        /* Dense Table with Sticky Header */
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="overflow-x-auto max-h-[620px] overflow-y-auto">
            <table className="w-full text-left text-xs text-slate-600 border-collapse">
              <thead className="sticky top-0 z-10 bg-slate-100 text-slate-700 uppercase text-[10px] font-bold border-b border-slate-200 shadow-2xs">
                <tr>
                  <th className="py-2.5 px-3.5 bg-slate-100">Étudiant</th>
                  <th className="py-2.5 px-3.5 bg-slate-100">N° Matricule</th>
                  <th className="py-2.5 px-3.5 bg-slate-100">E-mail Académique</th>
                  <th className="py-2.5 px-3.5 bg-slate-100">Droits de Prêt</th>
                  <th className="py-2.5 px-3.5 bg-slate-100">Prêts en Cours</th>
                  <th className="py-2.5 px-3.5 bg-slate-100">Fin Année Univ.</th>
                  <th className="py-2.5 px-3.5 bg-slate-100 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAdherents.map(adh => {
                  const activeLoans = getAdherentActiveEmprunts(adh.id);
                  const authCheck = isAdherentAutorise(adh.id);

                  return (
                    <tr key={adh.id} className="hover:bg-slate-50/70 transition">
                      {/* Name & Initials */}
                      <td className="py-2.5 px-3.5 whitespace-nowrap">
                        <div 
                          onClick={() => setSelectedAdherent(adh)}
                          className="flex items-center gap-2.5 cursor-pointer group"
                        >
                          <div className="w-7 h-7 rounded-lg bg-slate-900 text-amber-300 flex items-center justify-center font-bold text-[11px] font-serif shrink-0">
                            {adh.prenom.charAt(0)}{adh.nom.charAt(0)}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 group-hover:text-amber-700 transition">
                              {adh.prenom} {adh.nom}
                            </span>
                            <span className={`ml-2 text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                              adh.statut === 'actif' ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-100 text-rose-800'
                            }`}>
                              {adh.statut === 'actif' ? 'Inscrit' : 'Résilié'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Student Number */}
                      <td className="py-2.5 px-3.5 font-mono font-bold text-slate-700 whitespace-nowrap">
                        {adh.numeroEtudiant}
                      </td>

                      {/* Email */}
                      <td className="py-2.5 px-3.5 text-slate-600 whitespace-nowrap">
                        {adh.emailAcademique}
                      </td>

                      {/* Borrowing Rights */}
                      <td className="py-2.5 px-3.5 whitespace-nowrap">
                        {!authCheck.autorise ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full">
                            <AlertTriangle className="w-3 h-3 text-rose-600" />
                            {authCheck.motif}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Autorisé
                          </span>
                        )}
                      </td>

                      {/* Active Loans */}
                      <td className="py-2.5 px-3.5 whitespace-nowrap font-mono font-semibold text-slate-800">
                        {activeLoans.length} ex.
                      </td>

                      {/* Expiration Date */}
                      <td className="py-2.5 px-3.5 whitespace-nowrap text-slate-500">
                        {new Date(adh.dateExpiration).toLocaleDateString('fr-FR')}
                      </td>

                      {/* Actions */}
                      <td className="py-2.5 px-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedAdherent(adh)}
                            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
                            title="Carte QR & Emprunts"
                          >
                            <CreditCard className="w-4 h-4 text-amber-600" />
                          </button>

                          <button
                            onClick={() => openNewLoan(undefined, adh.id)}
                            disabled={!authCheck.autorise}
                            className={`px-2.5 py-1 text-xs font-bold rounded-lg transition ${
                              !authCheck.autorise
                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                : 'bg-amber-600 hover:bg-amber-700 text-white shadow-2xs active:scale-95'
                            }`}
                          >
                            + Prêter
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
      ) : (
        /* Cards Mode */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredAdherents.map(adh => {
            const activeLoans = getAdherentActiveEmprunts(adh.id);
            const authCheck = isAdherentAutorise(adh.id);

            return (
              <div
                key={adh.id}
                className="bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition p-5 flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-900 text-amber-300 flex items-center justify-center font-bold text-sm shadow-xs font-serif">
                        {adh.prenom.charAt(0)}{adh.nom.charAt(0)}
                      </div>
                      <div>
                        <h3 
                          onClick={() => setSelectedAdherent(adh)}
                          className="font-bold text-sm text-slate-900 group-hover:text-amber-700 transition cursor-pointer"
                        >
                          {adh.prenom} {adh.nom}
                        </h3>
                        <span className="font-mono text-xs font-semibold text-slate-500">
                          {adh.numeroEtudiant}
                        </span>
                      </div>
                    </div>

                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      adh.statut === 'actif'
                        ? 'bg-emerald-50 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}>
                      {adh.statut === 'actif' ? 'Inscrit' : 'Résilié'}
                    </span>
                  </div>

                  {/* Email and academic year date */}
                  <div className="mt-4 space-y-1.5 text-xs text-slate-500">
                    <div className="flex items-center gap-2 truncate">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{adh.emailAcademique}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>Fin d'année univ. : {new Date(adh.dateExpiration).toLocaleDateString('fr-FR')}</span>
                    </div>
                  </div>

                  {/* Loans status */}
                  <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-medium">
                      <span className="text-slate-600">Prêts en cours :</span>
                      <strong className="font-mono text-slate-900">{activeLoans.length} exemplaire(s)</strong>
                    </div>

                    {!authCheck.autorise ? (
                      <div className="text-[11px] font-bold text-rose-600 bg-rose-50 p-2 rounded-lg flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                        <span>{authCheck.motif}</span>
                      </div>
                    ) : (
                      <div className="text-[11px] font-medium text-emerald-700 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Autorisé aux prêts</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={() => setSelectedAdherent(adh)}
                    className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1"
                  >
                    <CreditCard className="w-3.5 h-3.5 text-amber-600" />
                    <span>Carte QR & Emprunts</span>
                  </button>

                  <button
                    onClick={() => openNewLoan(undefined, adh.id)}
                    disabled={!authCheck.autorise}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                      !authCheck.autorise
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        : 'bg-amber-600 hover:bg-amber-700 text-white shadow-2xs active:scale-95'
                    }`}
                  >
                    + Prêter
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
