# Organization types — frontend issue #1374

Source: https://github.com/GrottoCenter/grottocenter-front/issues/1374

API implementation: https://github.com/GrottoCenter/grottocenter-api/pull/1895

## Product decisions

- An organization has exactly one principal type, independent of its document
  roles, memberships, explored caves, partner status and managed territories.
- The UI requires an explicit valid type on creation **and on every organization
  edit**, including historical organizations with a null/missing type. Editing
  progressively classifies existing records. Never preselect SPELEOLOGY.
  Inline creation from a document's editor field defaults to EDITION; creation
  from its library field defaults to LIBRARY. Both remain editable. Author and
  geographic-association creation keep an explicit, initially empty choice.
- Associating an existing organization does not edit it and does not require
  classification. Creating an organization during that association does.
- Historical unclassified organizations remain readable with a generic icon.
  Display the translated type label on the organization detail page, in search
  results' Type column and in type selection/filter controls. Detail pages use
  “Type not specified” and “Unknown organization type” fallbacks; search tables
  use `-` without an icon for missing or unknown types. Search names stay plain;
  only the Type column has the type pictogram for known types. Document references,
  suggestions use pictograms without an extra type label. Map popups show the
  title without an icon, then a separate pictogram/type row for classified
  organizations, followed by the address when present.
- The organization page retains its generic heading icon. Country, founding
  year and partner status precede the type; the type is last, with its pictogram.
  Search type chips have text only (apart from the selected-state checkmark).
  Map pins retain their yellow body and share only the pictogram's foreground,
  rendered entirely white without secondary colors. UI icons keep their accents.
- SPELEOLOGY, CAVE_RESCUE and RESEARCH show members/caver counts, explored
  entrances/networks and the controls that populate those relations. Temporarily
  keep this club behavior for unclassified historical organizations (null,
  missing or empty type), including counts and joining. This fallback never
  assigns a type and does not relax mandatory classification when editing.
  Hide these sections for other classified and unknown nonempty types without
  deleting stored relations. Account joining also rejects unsupported types. Document author
  and publisher roles remain available independently of the principal type.
- The seven API values are SPELEOLOGY (Caving club), CAVE_RESCUE (Cave rescue),
  EDITION (Publisher), RESEARCH (Research organization), ADMINISTRATION
  (Administration), NATURE_CONSERVATION (Nature conservation), LIBRARY
  (Library / documentation centre).
- Permissions and multiple roles are outside this issue.

## API and deployment contract

- POST /organizations requires a valid non-null type in its JSON body.
- PUT /organizations/:id accepts a valid type. The API permits omission, but
  the frontend organization editor deliberately requires classification.
- Organization details, lists, quicksearch, geographic associations and embedded
  document references expose type; reduced deleted references may omit it.
- GET /geoloc/organizations returns SPELEOLOGY, CAVE_RESCUE and unclassified
  organizations. Other types can still have a location on their own detail page.
- Advanced search accepts filter.type as a value or array. Unclassified
  organizations match none of the selected types. Do not invent a null filter.
- The audit on 2026-10-16 confirmed the field in the public Swagger, organization
  details, country associations and quicksearch. However, advanced search with
  filter.type returned HTTP 400: “Could not find a filter field named `type` in
  the schema.” Before enabling the filter, verify the manual SQL migration,
  Typesense schema rebuild/resync and reconciliation documented by API PR #1895.
  This read-only observation is not proof that the deployment is complete.

## Lot 1 — shared vocabulary and read shapes (this implementation)

- Add one pure organization-type module under src/utils, with the allowed values,
  translation IDs, validation and null/unknown label fallbacks. Keep _type
  (entity family) distinct from type (organization classification).
- Add an independent simple organization PropTypes module, shared by document
  details/citations/forms, person references and geographic associations. Keep
  full organization/document types free of circular dependencies. Read shapes
  accept future type strings; form validation accepts only the known vocabulary.
- Translate the vocabulary, field label and validation message in all 15
  catalogues, synchronize with English and sort without a BOM.
- Add the shared RHF organization-type selector with a story. Custom SVG
  pictograms and their resolution map belong to lot 3; the existing generic
  organization icon remains the fallback until then.
- Verify unknown/null labels and actual invalid-to-valid form submission paths.

## Lot 2 — all creation and edit paths (this implementation)

### Main organization form

- Update EntitiesForm/Organization/{index,OrganizationFields,transformers}.
- Start creation and unclassified edits with an empty choice; prefill known
  types. Include type in POST and PUT payloads and in edit-value conversion.
- Validate on first blur and on submit with RHF. Focus the invalid field, keep
  submit available for validation, and disable writes during pending/offline
  states. No mutation, including a name update, before validation succeeds.
