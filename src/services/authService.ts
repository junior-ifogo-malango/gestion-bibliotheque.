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
 * - Accepte l'e-mail si son domaine est autorisé (comparaison sans tenir compte des majuscules ni des espaces).
 * - Ne vérifie plus la présence dans la liste des adhérents pour la consultation du catalogue.
 * - Domaine non autorisé : « Accès réservé aux adresses académiques @usmba.ac.ma » (ou le domaine configuré).
 * - Si l'e-mail correspond à un adhérent importé, utilise son prénom ; sinon, utilise la partie de l'e-mail avant le @.
 */
export const seConnecter = (
  rawEmail: string,
  adherents: Adherent[] = [],
  allowedDomain: string = '@usmba.ac.ma',
  _currentDate?: string
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
      error: `Accès réservé aux adresses académiques ${domain}`
    };
  }

  // Détermination du prénom :
  // Si l'e-mail correspond à un adhérent de la liste, affiche son prénom.
  // Sinon, affiche la partie de l'e-mail avant le @.
  const matched = adherents.find(
    a => a.emailAcademique.trim().toLowerCase() === cleanEmail
  );

  const localPart = cleanEmail.split('@')[0] || 'Étudiant';
  const prenomToUse = matched ? matched.prenom : localPart;
  const idToUse = matched ? matched.id : `adh_guest_${Date.now()}`;

  const connected: ConnectedStudent = {
    id: idToUse,
    prenom: prenomToUse,
    email: cleanEmail
  };

  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_STUDENT_SESSION, JSON.stringify(connected));
    }
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
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY_STUDENT_SESSION);
    }
  } catch (err) {
    console.error("Erreur de suppression de session:", err);
  }
};

/**
 * 3. Lire l'étudiant connecté : renvoie les données de session ou null
 * Les sessions déjà enregistrées dans le localStorage restent lisibles sans écran blanc.
 */
export const lireEtudiantConnecte = (): ConnectedStudent | null => {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY_STUDENT_SESSION) : null;
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.email === 'string') {
      return {
        id: typeof parsed.id === 'string' ? parsed.id : 'adh_saved',
        prenom: typeof parsed.prenom === 'string' && parsed.prenom ? parsed.prenom : parsed.email.split('@')[0],
        email: parsed.email
      };
    }
    return null;
  } catch {
    return null;
  }
};
