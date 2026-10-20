import React, { useState, useEffect, useRef } from 'react';
import jsQR from 'jsqr';
import { 
  X, 
  Camera, 
  QrCode, 
  User, 
  BookOpen, 
  CheckCircle2, 
  AlertCircle, 
  Receipt, 
  RotateCcw,
  Ban, 
  Search,
  Keyboard,
  ArrowRight,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { useLibrary } from '../context/LibraryContext';
import { Ouvrage, Exemplaire, Adherent, Emprunt } from '../types';

export const ScanLoanModal: React.FC = () => {
  const { 
    isNewLoanOpen, 
    setIsNewLoanOpen, 
    addLoanByScan,
    cancelLoan, 
    setActiveReceiptEmprunt,
    adherents,
    exemplaires,
    getOuvrageById,
    loanDurationDays,
    preselectedExemplaireId,
    preselectedAdherentId
  } = useLibrary();

  const [step, setStep] = useState<1 | 2>(1);
  const [exemplaireCode, setExemplaireCode] = useState('');
  const [studentCode, setStudentCode] = useState('');

  // Fallbacks
  const [manualExCode, setManualExCode] = useState('');
  const [studentSearch, setStudentSearch] = useState('');

  // Result state
  const [refusalReason, setRefusalReason] = useState<string | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [isCancelled, setIsCancelled] = useState(false);
  const [successData, setSuccessData] = useState<{
    emprunt: Emprunt;
    ouvrage: Ouvrage;
    exemplaire: Exemplaire;
    adherent: Adherent;
  } | null>(null);

  // Video stream refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameId = useRef<number | null>(null);
  const [cameraError, setCameraError] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);

  useEffect(() => {
    if (!isNewLoanOpen) {
      stopCamera();
      resetState();
      return;
    }

    if (preselectedExemplaireId) {
      const ex = exemplaires.find(e => e.id === preselectedExemplaireId);
      if (ex) {
        setExemplaireCode(ex.codeQR);
        setStep(2);
      }
    }

    if (preselectedAdherentId) {
      const adh = adherents.find(a => a.id === preselectedAdherentId);
      if (adh) {
        setStudentCode(adh.numeroEtudiant);
      }
    }

    startCamera();

    return () => {
      stopCamera();
    };
  }, [isNewLoanOpen, preselectedExemplaireId, preselectedAdherentId]);

  const resetState = () => {
    setStep(1);
    setExemplaireCode('');
    setStudentCode('');
    setManualExCode('');
    setStudentSearch('');
    setRefusalReason(null);
    setSuccessData(null);
    setShowCancelConfirm(false);
    setIsCancelled(false);
    setCameraError(false);
  };

  const startCamera = async () => {
    setCameraError(false);
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraError(true);
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
        scanFrames();
      }
    } catch {
      setCameraError(true);
    }
  };

  const stopCamera = () => {
    if (animFrameId.current) {
      cancelAnimationFrame(animFrameId.current);
      animFrameId.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const scanFrames = () => {
    if (!videoRef.current || !canvasRef.current || videoRef.current.readyState !== videoRef.current.HAVE_ENOUGH_DATA) {
      animFrameId.current = requestAnimationFrame(scanFrames);
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    if (ctx) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imgData.data, imgData.width, imgData.height, {
        inversionAttempts: 'dontInvert'
      });

      if (code && code.data.trim()) {
        const val = code.data.trim();
        handleQRDetected(val);
        return;
      }
    }

    animFrameId.current = requestAnimationFrame(scanFrames);
  };

  const handleQRDetected = (val: string) => {
    if (step === 1) {
      // Step 1: Exemplaire scanned
      setExemplaireCode(val);
      setStep(2);
      // Restart frame scanning for step 2
      setTimeout(() => {
        scanFrames();
      }, 500);
    } else if (step === 2) {
      // Step 2: Student scanned
      setStudentCode(val);
      finalizeLoan(exemplaireCode, val);
    }
  };

  const finalizeLoan = (exVal: string, studVal: string) => {
    stopCamera();
    setRefusalReason(null);

    const res = addLoanByScan(exVal, studVal);
    if (!res.success) {
      setRefusalReason(res.error || "Refus d'emprunt : Règle non satisfaite.");
    } else if (res.emprunt && res.ouvrage && res.exemplaire && res.adherent) {
      setSuccessData({
        emprunt: res.emprunt,
        ouvrage: res.ouvrage,
        exemplaire: res.exemplaire,
        adherent: res.adherent
      });
    }
  };

  const handleCancelRecordedLoan = () => {
    if (!successData) return;
    cancelLoan(successData.emprunt.id);
    setIsCancelled(true);
    setShowCancelConfirm(false);
  };

  const handleManualExemplaireSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualExCode.trim()) return;
    setExemplaireCode(manualExCode.trim());
    setStep(2);
  };

  const handleSelectStudentFromList = (adh: Adherent) => {
    setStudentCode(adh.numeroEtudiant);
    finalizeLoan(exemplaireCode, adh.numeroEtudiant);
  };

  const handleRetry = () => {
    resetState();
    startCamera();
  };

  const handleClose = () => {
    setIsNewLoanOpen(false);
  };

  if (!isNewLoanOpen) return null;

  // Selected copy preview
  const resolvedExemplaire = exemplaires.find(
    e => e.codeQR.trim().toUpperCase() === exemplaireCode.trim().toUpperCase()
  );
  const resolvedOuvrage = resolvedExemplaire ? getOuvrageById(resolvedExemplaire.ouvrageId) : null;

  // Filtered students for manual fallback
  const filteredStudents = studentSearch.trim()
    ? adherents.filter(a => 
        a.nom.toLowerCase().includes(studentSearch.toLowerCase()) ||
        a.prenom.toLowerCase().includes(studentSearch.toLowerCase()) ||
        a.numeroEtudiant.toLowerCase().includes(studentSearch.toLowerCase())
      ).slice(0, 5)
    : [];

  return (
    <div className={`fixed inset-0 z-50 overflow-y-auto bg-slate-900/75 backdrop-blur-xs flex items-center justify-center ${
      isFullScreen ? 'p-0' : 'p-2 sm:p-4'
    }`}>
      <div className={`bg-white shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 transition-all ${
        isFullScreen 
          ? 'w-full h-full rounded-none flex flex-col justify-between max-w-none' 
          : 'rounded-2xl max-w-lg w-full'
      }`}>
        
        {/* Header */}
        <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold font-serif">Enregistrer un Prêt (Scan Automatique)</h2>
              <p className="text-[11px] text-slate-400">Présentation sur place du livre et de la carte étudiant</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsFullScreen(prev => !prev)}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              title={isFullScreen ? "Quitter le plein écran" : "Passer en plein écran"}
            >
              {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button
              onClick={handleClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              title="Fermer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className={`p-5 space-y-4 text-xs ${isFullScreen ? 'overflow-y-auto max-w-3xl mx-auto w-full' : ''}`}>
          
          {/* Refusal Banner */}
          {refusalReason && (
            <div className="p-4 rounded-xl bg-rose-50 border-2 border-rose-300 text-rose-900 space-y-2 animate-in fade-in">
              <div className="flex items-center gap-2 font-bold text-sm text-rose-700">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span>Refus de Prêt</span>
              </div>
              <p className="font-semibold leading-relaxed text-xs">
                {refusalReason}
              </p>
              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={handleRetry}
                  className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 shadow-xs"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Recommencer le scan
                </button>
              </div>
            </div>
          )}

          {/* Success Screen / Confirmation */}
          {successData && (
            <div className="p-5 rounded-2xl bg-slate-50 border-2 border-slate-200 text-slate-900 space-y-4 animate-in fade-in">
              {isCancelled ? (
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-950 text-center space-y-2">
                  <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-800 mx-auto flex items-center justify-center">
                    <Ban className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-bold text-amber-900">Emprunt annulé</h3>
                  <p className="text-xs text-amber-800">
                    L'exemplaire <strong>{successData.exemplaire.codeQR}</strong> est redevenu <strong>DISPONIBLE</strong>. L'emprunt a été marqué annulé dans le registre sans être comptabilisé.
                  </p>
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={handleClose}
                      className="min-h-[44px] px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition"
                    >
                      Fermer
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="text-center space-y-1">
                    <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center shadow-inner">
                      <CheckCircle2 className="w-7 h-7" />
                    </div>
                    <h3 className="text-base font-bold font-serif text-slate-900">
                      Emprunt enregistré
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      N° d'enregistrement : <strong className="font-mono">{successData.emprunt.loanNumber}</strong>
                    </p>
                  </div>

                  {/* Résumé (titre, étudiant, date de retour prévue) */}
                  <div className="bg-white p-3.5 rounded-xl border border-slate-200 text-left space-y-2 text-xs">
                    <div className="flex justify-between items-start gap-2">
                      <span className="text-slate-500 shrink-0">Titre :</span>
                      <span className="font-bold text-slate-900 text-right">{successData.ouvrage.titre}</span>
                    </div>
                    <div className="flex justify-between items-center gap-2">
                      <span className="text-slate-500 shrink-0">Exemplaire :</span>
                      <span className="font-mono font-bold text-amber-800">{successData.exemplaire.codeQR}</span>
                    </div>
                    <div className="flex justify-between items-center gap-2">
                      <span className="text-slate-500 shrink-0">Étudiant :</span>
                      <span className="font-semibold text-slate-800">{successData.adherent.prenom} {successData.adherent.nom} ({successData.adherent.numeroEtudiant})</span>
                    </div>
                    <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-slate-900 font-bold">
                      <span className="text-slate-600">Date de retour prévue :</span>
                      <span className="font-mono text-xs bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded-lg border border-emerald-200">
                        {new Date(successData.emprunt.dateRetourPrevue).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                  </div>

                  {/* Confirmation box if user clicked Annuler l'emprunt */}
                  {showCancelConfirm ? (
                    <div className="p-3.5 rounded-xl bg-red-50 border border-red-300 text-red-950 text-center space-y-2.5 animate-in fade-in">
                      <p className="text-xs font-bold text-red-900">
                        Annuler cet emprunt ?
                      </p>
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={handleCancelRecordedLoan}
                          className="min-h-[44px] px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs transition shadow-xs"
                        >
                          Oui
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowCancelConfirm(false)}
                          className="min-h-[44px] px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold rounded-xl text-xs transition"
                        >
                          Non
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Deux boutons : Terminer (principal) et Annuler l'emprunt (secondaire en rouge) */
                    <div className="space-y-2 pt-1">
                      <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={handleClose}
                          className="w-full sm:w-auto min-h-[44px] px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition shadow-xs flex items-center justify-center"
                        >
                          Terminer
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowCancelConfirm(true)}
                          className="w-full sm:w-auto min-h-[44px] px-4 py-2.5 border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 font-semibold rounded-xl text-xs transition flex items-center justify-center gap-1.5"
                        >
                          <Ban className="w-3.5 h-3.5 text-red-600" />
                          Annuler l'emprunt
                        </button>
                      </div>
                      <div className="text-center pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            handleClose();
                            setActiveReceiptEmprunt(successData.emprunt);
                          }}
                          className="min-h-[44px] text-[11px] text-slate-500 hover:text-slate-800 inline-flex items-center gap-1 underline"
                        >
                          <Receipt className="w-3 h-3 text-amber-600" />
                          Imprimer le reçu QR
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Active Dual Scanning Flow */}
          {!refusalReason && !successData && (
            <div className="space-y-4">
              
              {/* Stepper visual */}
              <div className="grid grid-cols-2 gap-2 text-center text-xs font-bold">
                <div className={`p-2.5 rounded-xl border transition flex items-center justify-center gap-1.5 ${
                  step === 1 ? 'border-amber-600 bg-amber-50 text-amber-900' : 'border-slate-200 bg-slate-50 text-slate-500'
                }`}>
                  <QrCode className="w-4 h-4 text-amber-600" />
                  <span>1. Exemplaire</span>
                  {exemplaireCode && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                </div>

                <div className={`p-2.5 rounded-xl border transition flex items-center justify-center gap-1.5 ${
                  step === 2 ? 'border-amber-600 bg-amber-50 text-amber-900' : 'border-slate-200 bg-slate-50 text-slate-500'
                }`}>
                  <User className="w-4 h-4 text-amber-600" />
                  <span>2. Carte Étudiant EST</span>
                </div>
              </div>

              {/* Status prompt */}
              <div className="text-center">
                <p className="font-extrabold text-sm text-slate-800 font-serif">
                  {step === 1 
                    ? "Pointez la caméra vers le code QR de l'exemplaire" 
                    : "Pointez la caméra vers le code QR de la carte étudiant EST"}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {step === 1 
                    ? "L'étudiant présente le livre pris en rayon." 
                    : `Exemplaire scanné : ${exemplaireCode}. Scannez maintenant sa carte étudiant EST (numéro d'étudiant).`}
                </p>
              </div>

              {/* Camera Feed */}
              <div className="relative w-full aspect-16/10 bg-slate-950 rounded-xl overflow-hidden flex items-center justify-center border border-slate-800 shadow-inner">
                <video
                  ref={videoRef}
                  className={`w-full h-full object-cover ${cameraError ? 'hidden' : 'block'}`}
                />
                <canvas ref={canvasRef} className="hidden" />

                {/* Target overlay */}
                {!cameraError && (
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <div className="w-44 h-44 border-2 border-amber-400 rounded-xl relative animate-pulse shadow-lg shadow-amber-500/20">
                      <div className="absolute top-0 left-0 w-3 h-3 border-t-4 border-l-4 border-amber-500 rounded-tl" />
                      <div className="absolute top-0 right-0 w-3 h-3 border-t-4 border-r-4 border-amber-500 rounded-tr" />
                      <div className="absolute bottom-0 left-0 w-3 h-3 border-b-4 border-l-4 border-amber-500 rounded-bl" />
                      <div className="absolute bottom-0 right-0 w-3 h-3 border-b-4 border-r-4 border-amber-500 rounded-br" />
                      <div className="absolute left-2 right-2 top-1/2 h-0.5 bg-amber-400/80" />
                    </div>
                  </div>
                )}

                {cameraError && (
                  <div className="p-4 text-center text-xs text-slate-300 space-y-1">
                    <p className="font-semibold text-amber-300">Caméra inactive ou non disponible</p>
                    <p className="text-[11px] text-slate-400">Utilisez la saisie de secours ci-dessous.</p>
                  </div>
                )}
              </div>

              {/* Step 1 Exemplaire Fallback */}
              {step === 1 && (
                <form onSubmit={handleManualExemplaireSubmit} className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-[11px] text-slate-600">
                    <span className="font-bold flex items-center gap-1">
                      <Keyboard className="w-3.5 h-3.5 text-amber-600" />
                      Secours : code QR de l'exemplaire :
                    </span>
                    <span className="text-slate-400 font-mono">Ex: EX-1001</span>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={manualExCode}
                      onChange={(e) => setManualExCode(e.target.value)}
                      placeholder="Code exemplaire (ex: EX-1001)..."
                      className="flex-1 px-3 py-1.5 text-xs font-mono rounded-lg border border-slate-200 uppercase bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                    />
                    <button
                      type="submit"
                      disabled={!manualExCode.trim()}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-bold text-white ${
                        manualExCode.trim() ? 'bg-amber-600 hover:bg-amber-700' : 'bg-slate-300'
                      }`}
                    >
                      Suivant
                    </button>
                  </div>
                </form>
              )}

              {/* Step 2 Student Fallback */}
              {step === 2 && (
                <div className="space-y-2 pt-1 border-t border-slate-100">
                  <div className="flex items-center justify-between text-[11px] text-slate-600">
                    <span className="font-bold flex items-center gap-1">
                      <Search className="w-3.5 h-3.5 text-amber-600" />
                      Secours : recherche par nom ou numéro d'étudiant :
                    </span>
                  </div>

                  <input
                    type="text"
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    placeholder="Taper un nom ou numéro d'étudiant (ETU-...)..."
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500 font-medium"
                  />

                  {filteredStudents.length > 0 && (
                    <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 max-h-32 overflow-y-auto bg-white shadow-xs">
                      {filteredStudents.map(adh => (
                        <div
                          key={adh.id}
                          onClick={() => handleSelectStudentFromList(adh)}
                          className="p-2 flex items-center justify-between hover:bg-amber-50/70 cursor-pointer transition text-xs"
                        >
                          <div>
                            <span className="font-bold text-slate-800">{adh.prenom} {adh.nom}</span>
                            <span className="font-mono text-[10px] text-slate-500 ml-2">({adh.numeroEtudiant})</span>
                          </div>
                          <button
                            type="button"
                            className="px-2 py-0.5 bg-amber-600 text-white rounded text-[10px] font-bold"
                          >
                            Sélectionner
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex justify-between items-center pt-1 text-[11px]">
                    <button
                      type="button"
                      onClick={() => {
                        setStep(1);
                        setExemplaireCode('');
                      }}
                      className="text-slate-500 hover:text-slate-800 underline"
                    >
                      ← Changer d'exemplaire
                    </button>
                    <span className="text-slate-400">Durée d'emprunt : {loanDurationDays} jours</span>
                  </div>
                </div>
              )}

            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          {/* Moment 2 : Exemplaire scanné, carte pas encore scannée -> bouton « Annuler » toujours visible qui quitte sans rien enregistrer */}
          {step === 2 && !successData && !refusalReason ? (
            <>
              <button
                type="button"
                onClick={handleClose}
                className="min-h-[44px] px-4 py-2 text-xs font-bold rounded-xl text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 transition flex items-center gap-1.5"
              >
                <Ban className="w-3.5 h-3.5 text-red-600" />
                Annuler
              </button>
              <button
                type="button"
                onClick={() => {
                  setStep(1);
                  setExemplaireCode('');
                }}
                className="min-h-[44px] px-3 py-2 text-xs text-slate-500 hover:text-slate-800 underline"
              >
                Changer d'exemplaire
              </button>
            </>
          ) : (
            /* Moment 1 : Avant le scan de l'exemplaire -> bouton « Fermer » */
            <div className="ml-auto">
              <button
                onClick={handleClose}
                className="min-h-[44px] px-4 py-2 text-xs font-semibold rounded-xl text-slate-700 hover:bg-slate-100 transition"
              >
                Fermer
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