- Preserve data after API rejection, show structured errors, and allow retry.
- Save the name, language and organization fields in a single organization PUT.
  Creation and editing share the payload conversion and coordinate normalization;
  there is no separate name PATCH. Redirect only after the mutation succeeds.
- Validate optional email and URL formats through RHF, since the form uses
  `noValidate`; keep both fields optional.

### Inline document creation

- Update OrganizationAutoComplete/CreateNewOrganization, shared by the author
  section and editor/library autocompletes. Reuse the selector and known types.
- Keep the existing parent document form: do not nest another HTML form. The
  Create button runs the inline RHF submission without submitting the document.
- Send trimmed name plus type; return the complete created organization to the
  existing context/callback. Preserve input after errors, prevent duplicate
  pending/offline writes and reset the type for the next creation.

### Country, region and massif associations

- Update OrganizationAssociation/AssociationForm and the parent argument
  adapters, then useOrganizationAssociation's three creation/link mutations.
- Show and require the selector only when free text creates a new organization.
  Selecting an existing option links its ID without a POST or a type update.
- Pass organizationType through every adapter to the creation JSON body. Keep
  existing association endpoints, cache invalidation and success closing.
- Verify API failure does not close the form or discard its name/type.

### Acceptance checks

- Create and edit with each supported type; historical null/missing and unknown
  values cannot be resaved without a valid explicit selection.
- Invalid or missing type sends no organization/name/association request.
- Inline authors, editors and libraries use the shared creation behavior.
- Country, region and massif hooks send type on POST and use the returned ID
  for the subsequent link; a failed POST never sends the link request.
- Existing organizations can be associated without classification.
- Required errors, focus, backend rejection/correction/retry, pending/offline
  guards, name limits and all catalogue keys are covered by appropriate tests.

## Lot 3 — consistent organization presentation (implemented)

- Provide seven dedicated MUI-derived SVG assets: a house with one large
  helmeted caver for SPELEOLOGY, an open book for EDITION and a flask for RESEARCH (distinct
  from scientific observations). Center all seven foregrounds on the actual
  brown card bounds, excluding the shadow. Use one resolver
  and OrganizationIcon, with generic fallback for null, unknown and reduced
  deleted references. Pictograms beside names/labels are decorative for screen
  readers so they do not duplicate option/button accessible names.
- Organization/index and Details: generic heading icon, type last in the
  subheader with its icon, and yellow typed local-map marker.
- Gate membership, exploration statistics and edit controls by the three allowed
  types and the temporary unclassified fallback, while preserving independent
  authored/published document sections.
- Prefill EDITION/LIBRARY in inline document creation according to the field;
  reset back to the relevant default when reopening, and allow overriding it.
- entitiesList/EntitiesListItem.OrganizationCard: person memberships and
  Country/Region/Massif organization sections, including deleted redirects.
- CaveProperties.OrganizationProperty: exploring organizations on entrances and
  networks wherever returned. Do not infer membership or exploration permissions.
- DocumentDetails: corporate authors, editor and library. Preserve types through
  document parent inheritance, form context, pending moderation previews and
  citations' input data. No per-reference detail fetches.
- helpers/Entity and the actual autocomplete renderers: quicksearch, mixed
  authors, editor/library suggestions and geographic association suggestions.
  Reuse shared presentation without adding a new deprecated helper.
- Keep textual ISO 690 references and copy/export text free of pictograms.
  General menus, creation buttons, aggregate counters and partner logos keep
  their generic identity unless they display a specific typed organization.
- Add stories and tests for known/null/unknown/deleted presentation, desktop,
  mobile, keyboard access and translated accessible text.

## Lot 4 — search and results (implemented; API migration still required)

- Extract PersonSearch's chip selector into EntityTypeFilter and share it with
  OrganizationsSearch. Organization filters are single-select and default to
  All; changing a type immediately starts the search. Preserve person search's
  existing default (Cavers). Keep organization type choices free of pictograms.
- All omits type entirely, including geographic facet requests; do not send a
  null sentinel or filter unknown organizations out on the client. Clear/reset
  returns to All. Existing search params preserve filters for pagination/export.
- EntityTable/entitiesConfig: translated Type column with its pictogram on
  desktop and mobile; no type icon alongside the name. Type sorting is disabled
  until the search schema supports it. Hide caver counts for types without
  exploration capabilities.
- SearchResults/export: retain selected filters and stable type codes in exported
  data. Do not add client-only filtering of a paginated server result set.
- Verify ordinary searches, each type, All,
  combination with geography, clear-all, pagination, selection and exports.
- Rechecked on 2026-10-17: a LIBRARY filter still returns the Typesense missing
  type field error. All works without type; explicit type searches remain
  dependent on schema resync. Do not silently ignore a requested type filter.

## Lot 5 — map and invalidation (implemented)

