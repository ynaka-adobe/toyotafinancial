# tabs-plans

Custom **tabs** block. Purpose: grouped-section-tabs.

## Authoring (Document Authoring)

Model: `standalone`

Single block table. Content: Block: 1 row, 1 cell = dropdown label. Followed by N sections, each ending with Section Metadata { Tab Group: <dropdown option>, Tab: <tab label> }; each section is one panel and may contain default content and other blocks (table-caption, columns-callout, accordion-faq). The block builds a <select> of distinct Tab Group values and a tab bar per group; first group/first tab active on load.

## Supported variations

No variations.

## Universal Editor fields

N/A (Document Authoring project)

## Section-based authoring model (exact)

Tab panels cannot live inside the block table (blocks cannot nest), so each panel is its own section.

1. In the section that introduces the tabs, after any default content (e.g. the h3 intro), add the block:

   | Tabs Plans |
   | --- |
   | Please select the description that best describes you |

   The single cell is the dropdown label. It is only shown when there is more than one Tab Group.

2. Directly after that section, add one section per tab panel. Each panel section holds its normal
   default content and blocks (e.g. Table Caption, Columns Callout, an h2 + Accordion FAQ,
   disclaimers) and ends with a Section Metadata block:

   | Section Metadata | |
   | --- | --- |
   | Tab Group | Vehicles model year 2026 and older |
   | Tab | ToyotaCare Plus |

   - `Tab` (required): the tab label. A section without `Tab` ends the tab set; sections after it
     render normally.
   - `Tab Group` (optional): the dropdown option the tab belongs to. Distinct values, in authored
     order, become the dropdown options; tabs keep their authored order within each group. Omit it
     on every panel for a plain tab bar with no dropdown.
   - Panel sections must be consecutive and immediately follow the block's section.

3. Fallback: rows with two cells inside the block (`tab label | panel content`) are also accepted
   as a single group, like the boilerplate Tabs block, for simple text-only panels.

Behaviour: the first group and its first tab are shown on load; clicking a tab swaps panels in place
(no URL change); Left/Right/Home/End move between tabs (roving tabindex); the dropdown swaps groups.
