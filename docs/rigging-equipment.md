# Equipment estimates for a rigging sheet

Each sheet's summary displays estimated bolt hangers, carabiners, expansion
bolts, soft anchors and accessory cords beside the rope total. Categories with
no recognized quantity are hidden. Every quantity carries `~`; alternatives
produce a minimum–maximum range per category, summed across anchor cells.
Different categories' bounds do not necessarily describe the same alternative.

Conversions for one anchor:

| Notation | Equipment contribution |
| --- | --- |
| S / spit | 1 bolt hanger + 1 carabiner |
| B / broche / glue-in bolt | 1 carabiner |
| G / goujon / expansion bolt / EB | 1 expansion bolt + 1 bolt hanger + 1 carabiner |
| P / piton | 1 carabiner |
| AS / SA / soft anchor | 1 soft anchor |
| AF / DA / drilled anchor, AN / NA / natural anchor | 1 accessory cord |
| dev / redir / redirect | 1 accessory cord + 1 carabiner |
| dev/S | 1 bolt hanger + 1 accessory cord + 1 carabiner |
| dev/G | 1 expansion bolt + 1 bolt hanger + 1 accessory cord + 1 carabiner |

Explicit material quantities are added. A direct relationship such as
`4 mousquetons sur 4 broches` avoids counting the same connectors twice;
`3 mousquetons / 1 DEVIA` still adds up to four carabiners. Without an explicit
link, `2S + 2 plaquettes` remains additive and is flagged as partial because
the hangers may overlap. The same applies to hangers beside G/EB.
Optional points are included: `3 Spits (1 facultatif)` counts three,
while `3S (+1S facultatif)` counts four. Deviations are paired with their support
only within a local expression, never across separate lines.

`2AF ou 2S` contributes `~0–2` hangers, carabiners and accessory cords.
Three additional carabiners in another cell give `~3–5` carabiners overall.
Local alternatives (`ou`, `or`, `oder`), repeated quantities and expressions
such as `1AF (ou 2)` are recognized. Complex alternatives written in prose may
still be interpreted incompletely.

Counts display the quantity first, e.g. `~44 plaquettes` in French. Translated
labels use the maximum count to choose their grammatical number, including
ranges such as `~0–1 bolt hanger`. Each tooltip spells out the material and
explains that it is estimated from the Anchors cells. The approximate marker
also covers partial or unknown descriptions; there is no extra warning text.
The accessory cord category retains source
mentions of slings; its French label is “cordelettes”.

The React-independent parser lives in `src/utils/anchorEquipment.js`.
It reads only the anchor column, using the sheet language for spelled-out
numbers. International abbreviations and recognized material names work
independently of the interface language. Dimensions do not count as equipment
quantities. Plural material names without a quantity contribute nothing.
The known misspelling `devintion` is deliberately treated as `dev`.

Unsupported systems or unusable quantities remain unknown. A partial total is
neither a complete inventory nor a guaranteed upper bound; every count retains
`~`, even when all notation is recognized. Individual quantities outside the
safe integer range are ignored; sums saturate at `Number.MAX_SAFE_INTEGER`.
Cell-level `status` is a regression diagnostic rather than a UI flag.
Observations are excluded because they may repeat
the inventory. Each sheet is calculated independently and memoized by its
obstacles and language; version comparisons have no summary.

Annotated anchor-cell excerpts and their source URLs are retained in
`src/utils/__fixtures__/anchorEquipment.json` for offline regression tests.
Full sheets, corpora and exploratory scripts are outside the repository.
Additional tests cover the business rules, explicit relationships, localized
summaries, approximate markers and browser integration. Fast-check
properties exercise Unicode, emoji, line breaks, gigantic quantities and nested
alternatives: parsing never throws, bounds remain ordered nonnegative safe
integers, and sheet totals equal the component-wise sums of cell results
(saturated only at the safe integer limit).