- MapClusters/Markers, OrganizationMarker and OrganizationPopup: reuse the UI
  pictogram foreground, rendered entirely white, inside a yellow map pin for
  every known type, excluding its brown card, shadow and accent colors. Preserve the generic
  unclassified pin, common geometry/anchor, popup title, separate pictogram/type
  row and address text.
- useMarkers: support per-record icon factories and replace changed organization
  markers to refresh location, icon, popup and event closures. Preserve static
  entrance/network marker identities and the touch tooltip behavior.
- Replacement uses an explicit comparison callback supplied by the organization
  caller. The generic hook stores previous records only for opted-in callers.
- Resolve UI icons without loading raw SVGs. The map-only resolver extracts the
  foreground using XML parsing and caches each white symbol; artwork declares
  transparent map cutouts explicitly, independently of its UI accent colors.
- Keep a generic organization cluster at low zoom. actions/Map currently strips
  worldwide results down to coordinate pairs; no subtype clustering is needed.
- Refresh both tile data and worldwide organization coordinates on organization
  create/update/delete/restore. Discard old organization tile data (including
  off-screen duplicates); generation guards reject responses started before
  invalidation. Worldwide-coordinate requests also ignore superseded responses.
- Geographic inline creation refreshes caches as soon as POST succeeds, even
  when the subsequent geographic association PUT fails.
- Keep all located types visible on their own detail mini-map and support
  explicit organization popup targets.
- Extend mutation invalidation to affected embedded organization references in
  documents, persons, territories and searches; target cached domains/records
  rather than invalidating the entire QueryClient. Account for asynchronous
  search indexing; refetching cannot make an outbox job finish synchronously.
- Browser regression: same-ID club-to-rescue update, club-to-publisher removal,
  null-to-club transition, both zoom modes, navigation back, offline/reconnect,
  touch popup opening and no extra per-organization network calls.

## Lot 6 — history and final integration (follow-up)

- Verify organization snapshot responses expose type, then add a translated
  before/after display: GenericSnapshots currently only renders body/description.
- Preserve soft-delete, restore and merge-target selection behavior. Missing
  type on reduced deleted references must not prevent these flows.
- Organization version rollback is not implemented in RestoreSnapshot's switch;
  do not add it implicitly as part of type classification.
- Verify partner carousel, counts, geographic association links, memberships,
  explored-cave associations and recent changes retain their current semantics.
- Complete translations/stories, targeted unit and browser regressions, build,
  and full lint before a PR. Record commands actually run and any unavailable
  browser/deployment checks; never claim an unrun check passed.

## Delivery order

Implement lots 1 and 2 together to cover every organization POST and the editor.
Then deliver presentation, search (after its API prerequisite), map/invalidation,
and final history/integration checks. Lots 1–5 are implemented; lot 6 remains
follow-up scope, together with the server-side search migration.

## Lots 1–2 implementation verification

- Implemented on branch `feat/organization-types`, including classification on
  historical organization edits and all three creation mechanisms.
- 46 distinct targeted unit tests passed across the organization form/inline
  flows, association form/mutations, vocabulary and shared text input. Commands:
  `yarn.cmd test organizationTypeFlows organizationTypes AssociationForm.test useOrganizationAssociation.test InputText.test --maxWorkers=2`,
  then `yarn.cmd test organizationTypeFlows AssociationForm.test --maxWorkers=1`
  after adding the offline/pending checks. A concurrent run failed to start its
  workers under build load; the single-worker rerun passed without increasing
  test timeouts.
- `yarn.cmd e2e:run --spec cypress/e2e/organization-types.cy.js --browser electron`:
  2 tests passed (creation/retry and legacy edit). The inherited
  `ELECTRON_RUN_AS_NODE` variable was removed only in the command's process
  environment so Cypress could launch its headless browser.
- ESLint passed on modified/new lintable files without warnings. Full repository
  lint was not run; it remains a PR preparation check.
- `yarn.cmd build` passed. The build reported plugin timing diagnostics.
- Translation sync/sort checks passed: 11 keys in each of 15 UTF-8 catalogues,
  without BOM. `git diff --check` passed.
- No production API data was changed. Follow-up lots and the search deployment
  prerequisite remain as described above.

## Lots 3–5 implementation verification

The first delivery was verified below; the subsequent visual review supersedes
the initial name-icon layout and shared research icon.

- Targeted Vitest runs passed with one worker and the default test timeout:
  `yarn.cmd test organizationTypeFlows OrganizationPresentation.test OrganizationMarker.test useMarkers.test AssociationForm.test --maxWorkers=1`,
  `yarn.cmd test organizationTypes.test OrganizationsSearch.test mapTileCache.test organizationCache.test Map.test entitiesConfig.test DocumentDetails/index.test DocumentsList.test FormContent.test --maxWorkers=1`,
  then `yarn.cmd test organizationTypeFlows AssociationForm.test OrganizationsSearch.test Map.test useOrganizationAssociation.test --maxWorkers=1`
  after the final selector/association/race regressions. Together these cover
  134 distinct tests across 15 files (including the final organization-name
  renderer checks in `yarn.cmd test entitiesConfig.test --maxWorkers=1`).
