import React, { useState, useEffect, useRef } from 'react';
import jsQR from 'jsqr';
import { 
  X, 
  Camera, 
  BookCheck, 
  MapPin, 
  CheckCircle2, 
  AlertTriangle, 
  Keyboard,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { useLibrary } from '../context/LibraryContext';
import { Exemplaire, Ouvrage, Adherent } from '../types';

export const ScanReturnModal: React.FC = () => {
  const { 
    isScanReturnOpen, 
    setIsScanReturnOpen, 
    returnByScan, 
    markLoanReclasse,
    exemplaires, 
    getOuvrageById, 
    emprunts, 
    getAdherentById
  } = useLibrary();

  const [scannedCopyCode, setScannedCopyCode] = useState<string>('');
  const [manualCode, setManualCode] = useState<string>('');
  const [returnResult, setReturnResult] = useState<{
    hadActiveLoan: boolean;
    exemplaire: Exemplaire;
    emplacement: { tiroir: string; rangee: string };
    ouvrage?: Ouvrage;
    adherent?: Adherent;
    isOverdue?: boolean;
    daysLate?: number;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Video scanner refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameId = useRef<number | null>(null);
  const [cameraError, setCameraError] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);

  useEffect(() => {
    if (!isScanReturnOpen) {
      stopCamera();
      resetState();
      return;
    }
    startCamera();
    return () => {
      stopCamera();
    };
  }, [isScanReturnOpen]);

  const resetState = () => {
    setScannedCopyCode('');
    setManualCode('');
    setReturnResult(null);
    setErrorMessage(null);
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
        handleCopyScanned(val);
        return;
      }
    }

    animFrameId.current = requestAnimationFrame(scanFrames);
  };

  const handleCopyScanned = (codeVal: string) => {
    stopCamera();
    setErrorMessage(null);

    const clean = codeVal.trim().toUpperCase();
    const ex = exemplaires.find(e => e.codeQR.trim().toUpperCase() === clean || e.id === codeVal);

    if (!ex) {
      setErrorMessage(`Aucun exemplaire trouvé avec le code QR "${codeVal}".`);
      return;
    }

    setScannedCopyCode(ex.codeQR);

    // Exécution directe du retour : aucun choix d'état
    const res = returnByScan(ex.codeQR);
    if (!res.success) {
      setErrorMessage(res.error || "Erreur lors du retour.");
      return;
    }

    if (res.exemplaire && res.emplacement) {
      setReturnResult({
        hadActiveLoan: res.hadActiveLoan,
        exemplaire: res.exemplaire,
        emplacement: res.emplacement,
        ouvrage: res.ouvrage,
        adherent: res.adherent,
        isOverdue: res.isOverdue,
        daysLate: res.daysLate
      });
    }
  };

  const handleReclasser = () => {
    if (returnResult) {
      const activeOrRecentLoan = emprunts.find(e => 
        e.exemplaireId === returnResult.exemplaire.id && 
        (e.statut === 'rendu' || e.statut === 'en_cours')
      );
      markLoanReclasse(activeOrRecentLoan?.id, returnResult.exemplaire.codeQR);
    }
    handleClose();
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    handleCopyScanned(manualCode.trim());
  };

  const handleScanAnother = () => {
    resetState();
    startCamera();
  };

  const handleClose = () => {
    setIsScanReturnOpen(false);
  };

  if (!isScanReturnOpen) return null;

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
        <div className="bg-emerald-950 text-white px-5 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <BookCheck className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold font-serif">Restitution d'Exemplaire (Scan Retour)</h2>
              <p className="text-[11px] text-emerald-300">Scan du livre rendu & consigne immédiate de rangement</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsFullScreen(prev => !prev)}
              className="p-1.5 text-emerald-300 hover:text-white rounded-lg hover:bg-emerald-900 transition"
              title={isFullScreen ? "Quitter le plein écran" : "Passer en plein écran"}
            >
              {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button
              onClick={handleClose}
              className="p-1.5 text-emerald-300 hover:text-white rounded-lg hover:bg-emerald-900 transition"
              title="Fermer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className={`p-5 space-y-4 text-xs ${isFullScreen ? 'overflow-y-auto max-w-3xl mx-auto w-full' : ''}`}>
          
          {/* Error Message */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMessage}</span>
              </div>
              <button
                onClick={handleScanAnother}
                className="min-h-[44px] px-3 py-1.5 bg-rose-600 text-white rounded-lg font-bold text-xs"
              >
                Réessayer
              </button>
            </div>
          )}

          {/* Result view with "Ranger : tiroir X, rangée Y" and "Reclasser" */}
          {returnResult ? (
            <div className="p-6 text-center space-y-4 animate-in fade-in">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center shadow-inner">
                <CheckCircle2 className="w-9 h-9" />
              </div>

              <div>
                <h3 className="text-base font-bold font-serif text-slate-900">
                  {returnResult.hadActiveLoan 
                    ? "Retour validé !" 
                    : "Livre lu sur place (aucun emprunt actif)"}
                </h3>
                {returnResult.hadActiveLoan && returnResult.adherent && (
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Emprunteur : <strong>{returnResult.adherent.prenom} {returnResult.adherent.nom}</strong> ({returnResult.adherent.numeroEtudiant})
                    {returnResult.isOverdue && (
                      <span className="ml-1 text-rose-600 font-bold">(Restitué en retard de {returnResult.daysLate}j - blocage levé)</span>
                    )}
                  </p>
                )}
              </div>

              {/* Consigne de rangement en rayon */}
              <div className="p-5 rounded-2xl bg-amber-50 border-2 border-amber-300 text-slate-900 space-y-2 shadow-xs">
                <span className="text-[11px] uppercase font-extrabold tracking-wider text-amber-800">
                  Consigne de rangement
                </span>
                <div className="text-2xl font-extrabold font-mono text-amber-950 flex items-center justify-center gap-2">
                  <MapPin className="w-6 h-6 text-amber-600 shrink-0" />
                  <span>Ranger : tiroir {returnResult.emplacement.tiroir}, rangée {returnResult.emplacement.rangee}</span>
                </div>
                <p className="text-xs text-amber-800 font-medium mt-1">
                  Exemplaire <strong>{returnResult.exemplaire.codeQR}</strong> remis au statut <strong>DISPONIBLE</strong>.
                </p>
              </div>

              {/* Bouton unique principal Reclasser */}
              <div className="pt-2">
                <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={handleReclasser}
                    className="w-full sm:w-auto min-h-[44px] px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition shadow-xs flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Reclasser</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleClose}
                    className="w-full sm:w-auto min-h-[44px] px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                  >
                    Fermer sans confirmation
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Step 1: Camera active scanning for copy */
            <div className="space-y-3">
              <div className="text-center">
                <p className="font-bold text-sm text-slate-800 font-serif">
                  Pointez la caméra vers le code QR du livre rendu
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  La clôture de l'emprunt et la consigne de rangement s'affichent automatiquement.
                </p>
              </div>

              <div className="relative w-full aspect-16/10 bg-slate-950 rounded-xl overflow-hidden flex items-center justify-center border border-slate-800 shadow-inner">
                <video
                  ref={videoRef}
                  className={`w-full h-full object-cover ${cameraError ? 'hidden' : 'block'}`}
                />
                <canvas ref={canvasRef} className="hidden" />

                {!cameraError && (
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <div className="w-44 h-44 border-2 border-emerald-400 rounded-xl relative animate-pulse shadow-lg shadow-emerald-500/20">
                      <div className="absolute top-0 left-0 w-3 h-3 border-t-4 border-l-4 border-emerald-500 rounded-tl" />
                      <div className="absolute top-0 right-0 w-3 h-3 border-t-4 border-r-4 border-emerald-500 rounded-tr" />
                      <div className="absolute bottom-0 left-0 w-3 h-3 border-b-4 border-l-4 border-emerald-500 rounded-bl" />
                      <div className="absolute bottom-0 right-0 w-3 h-3 border-b-4 border-r-4 border-emerald-500 rounded-br" />
                      <div className="absolute left-2 right-2 top-1/2 h-0.5 bg-emerald-400/80" />
                    </div>
                  </div>
                )}

                {cameraError && (
                  <div className="p-4 text-center text-xs text-slate-300 space-y-1">
                    <p className="font-semibold text-amber-300">Caméra inactive ou non disponible</p>
                    <p className="text-[11px] text-slate-400">Utilisez la saisie manuelle ci-dessous.</p>
                  </div>
                )}
              </div>

              {/* Manual input fallback */}
              <form onSubmit={handleManualSubmit} className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between text-[11px] text-slate-600">
                  <span className="font-bold flex items-center gap-1">
                    <Keyboard className="w-3.5 h-3.5 text-emerald-600" />
                    Secours : Saisir le code QR de l'exemplaire :
                  </span>
                  <span className="text-slate-400 font-mono">Ex: EX-1001</span>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                    placeholder="Code exemplaire (ex: EX-1001)..."
                    className="flex-1 px-3 py-1.5 text-xs font-mono rounded-lg border border-slate-200 uppercase bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                  <button
                    type="submit"
                    disabled={!manualCode.trim()}
                    className={`min-h-[44px] px-4 py-2 rounded-xl text-xs font-bold text-white ${
                      manualCode.trim() ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-slate-300'
                    }`}
                  >
                    Valider
                  </button>
                </div>
              </form>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 text-right">
          <button
            onClick={handleClose}
            className="min-h-[44px] px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 hover:bg-slate-100 transition"
          >
            Fermer
          </button>
        </div>

      </div>
    </div>
  );
};
