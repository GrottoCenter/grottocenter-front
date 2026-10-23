# Familles et sous-types d’entités : étude UI/UX

Date : 17 octobre 2026. Statut : option B retenue ; déplacement du type dans les
propriétés des fiches d’organisations et de personnes mis en œuvre. Les autres
évolutions restent des propositions. Périmètre : personnes, organisations,
documents, puis extension aux massifs et aux entrées.

## 1. Recommandation

**La famille donne un repère stable ; le sous-type apporte une précision
lisible.** Garder le pictogramme générique dans la navigation et les en-têtes.
Présenter le sous-type dans les premières propriétés de la fiche, avec son nom ;
son pictogramme est une aide complémentaire. Le retirer de la ligne sous le titre
et du badge Auteur de l’en-tête. Le fil d’Ariane reste réservé aux destinations
de navigation. Sur la carte, conserver une silhouette de marqueur
et une couleur par famille, puis différencier éventuellement le symbole central.

Ce choix prolonge les derniers ajustements des organisations. Il permet d’ajouter
des types sans demander aux utilisateurs de réapprendre la navigation.

Les « logos » étudiés ici sont les pictogrammes de classification. Le véritable
logo d’une organisation relève de son identité propre et doit rester distinct.

Cette étude est une évaluation heuristique du code et des parcours existants,
appuyée sur des références UX et d’accessibilité. Elle ne constitue pas un test
utilisateur ni un audit complet de conformité. Les difficultés anticipées et les
arbitrages proposés restent à valider sur des prototypes.

## 2. Constats dans l’application

| Surface examinée | Comportement actuel | Lecture UX |
| --- | --- | --- |
| Page d’organisation | Pictogramme générique dans l’en-tête ; type et pictogramme à la fin des métadonnées | Bonne séparation entre identité et précision ; à conserver |
| Résultats de recherche d’organisations | Nom sans pictogramme ; colonne Type avec pictogramme et texte ; `-` si type indisponible | Bon modèle pour un tableau d’une même famille |
| Popup d’organisation sur la carte | Titre seul, puis ligne pictogramme + type, puis adresse | Bon modèle de lecture progressive |
| Suggestions de recherche et de sélection | Pour les organisations, pictogramme du sous-type devant le nom, sans libellé de type | Une bibliothèque ou un organisme de recherche peut être difficile à identifier comme organisation, surtout parmi plusieurs familles |
| Cartes d’organisations dans les listes de relations | Pictogramme du sous-type devant le nom, sans libellé de type | Le sens dépend de la connaissance du dessin et du titre de la liste |
| Personnes | `CAVER` / `AUTHOR` ; pictogramme d’en-tête différent ; mention Auteur sur sa fiche ; colonne Type masquée par défaut dans la recherche | Le modèle visuel diffère de celui des organisations ; les mots suggèrent aussi une distinction de métiers qui ne correspond pas exactement aux données |
| Documents | Famille bibliographie dans les suggestions ; type dans le titre ; composant `DocumentTypeChip` avec texte et icône MUI | Le principe famille + précision existe déjà, avec des habillages variables |
| Filtres de personnes et d’organisations | Même composant de choix textuels, sans pictogrammes de type, avec coche de sélection | Bonne base commune ; les choix par défaut diffèrent : Spéléologues pour les personnes, Tous pour les organisations |
| Carte | Organisations : même marqueur jaune, symboles blancs différenciés ; types absents/inconnus : symbole générique | Bonne continuité de famille, mais contraste et reconnaissance à petite taille à améliorer |
| Couches cartographiques | Pictogrammes génériques ; les massifs deviennent des polygones au zoom détaillé | Les futurs types de massifs ne doivent pas être pensés uniquement comme des marqueurs ponctuels |

Le risque principal est le changement de sens du même emplacement : le symbole
devant un nom désigne parfois une famille, parfois son sous-type. Tous les
pictogrammes sur une carte marron partagent un style, mais ce style ne permet pas
à lui seul de retrouver leur famille.

