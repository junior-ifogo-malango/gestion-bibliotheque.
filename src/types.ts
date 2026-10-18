export type BookCategory = 
  | 'Informatique & Numérique'
  | 'Sciences & Techniques'
  | 'Mathématiques & Physique'
  | 'Histoire & Géographie'
  | 'Économie & Gestion'
  | 'Droit & Sciences Politiques'
  | 'Philosophie & Éthique'
  | 'Langues & Littérature'
  | 'Médecine & Santé'
  | 'Général & Référence';

export interface Emplacement {
  tiroir: string;
  rangee: string;
}

export type StatutExemplaire = 
  | 'DISPONIBLE' 
  | 'EMPRUNTE' 
  | 'PERDU';


export interface Exemplaire {
  id: string;
  ouvrageId: string;
  codeQR: string; // Ex: "EX-1001"
  statut: StatutExemplaire;
  emplacement: Emplacement;
}

export interface Ouvrage {
  id: string;
  titre: string;
  auteur: string;
  isbn: string;
  editeur: string;
  anneeEdition: number;
  categorie: BookCategory;
  cote: string; // Ex: "INFO-042"
  pagination: number;
  resume: string;
  empruntable: boolean; // faux pour consultation sur place uniquement
  coverGradient?: string;
  coverUrl?: string;
  sommaire?: string;
}

export type StatutAdherent = 'actif' | 'resilie';

export interface Adherent {
  id: string;
  numeroEtudiant: string; // Clé unique
  nom: string;
  prenom: string;
  emailAcademique: string;
  codeQR: string; // Égal au numeroEtudiant
  dateInscription: string;
  dateExpiration: string; // Fin de l'année universitaire (ex: YYYY-08-31)
  statut: StatutAdherent;
  notes?: string;
}

export type StatutEmprunt = 'en_cours' | 'rendu' | 'perdu';

export interface Emprunt {
  id: string;
  loanNumber: string; // Ex: "PRT-2026-0045"
  adherentId: string;
  exemplaireId: string;
  ouvrageId: string;
  dateEmprunt: string; // YYYY-MM-DD
  dateRetourPrevue: string; // YYYY-MM-DD
  dateRetourEffective?: string; // YYYY-MM-DD
  nbRappels: number;
  dateDernierRappel?: string;
  annule?: boolean; // vrai si annulé suite à une erreur de scan (jamais supprimé)
  statut: StatutEmprunt;
  reclasse?: boolean; // vrai si confirmé rangé en rayon par le gestionnaire
  notes?: string;
}


export type TypeNotification = 'RAPPEL_RETARD_1' | 'RAPPEL_RETARD_2';

export interface EmailNotification {
  id: string;
  destinataireEmail: string;
  destinataireNom: string;
  destinataireNumero: string;
  sujet: string;
  corps: string;
  dateEnvoi: string; // YYYY-MM-DD
  heureEnvoi?: string;
  type: TypeNotification;
  ouvrageId: string;
  ouvrageTitre: string;
  exemplaireId?: string;
  exemplaireCode?: string;
  emplacement?: Emplacement;
  adherentId: string;
}

export type UserRole = 'manager' | 'student';
