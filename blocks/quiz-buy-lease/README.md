# quiz-buy-lease

Custom **quiz** block. Purpose: scored-quiz.

## Authoring (Document Authoring)

Model: `standalone`

Single block table. Content: First cell = row type. Image row: [picture]. Question rows: [q1..qN] | [question text] | [ul: one li per option] | [weights, e.g. '3, 1, -3'; empty = not scored]. Result rows: [Lease | Finance] | [condition; empty = default] | [rich content]. Products row: [Products] | [heading]. Product rows: [Product] | [condition] | [picture] | [title, description, Learn More link]. Lease if sum of weights > 0 else Finance; first matching result row of that outcome is shown; every matching product row is shown. Condition: comma-separated AND clauses 'qN = k', 'qN = k or m', 'Lease', 'Finance', 'Always'; empty = always.

## Supported variations

No variations.

## Universal Editor fields

N/A (Document Authoring project)

## Rows (first cell = row type, case-insensitive)

| Row | Cell 1 | Cell 2 | Cell 3 | Cell 4 |
| --- | --- | --- | --- | --- |
| Image (optional, once) | picture | | | |
| Question (one per step, in order) | `q1` … `qN` | question text | bulleted list, one item per option, in order | weights, one number per option, e.g. `3, 1, -3` (empty = not scored) |
| Result (any number) | `Lease` or `Finance` | condition (empty = default) | rich content (h2 `Quiz Results:`, h3, paragraphs with links) | |
| Products heading (optional, once) | `Products` | heading shown above the product cards | | |
| Product (any number) | `Product` | condition | picture | first paragraph in **bold** = card title, then description and a `Learn More` link |

Keep every cell, even when it is empty (for example the empty condition of a default result row).
The step counter reads "Question n of N", where N is the number of question rows.

## Scoring and rules

1. Score = sum of the weights of the chosen options (questions with an empty weights cell do not count).
2. Outcome = **Lease** if the score is greater than 0, otherwise **Finance** (a tie goes to Finance).
3. Result: the **first** `Lease`/`Finance` row of that outcome whose condition matches is shown, so put the default row (empty condition) last.
4. Products: **every** product row whose condition matches is shown, in authored order.

## Condition syntax

- Clauses are separated by commas and **all** of them must match (AND).
- `qN = k`: the answer to question qN is option k (options are numbered from 1).
- `qN = k or m`: the answer is option k or option m (`|` also works instead of `or`).
- `Lease` / `Finance`: the outcome is Lease or Finance.
- `Always`, or an empty cell: always true.
- Unrecognised clauses never match (the row is not shown).

Examples: `q1 = 3`, `Finance, q6 = 1 or 2`, `q7 = 2`, `Always`.

## Behaviour

- One question at a time, with radio buttons. Next stays disabled until an option is picked; the button reads "Submit" on the last question. Back is hidden on the first question and keeps earlier answers.
- On submit the quiz card and the default content that comes just before the block in the same section (the heading and intro) are hidden. The matching result and product cards are shown, the result is announced to screen readers, and the page scrolls to the result.
- Product cards sit in a carousel: 3 per slide from 900px wide, 1 per slide below. Dot buttons appear only when there is more than one slide.
- "Start over" resets every answer, brings back the intro and returns to question 1.
