# Temporary organization cleanup

This moderator tool replaces the obsolete classification tab. It lets a moderator
manually correct a person recorded as an organization of type `OTHER`, without
changing the API. Real collective organizations must remain organizations.

## Approved interface

Keep the existing Grottocenter theme, page header, tabs and organization preview.
Each row shows authored documents, published documents, explored caves and
members. Desktop rows align the counts and action; mobile rows stack them.
Known blockers appear beside a disabled action. The global document check runs
once at page level, with progress and explicit errors. Its timestamp and an
explicit refresh action remain visible. The dialog only checks its organization
and the documents concerned.

The shared `StandardDialog` contains a name search, person type and authored
document count, an explicit single-person choice, and separate author creation.
Under the new-author button, shortcuts select the existing anonymous author
`Unknown` (person ID `33`) or `Auteurs multiples` (person ID `41378`). They load the full person and
authored count before selection, with an inline error and retry on failure;
they never create a person or start the transfer.
The active shortcut is marked as selected. A highlighted summary immediately
above confirmation names the selected destination, its ID and document count.
Creation saves immediately, even if the moderator subsequently closes the dialog.
The new author is selected automatically; search and other choices disappear.
The final checkbox explains coauthor preservation, deduplication and archiving.
Mobile uses the shared fullscreen dialog and stacked footer actions.

## Conversion protocol

- Block publication, membership, exploration, cave partnerships, geographic
  management, official partnership and library holdings.
- Scan the entire document trash and moderation queue, including proposed
  relations, once per cleanup session. Related deleted or pending documents block
  conversion; they are never restored or validated by this tool. Keep a compact
  index of counts per organization in a dedicated static query, scoped to the
  API and moderator account. Session storage preserves it across navigation and
  page reloads in the same browser tab.
- Only the explicit global-refresh action replaces that index. Entity mutations,
  dialog reopening and final verification never restart a global scan. Refresh
  blocks new conversions while running; a failed refresh also blocks them and
  removes the persisted old snapshot. No partial analysis is published.
- Search authored documents using the current organization name, then verify
  organization IDs and reconcile the result with the uncapped database count.
  An incomplete result, including an unindexed refused submission, blocks work.
  Library checks use the existing search endpoint and verify the organization ID.
- Read every source document before starting, and require a validated state.
  Transfer `authors` and `authorsOrganization` through the existing JSON update
  endpoint, with a fresh `dateReviewed` as the ordinary document update does.
  The API history trigger inserts a snapshot keyed on the incoming review date;
  reusing an imported document's date can collide with an existing snapshot.
  Preserve other authors and organizations; deduplicate the destination person.
  Read back every transfer. Errors retain the document link and HTTP status.
- Persist the plan and checkpoints in local storage, scoped to the API and
  moderator account. One unfinished conversion locks the destination person and
  blocks starting another conversion in this browser. Reconcile uncertain
  responses against actual document relations before retrying.
- Recheck the organization, library holdings and all transferred documents before
  soft deletion, reusing the session index for deleted and pending documents.
  A checkpoint written before deletion lets a resumed run recognize an archive
  whose success response was lost, without sending another delete.

There is no transaction across requests or server-side lock. Concurrent changes
or failures stop the run with its completed transfers retained. The global index
can become outdated until explicitly refreshed; its timestamp and this limitation
are shown in the interface. Search indexing is eventually consistent. Restoring
the organization does not reverse transfers.

## Verification and removal

Protocol, recovery and UI tests are colocated here. Browser scenarios are in
`cypress/e2e/organization-author-conversion.cy.js`; the existing duplicate tests
cover the other tab.

To remove this tool, delete this directory and its Cypress spec, remove the
`AuthorConversion` integration in the parent page, remove the `other` and
`conversionAudit` management query keys, remove
`organizationConversionSessionKeys`, and remove the
`organizationConversion.*` translations. No conversion behavior was added to
shared entity components, hooks or API endpoints.
