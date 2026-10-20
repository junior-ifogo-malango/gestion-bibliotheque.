# Mini-bibliothèque universitaire

## CONTEXTE
- Seuls les étudiants inscrits à l'université ont accès et peuvent emprunter.
- Livres physiques. Les emprunts se font uniquement sur place, au guichet, par scan QR : d'abord l'exemplaire, puis la carte étudiante.
- AUCUNE réservation, AUCUNE file ni liste d'attente.
- Priorité : le gestionnaire saisit le moins possible.

## RÔLES
- Gestionnaire : connexion simple, un seul compte.
- Étudiant : accède à l'application avec son compte Google académique (aucun mot de passe géré par l'application), puis consulte le catalogue en lecture seule. L'accès à la consultation est autorisé à toute adresse e-mail dont le domaine correspond au domaine autorisé (@usmba.ac.ma, configurable dans Réglages du gestionnaire). L'appartenance à la liste importée n'est pas exigée pour consulter.

## DONNÉES
- Ouvrage : isbn, titre, auteur, editeur, anneeEdition, categorie, cote, resume, coverUrl, sommaire, empruntable (faux = consultation sur place uniquement).
- Exemplaire : codeQR unique, emplacement (tiroir, rangée), statut DISPONIBLE | EMPRUNTE | PERDU.
- Adhérent : numeroEtudiant unique, nom, prenom, emailAcademique, dateExpiration (fin de l'année universitaire), statut actif ou résilié. Pas de téléphone. L'étudiant utilise sa carte étudiante EST, qui porte déjà un QR code contenant le numéro d'étudiant. La bibliothèque n'imprime aucune carte.
- Emprunt : adherent, exemplaire, dateEmprunt, dateRetourPrevue, dateRetourEffective, nbRappels, dateDernierRappel.

## RÈGLES MÉTIER
1. Adhérents : créés uniquement par import d'un fichier (numéro d'étudiant, nom, prénom, e-mail académique), jamais à la main. Le numéro d'étudiant est la clé : existant = mise à jour, sinon création. Absent de la nouvelle liste = résilié. La liste est fiable : aucun contrôle des e-mails. Fichier rejeté seulement si une colonne manque ou si un numéro d'étudiant est vide.
2. Emprunt (deux scans) refusé, avec le motif affiché, si : l'exemplaire n'est pas DISPONIBLE, l'ouvrage n'est pas empruntable, l'adhérent a un emprunt en retard, ou l'adhérent est résilié ou son abonnement expiré. Sinon : dateRetourPrevue = dateEmprunt + 15 jours, exemplaire EMPRUNTE. Sans prolongation, sans quota. Le premier qui présente l'exemplaire l'emprunte. Un emprunt peut être annulé dès le scan de l'exemplaire, avant ou juste après son enregistrement (erreur de scan) : il est marqué annulé, jamais supprimé ; l'exemplaire reste ou redevient DISPONIBLE ; un emprunt annulé n'entre dans aucun calcul de retard ni de rappel.
3. Retour (un scan de l'exemplaire) : toujours possible, même si l'adhérent est en retard ou résilié. Le retour n'a aucun choix d'état : scan de l'exemplaire, clôture de l'emprunt, exemplaire DISPONIBLE, puis « Ranger : tiroir X, rangée Y » et « Reclasser ». Aucune notification au retour. Sans emprunt en cours (lecture sur place), afficher seulement l'emplacement avec « Reclasser ».
4. Aucun dommage n'est géré. Seules actions : perdu (PERDU) et retrouvé (DISPONIBLE).
5. Retards et rappels : calculés, jamais stockés. Un adhérent en retard est bloqué pour tout nouvel emprunt jusqu'au retour du livre.
- Retard de 1 jour : e-mail courtois, envoyé AUTOMATIQUEMENT (nbRappels = 1).
- Retard de 2 jours : e-mail moyennement courtois, plus insistant, envoyé AUTOMATIQUEMENT (nbRappels = 2).
- Retard de 3 jours ou plus : aucun envoi automatique. L'étudiant figure dans la liste « À rappeler » (nbRappels < 3). Le gestionnaire envoie MANUELLEMENT, en groupe, un e-mail sévère (ferme et formel). Après l'envoi, nbRappels = 3.
- « À contacter » = nbRappels >= 3 et emprunt toujours en retard (contact hors application).
Un seul e-mail par palier et par emprunt. E-mails simulés dans un journal, envoyés à l'e-mail académique. Aucune amende.
6. Jamais de suppression : uniquement des statuts. Valeurs calculables jamais stockées (retard, disponibilité, adhérent autorisé à emprunter). Notifications simulées dans un journal. Date du jour simulable dans Réglages. Interface en français.
8. Accès étudiant par domaine académique : l'accès à l'espace étudiant (consultation du catalogue) est autorisé à toute adresse e-mail dont le domaine correspond au domaine autorisé (@usmba.ac.ma, configurable dans Réglages du gestionnaire). L'appartenance à la liste importée n'est plus exigée pour consulter. L'emprunt reste réservé aux adhérents actifs de la liste importée, identifiés par le scan de la carte étudiante (règle 2 inchangée).
9. Couvertures d'ouvrages garanties : chaque ouvrage doit toujours afficher une image de couverture, selon l'ordre de priorité :
   a) coverUrl de l'ouvrage s'il existe (photo téléversée redimensionnée à 400px max ou URL saisie) ;
   b) Open Library : https://covers.openlibrary.org/b/isbn/{isbn}-L.jpg?default=false ;
   c) Google Books : https://www.googleapis.com/books/v1/volumes?q=isbn:{isbn} (imageLinks.thumbnail en https) ;
   d) Couverture générée : composant React sans dépendance externe, fond coloré stable selon la catégorie (palette de 6 à 8 couleurs sobres), titre (3 lignes max) et auteur en bas, ratio 2:3.
   Si une source externe (b ou c) est validée, elle est mise en cache dans coverUrl. Une couverture générée n'est jamais stockée.
