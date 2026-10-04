# embed-app

Custom **embed** block. Purpose: embedded-third-party-application.

## Authoring (Document Authoring)

Model: `standalone`

Single block table. Content: Row 1 (one cell): link whose href is the application start URL; the link text is the accessible iframe title (e.g. "Apply for Credit application"). Optional row: method | POST or GET (default POST). Optional row: height | CSS length such as 51em or 816px (default 51em). The block is replaced by a borderless 100%-wide iframe when it nears the viewport; for POST a hidden form targeting the iframe is submitted once, for GET the iframe src is set. A loading indicator shows until the frame loads; the link stays as a fallback if JavaScript does not run.

## Supported variations

No variations.

## Universal Editor fields

N/A (Document Authoring project)

## Authored table

| Embed App | |
| --- | --- |
| [Apply for Credit application](https://apigateway.toyotafinancial.com/ocainboundservices/oca/services/prefilldata?sourceIdentifier=Toyota&channelId=TFS&tier=T2&...) | |
| method | POST |
| height | 51em |

| Row | Cells | Required | Meaning |
| --- | --- | --- | --- |
| Link | 1 cell: a link | yes | `href` = absolute `http(s)` application start URL (query string is kept). Link text = accessible title of the frame. If JavaScript does not run, this link is what visitors see. |
| `method` | `method` \| `POST` or `GET` | no (default `POST`) | `POST`: a hidden, field-less form targeting the frame is submitted once. `GET`: the frame `src` is set to the URL. |
| `height` | `height` \| CSS length | no (default `51em`) | Frame height. Accepts `px`, `em`, `rem`, `vh`/`svh`/`dvh`/`lvh`, or a bare number (treated as `px`). Invalid values fall back to the default. |

## Behaviour

- The frame is created when the block comes within 200px of the viewport (immediately when above the fold, or when `IntersectionObserver` is unavailable). Until then the authored link is kept and the frame height is reserved.
- Each block gets a unique frame name (`embed-app-1`, `embed-app-2`, ...), so several blocks can appear on one page.
- The frame is 100% of the content width at every breakpoint, borderless, and not sandboxed (`allow="clipboard-read; clipboard-write; fullscreen; payment"`).
- A loading indicator shows until the frame's `load` event fires for the application document (cleared after 20s at the latest).
- Only `http:`/`https:` URLs are accepted; any other link leaves the block as authored.
