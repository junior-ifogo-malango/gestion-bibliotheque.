/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { LibraryProvider, useLibrary } from './context/LibraryContext';
import { Navbar } from './components/Navbar';
import { StudentCatalogView } from './components/StudentCatalogView';
import { DashboardView } from './components/DashboardView';
import { LoansView } from './components/LoansView';
import { BooksView } from './components/BooksView';
import { MembersView } from './components/MembersView';
import { HistoryView } from './components/HistoryView';
import { AlertsView } from './components/AlertsView';

// Modals
import { ManagerLoginModal } from './components/ManagerLoginModal';
import { QRScannerModal } from './components/QRScannerModal';
import { ExemplaireSheetModal } from './components/ExemplaireSheetModal';
import { PrintableQRLabelsModal } from './components/PrintableQRLabelsModal';
import { ScanLoanModal } from './components/ScanLoanModal';
import { ScanReturnModal } from './components/ScanReturnModal';
import { LoanReceiptModal } from './components/LoanReceiptModal';
import { BookDetailModal } from './components/BookDetailModal';
import { NewBookModal } from './components/NewBookModal';
import { MemberDetailModal } from './components/MemberDetailModal';
import { ImportStudentsModal } from './components/ImportStudentsModal';
import { GlobalSearchModal } from './components/GlobalSearchModal';
import { SettingsView } from './components/SettingsView';
import { HelpView } from './components/HelpView';

const MainManagerContent: React.FC = () => {
  const { activeManagerTab } = useLibrary();

  return (
    <main className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full">
      {activeManagerTab === 'dashboard' && <DashboardView />}
      {activeManagerTab === 'loans' && <LoansView />}
      {activeManagerTab === 'catalog' && <BooksView />}
      {activeManagerTab === 'students' && <MembersView />}
      {activeManagerTab === 'history' && <HistoryView />}
      {activeManagerTab === 'alerts' && <AlertsView />}
      {activeManagerTab === 'settings' && <SettingsView />}
      {activeManagerTab === 'help' && <HelpView />}
    </main>
  );
};

const RootView: React.FC = () => {
  const { 
    userRole, 
    isQRScannerOpen, 
    setIsQRScannerOpen, 
    scanQRCode,
    scannedExemplaire,
    setScannedExemplaire,
    activePrintLabelsOuvrageId,
    setActivePrintLabelsOuvrageId,
    ouvrages,
    exemplaires,
    getOuvrageById,
    isGlobalSearchOpen,
    setIsGlobalSearchOpen
  } = useLibrary();

  const activePrintOuvrage = activePrintLabelsOuvrageId ? getOuvrageById(activePrintLabelsOuvrageId) : null;
  const copiesToPrint = activePrintLabelsOuvrageId 
    ? exemplaires.filter(e => e.ouvrageId === activePrintLabelsOuvrageId && true)
    : [];

  const handleScanDetected = (scannedCode: string) => {
    setIsQRScannerOpen(false);
    const res = scanQRCode(scannedCode);
    if (!res.found) {
      alert(`Code QR "${scannedCode}" introuvable dans le système universitaire (ni exemplaire, ni carte étudiante).`);
    }
  };

  if (userRole === 'student') {
    return (
      <>
        <StudentCatalogView />
        <ManagerLoginModal />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      <Navbar />
      
      <div className="flex-1">
        <MainManagerContent />
      </div>

      {/* Global Modals */}
      <ManagerLoginModal />
      
      <QRScannerModal
        isOpen={isQRScannerOpen}
        onClose={() => setIsQRScannerOpen(false)}
        onScan={handleScanDetected}
      />

      <ExemplaireSheetModal
        exemplaire={scannedExemplaire}
        onClose={() => setScannedExemplaire(null)}
      />

      <PrintableQRLabelsModal
        isOpen={Boolean(activePrintLabelsOuvrageId)}
        onClose={() => setActivePrintLabelsOuvrageId(null)}
        ouvrage={activePrintOuvrage}
        exemplaires={copiesToPrint}
        allOuvrages={ouvrages}
      />

      <ScanLoanModal />
      <ScanReturnModal />
      <LoanReceiptModal />
      <BookDetailModal />
      <NewBookModal />
      <MemberDetailModal />
      <ImportStudentsModal />
      <GlobalSearchModal 
        isOpen={isGlobalSearchOpen} 
        onClose={() => setIsGlobalSearchOpen(false)} 
      />

      {/* Manager Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-serif font-bold text-slate-800">BiblioPrêt Universitaire</span>
            <span>— Système de prêt sur place & gestion des exemplaires physiques</span>
          </div>
          <div className="text-slate-400">
            Contrôle d'accès par QR codes • Données sauvegardées dans le navigateur (localStorage)
          </div>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <LibraryProvider>
      <RootView />
    </LibraryProvider>
  );
}
