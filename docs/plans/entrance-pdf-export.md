# Télécharger le PDF d'une fiche d'entrée

Date : 5 novembre 2026. Statut : première version implémentée ; validation
automatisée réussie, qualification des appareils et gros dossiers restante.

Référence : [audit UX de l'impression](../audits/entrance-print-ux.md) et
[#1218](https://github.com/GrottoCenter/grottocenter-front/issues/1218).

## Objectif

Remplacer l'action « Imprimer » de la fiche d'entrée par une seule action
**« Télécharger le PDF »**, ouvrant la préparation d'un dossier téléchargeable.
L'utilisateur choisit les sections et les documents pleine page ; il obtient
un fichier unique qu'il peut consulter hors ligne, partager ou imprimer dans
son lecteur PDF.

Ce n'est pas un renommage de `react-to-print` : le produit doit générer un vrai
fichier, sans dialogue d'impression natif ni obligation de choisir « Enregistrer
en PDF » dans le navigateur.

Utiliser des bibliothèques établies, une UX MUI cohérente avec le projet et une
composition papier dédiée. Ne pas développer un moteur de pagination maison
ni exporter une capture bitmap de toute la page web.

## Contexte du dépôt

Version inspectée : `d4f3d20b`.

| Élément existant | Conséquence pour l'implémentation |
| --- | --- |
| `packages/web-app/src/components/appli/Entry/index.jsx` | Remplacer l'action `print`, son icône et le hook de cette fiche |
| `components/common/Layouts/ResponsiveActions.jsx` | Conserver le système d'actions desktop/mobile et le groupement existant |
| `components/appli/Entry/Documents/index.jsx` | Documents actuellement triés par type ; point d'intégration du statut essentiel |
| `components/common/DocumentsList/` | Ne pas utiliser les vignettes recadrées comme annexes |
| `hooks/queries/useEntrance.js`, `useDocument.js`, `useCave.js` | Réutiliser les données et conventions TanStack Query |
| `api/client.js`, `api/queryKeys.js`, `hooks/index.js` | Toute extension d'API doit suivre ces points d'entrée |
| `types/document.type.js` | Les fichiers ont `id`, `completePath`, `fileName`, `pdfPageOffset` ; la licence est dans le détail complet |
| `utils/pdfUrl.js`, `utils/documentPdfOffsets.js` | Réutiliser les règles de référence PDF et de décalage de pagination |
| `components/common/PdfPreview/index.jsx` | Lecteur natif avec fallback PDF.js déjà disponible |
| `components/common/Contribution/Contribution.jsx` | Texte multiligne, liens et métadonnées ; pas un rendu HTML riche arbitraire |
| `components/common/DocumentsList/utils/imageUtils.js` | Classification, décodage des noms et téléchargement existants |
| `components/appli/Entry/Properties.jsx`, `Locations/`, `Riggings/` | Sources des propriétés, contributions et équipements, sans reprendre les formulaires |
| `components/appli/Entry/SensitiveLocationPlaceholder.jsx` | L'export doit respecter les restrictions de localisation existantes |

Les chemins sans préfixe dans ce tableau sont relatifs à
`packages/web-app/src/`.

React 19, MUI 9, Vite, Vitest, Cypress, `pdfjs-dist` et `qrcode.react` sont déjà
présents. Au début de l'analyse, aucun générateur/assembleur PDF n'était déclaré
dans le manifeste ; les dépendances retenues sont désormais ajoutées.
`react-to-print` reste utilisé ailleurs, notamment pour les réseaux : ne pas
retirer sa dépendance ou ses styles globaux dans ce chantier.

L'audit a reproduit un PDF Jean-Bernard de trois pages, une carte trop haute,
des informations terrain en page 3, des liens PDF masqués et une image portrait
fortement recadrée. Ces cas servent de référence, sans figer le nombre de pages
du nouveau dossier.

## Périmètre

Inclus :

- Export depuis une fiche d'entrée ; fonctionnement pour les visiteurs, dans
  les limites des données auxquelles ils ont accès.
- Préparation des sections, choix des fichiers et pages PDF, aperçu et
  téléchargement unique.
- Fiche A4 avec texte sélectionnable, sources, dates, marges et pagination.
- Images originales non recadrées et pages PDF intégrées sans rasterisation
  systématique.
- Carte préparée pour le dossier, indépendante du zoom écran.
- Mise en avant des documents essentiels de #1218, après confirmation du
  contrat backend.
- Chargement, annulation, erreurs explicites et conservation des choix.
- Traductions et contrôles d'accessibilité desktop/mobile.

Exclus :

- Export de toutes les entrées d'un réseau ou refonte de son bouton d'impression.
- Téléchargement automatique des liens trouvés dans le texte des contributions.
- Mise en annexe des vidéos, modèles 3D ou autres formats non pris en charge.
- Réécriture des contributions, extraction automatique des consignes de sécurité
  ou certification de la fiabilité des informations.
- Nouveau service d'export, proxy ou migration backend sans besoin démontré.
- A3, configurateur cartographique avancé, PDF/A, signatures et conformité
  PDF/UA certifiée dans la première version.

## Implémentation proposée

### 1. Valider la chaîne standard sur un prototype borné

Recommandation technique :

| Rôle | Solution proposée | Motif |
| --- | --- | --- |
| Mise en page de la fiche | `@react-pdf/renderer` 4.9.0 compatible avec React 19 | Composition déclarative, pagination, textes et liens PDF |
| Assemblage et annexes PDF | `pdf-lib` 1.17.1 | Bibliothèque établie, intégration de pages, images et contenu vectoriel |
| Aperçu | `PdfPreview` / `pdfjs-dist` existants | Pas de second lecteur ou de moteur de rendu maison |
| UI de préparation | MUI et React-Intl existants | Cohérence, responsive et accessibilité |

La [documentation de compatibilité](https://react-pdf.org/compatibility)
annonce React 19 depuis `@react-pdf/renderer` 4.1.0.
[pdf-lib](https://pdf-lib.js.org/) documente la création, l'intégration et la
fusion de pages dans le navigateur. Sa dernière version, 1.17.1, date de novembre
2021 : son adoption et ses capacités répondent au besoin, malgré cette ancienne
date de publication. Les versions 4.9.0 et 1.17.1 sont les dernières de ces deux
bibliothèques lors de la vérification. Le fork Cantoo a été évalué puis écarté :
une publication plus récente ne suffit pas à justifier une dépendance moins
établie. Aucun correctif propre à ce fork n'est actuellement nécessaire.

Un premier essai sous Node a généré un vrai PDF avec accents et japonais, puis
copié sa page dans un nouveau PDF. Le build Vite et les tests de l'assembleur
avec les polices embarquées, des pages tournées et un CropBox ont ensuite été
exécutés. Les vérifications navigateur et de rendu ci-dessous restent nécessaires ;
un essai sous Node ne valide pas à lui seul le parcours complet.

Faire un prototype avec une longue contribution, un tableau, une image
900 × 1800 et un PDF vectoriel portrait/paysage. Vérifier :

- Build Vite de production, génération d'un Blob et lecture avec PDF.js.
- Polices embarquées, accents et langues représentatives des contenus.
- Conservation du texte et des traits vectoriels des annexes.
- Pagination des longs blocs et lisibilité des tableaux.
- Génération sans bloquer l'interface, notamment via un worker Vite.
- Accès CORS à des fichiers réels, coût mémoire et téléchargement mobile.

Le prototype valide ou invalide cette recommandation avant la réalisation de
l'interface complète. Si le blocage concerne l'accès aux fichiers, établir
l'extension backend/stockage minimale nécessaire ; ne pas remplacer le
téléchargement promis par une ouverture d'onglet.

### 2. Construire un modèle d'export indépendant de l'écran

Créer un modèle normalisé à partir des données accessibles : identité, langue
de l'interface, date de génération, source canonique, propriétés, contributions,
carte et annexes sélectionnées.

Utiliser des identifiants d'entrée/document/fichier, pas les positions dans
une liste ou dans la galerie. Dédupliquer les fichiers et conserver un ordre
stable. Stocker les choix localement au dialogue ; aucune mutation publique
ni nouveau reducer Redux pour ce parcours.

Réutiliser les requêtes de détail et le cache TanStack Query. Si la préparation
a besoin de requêtes impératives, partager leurs options existantes plutôt que
dupliquer endpoints et query keys. Charger les détails complets des documents
sélectionnés seulement lorsqu'ils sont nécessaires.

Ne prendre que les données enregistrées, pas le DOM des formulaires ouverts.
Conserver les auteurs, dates, langues, sources et règles d'ordre existantes.
Ne pas confondre profondeur/développement du réseau et parcours depuis l'entrée.
Tester les valeurs nulles valides comme une longitude ou altitude de zéro.

Appliquer les restrictions d'accès avant de préparer modèle, carte et ressources.
Ne pas reconstituer une localisation sensible depuis une autre requête.
Les contenus supprimés ne doivent pas se retrouver dans l'export par accident.
Un changement de session ou d'entrée invalide les ressources déjà préparées.

### 3. Réaliser le parcours de préparation

Dans `Entry/index.jsx`, utiliser une icône de téléchargement et le libellé
traduit « Télécharger le PDF », tout en conservant `ResponsiveActions`.
Un tooltip seul ne remplace pas le nom accessible de l'action.

Ouvrir un dialogue desktop et plein écran sous `sm`, avec :

- **Fiche** : identité, coordonnées autorisées, dangers/restrictions, accès,
  descriptions, carte et équipements proposés ; commentaires conservés par
  défaut lorsqu'ils existent. Historique, bibliographie, détail de qualité et
  descriptions du réseau disponibles séparément.
- **Documents pleine page** : essentiels en premier, titre, aperçu non recadré,
  fichier, état de disponibilité, pages sélectionnées et avertissement de qualité.
- **Actions** : annuler, afficher l'aperçu et « Télécharger le PDF ».

Ne pas proposer d'exclure l'identité et les sources du dossier. Masquer les
options inapplicables plutôt qu'afficher un long inventaire vide.
Les descriptions du réseau sont incluses seulement sur choix explicite.

Pour les PDF, sélectionner les pages physiques du fichier avec une numérotation
à partir de 1. Présenter distinctement la pagination de publication lorsqu'un
`pdfPageOffset` est connu ; ne pas confondre le champ bibliographique `pages`
avec des indices de pages PDF. Valider les plages, les doublons et les bornes
après connaissance du nombre de pages.

Les essentiels sont recommandés, mais une publication entière n'est jamais
présélectionnée par surprise. En l'absence de pages recommandées fiables,
l'utilisateur confirme les pages à inclure. Une référence sans fichier ne
peut être sélectionnée qu'en bibliographie.

Une sélection suffit pour un premier dossier utile ; éviter les réglages
avancés imposés. Préserver les choix après annulation, fermeture et erreur tant
que l'entrée/session ne change pas. Ne pas annoncer une impression réussie.

### 4. Composer la fiche et préparer les annexes

Composer la fiche avec les primitives de la bibliothèque PDF, pas les
composants MUI. Réutiliser les données et règles de formatage ; ce rendu dédié
est nécessaire car les composants DOM ne sont pas des composants PDF.

Prévoir 12–15 mm de marges initiales, un corps de texte proche de 11–12 points,
une hiérarchie simple et un pied de page lisible. Présenter d'abord l'identité
et les informations terrain. Conserver retours à la ligne, liens et
attributions des contributions ; ne pas supprimer les commentaires porteurs
d'information sous prétexte de compacité.

Utiliser les fonctions standard de pagination du renderer, avec des traitements
limités pour titres et lignes de tableau. Vérifier les en-têtes répétés et
imprimer les légendes d'équipement actuellement dans les dialogues.

Préparer une carte de dimensions fixes avec cadrage et fond explicitement
choisis, attribution lisible et échelle graphique. Réutiliser la configuration
cartographique et projection du dépôt. Vérifier droits d'impression, CORS et
chargement des tuiles ; ne pas capturer la carte visible à l'écran.
Un échec de carte donne le choix de réessayer ou de continuer sans carte.

Images : charger l'original `completePath`, pas les thumbnails, conserver le
ratio et adapter portrait/paysage sans recadrage. Vérifier orientation EXIF et
formats supportés ; convertir les formats d'image incompatibles seulement si
nécessaire, sans réduire systématiquement leur définition.

PDF : sélectionner et intégrer les pages originales avec `pdf-lib`, sans
passer par les canvas de l'aperçu. Pour une sortie A4 ajustée, préserver les
proportions, traiter rotation et boîtes de page et signaler le changement
d'échelle. Prévoir un mode « format original » si nécessaire aux topographies ;
ce choix physique doit être confirmé lors du prototype.

Réserver un emplacement aux crédits sans couvrir le dessin. Ajouter la
pagination globale après assemblage, à partir du nombre final de pages.
Si le mode natif ne permet pas de placer ces informations sans altérer la page,
préférer un intercalaire de crédits plutôt qu'un tampon sur la topographie.

Émettre un PDF doté d'un titre et d'un nom de fichier stable, par exemple
`grottocenter-entree-1-jean-bernard-2026-11-05.pdf`. Garantir texte sélectionnable
sur les pages générées, fontes embarquées et liens vers les sources.

### 5. Encadrer la génération et réutiliser l'aperçu

Séparer préparation des ressources, rendu, assemblage et téléchargement.
Charger les bibliothèques à la demande, pas dans le bundle initial de la fiche.
Utiliser un worker si validé au prototype pour préserver la réactivité ;
échanger données sérialisables et buffers, pas un arbre React DOM.

Le hook orchestre un seul travail actif : préparation, génération, prêt,
erreur ou annulation. Borner les téléchargements simultanés et traiter les
pages successivement sans conserver des canvas haute définition inutiles.
Définir les seuils de confirmation des gros dossiers après mesures, sans
tronquer la sélection.

Afficher les étapes réelles et les erreurs par fichier, pas un pourcentage
inventé. Annuler requêtes et worker, nettoyer les buffers et révoquer les Blob
URLs après remplacement/fermeture. Ignorer les résultats d'une ancienne entrée
ou d'une sélection devenue obsolète.

Le fichier montré dans l'aperçu est exactement celui téléchargé ; ne pas
générer deux variantes. Utiliser le lecteur existant en le rendant adapté aux
Blob URLs et au contexte du dialogue si nécessaire. Ne pas exposer ces URLs
dans les textes bibliographiques ou les QR codes.

Le helper `downloadFile` existant ouvre un onglet en cas d'échec CORS : ne pas
réutiliser ce fallback comme succès d'export. Extraire un helper Blob partagé
uniquement si cela évite une duplication réelle, sans changer ses autres usages.
Pour les nouveaux accès API binaires, étendre `api/client.js` conformément au
contrat existant ; distinguer les fichiers publics externes des endpoints API.

### 6. Intégrer les documents essentiels de #1218

Confirmer avec le backend le statut porté par la relation entrée–document,
sa lecture, sa mutation et les permissions. Les fichiers/pages recommandés
restent une décision éditoriale distincte, si ce besoin est retenu.

Étendre les PropTypes et les query keys/hooks concernés lorsque le contrat est
disponible. Ajouter une mise en avant dans `Entry/Documents/index.jsx` et
`DocumentsList`, avec comportement opt-in pour ne pas changer toutes les autres
listes de documents. Préserver le tri choisi à l'intérieur des groupes et les
correspondances entre cartes et galerie.

La sélection ponctuelle du PDF ne modifie jamais le statut essentiel. En
attendant le backend, le téléchargement reste utilisable avec sélection
manuelle ; ne pas fabriquer un statut partagé dans le stockage local.

## Organisation du code et livraison

Chemins proposés, à créer seulement s'il n'existe pas d'équivalent réutilisable :

- `packages/web-app/src/components/appli/Entry/PdfExport/` : dialogue et sélection
  des annexes.
- `packages/web-app/src/hooks/useEntrancePdfExport.js` : orchestration locale.
- `packages/web-app/src/pdf/entrance/` : modèle, document déclaratif, préparation
  des ressources, assemblage et worker, séparés par responsabilité.
- Tests colocaux et
  `packages/web-app/cypress/e2e/entrance-pdf-export.cy.js`.

Imports internes via `@` dès qu'ils remplacent deux niveaux de `../`.
Composants fléchés avec PropTypes, paramètres par défaut, pas de mutation du
cache, pas de logique réseau dans le renderer PDF. Les bibliothèques assurent
la pagination et l'assemblage ; les adaptateurs propres au domaine restent petits.

Livrer dans l'ordre : prototype validé, modèle/rendu, parcours et annexes,
documents essentiels. Ne remplacer l'action existante que lorsqu'un vrai
téléchargement de bout en bout fonctionne. Si les étapes sont intégrées
séparément, conserver temporairement l'ancienne action jusqu'à cette bascule,
sans publier deux actions concurrentes au terme du chantier.

La migration concerne l'entrée uniquement. Ne pas supprimer les traductions
« Print » ou les styles encore utilisés ailleurs.

## Validation

L'implémentation est présente, avec les dépendances et les traductions.
Les commandes ci-dessous ont été exécutées depuis la racine du dépôt.
Le statut « essentiel » de #1218 n'est pas implémenté : il attend le contrat
backend ; la sélection des annexes est locale au dossier.

### Automatisation ciblée

- Modèle/sélection : sections par défaut, commentaires, permissions, valeurs
  nulles valides, ordre stable, fichiers uniques et pages invalides.
- Génération : vraie lecture des octets avec PDF.js, nombre/ordre des pages,
  présence du texte, proportions des images et traits du PDF vectoriel.
- UI : nom accessible, options cohérentes, conservation des choix, génération
  obsolète ignorée, erreurs partielles et annulation.
- Régression des documents : listes et fichiers existants inchangés.

```bash
yarn test src/pdf/entrance/model.test.js src/pdf/entrance/generateEntrancePdf.test.jsx src/hooks/useEntrancePdfExport.test.js --maxWorkers=2
yarn test src/components/common/DocumentsList/Files.test.jsx src/components/common/DocumentsList/DocumentsList.test.jsx src/components/appli/Entry/Documents/index.test.jsx --maxWorkers=2
yarn eslint --fix packages/web-app/src/pdf/entrance packages/web-app/src/components/appli/Entry/PdfExport packages/web-app/src/hooks/useEntrancePdfExport.js packages/web-app/src/hooks/useEntrancePdfExport.test.js packages/web-app/src/components/appli/Entry/index.jsx packages/web-app/src/components/common/DocumentsList/utils/imageUtils.js packages/web-app/src/hooks/queries/useDocument.js packages/web-app/src/api/documentQueryOptions.js packages/web-app/src/setupTests.js packages/web-app/vite.config.mjs packages/web-app/cypress/e2e/entrance-pdf-export.cy.js
yarn build
```

Résultats : **20 tests PDF réussis**, **26 tests de régression documentaire
réussis**, ESLint ciblé réussi et build de production réussi.
Le lint complet reste à exécuter avant une PR ; aucun commit ou PR créé.

Pour Cypress, utiliser les commandes et mocks existants, une API interceptée et
de petits fichiers de test reproductibles. Démarrer `yarn start` dans un autre
terminal. Le contrôle final a aussi exercé le worker compilé, servi temporairement
par `yarn preview --host 127.0.0.1 --port 4179 --strictPort` :

```bash
LD_LIBRARY_PATH=/home/sesa604748/.copilot/session-state/c21310c3-2bfd-4745-96a0-bdafd4debe5e/files/browser-libs/usr/lib/x86_64-linux-gnu LIBGL_ALWAYS_SOFTWARE=1 yarn e2e:run --spec cypress/e2e/entrance-pdf-export.cy.js --browser electron --config baseUrl=http://127.0.0.1:4179/ui
```

Résultat : **4 scénarios réussis sur le build final**. Ils lisent les octets
téléchargés : sélection de la page physique 2 et conservation de son format
et rotation, échec de carte puis réessai sans carte, assemblage d'une carte
1200 × 500 à partir de tuiles décodées, téléchargement direct en viewport mobile
malgré une panne documentaire lorsque la bibliographie est désélectionnée.
Les ressources PDF et cartographiques sont des fixtures reproductibles ;
ce résultat ne prouve pas le CORS de tous les hébergeurs externes.

Pour les textes, employer React-Intl et le workflow de traduction du dépôt
(skill `translate`) : anglais source, synchronisation, traduction de chaque
langue, tri. Vérifications :

```bash
yarn translations:check-en
yarn translations:check-sorted
yarn translations:sync-with-en --check
```

Résultats : les trois commandes réussissent ; onze nouvelles clés traduites
dans quatorze langues, en plus de l'anglais source.
Une Storybook story
est requise pour tout composant commun réutilisable introduit par extraction,
pas pour chaque composant spécifique à l'entrée.

### Contrôle manuel du résultat

Le dossier Jean-Bernard réel (`/entrances/1`) a été généré en français, sans
carte ni bibliographie pour isoler la fiche, puis rendu en PNG avec PDF.js.
Cette configuration produit deux pages ; les avertissements hivernaux sont
sur la première, avec propriétés, sources et pagination. Cela ne constitue
pas une comparaison de dossiers de périmètre identique avec les trois pages
de l'ancienne impression.

Le contrôle a révélé un pied de page hors page : l'interligne numérique
hérité était remultiplié lors de la pagination dynamique du renderer.
L'interligne naturel de la police est désormais utilisé, avec un corps de
11 points. Un test PDF.js contrôle les crédits et numéros dans les limites
de chaque page générée, y compris une annexe A4. Commentaires et accès passent
avant la carte pour ne pas repousser les informations terrain.

Examiner à 100 %, sur papier A4 couleur et noir et blanc : longues contributions,
tableau sur plusieurs pages, portrait, paysage, scan, PDF vectoriel et annexes
de formats différents. Vérifier Chrome/Firefox et Safari/mobile sur appareils
réels ; JSDOM ne prouve pas le comportement de téléchargement d'iOS.

Ces contrôles sur papier et appareils réels restent à effectuer, de même que
la qualité visuelle des écritures RTL et des tableaux d'équipement très longs.
La répétition automatique de leurs en-têtes n'est pas implémentée.
Mesurer le délai, la réactivité et la mémoire sur un téléphone représentatif,
avec réseau lent et fichier volumineux. Ne pas généraliser les résultats
automatisés aux appareils, formats ou volumes non mesurés.

## Critères d'acceptation

- [x] « Télécharger le PDF » produit un fichier unique, sans Ctrl+P ni dialogue
  d'impression natif.
- [x] Le même fichier est prévisualisé et téléchargé.
- [ ] La sélection respecte sections, fichiers et pages ; les recommandations
  essentielles sont distinctes des choix locaux.
- [x] Les commentaires utiles ne sont pas exclus silencieusement par défaut.
- [x] Aucune topographie n'est recadrée ou déformée ; une réduction d'échelle
  est explicite.
- [x] Le texte de la fiche est sélectionnable ; les annexes vectorielles ne sont
  pas systématiquement rasterisées.
- [x] Sources, auteurs, dates, licences disponibles, marges et pagination sont
  lisibles sans recouvrir les dessins.
- [ ] La carte est cadrée pour le dossier et respecte droits et restrictions.
- [ ] Les erreurs, fichiers indisponibles et formats non supportés sont visibles
  avant téléchargement ; aucune omission implicite.
- [ ] Annulation et erreur conservent la sélection ; navigation/changement de
  session invalident les travaux obsolètes.
- [ ] Un dossier volumineux ne bloque pas durablement l'interface.
- [x] Tests ciblés, lint, traductions, build et vérifications du PDF passent.
- [x] L'impression des réseaux et les autres usages des documents restent
  inchangés.

## Risques et cas limites

- CORS/stockage : pouvoir ouvrir un PDF dans un onglet ne signifie pas pouvoir
  lire ses octets pour l'assembler.
- Polices : la police web n'est pas automatiquement embarquée dans un PDF.
  Choisir des fichiers autorisés, couvrant accents et écritures des contenus.
- PDF chiffrés, corrompus, signatures, formulaires et annotations : ne pas
  promettre une conservation intégrale ; signaler les incompatibilités et
  éviter les transformations silencieuses.
- A4 et échelles : un fichier natif A3 réduit en A4 ne garde pas son échelle
  numérique ; la mise à l'échelle du lecteur lors de l'impression peut encore
  modifier le résultat.
- Volume : fusion, images originales et génération peuvent consommer beaucoup
  de mémoire, même si seules quelques pages sont choisies dans un gros fichier.
- Informations sensibles : un fichier téléchargé est partageable ; préserver
  les contrôles d'accès et avertissements existants, sans enrichissement caché.
- Compatibilité : valider worker, génération, aperçu et téléchargement dans le
  build final et sur mobile, pas uniquement dans le serveur Vite.
- Dossier hors ligne : la consultation du PDF téléchargé est hors ligne ; sa
  génération ne l'est pas forcément. Ne pas confondre les deux promesses.

## Questions ouvertes

- Quel contrat backend et quelles permissions pour « essentiel pour cette
  entrée » ? Des pages recommandées éditorialement sont-elles souhaitées ?
- Les fichiers et le fond cartographique retenus autorisent-ils la lecture
  CORS et l'impression ? Une adaptation de stockage/API est-elle nécessaire ?
- Le mode initial des annexes est-il A4 ajusté ou format natif pour préserver
  la taille physique ? Recommandation : fiche A4 et option explicite pour les
  topographies dont l'échelle importe, à valider sur le prototype.
- Quels seuils de volume déclenchent une confirmation et quels appareils
  constituent le minimum supporté ? Les établir sur les mesures du prototype.
- Quelles fontes embarquées couvrent les langues publiées avec une licence
  adaptée ? Valider aussi les limites d'accessibilité des bibliothèques avant
  toute promesse de PDF balisé.