- Coverage includes all seven type icons and generic fallbacks, the three
  exploration-capable types, document defaults and overrides, classification
  validation, All/type/keyboard-reset search, same-ID Leaflet marker updates,
  stale tile/coordinate responses, embedded references and geographic creation
  followed by a failed association.
- Browser regressions use mocked API responses; they do not prove the deployed
  Typesense migration is ready. Screenshots inspect detail-page adaptation,
  desktop/mobile type filters and detailed map pictograms. Actual geographic
  basemap imagery is outside these mocked checks.
- Cypress: 8 distinct tests passed with
  `yarn.cmd e2e:run --spec cypress/e2e/organization-type-presentation.cy.js,cypress/e2e/organization-types.cy.js --browser electron`.
  The presentation spec was rerun successfully after adding the table/card
  name-icon assertions. `ELECTRON_RUN_AS_NODE` was removed only in the child
  process environment.
- ESLint passed on modified/new lintable files, without warnings. Translation
  sorting and `node scripts/translations/sync-with-en.js --check` passed; this
  delivery reuses the existing translated vocabulary and adds no catalogue key.
- Final `yarn.cmd build` and `git diff --check` passed. Build output includes
  plugin timing diagnostics. No production data was modified and no commit or
  push was made for lots 3–5; the pre-existing staged Cypress change is preserved.
- Broader manual map acceptance scenarios listed above (touch, both zoom modes,
  offline/reconnect, navigation back) remain follow-up integration checks.

## Visual review corrections

- Search results now have a translated Type column with its icon; names remain
  plain in tables and cards. Search type chips contain no pictograms.
- Missing, empty or unknown search-result types use the table's standard `-`
  placeholder without an icon; explicit fallback labels remain on detail pages.
- The organization heading keeps its generic icon. Type and its icon appear
  last in the subheader after country, year and partner information.
- All seven symbols are centered using measured foreground and brown-card
  bounds, rather than the shadow-inclusive SVG viewport. New dedicated symbols:
  a house containing one large helmeted caver, an open book and a laboratory flask.
- Yellow map pins reuse the SVG foreground group only, with no brown card or
  shadow. Every map symbol is white, with no secondary color. The rescue icon is
  a white cross in an orange circle in the UI, and a white cross inside a white
  ring on the map. The raw SVG and UI URL share one type-to-icon mapping.
- `yarn.cmd test organizationTypes.test organizationTypeFlows OrganizationPresentation.test OrganizationsSearch.test entitiesConfig.test OrganizationMarker.test useMarkers.test --maxWorkers=1`:
  74 tests passed across seven files. Map tests check the yellow body and absence
  of the brown frame in the embedded foreground SVG.
- `yarn.cmd e2e:run --spec cypress/e2e/organization-type-presentation.cy.js --browser electron`:
  five tests passed, including icon placement, header order and mobile cards.
  Screenshots and the seven-icon gallery were visually inspected.
- Targeted ESLint and `yarn.cmd build` passed; no translation keys were added.
- Club/monochrome follow-up: `yarn.cmd test OrganizationMarker.test useMarkers.test organizationTypes.test --maxWorkers=1`
  passed 41 tests across three files; targeted ESLint passed. All seven map
  foregrounds are checked for white/transparent paints only. The house/caver
  design and every map pictogram were inspected at the real 30 px marker size.
  The presentation Cypress spec also passed again (five tests), with the actual
  Leaflet marker screenshot inspected after the redraw.
- Further club simplification: white foreground in both UI and map versions,
  a larger house, compact backpack placement, a connected neck and a narrow
  helmet band. The feet remain separate from the house outline. The
  simplified SVG was rendered and visually inspected at 35 px and in a 30 px pin.
- Popup follow-up: the title has no icon; a separate row contains the translated
  type and its pictogram for known types, then the address. The presentation
  Cypress spec passed all five tests with assertions on the opened Leaflet popup;
  targeted ESLint passed and the popup screenshot was visually inspected.
- Temporary legacy fallback: null, missing and empty types keep club behavior
  for page sections, exploration controls, caver counts and joining. Unknown
  nonempty types stay restricted and organization edits still require a valid
  explicit classification. `yarn.cmd test organizationTypes.test OrganizationPresentation.test organizationTypeFlows entitiesConfig.test --maxWorkers=1`
  passed 63 tests across four files; targeted ESLint and `git diff --check`
  passed. The Cypress null-type expectation was updated but this follow-up did
  not rerun the browser suite.
