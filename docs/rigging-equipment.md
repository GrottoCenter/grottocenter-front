# Estimation du matériel d’une feuille d’équipement

Le récapitulatif de chaque feuille affiche, à côté des cordes, les quantités
estimées de plaquettes, mousquetons, goujons, AS et cordelettes. Les catégories sans
quantité reconnue sont masquées. Chaque quantité porte `~` ; les alternatives
donnent une fourchette min–max par catégorie, additionnée entre les lignes.
Les minima et maxima de catégories différentes ne désignent pas nécessairement
une même option d’équipement.

Conversions utilisées pour un point :

| Notation | Matériel |
| --- | --- |
| S / spit | 1 plaquette + 1 mousqueton |
| B / broche | 1 mousqueton |
| G / goujon / EB | 1 goujon + 1 plaquette + 1 mousqueton |
| P / piton | 1 mousqueton |
| AS / SA | 1 AS |
| AF / DA, AN / NA | 1 cordelette |
| dev / redir | 1 cordelette + 1 mousqueton |
| dev/S | 1 plaquette + 1 cordelette + 1 mousqueton |
| dev/G | 1 goujon + 1 plaquette + 1 cordelette + 1 mousqueton |

Les quantités explicites de matériel sont additionnées. Une relation directe
comme `4 mousquetons sur 4 broches` évite de compter deux fois les mêmes
connecteurs ; `3 mousquetons / 1 DEVIA` reste une addition de 4 mousquetons.
Les points facultatifs sont inclus : `3 Spits (1 facultatif)` compte 3,
`3S (+1S facultatif)` compte 4. Les déviations sont associées à leur support
uniquement dans une expression locale, jamais entre deux lignes.

`2AF ou 2S` donne `~0–2` plaquettes, mousquetons et cordelettes. Trois mousquetons
communs, indiqués sur une autre ligne, donnent `~3–5` mousquetons au total.
Les alternatives locales `ou`, `or`, `oder`, les quantités répétées et les
notations telles que `1AF (ou 2)` sont reconnues. La portée d’une alternative
complexe rédigée en prose peut rester imparfaitement interprétée.

Les compteurs affichent la quantité en premier, par exemple `~44 plaquettes`.
Chaque infobulle nomme le matériel en toutes lettres et indique qu’il est
estimé depuis les cases Ancrages, y compris les amarrages souples (AS).
La catégorie nommée « cordelettes » conserve les notations sources de sangles.

Le parseur indépendant de React se trouve dans `src/utils/anchorEquipment.js`.
Il lit uniquement la colonne des ancrages et utilise la langue de la feuille
pour les nombres écrits en lettres. Les abréviations internationales et les
termes reconnus ne dépendent pas de la langue de l’interface. Les unités de
longueur/diamètre ne sont pas converties en quantités de matériel.

Les systèmes non reconnus ou sans quantité exploitable restent indéterminés.
Un total partiel n’est pas un inventaire complet, ni un plafond garanti ; `~`
exprime cette incertitude sans ajouter d’avertissements à chaque ligne.
Les observations, qui peuvent répéter le matériel, ne sont pas additionnées.
Chaque feuille est calculée séparément ; les comparaisons de versions n’ont
pas de récapitulatif.

Les 82 cellules annotées de l’étude sont conservées avec leurs sources dans
`src/utils/__fixtures__/anchorEquipment.json` pour les tests de régression.
Les feuilles complètes, corpus et scripts exploratoires ne font pas partie
du dépôt. Des tests supplémentaires couvrent les règles métier, les relations
explicites et l’intégration du récapitulatif dans l’interface.
