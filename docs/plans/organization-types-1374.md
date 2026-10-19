# Organization types — frontend issue #1374

Source: https://github.com/GrottoCenter/grottocenter-front/issues/1374

API implementation: https://github.com/GrottoCenter/grottocenter-api/pull/1895

## Product decisions

- An organization has exactly one principal type, independent of its document
  roles, memberships, explored caves, partner status and managed territories.
- The UI requires an explicit valid type on creation **and on every organization
  edit**, including historical organizations with a null/missing type. Editing
  progressively classifies existing records. Never preselect SPELEOLOGY or infer
  a type from the context (publisher, library, author or geographic association).
- Associating an existing organization does not edit it and does not require
  classification. Creating an organization during that association does.
- Historical unclassified organizations remain readable, with a generic icon
  and a translated “Type not specified” label. Unknown future API values also
  remain readable, with a generic icon and “Unknown organization type”. Neither
  fallback is an option that can be saved.
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

## Lot 3 — consistent organization presentation (follow-up)

- Create seven SVG pictograms using the existing icon specification and
  create-icon skill. Add one resolver and a compact reusable label/badge, with
  generic fallback for null, unknown and deleted reduced references.
- Organization/index and Details: header type, icon and local-map marker.
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

## Lot 4 — search and results (follow-up, deployment prerequisite)

- OrganizationsSearch: multi-select filter.type, translated chips, reset,
  pagination and submitted filter preservation. SearchOrganizationForm reuses it.
- SearchElements.ActiveFilterChips/countActiveFilters: distinguish categorical
  arrays from numeric ranges and ignore empty selections without regressing
  existing range filters.
- EntityTable/entitiesConfig: per-row icon and a translated Type column on
  desktop and mobile. Enable sorting only after checking API schema support.
- SearchResults/export: retain selected filters and stable type codes in exported
  data. Do not add client-only filtering of a paginated server result set.
- Verify ordinary searches, each type, multiple types, empty selection,
  combination with geography, clear-all, pagination, selection and exports.
- Enable only once a real API type-filter request succeeds after the required
  Typesense resync. A null-only dataset is not evidence that filtering works.

## Lot 5 — map and invalidation (follow-up)

- MapClusters/Markers, OrganizationMarker and OrganizationPopup: distinct club
  and rescue pictograms, generic unclassified marker, translated popup/tooltips.
- useMarkers: support per-record icons and update existing marker icons/content
  when the same ID changes type, without regressing entrance/network handlers.
- Keep a generic organization cluster at low zoom. actions/Map currently strips
  worldwide results down to coordinate pairs; no subtype clustering is needed.
- Refresh both tile data and worldwide organization coordinates after changes
  that alter map eligibility. Current tile invalidation does not refresh the
  separate organizationsCoordinates slice.
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
and final history/integration checks. This change implements only lots 1 and 2;
later lots remain an explicit follow-up scope.

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
