# Export des entrées de la zone — issue #1458

Mise à jour : 25 novembre 2026. Branche : `feat/map-entrance-export`.
Référence : [issue #1458](https://github.com/GrottoCenter/grottocenter-front/issues/1458).

## Périmètre retenu

L’utilisateur demande un export public pour préparer une sortie terrain, accessible
par le menu clic droit ou appui long de la carte. La fenêtre conserve les formats
GPX (par défaut), KML et GeoJSON, avec nom, coordonnées WGS84 et lien vers la fiche.

La dernière décision simplifie le périmètre : exporter **toutes les entrées
publiques dans les bornes géographiques de la carte**, sans les filtres de taille,
de qualité des données et d’intérêt. Cette règle s’applique également lorsque la
couche des entrées est masquée. Les entrées sensibles ne sont pas exportées.
La prévisualisation et le compteur ont été retirés.

## Interface

Le thème MUI et StandardDialog existants sont conservés, en mode Operate selon
Impeccable. Une alerte d’information reste visible avant les choix de format :

> Toutes les entrées publiques de la zone affichée seront exportées. Les filtres
> de taille, de qualité des données et d’intérêt sont ignorés.

La fenêtre est compacte sur ordinateur et plein écran sous le seuil mobile, avec
actions accessibles en bas. Les boutons conservent au moins 44 px de hauteur,
y compris en paysage. Le menu est également accessible par Shift+F10 et la touche
Menu contextuel. Fermer la fenêtre rétablit le focus sur la carte et annule les
requêtes, empêchant un téléchargement tardif.

Le chargement commence au clic sur Télécharger. Une zone vide, un fichier invalide
ou incomplet, une erreur de requête, le mode hors ligne et le dépassement de la
limite ont un retour explicite. Les erreurs temporaires offrent Réessayer en
conservant le format. Une zone vide ou trop peuplée demande de fermer la fenêtre
et de choisir une autre zone ; au-delà de la limite, le message demande de zoomer.

## Requête directe

Aucun changement du backend. Le front appelle directement :

```text
POST /api/v1/advanced-search/export?format=gpx|kml|geojson
```

```json
{
  "entity": "entrances",
  "query": "*",
  "matchAllFields": true,
  "filter": {
    "latitude": [45.2, 45.4],
    "longitude": [5.7, 5.9],
    "isSensitive": false
  },
  "columns": ["name"]
}
```

Cette requête reste courte quel que soit le nombre d’entrées. L’ancienne liste
`filter.id` déclenchait l’erreur Typesense de 4 000 caractères ; elle a disparu,
ainsi que le hook de prévisualisation et sa clé de cache. L’état de téléchargement
est géré par une mutation TanStack Query, sans tentative automatique.

La zone est figée à l’ouverture avec `map.getBounds()`, indépendamment des
déplacements GPS suivants. Une carte tournée utilise sa boîte géographique
englobante. Les longitudes sont normalisées ; un passage de l’antiméridien
déclenche deux exports dont les enregistrements sont fusionnés dans un seul
fichier. Un affichage couvrant plusieurs tours du monde utilise [-180, 180].

## Limites et validation des fichiers

La limite de surface de 35 000 km² concernait la route géographique utilisée
par l’ancienne prévisualisation ; elle n’est plus appliquée à l’export. L’API
d’export conserve sa limite de **10 000 entrées**, également vérifiée sur le
résultat fusionné. Son erreur HTTP 400 est reconnue et expliquée par un message
invitant à zoomer.

Les sérialiseurs de l’API génèrent les fichiers. Avant téléchargement, le front
parse le document entier et vérifie les coordonnées, les bornes, les liens
canoniques, les doublons et la limite. Un fichier vide n’est pas enregistré.
Sans compteur séparé, il ne peut pas prouver qu’un fichier syntaxiquement valide
contient tous les résultats si le serveur l’a clos prématurément.

## Preuves et vérification

- Vérification réelle de la requête ci-dessus : HTTP 200 dans les trois formats,
  498 points dans chaque fichier ; coordonnées GeoJSON dans la zone demandée.
- Vérification réelle de la limite mondiale : réponse API
  `{"message":"To be exported a search cannot contain more than 10000 results"}`.
- Tests unitaires : capture Leaflet, grandes zones, monde et antiméridien,
  requêtes sans identifiants, validation/fusion des trois formats, limites et
  fichiers invalides ; dialogue sans prévisualisation, 500 entrées, choix du
  format, erreur/réessai, hors ligne, annulation et réponse tardive.
- Cypress : les trois formats incluent les entrées masquées par les filtres
  actifs ; export interdit d’appeler une prévisualisation advanced-search ;
  clavier, français mobile, paysage, états chargement/vide/erreur et hors ligne.
- Les sept messages modifiés sont traduits dans les 15 catalogues, triés et
  synchronisés.

Validation automatisée : 75 tests unitaires passent dans six fichiers avec
`--maxWorkers=1 --testTimeout=15000` ; les 10 scénarios Cypress passent sur le
serveur de développement puis sur le build de production (aperçu Vite, 72 s).
`yarn.cmd build` réussit. ESLint passe sur les fichiers JavaScript/JSX modifiés,
les catalogues sont triés/synchronisés et les 225 messages d’export passent le
parseur ICU, sans BOM. Le détecteur Impeccable ne signale aucun problème.

Commandes principales :

```powershell
yarn.cmd test src/utils/mapEntranceExport.test.js src/components/common/Maps/MapClusters/MapExportDialog.test.jsx src/actions/Advancedsearch.test.js src/api/client.test.js src/api/queryKeys.test.js src/components/common/Maps/MapClusters/PopupTargetHandler.test.jsx --maxWorkers=1 --testTimeout=15000
yarn.cmd build
Remove-Item Env:ELECTRON_RUN_AS_NODE -ErrorAction SilentlyContinue
yarn.cmd workspace @grotto-front/web-app exec cypress run --spec cypress/e2e/map-entrance-export.cy.js --browser electron --config baseUrl=http://127.0.0.1:3001/ui,defaultCommandTimeout=10000
yarn.cmd translations:sync-with-en --check
yarn.cmd translations:check-sorted
```

La qualification sur appareils physiques et l’import dans de vraies applications
GPS restent à faire. Les captures et résultats de la revue visuelle sont indiqués
dans le brief de surface.
