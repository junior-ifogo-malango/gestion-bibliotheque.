import React, { useState, useRef } from 'react';
import { X, BookPlus, Search, Loader2, CheckCircle2, AlertCircle, Layers, Image as ImageIcon,
  Upload,
  Trash2
} from 'lucide-react';
import { useLibrary } from '../context/LibraryContext';
import { BookCategory } from '../types';
import { lookupBookByIsbn } from '../utils/isbnLookup';
import { resizeImageFileToCoverDataUrl } from '../utils/coverResolver';
import { BookCover } from './BookCover';

const CATEGORIES: BookCategory[] = [
  'Informatique & Numérique',
  'Sciences & Techniques',
  'Mathématiques & Physique',
  'Histoire & Géographie',
  'Économie & Gestion',
  'Droit & Sciences Politiques',
  'Philosophie & Éthique',
  'Langues & Littérature',
  'Médecine & Santé',
  'Général & Référence'
];

export const NewBookModal: React.FC = () => {
  const { 
    isNewOuvrageOpen, 
    setIsNewOuvrageOpen, 
    addOuvrage, 
    setActivePrintLabelsOuvrageId 
  } = useLibrary();

  const [titre, setTitre] = useState('');
  const [auteur, setAuteur] = useState('');
  const [isbn, setIsbn] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [sommaire, setSommaire] = useState('');
  const [categorie, setCategorie] = useState<BookCategory>('Informatique & Numérique');
  const [cote, setCote] = useState('INFO-010');
  const [editeur, setEditeur] = useState('Dunod');
  const [anneeEdition, setAnneeEdition] = useState<number>(new Date().getFullYear());
  const [pagination, setPagination] = useState<number>(320);
  const [resume, setResume] = useState('');
  const [empruntable, setEmpruntable] = useState(true);

  // Search state
  const [isSearchingIsbn, setIsSearchingIsbn] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const resizedDataUrl = await resizeImageFileToCoverDataUrl(file);
      setCoverUrl(resizedDataUrl);
    } catch (err: any) {
      setUploadError(err.message || "Erreur lors du traitement de l'image.");
    }
  };

  const handleRemovePhoto = () => {
    setCoverUrl('');
    setUploadError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const [searchStatus, setSearchStatus] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Initial copies
  const [nbExemplaires, setNbExemplaires] = useState<number>(3);
  const [tiroir, setTiroir] = useState('T1');
  const [rangee, setRangee] = useState('R1');

  if (!isNewOuvrageOpen) return null;

  const handleIsbnSearch = async () => {
    if (!isbn.trim()) {
      setSearchStatus({
        type: 'error',
        message: 'Veuillez saisir un code ISBN valide (10 ou 13 chiffres).'
      });
      return;
    }

    setIsSearchingIsbn(true);
    setSearchStatus(null);

    try {
      const result = await lookupBookByIsbn(isbn);
      if (result) {
        if (result.titre) setTitre(result.titre);
        if (result.auteur) setAuteur(result.auteur);
        if (result.editeur) setEditeur(result.editeur);
        if (result.anneeEdition) setAnneeEdition(result.anneeEdition);
        if (result.pagination) setPagination(result.pagination);
        if (result.resume) setResume(result.resume);
        if (result.coverUrl) setCoverUrl(result.coverUrl);
        if (result.sommaire) setSommaire(result.sommaire);

        setSearchStatus({
          type: 'success',
          message: 'Informations, couverture et sommaire trouvés et pré-remplis !'
        });
      } else {
        setSearchStatus({
          type: 'error',
          message: 'Aucun résultat, saisissez les informations à la main'
        });
      }
    } catch {
      setSearchStatus({
        type: 'error',
        message: 'Aucun résultat, saisissez les informations à la main'
      });
    } finally {
      setIsSearchingIsbn(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titre.trim() || !auteur.trim()) return;

    let res;
    try {
      res = addOuvrage(
        {
          titre: titre.trim(),
          auteur: auteur.trim(),
          isbn: isbn.trim() || `978-2${Math.floor(10000000 + Math.random() * 90000000)}`,
          coverUrl: coverUrl.trim() || undefined,
          sommaire: sommaire.trim() || undefined,
          categorie,
          cote: cote.trim() || 'GEN-001',
          anneeEdition,
          editeur: editeur.trim() || 'Édition Universitaire',
          pagination,
          resume: resume.trim() || 'Ouvrage académique.',
          empruntable,
          coverGradient: 'from-blue-900 to-slate-900'
        },
        nbExemplaires,
        {
          tiroir: tiroir.trim() || 'T1',
          rangee: rangee.trim() || 'R1'
        }
      );
    } catch (err: any) {
      const isQuota = err?.name === 'QuotaExceededError' || err?.code === 22 || err?.message?.includes('quota');
      if (isQuota) {
        setUploadError("Photo trop lourde, choisissez une image plus petite");
        return;
      }
      throw err;
    }

    setIsNewOuvrageOpen(false);

    // Prompt to print QR stickers
    if (window.confirm(`Ouvrage "${titre}" créé avec ${nbExemplaires} exemplaire(s) et QR codes uniques générés. Souhaitez-vous afficher et imprimer la planche d'étiquettes QR maintenant ?`)) {
      setActivePrintLabelsOuvrageId(res.ouvrage.id);
    }

    // Reset form
    setTitre('');
    setAuteur('');
    setIsbn('');
    setCoverUrl('');
    setSommaire('');
    setResume('');
    setSearchStatus(null);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <BookPlus className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold font-serif">Nouvel Ouvrage & Exemplaires Physiques</h2>
              <p className="text-xs text-slate-400">Pré-remplissage automatique par ISBN et génération des exemplaires</p>
            </div>
          </div>
          <button
            onClick={() => setIsNewOuvrageOpen(false)}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs max-h-[85vh] overflow-y-auto">
          
          {/* ISBN Auto-fill Box */}
          <div className="p-4 bg-amber-50/70 border border-amber-200/90 rounded-xl space-y-2">
            <label className="font-bold text-amber-950 block">
              Recherche & Pré-remplissage automatique par ISBN
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={isbn}
                onChange={(e) => {
                  setIsbn(e.target.value);
                  if (searchStatus) setSearchStatus(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleIsbnSearch();
                  }
                }}
                placeholder="Ex: 978-0132350884 ou 9780262033848..."
                className="flex-1 p-2 border border-amber-300/80 rounded-lg font-mono uppercase bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500 text-xs"
              />
              <button
                type="button"
                onClick={handleIsbnSearch}
                disabled={isSearchingIsbn || !isbn.trim()}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-700 hover:bg-amber-800 disabled:bg-slate-300 text-white font-bold rounded-lg text-xs shadow-2xs transition shrink-0"
              >
                {isSearchingIsbn ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Recherche...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-3.5 h-3.5" />
                    <span>Rechercher par ISBN</span>
                  </>
                )}
              </button>
            </div>

            {/* Search feedback status */}
            {searchStatus && (
              <div className={`p-2.5 rounded-lg flex items-center gap-2 font-medium text-xs animate-in fade-in ${
                searchStatus.type === 'success' 
                  ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' 
                  : 'bg-rose-100 text-rose-900 border border-rose-300'
              }`}>
                {searchStatus.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-700 shrink-0" />
                )}
                <span>{searchStatus.message}</span>
              </div>
            )}
            <p className="text-[11px] text-slate-500">
              Interroge automatiquement Google Books puis Open Library (délai max 8s). Le gestionnaire peut ensuite modifier librement les informations.
            </p>
          </div>

          {/* Book Info Section with Cover Preview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
            
            {/* Live Cover Preview */}
            <div className="md:col-span-1 space-y-2 flex flex-col items-center">
              <label className="font-bold text-slate-700 block text-[11px] text-center">
                Aperçu Couverture
              </label>
              <div className="w-28 sm:w-32 shadow-xs rounded-xl overflow-hidden">
                <BookCover
                  titre={titre || "Titre de l'ouvrage"}
                  auteur={auteur || "Auteur"}
                  categorie={categorie}
                  coverUrl={coverUrl}
                  isbn={isbn}
                  size="sm"
                />
              </div>
              <span className="text-[10px] text-slate-400 text-center">
                {coverUrl ? 'Image personnalisée' : 'Couverture garantie'}
              </span>

              {coverUrl && (
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="text-[11px] font-semibold text-rose-600 hover:text-rose-800 flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Retirer la photo</span>
                </button>
              )}
            </div>

            {/* Editable Book Fields */}
            <div className="md:col-span-3 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Titre de l'ouvrage *</label>
                  <input
                    type="text"
                    required
                    value={titre}
                    onChange={(e) => setTitre(e.target.value)}
                    placeholder="Ex: Clean Code"
                    className="w-full p-2 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-amber-500 font-medium text-xs"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Auteur(s) *</label>
                  <input
                    type="text"
                    required
                    value={auteur}
                    onChange={(e) => setAuteur(e.target.value)}
                    placeholder="Ex: Robert C. Martin"
                    className="w-full p-2 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-amber-500 text-xs"
                  />
                </div>
              </div>

              {/* Téléverser une photo & Coller une URL */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-700 flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-amber-600" />
                    <span>Image de couverture</span>
                  </span>
                  {uploadError && (
                    <span className="text-xs font-semibold text-rose-600">
                      {uploadError}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {/* Option 1: Téléverser une photo (JPG, PNG) */}
                  <div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/jpeg,image/png,image/jpg"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="upload-cover-input"
                    />
                    <label
                      htmlFor="upload-cover-input"
                      className="w-full min-h-[38px] px-3 py-2 border border-slate-300 rounded-lg bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition shadow-2xs"
                    >
                      <Upload className="w-3.5 h-3.5 text-slate-500" />
                      <span>Téléverser une photo</span>
                    </label>
                  </div>

                  {/* Option 2: Coller une URL */}
                  <div>
                    <input
                      type="url"
                      value={coverUrl}
                      onChange={(e) => {
                        setCoverUrl(e.target.value);
                        setUploadError(null);
                      }}
                      placeholder="Coller une URL d'image..."
                      className="w-full h-[38px] px-2.5 py-1.5 border border-slate-300 rounded-lg font-mono text-[11px] text-slate-700 bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>
                <p className="text-[10px] text-slate-400">
                  Photo redimensionnée (max 400 px, JPEG). À défaut, couverture Open Library / Google Books ou couverture générée.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Catégorie / Discipline</label>
                  <select
                    value={categorie}
                    onChange={(e) => setCategorie(e.target.value as BookCategory)}
                    className="w-full p-2 border border-slate-200 rounded-lg bg-white text-xs"
                  >
                    {CATEGORIES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Cote de rangement</label>
                  <input
                    type="text"
                    value={cote}
                    onChange={(e) => setCote(e.target.value)}
                    placeholder="INFO-010"
                    className="w-full p-2 border border-slate-200 rounded-lg font-mono uppercase font-bold text-xs"
                  />
                </div>
              </div>
            </div>

          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Éditeur</label>
              <input
                type="text"
                value={editeur}
                onChange={(e) => setEditeur(e.target.value)}
                placeholder="Dunod, Pearson..."
                className="w-full p-2 border border-slate-200 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Année d'édition</label>
              <input
                type="number"
                value={anneeEdition}
                onChange={(e) => setAnneeEdition(parseInt(e.target.value, 10) || 2024)}
                className="w-full p-2 border border-slate-200 rounded-lg font-mono text-xs"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Pagination (pages)</label>
              <input
                type="number"
                value={pagination}
                onChange={(e) => setPagination(parseInt(e.target.value, 10) || 100)}
                className="w-full p-2 border border-slate-200 rounded-lg font-mono text-xs"
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Résumé / Thématiques</label>
            <textarea
              rows={2}
              value={resume}
              onChange={(e) => setResume(e.target.value)}
              placeholder="Présentation synthétique du document..."
              className="w-full p-2 border border-slate-200 rounded-lg text-xs"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Sommaire / Table des matières</label>
            <textarea
              rows={3}
              value={sommaire}
              onChange={(e) => setSommaire(e.target.value)}
              placeholder="Liste des chapitres..."
              className="w-full p-2 border border-slate-200 rounded-lg text-xs"
            />
          </div>

          {/* Empruntable toggle */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <label className="flex items-center space-x-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={empruntable}
                onChange={(e) => setEmpruntable(e.target.checked)}
                className="w-4 h-4 text-amber-600 rounded border-slate-300 focus:ring-amber-500"
              />
              <div>
                <span className="font-bold text-slate-800">Autorisé au prêt à domicile</span>
                <p className="text-[11px] text-slate-500">
                  Si décoché, l'ouvrage est affiché aux étudiants comme « Consultation sur place uniquement ».
                </p>
              </div>
            </label>
          </div>

          {/* Exemplaires physiques initiaux */}
          <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-200 space-y-3">
            <div className="flex items-center gap-2 font-bold text-amber-900 text-xs">
              <Layers className="w-4 h-4 text-amber-600" />
              <span>Génération des Exemplaires Physiques :</span>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-[10px] font-bold text-slate-700 block mb-1">Nombre d'exemplaires</label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={nbExemplaires}
                  onChange={(e) => setNbExemplaires(parseInt(e.target.value, 10) || 1)}
                  className="w-full p-2 border border-slate-200 rounded-lg bg-white font-mono font-bold text-xs"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-700 block mb-1">Tiroir initial</label>
                <input
                  type="text"
                  value={tiroir}
                  onChange={(e) => setTiroir(e.target.value)}
                  placeholder="Ex: T1"
                  className="w-full p-2 border border-slate-200 rounded-lg bg-white font-mono text-xs"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-700 block mb-1">Rangée initiale</label>
                <input
                  type="text"
                  value={rangee}
                  onChange={(e) => setRangee(e.target.value)}
                  placeholder="Ex: R1"
                  className="w-full p-2 border border-slate-200 rounded-lg bg-white font-mono text-xs"
                />
              </div>
            </div>

            <p className="text-[11px] text-slate-500 italic">
              Des codes QR uniques (ex: EX-...) seront automatiquement générés pour chaque copie physique.
            </p>
          </div>

          {/* Buttons */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsNewOuvrageOpen(false)}
              className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 font-semibold text-xs"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold shadow-xs transition text-xs"
            >
              Créer l'Ouvrage et ses {nbExemplaires} Exemplaires
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
