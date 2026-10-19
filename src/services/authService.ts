/**
 * Service d'authentification pour l'espace étudiant (Google Académique)
 * Conçu pour être remplacé par un véritable fournisseur Google OAuth
 * sans changer le reste de l'application.
 */

import { Adherent } from '../types';

export interface ConnectedStudent {
  id: string;
  prenom: string;
  email: string;
}

export interface AuthResult {
  success: boolean;
  error?: string;
  student?: ConnectedStudent;
}

const STORAGE_KEY_STUDENT_SESSION = 'biblio_student_session';

/**
 * Normalise un domaine e-mail : supprime les espaces et garantit le préfixe '@'
 */
export const normalizeDomain = (domain: string): string => {
  const clean = domain.trim().toLowerCase();
  return clean.startsWith('@') ? clean : `@${clean}`;
};

/**
 * 1. Se connecter avec l'adresse e-mail académique
 * - Sans tenir compte des majuscules ni des espaces
 * - Domaine autorisé modifiable (ex: @usmba.ac.ma) : un e-mail d'un autre domaine est rejeté immédiatement
 * - Contrôle de la liste des adhérents :
 *   • e-mail inconnu : « Accès réservé aux étudiants inscrits à l'EST »
 *   • adhérent résilié ou abonnement expiré : « Votre inscription n'est plus active »
 *   • adhérent actif : accès accordé (seul le prénom et l'id sont mémorisés dans la session)
 */
export const seConnecter = (
  rawEmail: string,
  adherents: Adherent[],
  allowedDomain: string = '@usmba.ac.ma',
  currentDate?: string
): AuthResult => {
  const cleanEmail = rawEmail.trim().toLowerCase();
  const domain = normalizeDomain(allowedDomain);

  if (!cleanEmail) {
    return {
      success: false,
      error: "Veuillez saisir votre adresse e-mail académique."
    };
  }

  // Contrôle du domaine autorisé
  if (!cleanEmail.endsWith(domain)) {
    return {
      success: false,
      error: `Adresse non autorisée : veuillez utiliser votre compte académique (${domain}).`
    };
  }

  // Recherche dans la liste officielle des adhérents
  const matched = adherents.find(
    a => a.emailAcademique.trim().toLowerCase() === cleanEmail
  );

  if (!matched) {
    return {
      success: false,
      error: "Accès réservé aux étudiants inscrits à l'EST"
    };
  }

  // Vérification de validité de l'inscription
  const now = currentDate || new Date().toISOString().split('T')[0];
  const isExpired = matched.dateExpiration && matched.dateExpiration < now;

  if (matched.statut !== 'actif' || isExpired) {
    return {
      success: false,
      error: "Votre inscription n'est plus active"
    };
  }

  // Connexion accordée : stockage du prénom et de l'id
  const connected: ConnectedStudent = {
    id: matched.id,
    prenom: matched.prenom,
    email: cleanEmail
  };

  try {
    if (typeof localStorage !== 'undefined') { localStorage.setItem(STORAGE_KEY_STUDENT_SESSION, JSON.stringify(connected)); }
  } catch (err) {
    console.error("Erreur de sauvegarde de session:", err);
  }

  return {
    success: true,
    student: connected
  };
};

/**
 * 2. Se déconnecter : supprime la session active
 */
export const seDeconnecter = (): void => {
  try {
    if (typeof localStorage !== 'undefined') { localStorage.removeItem(STORAGE_KEY_STUDENT_SESSION); }
  } catch (err) {
    console.error("Erreur de suppression de session:", err);
  }
};

/**
 * 3. Lire l'étudiant connecté : renvoie les données de session ou null
 */
export const lireEtudiantConnecte = (): ConnectedStudent | null => {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY_STUDENT_SESSION) : null;
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.prenom === 'string' && typeof parsed.id === 'string') {
      return parsed as ConnectedStudent;
    }
    return null;
  } catch {
    return null;
  }
};
