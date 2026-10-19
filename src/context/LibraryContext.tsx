import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { 
  Ouvrage, 
  Exemplaire, 
  Adherent, 
  Emprunt, 
  EmailNotification,
  Emplacement, 
  
  StatutExemplaire,
  BookCategory,
  UserRole
} from '../types';
import { 
  INITIAL_OUVRAGES, 
  INITIAL_EXEMPLAIRES, 
  INITIAL_ADHERENTS, 
  INITIAL_EMPRUNTS,
  INITIAL_NOTIFICATIONS
} from '../data/mockData';

export type ManagerTab = 'dashboard' | 'loans' | 'catalog' | 'students' | 'history' | 'alerts' | 'settings' | 'help';

interface LibraryContextType {
  // Role & Authentication
  userRole: UserRole;
  setUserRole: (role: UserRole) => void;
  isManagerLoginOpen: boolean;
  setIsManagerLoginOpen: (open: boolean) => void;
  loginAsManager: () => void;
  logoutManager: () => void;
  activeManagerTab: ManagerTab;
  setActiveManagerTab: (tab: ManagerTab) => void;

  // Date Simulation
  currentDate: string; // YYYY-MM-DD (simulated or real)
  allowedAcademicDomain: string;
  setAllowedAcademicDomain: (domain: string) => void;
  isSimulatedDate: boolean;
  setSimulatedDate: (date: string) => void;
  resetSimulatedDate: () => void;
  advanceOneDay: () => void;
  advanceDays: (days: number) => void;

  // Core Data
  ouvrages: Ouvrage[];
  exemplaires: Exemplaire[];
  adherents: Adherent[];
  emprunts: Emprunt[];
  notifications: EmailNotification[];

  // Dynamic Calculated Helpers (Never stored, calculated on the fly)
  getOuvrageById: (id: string) => Ouvrage | undefined;
  getExemplaireById: (id: string) => Exemplaire | undefined;
  getExemplaireByQR: (codeQR: string) => Exemplaire | undefined;
  getAdherentById: (id: string) => Adherent | undefined;
  getAdherentByNumero: (numero: string) => Adherent | undefined;
  getExemplairesByOuvrage: (ouvrageId: string) => Exemplaire[];
  getAvailableCopiesCount: (ouvrageId: string) => number;
  getTotalCopiesCount: (ouvrageId: string) => number;
  
  // Student authorization check (rule 3)
  isAdherentAutorise: (adherentId: string) => { autorise: boolean; motif?: string };
  getAdherentActiveEmprunts: (adherentId: string) => Emprunt[];
  
  // Overdue calculation (rule 3)
  isEmpruntEnRetard: (emprunt: Emprunt) => boolean;
  getJoursDeRetard: (dateRetourPrevue: string) => number;
  isEmpruntAContacter: (emprunt: Emprunt) => boolean;
  runDailyChecks: (targetDateStr?: string) => { remindersSentCount: number };

  // Configuration
  loanDurationDays: number;
  setLoanDurationDays: (days: number) => void;

  // Actions
  addOuvrage: (
    data: Omit<Ouvrage, 'id'>, 
    nbExemplaires: number, 
    emplacement: Emplacement
  ) => { ouvrage: Ouvrage; exemplaires: Exemplaire[] };
  updateOuvrage: (id: string, updates: Partial<Ouvrage>) => void;
  
  addExemplairesToOuvrage: (
    ouvrageId: string, 
    count: number, 
    emplacement: Emplacement
  ) => Exemplaire[];
  updateExemplaire: (id: string, updates: Partial<Exemplaire>) => void;
  
  // Physical life management actions
  declarerPerdu: (id: string) => { success: boolean };
  declarerRetrouve: (id: string) => { success: boolean };

  // Loans & Returns by Scan (Without typing)
  addLoan: (
    exemplaireId: string, 
    adherentId: string, 
    notes?: string
  ) => { success: boolean; error?: string; emprunt?: Emprunt };

  cancelLoan: (empruntId: string) => { success: boolean; error?: string };
  addLoanByScan: (
    exemplaireCodeOrId: string,
    studentCodeOrId: string
  ) => {
    success: boolean;
    error?: string;
    emprunt?: Emprunt;
    ouvrage?: Ouvrage;
    exemplaire?: Exemplaire;
    adherent?: Adherent;
  };
  
  returnLoan: (
    empruntId: string, 
    notes?: string
  ) => { success: boolean; exemplaire?: Exemplaire; emplacement?: Emplacement };

  markLoanReclasse: (empruntId?: string, codeQR?: string) => void;
  returnByScan: (
    exemplaireCodeOrId: string
  ) => {
    success: boolean;
    error?: string;
    hadActiveLoan: boolean;
    exemplaire?: Exemplaire;
    emplacement?: Emplacement;
    ouvrage?: Ouvrage;
    adherent?: Adherent;
    isOverdue?: boolean;
    daysLate?: number;
  };

  // QR Scanning & Lookups
  isQRScannerOpen: boolean;
  setIsQRScannerOpen: (open: boolean) => void;
  isScanReturnOpen: boolean;
  setIsScanReturnOpen: (open: boolean) => void;
  scanQRCode: (code: string) => { found: boolean; type?: 'exemplaire' | 'adherent'; item?: any };

  // Selected sheets & Modals
  scannedExemplaire: Exemplaire | null;
  setScannedExemplaire: (ex: Exemplaire | null) => void;
  selectedOuvrage: Ouvrage | null;
  setSelectedOuvrage: (ow: Ouvrage | null) => void;
  selectedAdherent: Adherent | null;
  setSelectedAdherent: (adh: Adherent | null) => void;
  activePrintLabelsOuvrageId: string | null;
  setActivePrintLabelsOuvrageId: (id: string | null) => void;
  activeReceiptEmprunt: Emprunt | null;
  setActiveReceiptEmprunt: (emp: Emprunt | null) => void;

