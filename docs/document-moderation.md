# Document moderation results

The moderation endpoint returns an array of `{ id, status, reason }` results.
HTTP 200 and 207 are both business responses, not batch-wide success signals.
The UI matches each result to the submitted IDs and computes one notification
from those results, independently of subsequent selection changes.

`validated`, `rejected`, `auto_rejected` and `not_found` are terminal: remove
only those IDs from the current selection and close only their preview.
`error` keeps the selection, preview, submitted action and comment. Missing,
malformed, duplicate or unknown results become a local `indeterminate` result
and receive the same preservation behavior. Unsubmitted IDs are ignored.

Anomaly details remain on the moderation page after refresh or preview closure.
They include the ID, the title captured at submission when available, the
status and reason. Auto-rejection reasons are plain text; processing errors
use translated generic messages rather than technical server reasons.

Business responses, including partial results, invalidate the pending count,
document queries and the entrance, massif, organization and person domains
that embed documents. Transport failures do not establish a business outcome.
Moderation mutations never retry automatically, including after reconnect.
Manual retries are not guaranteed safe until attachment processing is atomic
on the API.

Document details distinguish a pending submission (`isValidated: false` with
an explicitly null `dateValidation`) from a refused submission (false with a
valid decision date). The existing notice shows the refusal, plain-text comment
when available and localized decision date. Accepted versions show no notice,
including after a proposed modification was refused. Missing or invalid metadata
does not establish a moderation state. Notice visibility still follows the
existing authenticated, non-preview detail view. This relies on the API's
creation-versus-modification rejection contract described in API issue #1907.

Coverage lives in the `useProcessDocuments` tests, `documentProcessResults.test.js`,
the `DocumentValidation` and `DocumentDetails` component tests,
`document-moderation.cy.js` and `document-moderation-notice.cy.js`.
