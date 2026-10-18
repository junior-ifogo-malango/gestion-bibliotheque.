# Mini-bibliothèque universitaire

## CONTEXTE
- Seuls les étudiants inscrits à l'université ont accès et peuvent emprunter.
- Livres physiques. Les emprunts se font uniquement sur place, au guichet, par scan QR : d'abord l'exemplaire, puis la carte étudiante.
- AUCUNE réservation, AUCUNE file ni liste d'attente.
- Priorité : le gestionnaire saisit le moins possible.

## RÔLES
- Gestionnaire : connexion simple, un seul compte.
- Étudiant :
  - Catalogue étudiant : la grille montre pour chaque ouvrage seulement la page de couverture et, en dessous, « Tiroir X · Rangée Y » (plus « Indisponible » en gris si aucun exemplaire n'est disponible). Auteur, éditeur, année, catégorie, résumé, sommaire, « Disponible » et « Consultation sur place uniquement » apparaissent uniquement dans le pop-up au clic. Recherche par mots-clés, filtres, tri et pagination (12 par page) inchangés. Cette règle remplace toute description antérieure de l'affichage étudiant.

## DONNÉES
- Ouvrage : isbn, titre, auteur, editeur, anneeEdition, categorie, cote, resume, coverUrl, sommaire, empruntable (faux = consultation sur place uniquement).
- Exemplaire : codeQR unique, emplacement (tiroir, rangée), statut DISPONIBLE | EMPRUNTE | PERDU.
- Adhérent : numeroEtudiant unique, nom, prenom, emailAcademique, codeQR, dateExpiration (fin de l'année universitaire), statut actif ou résilié. Pas de téléphone.
- Emprunt : adherent, exemplaire, dateEmprunt, dateRetourPrevue, dateRetourEffective, nbRappels, dateDernierRappel.

## RÈGLES MÉTIER
1. Adhérents : créés uniquement par import d'un fichier (numéro d'étudiant, nom, prénom, e-mail académique), jamais à la main. Le numéro d'étudiant est la clé : existant = mise à jour, sinon création. Absent de la nouvelle liste = résilié. La liste est fiable : aucun contrôle des e-mails. Fichier rejeté seulement si une colonne manque ou si un numéro d'étudiant est vide.
2. Emprunt (deux scans) refusé, avec le motif affiché, si : l'exemplaire n'est pas DISPONIBLE, l'ouvrage n'est pas empruntable, l'adhérent a un emprunt en retard, ou l'adhérent est résilié ou son abonnement expiré. Sinon : dateRetourPrevue = dateEmprunt + 15 jours, exemplaire EMPRUNTE. Sans prolongation, sans quota. Le premier qui présente l'exemplaire l'emprunte. Un emprunt peut être annulé dès le scan de l'exemplaire, avant ou juste après son enregistrement (erreur de scan) : il est marqué annulé, jamais supprimé ; l'exemplaire reste ou redevient DISPONIBLE ; un emprunt annulé n'entre dans aucun calcul de retard ni de rappel.
3. Retour (un scan de l'exemplaire) : toujours possible, même si l'adhérent est en retard ou résilié. Le retour n'a aucun choix d'état : scan de l'exemplaire, clôture de l'emprunt, exemplaire DISPONIBLE, puis « Ranger : tiroir X, rangée Y » et « Reclasser ». Aucune notification au retour. Sans emprunt en cours (lecture sur place), afficher seulement l'emplacement avec « Reclasser ».
4. Aucun dommage n'est géré. Seules actions : perdu (PERDU) et retrouvé (DISPONIBLE).
5. Retard : calculé, jamais stocké. Un adhérent en retard est bloqué pour tout nouvel emprunt jusqu'au retour du livre. Seules notifications de l'application : 2 rappels e-mail à l'e-mail académique, le 1er à J+2 après dateRetourPrevue, le 2e 2 jours après le premier. Après le 2e rappel sans retour : « à contacter » (le gestionnaire contacte hors application). Aucune amende.
6. Jamais de suppression : uniquement des statuts. Valeurs calculables jamais stockées (retard, disponibilité, adhérent autorisé à emprunter). Notifications simulées dans un journal. Date du jour simulable dans Réglages. Interface en français.
