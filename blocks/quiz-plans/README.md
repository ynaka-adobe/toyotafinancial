# quiz-plans

Custom **quiz** block. Purpose: branching-quiz.

## Authoring (Document Authoring)

Model: `standalone`

Single block table. Content: Row 1: [picture]. Question rows: [id e.g. q1] | [question text] | [ul: each li = answer text as a link to '#<next id>']. Result rows: [id e.g. a4a] | [Result] | [ul: each li = h3/strong link to product page + p description]. First question row is the start; 'Question n of N'; Next disabled until an answer is chosen; Back supported.

## Supported variations

No variations.

## Universal Editor fields

N/A (Document Authoring project)

## Authoring model (exact)

| Quiz Plans | | |
| --- | --- | --- |
| (picture) | | |
| q1 | How far along are you in the buying process? | - [I'm still shopping for a Toyota.](#q2a)<br>- [I recently purchased or leased a Toyota.](#q2b) |
| q2a | ... | - [answer](#q3a) ... |
| a4a | Result | - **[Product name](https://www.toyotafinancial.com/...)** + description paragraph, one li per product |

- Image row: one cell with the card photo (optional).
- Question row: `id | question text | list of answers`. Each answer is a list item whose link points
  to `#<id>` of the next question or of a result. The answer label is the list item text.
- Result row: `id | Result | rich content` (the literal word `Result` in the second cell).
- The first question row is the start step. Ids are case-insensitive and may be written with or
  without `#`. An answer whose link is a normal URL (no hash) navigates there on Next.
- "Question n of N" counts the steps taken; N is the longest question chain from the start.
- Next is disabled until an answer is chosen; Back returns to the previous step with the answer kept;
  the result screen is announced via an aria-live status and offers Back and Start over.
