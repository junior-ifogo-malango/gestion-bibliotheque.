import React, { useState } from 'react';
import { 
  X, 
  Upload, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Download, 
  RefreshCw, 
  Users, 
  UserMinus, 
  UserCheck 
} from 'lucide-react';
import { useLibrary } from '../context/LibraryContext';

export const ImportStudentsModal: React.FC = () => {
  const { 
    isImportStudentsOpen, 
    setIsImportStudentsOpen, 
    importStudentsFromCSV 
  } = useLibrary();

  const [csvText, setCsvText] = useState('');
  const [fileName, setFileName] = useState('');
  const [report, setReport] = useState<{
    created: number;
    updated: number;
    resilies: number;
    total: number;
  } | null>(null);
  const [errors, setErrors] = useState<string[]>([]);

  if (!isImportStudentsOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setReport(null);
    setErrors([]);

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setCsvText(content);
    };
    reader.readAsText(file);
  };

  const handleProcessImport = () => {
    setReport(null);
    setErrors([]);

    const res = importStudentsFromCSV(csvText);
    if (!res.success) {
      setErrors(res.errors || ["Erreur lors du traitement du fichier."]);
    } else if (res.stats) {
      setReport(res.stats);
    }
  };

  const handleDownloadSample = () => {
    const sampleContent = `numéro d'étudiant,nom,prénom,e-mail académique
ETU-2026-0001,Benali,Karim,karim.benali@usmba.ac.ma
ETU-2026-0002,El Idrissi,Fatima Zahra,fatimazahra.elidrissi@usmba.ac.ma
ETU-2026-0003,Alami,Mehdi,mehdi.alami@usmba.ac.ma
ETU-2026-0004,Bennani,Salma,salma.bennani@usmba.ac.ma
ETU-2026-0005,Chraibi,Amine,amine.chraibi@usmba.ac.ma`;

    const blob = new Blob([sampleContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'modele_etudiants_inscrits.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleLoadSample20 = () => {
    const twentyStudents = `numéro d'étudiant,nom,prénom,e-mail académique
ETU-2026-0101,Ait Said,Youssef,youssef.aitsaid@usmba.ac.ma
ETU-2026-0102,Berrada,Ghita,ghita.berrada@usmba.ac.ma
ETU-2026-0103,Bouzid,Nasser,nasser.bouzid@usmba.ac.ma
ETU-2026-0104,Chami,Rim,rim.chami@usmba.ac.ma
ETU-2026-0105,Daoudi,Oussama,oussama.daoudi@usmba.ac.ma
ETU-2026-0106,El Fassi,Kenza,kenza.elfassi@usmba.ac.ma
ETU-2026-0107,El Guerrouj,Hicham,hicham.elguerrouj@usmba.ac.ma
ETU-2026-0108,Fassi Fihri,Taha,taha.fassifihri@usmba.ac.ma
ETU-2026-0109,Gharbi,Sanae,sanae.gharbi@usmba.ac.ma
ETU-2026-0110,Hassani,Moncef,moncef.hassani@usmba.ac.ma
ETU-2026-0111,Idrissi,Houda,houda.idrissi@usmba.ac.ma
ETU-2026-0112,Jaidi,Walid,walid.jaidi@usmba.ac.ma
ETU-2026-0113,Kettani,Chaimaa,chaimaa.kettani@usmba.ac.ma
ETU-2026-0114,Lahlou,Ilyas,ilyas.lahlou@usmba.ac.ma
ETU-2026-0115,Mansouri,Nadia,nadia.mansouri@usmba.ac.ma
ETU-2026-0116,Naciri,Achraf,achraf.naciri@usmba.ac.ma
ETU-2026-0117,Ouarzazi,Zineb,zineb.ouarzazi@usmba.ac.ma
ETU-2026-0118,Qotbi,Marouane,marouane.qotbi@usmba.ac.ma
ETU-2026-0119,Raji,Lamia,lamia.raji@usmba.ac.ma
ETU-2026-0120,Saidi,Anwar,anwar.saidi@usmba.ac.ma`;

    setCsvText(twentyStudents);
    setFileName("fichier_officiel_20_etudiants.csv");
    setReport(null);
    setErrors([]);
  };

  const handleClose = () => {
    setIsImportStudentsOpen(false);
    setCsvText('');
    setFileName('');
    setReport(null);
    setErrors([]);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Upload className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold font-serif">Importer la Liste des Étudiants Inscrits</h2>
              <p className="text-xs text-slate-400">Fichier officiel fourni par le Service des Inscriptions</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 text-xs">
          
          {/* Rules info */}
          <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200 text-slate-700 leading-relaxed space-y-1">
            <div className="font-bold text-amber-900 flex items-center gap-1.5">
              <span>Règles d'intégration automatique :</span>
            </div>
            <ul className="list-disc list-inside space-y-0.5 text-[11px] text-slate-600">
              <li>Colonnes requises : <strong>numéro d'étudiant</strong>, <strong>nom</strong>, <strong>prénom</strong>, <strong>e-mail académique</strong>.</li>
              <li>Le numéro d'étudiant est la clé unique : création si nouveau, mise à jour et reconduction si existant.</li>
              <li><strong>Les étudiants absents du nouveau fichier sont automatiquement passés au statut « résilié »</strong>.</li>
              <li>La validité de l'inscription est fixée à la fin de l'année universitaire.</li>
            </ul>
          </div>

          {/* Quick buttons */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleDownloadSample}
                className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold flex items-center gap-1.5 transition text-[11px]"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                Télécharger modèle CSV
              </button>
              <button
                type="button"
                onClick={handleLoadSample20}
                className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold flex items-center gap-1.5 transition text-[11px]"
              >
                <FileText className="w-3.5 h-3.5 text-amber-600" />
                Charger jeu d'essai (20 étudiants)
              </button>
            </div>

            {fileName && (
              <span className="text-[11px] font-mono text-amber-800 font-bold bg-amber-50 px-2 py-1 rounded border border-amber-200">
                {fileName}
              </span>
            )}
          </div>

          {/* File input / Drag drop */}
          <div className="border-2 border-dashed border-slate-300 hover:border-amber-400 rounded-2xl p-4 text-center bg-slate-50/50 transition">
            <input
              type="file"
              id="student-file-input"
              accept=".csv,.txt,.tsv"
              onChange={handleFileUpload}
              className="hidden"
            />
            <label
              htmlFor="student-file-input"
              className="cursor-pointer flex flex-col items-center justify-center space-y-1.5"
            >
              <Upload className="w-6 h-6 text-slate-400" />
              <span className="font-bold text-slate-800 text-xs">
                Sélectionner un fichier CSV ou Excel (.csv)
              </span>
              <span className="text-[11px] text-slate-400">
                Ou collez directement le texte délimité dans le champ ci-dessous
              </span>
            </label>
          </div>

          {/* Textarea preview / paste */}
          <div className="space-y-1">
            <label className="font-bold text-slate-700 block">
              Contenu du fichier à importer :
            </label>
            <textarea
              rows={6}
              value={csvText}
              onChange={(e) => {
                setCsvText(e.target.value);
                setReport(null);
                setErrors([]);
              }}
              placeholder="numéro d'étudiant,nom,prénom,e-mail académique&#10;ETU-2026-0001,Benali,Karim,karim.benali@usmba.ac.ma&#10;..."
              className="w-full p-3 font-mono text-xs border border-slate-200 rounded-xl bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Rejection Errors Banner */}
          {errors.length > 0 && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 space-y-1 animate-in fade-in">
              <div className="font-bold flex items-center gap-1.5 text-rose-900">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>Fichier Rejeté en Entier</span>
              </div>
              <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                {errors.map((err, idx) => (
                  <li key={idx}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Success Report Card */}
          {report && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 space-y-3 animate-in fade-in">
              <div className="font-bold flex items-center gap-2 text-sm text-emerald-900">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>Compte Rendu de l'Importation</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                <div className="bg-white p-2.5 rounded-lg border border-emerald-200 text-center">
                  <div className="text-[10px] text-slate-500 font-semibold uppercase">Fiches Créées</div>
                  <div className="text-xl font-extrabold text-emerald-700 mt-0.5">+{report.created}</div>
                </div>

                <div className="bg-white p-2.5 rounded-lg border border-emerald-200 text-center">
                  <div className="text-[10px] text-slate-500 font-semibold uppercase">Mises à Jour</div>
                  <div className="text-xl font-extrabold text-blue-700 mt-0.5">{report.updated}</div>
                </div>

                <div className="bg-white p-2.5 rounded-lg border border-emerald-200 text-center">
                  <div className="text-[10px] text-slate-500 font-semibold uppercase">Résiliées</div>
                  <div className="text-xl font-extrabold text-rose-700 mt-0.5">-{report.resilies}</div>
                </div>

                <div className="bg-white p-2.5 rounded-lg border border-emerald-200 text-center">
                  <div className="text-[10px] text-slate-500 font-semibold uppercase">Total Fichier</div>
                  <div className="text-xl font-extrabold text-slate-900 mt-0.5">{report.total}</div>
                </div>
              </div>

              <p className="text-[11px] text-emerald-800">
                Les codes QR uniques et les dates d'expiration (fin d'année universitaire) ont été automatiquement mis à jour.
              </p>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold text-xs"
          >
            Fermer
          </button>

          <button
            type="button"
            onClick={handleProcessImport}
            disabled={!csvText.trim()}
            className={`px-5 py-2 font-bold rounded-xl text-white shadow-xs transition text-xs flex items-center gap-1.5 ${
              csvText.trim()
                ? 'bg-amber-600 hover:bg-amber-700 active:scale-95'
                : 'bg-slate-300 cursor-not-allowed'
            }`}
          >
            <Upload className="w-4 h-4" />
            Lancer l'Intégration
          </button>
        </div>

      </div>
    </div>
  );
};