Nielsen Norman Group souligne que la compréhension d’un pictogramme dépend de
l’expérience et que les symboles réellement universels sont rares. Le texte
visible réduit l’ambiguïté ; une infobulle seule ne remplit pas le même rôle,
notamment sur mobile. [Référence : Icon Usability](https://www.nngroup.com/articles/icon-usability/).

## 3. Clarifier ce que l’on classe

Il faut distinguer quatre informations avant de définir leur représentation :

| Information | Question | Exemple |
| --- | --- | --- |
| Famille | Quel genre de fiche vais-je ouvrir ? | Organisation, personne, entrée, massif, document |
| Sous-type | Quelle sorte d’entité est-ce ? | Club de spéléologie, bibliothèque ; livre pour un document |
| Rôle dans une relation | Que fait cette entité ici ? | Éditeur d’un document, auteur d’un document |
| État ou caractéristique | Quelle information supplémentaire faut-il connaître ? | Fiche supprimée, partenaire officiel, restriction d’accès |

### Personnes

Dans le code, `AUTHOR` représente une fiche d’attribution sans compte ; `CAVER`
représente une personne disposant d’un compte. Une personne avec compte peut aussi
être auteur de documents. « Spéléologue » et « Auteur » ne sont donc pas deux
activités exclusives.

Libellés retenus : **« Type »**, avec **« Spéléologue » / « Auteur »**. La
distinction liée au compte reste expliquée dans les fiches d’auteurs et lors de
leur création. Garder les identifiants techniques et les routes actuels ; ne pas
ajouter cette explication à chaque référence à une personne.

### Organisations

Un club peut publier un document ou posséder un fonds documentaire. Son rôle
d’éditeur dans une relation ne transforme pas son type principal en Éditeur.
Conserver les présélections contextuelles lors d’une nouvelle création depuis un
document, en les laissant modifiables. Ne pas limiter les organisations existantes
proposées dans ces champs à celles dont le type correspond au nom du rôle.

Pour l’instant, garder le type unique existant. Si des cas hybrides récurrents
apparaissent, étudier des activités complémentaires avant de passer à plusieurs
types : cela modifierait la recherche, les règles de formulaire et la carte.

Les règles métier doivent être identifiées séparément des choix de pictogrammes.
Un changement de type ne doit pas supprimer silencieusement des relations ou des
données historiques. Leur traitement doit faire l’objet d’une décision explicite.

### Entrées et massifs

Pour chaque future classification, définir : la question à laquelle elle répond,
ses valeurs, leur exclusivité éventuelle et son utilité dans la recherche.

Pour une entrée, une nature physique, une caractéristique aquatique et une
restriction d’accès sont potentiellement des axes différents. Les regrouper dans
une seule liste produirait des choix qui peuvent se cumuler. Ces exemples sont
des axes de réflexion, pas une nomenclature proposée. Un réseau reste une cave
liée à plusieurs entrées, pas un sous-type d’entrée.

Pour les massifs, valider d’abord ce que distinguent les futurs types. Ne pas
inventer de pictogrammes ni de nouvelles couleurs avant cette clarification.

## 4. Trois options

| Option | Principe | Avantages | Limites |
| --- | --- | --- | --- |
| A — Famille et texte | Pictogramme générique partout ; sous-type seulement écrit | Très stable, peu de symboles à apprendre, extension peu coûteuse | Différenciation des types faible sur la carte et dans les longues listes |
| B — Famille stable, sous-type accompagné — recommandée | Générique pour navigation/en-tête ; pictogramme + nom du sous-type dans les métadonnées ; symbole spécialisé possible sur la carte | Préserve les repères et les dessins existants ; permet l’apprentissage ; s’étend aux autres familles | Demande une règle précise par contexte et des symboles lisibles à petite taille |
| C — Sous-type comme identité | Chaque sous-type remplace le générique dans la plupart des écrans, éventuellement avec sa couleur | Différenciation immédiate pour les utilisateurs qui connaissent les symboles | Beaucoup de symboles à mémoriser ; confusion entre familles ; multiplication des couleurs et des variantes |

L’option B est le meilleur compromis proposé pour Grottocenter. L’option A reste
une bonne solution de repli pour une famille dont les sous-types ne disposent pas
encore de symboles suffisamment distincts. L’option C paraît peu adaptée à une
application qui accueille plusieurs familles et de nouveaux utilisateurs.

## 5. Règles d’affichage proposées

| Contexte | Repère de famille | Présentation du sous-type |
| --- | --- | --- |
| Navigation, choix d’entité à créer | Pictogramme générique + nom de famille | Pas de déclinaison du menu par sous-type |
| En-tête de fiche | Pictogramme générique + nom de l’entité | Type déplacé dans les premières propriétés du contenu, avec pictogramme + libellé ; aucune duplication dans l’en-tête ou le fil d’Ariane |
| Recherche mélangeant plusieurs familles | Pictogramme générique à gauche | Seconde ligne « Organisation · Club de spéléologie » ; un seul pictogramme principal suffit |
| Tableau d’une seule famille | Famille indiquée par le contexte | Colonne Type : pictogramme + libellé ; aucun pictogramme de type dans la colonne Nom |
| Résultats sur mobile | Famille portée par le contexte de recherche | Conserver le type écrit sur une ligne secondaire, même lorsque le tableau devient une carte |
| Liste d’associations, de membres ou de références | Générique à côté du nom si un pictogramme est nécessaire | Libellé secondaire si le type aide à choisir ou comparer ; l’omettre dans une référence compacte si le rôle et le contexte suffisent |
| Document : éditeur, bibliothèque, auteur | Le titre de propriété exprime le rôle ; le nom reste prioritaire | Ne pas répéter systématiquement le type principal ; le montrer dans le sélecteur ou si nécessaire pour désambiguïser |
| Filtre de recherche | Titre explicite « Type d’organisation », « Type de document »… | Choix textuels sans pictogrammes ; sélection signalée par coche et état visuel |
| Formulaire de création/modification | Nom explicite du champ | Pictogramme + libellé dans les choix si utiles ; courte aide pour les catégories ambiguës |
| Marqueur cartographique | Silhouette et couleur stables par famille | Symbole central simplifié, éventuellement générique si la distinction n’est pas fiable |
| Popup cartographique | Nom en premier | Ligne dédiée pictogramme + nom du type, comme actuellement pour les organisations |

Exemple de hiérarchie dans une recherche mélangeant les familles :

```text
[organisation]  GUCEM
                Organisation · Club de spéléologie

[document]      Les explorations du massif
                Document · Livre

[personne]      Marie Dupont
                Personne · Auteur
```

Le nom reste la première information. Ne pas empiler deux petits pictogrammes ni
ajouter une miniature de sous-type dans un coin du symbole générique : cela
augmente les détails sans garantir la compréhension.

### Densité et filtres

Réutiliser `EntityTypeFilter`. Les trois choix des personnes peuvent rester
visibles. Pour les organisations, vérifier les sept types et Tous dans les langues
aux libellés les plus longs et sur mobile. Si les choix occupent trop de lignes,
utiliser un select affichant la valeur courante ; pour un catalogue plus grand,
prévoir une recherche dans les options. Garder le même modèle de sélection entre
les variantes, sans imposer le même encombrement.

Conserver une sélection unique tant que la recherche fonctionne ainsi. Un
éventuel passage à plusieurs types doit rendre explicite l’union des choix et
faire disparaître l’ambiguïté entre Tous et les valeurs particulières.

Pour les organisations, conserver **Tous par défaut**, incluant les fiches sans
type. Prévoir un filtre **Non renseigné** pour aider la classification progressive,
avec le support API nécessaire. Pour les personnes, garder Spéléologues par
défaut peut se justifier depuis une entrée « Spéléologues » ; depuis une entrée
« Personnes », Tous serait plus cohérent. Cette évolution de libellé et de défaut
est à décider ensemble.

Différencier une information statique d’un contrôle : un type affiché dans une
fiche ne doit pas sembler être un filtre cliquable. Un même composant graphique
ne doit pas introduire une fausse promesse d’interaction.

### Données manquantes

- Tableau : conserver `-`, sans pictogramme ; fournir un libellé accessible de
  remplacement contextualisé : « Type non renseigné » ou « Type inconnu » selon
  l’état de la donnée.
- Fiche : texte discret « Type non renseigné » pour une valeur absente ; « Type
  inconnu » pour une valeur reçue mais non reconnue. Ne pas afficher le code brut.
- Carte : marqueur générique ; aucune attribution implicite au type Club.
- Édition d’organisation : continuer à exiger une classification valide, y compris
  pour les anciennes fiches, conformément à la décision actuelle.
- Le maintien temporaire des sections d’exploration pour les organisations sans
  type concerne l’affichage de la page, pas la classification stockée.

Ne pas confondre une valeur absente avec un éventuel type métier « Autre ».

## 6. Carte et qualité des pictogrammes

### Garder le jaune comme repère, examiner le contraste

Les marqueurs utilisaient initialement `amber[500]`, soit `#ffc107`. Calcul du
contraste selon la luminance relative sRGB, à partir des aplats définis dans les
sources, sans simulation du fond cartographique ni de l’anticrénelage :

| Association | Rapport mesuré | Conséquence |
| --- | --- | --- |
| Blanc `#ffffff` / jaune `#ffc107` | 1,63:1 | Faible pour distinguer un symbole central nécessaire à la compréhension |
| Blanc `#ffffff` / jaune sombre `#ad8205` | 3,52:1 | Première variante appliquée, ensuite jugée trop terne |
| Blanc `#ffffff` / jaune lumineux `#d19a00` | 2,52:1 | Variante finalement retenue pour sa luminosité ; contraste blanc plus faible |
| Blanc / orange du secours `#f57c00` | 2,70:1 | À revoir également si la croix porte une information indispensable |
| Blanc / marron `#5d4037` | 9,32:1 | Bonne séparation des aplats des pictogrammes habituels |
| Marron `#5d4037` / jaune `#ffc107` | 5,72:1 | Alternative contrastée en conservant exactement le jaune actuel |

Le critère WCAG 1.4.11 demande au moins 3:1 pour les parties graphiques nécessaires
à la compréhension, avec des exceptions. Ces mesures identifient un risque précis,
pas une conclusion de conformité sur l’application entière.
[Référence : contraste non textuel](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html).

Deux variantes à comparer :

1. Jaune actuel conservé, symbole sombre : meilleure séparation mesurée, mais
   évolution de la préférence actuelle pour des symboles blancs.
2. Symbole blanc conservé, fond ambre plus sombre ou support sombre local : garder
   un contour jaune de famille et mesurer les contrastes de la composition finale.

Choix utilisateur final : conserver uniquement le blanc et une teinte jaune,
en appliquant le jaune lumineux `#d19a00` aux marqueurs génériques et aux sept
sous-types, ainsi qu’aux clusters d’organisations. La couleur est partagée dans
`mapMarkerColors.js`. Les clusters ont un fond opaque et des chiffres blancs ;
leur survol ne modifie plus la teinte. Le contour extérieur reste blanc ; la
découpe de la fenêtre du marqueur générique utilise le même jaune lumineux.

Si blanc et jaune clair doivent tous deux rester, un simple agrandissement du
dessin ne règle pas leur faible contraste. Le support sombre peut être un
compromis, à vérifier visuellement avant adoption. Ne pas décider à partir du
seul aperçu du SVG sur fond uni.

### Simplification et niveaux de zoom

- Garder les silhouettes distinctes des familles ; la couleur seule ne doit pas
  porter leur sens. [Référence : usage de la couleur](https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html).
- Examiner chaque symbole dans son rendu réel, notamment à 16, 20 et environ
  30 pixels, sur un fond cartographique chargé et sur mobile.
- Privilégier une silhouette dominante et des espaces négatifs nets. Pour le club,
  garder la maison validée et vérifier que le personnage reste lisible à la taille
  du marqueur ; comparer une variante simplifiée si nécessaire.
- Conserver le même sens entre les versions marron de l’interface et les versions
  monochromes de la carte, sans imposer les mêmes détails internes.
- À faible zoom, un regroupement de plusieurs types affiche un compteur et un
  repère de famille ; ne pas lui attribuer le symbole d’un seul de ses membres.
- Pour un massif polygonal, commencer par le filtre, la légende et la popup. Une
  couleur par sous-type risquerait de concurrencer les autres informations de la
  carte. N’ajouter un codage de surface qu’en présence d’un besoin de comparaison.
- La disponibilité effective des types dans la carte globale dépend aussi des
  données et endpoints disponibles ; une règle visuelle ne suffit pas à les y
  faire apparaître.

### Accessibilité des informations

Le texte visible accompagne les pictogrammes dans les listes et les fiches.
Lorsqu’un pictogramme répète ce texte, le masquer aux technologies d’assistance
pour éviter une double annonce (`alt=""` pour une image).
[Référence : images décoratives et texte adjacent](https://www.w3.org/WAI/tutorials/images/decorative/).

Pour les marqueurs interactifs, prévoir un nom accessible explicite, un accès
clavier et une popup utilisable au toucher. Une infobulle au survol seule ne doit
pas être nécessaire pour découvrir le type. Vérifier les états de sélection et
le focus des filtres ; pour un choix exclusif, un groupe de boutons radio constitue
une option sémantique à examiner, sans présumer que le groupe actuel de boutons
pressés est à lui seul une non-conformité.

## 7. Mise en œuvre proposée après décision

| Priorité | Travail | Résultat attendu |
| --- | --- | --- |
| 1 | Valider la distinction famille/type/rôle et les libellés des personnes | Une définition courte par catégorie ; aucune opposition trompeuse entre auteur et personne avec compte |
| 2 | Formaliser les règles de la section 5 ; corriger d’abord les suggestions mixtes et les cartes d’associations | Une famille reconnaissable sans connaître le dessin du sous-type |
| 3 | Comparer les deux variantes de contraste et vérifier les pictogrammes à leur taille réelle | Des marqueurs compréhensibles sur la carte, avec le jaune comme repère d’organisation |
| 4 | Harmoniser les métadonnées de type et les états absents/inconnus | Libellés et comportement cohérents entre personnes, organisations et documents |
| 5 | Adapter la densité des filtres au mobile et aux traductions | Des types accessibles sans prendre toute la place avant les résultats |
| 6 | Définir les futurs axes des entrées et massifs, puis reprendre les mêmes règles de présentation | Extension sans nouvelle convention visuelle à apprendre |

Côté code, réutiliser les registres et composants existants :
`organizationTypes`, `organizationIcons`, `documentTypeHelpers`, `EntityTypeFilter`,
`OrganizationIcon` et `DocumentTypeChip`. En extraire une présentation commune
seulement là où les concepts sont réellement identiques : libellé, pictogramme,
valeur absente. Garder les politiques métier et capacités propres à chaque famille.
Éviter un composant universel cumulant toute la logique des entités.

Créer des exemples Storybook représentant les contextes, les longues traductions,
les valeurs absentes et le mobile. Réutiliser les tests existants pour vérifier les
parcours lors de l’implémentation ; ne pas figer seulement une correspondance entre
enum et fichier SVG.

## 8. Validation utilisateur

Organiser une première session formative avec environ six à huit personnes,
incluant des nouveaux venus et des contributeurs réguliers. Couvrir le mobile,
le clavier et plusieurs langues ; adapter le recrutement si certains besoins
d’accessibilité ne sont pas représentés. Ce petit échantillon sert à découvrir les
problèmes, pas à produire des taux statistiquement généralisables.

Comparer les options A et B sur le même contenu, en alternant l’ordre de
présentation. Tester les variantes de marqueurs à part pour éviter de confondre
un effet de contraste avec un effet de mise en page.

Tâches proposées :

1. Retrouver un club dans une recherche contenant également des documents et des
   personnes, puis dire quelle fiche s’ouvrira avant de cliquer.
2. Distinguer une organisation de recherche d’un document scientifique.
3. Sélectionner l’éditeur d’un document lorsque celui-ci est un club.
4. Comprendre pourquoi une personne avec compte peut aussi être auteur.
5. Retrouver une organisation non classifiée avec le filtre Tous.
6. Repérer une organisation puis identifier son type sur une carte chargée, à
   deux niveaux de zoom et au toucher.
7. Sur un prototype seulement, interpréter un futur type d’entrée ou de massif
   sans explication préalable de nouvelles conventions visuelles.

Observer la famille anticipée, le type compris, les erreurs de sélection, le
besoin d’aide, le temps de recherche et la capacité à retrouver le repère après
quelques minutes. Demander ce que représente un symbole avant d’expliquer son
sens. Une préférence esthétique seule ne suffit pas pour choisir la variante.

Critères de décision : aucune confusion récurrente entre familles ; sens du type
compréhensible grâce au texte ; valeur absente non interprétée comme Club ; choix
possible au clavier et au toucher ; contrastes vérifiés pour les informations
graphiques essentielles. Revoir le prototype si ces conditions ne sont pas réunies.

## 9. Points d’ancrage dans le dépôt

- [Fiche organisation](../../packages/web-app/src/components/appli/Organization/index.jsx)
  et [fiche personne](../../packages/web-app/src/components/appli/Person/Person.jsx).
- [Colonnes et rendus des résultats](../../packages/web-app/src/components/common/EntityTable/entitiesConfig.jsx).
- [Suggestions de recherche/sélection](../../packages/web-app/src/helpers/Entity.jsx).
- [Cartes des listes de relations](../../packages/web-app/src/components/common/entitiesList/EntitiesListItem.jsx).
- [Filtre partagé](../../packages/web-app/src/components/appli/AdvancedSearch/EntityTypeFilter.jsx),
  [recherche de personnes](../../packages/web-app/src/components/appli/AdvancedSearch/PersonSearch.jsx)
  et [recherche d’organisations](../../packages/web-app/src/components/appli/AdvancedSearch/OrganizationsSearch.jsx).
- [Types d’organisations et compatibilité historique](../../packages/web-app/src/utils/organizationTypes.js),
  [pictogrammes](../../packages/web-app/src/utils/organizationIcons.js)
  et [marqueurs](../../packages/web-app/src/components/common/Maps/common/Markers/Components/OrganizationMarker.jsx).
- [Popup organisation](../../packages/web-app/src/components/common/Maps/common/Markers/Components/OrganizationPopup.jsx)
  et [couches cartographiques](../../packages/web-app/src/components/common/Maps/MapClusters/DataDisplayControl.jsx).
- [Type de document](../../packages/web-app/src/components/common/DocumentTypeChip.jsx).
- [Plan de l’issue 1374 et décisions existantes](organization-types-1374.md).

## 10. Première mise en œuvre

Le déplacement des types dans le contenu des fiches est réalisé :

- Organisations : type et pictogramme en premier dans un encart commun avec les
  statistiques, avant Contact dans la colonne de droite ; retrait de la ligne
  sous le titre. Le type et les compteurs sont côte à côte quand la largeur
  disponible le permet. Les compteurs ont des libellés visibles et des icônes
  réduites. Sur mobile, cet encart précède la carte, les compteurs forment une
  grille 2 × 2 et la carte mesure 240 px de haut, avec le plein écran conservé.
- Personnes : nouveau pictogramme générique commun dans l’en-tête ; retrait du
  badge Auteur ; propriété « Type » avant le pseudo, avec pictogramme et texte
  « Spéléologue » ou « Auteur ». Le badge « Vous » et
  l’explication des fiches d’auteurs sans compte sont conservés.
- Les libellés réutilisent les traductions existantes dans les quinze langues du
  dépôt. Les trois clés spécifiques introduites initialement ont été supprimées.
- Le reste de l’étude, notamment les recherches mixtes et les variantes de
  contraste de la carte, constitue la suite proposée et n’est pas inclus dans
  cette première mise en œuvre.

Vérifications : six parcours Cypress d’organisations et cinq parcours de personnes
passent sur Electron, avec vues ordinateur et mobile et inspection des captures.
La première exécution des parcours de personnes a rencontré le chargement initial
du profil ; une attente explicite de la réponse API remplace l’attente implicite
de quatre secondes. Les catalogues sont synchronisés et triés.
Ces parcours ont été exécutés avant le dernier ajustement des libellés ; leurs
attentes ont été actualisées sans nouvelle exécution pour cette modification de
texte.
Le contrôle ESLint complet sur les fichiers JavaScript/JSX modifiés passe sans
erreur ni avertissement. Le formatage conserve les fermetures de balises sur la
même ligne, conformément au contrôle Prettier intégré à ESLint.

Vitest n’a exécuté aucun des tests ciblés dans cette session : les workers ont
dépassé leur délai de démarrage, d’abord en mode forks puis en mode threads sur le
test Person seul. La relance utilise `--pool=threads --maxWorkers=1
--testTimeout=15000` ; l’échec concerne le démarrage du worker, avant les tests,
et ne valide donc pas les assertions unitaires.

## 11. Extension de l’identité Personnes et règles pour les références

Cette partie complète l’étude après le déplacement des types dans les fiches et
la simplification des libellés en « Type », « Spéléologue » et « Auteur ». Les
changements décrits ci-dessous sont désormais implémentés.

### Décision recommandée pour la recherche de personnes

Renommer l’entrée du menu et le titre de la recherche **Personnes**, avec le
pictogramme générique `person`. Conserver ce titre et ce pictogramme lorsque le
filtre change. Proposer **Tous / Spéléologues / Auteurs**, avec **Spéléologues par
défaut**, conformément au choix utilisateur final. « Tout effacer » rétablit
également Spéléologues. Tous et Auteurs restent disponibles ; le titre Personnes
et son pictogramme générique restent stables quel que soit le filtre.

Le changement doit couvrir le filtre initial d’`EntitySearchPage`, l’état initial
de `PersonSearch` et sa remise à zéro. Modifier uniquement le choix visible
pourrait laisser une recherche initiale limitée aux spéléologues.

Dans la colonne Type, ajouter le pictogramme spécifique à côté du libellé,
comme pour les organisations. La rendre visible par défaut dans cette recherche,
en respectant les préférences de colonnes enregistrées. Actuellement, cette colonne
est masquée par défaut dans la configuration ; la capture utilisateur la montre
après personnalisation. Sur mobile, garder le type sur une ligne secondaire et
le pictogramme générique près du nom. Ne pas répéter le pictogramme spécifique
dans la colonne du nom.

Les libellés Spéléologue et Auteur restent donc utilisés pour les types. Le nom
de la famille dans la navigation devient Personnes. Aucun changement de route
ou d’identifiant API n’est nécessaire pour ce renommage.

### Trois niveaux de présentation des références

| Situation | Présentation recommandée | Exemple |
| --- | --- | --- |
| Le contexte dit déjà clairement de quelle famille il s’agit | Nom lié seul si le pictogramme n’apporte rien | « Saisi par Marie Dupont » ; liste compacte de membres |
| Il faut reconnaître la famille de la fiche liée | Pictogramme générique + nom | Recherche rapide générale ; choix Personne / Organisation |
| Il faut comparer ou comprendre les sous-types | Pictogramme spécifique + libellé dans un emplacement dédié ou dans la référence concernée | Auteurs d’un document et leur sélection ; colonne Type ; propriété Type d’une fiche ; choix d’un type lors de la création |

La règle par défaut pour une référence est donc **la famille, quand un pictogramme
est utile**. Le pictogramme spécialisé accompagne une information de type
explicite. Il ne remplace pas automatiquement le pictogramme de la fiche liée.

**Exception explicitement retenue : les auteurs d’un document.** Le type de la
personne apporte ici une information utile : il permet de distinguer un
spéléologue disposant d’un compte d’une fiche d’auteur sans compte. Employer le
pictogramme spécifique correspondant au type réel et un libellé visible, dans
la liste d’auteurs de la fiche et dans le sélecteur d’auteurs du formulaire.
Conserver les libellés courts validés « Spéléologue » et « Auteur » ; l’explication
du fonctionnement des comptes reste contextuelle.

Exemple de présentation dans le détail des auteurs :

```text
Auteurs
[casque] Marie Dupont — Spéléologue
[plume] Jean Martin — Auteur
[organisation] GUCEM
```

Le rôle Auteur ne doit pas déterminer le pictogramme de classification de la
personne : un spéléologue peut écrire un document. De même, le rôle Éditeur ne
transforme pas un club en organisation de type Éditeur. Si les sous-types sont
utiles dans un sélecteur, ajouter une seconde ligne écrite plutôt que remplacer
le pictogramme principal : « Organisation · Club de spéléologie ». Dans le
sélecteur spécialisé des auteurs, le pictogramme spécifique de la personne et le
libellé Spéléologue/Auteur peuvent remplacer le générique. Ne pas ajouter un
second pictogramme Personne à côté. Les citations bibliographiques et leurs
exports conservent leurs noms et leur format, sans ces annotations d’interface.

Les références partielles ne contiennent pas toutes un type. `PersonCard`, par
exemple, ne réclame actuellement que l’identifiant et le pseudo dans ses PropTypes.
Employer le générique reste correct quand le type est absent et évite de charger
chaque fiche uniquement pour choisir son dessin. Ne pas assimiler un type absent
ou inconnu à Spéléologue. Dans une colonne Type, utiliser `-` sans pictogramme
spécifique lorsque la donnée n’est pas reconnue.

Le modèle `types/author.type.js` et le `simpleCaverType` des formulaires de
documents ne déclarent actuellement pas le type de la personne. Cela ne prouve
pas son absence dans les réponses API : vérifier les payloads, la recherche et
les transformations, puis préserver ce champ dans les références et leurs
PropTypes. Si le type manque ou n’est pas reconnu, afficher uniquement le
pictogramme générique dans la référence, sans ajouter « inconnu ». Lire le type
directement dans les données reçues : aucune requête de complément, aucun cache
de types de personnes, aucune classification déduite du rôle d’auteur.

### Emplacements recensés et traitement proposé

| Emplacement | Constat | Suite proposée |
| --- | --- | --- |
| `pages/Persons.jsx` et `SideMenu/MenuLinks.jsx` | Titre/menu Spéléologues ; pictogramme du casque | Personnes + pictogramme `person` |
| `AdvancedSearch/EntitySearchPage.jsx` | La famille `persons` est associée à `caver` | Associer cette famille à `person` |
| `AdvancedSearch/PersonSearch.jsx` | Filtre initial et remise à zéro sur `CAVER` | Conserver Spéléologues par défaut et après remise à zéro ; respecter les accès explicitement filtrés |
| `EntityTable/entitiesConfig.jsx` | Icône mobile spécifique, Type textuel masqué par défaut ; code inconnu affichable brut | Générique près du nom ; Type visible par défaut avec spécifique + texte ; remplacement neutre pour les valeurs inconnues |
| `helpers/Entity.jsx` | Suggestions de personnes spécifiques, organisations spécifiques sans libellé | Générique par famille ; sous-type écrit en seconde ligne lorsque pertinent |
| `entitiesList/EntitiesListItem.jsx` | `PersonCard` utilise toujours le casque ; `OrganizationCard` utilise le sous-type | Générique pour les références ; ajouter le type écrit si la liste nécessite de comparer les types |
| `DocumentDetails/index.jsx` | Auteurs personnes toujours représentés par le casque ; auteurs organisations par leur sous-type | Pour les personnes, spécifique selon le type réel + libellé Spéléologue/Auteur ; générique si type absent/inconnu ; préserver les citations bibliographiques |
| `AuthorsSection/index.jsx` | Choix Personne / Organisation avec casque pour Personne | Pictogramme `person` pour le choix de famille ; dans le sélecteur et les références choisies, rendre le type réel Spéléologue/Auteur visible |
| `card/Deleted.jsx` et dialogue de suppression de `Person.jsx` | Identité `person` encore associée au casque ou au sous-type | Générique dans la confirmation d’identité de la fiche ; type écrit si utile pour éviter une mauvaise sélection |
| `CaveProperties/OrganizationProperty` et références éditeur/bibliothèque | Sous-type d’organisation devant son nom | Générique pour la référence ; rôle porté par le libellé du champ |
| Accueil : `HeroStats.jsx` et `DataHomepage/index.jsx` | Compteur `users`, libellé Spéléologues et casque, lien vers `/persons` | Vérifier la population réellement comptée ; si c’est celle des spéléologues, conserver ce sens et proposer un lien qui ouvre le filtre correspondant |
| Statistiques des membres d’organisation | Compteur de spéléologues et casque | Le spécifique peut rester : le sujet est une mesure ciblée, pas l’identité générique d’une fiche |

Pour les compteurs d’accueil, ne pas renommer simplement le nombre de
spéléologues en nombre de personnes : il pourrait ne pas inclure les auteurs.
Le code consulte le compteur `users` ; la population exacte doit être confirmée
avant de changer son intitulé. Un lien filtré exige également de mettre en place
la lecture du filtre dans l’URL, absente des composants de recherche examinés.

### Où conserver les pictogrammes spécifiques

Conserver les pictogrammes de sous-types dans la propriété Type des fiches,
les colonnes Type, les choix explicites de classification et les informations
cartographiques selon la convention déjà retenue, ainsi que dans les références
et sélecteurs d’auteurs des documents. Les compteurs ou actions
explicitement consacrés à un sous-type peuvent aussi les employer avec un libellé
clair. Une ligne de filtre Personnes reste textuelle, sans pictogramme de type.

La carte conserve sa règle propre : silhouette/couleur de famille et symbole
central éventuellement spécifique, complété par le type écrit dans la popup.
Ce traitement sert à repérer des objets dans l’espace ; il ne justifie pas de
réutiliser systématiquement ces symboles dans les références textuelles.

Les futurs types d’entrées et de massifs suivent la même distinction : référence
vers une entrée ou un massif = repère de famille ; information Type = libellé et
éventuel pictogramme spécialisé.

### Ordre de réalisation

1. Harmoniser la rubrique Personnes : menu, titre, pictogramme, valeur Spéléologues,
   colonne Type et rendu mobile, y compris la remise à zéro de la recherche.
2. Harmoniser les références communes : suggestions et sélecteurs, cartes de
   relations, auteurs de documents, références d’organisations et confirmations
   de suppression. Réutiliser une correspondance partagée pour les libellés et
   pictogrammes de types ; garder le repère générique indépendant du type reçu.
3. Vérifier les compteurs, leurs libellés et leurs liens ; conserver les
   pictogrammes spécifiques lorsqu’ils représentent réellement un sous-type.

Tester en priorité : passage Tous → Auteurs → Spéléologues sans changement du
titre de famille ; recherche initiale et remise à zéro sur Spéléologues ;
référence à un auteur de document qui est aussi spéléologue ; auteurs mêlant
personnes et organisations ; référence sans type ; lecture de la colonne Type et
de son équivalent sur mobile. L’extension est implémentée ; elle n’a pas encore
été testée auprès d’utilisateurs. Les parcours des documents vérifient également
qu’aucune fiche de personne n’est demandée pour compléter son type.

La cohérence des repères réduit les conventions à apprendre, sans imposer le
même niveau de détail dans tous les contextes.
[Référence : NN/g, Consistency and Standards](https://www.nngroup.com/articles/consistency-and-standards/).

### Vérifications de l’extension

ESLint passe sur les fichiers JavaScript/JSX modifiés, sans erreur ni
avertissement. Les quatre suites ciblées `entitiesConfig.test`,
`OrganizationsSearch.test`, `documentModeration.test` et
`OrganizationPresentation.test` passent : 40 tests, avec
`--run --maxWorkers=1 --testTimeout=15000`.

Les cinq parcours `entity-identities.cy.js` passent sur Electron : recherche
Personnes sur ordinateur et petit écran, lien filtré Auteurs, références
d’auteurs avec et sans type, et sélection d’auteurs dans le formulaire. Les deux
parcours de documents vérifient l’absence de requêtes vers les fiches personnes
pour compléter leur type. Les six parcours d’organisations et les cinq parcours
de fiches personnes ont également passé lors de la vérification de leurs écrans.
