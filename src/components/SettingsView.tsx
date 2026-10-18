import React, { useState } from 'react';
import { 
  RotateCcw, 
  Download, 
  RefreshCw, 
  Sliders,
  CheckCircle2
} from 'lucide-react';
import { useLibrary } from '../context/LibraryContext';

export const SettingsView: React.FC = () => {
  const { 
    currentDate, 
    isSimulatedDate, 
    setSimulatedDate, 
    resetSimulatedDate, 
    advanceOneDay, 
    advanceDays, 
    exportDatabaseJSON, 
    resetToDefaultData,
    runDailyChecks
  } = useLibrary();

  const [feedback, setFeedback] = useState<string | null>(null);
  const realToday = new Date().toISOString().split('T')[0];

  const handleRunChecks = () => {
    const res = runDailyChecks(currentDate);
    setFeedback(`Contrôle terminé : ${res.remindersSentCount} rappel(s) de retard émis pour la date du ${new Date(currentDate).toLocaleDateString('fr-FR')}.`);
    setTimeout(() => setFeedback(null), 5000);
  };

  const handleResetData = () => {
    if (confirm('Voulez-vous réinitialiser toutes les données aux valeurs de démonstration d’origine ? Vos modifications actuelles seront écrasées.')) {
      resetToDefaultData();
      setFeedback('Données réinitialisées avec succès aux valeurs de démonstration.');
      setTimeout(() => setFeedback(null), 4000);
    }
  };

  return (
    <div className="max-w-[800px] mx-auto space-y-6 pb-12 font-sans">
      
      {/* Page Title */}
      <div>
        <h1 className="text-xl font-semibold text-slate-900">
          Réglages
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Outils de simulation temporelle et gestion des données du système.
        </p>
      </div>

      {feedback && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Block 1: Outils de test */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-5 shadow-2xs">
        <div className="border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-slate-600" />
            <h2 className="text-sm font-semibold text-slate-900">
              Outils de test
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Simulez l'écoulement du temps pour vérifier les échéances de prêt (15 jours) et les rappels automatiques (J+2 et J+4).
          </p>
        </div>

        {/* Date Selector */}
        <div className="space-y-2">
          <label className="block text-xs font-medium text-slate-700">
            Date active du système
          </label>
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <input
                type="date"
                value={currentDate}
                onChange={(e) => setSimulatedDate(e.target.value)}
                className="text-xs rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-800 font-mono focus:outline-hidden focus:ring-1 focus:ring-slate-400"
              />
            </div>

            {isSimulatedDate ? (
              <button
                onClick={resetSimulatedDate}
                className="px-3 py-2 text-xs font-medium rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center gap-1.5 transition cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                <span>Revenir à la date réelle ({new Date(realToday).toLocaleDateString('fr-FR')})</span>
              </button>
            ) : (
              <span className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                Date réelle synchronisée
              </span>
            )}
          </div>
        </div>

        {/* Advance buttons */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <span className="block text-xs font-medium text-slate-700">
            Avancement rapide du temps
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={advanceOneDay}
              className="px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition cursor-pointer"
              title="Avancer de 1 jour"
            >
              +1j
            </button>
            <button
              onClick={() => advanceDays(2)}
              className="px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition cursor-pointer"
              title="Avancer de 2 jours (J+2 : premier rappel)"
            >
              +2j
            </button>
            <button
              onClick={() => advanceDays(4)}
              className="px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition cursor-pointer"
              title="Avancer de 4 jours (J+4 : 2e rappel)"
            >
              +4j
            </button>
            <button
              onClick={() => advanceDays(8)}
              className="px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition cursor-pointer"
              title="Avancer de 8 jours (retard critique)"
            >
              +8j
            </button>
            <button
              onClick={() => advanceDays(20)}
              className="px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition cursor-pointer"
              title="Avancer de 20 jours"
            >
              +20j
            </button>

            <button
              onClick={handleRunChecks}
              className="px-3 py-2 text-xs font-medium rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 flex items-center gap-1.5 transition ml-auto cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
              <span>Exécuter le contrôle automatique</span>
            </button>
          </div>
        </div>
      </div>

      {/* Block 2: Sauvegarde & Données */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4 shadow-2xs">
        <div className="border-b border-slate-100 pb-3">
          <h2 className="text-sm font-semibold text-slate-900">
            Données et persistance
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Sauvegarde complète de la base de données locale dans le navigateur.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div>
            <p className="text-xs font-medium text-slate-700">Exportation JSON</p>
            <p className="text-[11px] text-slate-400">Télécharge un fichier JSON contenant l'état complet du catalogue et des prêts.</p>
          </div>
          <button
            onClick={exportDatabaseJSON}
            className="px-3.5 py-2 text-xs font-medium rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 flex items-center gap-1.5 transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Télécharger la sauvegarde</span>
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
          <div>
            <p className="text-xs font-medium text-rose-700">Réinitialisation des données</p>
            <p className="text-[11px] text-slate-400">Recharge les 20 ouvrages et 30 étudiants de démonstration par défaut.</p>
          </div>
          <button
            onClick={handleResetData}
            className="px-3.5 py-2 text-xs font-medium rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-800 flex items-center gap-1.5 transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
            <span>Réinitialiser</span>
          </button>
        </div>
      </div>

    </div>
  );
};
