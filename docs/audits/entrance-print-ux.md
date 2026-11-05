# Audit UX de l'impression des fiches de cavité

Date : 5 novembre 2026.

Version examinée : `d4f3d20b` — `feat(Network): explain the network definition (#1610)`.

Issue concernée : [#1218](https://github.com/GrottoCenter/grottocenter-front/issues/1218).

## Verdict

L'impression actuelle constitue une bonne base technique, mais pas encore un
dossier terrain fiable et personnalisable. Elle adapte principalement la fiche
web au papier, sans composition dédiée ni sélection des annexes.

Les problèmes prioritaires sont la fidélité des documents imprimés, la
hiérarchisation des informations utiles et l'autonomie du dossier hors ligne.
Il ne suffit pas d'agrandir les vignettes pour répondre à #1218.

## Méthode et limites

L'audit combine :

- La lecture du parcours d'impression, des styles papier et des composants de
  carte, documents, contributions, propriétés et équipements.
- Un export réel de la copie préparée par le bouton d'impression de l'entrée
  Jean-Bernard [V4], produisant trois pages A4 dans Electron.
- Une analyse des pages rasterisées, du texte et de la géométrie du PDF.
- Un cas synthétique utilisant les composants de documents actuels, avec une
  image portrait de topographie et un lien vers un fichier PDF.
- La consultation des documentations officielles des sites comparés.

Le nombre de pages et les mesures décrivent ces exports contrôlés, pas un
résultat garanti sur tous les navigateurs et imprimantes.

Non vérifiés : impression physique, Firefox, Safari, impression mobile, long
tableau d'équipement réel, assemblage de plusieurs PDF multipages et impression
directe par Ctrl+P.

La fenêtre Cypress fonctionne côté Linux, mais son accessibilité depuis Windows
via WSLg n'a pas été confirmée. Cela n'a pas empêché la génération et l'analyse
des PDF.

## Points à conserver

- Le bouton d'impression exclut la navigation générale de l'application.
- Tous les onglets deviennent imprimables, pas seulement l'onglet actif.
- Les sections repliées sont développées.
- Tous les documents restent montés : la pagination écran ne limite pas
  l'impression aux dix premiers.
- Les boutons, ombres et plusieurs contrôles cartographiques sont masqués.
- Les auteurs et dates des contributions sont conservés.
- Les coordonnées et leur système de référence sont affichés.
- Le corps du texte observé est d'environ 12 points, donc raisonnablement lisible.
- Des styles existent pour garder certains titres avec le contenu suivant,
  limiter les veuves et orphelines et permettre aux grandes cartes de se couper.
- `react-to-print` attend déjà certaines ressources et copie les canvas :
  l'impression ne part pas systématiquement sans préparation.

## Constats prioritaires

« Reproduit » désigne une observation dans les exports. « Code » désigne un
comportement établi par lecture des composants. « Risque » nécessite un cas
complémentaire avant de conclure sur le rendu.

| ID | Priorité | Constat | Preuve | Conséquence |
| --- | --- | --- | --- | --- |
| F01 | P1 | Les fichiers PDF ne sont pas intégrés ; leurs liens sous forme de boutons sont masqués | Reproduit et code | Le dossier ne contient ni le PDF ni son lien visible |
| F02 | P1 | Les images sont imprimées dans des cadres de vignettes avec `object-fit: cover` | Reproduit et code | Des parties utiles d'une topographie peuvent disparaître |
| F03 | P1 | Pas de sélection des sections, fichiers ou pages PDF | Code | Impossible de composer un dossier adapté à une sortie |
| F04 | P1 | Informations importantes de conditions hivernales et d'avalanche en page 3 | Reproduit sur Jean-Bernard | La hiérarchie ne met pas systématiquement l'information terrain en évidence |
| F05 | P1 | Marges nulles par défaut de la bibliothèque, sans contrat papier propre au projet | Reproduit et code | Contenu proche des bords, risque sur les imprimantes à marges non imprimables |
| F06 | P1 | Carte issue du clonage de l'état écran, sans cadrage papier dédié | Reproduit et code | Dimensions et position du repère non maîtrisées |
| F07 | P1 | Les descriptions du réseau sont signalées mais non incluses | Reproduit et code | La fiche n'est pas un dossier réseau autonome |
| F08 | P2 | Une URL de topographie est coupée entre deux pages | Reproduit | Lecture et retranscription difficiles |
| F09 | P2 | Score de qualité détaillé développé et sections vides imprimées | Reproduit | Papier consommé au détriment de la hiérarchie terrain |
| F10 | P2 | Pas d'identité récurrente, date d'export, pagination ou retour numérique dédiés | Reproduit et code | Une feuille isolée est difficile à contextualiser |
| F11 | P1 | Pas de choix explicite de la ressource originale pour une annexe imprimée | Code | Qualité d'impression non garantie |
| F12 | P2 | Description d'un document avec galerie absente de la carte imprimée | Reproduit et code | Perte de contexte ou d'explications |
| F13 | P2 | Légendes d'équipement accessibles par boutons/dialogues masqués | Code | Notations potentiellement incompréhensibles sur papier |
| F14 | P2 | Pagination des longs tableaux, clamp mobile et formulaires d'édition à contrôler | Risque | Coupures, texte tronqué ou interface d'édition dans le dossier |
| F15 | P2 | Pas de gestion utilisateur dédiée des erreurs ou ressources partielles | Code | Difficulté à savoir si le dossier est complet |

### Documents et topographies

Dans le cas synthétique, l'image naturelle de 900 × 1800 pixels occupe un cadre
de 774 × 338 pixels avec `object-fit: cover`. Environ 78 % de sa hauteur est
hors du cadre visible. Ce pourcentage est propre au cas testé ; il démontre
néanmoins que l'entrée, les légendes ou des branches du réseau peuvent être
supprimées par le recadrage.

Le lien `survey-full-size.pdf` a un affichage calculé `none`. Le contenu du PDF
n'a pas été rendu dans ce test : celui-ci vérifie uniquement la disparition du
lien avec les composants actuels.

Les descriptions des documents contenant des médias sont réservées à la
galerie, qui ne figure pas dans la sortie papier. Les miniatures responsives
peuvent être utilisées lorsqu'elles existent ; en leur absence, l'original peut
être utilisé. Il serait donc incorrect de qualifier toutes les images de basse
résolution.

Le lecteur PDF de la page document n'est pas une chaîne d'assemblage des annexes
de la fiche d'entrée.

### Carte et mise en page

Dans l'export A4 de Jean-Bernard :

- La carte mesure environ 99 × 177 mm, soit près de 60 % de la hauteur A4.
- Le centre du marqueur se situe vers 75 % de la largeur de la carte.
- Les neuf tuiles mesurées étaient chargées : aucune carte blanche n'a été
  reproduite.
- Les textes d'attribution et d'échelle sont d'environ 6 points.
- Certains textes et bordures sont à environ 2,4 mm du bord gauche de la feuille.

La hauteur de carte suit le bloc de propriétés de la mise en page écran.
La copie n'a pas d'instance Leaflet active pour recalculer son cadrage papier.
Le fond, le zoom, les couches et l'opacité peuvent dépendre de l'état utilisateur.

Le projet ne définit pas son propre `@page`. La marge nulle vient du style
par défaut de `react-to-print`, qui vise à supprimer les en-têtes et pieds de
page du navigateur. Le problème est ce défaut non remplacé, pas une absence
totale de règle de page.

Il faut conserver les possibilités de coupure des grandes contributions.
Appliquer `break-inside: avoid` à toutes les cartes ne serait pas une solution :
un bloc dépassant une page doit pouvoir se poursuivre.

### Contenu terrain et autonomie

La fiche Jean-Bernard contient une carte, les propriétés, deux accès, une
description, une référence bibliographique sans fichier, aucun équipement et
deux commentaires affichés.

Les informations de conditions hivernales, redoux et avalanches apparaissent
dans un commentaire en page 3. Les commentaires ne peuvent donc pas être
désactivés globalement par défaut sans examen du contenu ou précaution explicite.

Une URL de plan finit en page 2 par `JB-plan2010-` et reprend en page 3 avec
`2.pdf`. Ces liens dans les contributions ne deviennent pas des annexes.

Un encart indique que le réseau possède trois descriptions sans les intégrer.
La profondeur et le développement affichés sont des caractéristiques du réseau,
pas automatiquement ceux d'un itinéraire depuis cette entrée.

Le score de qualité ne certifie ni les conditions actuelles ni la sécurité.
L'absence de danger structuré ne doit pas être présentée comme une absence de
danger. Les données communautaires doivent garder leurs sources et dates.

L'interface en anglais et les contributions en français correspondent à la
langue de consultation et aux contenus saisis ; ce n'est pas un défaut de
localisation établi par ce cas.

### Risques complémentaires

- Les tableaux d'équipement ont un véritable `TableHead`, mais leur conteneur
  reste en `overflow: auto` et aucune gestion spécifique des coupures de lignes
  n'est définie. La répétition des en-têtes et les coupures doivent être vérifiées
  sur un tableau long.
- Les légendes sous forme de boutons et dialogues disparaissent sur papier.
- Les descriptions hors galerie peuvent conserver un clamp de trois lignes
  sur mobile ; ce rendu n'a pas été reproduit.
- Certains formulaires remplacent ou accompagnent les contributions et ne sont
  pas exclus sémantiquement de l'impression. Le risque d'imprimer une interface
  d'édition non enregistrée n'a pas été reproduit.
- Les vidéos et modèles 3D n'ont pas automatiquement une représentation papier
  utile.

## Comparaison avec des références de qualité

Ces éléments sont vérifiés dans les documentations officielles. Les PDF de ces
services n'ont pas fait l'objet d'une comparaison visuelle exhaustive.

| Référence | Fonction documentée | Principe pertinent |
| --- | --- | --- |
| [Outdooractive](https://www.outdooractive.com/en/knowledgepage/how-to-print-routes-and-content-or-export-them-as-a-pdf/51214231/) | Sélection carte, échelles, description, points, images et légende ; PDF détaillé ou compact pliable | Préparer un document selon son usage |
| [Visorando : téléchargement](https://support.visorando.com/telechargements/telecharger-un-pdf) | Bouton « Télécharger le PDF » dans les informations techniques | Une action explicite et un fichier récupérable |
| [Visorando : personnalisation](https://support.visorando.com/debuter-avec-visorando/personnaliser-un-pdf) | Personnalisation des paramètres et informations sur le site avec Premium | Personnalisation progressive |
| [Wikiloc : cartes multitraces](https://help.wikiloc.com/article/830-create-print-map-of-trails) | Jusqu'à huit traces, QR codes, titre et formats A2/A3/A4/A5 | Concevoir pour un format physique et relier papier et numérique |

Précautions de comparaison :

- Outdooractive nécessite une connexion et ne propose que le fond OpenStreetMap
  pour l'impression.
- La personnalisation Visorando citée est une fonctionnalité Premium.
- L'exemple Wikiloc concerne ORG/GeoPromotion, pas l'impression standard de toute
  randonnée. Son téléchargement par email n'est pas une friction à reproduire.
- Aucune capacité de Camptocamp n'a été suffisamment vérifiée pour être citée.

Le standard commun utile est : contenu choisi, format maîtrisé, dossier autonome,
retour à la source et aperçu du résultat.

Les [recommandations MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Media_queries/Printing)
confirment l'intérêt de styles dédiés, d'images haute résolution et du contrôle
des marges, dimensions et orientations avec `@page`.

## Recommandations pour #1218

L'issue demande de déclarer des documents essentiels pour une entrée, de les
présenter en premier avec de grands aperçus et de les rendre utilisables à
l'impression, notamment les topographies.

Trois notions doivent rester distinctes :

| Notion | Portée | Usage |
| --- | --- | --- |
| Document essentiel pour une entrée | Éditoriale et partagée | Recommandation affichée en priorité |
| Document sélectionné pour une impression | Locale et ponctuelle | Composition du dossier utilisateur |
| Fichier et pages sélectionnés | Sortie effective | Inclusion des seules annexes utiles |

Le statut essentiel devrait appartenir à la relation entrée–document, car un
même document peut avoir une importance différente selon l'entrée. Le support
backend de cette relation reste à vérifier.

Les essentiels peuvent être proposés ou présélectionnés, sans interdire de les
retirer ou d'ajouter d'autres documents. Une publication volumineuse ne doit pas
déclencher une impression intégrale par surprise : prévoir une sélection
explicite des fichiers/pages ou des pages recommandées éditorialement.

La sélection d'impression ne doit pas modifier les recommandations publiques
ni nécessiter un droit d'édition. Les permissions de modification du statut
essentiel doivent être définies séparément.

« Essentiel » ne signifie pas « validé », « à jour » ou « suffisant ». Une
référence sans fichier reste imprimable en bibliographie, pas en annexe.

Les liens externes présents dans le texte ne doivent pas être téléchargés et
intégrés silencieusement : disponibilité, droits et accès technique sont à
traiter explicitement.

## Parcours UX cible

### Préparation de la fiche

Conserver une action « Imprimer la fiche ». Si une génération de fichier est
disponible, proposer aussi « Télécharger le PDF ».

Ouvrir un dialogue large sur ordinateur et un écran plein format sur mobile,
avec deux groupes de choix :

- Contenu de la fiche : identité, coordonnées, carte, dangers/restrictions,
  accès, descriptions, équipements ; historique, bibliographie, commentaires
  et descriptions du réseau configurables séparément.
- Documents pleine page : titre, aperçu non recadré, statut essentiel, fichier,
  nombre de pages connu, sélection des pages PDF et disponibilité.

Fournir des choix initiaux raisonnables sans imposer la sélection individuelle
de chaque contribution. Conserver les informations terrain et ne pas supprimer
silencieusement les commentaires pouvant les porter.

Afficher un résumé de la sélection. Le nombre de pages est estimé avant
préparation et exact après génération.

### Aperçu et préparation

L'aperçu doit montrer le document final avec ses coupures, annexes et orientations.
Il faut pouvoir examiner les annotations à la taille de lecture, pas seulement
voir des miniatures de pages.

Afficher le chargement des fichiers et les erreurs. Un fichier indisponible ne
doit jamais être omis sans avertissement : proposer de réessayer ou de continuer
explicitement sans lui.

L'annulation doit préserver les choix. La fermeture du dialogue natif ne prouve
pas que l'utilisateur a effectivement imprimé : ne pas annoncer un succès
d'impression sur ce seul événement.

### Contrat « pleine page »

- Une image ou une page PDF par feuille, sans recadrage ni étirement.
- Proportions conservées et orientation adaptée lorsque le moteur le permet.
- Original ou contenu vectoriel préservé lorsque disponible.
- Métadonnées lisibles hors du dessin : titre, auteur, date, licence et source.
- Distinction entre ajustement à la feuille et taille réelle.
- Avertissement lorsqu'une réduction modifie une échelle numérique.
- Échelle graphique lisible ; pas de garantie « 1:1000 » après une réduction
  arbitraire.
- A4 comme premier format ; A3 ensuite selon les besoins.
- Avertissement de résolution insuffisante quand il est pertinent.

Une image A4 pleine surface à 300 dpi représente environ 2480 × 3508 pixels.
Ce repère ne remplace pas une vérification de la lisibilité des traits et textes.

### Mise en page

Prévoir des marges initiales de 12–15 mm, un résumé terrain en tête, une carte
de dimensions maîtrisées et une identité récurrente :

> Nom de l'entrée · réseau · identifiant · date de génération · page x/y

Conserver les sources, auteurs et dates, avec un lien court et un QR code vers
la fiche actualisée. Distinguer clairement les valeurs du réseau des informations
propres à l'entrée.

Réduire les blocs vides sans transformer « aucune donnée disponible » en
affirmation que l'information n'existe pas. Le score de qualité détaillé devrait
être optionnel plutôt qu'imposé en première page.

## Orientation technique

Créer un modèle de données et une mise en page dédiés à l'impression, tout en
réutilisant les données, utilitaires et rendus de contribution existants.
Le dossier ne devrait pas dépendre des onglets, formulaires ouverts, dimensions
responsive ou interactions courantes de la page.

Préparer explicitement la carte, les originaux des images et les fichiers.
La présence d'une attente de ressources dans `react-to-print` ne dispense pas
de ce contrôle applicatif.

Pour un dossier regroupant des pages PDF originales, choisir une chaîne
d'assemblage adaptée. Le lecteur de consultation actuel n'assure pas cette
fonction. L'arbitrage navigateur/service dédié dépend de CORS, de l'accès aux
fichiers, des droits, des tailles et du volume.

Éviter de rasteriser systématiquement les PDF : cela peut dégrader les traits,
le texte et la qualité vectorielle. Les métadonnées de licence doivent être
récupérées quand elles ne figurent pas dans la représentation simplifiée d'un
document lié.

## Feuille de route recommandée

| Étape | Contenu | Résultat |
| --- | --- | --- |
| P1 : fiabilité | Fidélité des documents, marges, fichiers identifiables, sources | Aucun contenu utile ne disparaît silencieusement |
| P1 : dossier autonome | Hiérarchie terrain, carte maîtrisée, identité des pages, distinction entrée/réseau | Fiche compréhensible hors ligne |
| P1 : #1218 | Statut essentiel et sélection fichiers/pages | Annexes réellement exploitables |
| P2 : personnalisation | Sections, aperçu, erreurs, conservation de la sélection | Dossier adapté sans surcharge de choix |
| P2 : finition | Formats, options d'échelle et lisibilité en noir et blanc | Qualité et économie d'impression |

## Critères de validation

- Une topographie portrait ou paysage est intégralement visible, avec ses
  légendes et sans déformation.
- Un PDF multipage n'ajoute que les pages choisies.
- Un document essentiel volumineux ne provoque pas une impression intégrale
  involontaire.
- Une référence sans fichier est distinguée d'une annexe imprimable.
- Une sélection comprenant plus de dix documents est respectée.
- Un fichier absent ou inaccessible produit un avertissement avant la sortie.
- Le dossier conserve auteurs, dates, licences disponibles et sources.
- Les pages isolées identifient l'entrée et leur position dans le dossier.
- Les titres et URLs ne produisent pas de coupures illisibles.
- Un long tableau d'équipement reste lisible, avec en-têtes et légendes.
- La sortie ne contient pas les formulaires d'édition ni les contrôles de
  navigation.
- Les variantes mobile et bureau produisent le même contenu sélectionné.
- La carte est correctement cadrée, attribuée et dotée d'une échelle lisible.
- L'impression tient compte des marges non imprimables.
- Les descriptions du réseau sont incluses uniquement sur choix explicite.
- La suppression de commentaires ne fait pas disparaître des informations
  terrain sans précaution.
- Les coordonnées nulles valides, par exemple une longitude de zéro, restent
  affichées.
- L'annulation et les erreurs conservent les sélections.

## Sources dans le dépôt

Les chemins suivants sont relatifs à `packages/web-app/src/` :

- `components/appli/Entry/index.jsx` : action et périmètre d'impression.
- `App.css` : règles papier globales.
- `components/common/Layouts/PageTabs.jsx` : panneaux et responsive.
- `components/common/DocumentsList/DocumentsList.jsx` : ordre et pagination.
- `components/common/DocumentsList/Document.jsx` : contenu et descriptions.
- `components/common/DocumentsList/Files.jsx` : images et liens de fichiers.
- `components/common/DocumentsList/MediaThumbnail.jsx` : proportions et recadrage.
- `components/appli/Entry/Properties.jsx` : propriétés, dangers et qualité.
- `components/appli/Descriptions/index.jsx` : descriptions du réseau.
- `components/appli/Entry/Riggings/RiggingTable.jsx` : tableaux et légendes.
- `components/common/Contribution/ContributionMetadata.jsx` : auteurs et dates.
- `components/common/PdfPreview/index.jsx` : consultation PDF existante.
- `components/common/Maps/` : carte interactive et redimensionnement.
- `types/document.type.js` : différences de métadonnées des documents.
- `components/appli/Network/index.jsx` : impression réseau similaire.

Le défaut `@page` et l'attente des ressources ont aussi été examinés dans
`node_modules/react-to-print/dist/react-to-print.js`.

## Preuves locales

Les artefacts ne sont pas versionnés. Ils sont conservés dans le dossier de
session :

```text
/home/sesa604748/.copilot/session-state/c21310c3-2bfd-4745-96a0-bdafd4debe5e/files/
```

| Artefact | Contenu |
| --- | --- |
| `entrance-print.pdf` | Export réel de trois pages A4 |
| `print-page-1.png`, `print-page-2.png`, `print-page-3.png` | Rendu des pages du PDF |
| `print-pages.json` | Texte et coordonnées extraits |
| `print-metrics.json` | Géométrie de la carte et éléments de la copie papier |
| `print-clone.html` | Copie préparée par l'action d'impression |
| `document-print-fixture.pdf` | Sortie du cas synthétique de documents |
| `document-print-fixture.png` | Capture du cas synthétique |
| `document-print-metrics.json` | Recadrage, lien PDF masqué et description absente |

Ces chemins sont locaux et ne seront pas disponibles à un lecteur du dépôt.
Les constats et mesures nécessaires à la compréhension sont donc consignés
dans cet audit.