  // New Loan Modal state
  isNewLoanOpen: boolean;
  setIsNewLoanOpen: (open: boolean) => void;
  preselectedOuvrageId?: string;
  preselectedExemplaireId?: string;
  preselectedAdherentId?: string;
  openNewLoan: (ouvrageId?: string, adherentId?: string, exemplaireId?: string) => void;

  // Other modals
  isNewOuvrageOpen: boolean;
  setIsNewOuvrageOpen: (open: boolean) => void;
  isImportStudentsOpen: boolean;
  setIsImportStudentsOpen: (open: boolean) => void;
  isGlobalSearchOpen: boolean;
  setIsGlobalSearchOpen: (open: boolean) => void;

  // Import function
  importStudentsFromCSV: (csvContent: string) => {
    success: boolean;
    errors?: string[];
    stats?: {
      created: number;
      updated: number;
      resilies: number;
      total: number;
    };
  };

  // Stats for Manager Dashboard
  stats: {
    totalOuvrages: number;
    totalExemplaires: number;
    disponiblesEnRayon: number;
    empruntsEnCours: number;
    empruntsEnRetard: number;
    empruntsAContacter: number;
    rupturesStock: number;
    adherentsActifs: number;
    notificationsTotal: number;
  };

  // Maintenance
  resetToDefaultData: () => void;
  exportDatabaseJSON: () => void;
}

const LibraryContext = createContext<LibraryContextType | undefined>(undefined);

const STORAGE_KEY_OUVRAGES = 'unilib_ouvrages_v8';
const STORAGE_KEY_EXEMPLAIRES = 'unilib_exemplaires_v8';
const STORAGE_KEY_ADHERENTS = 'unilib_adherents_v8';
const STORAGE_KEY_EMPRUNTS = 'unilib_emprunts_v8';
const STORAGE_KEY_NOTIFICATIONS = 'unilib_notifications_v8';
const STORAGE_KEY_ROLE = 'unilib_role_v8';
const STORAGE_KEY_SIM_DATE = 'unilib_sim_date_v8';

export const addDaysToDate = (baseDateStr: string, days: number): string => {
  const parts = baseDateStr.split('-');
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const date = new Date(year, month, day);
    date.setDate(date.getDate() + days);
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  const d = new Date(baseDateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
};

export const LibraryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Role
  const [userRole, setUserRole] = useState<UserRole>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_ROLE);
      return (saved as UserRole) || 'student';
    } catch {
      return 'student';
    }
  });

  const [activeManagerTab, setActiveManagerTab] = useState<ManagerTab>('dashboard');
  const [isManagerLoginOpen, setIsManagerLoginOpen] = useState(false);

  // Date Simulation
  const [simulatedDate, setSimulatedDateState] = useState<string | null>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY_SIM_DATE) || null;
    } catch {
      return null;
    }
  });

  const currentDate = simulatedDate || new Date().toISOString().split('T')[0];
  const isSimulatedDate = Boolean(simulatedDate);
  const [allowedAcademicDomain, setAllowedAcademicDomainState] = useState<string>(() => {
    try {
      return localStorage.getItem('biblio_academic_domain') || '@usmba.ac.ma';
    } catch {
      return '@usmba.ac.ma';
    }
  });

  const setAllowedAcademicDomain = (domain: string) => {
    const clean = domain.trim().toLowerCase();
    const formatted = clean.startsWith('@') ? clean : `@${clean}`;
    setAllowedAcademicDomainState(formatted);
    try {
      localStorage.setItem('biblio_academic_domain', formatted);
    } catch (err) {
      console.error('Erreur sauvegarde domaine:', err);
    }
  };

  const setSimulatedDate = (date: string) => {
    setSimulatedDateState(date);
    localStorage.setItem(STORAGE_KEY_SIM_DATE, date);
  };

  const resetSimulatedDate = () => {
    setSimulatedDateState(null);
    localStorage.removeItem(STORAGE_KEY_SIM_DATE);
  };

  // Core Data
  const [ouvrages, setOuvrages] = useState<Ouvrage[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_OUVRAGES);
      return saved ? JSON.parse(saved) : INITIAL_OUVRAGES;
    } catch {
      return INITIAL_OUVRAGES;
    }
  });

  const [exemplaires, setExemplaires] = useState<Exemplaire[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_EXEMPLAIRES);
      const list = saved ? JSON.parse(saved) : INITIAL_EXEMPLAIRES;
      return list.map((e: any) => ({
        id: e.id,
        ouvrageId: e.ouvrageId,
        codeQR: e.codeQR,
        emplacement: e.emplacement,
        statut: (e.statut === 'EN_REPARATION' || e.statut === 'DETRUIT') ? 'DISPONIBLE' : (e.statut || 'DISPONIBLE')
      }));
    } catch {
      return INITIAL_EXEMPLAIRES;
    }
  });

  const [adherents, setAdherents] = useState<Adherent[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_ADHERENTS);
      return saved ? JSON.parse(saved) : INITIAL_ADHERENTS;
    } catch {
      return INITIAL_ADHERENTS;
    }
  });

  const [emprunts, setEmprunts] = useState<Emprunt[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_EMPRUNTS);
      const list = saved ? JSON.parse(saved) : INITIAL_EMPRUNTS;
      return list.map((l: any) => {
        const { etatAuRetour, ...cleanLoan } = l;
        return cleanLoan;
      });
    } catch {
      return INITIAL_EMPRUNTS;
    }
  });


  const [notifications, setNotifications] = useState<EmailNotification[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_NOTIFICATIONS);
      return saved ? JSON.parse(saved) : INITIAL_NOTIFICATIONS;
    } catch {
      return INITIAL_NOTIFICATIONS;
    }
  });

  // Modals & Sheets
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);
  const [scannedExemplaire, setScannedExemplaire] = useState<Exemplaire | null>(null);
  const [selectedOuvrage, setSelectedOuvrage] = useState<Ouvrage | null>(null);
  const [selectedAdherent, setSelectedAdherent] = useState<Adherent | null>(null);
  const [activePrintLabelsOuvrageId, setActivePrintLabelsOuvrageId] = useState<string | null>(null);
  const [activeReceiptEmprunt, setActiveReceiptEmprunt] = useState<Emprunt | null>(null);

  const [isNewLoanOpen, setIsNewLoanOpen] = useState(false);
  const [preselectedOuvrageId, setPreselectedOuvrageId] = useState<string | undefined>();
  const [preselectedExemplaireId, setPreselectedExemplaireId] = useState<string | undefined>();
  const [preselectedAdherentId, setPreselectedAdherentId] = useState<string | undefined>();

  const [isNewOuvrageOpen, setIsNewOuvrageOpen] = useState(false);
  const [isImportStudentsOpen, setIsImportStudentsOpen] = useState(false);
  const [isScanReturnOpen, setIsScanReturnOpen] = useState(false);
  const [isGlobalSearchOpen, setIsGlobalSearchOpen] = useState(false);
  const [loanDurationDays, setLoanDurationDays] = useState<number>(15);

  // Global Ctrl+K / Cmd+K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsGlobalSearchOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Import students from CSV provided by university registration service
  const importStudentsFromCSV = (csvContent: string) => {
    if (!csvContent || !csvContent.trim()) {
      return {
        success: false,
        errors: ["Le fichier d'importation est vide."]
      };
    }

    // Normalize line endings
    const lines = csvContent
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .split('\n')
      .filter(line => line.trim().length > 0);

    if (lines.length === 0) {
      return {
        success: false,
        errors: ["Le fichier ne contient aucune ligne."]
      };
    }

    // Detect delimiter
    const headerLine = lines[0];
    let delimiter = ',';
    if (headerLine.includes(';') && (headerLine.split(';').length >= headerLine.split(',').length)) {
      delimiter = ';';
    } else if (headerLine.includes('\t')) {
      delimiter = '\t';
    }

    const parseCSVLine = (line: string): string[] => {
      const result: string[] = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"' || char === "'") {
          inQuotes = !inQuotes;
        } else if (char === delimiter && !inQuotes) {
          result.push(current.trim().replace(/^["']|["']$/g, ''));
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim().replace(/^["']|["']$/g, ''));
      return result;
    };

    const headers = parseCSVLine(headerLine).map(h => 
      h.toLowerCase()
       .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // remove accents
       .replace(/[^a-z0-9]/g, '')
    );

    // Identify required columns
    const idxNum = headers.findIndex(h => 
      h.includes('numero') || h.includes('etudiant') || h.includes('cne') || h.includes('matricule') || h === 'id'
    );
    const idxNom = headers.findIndex(h => h === 'nom' || (h.includes('nom') && !h.includes('prenom')));
    const idxPrenom = headers.findIndex(h => h.includes('prenom'));
    const idxEmail = headers.findIndex(h => h.includes('email') || h.includes('mail') || h.includes('courriel'));

    const missingColumns: string[] = [];
    if (idxNum === -1) missingColumns.push("Numéro d'étudiant");
    if (idxNom === -1) missingColumns.push("Nom");
    if (idxPrenom === -1) missingColumns.push("Prénom");
    if (idxEmail === -1) missingColumns.push("E-mail académique");

    if (missingColumns.length > 0) {
      return {
        success: false,
        errors: [
          `Fichier rejeté en entier : colonne(s) obligatoire(s) manquante(s) : ${missingColumns.join(', ')}.`,
          `En-têtes détectés : [${parseCSVLine(headerLine).join(', ')}]`,
          "Le fichier doit comporter : Numéro d'étudiant, Nom, Prénom, E-mail académique."
        ]
      };
    }

    // Validate all rows
    const errors: string[] = [];
    interface ParsedRow {
      lineNum: number;
      numeroEtudiant: string;
      nom: string;
      prenom: string;
      emailAcademique: string;
    }
    const parsedRows: ParsedRow[] = [];

    for (let i = 1; i < lines.length; i++) {
      const lineNum = i + 1;
      const row = parseCSVLine(lines[i]);
      if (row.length === 0 || (row.length === 1 && !row[0])) continue;

      const numeroEtudiant = (row[idxNum] || '').trim();
      const nom = (row[idxNom] || '').trim();
      const prenom = (row[idxPrenom] || '').trim();
      const emailAcademique = (row[idxEmail] || '').trim();

      if (!numeroEtudiant) {
        errors.push(`Ligne ${lineNum} : Le numéro d'étudiant est vide.`);
      }

      parsedRows.push({
        lineNum,
        numeroEtudiant,
        nom,
        prenom,
        emailAcademique
      });
    }

    if (errors.length > 0) {
      return {
        success: false,
        errors: [
          `Fichier rejeté en entier : ${errors.length} anomalie(s) détectée(s) :`,
          ...errors.slice(0, 10),
          ...(errors.length > 10 ? [`...et ${errors.length - 10} autre(s) erreur(s).`] : [])
        ]
      };
    }

    // Determine academic year expiration date (August 31)
    const currD = new Date(currentDate);
    const currYear = currD.getFullYear();
    const currMonth = currD.getMonth() + 1; // 1-12
    const targetEndYear = currMonth >= 9 ? currYear + 1 : currYear;
    const endOfAcademicYear = `${targetEndYear}-08-31`;

    let createdCount = 0;
    let updatedCount = 0;
    let resiliesCount = 0;

    const importedNumeros = new Set<string>();

    // Copy existing students list
    let updatedAdherents = [...adherents];

    parsedRows.forEach(row => {
      const upperNum = row.numeroEtudiant.toUpperCase();
      importedNumeros.add(upperNum);

      const existingIndex = updatedAdherents.findIndex(
        a => a.numeroEtudiant.trim().toUpperCase() === upperNum
      );

      if (existingIndex >= 0) {
        // Update existing student and renew validity
        updatedAdherents[existingIndex] = {
          ...updatedAdherents[existingIndex],
          nom: row.nom || updatedAdherents[existingIndex].nom,
          prenom: row.prenom || updatedAdherents[existingIndex].prenom,
          emailAcademique: row.emailAcademique || updatedAdherents[existingIndex].emailAcademique,
          dateExpiration: endOfAcademicYear,
          statut: 'actif'
        };
        updatedCount++;
      } else {
        // Create new student
        const newStudent: Adherent = {
          id: `adh_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          numeroEtudiant: row.numeroEtudiant,
          nom: row.nom,
          prenom: row.prenom,
          emailAcademique: row.emailAcademique,
          codeQR: row.numeroEtudiant,
          dateInscription: currentDate,
          dateExpiration: endOfAcademicYear,
          statut: 'actif'
        };
        updatedAdherents.push(newStudent);
        createdCount++;
      }
    });

    // Students absent from the new list are set to 'resilie'
    updatedAdherents = updatedAdherents.map(adh => {
      const upperNum = adh.numeroEtudiant.trim().toUpperCase();
      if (!importedNumeros.has(upperNum)) {
        if (adh.statut === 'actif') {
          resiliesCount++;
        }
        return {
          ...adh,
          statut: 'resilie'
        };
      }
      return adh;
    });

    setAdherents(updatedAdherents);

    return {
      success: true,
      stats: {
        created: createdCount,
        updated: updatedCount,
        resilies: resiliesCount,
        total: parsedRows.length
      }
    };
  };

  // Sync to LocalStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_OUVRAGES, JSON.stringify(ouvrages));
  }, [ouvrages]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_EXEMPLAIRES, JSON.stringify(exemplaires));
  }, [exemplaires]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_ADHERENTS, JSON.stringify(adherents));
  }, [adherents]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_EMPRUNTS, JSON.stringify(emprunts));
  }, [emprunts]);


  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_NOTIFICATIONS, JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_ROLE, userRole);
  }, [userRole]);

  const loginAsManager = () => {
    setUserRole('manager');
  };

  const logoutManager = () => {
    setUserRole('student');
  };

  // Lookup helpers
  const getOuvrageById = (id: string) => ouvrages.find(o => o.id === id);
  const getExemplaireById = (id: string) => exemplaires.find(e => e.id === id);
  const getExemplaireByQR = (codeQR: string) => exemplaires.find(e => e.codeQR.trim().toUpperCase() === codeQR.trim().toUpperCase());
  const getAdherentById = (id: string) => adherents.find(a => a.id === id);
  const getAdherentByNumero = (num: string) => adherents.find(a => a.numeroEtudiant.trim().toUpperCase() === num.trim().toUpperCase());

  const getExemplairesByOuvrage = (ouvrageId: string) => {
    return exemplaires.filter(e => e.ouvrageId === ouvrageId);
  };

  const getAvailableCopiesCount = (ouvrageId: string): number => {
    return exemplaires.filter(e => e.ouvrageId === ouvrageId && e.statut === 'DISPONIBLE').length;
  };

  const getTotalCopiesCount = (ouvrageId: string): number => {
    return exemplaires.filter(e => e.ouvrageId === ouvrageId).length;
  };

  const getAdherentActiveEmprunts = (adherentId: string): Emprunt[] => {
    return emprunts.filter(e => e.adherentId === adherentId && e.statut === 'en_cours' && !e.annule);
  };

  // Overdue calculations
  const isEmpruntEnRetard = (emp: Emprunt): boolean => {
    if (emp.statut !== 'en_cours' || emp.annule) return false;
    return emp.dateRetourPrevue < currentDate;
  };

  const getJoursDeRetard = (dateRetourPrevue: string): number => {
    if (dateRetourPrevue >= currentDate) return 0;
    const due = new Date(dateRetourPrevue);
    const curr = new Date(currentDate);
    const diff = Math.floor((curr.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 0;
  };

  // Après le 2e rappel sans retour, l'emprunt est « à contacter »
  const isEmpruntAContacter = (emp: Emprunt): boolean => {
    if (emp.statut !== 'en_cours' || emp.annule) return false;
    if (!isEmpruntEnRetard(emp)) return false;
    return (emp.nbRappels || 0) >= 2;
  };

  // Student authorization check (rule 3: calculé à la volée)
  const isAdherentAutorise = (adherentId: string): { autorise: boolean; motif?: string } => {
    const adherent = getAdherentById(adherentId);
    if (!adherent) return { autorise: false, motif: 'Étudiant non trouvé dans les registres' };
    
    if (adherent.statut !== 'actif') {
      return { autorise: false, motif: 'Compte étudiant résilié ou inactif' };
    }

    if (adherent.dateExpiration < currentDate) {
      return { autorise: false, motif: `Inscription universitaire expirée depuis le ${new Date(adherent.dateExpiration).toLocaleDateString('fr-FR')}` };
    }

    // Has overdue loan?
    const activeLoans = getAdherentActiveEmprunts(adherentId);
    const hasLate = activeLoans.some(l => isEmpruntEnRetard(l));
    if (hasLate) {
      return { 
        autorise: false, 
        motif: 'Blocage automatique : l\'étudiant a au moins un emprunt en retard non restitué' 
      };
    }

    return { autorise: true };
  };

  // Adding Ouvrage with multiple physical Exemplaires
  const addOuvrage = (
    data: Omit<Ouvrage, 'id'>, 
    nbExemplaires: number, 
    emplacement: Emplacement
  ) => {
    const ouvrageId = `ow_${Date.now()}`;
    const newOuvrage: Ouvrage = {
      ...data,
      id: ouvrageId
    };

    // Auto-generate QR codes for copies
    const newCopies: Exemplaire[] = [];
    const baseCodeNum = 1000 + Math.floor(Math.random() * 8000);

    for (let i = 0; i < nbExemplaires; i++) {
      const copyId = `ex_${Date.now()}_${i}`;
      newCopies.push({
        id: copyId,
        ouvrageId,
        codeQR: `EX-${baseCodeNum + i}`,
        statut: 'DISPONIBLE',
        emplacement: { ...emplacement }
      });
    }

    setOuvrages(prev => [newOuvrage, ...prev]);
    setExemplaires(prev => [...newCopies, ...prev]);

    return { ouvrage: newOuvrage, exemplaires: newCopies };
  };

  const updateOuvrage = (id: string, updates: Partial<Ouvrage>) => {
    setOuvrages(prev => prev.map(o => o.id === id ? { ...o, ...updates } : o));
    if (selectedOuvrage?.id === id) {
      setSelectedOuvrage(prev => prev ? { ...prev, ...updates } : null);
    }
  };

  const addExemplairesToOuvrage = (
    ouvrageId: string, 
    count: number, 
    emplacement: Emplacement
  ) => {
    const newCopies: Exemplaire[] = [];
    const baseCodeNum = 1000 + Math.floor(Math.random() * 8000);

    for (let i = 0; i < count; i++) {
      newCopies.push({
        id: `ex_${Date.now()}_${i}`,
        ouvrageId,
        codeQR: `EX-${baseCodeNum + i}`,
        statut: 'DISPONIBLE',
        emplacement: { ...emplacement }
      });
    }

    setExemplaires(prev => [...newCopies, ...prev]);
    return newCopies;
  };

  const updateExemplaire = (id: string, updates: Partial<Exemplaire>) => {
    setExemplaires(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));
    if (scannedExemplaire?.id === id) {
      setScannedExemplaire(prev => prev ? { ...prev, ...updates } : null);
    }
  };

  // Seules actions physiques : declarerPerdu et declarerRetrouve
  // 3. Perdu : statut PERDU, réversible vers DISPONIBLE si retrouvé
  const declarerPerdu = (id: string): { success: boolean } => {
    const ex = getExemplaireById(id);
    if (!ex) return { success: false };
    updateExemplaire(id, {
      statut: 'PERDU'
    });
    return { success: true };
  };

  // 4. Retrouvé : réversible vers DISPONIBLE sans notification
  const declarerRetrouve = (id: string): { success: boolean } => {
    const ex = getExemplaireById(id);
    if (!ex) return { success: false };

    updateExemplaire(ex.id, {
      statut: 'DISPONIBLE',
    });
    return { success: true };
  };

  // Loans
  const addLoan = (
    exemplaireId: string, 
    adherentId: string, 
    notes?: string
  ): { success: boolean; error?: string; emprunt?: Emprunt } => {
    const ex = getExemplaireById(exemplaireId);
    if (!ex) return { success: false, error: "Exemplaire introuvable" };
    if (ex.statut !== 'DISPONIBLE') {
      return { success: false, error: `Cet exemplaire n'est pas disponible (statut actuel : ${ex.statut})` };
    }

    const ow = getOuvrageById(ex.ouvrageId);
    if (!ow) return { success: false, error: "Ouvrage référencé introuvable" };
    if (!ow.empruntable) {
      return { success: false, error: "Cet ouvrage est réservé à la consultation sur place uniquement." };
    }

    const auth = isAdherentAutorise(adherentId);
    if (!auth.autorise) {
      return { success: false, error: auth.motif || "Étudiant non autorisé à emprunter" };
    }

    // Default university loan duration: loanDurationDays (15 days by default)
    const due = new Date(currentDate);
    due.setDate(due.getDate() + loanDurationDays);
    const dateRetourPrevue = due.toISOString().split('T')[0];

    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const newEmprunt: Emprunt = {
      id: `emp_${Date.now()}`,
      loanNumber: `PRT-${new Date(currentDate).getFullYear()}-${randomNum}`,
      adherentId,
      exemplaireId,
      ouvrageId: ow.id,
      dateEmprunt: currentDate,
      dateRetourPrevue,
      nbRappels: 0,
      statut: 'en_cours',
      notes
    };

    // Update exemplaire statut to EMPRUNTE
    updateExemplaire(exemplaireId, { statut: 'EMPRUNTE' });
    setEmprunts(prev => [newEmprunt, ...prev]);

    return { success: true, emprunt: newEmprunt };
  };

  // Return Loan
  const returnLoan = (
    empruntId: string, 
    notes?: string
  ) => {
    const emp = emprunts.find(e => e.id === empruntId);
    if (!emp || emp.statut !== 'en_cours') {
      return { success: false };
    }

    const ex = getExemplaireById(emp.exemplaireId);

    // Update emprunt
    setEmprunts(prev => prev.map(e => e.id === empruntId ? {
      ...e,
      statut: 'rendu',
      dateRetourEffective: currentDate,
      notes: notes ? (e.notes ? `${e.notes} | ${notes}` : notes) : e.notes
    } : e));

    // Update exemplaire to DISPONIBLE
    if (ex) {
      updateExemplaire(ex.id, {
        statut: 'DISPONIBLE'
      });
      return { success: true, exemplaire: ex, emplacement: ex.emplacement };
    }

    return { success: true };
  };

  // Annuler un emprunt (erreur de scan)
  const cancelLoan = (empruntId: string): { success: boolean; error?: string } => {
    const target = emprunts.find(e => e.id === empruntId);
    if (!target) {
      return { success: false, error: "Emprunt introuvable." };
    }
    const cancelNote = "Emprunt annulé";
    setEmprunts(prev => prev.map(e => e.id === empruntId ? {
      ...e,
      annule: true,
      notes: e.notes ? (e.notes + " | " + cancelNote) : cancelNote
    } : e));

    // Remettre l'exemplaire au statut DISPONIBLE
    updateExemplaire(target.exemplaireId, { statut: 'DISPONIBLE' });

    return { success: true };
  };

  // Automated Loan by Dual QR Scan
  const addLoanByScan = (
    exemplaireCodeOrId: string,
    studentCodeOrId: string
  ) => {
    // 1. Resolve Exemplaire
    const cleanExCode = exemplaireCodeOrId.trim().toUpperCase();
    const ex = exemplaires.find(e => e.codeQR.trim().toUpperCase() === cleanExCode || e.id === exemplaireCodeOrId);
    if (!ex) {
      return { success: false, error: `Exemplaire introuvable avec le code QR "${exemplaireCodeOrId}".` };
    }

    const ow = getOuvrageById(ex.ouvrageId);
    if (!ow) {
      return { success: false, error: "Ouvrage référencé introuvable." };
    }

    // Rule 1: L'ouvrage est empruntable
    if (!ow.empruntable) {
      return { 
        success: false, 
        error: `Refus d'emprunt : L'ouvrage "${ow.titre}" est réservé à la consultation sur place uniquement.` 
      };
    }

    // 2. Resolve Student
    const cleanStudCode = studentCodeOrId.trim().toUpperCase();
    const student = adherents.find(a => 
      a.codeQR.trim().toUpperCase() === cleanStudCode || 
      a.numeroEtudiant.trim().toUpperCase() === cleanStudCode || 
      a.id === studentCodeOrId
    );
    if (!student) {
      return { success: false, error: `Étudiant introuvable avec le numéro/carte "${studentCodeOrId}".` };
    }

    // Rule 2: L'exemplaire doit être DISPONIBLE
    if (ex.statut !== 'DISPONIBLE') {
      return { 
        success: false, 
        error: `Refus d'emprunt : Cet exemplaire n'est pas disponible pour le prêt (statut actuel : ${ex.statut}).` 
      };
    }

    // Rule 3: L'adhérent est actif avec un abonnement valide
    if (student.statut !== 'actif') {
      return { success: false, error: "Refus d'emprunt : L'inscription de cet étudiant est résiliée." };
    }

    if (student.dateExpiration < currentDate) {
      return { 
        success: false, 
        error: `Refus d'emprunt : Inscription universitaire expirée depuis le ${new Date(student.dateExpiration).toLocaleDateString('fr-FR')}.` 
      };
    }

    // Rule 4: L'adhérent n'a aucun emprunt en retard (calculé dynamiquement à la volée)
    const activeStudentLoans = getAdherentActiveEmprunts(student.id);
    const lateLoan = activeStudentLoans.find(l => isEmpruntEnRetard(l));
    if (lateLoan) {
      const days = getJoursDeRetard(lateLoan.dateRetourPrevue);
      return { 
        success: false, 
        error: `Refus d'emprunt : Blocage automatique pour retard. L'étudiant a un emprunt en dépassement (+${days} jour(s)) non restitué.` 
      };
    }

    // All rules passed: create loan
    const due = new Date(currentDate);
    due.setDate(due.getDate() + loanDurationDays);
    const dateRetourPrevue = due.toISOString().split('T')[0];

    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const newEmprunt: Emprunt = {
      id: `emp_${Date.now()}`,
      loanNumber: `PRT-${new Date(currentDate).getFullYear()}-${randomNum}`,
      adherentId: student.id,
      exemplaireId: ex.id,
      ouvrageId: ow.id,
      dateEmprunt: currentDate,
      dateRetourPrevue,
      nbRappels: 0,
      statut: 'en_cours'
    };

    // Update copy status
    updateExemplaire(ex.id, { statut: 'EMPRUNTE' });
    setEmprunts(prev => [newEmprunt, ...prev]);

    return {
      success: true,
      emprunt: newEmprunt,
      ouvrage: ow,
      exemplaire: ex,
      adherent: student
    };
  };

  const sendNotificationEmail = (data: Omit<EmailNotification, 'id'>) => {
    const newNotif: EmailNotification = {
      ...data,
      id: `notif_${Date.now()}_${Math.floor(Math.random() * 1000)}`
    };
    setNotifications(prev => [newNotif, ...prev]);
    return newNotif;
  };


  // Automatic verification of overdue loan reminders
  // 1er rappel 2 jours après dateRetourPrevue ; 2e rappel 2 jours après le premier (J+4)
  const checkOverdueReminders = (targetDateStr?: string): { remindersCount: number } => {
    const effectiveDate = targetDateStr || currentDate;
    const newReminders: EmailNotification[] = [];
    const updatedEmpruntsMap = new Map<string, { nbRappels: number; dateDernierRappel: string }>();

    for (const emp of emprunts) {
      if (emp.statut !== 'en_cours' || emp.annule) continue;
      if (emp.dateRetourPrevue >= effectiveDate) continue; // Not overdue

      const daysLate = Math.floor(
        (new Date(effectiveDate).getTime() - new Date(emp.dateRetourPrevue).getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysLate <= 0) continue;

      const nbRappels = emp.nbRappels || 0;
      const adh = getAdherentById(emp.adherentId);
      const ow = getOuvrageById(emp.ouvrageId);
      const ex = getExemplaireById(emp.exemplaireId);
      if (!adh || !ow) continue;

      const datePrevueFr = new Date(emp.dateRetourPrevue).toLocaleDateString('fr-FR');

      // Rule: 1er rappel 2 jours après dateRetourPrevue (daysLate >= 2)
      if (nbRappels === 0 && daysLate >= 2) {
        newReminders.push({
          id: `notif_rap1_${emp.id}_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
          destinataireEmail: adh.emailAcademique,
          destinataireNom: `${adh.prenom} ${adh.nom}`,
          destinataireNumero: adh.numeroEtudiant,
          sujet: `1er Rappel de retard : ${ow.titre}`,
          corps: `Bonjour ${adh.prenom},\n\nSauf erreur de notre part, l'emprunt de l'ouvrage "${ow.titre}" (Cote : ${ow.cote}, Exemplaire : ${ex?.codeQR || ''}) souscrit sous votre compte étudiant (${adh.numeroEtudiant}) est arrivé à échéance le ${datePrevueFr}.\n\nNombre de jours de retard constatés : ${daysLate} jour(s).\n\nConformément au règlement universitaire, tout retard non régularisé entraîne le blocage immédiat de vos nouveaux emprunts au guichet. Merci de rapporter cet exemplaire dans les meilleurs délais.\n\nCordialement,\nLe Service des Prêts Universitaire`,
          dateEnvoi: effectiveDate,
          heureEnvoi: '08:30',
          type: 'RAPPEL_RETARD_1',
          ouvrageId: ow.id,
          ouvrageTitre: ow.titre,
          exemplaireId: ex?.id,
          exemplaireCode: ex?.codeQR,
          adherentId: adh.id
        });

        updatedEmpruntsMap.set(emp.id, {
          nbRappels: 1,
          dateDernierRappel: effectiveDate
        });
      }
      // Rule: 2e rappel 2 jours après le premier rappel (daysLate >= 4)
      else if (nbRappels === 1 && daysLate >= 4) {
        newReminders.push({
          id: `notif_rap2_${emp.id}_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
          destinataireEmail: adh.emailAcademique,
          destinataireNom: `${adh.prenom} ${adh.nom}`,
          destinataireNumero: adh.numeroEtudiant,
          sujet: `2e et Dernier Rappel de retard : ${ow.titre}`,
          corps: `Bonjour ${adh.prenom},\n\nCeci est le second rappel concernant le retard de restitution de l'ouvrage "${ow.titre}" (Cote : ${ow.cote}, Exemplaire : ${ex?.codeQR || ''}), dont la date prévue de retour était le ${datePrevueFr}.\n\nNombre de jours de retard : ${daysLate} jour(s).\n\nSans restitution immédiate, votre dossier sera transmis pour contact direct (« À contacter ») et vos droits d'emprunt demeurent entièrement suspendus.\n\nCordialement,\nLe Service des Prêts Universitaire`,
          dateEnvoi: effectiveDate,
          heureEnvoi: '08:30',
          type: 'RAPPEL_RETARD_2',
          ouvrageId: ow.id,
          ouvrageTitre: ow.titre,
          exemplaireId: ex?.id,
          exemplaireCode: ex?.codeQR,
          adherentId: adh.id
        });

        updatedEmpruntsMap.set(emp.id, {
          nbRappels: 2,
          dateDernierRappel: effectiveDate
        });
      }
    }

    if (updatedEmpruntsMap.size > 0) {
      setEmprunts(prev => prev.map(e => {
        const update = updatedEmpruntsMap.get(e.id);
        if (update) {
          return {
            ...e,
            nbRappels: update.nbRappels,
            dateDernierRappel: update.dateDernierRappel
          };
        }
        return e;
      }));
    }

    if (newReminders.length > 0) {
      setNotifications(prev => [...newReminders, ...prev]);
    }

    return { remindersCount: newReminders.length };
  };

  // Automated daily check (Contrôle automatique lancé à l'ouverture et au moins 1x par jour)
  // Il traite les rappels de retard.
  const runDailyChecks = (targetDateStr?: string): { remindersSentCount: number } => {
    const effectiveDate = targetDateStr || currentDate;
    const { remindersCount } = checkOverdueReminders(effectiveDate);
    return {
      remindersSentCount: remindersCount
    };
  };

  const advanceOneDay = () => {
    const nextDate = addDaysToDate(currentDate, 1);
    setSimulatedDate(nextDate);
    runDailyChecks(nextDate);
  };

  const advanceDays = (days: number) => {
    const nextDate = addDaysToDate(currentDate, days);
    setSimulatedDate(nextDate);
    runDailyChecks(nextDate);
  };

  useEffect(() => {
    // Run automated daily check at startup and whenever date changes
    runDailyChecks(currentDate);
  }, [currentDate]);

  // Confirmation rangement en rayon (« Reclasser ») : sans effet sur les statuts
  const markLoanReclasse = (empruntId?: string, codeQR?: string) => {
    if (empruntId) {
      setEmprunts(prev => prev.map(e => e.id === empruntId ? { ...e, reclasse: true } : e));
    } else if (codeQR) {
      // Pour un livre lu sur place (sans emprunt en cours) ou identifié par QR
      const ex = exemplaires.find(e => e.codeQR.trim().toUpperCase() === codeQR.trim().toUpperCase());
      if (ex) {
        // Recherche du dernier emprunt éventuel
        const lastLoan = emprunts.find(e => e.exemplaireId === ex.id);
        if (lastLoan) {
          setEmprunts(prev => prev.map(e => e.id === lastLoan.id ? { ...e, reclasse: true } : e));
        }
      }
    }
  };

  // Automated Return by Scan : aucun choix d'état, exemplaire repasse à DISPONIBLE
  const returnByScan = (
    exemplaireCodeOrId: string
  ) => {
    const cleanCode = exemplaireCodeOrId.trim().toUpperCase();
    const ex = exemplaires.find(e => e.codeQR.trim().toUpperCase() === cleanCode || e.id === exemplaireCodeOrId);
    
    if (!ex) {
      return { 
        success: false, 
        error: `Exemplaire introuvable avec le code QR "${exemplaireCodeOrId}".`, 
        hadActiveLoan: false 
      };
    }

    const ow = getOuvrageById(ex.ouvrageId);

    // Look for active loan
    const activeLoan = emprunts.find(e => e.exemplaireId === ex.id && e.statut === 'en_cours');
    let student: Adherent | undefined;
    let isOverdue = false;
    let daysLate = 0;

    if (activeLoan) {
      student = getAdherentById(activeLoan.adherentId);
      isOverdue = isEmpruntEnRetard(activeLoan);
      daysLate = isOverdue ? getJoursDeRetard(activeLoan.dateRetourPrevue) : 0;

      // Close the loan
      setEmprunts(prev => prev.map(e => e.id === activeLoan.id ? {
        ...e,
        statut: 'rendu',
        dateRetourEffective: currentDate
      } : e));
    }

    // Physical copy goes back to DISPONIBLE
    updateExemplaire(ex.id, {
      statut: 'DISPONIBLE'
    });
    const updatedEx: Exemplaire = {
      ...ex,
      statut: 'DISPONIBLE'
    };

    return {
      success: true,
      hadActiveLoan: Boolean(activeLoan),
      exemplaire: updatedEx,
      emplacement: ex.emplacement,
      ouvrage: ow,
      adherent: student,
      isOverdue,
      daysLate
    };
  };

  // QR Scanning Router
  const scanQRCode = (code: string): { found: boolean; type?: 'exemplaire' | 'adherent'; item?: any } => {
    const trimmed = code.trim().toUpperCase();

    // Check if it's an Exemplaire QR
    const matchedEx = exemplaires.find(e => e.codeQR.trim().toUpperCase() === trimmed);
    if (matchedEx) {
      setScannedExemplaire(matchedEx);
      return { found: true, type: 'exemplaire', item: matchedEx };
    }

    // Check if it's an Adherent QR or Numero Etudiant
    const matchedAdh = adherents.find(a => 
      a.codeQR.trim().toUpperCase() === trimmed || 
      a.numeroEtudiant.trim().toUpperCase() === trimmed
    );
    if (matchedAdh) {
      setSelectedAdherent(matchedAdh);
      return { found: true, type: 'adherent', item: matchedAdh };
    }

    return { found: false };
  };

  const openNewLoan = (ouvrageId?: string, adherentId?: string, exemplaireId?: string) => {
    setPreselectedOuvrageId(ouvrageId);
    setPreselectedAdherentId(adherentId);
    setPreselectedExemplaireId(exemplaireId);
    setIsNewLoanOpen(true);
  };

  // Stats for manager dashboard
  const stats = useMemo(() => {
    const totalOuvrages = ouvrages.length;
    const totalExemplaires = exemplaires.length;
    const disponiblesEnRayon = exemplaires.filter(e => e.statut === 'DISPONIBLE').length;
    const empruntsEnCours = emprunts.filter(e => e.statut === 'en_cours' && !e.annule).length;
    const empruntsEnRetard = emprunts.filter(e => isEmpruntEnRetard(e)).length;
    const empruntsAContacter = emprunts.filter(e => isEmpruntAContacter(e)).length;
    const rupturesStock = ouvrages.filter(ow => {
      if (!ow.empruntable) return false;
      const copies = exemplaires.filter(e => e.ouvrageId === ow.id);
      const avail = copies.filter(e => e.statut === 'DISPONIBLE').length;
      return avail === 0;
    }).length;
    const adherentsActifs = adherents.filter(a => a.statut === 'actif').length;
    const notificationsTotal = notifications.length;

    return {
      totalOuvrages,
      totalExemplaires,
      disponiblesEnRayon,
      empruntsEnCours,
      empruntsEnRetard,
      empruntsAContacter,
      rupturesStock,
      adherentsActifs,
      notificationsTotal
    };
  }, [ouvrages, exemplaires, emprunts, adherents, notifications, currentDate]);

  const resetToDefaultData = () => {
    if (window.confirm("Réinitialiser toutes les données aux valeurs de démonstration universitaires ?")) {
      localStorage.removeItem(STORAGE_KEY_OUVRAGES);
      localStorage.removeItem(STORAGE_KEY_EXEMPLAIRES);
      localStorage.removeItem(STORAGE_KEY_ADHERENTS);
      localStorage.removeItem(STORAGE_KEY_EMPRUNTS);
      localStorage.removeItem(STORAGE_KEY_NOTIFICATIONS);
      localStorage.removeItem(STORAGE_KEY_SIM_DATE);
      setOuvrages(INITIAL_OUVRAGES);
      setExemplaires(INITIAL_EXEMPLAIRES);
      setAdherents(INITIAL_ADHERENTS);
      setEmprunts(INITIAL_EMPRUNTS);
      setNotifications(INITIAL_NOTIFICATIONS);
      setSimulatedDateState(null);
    }
  };

  const exportDatabaseJSON = () => {
    const backup = {
      exportedAt: new Date().toISOString(),
      simulatedDate: currentDate,
      ouvrages,
      exemplaires,
      adherents,
      emprunts,
      notifications
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bibliopret-univ-sauvegarde-${currentDate}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <LibraryContext.Provider
      value={{
        userRole,
        setUserRole,
        isManagerLoginOpen,
        setIsManagerLoginOpen,
        loginAsManager,
        logoutManager,
        activeManagerTab,
        setActiveManagerTab,
        currentDate,
        allowedAcademicDomain,
        setAllowedAcademicDomain,
        isSimulatedDate,
        setSimulatedDate,
        resetSimulatedDate,
        advanceOneDay,
        advanceDays,
        ouvrages,
        exemplaires,
        adherents,
        emprunts,
        notifications,
        getOuvrageById,
        getExemplaireById,
        getExemplaireByQR,
        getAdherentById,
        getAdherentByNumero,
        getExemplairesByOuvrage,
        getAvailableCopiesCount,
        getTotalCopiesCount,
        isAdherentAutorise,
        getAdherentActiveEmprunts,
        isEmpruntEnRetard,
        getJoursDeRetard,
        isEmpruntAContacter,
        runDailyChecks,
        loanDurationDays,
        setLoanDurationDays,
        addOuvrage,
        updateOuvrage,
        addExemplairesToOuvrage,
        updateExemplaire,
        declarerPerdu,
        declarerRetrouve,
        addLoan,
        cancelLoan,
        addLoanByScan,
        returnLoan,
        markLoanReclasse,
        returnByScan,
        isQRScannerOpen,
        setIsQRScannerOpen,
        isScanReturnOpen,
        setIsScanReturnOpen,
        scanQRCode,
        scannedExemplaire,
        setScannedExemplaire,
        selectedOuvrage,
        setSelectedOuvrage,
        selectedAdherent,
        setSelectedAdherent,
        activePrintLabelsOuvrageId,
        setActivePrintLabelsOuvrageId,
        activeReceiptEmprunt,
        setActiveReceiptEmprunt,
        isNewLoanOpen,
        setIsNewLoanOpen,
        preselectedOuvrageId,
        preselectedExemplaireId,
        preselectedAdherentId,
        openNewLoan,
        isNewOuvrageOpen,
        setIsNewOuvrageOpen,
        isImportStudentsOpen,
        setIsImportStudentsOpen,
        isGlobalSearchOpen,
        setIsGlobalSearchOpen,
        importStudentsFromCSV,
        stats,
        resetToDefaultData,
        exportDatabaseJSON
      }}
    >
      {children}
    </LibraryContext.Provider>
  );
};

export const useLibrary = (): LibraryContextType => {
  const context = useContext(LibraryContext);
  if (!context) throw new Error('useLibrary must be used within LibraryProvider');
  return context;
};
